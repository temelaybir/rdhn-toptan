import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'

/**
 * POST - Seçilen Trendyol ürünlerini veritabanına aktarma API'si
 * İki aşamalı sistemin 2. aşaması
 */
export async function POST(request: NextRequest) {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      products = [], 
      importSettings = {
        updateExisting: true,
        importImages: true,
        importAttributes: true,
        categoryMapping: 'auto',
        priceMultiplier: 1,
        stockMultiplier: 1
      }
    } = body

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aktarılacak ürün seçilmedi'
      }, { status: 400 })
    }

    console.log('📦 Ürün aktarma başlatıldı:', {
      productCount: products.length,
      settings: importSettings
    })

    const supabase = await createAdminSupabaseClient()
    const results = {
      success: 0,
      failed: 0,
      updated: 0,
      created: 0,
      errors: [] as any[]
    }

    // Ürünleri tek tek işle
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      
      try {
        console.log(`🔄 [${i + 1}/${products.length}] İşleniyor: ${product.title}`)

        // Mevcut ürünü kontrol et (barcode ile)
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, name, barcode')
          .eq('barcode', product.barcode)
          .single()

        // Ürün verilerini hazırla
        const productData = await prepareProductData(product, importSettings, supabase, !!existingProduct)

        if (existingProduct && importSettings.updateExisting) {
          // Mevcut ürünü güncelle
          const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProduct.id)
            .select('id, name')
            .single()

          if (updateError) {
            console.error(`❌ Ürün güncelleme hatası:`, updateError)
            results.errors.push({
              product: product.title,
              barcode: product.barcode,
              error: updateError.message,
              action: 'update'
            })
            results.failed++
          } else {
            console.log(`✅ Güncellendi: ${updatedProduct.name}`)
            results.updated++
            results.success++
          }

        } else if (!existingProduct) {
          // Yeni ürün oluştur
          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert(productData)
            .select('id, name')
            .single()

          if (createError) {
            console.error(`❌ Ürün oluşturma hatası:`, createError)
            results.errors.push({
              product: product.title,
              barcode: product.barcode,
              error: createError.message,
              action: 'create'
            })
            results.failed++
          } else {
            console.log(`✅ Oluşturuldu: ${newProduct.name}`)
            results.created++
            results.success++
          }

        } else {
          console.log(`⏭️  Atlandı (mevcut): ${product.title}`)
        }

      } catch (productError: any) {
        console.error(`❌ Ürün işleme hatası:`, productError)
        results.errors.push({
          product: product.title,
          barcode: product.barcode,
          error: productError.message,
          action: 'process'
        })
        results.failed++
      }
    }

    const successRate = results.success > 0 ? Math.round((results.success / products.length) * 100) : 0

    console.log('📊 Aktarma tamamlandı:', results)

    return NextResponse.json({
      success: true,
      message: `${results.success}/${products.length} ürün başarıyla aktarıldı`,
      data: {
        summary: {
          total: products.length,
          success: results.success,
          failed: results.failed,
          created: results.created,
          updated: results.updated,
          successRate: `${successRate}%`
        },
        errors: results.errors,
        importSettings: importSettings,
        processedAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Ürün aktarma hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ürün aktarma başarısız',
      debug: {
        originalError: error.message
      }
    }, { status: 500 })
  }
}

/**
 * Trendyol ürün verisini yerel veritabanı formatına çevir
 * Sadece mevcut database column'larını kullanır
 */
async function prepareProductData(trendyolProduct: any, settings: any, supabase: any, isUpdate = false) {
  // Unique slug oluştur
  const generateSlug = async (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    // Unique kontrol et
    let slug = baseSlug
    let counter = 1

    while (true) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!existing) break // Unique slug bulundu
      
      slug = `${baseSlug}-${counter}`
      counter++
      
      if (counter > 100) break // Sonsuz döngü korunması
    }

    return slug
  }

  // Temel ürün verisi (sadece mevcut column'lar)
  const productData: any = {
    name: trendyolProduct.title || '',
    description: trendyolProduct.description || '',
    short_description: (trendyolProduct.description || '').substring(0, 200),
    price: parseFloat((trendyolProduct.salePrice || 0) * settings.priceMultiplier),
    compare_price: parseFloat((trendyolProduct.listPrice || trendyolProduct.salePrice || 0) * settings.priceMultiplier),
    stock_quantity: Math.floor((trendyolProduct.quantity || 0) * settings.stockMultiplier),
    sku: trendyolProduct.stockCode || trendyolProduct.barcode || '',
    barcode: trendyolProduct.barcode || '',
    weight: parseFloat(trendyolProduct.dimensionalWeight || 0),
    is_active: !!(trendyolProduct.approved && trendyolProduct.onSale),
    is_featured: false
  }

  // Slug sadece yeni ürünler için oluştur (unique constraint)
  if (!isUpdate) {
    productData.slug = await generateSlug(trendyolProduct.title || '')
  }

  // Kategori eşleştirme
  if (settings.categoryMapping === 'auto' && trendyolProduct.categoryId) {
    try {
      // Trendyol kategori ID'sine göre yerel kategori bul
      const { data: categoryMapping } = await supabase
        .from('trendyol_category_mappings')
        .select('local_category_id')
        .eq('trendyol_category_id', trendyolProduct.categoryId)
        .single()

      if (categoryMapping) {
        productData.category_id = categoryMapping.local_category_id
      }
    } catch (categoryError) {
      console.warn('Kategori eşleştirme bulunamadı:', trendyolProduct.categoryId)
    }
  }

  // Görsel URL'lerini hazırla (images array)
  if (settings.importImages && trendyolProduct.images && trendyolProduct.images.length > 0) {
    const imageUrls = trendyolProduct.images
      .filter((img: any) => img.url)
      .map((img: any) => img.url)
      .slice(0, 10) // Maksimum 10 görsel

    if (imageUrls.length > 0) {
      productData.images = imageUrls // TEXT[] format için array
    }
  }

  // Özellik ve metadata verilerini tags array'ine koy
  const tags = []
  
  // Marka etiketi
  if (trendyolProduct.brand) {
    tags.push(`marka:${trendyolProduct.brand}`)
  }

  // Renk etiketi  
  if (trendyolProduct.color) {
    tags.push(`renk:${trendyolProduct.color}`)
  }
  
  // Beden etiketi
  if (trendyolProduct.size) {
    tags.push(`beden:${trendyolProduct.size}`)
  }

  // Trendyol metadata
  tags.push(`trendyol:${trendyolProduct.id}`)
  tags.push(`trendyol_main:${trendyolProduct.productMainId}`)
  tags.push(`import_source:trendyol`)
  
  // Özellik verilerini tags'e ekle
  if (settings.importAttributes && trendyolProduct.attributes && trendyolProduct.attributes.length > 0) {
    trendyolProduct.attributes.forEach((attr: any) => {
      if (attr.attributeName && attr.attributeValue) {
        tags.push(`${attr.attributeName}:${attr.attributeValue}`.substring(0, 100))
      }
    })
  }

  if (tags.length > 0) {
    productData.tags = tags
  }

  return productData
}
