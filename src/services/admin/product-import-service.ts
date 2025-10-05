'use client'

import { Product, ProductFormData, Category, ProductSpecifications, ProductDimensions } from '@/types/admin/product'
import { productService } from './product-service'
import { categoryService } from './category-service'
import * as XLSX from 'xlsx'

// IMPROVED TYPE DEFINITIONS
export type FieldMappingValue = string | number | boolean | null | undefined

export interface RawRowData {
  [key: string]: string | number | boolean | null | undefined
}

export interface TransformedProductData {
  name: string
  price: number
  stock: number
  description?: string
  short_description?: string
  compare_price?: number
  cost_price?: number
  sku?: string
  barcode?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  category?: string
  categories?: string[]
  tags?: string
  parsedTags?: string[]
  status?: string
  brand?: string
  meta_title?: string
  meta_description?: string
  image_url?: string
  specifications?: ProductSpecifications
  dimensions?: ProductDimensions
  [key: string]: unknown // For dynamic fields during transformation
}

// Field mapping types
export interface FieldMapping {
  sourceField: string  // Excel/CSV'deki sütun adı
  targetField: string  // Sistemdeki alan adı
  required: boolean
  defaultValue?: FieldMappingValue
}

export interface MappingOptions {
  fieldMappings: FieldMapping[]
  updateExisting: boolean
  createCategories: boolean
  skipErrors: boolean
}

export interface ParsedFile {
  headers: string[]
  data: RawRowData[]
  fileName: string
  fileType: 'csv' | 'excel' | 'xml'
  totalRows: number
}

export interface ImportOptions {
  updateExisting: boolean
  createCategories: boolean
  skipImages: boolean
  dryRun: boolean
}

export interface ImportResult {
  success: boolean
  message: string
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: ImportError[]
  preview?: ProductPreview[]
}

export interface ImportError {
  row: number
  field?: string
  message: string
  data?: RawRowData
}

export interface ProductPreview {
  rowNumber: number
  action: 'create' | 'update' | 'skip'
  name: string
  sku?: string
  price?: number
  stock?: number
  category?: string
  status: string
  errors: string[]
  warnings: string[]
  mappedData: TransformedProductData
}

// Zorunlu ve seçenekli alanlar tanımı
export const REQUIRED_FIELDS = [
  { key: 'name', label: 'Ürün Adı', type: 'text' },
  { key: 'stock', label: 'Stok Adedi', type: 'number' },
  { key: 'price', label: 'Fiyat', type: 'number' }
] as const

export const OPTIONAL_FIELDS = [
  { key: 'category', label: 'Kategori (+ ile çoklu)', type: 'text' },
  { key: 'product_id', label: 'Ürün ID', type: 'text' },
  { key: 'model', label: 'Model', type: 'text' },
  { key: 'image_url', label: 'Resim Yolu', type: 'text' },
  { key: 'short_description', label: 'Kısa Açıklama', type: 'text' },
  { key: 'description', label: 'Uzun Açıklama', type: 'text' },
  { key: 'meta_title', label: 'Meta Title', type: 'text' },
  { key: 'tags', label: 'Etiketler (virgülle ayrılmış)', type: 'text' },
  { key: 'sku', label: 'SKU', type: 'text' },
  { key: 'weight', label: 'Ağırlık', type: 'number' },
  { key: 'length', label: 'Uzunluk', type: 'number' },
  { key: 'width', label: 'Genişlik', type: 'number' },
  { key: 'height', label: 'Yükseklik', type: 'number' },
  { key: 'status', label: 'Durum (aktif/pasif)', type: 'text' }
] as const

class ProductImportService {
  private categories: Category[] = []
  private existingProducts: Product[] = []

  async initialize() {
    console.log('ProductImportService initialize başlıyor...')
    
    // Kategorileri yükle
    this.categories = await categoryService.getCategories(true)
    console.log('Kategoriler yüklendi:', this.categories.length)
    
    // Mevcut ürünleri yükle
    const { products } = await productService.getProducts()
    this.existingProducts = products
    console.log('Mevcut ürünler yüklendi:', this.existingProducts.length)
  }

  // Dosyayı parse et ve header bilgilerini çıkar
  async parseFile(file: File): Promise<ParsedFile> {
    console.log('Dosya parse ediliyor...', { fileName: file.name, fileSize: file.size, fileType: file.type })
    
    const fileName = file.name
    const fileType = this.getFileType(file)
    
    let data: RawRowData[] = []
    
    switch (fileType) {
      case 'excel':
        data = await this.parseExcelFile(file)
        break
      case 'csv':
        data = await this.parseCSVFile(file)
        break
      case 'xml':
        data = await this.parseXMLFile(file)
        break
      default:
        throw new Error('Desteklenmeyen dosya formatı')
    }
    
    if (data.length === 0) {
      throw new Error('Dosyada veri bulunamadı')
    }
    
    const headers = Object.keys(data[0] || {})
    console.log('Parse sonucu:', { headers, totalRows: data.length })
    
    return {
      headers,
      data,
      fileName,
      fileType,
      totalRows: data.length
    }
  }

  // Field mapping ile veriyi transform et
  transformDataWithMapping(parsedFile: ParsedFile, fieldMappings: FieldMapping[]): {
    transformedData: Partial<TransformedProductData>[]
    errors: ImportError[]
  } {
    const transformedData: Partial<TransformedProductData>[] = []
    const errors: ImportError[] = []
    
    console.log('Data transform başlıyor...', { mappings: fieldMappings.length, rows: parsedFile.data.length })
    
          parsedFile.data.forEach((row, index) => {
        const transformedRow: Partial<TransformedProductData> = {}
        const rowErrors: string[] = []

    // Zorunlu alanları kontrol et
      for (const requiredField of REQUIRED_FIELDS) {
        const mapping = fieldMappings.find(m => m.targetField === requiredField.key)
        if (!mapping) {
          rowErrors.push(`Zorunlu alan eksik: ${requiredField.label}`)
          continue
        }
        
        const value = row[mapping.sourceField]
        if (value === undefined || value === null || value === '') {
          rowErrors.push(`${requiredField.label} boş olamaz`)
          continue
        }
        
        // Tip dönüşümü
        if (requiredField.type === 'number') {
          const numValue = parseFloat(String(value))
          if (isNaN(numValue)) {
            rowErrors.push(`${requiredField.label} geçerli bir sayı değil: ${value}`)
            continue
          }
          transformedRow[requiredField.key] = numValue
        } else {
          transformedRow[requiredField.key] = String(value)
        }
      }
      
      // Seçenekli alanları ekle
      for (const optionalField of OPTIONAL_FIELDS) {
        const mapping = fieldMappings.find(m => m.targetField === optionalField.key)
        if (mapping && row[mapping.sourceField] !== undefined) {
          const value = row[mapping.sourceField]
          
          if (value !== null && value !== '') {
            // Tip dönüşümü
            if (optionalField.type === 'number') {
              const numValue = parseFloat(String(value))
              if (!isNaN(numValue)) {
                transformedRow[optionalField.key] = numValue
              }
            } else {
              transformedRow[optionalField.key] = String(value)
            }
          }
        }
      }
      
      // Kategori özel işlemi (+ ile çoklu kategori)
      if (transformedRow.category) {
        transformedRow.categories = this.parseCategories(transformedRow.category)
      }
      
      // Etiket özel işlemi (virgülle ayrılmış)
      if (transformedRow.tags) {
        transformedRow.parsedTags = this.parseTags(transformedRow.tags)
      }
      
      // SKU yoksa otomatik oluştur
      if (!transformedRow.sku && transformedRow.name) {
        transformedRow.sku = this.generateSKU(transformedRow.name, index)
      }
      
      // Hata varsa kaydet
      if (rowErrors.length > 0) {
        errors.push({
          row: index + 2, // Excel'de satır 1 header
          message: rowErrors.join(', '),
          data: row
        })
      }
      
      transformedData.push(transformedRow)
    })
    
    console.log('Transform tamamlandı:', { transformed: transformedData.length, errors: errors.length })
    return { transformedData, errors }
  }

  // Kategori parse (+ ile çoklu)
  private parseCategories(categoryString: string): string[] {
    return categoryString
      .split('+')
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0)
  }

  // Etiket parse (virgülle ayrılmış)
  private parseTags(tagsString: string): string[] {
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
  }

  // SKU otomatik oluştur
  private generateSKU(productName: string, index: number): string {
    const cleaned = productName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 8)
      .toUpperCase()
    return `${cleaned}-${Date.now()}-${index}`
  }

  // Dosya tipini belirle
  private getFileType(file: File): 'csv' | 'excel' | 'xml' {
    const name = file.name.toLowerCase()
    const type = file.type
    
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || type.includes('spreadsheet')) {
      return 'excel'
    }
    if (name.endsWith('.csv') || type.includes('csv')) {
      return 'csv'
    }
    if (name.endsWith('.xml') || type.includes('xml')) {
      return 'xml'
    }
    
    // Default to excel
    return 'excel'
  }

  // Excel dosyası parse
  private async parseExcelFile(file: File): Promise<RawRowData[]> {
    console.log('Excel dosyası parse ediliyor...')
    
    const arrayBuffer = await file.arrayBuffer()
    console.log('Excel dosyası okundu, boyut:', arrayBuffer.byteLength)
    
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('Excel workbook sheet isimleri:', workbook.SheetNames)
    
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false // String olarak oku
    }) as (string | number | boolean)[][]
    
    console.log('Excel JSON verisi:', jsonData.length, 'satır')
          
          if (jsonData.length < 2) {
      throw new Error('Excel dosyasında yeterli veri yok (en az header + 1 satır gerekli)')
          }
          
          const headers = jsonData[0] as string[]
    console.log('Excel headers:', headers)
    
    const dataRows = jsonData.slice(1)
    const result: RawRowData[] = []
    
    dataRows.forEach((row, index) => {
      const rowData: RawRowData = {}
      headers.forEach((header, colIndex) => {
        if (header && header.trim()) {
          rowData[header.trim()] = row[colIndex] || ''
        }
      })
      console.log(`Satır ${index + 2} verisi:`, rowData)
      result.push(rowData)
    })
    
    console.log('Excel parse sonucu:', result.length, 'kategori')
    return result
  }

  // CSV dosyası parse
  private async parseCSVFile(file: File): Promise<RawRowData[]> {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV dosyasında yeterli veri yok')
    }
    
    const headers = this.parseCSVLine(lines[0])
    const result: RawRowData[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      const rowData: RawRowData = {}
      
      headers.forEach((header, index) => {
        if (header && header.trim()) {
          rowData[header.trim()] = values[index] || ''
        }
      })
      
      result.push(rowData)
    }
    
    return result
  }

  // XML dosyası parse (basit implementation)
  private async parseXMLFile(file: File): Promise<RawRowData[]> {
    const text = await file.text()
    
    // Bu basit bir XML parser - geliştirilmesi gerekebilir
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    
    const products = doc.querySelectorAll('product, item, row')
    const result: RawRowData[] = []
    
    products.forEach(product => {
      const rowData: RawRowData = {}
      
      for (const child of product.children) {
        rowData[child.tagName] = child.textContent || ''
      }
      
      result.push(rowData)
    })
    
    return result
  }

  // CSV satırı parse
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
          inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  // Preview oluştur
  async createPreview(
    parsedFile: ParsedFile, 
    fieldMappings: FieldMapping[]
  ): Promise<ProductPreview[]> {
    console.log('Preview oluşturuluyor...', { rows: parsedFile.data.length })
    
    const { transformedData, errors } = this.transformDataWithMapping(parsedFile, fieldMappings)
    const preview: ProductPreview[] = []
    
    transformedData.forEach((row, index) => {
      const rowError = errors.find(e => e.row === index + 2)
      const existingProduct = this.findProductBySku(row.sku)
      
      preview.push({
        rowNumber: index + 2,
        action: existingProduct ? 'update' : 'create',
        name: row.name || 'İsimsiz Ürün',
        sku: row.sku,
        price: row.price,
        stock: row.stock,
        category: row.categories?.join(', '),
        status: rowError ? 'error' : 'ready',
        errors: rowError ? [rowError.message] : [],
        warnings: [],
        mappedData: row
      })
    })
    
    console.log('Preview oluşturuldu:', preview.length, 'ürün')
    return preview
  }

  // Ürün bulma (SKU ile)
  private findProductBySku(sku: string): Product | null {
    if (!sku) return null
    return this.existingProducts.find(p => p.sku === sku) || null
  }

  // Ana import fonksiyonu
  async import(
    parsedFile: ParsedFile,
    fieldMappings: FieldMapping[],
    options: ImportOptions
  ): Promise<ImportResult> {
    console.log('Import başlıyor, toplam ürün:', parsedFile.data.length)
    
    const { transformedData, errors } = this.transformDataWithMapping(parsedFile, fieldMappings)
    let successCount = 0
    let errorCount = errors.length
    const allErrors = [...errors]
    
    for (let i = 0; i < transformedData.length; i++) {
      const row = transformedData[i]
      const rowNumber = i + 2
      
      try {
        // Hatalı satırları atla
        const hasError = errors.some(e => e.row === rowNumber)
        if (hasError) {
          console.log(`Satır ${rowNumber} hatası nedeniyle atlandı`)
          continue
        }
        
        console.log(`İşleniyor: ${rowNumber} - ${row.name}`)
        
        const existingProduct = this.findProductBySku(row.sku)
        
        if (existingProduct && !options.updateExisting) {
          console.log(`Mevcut ürün atlandı: ${row.sku}`)
          continue
        }
        
        // Kategorileri işle
        let categoryIds: string[] = []
        if (row.categories && options.createCategories) {
          categoryIds = await this.processCategoriesForProduct(row.categories)
        }
        
        // Görselleri işle
        const images: { url: string; alt: string; position: number; isMain: boolean }[] = []
        if (row.image_url && !options.skipImages) {
          // URL'leri virgülle ayrılmış olarak destekle
          const imageUrls = row.image_url.split(',').map((url: string) => url.trim()).filter(Boolean)
          imageUrls.forEach((url: string, index: number) => {
            images.push({
              url,
              alt: row.name,
              position: index,
              isMain: index === 0
            })
          })
        }

        // ProductFormData oluştur
        const productData: ProductFormData = {
          name: row.name,
          slug: '', // Otomatik oluşturulacak
          description: row.description || row.short_description || '',
          shortDescription: row.short_description || '',
          price: row.price,
          comparePrice: row.compare_price || undefined,
          costPrice: row.cost_price || undefined,
          stockQuantity: row.stock,
          trackStock: true,
          allowBackorders: false,
          sku: row.sku || this.generateSKU(row.name, i),
          barcode: row.barcode || undefined,
          weight: row.weight || undefined,
          categoryId: categoryIds.length > 0 ? categoryIds[0] : undefined,
          tags: row.parsedTags || [],
          isActive: row.status !== 'pasif' && row.status !== 'inactive',
          isFeatured: false,
          images,
          hasVariants: false,
          dimensions: row.length || row.width || row.height ? {
            length: parseFloat(row.length) || 0,
            width: parseFloat(row.width) || 0,
            height: parseFloat(row.height) || 0,
            unit: 'cm' as const
          } : undefined,
          seo: {
            metaTitle: row.meta_title || row.name,
            metaDescription: row.short_description || '',
            metaKeywords: row.parsedTags || []
          },
          shipping: {
            requiresShipping: true,
            weight: parseFloat(row.weight) || undefined,
            shippingClass: 'standard' as const
          }
        }
        
        if (options.dryRun) {
          console.log(`Dry run: ${productData.name}`)
          successCount++
        } else {
        if (existingProduct) {
            await productService.updateProduct(existingProduct.id, productData)
            console.log(`Güncellendi: ${productData.name}`)
          } else {
            await productService.createProduct(productData)
            console.log(`Oluşturuldu: ${productData.name}`)
          }
          successCount++
        }
        
      } catch (error) {
        console.error(`Satır ${rowNumber} işlenirken hata:`, error)
        allErrors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Bilinmeyen hata',
          data: row
        })
        errorCount++
      }
    }
    
    const result: ImportResult = {
      success: errorCount === 0,
      message: `Import tamamlandı: ${successCount} başarılı, ${errorCount} hata`,
      totalProcessed: transformedData.length,
      successCount,
      errorCount,
      errors: allErrors
    }
    
    console.log('Import tamamlandı:', result)
    return result
  }

  // Kategorileri işle ve ID'lerini döndür
  private async processCategoriesForProduct(categoryNames: string[]): Promise<string[]> {
    const categoryIds: string[] = []
    
    for (const categoryName of categoryNames) {
      const category = this.findCategoryByName(categoryName.trim())
      
      if (!category) {
        // Kategoriyi oluştur
        const categoryId = await this.createCategoryIfNotExists(categoryName.trim())
        if (categoryId) {
          categoryIds.push(categoryId)
        }
      } else {
        categoryIds.push(category.id)
      }
    }
    
    return categoryIds
  }

  private findCategoryByName(categoryName: string): Category | null {
    return this.categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    ) || null
  }

  private async createCategoryIfNotExists(categoryName: string): Promise<string | null> {
    try {
      const slug = this.generateSlug(categoryName)
      const newCategory = await categoryService.createCategory({
        name: categoryName,
        slug,
        description: categoryName,
        isActive: true,
        parentId: null
      })
      
      // Cache'e ekle
      this.categories.push(newCategory)
      console.log(`Kategori oluşturuldu: ${categoryName}`)
      
      return newCategory.id
    } catch (error) {
      console.error(`Kategori oluşturulamadı: ${categoryName}`, error)
      return null
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

export const productImportService = new ProductImportService()