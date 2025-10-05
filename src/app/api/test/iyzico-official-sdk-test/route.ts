import { NextRequest, NextResponse } from 'next/server'
import { IyzicoService } from '@/services/payment/iyzico-service'

/**
 * 🧪 Resmi İyzico SDK'daki sandbox keys ile test
 * 
 * Kaynak: commerce/iyzipay-node-master/samples/data/options.json
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Resmi SDK Keys Test: İyzico resmi sandbox keys ile test başlatılıyor...')

    // ✅ Resmi SDK'daki sandbox keys (options.json'dan)
    const officialSDKSettings = {
      id: 'official_sdk_test',
      is_active: true,
      test_mode: true,
      api_key: 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI', // Official SDK key
      secret_key: 'sandbox-wbwpzKIiplZxI3hh5ALI4FJyAcZKL6kq', // Official SDK secret
      sandbox_api_key: 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI',
      sandbox_secret_key: 'sandbox-wbwpzKIiplZxI3hh5ALI4FJyAcZKL6kq',
      production_base_url: 'https://api.iyzipay.com',
      sandbox_base_url: 'https://sandbox-api.iyzipay.com',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/webhook`,
      default_currency: 'TRY' as const,
      force_3d_secure: true,
      auto_capture: true,
      allow_installments: true,
      max_installment_count: 12,
      minimum_installment_amount: 100,
      commission_rate: 0.028,
      installment_commission_rate: 0.032,
      company_name: 'RDHN Commerce - SDK Test',
      company_phone: '+90 212 123 45 67',
      company_email: 'info@rdhncommerce.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('🔧 Resmi SDK config test ediliyor:', {
      testMode: officialSDKSettings.test_mode,
      hasApiKey: !!officialSDKSettings.api_key,
      hasSecretKey: !!officialSDKSettings.secret_key,
      apiKeyPrefix: officialSDKSettings.api_key.substring(0, 15) + '...',
      secretKeyPrefix: officialSDKSettings.secret_key.substring(0, 15) + '...'
    })

    // İyzico service oluştur
    const iyzicoService = new IyzicoService(officialSDKSettings)
    
    // API test connection yap
    const testResult = await iyzicoService.testConnection()
    
    console.log('📊 Resmi SDK test sonucu:', testResult)

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: '🎉 Resmi İyzico SDK Keys ile bağlantı başarılı!',
        data: {
          testResult,
          officialKeys: {
            apiKey: officialSDKSettings.api_key,
            secretKey: officialSDKSettings.secret_key.substring(0, 10) + '...',
            baseUrl: officialSDKSettings.sandbox_base_url
          },
          comparison: {
            ourImplementation: 'SDK-compatible auth headers',
            officialSDK: 'options.json keys working!',
            authMethod: 'SHA1 HMAC with IYZWS prefix',
            endpoint: 'GET /payment/test'
          },
          nextSteps: [
            'Resmi keys çalışıyor!',
            'Şimdi gerçek merchant hesabı almak gerekir',
            'Production için kendi API keys alınmalı'
          ]
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Resmi SDK keys ile test başarısız',
        message: testResult.data?.message || 'Bilinmeyen hata',
        data: {
          testResult,
          possibleCauses: [
            'Resmi keys geçersiz olmuş olabilir',
            'İyzico sandbox servisi down olabilir',
            'Auth header implementation problemi',
            'Network bağlantı sorunu'
          ],
          authImplementation: {
            method: 'SHA1 HMAC',
            format: 'IYZWS apiKey:hash',
            endpoint: 'GET /payment/test',
            headers: ['Authorization', 'x-iyzi-rnd', 'x-iyzi-client-version']
          }
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('💥 Resmi SDK Keys Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'SDK test failed',
      message: error.message || 'Resmi SDK test sırasında hata oluştu',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

/**
 * GET - SDK bilgileri ve test endpoint'leri
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Bu endpoint sadece GET method destekliyor',
    availableTests: {
      'GET /api/test/iyzico-official-sdk-test': 'Resmi SDK keys ile test',
      'GET /api/test/payment-simulator': 'Payment simulator bilgileri',
      'POST /api/test/payment-simulator': 'Test kartları ile ödeme simülasyonu'
    },
    officialSDKInfo: {
      source: 'commerce/iyzipay-node-master/samples/data/options.json',
      apiKey: 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI',
      baseUrl: 'https://sandbox-api.iyzipay.com',
      note: 'Bu resmi İyzico SDK örneklerinde kullanılan anahtarlardır'
    }
  })
} 