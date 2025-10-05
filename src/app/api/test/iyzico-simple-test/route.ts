import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import axios from 'axios'

/**
 * Simplified İyzico Test
 * BIN lookup endpoint ile basit test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 İyzico Simple Test başlatılıyor...')

    // URL parametrelerini al
    const url = new URL(request.url)
    const useOfficial = url.searchParams.get('official') === 'true'

    let apiKey: string
    let secretKey: string
    let note: string

    if (useOfficial) {
      // İyzico resmi test anahtarları
      apiKey = 'sandbox-DzOKzuPTrhqpEjGWt8ZqAgFOzhKHyb9t'
      secretKey = 'sandbox-DfocjXHqPvJcIhJeQEk2dMfAHEn2D0hB'
      note = 'İyzico resmi test anahtarları'
    } else {
      // Environment variables
      apiKey = process.env.IYZICO_API_KEY || ''
      secretKey = process.env.IYZICO_SECRET_KEY || ''
      note = 'Environment variables'
    }

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'API anahtarları bulunamadı',
        message: 'IYZICO_API_KEY ve IYZICO_SECRET_KEY gerekli'
      })
    }

    console.log('🔧 Simple test config:', {
      apiKeyPrefix: apiKey.substring(0, 15) + '...',
      secretKeyLength: secretKey.length,
      note
    })

    // Çok basit test data
    const testData = {
      locale: 'tr',
      conversationId: `simple_test_${Date.now()}`,
      binNumber: '554960'
    }

    // Simplified auth header (minimum gereksinimler)
    const randomString = Date.now().toString()
    const requestString = JSON.stringify(testData)
    const authString = apiKey + randomString + secretKey + requestString
    
    const hash = crypto.createHash('sha1').update(authString, 'utf-8').digest('base64')
    const authHeader = `IYZWS ${apiKey}:${hash}`

    console.log('🔐 Simple auth:', {
      randomString,
      authHeaderLength: authHeader.length,
      requestString: requestString.substring(0, 50) + '...'
    })

    // BIN lookup endpoint (daha basit)
    const response = await axios.post('https://sandbox-api.iyzipay.com/payment/bin/check', testData, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-iyzi-client-version': 'iyzipay-node-2.0.61',
        'x-iyzi-rnd': randomString
      }
    })

    console.log('✅ Simple test successful:', response.data)

    return NextResponse.json({
      success: true,
      message: 'İyzico simple test başarılı!',
      data: {
        note,
        endpoint: 'BIN Check',
        response: response.data,
        config: {
          apiKeyPrefix: apiKey.substring(0, 15) + '...',
          testType: useOfficial ? 'official' : 'environment'
        }
      }
    })

  } catch (error: any) {
    console.error('💥 Simple test error:', error.response?.data || error.message)

    return NextResponse.json({
      success: false,
      error: 'Simple test failed',
      details: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        endpoint: 'BIN Check'
      }
    }, { status: 500 })
  }
} 