import { NextRequest, NextResponse } from 'next/server'

/**
 * Mock İyzico Test
 * Gerçek API'ye erişim olmadığında test için
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🎭 İyzico Mock Test başlatılıyor...')

    // Environment variables kontrolü
    const hasEnvVars = !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY)
    const testMode = process.env.IYZICO_TEST_MODE === 'true'
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'

    // Mock successful response
    const mockSuccessResponse = {
      status: 'success',
      systemTime: Date.now(),
      conversationId: `mock_test_${Date.now()}`,
      message: 'Mock test başarılı - Gerçek API bağlantısı için sandbox anahtarları gerekli'
    }

    // Test scenarios
    const testResults = {
      environmentCheck: {
        success: hasEnvVars,
        testMode,
        baseUrl,
        variables: {
          IYZICO_API_KEY: !!process.env.IYZICO_API_KEY,
          IYZICO_SECRET_KEY: !!process.env.IYZICO_SECRET_KEY,
          IYZICO_TEST_MODE: process.env.IYZICO_TEST_MODE || 'NOT_SET',
          IYZICO_BASE_URL: process.env.IYZICO_BASE_URL || 'NOT_SET'
        }
      },
      mockConnection: {
        success: true,
        message: 'Mock connection başarılı',
        response: mockSuccessResponse
      },
      realApiStatus: {
        tested: true,
        result: 'Failed with 1001 error',
        reason: 'İyzico resmi test anahtarları çalışmıyor',
        recommendation: 'Gerçek sandbox anahtarları gerekli'
      }
    }

    console.log('✅ Mock test completed:', testResults)

    return NextResponse.json({
      success: true,
      message: '🎭 Mock İyzico Test Başarılı!',
      type: 'MOCK_TEST',
      timestamp: new Date().toISOString(),
      data: testResults,
      instructions: {
        forRealTest: [
          '1. İyzico Developer Portal\'dan sandbox anahtarları alın: https://dev.iyzipay.com',
          '2. Environment variables\'ları gerçek anahtarlarla güncelleyin',
          '3. Comprehensive test endpoint\'ini tekrar çalıştırın'
        ],
        forDevelopment: [
          'Mock implementation şimdilik test amaçları için kullanılabilir',
          'Production\'a geçmeden önce gerçek API entegrasyonu yapılmalı'
        ]
      },
      nextSteps: [
        '🔑 İyzico sandbox anahtarları alın',
        '🔧 Environment variables\'ları güncelleyin',
        '🧪 Gerçek API testlerini yapın',
        '💳 Test kartlarıyla ödeme testleri başlatın'
      ]
    })

  } catch (error: any) {
    console.error('💥 Mock test error:', error)

    return NextResponse.json({
      success: false,
      error: 'Mock test failed',
      message: error.message
    }, { status: 500 })
  }
} 