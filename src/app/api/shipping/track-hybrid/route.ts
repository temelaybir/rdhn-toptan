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

    console.log('🔍 Hybrid WCF Tracking sorgusu başlıyor...')
    const arasKargo = new ArasKargoHybridService()

    let trackingResult

    // Integration Code veya Tracking Number ile sorgula
    if (integrationCode) {
      console.log(`📦 Integration Code: ${integrationCode}`)
      trackingResult = await arasKargo.getTrackingInfo(integrationCode)
    } else if (trackingNumber) {
      console.log(`📦 Tracking Number: ${trackingNumber}`)
      trackingResult = await arasKargo.getTrackingInfoByTrackingNumber(trackingNumber)
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
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Kargo takip sorgusu başarısız',
      service: 'WCF GetQueryJSON',
      timestamp: new Date().toISOString()
    }, { status: 500 })
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

