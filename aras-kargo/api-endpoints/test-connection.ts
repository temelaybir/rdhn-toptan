import { NextRequest, NextResponse } from 'next/server'
import { ArasCargoService } from '../../../../../../../packages/aras-cargo-integration/src/aras-cargo-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Request details:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    })

    // Enhanced request body parsing with detailed logging
    let requestBody
    try {
      const bodyText = await request.text()
      console.log('📄 Raw request body:', {
        length: bodyText.length,
        content: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : ''),
        isEmpty: !bodyText || bodyText.trim() === ''
      })

      if (!bodyText || bodyText.trim() === '') {
        return NextResponse.json(
          { 
            error: 'Request body is empty',
            received: bodyText,
            expectedFormat: { serviceUrl: 'string', username: 'string', password: 'string' }
          },
          { status: 400 }
        )
      }

      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('📥 JSON parse error:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          receivedType: typeof bodyText
        },
        { status: 400 }
      )
    }

    const { serviceUrl, username, password } = requestBody

    // Basic validation
    if (!serviceUrl || !username || !password) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          received: { serviceUrl: !!serviceUrl, username: !!username, password: !!password },
          required: ['serviceUrl', 'username', 'password']
        },
        { status: 400 }
      )
    }

    console.log('🔌 Testing Aras Kargo connection...', {
      serviceUrl,
      username,
      hasPassword: !!password
    })

    // Prioritize environment variables over form input
    const config = {
      serviceUrl: process.env.ARAS_CARGO_SERVICE_URL || serviceUrl || 'https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
      username: process.env.ARAS_CARGO_USERNAME || username || 'test',
      password: process.env.ARAS_CARGO_PASSWORD || password || 'test',
      customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE || 'test'
    }
    
    console.log('🔧 Using config (env vars prioritized):', {
      serviceUrl: config.serviceUrl,
      username: config.username,
      hasPassword: !!config.password,
      hasEnvUsername: !!process.env.ARAS_CARGO_USERNAME,
      hasEnvPassword: !!process.env.ARAS_CARGO_PASSWORD
    })

    const arasService = new ArasCargoService(config)
    
    // Test connection using the new testConnection method
    const result = await arasService.testConnection()

    console.log('✅ Connection test result:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Aras Kargo bağlantısı başarılı!',
        data: result.data,
        config: {
          serviceUrl: config.serviceUrl,
          username: config.username,
          customerCode: config.customerCode,
          environment: process.env.NODE_ENV
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Bağlantı başarısız',
          details: result.error,
          config: {
            serviceUrl: config.serviceUrl,
            username: config.username,
            customerCode: config.customerCode
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Connection test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Bağlantı test hatası',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    )
  }
} 