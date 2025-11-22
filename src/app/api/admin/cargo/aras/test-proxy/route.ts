import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

// Simple admin check
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const sessionToken = request.cookies.get('admin_session_token')?.value ||
                        request.headers.get('x-admin-session-token') ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

    if (!sessionToken) return false

    const supabase = await createAdminSupabaseClient()
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_users!inner(id, username, email, role, is_active)
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    return !error && session && session.admin_users?.is_active
  } catch {
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

    console.log('🔍 Proxy bağlantı testi başlatılıyor...')

    // Proxy ayarları
    const proxyHost = process.env.ARAS_PROXY_HOST || 'api2.plante.biz'
    const proxyPort = process.env.ARAS_PROXY_PORT || '3128'
    const proxyUser = process.env.ARAS_PROXY_USER || 'plante'
    const proxyPassword = process.env.ARAS_PROXY_PASSWORD || 'h01h0203'
    const useProxy = process.env.ARAS_USE_PROXY === 'true'

    // Test URL - Aras Kargo servisi
    const testUrl = 'https://customerservices.araskargo.com.tr/arascargoservice/arascargoservice.asmx'

    console.log('🔧 Proxy konfigürasyonu:', {
      proxyHost,
      proxyPort,
      proxyUser,
      useProxy,
      testUrl
    })

    if (!useProxy) {
      return NextResponse.json({
        success: false,
        error: 'Proxy kullanımı devre dışı',
        details: 'ARAS_USE_PROXY=true olmalı'
      }, { status: 400 })
    }

    // Proxy agent oluştur
    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`
    const httpsAgent = new HttpsProxyAgent(proxyUrl)
    const httpAgent = new HttpProxyAgent(proxyUrl)

    console.log('🔄 Proxy agent oluşturuldu:', {
      proxyUrl: `http://${proxyUser}:***@${proxyHost}:${proxyPort}`
    })

    // node-fetch ile test isteği gönder
    const nodeFetch = await import('node-fetch')
    const fetch = nodeFetch.default

    // Test 1: Basit HTTP isteği (HEAD request)
    try {
      console.log('📡 Test 1: Proxy üzerinden HEAD isteği gönderiliyor...')
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        agent: httpsAgent,
        timeout: 10000
      } as any)

      console.log('✅ Test 1 sonucu:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      // Test 2: SOAP isteği (basit)
      console.log('📡 Test 2: Proxy üzerinden SOAP isteği gönderiliyor...')
      
      const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCityList xmlns="http://tempuri.org/">
      <userName>test</userName>
      <password>test</password>
    </GetCityList>
  </soap:Body>
</soap:Envelope>`

      const soapResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/GetCityList'
        },
        body: soapBody,
        agent: httpsAgent,
        timeout: 15000
      } as any)

      const soapResponseText = await soapResponse.text()

      console.log('✅ Test 2 sonucu:', {
        status: soapResponse.status,
        statusText: soapResponse.statusText,
        responseLength: soapResponseText.length,
        responsePreview: soapResponseText.substring(0, 500)
      })

      return NextResponse.json({
        success: true,
        message: 'Proxy bağlantısı başarılı!',
        tests: {
          test1: {
            name: 'HEAD Request',
            status: response.status,
            statusText: response.statusText,
            success: response.ok
          },
          test2: {
            name: 'SOAP Request',
            status: soapResponse.status,
            statusText: soapResponse.statusText,
            success: soapResponse.ok,
            responsePreview: soapResponseText.substring(0, 500)
          }
        },
        proxyConfig: {
          host: proxyHost,
          port: proxyPort,
          user: proxyUser,
          url: testUrl
        },
        timestamp: new Date().toISOString()
      })

    } catch (fetchError: any) {
      console.error('❌ Proxy test hatası:', fetchError)
      
      return NextResponse.json({
        success: false,
        error: 'Proxy bağlantı hatası',
        details: fetchError.message,
        stack: fetchError.stack,
        proxyConfig: {
          host: proxyHost,
          port: proxyPort,
          user: proxyUser,
          url: testUrl
        }
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('💥 Proxy test genel hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Proxy test hatası',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

