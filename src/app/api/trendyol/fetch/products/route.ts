import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'
import { TrendyolAPIClient } from '@catkapinda/trendyol-integration'

// Gelişmiş string eşleştirme fonksiyonu (Mock test'te %80 başarı)
function improvedStringMatch(str1: string, str2: string): { score: number, reason: string } {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  // 1. Tam eşleşme
  if (s1 === s2) return { score: 1.0, reason: 'exact match' }
  
  // 2. Bir string diğerini içeriyor
  if (s1.includes(s2) || s2.includes(s1)) return { score: 0.9, reason: 'substring match' }
  
  // 3. Ortak kelimeler (3+ karakter, daha katı)
  const words1 = s1.split(/\s+/).filter(w => w.length >= 3) // En az 3 karakter
  const words2 = s2.split(/\s+/).filter(w => w.length >= 3) // En az 3 karakter
  
  // Sadece tam kelime eşleşmesi (includes kaldırıldı)
  const commonWords = words1.filter(w1 => 
    words2.some(w2 => w1 === w2)
  )
  
  // En az 3 ortak kelime gerekli (%80 için)
  if (commonWords.length >= 3) {
    const score = Math.min(0.85, 0.5 + (commonWords.length * 0.15))
    return { score, reason: `strong common words: ${commonWords.join(', ')}` }
  }
  
  // 2 güçlü kelime (5+ karakter)
  if (commonWords.length === 2 && commonWords.every(w => w.length >= 5)) {
    return { score: 0.75, reason: `two strong words: ${commonWords.join(', ')}` }
  }
  
  // 1 çok güçlü kelime (7+ karakter)
  if (commonWords.length === 1 && commonWords[0].length >= 7) {
    return { score: 0.65, reason: `very strong word: ${commonWords[0]}` }
  }
  
  // Hiçbir güçlü eşleşme yok
  return { score: 0, reason: 'insufficient similarity' }
}

// Geriye uyumluluk için eski fonksiyon (şimdilik)
function calculateSimilarity(str1: string, str2: string): number {
  return improvedStringMatch(str1, str2).score
}

// Levenshtein distance hesaplama
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * GET - Trendyol'dan direkt ürün çekme API'si (Cache kullanmaz)
 * Bu API gerçek Trendyol verilerini çeker ve geçici olarak döndürür
 * Veritabanına kaydetmez, sadece görüntüleme için kullanılır
 */
export async function GET(request: NextRequest) {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'approved'
    const page = parseInt(searchParams.get('page') || '0')
    const size = Math.min(parseInt(searchParams.get('size') || '200'), 1000) // Max 1000 per request
    const search = searchParams.get('search') || ''

    // Trendyol ayarlarını al
    const supabase = await createAdminSupabaseClient()
    const { data: settings } = await supabase
      .from('trendyol_integration_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Trendyol ayarları bulunamadı'
      }, { status: 400 })
    }

    // Trendyol API client'ı oluştur
    const client = new TrendyolAPIClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)

    // API dokümantasyonuna göre filtreleri hazırla
    const filters: any = {}
    
    // Status filtreleri
    switch (status) {
      case 'approved':
        filters.approved = true
        filters.onSale = true
        break
      case 'inactive':
        filters.onSale = false
        break
      case 'archived':
        filters.archived = true
        break
      case 'rejected':
        filters.rejected = true
        break
      case 'pending':
        filters.approved = false
        filters.rejected = false
        break
      case 'all':
      default:
        // Filtre yok, tümü
        break
    }

    console.log('🔍 Trendyol API çağrısı:', {
      status,
      page,
      size,
      filters,
      supplier_id: settings.supplier_id
    })

    // Trendyol'dan ürünleri çek
    const productsResponse = await client.getProducts(page, size, filters)

    console.log('📦 Trendyol API Response:', {
      totalElements: productsResponse.totalElements,
      totalPages: productsResponse.totalPages,
      itemCount: productsResponse.content?.length || 0
    })

    // Response'u standardize et
    const products = productsResponse.content || productsResponse.items || []

    // Gelişmiş eşleştirme sistemi (Mock test'te %80 başarı)
    console.log('🔍 Site ürünleri çekiliyor...')
    
    // Tüm site ürünlerini çek (eşleştirme için)
    console.log('🔍 Site ürünleri database query başlatılıyor...')
    
    const { data: siteProducts, error: siteProductsError } = await supabase
      .from('products')
      .select('id, name, price, barcode, is_active')
      .limit(1000) // Performans için sınır

    console.log('🔍 Site ürünleri query sonucu:', {
      error: siteProductsError,
      dataLength: siteProducts?.length || 0,
      hasData: !!siteProducts
    })

    if (siteProductsError) {
      console.error('❌ Site ürünleri çekme hatası:', siteProductsError)
    }

    console.log('🏪 Site Ürünleri:', siteProducts?.length || 0)
    console.log('🛒 Trendyol Ürünleri:', products.length)

    // Her Trendyol ürünü için en iyi eşleşmeyi bul
    let matchCount = 0
    const enrichedProducts = products.map(product => {
      let bestMatch = null
      let bestScore = 0
      let bestReason = ''
      
      if (!siteProducts || siteProducts.length === 0) {
        return {
          ...product,
          existsInSite: false,
          siteProductId: null,
          siteTitle: null,
          sitePrice: null,
          siteStatus: null,
          matchedBy: 'none'
        }
      }

      // Her site ürünü ile karşılaştır
      siteProducts.forEach(siteProduct => {
        // 1. Barcode eşleştirme (en yüksek öncelik)
        if (siteProduct.barcode && product.barcode && siteProduct.barcode === product.barcode) {
          bestMatch = siteProduct
          bestScore = 1.0
          bestReason = 'exact barcode match'
          return
        }
        
        // 2. İsim eşleştirme (gelişmiş algoritma)
        if (siteProduct.name && product.title) {
          const result = improvedStringMatch(siteProduct.name, product.title)
          if (result.score > bestScore) {
            bestMatch = siteProduct
            bestScore = result.score
            bestReason = result.reason
          }
        }
      })

      const isMatched = bestScore >= 0.97 // %97 eşleşme eşik değeri (çok katı)
      if (isMatched) matchCount++

      console.log(`🎯 "${product.title}" → "${bestMatch?.name || 'YOK'}" (${bestScore.toFixed(2)}) [${bestReason}]`)

      return {
        ...product,
        existsInSite: isMatched,
        siteProductId: bestMatch?.id || null,
        siteTitle: bestMatch?.name || null,
        sitePrice: bestMatch?.price || null,
        siteStatus: bestMatch?.is_active || null,
        matchedBy: bestMatch?.barcode === product.barcode ? 'barcode' :
                   isMatched ? 'title' : 'none'
      }
    })

    console.log(`🎯 Eşleştirme Sonuçları: ${matchCount}/${products.length} (${Math.round(matchCount/products.length*100)}%)`)

    const matchStats = {
      total: enrichedProducts.length,
      matched: enrichedProducts.filter(p => p.existsInSite).length,
      unmatched: enrichedProducts.filter(p => !p.existsInSite).length,
      matchPercentage: enrichedProducts.length > 0 ? 
        Math.round((enrichedProducts.filter(p => p.existsInSite).length / enrichedProducts.length) * 100) : 0
    }

    console.log('🎯 Eşleştirme İstatistikleri:', matchStats)
    console.log('📊 Debug - Trendyol ürün sayısı:', enrichedProducts.length)
    console.log('📊 Debug - Site ürün sayısı:', siteProducts?.length || 0)
    
    // İlk birkaç ürünü debug et
    enrichedProducts.slice(0, 3).forEach((product, index) => {
      console.log(`🔍 Debug Ürün ${index + 1}:`, {
        trendyolTitle: product.title,
        existsInSite: product.existsInSite,
        matchedBy: product.matchedBy,
        siteTitle: product.siteTitle
      })
    })
    
    // Site ürünlerini de debug et
    console.log('🏪 Debug - Site ürünleri (ilk 3):')
    if (siteProducts && siteProducts.length > 0) {
      siteProducts.slice(0, 3).forEach((siteProduct, index) => {
        console.log(`   ${index + 1}. ${siteProduct.name} (ID: ${siteProduct.id})`)
      })
    } else {
      console.log('   Hiç site ürünü bulunamadı!')
    }

    return NextResponse.json({
      success: true,
      message: `${enrichedProducts.length} ürün çekildi (${matchStats.matched} eşleşme, ${matchStats.unmatched} yeni)`,
      data: {
        items: enrichedProducts,
        page: productsResponse.page || page,
        size: productsResponse.size || size,
        totalElements: productsResponse.totalElements || products.length,
        totalPages: productsResponse.totalPages || Math.ceil((productsResponse.totalElements || products.length) / size),
        matchStats
      },
      metadata: {
        source: 'trendyol-live',
        fetchTime: new Date().toISOString(),
        filters: filters,
        supplier_id: settings.supplier_id
      }
    })

  } catch (error: any) {
    console.error('❌ Trendyol ürün çekme hatası:', error)
    
    // API hatalarını kullanıcı dostu mesajlara çevir
    let errorMessage = 'Ürünler çekilirken hata oluştu'
    
    if (error.message?.includes('401')) {
      errorMessage = 'API anahtarları geçersiz. Trendyol ayarlarını kontrol edin.'
    } else if (error.message?.includes('403')) {
      errorMessage = 'IP adresiniz engellenmiş olabilir. Trendyol desteği ile iletişime geçin.'
    } else if (error.message?.includes('404')) {
      errorMessage = 'API endpoint bulunamadı. Trendyol API dokümantasyonunu kontrol edin.'
    } else if (error.message?.includes('429')) {
      errorMessage = 'API limit aşıldı. Lütfen birkaç dakika bekleyin.'
    } else if (error.message?.includes('500')) {
      errorMessage = 'Trendyol API sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    } else if (error.message?.includes('556')) {
      errorMessage = 'Trendyol API servisi geçici olarak kullanılamıyor.'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'API isteği zaman aşımına uğradı. Bağlantınızı kontrol edin.'
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      debug: {
        originalError: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      }
    }, { status: 500 })
  }
}

/**
 * POST - Toplu ürün çekme (birden fazla sayfa veya filtre)
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
      status = 'approved',
      maxPages = 10,
      pageSize = 200,
      filters = {}
    } = body

    // Trendyol ayarlarını al
    const supabase = await createAdminSupabaseClient()
    const { data: settings } = await supabase
      .from('trendyol_integration_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Trendyol ayarları bulunamadı'
      }, { status: 400 })
    }

    // Trendyol API client'ı oluştur
    const client = new TrendyolAPIClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)

    console.log('🔄 Toplu ürün çekme başlatıldı:', {
      status,
      maxPages,
      pageSize,
      filters
    })

    const allProducts = []
    let currentPage = 0
    let totalPages = 1

    // API filtrelerini ayarla
    const apiFilters: any = { ...filters }
    
    switch (status) {
      case 'approved':
        apiFilters.approved = true
        apiFilters.onSale = true
        break
      case 'inactive':
        apiFilters.onSale = false
        break
      case 'archived':
        apiFilters.archived = true
        break
      case 'rejected':
        apiFilters.rejected = true
        break
      case 'pending':
        apiFilters.approved = false
        apiFilters.rejected = false
        break
    }

    // İlk sayfayı çek
    do {
      try {
        const response = await client.getProducts(currentPage, pageSize, apiFilters)
        const products = response.content || response.items || []
        
        allProducts.push(...products)
        totalPages = response.totalPages || 1
        
        console.log(`📄 Sayfa ${currentPage + 1}/${Math.min(totalPages, maxPages)} çekildi: ${products.length} ürün`)
        
        currentPage++
      } catch (pageError) {
        console.error(`❌ Sayfa ${currentPage} çekme hatası:`, pageError)
        break
      }
    } while (currentPage < totalPages && currentPage < maxPages)

    console.log('✅ Toplu çekme tamamlandı:', {
      totalProducts: allProducts.length,
      pagesProcessed: currentPage,
      maxPagesRequested: maxPages
    })

    // Sitedeki mevcut ürünleri kontrol et (barcode ve ürün adı ile eşleştirme) - Bulk için
    const bulkBarcodes = allProducts
      .filter(p => p.barcode)
      .map(p => p.barcode)
    
    const bulkTitles = allProducts
      .map(p => p.title?.trim())
      .filter(t => t && t.length > 3)

    let bulkExistingProducts: any[] = []
    
    // Önce barcode ile eşleştir - Bulk
    if (bulkBarcodes.length > 0) {
      const { data: bulkExistingData } = await supabase
        .from('products')
        .select('barcode, id, name, price, status')
        .in('barcode', bulkBarcodes)
      
      bulkExistingProducts = bulkExistingData || []
    }
    
    // Sonra ürün adı ile eşleştir - Bulk
    if (bulkTitles.length > 0) {
      const { data: bulkExistingDataByTitle } = await supabase
        .from('products')
        .select('barcode, id, name, price, status')
      
      if (bulkExistingDataByTitle) {
        bulkExistingDataByTitle.forEach(siteProduct => {
          const siteTitle = (siteProduct.name || '').toLowerCase().trim()
          
          bulkTitles.forEach(trendyolTitle => {
            const tTitle = trendyolTitle.toLowerCase()
            
            if (siteTitle.includes(tTitle.slice(0, 10)) || 
                tTitle.includes(siteTitle.slice(0, 10)) ||
                calculateSimilarity(siteTitle, tTitle) > 0.6) {
              
              const alreadyMatched = bulkExistingProducts.some(ep => ep.id === siteProduct.id)
              if (!alreadyMatched) {
                bulkExistingProducts.push({
                  ...siteProduct,
                  matchedByTitle: true
                })
              }
            }
          })
        })
      }
    }

    // Her ürüne sitede var olup olmadığı bilgisini ekle - Bulk için
    const bulkEnrichedProducts = allProducts.map(product => {
      let existingProduct = bulkExistingProducts.find(ep => 
        ep.barcode && ep.barcode === product.barcode
      )
      
      // Barcode eşleşmesi yoksa ürün adı ile eşleştir
      if (!existingProduct && product.title) {
        const productTitle = product.title.toLowerCase().trim()
        existingProduct = bulkExistingProducts.find(ep => {
          const siteTitle = (ep.title || ep.name || '').toLowerCase().trim()
          return siteTitle.includes(productTitle.slice(0, 10)) || 
                 productTitle.includes(siteTitle.slice(0, 10)) ||
                 calculateSimilarity(siteTitle, productTitle) > 0.6
        })
      }
      
      return {
        ...product,
        existsInSite: !!existingProduct,
        siteProductId: existingProduct?.id || null,
        siteTitle: existingProduct?.name || null,
        sitePrice: existingProduct?.price || null,
        siteStatus: existingProduct?.status || null,
        matchedBy: existingProduct?.barcode === product.barcode ? 'barcode' : 
                   existingProduct?.matchedByTitle ? 'title' : 'barcode'
      }
    })

    const bulkMatchStats = {
      total: bulkEnrichedProducts.length,
      matched: bulkEnrichedProducts.filter(p => p.existsInSite).length,
      unmatched: bulkEnrichedProducts.filter(p => !p.existsInSite).length,
      matchPercentage: bulkEnrichedProducts.length > 0 ? 
        Math.round((bulkEnrichedProducts.filter(p => p.existsInSite).length / bulkEnrichedProducts.length) * 100) : 0
    }

    console.log('🎯 Toplu Eşleştirme İstatistikleri:', bulkMatchStats)

    return NextResponse.json({
      success: true,
      message: `${bulkEnrichedProducts.length} ürün toplu olarak çekildi (${bulkMatchStats.matched} eşleşme, ${bulkMatchStats.unmatched} yeni)`,
      data: {
        items: bulkEnrichedProducts,
        totalItems: bulkEnrichedProducts.length,
        pagesProcessed: currentPage,
        totalPagesAvailable: totalPages,
        maxPagesRequested: maxPages,
        matchStats: bulkMatchStats
      },
      metadata: {
        source: 'trendyol-bulk-fetch',
        fetchTime: new Date().toISOString(),
        filters: apiFilters,
        supplier_id: settings.supplier_id
      }
    })

  } catch (error: any) {
    console.error('❌ Toplu ürün çekme hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Toplu ürün çekme başarısız',
      debug: {
        originalError: error.message
      }
    }, { status: 500 })
  }
}
