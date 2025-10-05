import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrendyolClient } from '@catkapinda/trendyol-integration'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Gerçek Trendyol API test başlatılıyor...')
    
    // Ayarları al
    const supabase = await createClient()
    const { data: settings, error } = await supabase
      .from('trendyol_settings')
      .select('*')
      .single()

    if (error || !settings) {
      return NextResponse.json({
        error: 'Settings bulunamadı',
        details: { error: error?.message }
      }, { status: 400 })
    }

    console.log('📡 DEBUG: API Credentials:', {
      supplier_id: settings.supplier_id,
      api_key: settings.api_key ? `${settings.api_key.substring(0, 8)}***` : 'undefined',
      api_secret: settings.api_secret ? `${settings.api_secret.substring(0, 8)}***` : 'undefined',
      test_mode: settings.test_mode,
      mock_mode: settings.mock_mode
    })

    // Environment variables kontrol
    console.log('🔧 DEBUG: Environment Variables:', {
      proxy_url: process.env.TRENDYOL_PROXY_URL,
      proxy_secret: process.env.TRENDYOL_PROXY_SECRET ? `${process.env.TRENDYOL_PROXY_SECRET.substring(0, 8)}***` : 'undefined',
      test_mode: process.env.TRENDYOL_TEST_MODE,
      node_env: process.env.NODE_ENV
    })

    // TrendyolAPIClient oluştur
    const client = getTrendyolClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)

    console.log('🌐 DEBUG: Base URL:', client.getBaseURL())

    // Test 1: Connection Test
    console.log('🧪 TEST 1: Connection test...')
    try {
      const connected = await client.testConnection()
      console.log('✅ Connection Test Result:', connected)
    } catch (connError) {
      console.log('❌ Connection Test Error:', connError.message)
    }

    // Test 2: Products List (ilk 5 ürün)
    console.log('🧪 TEST 2: Products list...')
    try {
      // Onaylı ürünleri çek
      const products = await client.getProducts(0, 5, { approved: true })
      console.log('✅ Products Result:', {
        totalElements: products.totalElements,
        totalPages: products.totalPages,
        page: products.page,
        size: products.size,
        itemCount: products.content?.length || 0,
        firstItem: products.content?.[0] ? {
          barcode: products.content[0].barcode,
          title: products.content[0].title,
          brand: products.content[0].brand,
          categoryName: products.content[0].categoryName
        } : null
      })
      
      // Test 3: Tüm ürünler (approved=false)
      console.log('🧪 TEST 3: All products (including unapproved)...')
      let allProducts
      try {
        allProducts = await client.getProducts(0, 5, {}) // Filtre yok
      } catch (allError) {
        console.log('❌ All Products Error:', allError.message)
        allProducts = null
      }

      return NextResponse.json({
        success: true,
        message: 'Gerçek API test başarılı!',
        data: {
          connection: true,
          approved_products: {
            total: products.totalElements,
            returned: products.content?.length || 0,
            sample: products.content?.slice(0, 2) || []
          },
          all_products: allProducts ? {
            total: allProducts.totalElements,
            returned: allProducts.content?.length || 0,
            sample: allProducts.content?.slice(0, 2) || []
          } : { error: 'Could not fetch all products' },
          proxy_info: {
            base_url: client.getBaseURL(),
            proxy_used: process.env.TRENDYOL_PROXY_URL || 'none'
          }
        }
      })

    } catch (productsError) {
      console.log('❌ Products Test Error:', productsError.message)
      
      return NextResponse.json({
        success: false,
        message: 'API bağlantısı var ama veri gelmiyor',
        error: productsError.message,
        debug_info: {
          base_url: client.getBaseURL(),
          proxy_used: process.env.TRENDYOL_PROXY_URL || 'none',
          credentials_present: {
            api_key: !!settings.api_key,
            api_secret: !!settings.api_secret,
            supplier_id: !!settings.supplier_id
          }
        }
      })
    }

  } catch (error) {
    console.error('🚨 DEBUG: Fatal error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Debug test hatası',
      details: { 
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }
    }, { status: 500 })
  }
} 