import { NextRequest, NextResponse } from 'next/server'
import { getIyzicoSettingsFromEnv, createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * GET - Comprehensive İyzico Test
 * Environment variables'a göre sandbox ya da production test yapar
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 İyzico Comprehensive Test başlatılıyor...')

    // URL parametrelerini al
    const url = new URL(request.url)
    const forceTestMode = url.searchParams.get('test') === 'true'
    const useOfficialKeys = url.searchParams.get('official') === 'true'

    let result: any = {}

    // 1. Environment Variables Test
    console.log('📋 Environment variables kontrol ediliyor...')
    
    const envTest = {
      IYZICO_API_KEY: !!process.env.IYZICO_API_KEY,
      IYZICO_SECRET_KEY: !!process.env.IYZICO_SECRET_KEY,
      IYZICO_BASE_URL: process.env.IYZICO_BASE_URL || 'NOT_SET',
      IYZICO_TEST_MODE: process.env.IYZICO_TEST_MODE || 'NOT_SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'
    }

    result.environmentCheck = {
      success: envTest.IYZICO_API_KEY && envTest.IYZICO_SECRET_KEY,
      variables: envTest,
      recommendation: !envTest.IYZICO_API_KEY || !envTest.IYZICO_SECRET_KEY 
        ? 'IYZICO_API_KEY ve IYZICO_SECRET_KEY environment variables\'ı set edilmeli'
        : 'Environment variables tamam'
    }

    // 2. Service Configuration Test
    console.log('⚙️ Service configuration test...')
    
    try {
      // Eğer official keys isteniyorsa, env variables'ı geçici olarak değiştir
      if (useOfficialKeys) {
        process.env.IYZICO_API_KEY = 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t'
        process.env.IYZICO_SECRET_KEY = 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB'
        process.env.IYZICO_TEST_MODE = 'true'
        process.env.IYZICO_BASE_URL = 'https://sandbox-api.iyzipay.com'
      }

      if (forceTestMode) {
        process.env.IYZICO_TEST_MODE = 'true'
      }

      const settings = getIyzicoSettingsFromEnv()
      
      if (!settings) {
        result.serviceConfiguration = {
          success: false,
          error: 'İyzico ayarları environment variables\'dan yüklenemedi'
        }
      } else {
        const service = createIyzicoService(settings)
        
        result.serviceConfiguration = {
          success: true,
          settings: {
            id: settings.id,
            testMode: settings.test_mode,
            hasApiKey: !!settings.api_key || !!settings.sandbox_api_key,
            hasSecretKey: !!settings.secret_key || !!settings.sandbox_secret_key,
            baseUrl: settings.test_mode ? settings.sandbox_base_url : settings.production_base_url,
            callbackUrl: settings.callback_url
          }
        }

        // 3. İyzico API Connection Test
        console.log('🔗 İyzico API connection test...')
        
        try {
          const connectionTest = await service.testConnection()
          
          result.connectionTest = {
            success: connectionTest.success,
            data: connectionTest.data,
            error: connectionTest.error,
            duration: Date.now()
          }
          
          console.log('📊 Connection test result:', connectionTest)
          
        } catch (error: any) {
          result.connectionTest = {
            success: false,
            error: error.message,
            details: error
          }
        }
      }
      
    } catch (error: any) {
      result.serviceConfiguration = {
        success: false,
        error: error.message,
        details: error
      }
    }

    // 4. Test Cards Info
    result.testCards = {
      visa: '4543600000000006',
      mastercard: '5528790000000008', 
      amex: '374200000000004',
      description: 'İyzico sandbox test kartları - Bunları sandbox modunda test için kullanabilirsiniz'
    }

    // 5. Current Configuration Summary
    result.currentConfig = {
      testMode: process.env.IYZICO_TEST_MODE === 'true',
      endpoint: process.env.IYZICO_BASE_URL || 'AUTO_DETECTED',
      hasCredentials: !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY),
      recommendation: process.env.IYZICO_TEST_MODE === 'true' 
        ? '✅ Sandbox mode aktif - Test anahtarlarını kullanıyor'
        : '⚠️ Production mode - Gerçek anahtarlar kullanılıyor'
    }

    // Final assessment
    const overallSuccess = result.environmentCheck?.success && 
                          result.serviceConfiguration?.success && 
                          result.connectionTest?.success

    return NextResponse.json({
      success: overallSuccess,
      timestamp: new Date().toISOString(),
      testType: useOfficialKeys ? 'Official Sandbox Keys' : 'Your Environment Keys',
      summary: overallSuccess 
        ? '✅ İyzico entegrasyonu tamamen hazır!'
        : '⚠️ Bazı sorunlar mevcut, detayları kontrol edin',
      results: result,
      nextSteps: overallSuccess 
        ? [
            '3D Secure ödeme testini /api/test/iyzico-3d-test endpoint\'i ile yapabilirsiniz',
            'Gerçek ödeme işlemlerini test etmeye başlayabilirsiniz'
          ]
        : [
            'Environment variables\'ları kontrol edin',
            'API anahtarlarınızın doğru olduğundan emin olun',
            'Network bağlantısını kontrol edin'
          ]
    })

  } catch (error: any) {
    console.error('💥 Comprehensive test error:', error)

    return NextResponse.json({
      success: false,
      error: 'Comprehensive test failed',
      message: error.message,
      details: error,
      recommendation: 'Detaylı hata logları için console\'u kontrol edin'
    }, { status: 500 })
  }
} 