import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * İyzico Auth Debug
 * Auth sistemi detaylı debug için
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 İyzico Auth Debug başlatılıyor...')

    // Test anahtarları
    const apiKey = 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t'
    const secretKey = 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB'
    
    // Test data
    const testData = {
      locale: 'tr',
      conversationId: `auth_debug_${Date.now()}`,
      binNumber: '554960'
    }
    
    const uriPath = '/payment/bin/check'
    
    // Step by step debug
    const randomKey = new Date().getTime() + "123456789"
    const requestBodyString = JSON.stringify(testData)
    const authPayload = randomKey + uriPath + requestBodyString
    
    console.log('🔍 Auth Debug Steps:', {
      step1_randomKey: randomKey,
      step2_uriPath: uriPath,
      step3_requestBody: requestBodyString,
      step4_authPayload: authPayload
    })
    
    // HmacSHA256
    const hmac = crypto.createHmac('sha256', secretKey)
    hmac.update(authPayload, 'utf-8')
    const encryptedData = hmac.digest('hex')
    
    // Authorization string
    const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${encryptedData}`
    
    // Base64
    const base64EncodedAuthorization = Buffer.from(authorizationString).toString('base64')
    
    // Final header
    const authHeader = `IYZWSv2 ${base64EncodedAuthorization}`
    
    console.log('🔍 Auth Debug Results:', {
      encryptedData,
      authorizationString,
      base64EncodedAuthorization,
      authHeader
    })

    // Dokümantasyondaki örnek ile karşılaştırma
    const docExample = {
      expectedPayload: 'randomKey + uriPath + requestBody',
      ourPayload: authPayload,
      expectedAuthString: 'apiKey:xxx&randomKey:xxx&signature:xxx',
      ourAuthString: authorizationString,
      expectedHeader: 'IYZWSv2 base64string',
      ourHeader: authHeader
    }

    return NextResponse.json({
      success: true,
      message: '🔍 İyzico Auth Debug Completed!',
      debugInfo: {
        inputs: {
          apiKey: apiKey.substring(0, 15) + '...',
          secretKey: secretKey.substring(0, 15) + '...',
          testData,
          uriPath
        },
        steps: {
          step1_randomKey: randomKey,
          step2_uriPath: uriPath,
          step3_requestBody: requestBodyString,
          step4_authPayload: authPayload.substring(0, 100) + '...',
          step5_hmacSha256: encryptedData,
          step6_authString: authorizationString.substring(0, 100) + '...',
          step7_base64: base64EncodedAuthorization.substring(0, 50) + '...',
          step8_finalHeader: authHeader.substring(0, 50) + '...'
        },
        comparison: docExample,
        fullResults: {
          encryptedData,
          authorizationString,
          base64EncodedAuthorization,
          authHeader
        }
      }
    })

  } catch (error: any) {
    console.error('💥 Auth debug error:', error)

    return NextResponse.json({
      success: false,
      error: 'Auth debug failed',
      message: error.message
    }, { status: 500 })
  }
} 