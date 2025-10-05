import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import axios from 'axios'

/**
 * SDK'nın generateRequestString implementasyonu - DÜZELTME
 */
function generateRequestString(request: { [key: string]: any }): string {
  const isArray = Array.isArray(request)
  let requestString = '['
  
  for (const key in request) {
    if (Object.prototype.hasOwnProperty.call(request, key)) {
      const val = request[key]
      if (typeof val !== 'undefined' && typeof val !== 'function' && val !== null) {
        if (!isArray) {
          requestString += key + '='
        }
        if (typeof val === 'object') {
          requestString += generateRequestString(val)
        } else {
          requestString += val
        }
        requestString += ','
      }
    }
  }
  
  // Son virgülü kaldır
  if (requestString.endsWith(',')) {
    requestString = requestString.slice(0, -1)
  }
  
  requestString += ']'
  return requestString
}

/**
 * SDK'nın doğru auth header generation'ı - DÜZELTME
 */
function generateSDKAuthHeader(apiKey: string, secretKey: string, requestBody: any): string {
  const HEADER_VALUE_AUTHORIZATION_PREFIX = 'IYZWS'
  const DEFAULT_SEPARATOR = ':'
  
  // Random string - SDK formatı
  const randomString = Math.floor(Date.now() / 1000).toString() + Math.random().toString().substring(2, 10)
  const requestString = generateRequestString(requestBody)
  
  console.log('🔍 Fixed SDK Auth generation:', {
    randomString,
    requestStringPreview: requestString.substring(0, 50) + '...',
    apiKeyPrefix: apiKey.substring(0, 10) + '...'
  })
  
  // Auth string: apiKey + randomString + secretKey + requestString
  const authString = apiKey + randomString + secretKey + requestString
  
  // SHA1 hash
  const hashSha1 = crypto.createHash('sha1')
  hashSha1.update(authString, 'utf-8')
  const authHash = hashSha1.digest('base64')
  
  const authHeader = HEADER_VALUE_AUTHORIZATION_PREFIX + ' ' + apiKey + DEFAULT_SEPARATOR + authHash
  
  console.log('🔐 Fixed SDK auth header generated:', {
    authHeaderLength: authHeader.length,
    authHashPreview: authHash.substring(0, 16) + '...'
  })
  
  return authHeader
}

/**
 * İyzico'nun YENİ HmacSHA256 Auth Sistemi - Resmi Dokümantasyona Göre
 */
function generateNewSDKAuthHeader(apiKey: string, secretKey: string, requestBody: any, uriPath: string): string {
  // Random key - dokümantasyona göre format
  const randomKey = new Date().getTime() + "123456789"
  
  // Request body as JSON string
  const requestBodyString = JSON.stringify(requestBody)
  
  // Payload: randomKey + uriPath + requestBody
  const authPayload = randomKey + uriPath + requestBodyString
  
  console.log('🔍 YENİ Auth System generation:', {
    randomKey,
    uriPath,
    requestBodyPreview: requestBodyString.substring(0, 50) + '...',
    authPayloadPreview: authPayload.substring(0, 100) + '...',
    apiKeyPrefix: apiKey.substring(0, 10) + '...'
  })
  
  // HmacSHA256 encryption
  const hmac = crypto.createHmac('sha256', secretKey)
  hmac.update(authPayload, 'utf-8')
  const encryptedData = hmac.digest('hex')
  
  // Authorization string format: apiKey:xxx&randomKey:xxx&signature:xxx
  const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${encryptedData}`
  
  // Base64 encode
  const base64EncodedAuthorization = Buffer.from(authorizationString).toString('base64')
  
  // Final authorization header: IYZWSv2 base64string
  const authHeader = `IYZWSv2 ${base64EncodedAuthorization}`
  
  console.log('🔐 YENİ Auth header generated:', {
    authHeaderLength: authHeader.length,
    encryptedDataPreview: encryptedData.substring(0, 16) + '...',
    authorizationStringPreview: authorizationString.substring(0, 50) + '...',
    randomKey
  })
  
  return authHeader
}

/**
 * GET - İyzico Official Test Endpoint
 * İyzico'nun resmi test anahtarları ile test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 İyzico Official Test: Resmi test anahtarları ile başlatılıyor...')

    // İyzico'nun resmi sandbox test anahtarları (dokümantasyondan)
    const apiKey = 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t'
    const secretKey = 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB'
    const testMode = true
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    console.log('🔧 Official test config:', {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      testMode,
      keyType: 'official_sandbox',
      apiKeyPrefix: apiKey.substring(0, 15) + '...'
    })

    // Test data
    const requestData = {
      locale: 'tr',
      conversationId: `official_test_${Date.now()}`,
      binNumber: '554960',
      price: '1.00',
      currency: 'TRY'
    }

    // Sandbox endpoint
    const baseUrl = 'https://sandbox-api.iyzipay.com'
    const endpoint = '/payment/iyzipos/installment'
    
    console.log('🔍 Official test request (YENİ Auth):', {
      baseUrl,
      endpoint,
      testMode,
      requestData
    })
    
    // YENİ HmacSHA256 auth header
    const authHeader = generateNewSDKAuthHeader(apiKey, secretKey, requestData, endpoint)
    const randomKey = new Date().getTime() + "123456789"

    // API call
    const url = baseUrl + endpoint
    const response = await axios.post(url, requestData, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-iyzi-client-version': 'iyzipay-node-2.0.61',
        'x-iyzi-rnd': randomKey
      }
    })

    console.log('✅ Official test API call successful!', response.data)

    return NextResponse.json({
      success: true,
      message: 'İyzico official test başarılı!',
      data: {
        connectionTest: {
          success: true,
          message: 'Official sandbox keys ile bağlantı başarılı',
          response: response.data
        },
        settings: {
          testMode,
          environment: 'Official Sandbox',
          baseUrl,
          authMethod: 'SDK_implementation',
          keyType: 'official_sandbox',
          note: 'İyzico resmi test anahtarları kullanıldı'
        }
      }
    })

  } catch (error: any) {
    console.error('💥 İyzico Official Test Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Official test failed',
      message: error.response?.data?.errorMessage || error.message || 'Official test sırasında hata oluştu',
      details: {
        status: error.response?.status,
        errorCode: error.response?.data?.errorCode,
        errorMessage: error.response?.data?.errorMessage,
        authMethod: 'SDK_implementation',
        keyType: 'official_sandbox',
        recommendation: error.response?.data?.errorCode === '1001' 
          ? 'Resmi test anahtarları da çalışmıyor - İyzico SDK implementation\'ında sorun olabilir'
          : 'SDK auth implementation başarılı ama başka bir API hatası var'
      }
    }, { status: 500 })
  }
} 