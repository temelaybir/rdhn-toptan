import { NextRequest, NextResponse } from 'next/server'
import { IyzicoService, getIyzicoSettingsFromEnv } from '@/services/payment/iyzico-service'

/**
 * 🏢 İyzico Production API Test
 * 
 * Gerçek production keys ile İyzico API'yi test eder
 * Test Mode: false - Production environment
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🏢 İyzico Production Test: Gerçek API keys ile test başlatılıyor...')

    // Production environment settings
    const productionSettings = getIyzicoSettingsFromEnv()
    
    if (!productionSettings) {
      return NextResponse.json({
        success: false,
        error: 'Production Iyzico settings not found',
        message: 'Environment variables veya database\'den Iyzico ayarları alınamadı',
        debug: {
          envCheck: {
            hasApiKey: !!process.env.IYZICO_API_KEY,
            hasSecretKey: !!process.env.IYZICO_SECRET_KEY,
            testMode: process.env.IYZICO_TEST_MODE
          }
        }
      }, { status: 400 })
    }

    console.log('🔧 Production config:', {
      testMode: productionSettings.test_mode,
      hasApiKey: !!productionSettings.api_key,
      hasSecretKey: !!productionSettings.secret_key,
      apiKeyPrefix: productionSettings.api_key?.substring(0, 15) + '...',
      environment: productionSettings.test_mode ? 'Sandbox' : 'Production',
      baseUrl: productionSettings.test_mode ? productionSettings.sandbox_base_url : productionSettings.production_base_url
    })

    const iyzicoService = new IyzicoService(productionSettings)

    // Test 1: API Connection
    console.log('🧪 Production API Connection Test')
    const connectionTest = await iyzicoService.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Production API connection failed',
        result: connectionTest,
        environment: productionSettings.test_mode ? 'Sandbox' : 'Production'
      }, { status: 400 })
    }

    // Test 2: 3DS Payment Initialize (Production test kartı ile)
    console.log('🧪 Production 3DS Payment Test')
    
    const testCardNumber = productionSettings.test_mode 
      ? '5528790000000008' // Sandbox test kartı
      : '4766621234567890' // Production test kartı (mock-test-cards.md'den)

    const threeDSTest = await iyzicoService.initiate3DSecurePayment({
      orderNumber: `prod_test_${Date.now()}`,
      amount: 1.20,
      currency: 'TRY',
      userId: 'prod_test_customer',
      buyer: {
        name: 'Test',
        surname: 'Customer',
        email: 'test@rdhncommerce.com',
        phone: '+905551234567',
        identityNumber: '11111111111',
        address: 'Test Address',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      card: {
        cardHolderName: 'Test Customer',
        cardNumber: testCardNumber,
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        saveCard: false
      },
      basketItems: [
        {
          id: 'prod_test_item',
          name: 'Production Test Item',
          category: 'Test',
          price: 1.20
        }
      ],
      billingAddress: {
        contactName: 'Test Customer',
        address: 'Test Address',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: 'Test Customer',
        address: 'Test Address',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`
    })

    const summary = {
      environment: productionSettings.test_mode ? 'Sandbox' : 'Production',
      apiConnection: connectionTest.success ? 'SUCCESS' : 'FAILED',
      threeDSInitialize: threeDSTest.success ? 'SUCCESS' : 'FAILED',
      testCard: testCardNumber.substring(0, 4) + '****' + testCardNumber.slice(-4),
      errors: []
    }

    if (!connectionTest.success) {
      summary.errors.push('API connection failed')
    }
    
    if (!threeDSTest.success) {
      summary.errors.push(`3DS payment failed: ${threeDSTest.errorMessage || threeDSTest.error}`)
    }

    console.log('📊 Production Test Summary:', summary)

    return NextResponse.json({
      success: true,
      message: '🏢 Production İyzico API Test Tamamlandı',
      summary,
      results: {
        connectionTest,
        threeDSTest: {
          success: threeDSTest.success,
          conversationId: threeDSTest.conversationId,
          redirectUrl: threeDSTest.threeDSecureHtmlContent ? 'HTML Content Ready' : null,
          errorMessage: threeDSTest.errorMessage || null,
          errorCode: threeDSTest.errorCode || null
        }
      },
      productionInfo: {
        environment: productionSettings.test_mode ? 'Sandbox Mode' : 'Production Mode',
        apiEndpoint: productionSettings.test_mode ? productionSettings.sandbox_base_url : productionSettings.production_base_url,
        testCard: testCardNumber.substring(0, 4) + '****' + testCardNumber.slice(-4),
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`
      },
      nextSteps: threeDSTest.success ? [
        'Test kartı ile 3DS flow tamamla',
        'Başarılı sipariş ekranını test et',
        'Tüm test kartları ile test yap'
      ] : [
        'API key/secret doğruluğunu kontrol et',
        'İyzico merchant hesap durumunu kontrol et',
        'Test/Production mode ayarını kontrol et'
      ]
    })

  } catch (error: any) {
    console.error('💥 Production Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Production test failed',
      message: error.message || 'Production test sırasında hata oluştu',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

/**
 * POST - Manual production test with custom data
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { testCard, amount, customSettings } = body

  return NextResponse.json({
    message: 'Manual production test yapılacaksa özel parametreler gönderebilirsiniz',
    usage: 'POST with: { testCard: "4766621234567890", amount: 10.50, customSettings: {...} }',
    note: 'GET endpoint standart production testleri yapar'
  })
} 