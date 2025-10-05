'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

export interface ImportResult {
  success: boolean
  message: string
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: string[]
}

export interface ProductImportData {
  name: string
  sku?: string
  price: number
  description?: string
  category?: string
  stock_quantity?: number
  is_active?: boolean
  tags?: string[]
}

export async function importProducts(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const updateExisting = formData.get('updateExisting') === 'true'
    const createCategories = formData.get('createCategories') === 'true'

    if (!file) {
      return { success: false, error: 'Dosya bulunamadı' }
    }

    // Parse file
    const data = await parseImportFile(file)
    if (!data || data.length === 0) {
      return { success: false, error: 'Dosyada geçerli veri bulunamadı' }
    }

    const supabase = await createAdminSupabaseClient()
    const results: ImportResult = {
      success: true,
      message: '',
      totalProcessed: data.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    }

    // Get existing categories
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name, slug')

    const categoryMap = new Map(existingCategories?.map(cat => [cat.name.toLowerCase(), cat.id]) || [])

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        // Validate required fields
        if (!row.name || !row.price) {
          results.errors.push(`Satır ${i + 1}: Ürün adı ve fiyat zorunludur`)
          results.errorCount++
          continue
        }

        // Handle category
        let categoryId: string | null = null
        if (row.category) {
          const categoryName = row.category.trim()
          const existingCategoryId = categoryMap.get(categoryName.toLowerCase())
          
          if (existingCategoryId) {
            categoryId = existingCategoryId
          } else if (createCategories) {
            // Create new category
            const slug = createSlug(categoryName)
            const { data: newCategory, error: categoryError } = await supabase
              .from('categories')
              .insert({
                name: categoryName,
                slug,
                is_active: true,
                display_order: 0
              })
              .select('id')
              .single()

            if (categoryError) {
              results.errors.push(`Satır ${i + 1}: Kategori oluşturulamadı: ${categoryError.message}`)
              results.errorCount++
              continue
            }
            
            categoryId = newCategory.id
            categoryMap.set(categoryName.toLowerCase(), categoryId)
          }
        }

        // Generate SKU if not provided
        const sku = row.sku || generateSKU(row.name, i)

        // Check if product exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', sku)
          .single()

        const productData = {
          name: row.name,
          slug: createSlug(row.name),
          sku,
          price: parseFloat(row.price),
          description: row.description || '',
          stock_quantity: parseInt(row.stock_quantity) || 0,
          category_id: categoryId,
          is_active: row.is_active !== false,
          is_featured: false,
          tags: row.tags || []
        }

        if (existingProduct && updateExisting) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id)

          if (updateError) {
            results.errors.push(`Satır ${i + 1}: Ürün güncellenemedi: ${updateError.message}`)
            results.errorCount++
          } else {
            results.successCount++
          }
        } else if (!existingProduct) {
          // Create new product
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData)

          if (insertError) {
            results.errors.push(`Satır ${i + 1}: Ürün oluşturulamadı: ${insertError.message}`)
            results.errorCount++
          } else {
            results.successCount++
          }
        } else {
          // SKU already exists and updateExisting is false
          results.errors.push(`Satır ${i + 1}: SKU "${sku}" zaten mevcut`)
          results.errorCount++
        }
      } catch (error) {
        results.errors.push(`Satır ${i + 1}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
        results.errorCount++
      }
    }

    results.success = results.errorCount < results.totalProcessed
    results.message = `${results.successCount} ürün başarıyla işlendi, ${results.errorCount} hata`

    if (results.successCount > 0) {
      revalidatePath('/admin/urunler')
    }

    return { success: true, result: results }
  } catch (error) {
    console.error('Import error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Import sırasında hata oluştu' 
    }
  }
}

async function parseImportFile(file: File): Promise<ProductImportData[]> {
  const arrayBuffer = await file.arrayBuffer()
  
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    // Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet, { raw: false })
  } else if (file.name.endsWith('.csv')) {
    // CSV file
    const text = new TextDecoder().decode(arrayBuffer)
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: Record<string, string>[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      data.push(row)
    }
    
    return data
  } else {
    throw new Error('Desteklenmeyen dosya formatı. Excel (.xlsx) veya CSV (.csv) dosyası yükleyin.')
  }
}

function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

function generateSKU(productName: string, index: number): string {
  const cleanName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 6)
  
  return `${cleanName}${String(index + 1).padStart(4, '0')}`
} 

export async function importProductsEnhanced(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const fieldMappingsStr = formData.get('fieldMappings') as string
    const importOptionsStr = formData.get('importOptions') as string

    if (!file) {
      return { success: false, error: 'Dosya bulunamadı' }
    }

    if (!fieldMappingsStr) {
      return { success: false, error: 'Alan eşleştirmeleri bulunamadı' }
    }

    const fieldMappings = JSON.parse(fieldMappingsStr) as Record<string, string>
    const importOptions = importOptionsStr ? JSON.parse(importOptionsStr) : {
      updateExisting: false,
      createCategories: true,
      skipImages: false
    }

    // Analiz edilmiş veriyi al
    const analysisDataStr = formData.get('analysisData') as string
    if (!analysisDataStr) {
      return { success: false, error: 'Analiz edilmiş veri bulunamadı' }
    }

    const analysisResult = JSON.parse(analysisDataStr)
    if (!analysisResult || !analysisResult.sampleData || analysisResult.sampleData.length === 0) {
      return { success: false, error: 'Dosyada geçerli veri bulunamadı' }
    }

    // Alan eşleştirmelerini validasyondan geçir
    const { columnAnalyzerService } = await import('@/services/admin/column-analyzer-service')
    const validationErrors = columnAnalyzerService.validateRequiredFields(fieldMappings)
    if (validationErrors.length > 0) {
      return { 
        success: false, 
        error: `Zorunlu alanlar eksik: ${validationErrors.join(', ')}` 
      }
    }

    const supabase = await createAdminSupabaseClient()
    const results: ImportResult = {
      success: true,
      message: '',
      totalProcessed: analysisResult.sampleData.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    }

    // Mevcut kategorileri al
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name, slug')

    const categoryMap = new Map(existingCategories?.map(cat => [cat.name.toLowerCase(), cat.id]) || [])

    // Mevcut ürünleri al (SKU kontrolü için)
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, sku')

    const productSkuMap = new Map(existingProducts?.map(prod => [prod.sku, prod.id]) || [])

    // Alan eşleştirmelerini ters çevir (field -> column mapping)
    const reverseMapping: Record<string, string> = {}
    Object.entries(fieldMappings).forEach(([column, field]) => {
      if (field) {
        reverseMapping[field] = column
      }
    })

    // Her satırı işle (analysisResult.sampleData tüm veriyi içeriyor)
    for (let i = 0; i < analysisResult.sampleData.length; i++) {
      const row = analysisResult.sampleData[i] || {}
      const rowNumber = i + 1

      try {
        // Zorunlu alanları kontrol et
        const name = row[reverseMapping['name']]?.trim()
        const priceStr = row[reverseMapping['price']]?.toString().trim()
        const stockStr = row[reverseMapping['stock_quantity']]?.toString().trim()
        const imagesStr = row[reverseMapping['images']]?.toString().trim()

        if (!name) {
          results.errors.push(`Satır ${rowNumber}: Ürün adı boş`)
          results.errorCount++
          continue
        }

        const price = parseFloat(priceStr?.replace(',', '.') || '0')
        if (isNaN(price) || price <= 0) {
          results.errors.push(`Satır ${rowNumber}: Geçersiz fiyat: ${priceStr}`)
          results.errorCount++
          continue
        }

        const stockQuantity = parseInt(stockStr || '0')
        if (isNaN(stockQuantity)) {
          results.errors.push(`Satır ${rowNumber}: Geçersiz stok miktarı: ${stockStr}`)
          results.errorCount++
          continue
        }

        if (!imagesStr && !importOptions.skipImages) {
          results.errors.push(`Satır ${rowNumber}: Görsel URL'si boş`)
          results.errorCount++
          continue
        }

        // Kategori işleme
        let categoryId: string | null = null
        if (reverseMapping['category']) {
          const categoryName = row[reverseMapping['category']]?.toString().trim()
          if (categoryName) {
            const existingCategoryId = categoryMap.get(categoryName.toLowerCase())
            
            if (existingCategoryId) {
              categoryId = existingCategoryId
            } else if (importOptions.createCategories) {
              // Yeni kategori oluştur
              const slug = createSlug(categoryName)
              const { data: newCategory, error: categoryError } = await supabase
                .from('categories')
                .insert({
                  name: categoryName,
                  slug,
                  is_active: true,
                  display_order: 0
                })
                .select('id')
                .single()

              if (categoryError) {
                results.errors.push(`Satır ${rowNumber}: Kategori oluşturulamadı: ${categoryError.message}`)
                results.errorCount++
                continue
              }
              
              categoryId = newCategory.id
              categoryMap.set(categoryName.toLowerCase(), categoryId)
            }
          }
        }

        // SKU oluştur/al
        let sku = ''
        if (reverseMapping['sku']) {
          sku = row[reverseMapping['sku']]?.toString().trim() || ''
        }
        if (!sku) {
          sku = generateSKU(name, i)
        }

        // Mevcut ürün kontrolü
        const existingProductId = productSkuMap.get(sku)
        
        if (existingProductId && !importOptions.updateExisting) {
          results.errors.push(`Satır ${rowNumber}: SKU "${sku}" zaten mevcut`)
          results.errorCount++
          continue
        }

        // Görselleri işle
        let images: string[] = []
        if (!importOptions.skipImages && imagesStr) {
          images = imagesStr.split(',').map((url: string) => url.trim()).filter(Boolean)
        }

        // Ürün verisini hazırla
        const productData: any = {
          name,
          slug: createSlug(name),
          sku,
          price,
          stock_quantity: stockQuantity,
          category_id: categoryId,
          is_active: true,
          is_featured: false
        }

        // Opsiyonel alanları ekle
        if (reverseMapping['description']) {
          productData.description = row[reverseMapping['description']]?.toString().trim() || ''
        }
        if (reverseMapping['short_description']) {
          productData.short_description = row[reverseMapping['short_description']]?.toString().trim() || ''
        }
        if (reverseMapping['compare_price']) {
          const comparePriceStr = row[reverseMapping['compare_price']]?.toString().trim()
          if (comparePriceStr) {
            const comparePrice = parseFloat(comparePriceStr.replace(',', '.'))
            if (!isNaN(comparePrice) && comparePrice > 0) {
              productData.compare_price = comparePrice
            }
          }
        }
        if (reverseMapping['cost_price']) {
          const costPriceStr = row[reverseMapping['cost_price']]?.toString().trim()
          if (costPriceStr) {
            const costPrice = parseFloat(costPriceStr.replace(',', '.'))
            if (!isNaN(costPrice) && costPrice > 0) {
              productData.cost_price = costPrice
            }
          }
        }
        if (reverseMapping['barcode']) {
          productData.barcode = row[reverseMapping['barcode']]?.toString().trim() || null
        }
        if (reverseMapping['weight']) {
          const weightStr = row[reverseMapping['weight']]?.toString().trim()
          if (weightStr) {
            const weight = parseFloat(weightStr.replace(',', '.'))
            if (!isNaN(weight) && weight > 0) {
              productData.weight = weight
            }
          }
        }
        if (reverseMapping['dimensions']) {
          productData.dimensions = row[reverseMapping['dimensions']]?.toString().trim() || null
        }
        if (reverseMapping['tags']) {
          const tagsStr = row[reverseMapping['tags']]?.toString().trim()
          if (tagsStr) {
            productData.tags = tagsStr.split(',').map((tag: string) => tag.trim()).filter(Boolean)
          }
        }
        if (reverseMapping['is_active']) {
          const isActiveStr = row[reverseMapping['is_active']]?.toString().toLowerCase().trim()
          if (isActiveStr) {
            productData.is_active = ['true', '1', 'evet', 'yes'].includes(isActiveStr)
          }
        }
        if (reverseMapping['is_featured']) {
          const isFeaturedStr = row[reverseMapping['is_featured']]?.toString().toLowerCase().trim()
          if (isFeaturedStr) {
            productData.is_featured = ['true', '1', 'evet', 'yes'].includes(isFeaturedStr)
          }
        }

        // Görselleri ekle
        if (images.length > 0) {
          productData.images = images
        }

        // Ürünü kaydet
        if (existingProductId && importOptions.updateExisting) {
          // Mevcut ürünü güncelle
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProductId)

          if (updateError) {
            results.errors.push(`Satır ${rowNumber}: Ürün güncellenemedi: ${updateError.message}`)
            results.errorCount++
          } else {
            results.successCount++
          }
        } else {
          // Yeni ürün oluştur
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData)

          if (insertError) {
            results.errors.push(`Satır ${rowNumber}: Ürün oluşturulamadı: ${insertError.message}`)
            results.errorCount++
          } else {
            results.successCount++
            // SKU map'i güncelle
            productSkuMap.set(sku, 'new')
          }
        }

      } catch (error) {
        results.errors.push(`Satır ${rowNumber}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
        results.errorCount++
      }
    }

    results.success = results.errorCount < results.totalProcessed
    results.message = `${results.successCount} ürün başarıyla işlendi, ${results.errorCount} hata`

    if (results.successCount > 0) {
      revalidatePath('/admin/urunler')
    }

    return { success: true, result: results }

  } catch (error) {
    console.error('Enhanced import error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'İçe aktarma işlemi başarısız' 
    }
  }
} 