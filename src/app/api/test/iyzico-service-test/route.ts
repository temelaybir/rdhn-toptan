import { NextRequest, NextResponse } from 'next/server'
import { createIyzicoService, getIyzicoSettingsFromEnv } from '@/services/payment/iyzico-service'

/**
 * GET - İyzico Service Test Endpoint
 * Düzeltilmiş İyzico service class'ını test eder
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 İyzico Service Test: Düzeltilmiş service class ile başlatılıyor...')

    // Environment'dan ayarları al
    const settings = getIyzicoSettingsFromEnv()
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Environment settings not found',
        message: 'İyzico ayarları environment variables\'da bulunamadı'
      }, { status: 404 })
    }

    console.log('🔧 Service test config:', {
      testMode: settings.test_mode,
      hasApiKey: !!settings.api_key,
      hasSecretKey: !!settings.secret_key,
      hasCallbackUrl: !!settings.callback_url
    })

    // İyzico service oluştur
    const iyzicoService = createIyzicoService(settings)

    // Connection test (düzeltilmiş /payment/test endpoint ile)
    console.log('🧪 Service connection test başlatılıyor...')
    const connectionTest = await iyzicoService.testConnection()

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Service connection test failed',
        details: connectionTest.error,
        message: 'İyzico service bağlantı testi başarısız',
        settings: {
          testMode: settings.test_mode,
          environment: settings.test_mode ? 'Sandbox' : 'Production'
        }
      }, { status: 503 })
    }

    console.log('✅ Service connection test başarılı!')

    return NextResponse.json({
      success: true,
      message: 'İyzico service test başarılı! 🎉',
      data: {
        connectionTest: {
          success: true,
          message: 'Service class ile bağlantı başarılı',
          details: connectionTest.data
        },
        settings: {
          testMode: settings.test_mode,
          environment: settings.test_mode ? 'Sandbox' : 'Production',
          currency: settings.default_currency,
          force3DSecure: settings.force_3d_secure,
          serviceMethod: 'İyzico Service Class',
          endpoint: '/payment/test',
          authMethod: 'SDK_implementation'
        },
        note: 'İyzico entegrasyonu tamamen çalışır durumda!'
      }
    })

  } catch (error: any) {
    console.error('💥 İyzico Service Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Service test failed',
      message: error.message || 'Service test sırasında hata oluştu',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name,
        cause: error.cause
      }
    }, { status: 500 })
  }
} 