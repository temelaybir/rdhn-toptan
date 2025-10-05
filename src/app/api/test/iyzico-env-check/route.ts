import { NextRequest, NextResponse } from 'next/server'
import { getIyzicoSettingsFromEnv } from '@/services/payment/iyzico-service'

/**
 * GET - İyzico Environment Variables Check
 * Environment variables'ın doğru şekilde ayarlanıp ayarlanmadığını kontrol eder
 */
export async function GET(request: NextRequest) {
  try {
      // 🚀 PRODUCTION-ONLY Environment Variables
  const envVars = {
    IYZICO_API_KEY: process.env.IYZICO_API_KEY,
    IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY,
    IYZICO_BASE_URL: process.env.IYZICO_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    IYZICO_FORCE_3D_SECURE: process.env.IYZICO_FORCE_3D_SECURE,
    IYZICO_DEFAULT_CURRENCY: process.env.IYZICO_DEFAULT_CURRENCY
  }

    const settings = getIyzicoSettingsFromEnv()

    // 🚀 PRODUCTION-ONLY Checks
    const checks = {
      hasApiKey: !!envVars.IYZICO_API_KEY,
      hasSecretKey: !!envVars.IYZICO_SECRET_KEY,
      hasBaseUrl: !!envVars.IYZICO_BASE_URL,
      hasAppUrl: !!envVars.NEXT_PUBLIC_APP_URL,
      settingsLoadedFromEnv: !!settings
    }

    const allGood = Object.values(checks).every(Boolean)

    return NextResponse.json({
      success: allGood,
      message: allGood 
        ? '✅ Tüm PRODUCTION environment variables doğru şekilde ayarlanmış!'
        : '❌ Bazı production environment variables eksik veya hatalı',
      checks,
      envVars: {
        ...envVars,
        // Güvenlik için sadece prefix'i göster
        IYZICO_API_KEY: envVars.IYZICO_API_KEY ? 
          `${envVars.IYZICO_API_KEY.substring(0, 10)}...` : 'NOT_SET',
        IYZICO_SECRET_KEY: envVars.IYZICO_SECRET_KEY ? 
          `${envVars.IYZICO_SECRET_KEY.substring(0, 10)}...` : 'NOT_SET'
      },
      recommendations: !allGood ? [
        !checks.hasApiKey && 'IYZICO_API_KEY environment variable\'ını ekleyin',
        !checks.hasSecretKey && 'IYZICO_SECRET_KEY environment variable\'ını ekleyin',
        !checks.hasBaseUrl && 'IYZICO_BASE_URL environment variable\'ını ekleyin',
        !checks.hasAppUrl && 'NEXT_PUBLIC_APP_URL environment variable\'ını ekleyin'
      ].filter(Boolean) : [],
      settingsPreview: settings ? {
        test_mode: settings.test_mode,
        callback_url: settings.callback_url,
        default_currency: settings.default_currency,
        force_3d_secure: settings.force_3d_secure,
        production_base_url: settings.production_base_url
      } : null
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Environment check failed',
      message: error.message,
      details: error.stack?.split('\n').slice(0, 3)
    }, { status: 500 })
  }
} 