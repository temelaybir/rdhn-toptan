import { NextRequest, NextResponse } from 'next/server'
import { createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * POST - İyzico checkout form endpoint ile test (SDK example'dan)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 İyzico Checkout Form Test: SDK örneğindeki checkout form ile test başlatılıyor...')

    const body = await request.json()
    const { cardNumber = '5890040000000016', amount = 1.0, orderNumber } = body

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

    // İyzico service oluştur (resmi keys ile)
    const iyzicoService = createIyzicoService(officialSettings)

    // SDK test dosyasındaki EXACT checkout form request
    const checkoutFormRequest = {
      locale: 'tr',
      conversationId: '123456789',
      price: amount.toFixed(1), // SDK'da "1.0" formatında
      basketId: 'B67832',
      paymentGroup: 'PRODUCT',
      
      buyer: {
        id: 'BY789',
        name: 'John',
        surname: 'Doe',
        identityNumber: '74300864791',
        email: 'email@email.com',
        gsmNumber: '+905350000000',
        registrationDate: '2013-04-21 15:12:09',
        lastLoginDate: '2015-10-05 12:43:35',
        registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732',
        ip: '85.34.78.112'
      },
      
      shippingAddress: {
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34742',
        contactName: 'Jane Doe',
        city: 'Istanbul',
        country: 'Turkey'
      },
      
      billingAddress: {
        address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
        zipCode: '34742',
        contactName: 'Jane Doe',
        city: 'Istanbul',
        country: 'Turkey'
      },
      
      basketItems: [
        {
          id: 'BI101',
          price: '0.3',
          name: 'Binocular',
          category1: 'Collectibles',
          category2: 'Accessories',
          itemType: 'PHYSICAL'
        },
        {
          id: 'BI102',
          price: '0.5',
          name: 'Game code',
          category1: 'Game',
          category2: 'Online Game Items',
          itemType: 'VIRTUAL'
        },
        {
          id: 'BI103',
          name: 'Usb',
          price: '0.2',
          category1: 'Electronics',
          category2: 'Usb / Cable',
          itemType: 'PHYSICAL'
        }
      ],
      
      enabledInstallments: [1, 2, 3, 6, 9],
      callbackUrl: 'https://www.merchant.com/callback',
      currency: 'TRY',
      paidPrice: '1.2'
    }

    console.log('📤 Checkout form request (SDK exact):', {
      conversationId: checkoutFormRequest.conversationId,
      price: checkoutFormRequest.price,
      endpoint: '/payment/iyzipos/checkoutform/initialize/auth/ecom',
      basketItemsCount: checkoutFormRequest.basketItems.length
    })

    // Checkout form API call (SDK'daki endpoint)
    const result = await iyzicoService.makeRequest('/payment/iyzipos/checkoutform/initialize/auth/ecom', checkoutFormRequest)

    console.log('📊 Checkout form result:', result)

    if (result.status === 'success') {
      return NextResponse.json({
        success: true,
        message: 'İyzico checkout form başarılı! 🎉',
        data: {
          result,
          testInfo: {
            endpoint: '/payment/iyzipos/checkoutform/initialize/auth/ecom',
            method: 'Checkout Form',
            officialKeys: true,
            sdkExample: true
          },
          checkoutInfo: {
            token: result.token,
            checkoutFormContent: result.checkoutFormContent,
            paymentPageUrl: result.paymentPageUrl
          },
          instructions: {
            step1: 'checkoutFormContent\'i iframe\'de render edin',
            step2: 'Kullanıcı ödeme bilgilerini girecek',
            step3: 'Callback URL\'e yönlendirilecek',
            step4: 'Token ile payment durumunu kontrol edin'
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Checkout form failed',
        message: result.errorMessage || 'Checkout form başarısız',
        data: {
          result,
          testInfo: {
            endpoint: '/payment/iyzipos/checkoutform/initialize/auth/ecom',
            method: 'Checkout Form',
            officialKeys: true,
            sdkExample: true
          },
          troubleshooting: result.errorCode === '1001' 
            ? 'SDK örneği bile çalışmıyor - İyzico hesap/anahtar problemi olabilir'
            : `İyzico API hatası: ${result.errorCode} - ${result.errorMessage}`
        }
      })
    }

  } catch (error: any) {
    console.error('💥 İyzico Checkout Form Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Checkout form test failed',
      message: error.message || 'Checkout form test başarısız',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name
      }
    }, { status: 500 })
  }
} 