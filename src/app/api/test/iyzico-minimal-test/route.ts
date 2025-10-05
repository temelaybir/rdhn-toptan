import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import crypto from 'crypto'

/**
 * GET - İyzico Minimal Auth Test
 * En basit auth test'i
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.IYZICO_PRODUCTION_API_KEY
    const secretKey = process.env.IYZICO_PRODUCTION_SECRET_KEY
    
    if (!apiKey || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'API keys not found'
      }, { status: 400 })
    }

    console.log('🔬 Minimal auth test:', {
      apiKeyLength: apiKey.length,
      secretKeyLength: secretKey.length,
      apiKeyStartsWith: apiKey.substring(0, 7)
    })

    // En basit test data
    const requestData = {
      locale: 'tr',
      conversationId: `minimal_${Date.now()}`
    }

    // Manual auth header generation (step by step debug)
    const uri = '/payment/iyzipos/bin'
    const baseUrl = 'https://sandbox-api.iyzipay.com'
    const randomString = crypto.randomBytes(16).toString('hex')
    
    console.log('🔍 Auth generation debug:', {
      step1_randomString: randomString,
      step2_uri: uri,
      step3_jsonBody: JSON.stringify(requestData)
    })
    
    // Signature calculation
    const signatureInput = randomString + uri + JSON.stringify(requestData)
    console.log('🔍 Signature input:', signatureInput)
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureInput)
      .digest('hex')
    
    console.log('🔍 Generated signature:', signature.substring(0, 16) + '...')

    // Authorization params
    const authorizationParams = [
      'apiKey:' + apiKey,
      'randomKey:' + randomString,
      'signature:' + signature
    ]
    
    const authString = authorizationParams.join('&')
    console.log('🔍 Auth string before base64:', authString.substring(0, 50) + '...')
    
    const authHeader = 'IYZWSv2 ' + Buffer.from(authString).toString('base64')
    console.log('🔍 Final auth header length:', authHeader.length)

    // API call
    const url = baseUrl + uri
    console.log('🔍 Final URL:', url)

    const response = await axios.post(url, requestData, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    console.log('✅ API call successful!')

    return NextResponse.json({
      success: true,
      data: {
        message: 'Minimal auth test başarılı!',
        response: response.data,
        debugInfo: {
          randomString,
          signature: signature.substring(0, 16) + '...',
          authHeaderLength: authHeader.length,
          url
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Minimal test error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })

    return NextResponse.json({
      success: false,
      error: 'Minimal test failed',
      details: {
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode,
        errorMessage: error.response?.data?.errorMessage,
        fullResponse: error.response?.data
      }
    }, { status: 500 })
  }
} 