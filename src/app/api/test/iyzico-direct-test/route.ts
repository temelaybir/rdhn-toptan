import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import crypto from 'crypto'

/**
 * GET - İyzico Direct API Test
 * Auth header'ı direkt test etmek için
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.IYZICO_PRODUCTION_API_KEY
    const secretKey = process.env.IYZICO_PRODUCTION_SECRET_KEY
    const testMode = process.env.IYZICO_TEST_MODE === 'true' // Doğru logic
    
    if (!apiKey || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'API keys not found'
      }, { status: 400 })
    }

    console.log('🔧 Direct test başlatılıyor:', {
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      secretKeyLength: secretKey.length,
      testMode
    })

    // Test request data
    const requestData = {
      locale: 'tr',
      conversationId: `test_${Date.now()}`,
      binNumber: '554960',
      price: '1.00',
      currency: 'TRY'
    }

    // Auth header generation (İyzico V2 format)
    const uri = '/payment/iyzipos/installment'
    const baseUrl = testMode ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'
    const randomString = crypto.randomBytes(16).toString('hex')
    
    // Hash generation
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(randomString + uri + JSON.stringify(requestData))
      .digest('hex')

    const authorizationParams = [
      'apiKey:' + apiKey,
      'randomKey:' + randomString,
      'signature:' + signature
    ]
    
    const authHeader = 'IYZWSv2 ' + Buffer.from(authorizationParams.join('&')).toString('base64')

    console.log('🔐 Auth debug:', {
      uri,
      randomString: randomString.substring(0, 8) + '...',
      signature: signature.substring(0, 16) + '...',
      authHeaderLength: authHeader.length
    })

    // API call
    const url = baseUrl + uri
    const response = await axios.post(url, requestData, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    console.log('✅ İyzico API başarılı:', response.data)

    return NextResponse.json({
      success: true,
      data: {
        message: 'İyzico direct test başarılı',
        response: response.data,
        testConfig: {
          testMode,
          baseUrl,
          uri,
          authHeaderValid: true
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Direct test error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    return NextResponse.json({
      success: false,
      error: 'Direct test failed',
      details: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }
    }, { status: 500 })
  }
} 