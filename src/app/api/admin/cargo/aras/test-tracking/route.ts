import { NextRequest, NextResponse } from 'next/server'
import { ArasCargoService } from '../../../../../../../packages/aras-cargo-integration/src/aras-cargo-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber } = body

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Takip numarası gerekli' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing Aras Kargo tracking for:', trackingNumber)

    // Use environment variables if available
    const config = {
      serviceUrl: process.env.ARAS_CARGO_SERVICE_URL || 'https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
      username: process.env.ARAS_CARGO_USERNAME || 'test',
      password: process.env.ARAS_CARGO_PASSWORD || 'test',
      customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE || 'test'
    }

    const arasService = new ArasCargoService(config)
    
    // Test GetCargoInfo for the tracking number/barcode
    const cargoResult = await arasService.queryCargoStatus(trackingNumber)
    
    // Generate tracking URLs
    const trackingUrls = arasService.generateTrackingUrls(trackingNumber)

    // Test if we can get city list (additional API test)
    const cities = await arasService.getCityList()

    console.log('✅ Tracking test results:', {
      cargoInfo: cargoResult.success,
      trackingUrls: Object.keys(trackingUrls).length,
      cityCount: cities.length
    })

    return NextResponse.json({
      success: true,
      message: 'Tracking test completed successfully',
      data: {
        trackingNumber,
        cargoInfo: cargoResult,
        trackingUrls,
        additionalTests: {
          cityListCount: cities.length,
          sampleCities: cities.slice(0, 3)
        },
        config: {
          serviceUrl: config.serviceUrl,
          username: config.username,
          environment: process.env.NODE_ENV
        }
      }
    })

  } catch (error) {
    console.error('❌ Tracking test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Tracking test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 