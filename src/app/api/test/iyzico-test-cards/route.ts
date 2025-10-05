import { NextRequest, NextResponse } from 'next/server'
import { getIyzicoSettingsFromEnv, createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * Test Multiple Cards - İyzico Test Kartları
 */
export async function GET(request: NextRequest) {
  try {
    // İyzico test kartları listesi
    const testCards = [
      { name: 'Visa Test Card 1', number: '4543600000000006', type: 'Visa' },
      { name: 'Visa Test Card 2', number: '4766620000000001', type: 'Visa' },
      { name: 'Mastercard Test Card 1', number: '5528790000000008', type: 'Mastercard' },
      { name: 'Mastercard Test Card 2', number: '5400010000000004', type: 'Mastercard' },
      { name: 'Mastercard Test Card 3', number: '5170410000000004', type: 'Mastercard' },
      { name: 'American Express', number: '374200000000004', type: 'Amex' },
      { name: 'Troy Card', number: '9792030394740145', type: 'Troy' }
    ]

    const settings = getIyzicoSettingsFromEnv()
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'İyzico ayarları bulunamadı'
      })
    }

    const service = createIyzicoService(settings)
    const cardResults: any[] = []

    console.log('🧪 Multiple test cards testing başlatılıyor...')

    // Her kart için test yap
    for (const testCard of testCards) {
      try {
        console.log(`💳 Testing ${testCard.name}: ${testCard.number.substring(0, 6)}****${testCard.number.slice(-4)}`)

        const testData = {
          orderNumber: `card_test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          amount: 1.00, // Minimum test amount
          currency: 'TRY' as const,
          installment: 1,
          card: {
            cardHolderName: 'Test User',
            cardNumber: testCard.number,
            expireMonth: '12',
            expireYear: '25',
            cvc: '123',
            saveCard: false
          },
          buyer: {
            id: `test_buyer_${Date.now()}`,
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            phone: '+905555555555',
            identityNumber: '11111111111',
            address: 'Test Address',
            city: 'İstanbul',
            country: 'Turkey',
            zipCode: '34000'
          },
          shippingAddress: {
            contactName: 'Test User',
            address: 'Test Address',
            city: 'İstanbul',
            country: 'Turkey',
            zipCode: '34000'
          },
          billingAddress: {
            contactName: 'Test User',
            address: 'Test Address',
            city: 'İstanbul',
            country: 'Turkey',
            zipCode: '34000'
          },
          basketItems: [
            {
              id: `test_product_${Date.now()}`,
              name: 'Test Product',
              category: 'Test',
              price: 1.00
            }
          ],
          userId: `test_user_${Date.now()}`,
          userAgent: 'Card Test',
          ipAddress: '127.0.0.1',
          callbackUrl: 'http://localhost:3000/api/payment/iyzico/callback'
        }

        const paymentResult = await service.initiate3DSecurePayment(testData)

        cardResults.push({
          card: {
            name: testCard.name,
            number: testCard.number.substring(0, 6) + '****' + testCard.number.slice(-4),
            type: testCard.type
          },
          result: {
            success: paymentResult.success,
            hasPaymentId: !!paymentResult.paymentId,
            hasHtmlContent: !!paymentResult.htmlContent,
            errorCode: paymentResult.errorCode,
            errorMessage: paymentResult.errorMessage,
            conversationId: paymentResult.conversationId
          }
        })

        console.log(`📊 ${testCard.name} result:`, {
          success: paymentResult.success,
          errorCode: paymentResult.errorCode,
          errorMessage: paymentResult.errorMessage
        })

        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        cardResults.push({
          card: {
            name: testCard.name,
            number: testCard.number.substring(0, 6) + '****' + testCard.number.slice(-4),
            type: testCard.type
          },
          result: {
            success: false,
            error: true,
            errorMessage: error.message
          }
        })
      }
    }

    // Summary
    const successfulCards = cardResults.filter(r => r.result.success)
    const validCards = cardResults.filter(r => !r.result.errorCode || !['12', '14'].includes(r.result.errorCode))

    console.log('✅ Test cards summary:', {
      totalTested: cardResults.length,
      successful: successfulCards.length,
      validCards: validCards.length
    })

    return NextResponse.json({
      success: true,
      message: '🧪 Multiple Card Test Completed!',
      summary: {
        totalTested: cardResults.length,
        successful: successfulCards.length,
        validCards: validCards.length,
        testEnvironment: 'Sandbox'
      },
      cardResults,
      recommendation: successfulCards.length > 0 
        ? `✅ ${successfulCards.length} kart başarılı - Bu kartları kullanabilirsiniz`
        : validCards.length > 0
        ? `⚠️ Kartlar geçerli ama 3DS initialization gerekli`
        : `❌ Tüm kartlar geçersiz - Sandbox ayarlarını kontrol edin`
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Test cards failed',
      message: error.message
    }, { status: 500 })
  }
} 