import { NextRequest, NextResponse } from 'next/server'
import { createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * POST - Resmi İyzico test anahtarları ile test kartı ödeme testi
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 İyzico Official Cards Test: Resmi test anahtarları ile ödeme başlatılıyor...')

    const body = await request.json()
    const { cardNumber = '5890040000000016', amount = 25.50, orderNumber } = body

    // İyzico'nun resmi sandbox test anahtarları (dokümantasyondan)
    const officialSettings = {
      test_mode: true,
      api_key: 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t',
      secret_key: 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB',
      sandbox_api_key: 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t',
      sandbox_secret_key: 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`,
      default_currency: 'TRY',
      force_3d_secure: true
    }

    console.log('🔧 Official test config:', {
      testMode: officialSettings.test_mode,
      apiKeyPrefix: officialSettings.api_key.substring(0, 15) + '...',
      secretKeyPrefix: officialSettings.secret_key.substring(0, 15) + '...'
    })

    // İyzico service oluştur (resmi keys ile)
    const iyzicoService = createIyzicoService(officialSettings)

    // Test ödeme request'i oluştur
    const paymentRequest = {
      orderNumber: orderNumber || `official_test_${Date.now()}`,
      amount,
      currency: 'TRY',
      callbackUrl: officialSettings.callback_url,
      
      card: {
        cardHolderName: 'John Doe',
        cardNumber: cardNumber,
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123',
        saveCard: false
      },
      
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
      
      shippingAddress: {
        contactName: 'Jane Doe',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34742'
      },
      
      billingAddress: {
        contactName: 'Jane Doe',
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34742'
      },
      
      basketItems: [
        {
          id: 'BI101',
          name: 'Binocular',
          category: 'Collectibles',
          price: amount * 0.3
        },
        {
          id: 'BI102',
          name: 'Game code',
          category: 'Game',
          price: amount * 0.5
        },
        {
          id: 'BI103',
          name: 'Usb',
          category: 'Electronics',
          price: amount * 0.2
        }
      ],
      
      userId: 'BY789',
      userAgent: request.headers.get('user-agent') || 'test-browser',
      ipAddress: '85.34.78.112'
    }

    console.log('📤 Official test ödeme request:', {
      orderNumber: paymentRequest.orderNumber,
      amount: paymentRequest.amount,
      cardLast4: cardNumber.slice(-4),
      basketItemsCount: paymentRequest.basketItems.length
    })

    // 3D Secure ödeme başlat
    const paymentResult = await iyzicoService.initiate3DSecurePayment(paymentRequest)

    if (paymentResult.success) {
      console.log('✅ Resmi test anahtarları ile ödeme başarıyla başlatıldı!')
      
      return NextResponse.json({
        success: true,
        message: 'Resmi İyzico test anahtarları ile 3D Secure ödeme başlatıldı! 🎉',
        data: {
          paymentResult,
          testInfo: {
            cardNumber: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
            officialKeys: true,
            testEnvironment: 'Official Sandbox'
          },
          instructions: {
            step1: 'threeDSHtmlContent\'i bir HTML sayfasında render edin',
            step2: '3D Secure doğrulamasını tamamlayın',
            step3: 'Callback URL\'e yönlendirileceksiniz',
            step4: 'Callback handler payment durumunu kontrol edecek'
          },
          htmlContentInfo: paymentResult.threeDSHtmlContent 
            ? `HTML content ${paymentResult.threeDSHtmlContent.length} karakter uzunluğunda`
            : 'HTML content bulunamadı'
        }
      })
    } else {
      console.log('❌ Resmi test anahtarları ile ödeme başlatılamadı:', paymentResult.errorMessage)
      
      return NextResponse.json({
        success: false,
        error: 'Official payment initialization failed',
        message: paymentResult.errorMessage || 'Resmi test anahtarları ile ödeme başlatılamadı',
        data: {
          paymentResult,
          testInfo: {
            cardNumber: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
            officialKeys: true,
            testEnvironment: 'Official Sandbox'
          },
          troubleshooting: paymentResult.errorCode === '1001' 
            ? 'Resmi test anahtarları da çalışmıyor - İyzico entegrasyon ayarlarında sorun olabilir'
            : `Hata kodu: ${paymentResult.errorCode} - ${paymentResult.errorMessage}`
        }
      })
    }

  } catch (error: any) {
    console.error('💥 İyzico Official Cards Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Official test failed',
      message: error.message || 'Resmi test anahtarları ile test başarısız',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name
      }
    }, { status: 500 })
  }
} 