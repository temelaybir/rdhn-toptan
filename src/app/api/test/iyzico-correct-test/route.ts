import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import axios from 'axios'

/**
 * SDK'nın generateRequestString implementasyonu
 */
function generateRequestString(request: { [key: string]: any }): string {
  const isArray = Array.isArray(request)
  let requestString = '['
  
  for (let i in request) {
    const val = request[i]
    if (typeof val !== 'undefined' && typeof val !== 'function') {
      if (!isArray) {
        requestString += i + '='
      }
      if (typeof val === 'object') {
        requestString += generateRequestString(val)
      } else {
        requestString += val
      }
      requestString += isArray ? ', ' : ','
    }
  }
  
  requestString = requestString.slice(0, (isArray ? -2 : -1))
  requestString += ']'
  return requestString
}

/**
 * SDK'nın doğru auth header generation'ı
 */
function generateSDKAuthHeader(apiKey: string, secretKey: string, requestBody: any): string {
  const HEADER_VALUE_AUTHORIZATION_PREFIX = 'IYZWS'
  const DEFAULT_SEPARATOR = ':'
  const DEFAULT_RANDOM_STRING_SIZE = 8
  
  const randomString = process.hrtime()[0] + Math.random().toString(DEFAULT_RANDOM_STRING_SIZE).slice(2)
  const requestString = generateRequestString(requestBody)
  
  console.log('🔍 Correct endpoint auth generation:', {
    randomString,
    requestStringPreview: requestString.substring(0, 50) + '...',
    apiKeyPrefix: apiKey.substring(0, 10) + '...'
  })
  
  const signatureInput = apiKey + randomString + secretKey + requestString
  const hashSha1 = crypto.createHash('sha1')
  hashSha1.update(signatureInput, 'utf-8')
  const authHash = hashSha1.digest('base64')
  
  const authHeader = HEADER_VALUE_AUTHORIZATION_PREFIX + ' ' + apiKey + DEFAULT_SEPARATOR + authHash
  
  console.log('🔐 Correct endpoint auth header:', {
    authHeaderLength: authHeader.length,
    prefix: HEADER_VALUE_AUTHORIZATION_PREFIX,
    authHashPreview: authHash.substring(0, 16) + '...'
  })
  
  return authHeader
}

/**
 * GET - İyzico Correct Test Endpoint
 * İyzico'nun doğru /payment/test endpoint'i ile test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 İyzico Correct Test: Doğru /payment/test endpoint ile başlatılıyor...')

    // Test mode'a göre doğru environment keys'i al
    const testMode = process.env.IYZICO_TEST_MODE === 'true'
    const apiKey = testMode ? process.env.IYZICO_SANDBOX_API_KEY : process.env.IYZICO_PRODUCTION_API_KEY
    const secretKey = testMode ? process.env.IYZICO_SANDBOX_SECRET_KEY : process.env.IYZICO_PRODUCTION_SECRET_KEY

    if (!apiKey || !secretKey) {
      // Fallback to official test keys
      const officialApiKey = 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t'
      const officialSecretKey = 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB'
      
      console.log('⚠️ Env keys not found, using official test keys')
      
      return await testWithKeys(officialApiKey, officialSecretKey, true, 'official_test')
    }

    console.log('🔧 Using environment keys:', {
      testMode,
      keySource: testMode ? 'sandbox' : 'production',
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey
    })

    return await testWithKeys(apiKey, secretKey, testMode, 'environment')

  } catch (error: any) {
    console.error('💥 İyzico Correct Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Correct test failed',
      message: error.message || 'Correct test sırasında hata oluştu',
      details: error
    }, { status: 500 })
  }
}

/**
 * Test helper function
 */
async function testWithKeys(apiKey: string, secretKey: string, testMode: boolean, keySource: string) {
  // SDK'ya göre doğru endpoint - /payment/test (GET method)
  const baseUrl = testMode ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com'
  const endpoint = '/payment/test'  // Doğru endpoint!
  
  console.log('🔍 Correct test request details:', {
    baseUrl,
    endpoint,
    method: 'GET',  // SDK'ya göre GET metodu
    testMode,
    keySource
  })
  
  // GET request için body boş olacak
  const requestBody = {}
  
  // SDK auth header
  const authHeader = generateSDKAuthHeader(apiKey, secretKey, requestBody)

  // API call - GET metodu ile
  const url = baseUrl + endpoint
  const response = await axios.get(url, {  // POST değil GET!
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-iyzi-client-version': 'iyzipay-node-2.0.61',
      'x-iyzi-rnd': process.hrtime()[0] + Math.random().toString(8).slice(2)
    }
  })

  console.log('✅ Correct test API call successful!', response.data)

  return NextResponse.json({
    success: true,
    message: 'İyzico correct test başarılı! 🎉',
    data: {
      connectionTest: {
        success: true,
        message: 'Doğru /payment/test endpoint ile bağlantı başarılı',
        response: response.data
      },
      settings: {
        testMode,
        environment: testMode ? 'Sandbox' : 'Production',
        baseUrl,
        endpoint,
        method: 'GET',
        authMethod: 'SDK_implementation',
        keySource,
        note: 'İyzico doğru API test endpoint\'i kullanıldı'
      }
    }
  })
} 