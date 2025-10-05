import { NextRequest, NextResponse } from 'next/server'
import { createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * POST - İyzico direct payment endpoint (/payment/auth) ile test
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 İyzico Direct Payment Test: /payment/auth endpoint ile test başlatılıyor...')

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

    // İyzico service oluştur (resmi keys ile)
    const iyzicoService = createIyzicoService(officialSettings)

    // Direct payment request (SDK'nın formatına uygun)
    const paymentRequest = {
      locale: 'tr',
      conversationId: `direct_test_${Date.now()}`,
      price: amount.toFixed(2),
      paidPrice: amount.toFixed(2),
      installment: 1,
      paymentChannel: 'WEB',
      basketId: `basket_${Date.now()}`,
      paymentGroup: 'PRODUCT',
      
      paymentCard: {
        cardHolderName: 'John Doe',
        cardNumber: cardNumber,
        expireYear: '2030',
        expireMonth: '12',
        cvc: '123',
        registerCard: 0
      },
      
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
          price: (amount * 0.3).toFixed(2),
          name: 'Binocular',
          category1: 'Collectibles',
          category2: 'Accessories',
          itemType: 'PHYSICAL'
        },
        {
          id: 'BI102',
          price: (amount * 0.5).toFixed(2),
          name: 'Game code',
          category1: 'Game',
          category2: 'Online Game Items',
          itemType: 'VIRTUAL'
        },
        {
          id: 'BI103',
          price: (amount * 0.2).toFixed(2),
          name: 'Usb',
          category1: 'Electronics',
          category2: 'Usb / Cable',
          itemType: 'PHYSICAL'
        }
      ],
      
      currency: 'TRY'
    }

    console.log('📤 Direct payment request:', {
      conversationId: paymentRequest.conversationId,
      price: paymentRequest.price,
      endpoint: '/payment/auth',
      cardLast4: cardNumber.slice(-4),
      basketItemsCount: paymentRequest.basketItems.length
    })

    // Direct payment API call
    const result = await iyzicoService.makeRequest('/payment/auth', paymentRequest)

    console.log('📊 Direct payment result:', result)

    if (result.status === 'success') {
      return NextResponse.json({
        success: true,
        message: 'İyzico direct payment başarılı! 🎉',
        data: {
          result,
          testInfo: {
            cardNumber: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
            endpoint: '/payment/auth',
            method: 'Direct Payment',
            officialKeys: true
          },
          paymentInfo: {
            paymentId: result.paymentId,
            status: result.status,
            fraudStatus: result.fraudStatus,
            basketItems: result.basketItems
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Direct payment failed',
        message: result.errorMessage || 'Direct payment başarısız',
        data: {
          result,
          testInfo: {
            cardNumber: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
            endpoint: '/payment/auth',
            method: 'Direct Payment',
            officialKeys: true
          },
          troubleshooting: result.errorCode === '1001' 
            ? 'Auth header problemi devam ediyor'
            : `İyzico API hatası: ${result.errorCode} - ${result.errorMessage}`
        }
      })
    }

  } catch (error: any) {
    console.error('💥 İyzico Direct Payment Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Direct payment test failed',
      message: error.message || 'Direct payment test başarısız',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name
      }
    }, { status: 500 })
  }
} 