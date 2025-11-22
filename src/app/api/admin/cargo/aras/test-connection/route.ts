import { NextRequest, NextResponse } from 'next/server'
import { ArasCargoService } from '@/aras-cargo/aras-cargo-service'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

// Simple admin check for quick login compatibility  
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // 1. Direct cookie session token check
    const sessionToken = request.cookies.get('admin_session_token')?.value ||
                        request.headers.get('x-admin-session-token') ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

    if (!sessionToken) {
      return false
    }

    // 2. Session token'ı Supabase'de validate et
    try {
      const supabase = await createAdminSupabaseClient()
      
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users!inner(
            id,
            username,
            email,
            role,
            is_active
          )
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (!error && session && session.admin_users?.is_active) {
        return true
      }
      
      return false
      
    } catch (sessionError) {
      return false
    }
  } catch (error) {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const isAuthenticated = await isAdminAuthenticated(request)
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Yetkisiz erişim - Admin girişi gerekli'
      }, { status: 401 })
    }

    console.log('🔍 Aras Kargo bağlantı testi başlatılıyor...')

    // Environment variables'dan API bilgilerini al
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL || 'https://customerservices.araskargo.com.tr/arascargoservice/arascargoservice.asmx'
    const username = process.env.ARAS_CARGO_USERNAME
    const password = process.env.ARAS_CARGO_PASSWORD
    const customerCode = process.env.ARAS_CARGO_CUSTOMER_CODE

    // Proxy ayarları
    const useProxy = process.env.ARAS_USE_PROXY === 'true'
    const proxyHost = process.env.ARAS_PROXY_HOST || 'api2.plante.biz'
    const proxyPort = process.env.ARAS_PROXY_PORT || '3128'

    if (!username || !password || !customerCode) {
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo API bilgileri eksik',
        details: 'Environment variables (ARAS_CARGO_USERNAME, ARAS_CARGO_PASSWORD, ARAS_CARGO_CUSTOMER_CODE) ayarlanmalı',
        required: {
          ARAS_CARGO_USERNAME: !!username,
          ARAS_CARGO_PASSWORD: !!password,
          ARAS_CARGO_CUSTOMER_CODE: !!customerCode
        }
      }, { status: 500 })
    }

    console.log('🔧 Aras Kargo konfigürasyonu:', {
      serviceUrl,
      username: username.substring(0, 3) + '***',
      hasPassword: !!password,
      hasCustomerCode: !!customerCode,
      useProxy,
      proxyHost,
      proxyPort
    })

    // Aras Kargo servisini oluştur
    const arasService = new ArasCargoService({
      serviceUrl,
      username,
      password,
      customerCode
    })

    // Test bağlantısı yap
    console.log('🚀 Test bağlantısı gönderiliyor...')
    const result = await arasService.testConnection()

    console.log('📊 Test sonucu:', {
      success: result.success,
      resultCode: result.resultCode,
      resultMessage: result.resultMessage,
      hasError: !!result.error
    })

    if (result.success || result.resultCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'Aras Kargo bağlantısı başarılı!',
        data: {
          resultCode: result.resultCode,
          resultMessage: result.resultMessage,
          serviceUrl,
          proxyUsed: useProxy,
          proxyInfo: useProxy ? {
            host: proxyHost,
            port: proxyPort
          } : null
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo bağlantısı başarısız',
        details: result.resultMessage || result.error || 'Bilinmeyen hata',
        resultCode: result.resultCode,
        config: {
          serviceUrl,
          useProxy
        }
      }, { status: 400 })
    }

  } catch (error) {
    // Minimal log - hassas bilgi yok
    console.error('💥 Bağlantı test hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata')
    
    return NextResponse.json({
      success: false,
      error: 'Bağlantı test hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
