import { NextRequest, NextResponse } from 'next/server'
import { getIyzicoSettingsFromEnv, createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * Başarısız ödeme senaryolarını test eden endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const scenario = url.searchParams.get('scenario') || 'expired_card'
    
    // Test senaryoları
    const testScenarios = {
      expired_card: {
        cardNumber: '4543600000000006',
        expireMonth: '01', // Geçmiş ay
        expireYear: '2020', // Geçmiş yıl
        cvc: '123',
        description: 'Expired Card Test'
      },
      invalid_card: {
        cardNumber: '1111111111111111',
        expireMonth: '12',
        expireYear: '2025',
        cvc: '123',
        description: 'Invalid Card Number Test'
      },
      invalid_cvc: {
        cardNumber: '4543600000000006',
        expireMonth: '12',
        expireYear: '2025',
        cvc: '000',
        description: 'Invalid CVC Test'
      }
    }

    const testCard = testScenarios[scenario as keyof typeof testScenarios] || testScenarios.expired_card

    console.log(`🧪 Testing failure scenario: ${testCard.description}`)

    // Environment settings
    const settings = getIyzicoSettingsFromEnv()
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'İyzico ayarları bulunamadı'
      })
    }

    // İyzico service
    const iyzicoService = createIyzicoService(settings)
    const conversationId = `test_failure_${Date.now()}`
    const orderNumber = `FAIL_TEST_${Date.now()}`

    // Test payment data - CreatePaymentRequest interface'ine uygun format
    const paymentData = {
      orderNumber,
      amount: 25.00,
      currency: 'TRY' as const,
      installment: 1,
      userId: `test_buyer_${Date.now()}`,
      basketItems: [{
        id: 'failure_test_item',
        name: 'Failure Test Product',
        category: 'Test',
        price: 25.00
      }],
      buyer: {
        name: 'Test',
        surname: 'Failure',
        email: 'test.failure@example.com',
        phone: '+905555555555',
        identityNumber: '11111111111',
        address: 'Test Failure Address',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      billingAddress: {
        contactName: 'Test Failure',
        address: 'Test Failure Address',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      shippingAddress: {
        contactName: 'Test Failure',
        address: 'Test Failure Address',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000'
      },
      card: {
        cardHolderName: 'TEST FAILURE',
        cardNumber: testCard.cardNumber,
        expireMonth: testCard.expireMonth,
        expireYear: testCard.expireYear,
        cvc: testCard.cvc,
        saveCard: false
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/iyzico/callback`,
      userAgent: 'FailureTestAgent/1.0',
      ipAddress: '127.0.0.1'
    }

    console.log('🚀 Starting failure test with data:', {
      scenario: testCard.description,
      cardNumber: testCard.cardNumber.substring(0, 6) + '****' + testCard.cardNumber.substring(12),
      expiry: `${testCard.expireMonth}/${testCard.expireYear}`,
      conversationId,
      orderNumber
    })

    // Test 3D Secure payment
    const result = await iyzicoService.initiate3DSecurePayment(paymentData)
    
    return NextResponse.json({
      success: true,
      scenario: testCard.description,
      conversationId,
      orderNumber,
      testCard: {
        cardNumber: testCard.cardNumber.substring(0, 6) + '****' + testCard.cardNumber.substring(12),
        expiry: `${testCard.expireMonth}/${testCard.expireYear}`,
        cvc: testCard.cvc
      },
      result: {
        status: result.status,
        paymentId: result.paymentId,
        conversationId: result.conversationId,
        hasHtmlContent: !!result.threeDSHtmlContent,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage
      },
      message: result.status === 'success' 
        ? '3D Secure HTML content oluşturuldu - Browser\'da test edebilirsiniz'
        : `Hata: ${result.errorMessage || 'Bilinmeyen hata'}`
    })
    
  } catch (error: any) {
    console.error('❌ Failure test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Test sırasında hata oluştu',
      details: error
    })
  }
} 