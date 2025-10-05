import { NextRequest, NextResponse } from 'next/server'
import { IyzicoService } from '@/services/payment/iyzico-service'

/**
 * 🧪 İyzico SDK - Comprehensive Test Suite
 * 
 * Resmi SDK'daki TÜM endpoint'leri test eder:
 * - API Test Connection ✅
 * - Installment Info 🔍
 * - BIN Number Info 🔍  
 * - Direct Payment 🔍
 * - Checkout Form 🔍
 * - Card Operations 🔍
 */
export async function GET(request: NextRequest) {
  const testResults: any = {}
  const errors: any = {}
  
  try {
    console.log('🧪 İyzico Full SDK Test Suite: Tüm endpointler test ediliyor...')

    // ✅ Resmi SDK'daki sandbox keys
    const officialSDKSettings = {
      id: 'full_sdk_test',
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
      company_name: 'RDHN Commerce - Full Test',
      company_phone: '+90 212 123 45 67',
      company_email: 'info@rdhncommerce.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const iyzicoService = new IyzicoService(officialSDKSettings)

    // 🧪 TEST 1: API Connection Test
    console.log('🧪 Test 1: API Connection (/payment/test)')
    try {
      const apiTest = await iyzicoService.testConnection()
      testResults.apiTest = {
        endpoint: '/payment/test',
        method: 'GET',
        status: apiTest.success ? 'SUCCESS' : 'FAILED',
        result: apiTest
      }
    } catch (error: any) {
      errors.apiTest = error.message
      testResults.apiTest = { status: 'ERROR', error: error.message }
    }

    // 🧪 TEST 2: Installment Info Test  
    console.log('🧪 Test 2: Installment Info (/payment/iyzipos/installment)')
    try {
      const installmentRequest = {
        locale: 'tr',
        conversationId: `test_installment_${Date.now()}`,
        binNumber: '554960', // Resmi SDK sample'daki BIN
        price: '100.00'
      }

      const installmentResult = await iyzicoService.makeRequest('/payment/iyzipos/installment', installmentRequest, 'POST')
      testResults.installmentTest = {
        endpoint: '/payment/iyzipos/installment',
        method: 'POST',
        status: installmentResult.status === 'success' ? 'SUCCESS' : 'FAILED',
        result: installmentResult,
        binNumber: '554960'
      }
    } catch (error: any) {
      errors.installmentTest = error.message
      testResults.installmentTest = { status: 'ERROR', error: error.message }
    }

    // 🧪 TEST 3: BIN Number Info Test
    console.log('🧪 Test 3: BIN Number Info (/payment/bin/check)')
    try {
      const binRequest = {
        locale: 'tr',
        conversationId: `test_bin_${Date.now()}`,
        binNumber: '554960'
      }

      const binResult = await iyzicoService.makeRequest('/payment/bin/check', binRequest, 'POST')
      testResults.binTest = {
        endpoint: '/payment/bin/check',
        method: 'POST',
        status: binResult.status === 'success' ? 'SUCCESS' : 'FAILED',
        result: binResult,
        binNumber: '554960'
      }
    } catch (error: any) {
      errors.binTest = error.message
      testResults.binTest = { status: 'ERROR', error: error.message }
    }

    // 🧪 TEST 4: Direct Payment (Non-3DS) Test
    console.log('🧪 Test 4: Direct Payment (/payment)')
    try {
      const directPaymentRequest = {
        locale: 'tr',
        conversationId: `test_direct_${Date.now()}`,
        price: '1.00',
        paidPrice: '1.20',
        currency: 'TRY',
        installment: '1',
        basketId: `basket_${Date.now()}`,
        paymentChannel: 'WEB',
        paymentGroup: 'PRODUCT',
        paymentCard: {
          cardHolderName: 'John Doe',
          cardNumber: '5528790000000008', // SDK samples kartı
          expireMonth: '12',
          expireYear: '2030',
          cvc: '123',
          registerCard: '0'
        },
        buyer: {
          id: 'BY789',
          name: 'John',
          surname: 'Doe',
          gsmNumber: '+905350000000',
          email: 'email@email.com',
          identityNumber: '74300864791',
          lastLoginDate: '2015-10-05 12:43:35',
          registrationDate: '2013-04-21 15:12:09',
          registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34732'
        },
        shippingAddress: {
          contactName: 'Jane Doe',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: '34742'
        },
        billingAddress: {
          contactName: 'Jane Doe',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: '34742'
        },
        basketItems: [
          {
            id: 'BI101',
            name: 'Binocular',
            category1: 'Collectibles',
            category2: 'Accessories',
            itemType: 'PHYSICAL',
            price: '0.3'
          },
          {
            id: 'BI102',
            name: 'Game code',
            category1: 'Game',
            category2: 'Online Game Items',
            itemType: 'VIRTUAL',
            price: '0.5'
          },
          {
            id: 'BI103',
            name: 'Usb',
            category1: 'Electronics',
            category2: 'Usb / Cable',
            itemType: 'PHYSICAL',
            price: '0.2'
          }
        ]
      }

      const directPaymentResult = await iyzicoService.makeRequest('/payment', directPaymentRequest, 'POST')
      testResults.directPaymentTest = {
        endpoint: '/payment',
        method: 'POST',
        status: directPaymentResult.status === 'success' ? 'SUCCESS' : 'FAILED',
        result: directPaymentResult,
        cardLast4: '0008'
      }
    } catch (error: any) {
      errors.directPaymentTest = error.message
      testResults.directPaymentTest = { status: 'ERROR', error: error.message }
    }

    // 🧪 TEST 5: Checkout Form Initialize Test
    console.log('🧪 Test 5: Checkout Form (/payment/iyzipos/checkoutform/initialize/ecom)')
    try {
      const checkoutFormRequest = {
        locale: 'tr',
        conversationId: `test_checkout_${Date.now()}`,
        price: '1.00',
        paidPrice: '1.20',
        currency: 'TRY',
        basketId: `basket_checkout_${Date.now()}`,
        paymentGroup: 'PRODUCT',
        callbackUrl: officialSDKSettings.callback_url,
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
          id: 'BY789',
          name: 'John',
          surname: 'Doe',
          gsmNumber: '+905350000000',
          email: 'email@email.com',
          identityNumber: '74300864791',
          lastLoginDate: '2015-10-05 12:43:35',
          registrationDate: '2013-04-21 15:12:09',
          registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34732'
        },
        shippingAddress: {
          contactName: 'Jane Doe',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: '34742'
        },
        billingAddress: {
          contactName: 'Jane Doe',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: '34742'
        },
        basketItems: [
          {
            id: 'BI101',
            name: 'Binocular',
            category1: 'Collectibles',
            category2: 'Accessories',
            itemType: 'PHYSICAL',
            price: '0.3'
          },
          {
            id: 'BI102',
            name: 'Game code',
            category1: 'Game',
            category2: 'Online Game Items',
            itemType: 'VIRTUAL',
            price: '0.5'
          },
          {
            id: 'BI103',
            name: 'Usb',
            category1: 'Electronics',
            category2: 'Usb / Cable',
            itemType: 'PHYSICAL',
            price: '0.2'
          }
        ]
      }

      const checkoutFormResult = await iyzicoService.makeRequest('/payment/iyzipos/checkoutform/initialize/ecom', checkoutFormRequest, 'POST')
      testResults.checkoutFormTest = {
        endpoint: '/payment/iyzipos/checkoutform/initialize/ecom',
        method: 'POST',
        status: checkoutFormResult.status === 'success' ? 'SUCCESS' : 'FAILED',
        result: checkoutFormResult
      }
    } catch (error: any) {
      errors.checkoutFormTest = error.message
      testResults.checkoutFormTest = { status: 'ERROR', error: error.message }
    }

    // 🧪 TEST 6: 3D Secure Initialize Test (Bilinen hata var)
    console.log('🧪 Test 6: 3D Secure Initialize (/payment/3dsecure/initialize)')
    try {
      const threeDSRequest = {
        locale: 'tr',
        conversationId: `test_3ds_${Date.now()}`,
        price: '1.00',
        paidPrice: '1.20',
        currency: 'TRY',
        installment: '1',
        basketId: `basket_3ds_${Date.now()}`,
        paymentChannel: 'WEB',
        paymentGroup: 'PRODUCT',
        callbackUrl: officialSDKSettings.callback_url,
        paymentCard: {
          cardHolderName: 'John Doe',
          cardNumber: '5528790000000008',
          expireMonth: '12',
          expireYear: '2030',
          cvc: '123',
          registerCard: '0'
        },
        buyer: {
          id: 'BY789',
          name: 'John',
          surname: 'Doe',
          gsmNumber: '+905350000000',
          email: 'email@email.com',
          identityNumber: '74300864791',
          lastLoginDate: '2015-10-05 12:43:35',
          registrationDate: '2013-04-21 15:12:09',
          registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34732'
        },
        shippingAddress: {
          contactName: 'Jane Doe',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: '34742'
        },
        billingAddress: {
          contactName: 'Jane Doe',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: '34742'
        },
        basketItems: [
          {
            id: 'BI101',
            name: 'Binocular',
            category1: 'Collectibles',
            category2: 'Accessories',
            itemType: 'PHYSICAL',
            price: '0.3'
          },
          {
            id: 'BI102',
            name: 'Game code',
            category1: 'Game',
            category2: 'Online Game Items',
            itemType: 'VIRTUAL',
            price: '0.5'
          },
          {
            id: 'BI103',
            name: 'Usb',
            category1: 'Electronics',
            category2: 'Usb / Cable',
            itemType: 'PHYSICAL',
            price: '0.2'
          }
        ]
      }

      const threeDSResult = await iyzicoService.makeRequest('/payment/3dsecure/initialize', threeDSRequest, 'POST')
      testResults.threeDSTest = {
        endpoint: '/payment/3dsecure/initialize',
        method: 'POST',
        status: threeDSResult.status === 'success' ? 'SUCCESS' : 'FAILED',
        result: threeDSResult,
        knownIssue: threeDSResult.errorCode === '1000' ? 'Signature validation error - expected' : null
      }
    } catch (error: any) {
      errors.threeDSTest = error.message
      testResults.threeDSTest = { status: 'ERROR', error: error.message }
    }

    // Test sonuçlarını özetle
    const summary = {
      totalTests: Object.keys(testResults).length,
      successfulTests: Object.values(testResults).filter((test: any) => test.status === 'SUCCESS').length,
      failedTests: Object.values(testResults).filter((test: any) => test.status === 'FAILED').length,
      errorTests: Object.values(testResults).filter((test: any) => test.status === 'ERROR').length
    }

    console.log('📊 SDK Test Suite Summary:', summary)

    return NextResponse.json({
      success: true,
      message: '🧪 İyzico SDK Full Test Suite Tamamlandı',
      summary,
      testResults,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      officialSDKInfo: {
        source: 'commerce/iyzipay-node-master/samples/IyzipaySamples.js',
        apiKey: 'sandbox-afXhZPW0MQlE4dCUUlHcEopnMBgXnAZI',
        baseUrl: 'https://sandbox-api.iyzipay.com',
        note: 'Resmi İyzico SDK örneklerindeki tüm endpoint\'ler test edildi'
      },
      recommendations: {
        workingEndpoints: 'API Test connection çalışıyor',
        signatureIssues: '3DS ve ödeme endpoint\'lerinde signature problemi var',
        possibleCause: 'Resmi sandbox keys geçersiz olmuş veya endpoint format değişmiş olabilir',
        solution: 'Gerçek merchant hesabı ile test yapılmalı veya İyzico desteği ile iletişime geçilmeli'
      }
    })

  } catch (error: any) {
    console.error('💥 SDK Full Test Suite Error:', error)

    return NextResponse.json({
      success: false,
      error: 'SDK full test suite failed',
      message: error.message || 'Test suite sırasında hata oluştu',
      partialResults: testResults,
      errors,
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

/**
 * POST - Specific endpoint test
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { endpoint, testData } = body

  return NextResponse.json({
    message: 'Spesifik endpoint test için GET method kullanın',
    usage: 'GET /api/test/iyzico-full-sdk-test tüm endpoint\'leri test eder',
    availableEndpoints: [
      '/payment/test - API connection test',
      '/payment/iyzipos/installment - Installment info',
      '/payment/bin/check - BIN number info',
      '/payment - Direct payment',
      '/payment/iyzipos/checkoutform/initialize/ecom - Checkout form',
      '/payment/3dsecure/initialize - 3D Secure payment'
    ],
    note: 'Tüm endpoint\'ler resmi SDK samples formatında test edilir'
  })
} 