import { NextRequest, NextResponse } from 'next/server'
import { getIyzicoSettingsFromEnv, createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * GET - İyzico 3D Secure Payment Test
 * Gerçek sandbox anahtarları ile 3D Secure ödeme testi
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 İyzico 3D Secure Test başlatılıyor...')

    // URL parametreleri
    const url = new URL(request.url)
    const amount = parseFloat(url.searchParams.get('amount') || '10.00')
    const cardNumber = url.searchParams.get('card') || '4543600000000006' // Default: Visa test card

    // Environment variables kontrolü
    const settings = getIyzicoSettingsFromEnv()
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'İyzico ayarları bulunamadı',
        message: 'Environment variables kontrolü yapın'
      })
    }

    console.log('🔧 3D Secure test config:', {
      testMode: settings.test_mode,
      baseUrl: settings.test_mode ? settings.sandbox_base_url : settings.production_base_url,
      amount,
      cardNumber: cardNumber.substring(0, 6) + '****' + cardNumber.slice(-4)
    })

    // İyzico service oluştur
    const service = createIyzicoService(settings)

    // Test ödeme request'i oluştur
    const paymentRequest = {
      orderNumber: `test_order_${Date.now()}`,
      amount: amount,
      currency: 'TRY' as const,
      installment: 1,
      card: {
        cardHolderName: 'Test User',
        cardNumber: cardNumber,
        expireMonth: '12',
        expireYear: '25',
        cvc: '123',
        saveCard: false
      },
      buyer: {
        id: 'test_buyer_123',
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        phone: '+905555555555',
        identityNumber: '11111111111',
        address: 'Test Address, İstanbul',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: 'Test User',
        address: 'Test Shipping Address, İstanbul',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      billingAddress: {
        contactName: 'Test User',
        address: 'Test Billing Address, İstanbul',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      basketItems: [
        {
          id: 'test_product_1',
          name: 'Test Ürün',
          category: 'Test Kategori',
          price: amount
        }
      ],
      userId: 'test_user_123',
      userAgent: request.headers.get('user-agent') || 'Test Browser',
      ipAddress: '127.0.0.1',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/iyzico/callback`
    }

    console.log('💳 3D Secure payment başlatılıyor:', {
      orderNumber: paymentRequest.orderNumber,
      amount: paymentRequest.amount,
      cardType: cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Unknown'
    })

    // 3D Secure ödeme başlat
    const paymentResult = await service.initiate3DSecurePayment(paymentRequest)

    console.log('📊 3D Secure payment result:', {
      success: paymentResult.success,
      hasHtmlContent: !!paymentResult.htmlContent,
      paymentId: paymentResult.paymentId,
      conversationId: paymentResult.conversationId
    })

    if (paymentResult.success && paymentResult.htmlContent) {
      // Başarılı 3DS initialization
      return NextResponse.json({
        success: true,
        message: '🚀 3D Secure ödeme başarıyla başlatıldı!',
        data: {
          paymentId: paymentResult.paymentId,
          conversationId: paymentResult.conversationId,
          orderNumber: paymentRequest.orderNumber,
          amount: paymentRequest.amount,
          testInfo: {
            cardUsed: cardNumber.substring(0, 6) + '****' + cardNumber.slice(-4),
            cardType: cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Unknown',
            environment: settings.test_mode ? 'Sandbox' : 'Production',
            testMode: settings.test_mode
          },
          nextSteps: [
            '3D Secure sayfası HTML content\'i alındı',
            'Browser\'da görüntülemek için /api/test/iyzico-3d-page endpoint\'ini kullanın',
            'Callback URL: ' + paymentRequest.callbackUrl
          ]
        },
        // 3DS HTML content'i ayrı endpoint'te göstereceğiz
        threeDSPageUrl: `/api/test/iyzico-3d-page?paymentId=${paymentResult.paymentId}&conversationId=${paymentResult.conversationId}`
      })
    } else {
      // 3DS initialization başarısız
      return NextResponse.json({
        success: false,
        error: '3D Secure ödeme başlatılamadı',
        details: {
          errorCode: paymentResult.errorCode,
          errorMessage: paymentResult.errorMessage,
          conversationId: paymentResult.conversationId,
          orderNumber: paymentRequest.orderNumber
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('💥 3D Secure test error:', error)

    return NextResponse.json({
      success: false,
      error: '3D Secure test failed',
      message: error.message,
      details: error
    }, { status: 500 })
  }
} 