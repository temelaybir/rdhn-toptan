import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import crypto from 'crypto'

/**
 * GET - İyzico Sandbox Test (Production Keys ile)
 * Production anahtarlarını sandbox endpoint'inde test etmek için
 */
export async function GET(request: NextRequest) {
  try {
    // Production anahtarları al ama sandbox endpoint kullan
    const apiKey = process.env.IYZICO_PRODUCTION_API_KEY
    const secretKey = process.env.IYZICO_PRODUCTION_SECRET_KEY
    
    if (!apiKey || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'API keys not found'
      }, { status: 400 })
    }

    console.log('🧪 Sandbox test (production keys ile):', {
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      secretKeyLength: secretKey.length
    })

    // Test request data
    const requestData = {
      locale: 'tr',
      conversationId: `sandbox_test_${Date.now()}`,
      binNumber: '554960',
      price: '1.00',
      currency: 'TRY'
    }

    // Auth header generation
    const uri = '/payment/iyzipos/installment'
    const baseUrl = 'https://sandbox-api.iyzipay.com' // Sandbox endpoint zorla
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

    console.log('🔐 Sandbox auth debug:', {
      uri,
      baseUrl,
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

    console.log('✅ Sandbox API başarılı:', response.data)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Production keys sandbox endpoint\'inde başarılı!',
        discovery: 'Bu anahtarlar aslında sandbox anahtarları olabilir',
        response: response.data,
        testConfig: {
          keysUsed: 'production',
          endpoint: 'sandbox',
          baseUrl,
          uri,
          authHeaderValid: true
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Sandbox test error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    return NextResponse.json({
      success: false,
      error: 'Sandbox test failed',
      details: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        recommendation: error.response?.data?.errorCode === '1001' 
          ? 'API anahtarları yanlış endpoint\'e gönderiliyor olabilir'
          : 'Başka bir auth problemi var'
      }
    }, { status: 500 })
  }
} 