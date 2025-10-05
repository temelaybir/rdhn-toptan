import { NextRequest, NextResponse } from 'next/server'
import { getIyzicoSettingsFromEnv, createIyzicoService } from '@/services/payment/iyzico-service'

/**
 * Payment Debug - Step by Step Test
 */
export async function GET(request: NextRequest) {
  try {
    const debugSteps: any = {}

    // Step 1: Environment Check
    debugSteps.step1_environment = {
      hasApiKey: !!process.env.IYZICO_API_KEY,
      hasSecretKey: !!process.env.IYZICO_SECRET_KEY,
      testMode: process.env.IYZICO_TEST_MODE,
      baseUrl: process.env.IYZICO_BASE_URL
    }

    // Step 2: Settings Load
    try {
      const settings = getIyzicoSettingsFromEnv()
      debugSteps.step2_settings = {
        success: !!settings,
        testMode: settings?.test_mode,
        hasApiKey: !!(settings?.api_key || settings?.sandbox_api_key),
        hasSecretKey: !!(settings?.secret_key || settings?.sandbox_secret_key)
      }

      if (!settings) {
        throw new Error('Settings yüklenemedi')
      }

      // Step 3: Service Creation
      try {
        const service = createIyzicoService(settings)
        debugSteps.step3_service = {
          success: true,
          serviceCreated: !!service
        }

        // Step 4: Simple Test Data
        const testData = {
          orderNumber: `debug_${Date.now()}`,
          amount: 5.00,
          currency: 'TRY' as const,
          installment: 1,
          card: {
            cardHolderName: 'Test User',
            cardNumber: '4543600000000006',
            expireMonth: '12',
            expireYear: '25',
            cvc: '123',
            saveCard: false
          },
          buyer: {
            id: 'debug_buyer',
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
              id: 'debug_product',
              name: 'Debug Product',
              category: 'Test',
              price: 5.00
            }
          ],
          userId: 'debug_user',
          userAgent: 'Debug Test',
          ipAddress: '127.0.0.1',
          callbackUrl: 'http://localhost:3000/api/payment/iyzico/callback'
        }

        debugSteps.step4_testData = {
          success: true,
          orderNumber: testData.orderNumber,
          amount: testData.amount,
          cardNumber: testData.card.cardNumber.substring(0, 6) + '****' + testData.card.cardNumber.slice(-4)
        }

        // Step 5: 3D Secure Payment (with error handling)
        try {
          debugSteps.step5_paymentAttempt = {
            attempting: true,
            timestamp: new Date().toISOString()
          }

          const paymentResult = await service.initiate3DSecurePayment(testData)

          debugSteps.step5_paymentResult = {
            success: paymentResult.success,
            hasPaymentId: !!paymentResult.paymentId,
            hasHtmlContent: !!paymentResult.htmlContent,
            hasError: !!paymentResult.errorCode,
            errorCode: paymentResult.errorCode,
            errorMessage: paymentResult.errorMessage,
            conversationId: paymentResult.conversationId
          }

        } catch (paymentError: any) {
          debugSteps.step5_paymentError = {
            error: true,
            message: paymentError.message,
            stack: paymentError.stack?.substring(0, 200) + '...'
          }
        }

      } catch (serviceError: any) {
        debugSteps.step3_serviceError = {
          error: true,
          message: serviceError.message
        }
      }

    } catch (settingsError: any) {
      debugSteps.step2_settingsError = {
        error: true,
        message: settingsError.message
      }
    }

    return NextResponse.json({
      success: true,
      message: '🔍 Payment Debug Completed',
      debugSteps,
      summary: {
        environmentOk: debugSteps.step1_environment?.hasApiKey && debugSteps.step1_environment?.hasSecretKey,
        settingsOk: debugSteps.step2_settings?.success,
        serviceOk: debugSteps.step3_service?.success,
        paymentAttempted: !!debugSteps.step5_paymentAttempt,
        paymentResult: debugSteps.step5_paymentResult?.success || debugSteps.step5_paymentError?.error
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 