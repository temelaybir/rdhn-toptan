/**
 * Aras Kargo WCF Hybrid Tracking API Endpoint
 * 
 * Integration Code veya Tracking Number ile kargo durumu sorgular
 * 
 * GET /api/shipping/track-hybrid?integrationCode=1762940574537
 * GET /api/shipping/track-hybrid?trackingNumber=5749385737613
 */

import { NextRequest, NextResponse } from 'next/server'
import ArasKargoHybridService from '@/lib/aras-kargo-hybrid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const integrationCode = searchParams.get('integrationCode')
    const trackingNumber = searchParams.get('trackingNumber')

    // Parametre validasyonu
    if (!integrationCode && !trackingNumber) {
      return NextResponse.json({
        success: false,
        error: 'integrationCode veya trackingNumber parametresi gerekli',
        example: '/api/shipping/track-hybrid?integrationCode=1762940574537'
      }, { status: 400 })
    }

    // Environment variables kontrolü (deploy'da önemli)
    const hasCredentials = !!(
      process.env.ARAS_KARGO_USERNAME || 
      process.env.ARAS_CARGO_USERNAME || 
      process.env.ARAS_KARGO_SETORDER_USERNAME
    )
    
    if (!hasCredentials && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
      console.error('❌ Aras Kargo credentials eksik - Environment variables kontrol edilmeli')
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo API credentials eksik',
        details: 'Vercel Environment Variables ayarlarını kontrol edin',
        required: [
          'ARAS_KARGO_USERNAME veya ARAS_CARGO_USERNAME',
          'ARAS_KARGO_PASSWORD veya ARAS_CARGO_PASSWORD',
          'ARAS_KARGO_CUSTOMER_CODE veya ARAS_CARGO_CUSTOMER_CODE'
        ]
      }, { status: 500 })
    }

    console.log('🔍 Hybrid WCF Tracking sorgusu başlıyor...')
    
    let arasKargo: any
    try {
      arasKargo = new ArasKargoHybridService()
    } catch (error: any) {
      console.error('❌ ArasKargoHybridService oluşturulamadı:', error.message)
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo servisi başlatılamadı',
        details: error.message,
        hint: 'Environment variables kontrol edilmeli'
      }, { status: 500 })
    }

    let trackingResult
    let lastError: Error | null = null

    // Integration Code veya Tracking Number ile sorgula
    if (integrationCode) {
      console.log(`📦 Integration Code: ${integrationCode}`)
      console.log('💡 Not: IntegrationCode, SetOrder API\'den dönen orgReceiverCustId olmalıdır (veritabanında kargo_talepno)')
      
      try {
        trackingResult = await arasKargo.getTrackingInfo(integrationCode)
      } catch (error: any) {
        lastError = error
        
        // Eğer IntegrationCode ile sorgu başarısız olursa ve formatı düzeltilebilirse tekrar dene
        const cleanCode = integrationCode.trim().replace(/\D/g, '')
        if (cleanCode !== integrationCode && cleanCode.length > 0) {
          console.log(`🔄 Temizlenmiş IntegrationCode ile tekrar deneniyor: ${cleanCode}`)
          try {
            trackingResult = await arasKargo.getTrackingInfo(cleanCode)
            lastError = null
          } catch (retryError: any) {
            console.error('❌ Temizlenmiş kod ile de sorgu başarısız:', retryError.message)
            lastError = retryError
          }
        }
        
        // 500 hatası için özel mesaj
        if (lastError && lastError.message.includes('500')) {
          console.warn('⚠️ 500 hatası - IntegrationCode sistemde kayıtlı olmayabilir veya yanlış format olabilir')
          console.warn('💡 İpucu: IntegrationCode, SetOrder API\'den dönen orgReceiverCustId olmalıdır')
        }
        
        // Hala hata varsa fırlat
        if (lastError && !trackingResult) {
          throw lastError
        }
      }
    } else if (trackingNumber) {
      console.log(`📦 Tracking Number: ${trackingNumber}`)
      
      try {
        trackingResult = await arasKargo.getTrackingInfoByTrackingNumber(trackingNumber)
      } catch (error: any) {
        lastError = error
        
        // TrackingNumber'ı temizle ve tekrar dene
        const cleanTracking = trackingNumber.trim().replace(/\D/g, '')
        if (cleanTracking !== trackingNumber && cleanTracking.length > 0) {
          console.log(`🔄 Temizlenmiş TrackingNumber ile tekrar deneniyor: ${cleanTracking}`)
          try {
            trackingResult = await arasKargo.getTrackingInfoByTrackingNumber(cleanTracking)
            lastError = null
          } catch (retryError: any) {
            console.error('❌ Temizlenmiş tracking numarası ile de sorgu başarısız:', retryError.message)
            lastError = retryError
          }
        }
        
        // Hala hata varsa fırlat
        if (lastError && !trackingResult) {
          throw lastError
        }
      }
    }

    // Eğer sonuç yoksa hata döndür
    if (!trackingResult) {
      throw lastError || new Error('Kargo bilgisi alınamadı')
    }

    console.log('✅ Hybrid tracking başarılı')

    // Response formatla
    const response = {
      ...trackingResult,
      meta: {
        ...trackingResult.meta,
        success: true,
        message: 'Hybrid WCF tracking query successful',
        queriedAt: new Date().toISOString(),
        service: 'WCF GetQueryJSON',
        integrationCode: integrationCode || undefined,
        trackingNumber: trackingNumber || undefined
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ Hybrid tracking hatası:', error.message)
    
    // Hata mesajını daha kullanıcı dostu hale getir
    let errorMessage = error.message || 'Kargo takip sorgusu başarısız'
    let statusCode = 500
    
    // 500 hatası için özel mesaj
    if (errorMessage.includes('500') || errorMessage.includes('InternalServiceFault')) {
      errorMessage = 'Aras Kargo API\'den geçici bir hata alındı. Lütfen birkaç dakika sonra tekrar deneyin. Eğer sorun devam ederse, IntegrationCode veya TrackingNumber\'ın doğru olduğundan emin olun.'
      statusCode = 503 // Service Unavailable
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      service: 'WCF GetQueryJSON',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack
      } : undefined
    }, { status: statusCode })
  }
}

/**
 * OPTIONS - CORS pre-flight request
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Allow': 'GET, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

