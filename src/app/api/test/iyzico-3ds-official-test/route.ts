import { NextRequest, NextResponse } from 'next/server'
import { IyzicoService } from '@/services/payment/iyzico-service'

/**
 * 🔐 Resmi İyzico SDK Keys ile 3D Secure Payment Test
 * 
 * Test kartı: 5528790000000008 (Resmi SDK samples'da kullanılan)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Resmi SDK 3DS Test: İyzico resmi keys ile 3D Secure ödeme test başlatılıyor...')

    const body = await request.json()
    const { 
      cardNumber = '5528790000000008', // SDK samples'daki test kartı
      amount = 1.2, // SDK samples'daki amount
      orderNumber = `official_3ds_${Date.now()}`
    } = body

    // ✅ Resmi SDK'daki sandbox keys
    const officialSDKSettings = {
      id: 'official_3ds_test',
      is_active: true,
      test_mode: true,
      api_key: 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI',
      secret_key: 'sandbox-wbwpzKIiplZxI3hh5ALI4FJyAcZKL6kq',
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
      company_name: 'RDHN Commerce - 3DS Test',
      company_phone: '+90 212 123 45 67',
      company_email: 'info@rdhncommerce.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('🔧 Resmi SDK 3DS test konfigürasyonu:', {
      testMode: officialSDKSettings.test_mode,
      cardNumber: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
      amount,
      orderNumber
    })

    // İyzico service oluştur
    const iyzicoService = new IyzicoService(officialSDKSettings)
    
    // 3D Secure payment request (SDK samples formatında)
    const paymentRequest = {
      orderNumber,
      amount,
      currency: 'TRY' as const,
      installment: 1,
      callbackUrl: officialSDKSettings.callback_url,
      userId: 'test_user_sdk',
      
      // SDK samples'daki buyer data
      buyer: {
        name: 'John',
        surname: 'Doe',
        email: 'email@email.com',
        phone: '+905350000000',
        identityNumber: '74300864791',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732'
      },
      
      // SDK samples'daki shipping address
      shippingAddress: {
        contactName: 'Jane Doe',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34742'
      },
      
      // SDK samples'daki billing address
      billingAddress: {
        contactName: 'Jane Doe',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34742'
      },
      
      // SDK samples'daki card data
      card: {
        cardHolderName: 'John Doe',
        cardNumber: cardNumber,
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        saveCard: false
      },
      
      // SDK samples'daki basket items
      basketItems: [
        {
          id: 'BI101',
          name: 'Binocular',
          category: 'Collectibles',
          price: 0.3
        },
        {
          id: 'BI102', 
          name: 'Game code',
          category: 'Game',
          price: 0.5
        },
        {
          id: 'BI103',
          name: 'Usb',
          category: 'Electronics', 
          price: 0.4
        }
      ],
      
      userAgent: request.headers.get('user-agent') || 'Test-Agent',
      ipAddress: '85.34.78.112' // SDK samples'daki IP
    }

    console.log('📤 Resmi SDK 3DS payment request:', {
      orderNumber: paymentRequest.orderNumber,
      amount: paymentRequest.amount,
      cardLast4: paymentRequest.card.cardNumber.slice(-4),
      basketItemsCount: paymentRequest.basketItems.length,
      callbackUrl: paymentRequest.callbackUrl
    })

    // 3D Secure payment başlat
    const paymentResult = await iyzicoService.initiate3DSecurePayment(paymentRequest)
    
    console.log('📊 Resmi SDK 3DS payment result:', paymentResult)

    if (paymentResult.success) {
      return NextResponse.json({
        success: true,
        message: '🎉 Resmi SDK Keys ile 3D Secure başlatıldı!',
        data: {
          paymentResult,
          sdkCompatibility: {
            authHeaders: 'SHA1 HMAC working',
            endpoint: '/payment/3dsecure/initialize',
            testCard: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
            officialKeys: 'sandbox keys from options.json'
          },
          nextSteps: {
            step1: '3D Secure HTML sayfası render edilecek',
            step2: 'Test kartı ile ödeme onaylanacak',
            step3: 'Callback URL\'e yönlendirilecek',
            step4: 'Payment durumu kontrol edilecek'
          },
          instructions: {
            threeDSHtml: 'paymentResult.threeDSHtmlContent veya paymentPageUrl kullanın',
            callback: 'Ödeme sonrası callback handler çalışacak',
            verification: 'Payment ID ile doğrulama yapın'
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Resmi SDK 3DS başlatma başarısız',
        message: paymentResult.errorMessage || 'Bilinmeyen 3DS hatası',
        data: {
          paymentResult,
          errorAnalysis: {
            errorCode: paymentResult.errorCode,
            possibleCause: 
              paymentResult.errorCode === '1001' ? 'API keys problemi' :
              paymentResult.errorCode === '5074' ? 'Kart bilgisi hatalı' :
              paymentResult.errorCode === '5015' ? 'Geçersiz miktar' :
              'Bilinmeyen hata',
            recommendation:
              paymentResult.errorCode === '1001' ? 'API key/secret kontrolü' :
              paymentResult.errorCode === '5074' ? 'Kart numarası kontrolü' :
              'İyzico documentation kontrol et'
          },
          debugInfo: {
            testCard: cardNumber,
            amount,
            endpoint: '/payment/3dsecure/initialize',
            authMethod: 'SHA1 HMAC',
            officialKeys: true
          }
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('💥 Resmi SDK 3DS Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'SDK 3DS test failed',
      message: error.message || 'Resmi SDK 3DS test sırasında hata oluştu',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

/**
 * GET - Test bilgileri
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Resmi SDK 3D Secure Test Endpoint',
    usage: {
      method: 'POST',
      description: 'Resmi İyzico SDK keys ile 3D Secure ödeme testi',
      testCard: '5528790000000008 (SDK samples kartı)',
      amount: '1.2 (SDK samples amount)'
    },
    exampleRequest: {
      method: 'POST',
      body: {
        cardNumber: '5528790000000008',
        amount: 1.2,
        orderNumber: 'optional_custom_order'
      }
    },
    officialSDKInfo: {
      source: 'commerce/iyzipay-node-master/samples/IyzipaySamples.js',
      testCard: '5528790000000008',
      cardInfo: 'Test kartı - her zaman 3DS gerektirir',
      sampleAmount: '1.2 TRY',
      expectedResult: '3DS initialization veya card validation error'
    }
  })
} 