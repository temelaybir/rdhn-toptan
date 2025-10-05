import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET - Mevcut İyzico ayarlarını maskelenmiş şekilde gösterir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Mevcut ayarları getir
    const { data: settings, error } = await supabase
      .from('iyzico_settings')
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Settings not found',
        details: error.message
      }, { status: 404 })
    }

    // Güvenlik için key'leri maskele
    const maskedSettings = {
      ...settings,
      api_key: settings.api_key?.length > 10 
        ? `${settings.api_key.substring(0, 15)}...`
        : 'NOT_SET',
      secret_key: settings.secret_key?.length > 10 
        ? `${settings.secret_key.substring(0, 15)}...`
        : 'NOT_SET',
      sandbox_api_key: settings.sandbox_api_key?.length > 10 
        ? `${settings.sandbox_api_key.substring(0, 15)}...`
        : 'NOT_SET',
      sandbox_secret_key: settings.sandbox_secret_key?.length > 10 
        ? `${settings.sandbox_secret_key.substring(0, 15)}...`
        : 'NOT_SET'
    }

    const isConfigured = (
      settings.api_key && settings.api_key !== 'sandbox-api-key-placeholder' &&
      settings.secret_key && settings.secret_key !== 'sandbox-secret-key-placeholder'
    )

    return NextResponse.json({
      success: true,
      data: {
        isConfigured,
        isActive: settings.is_active,
        testMode: settings.test_mode,
        settings: maskedSettings,
        recommendations: !isConfigured ? [
          'API key\'ler hala placeholder değerlerde',
          'Gerçek İyzico API anahtarlarınızı admin panel\'den girin',
          'Veya environment variables kullanın'
        ] : [
          'API key\'ler yapılandırılmış ✅',
          settings.is_active ? 'Sistem aktif ✅' : 'Sistemi aktif edin',
          settings.test_mode ? 'Test modunda' : 'Production modunda'
        ]
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Check failed',
      message: error.message
    }, { status: 500 })
  }
} 