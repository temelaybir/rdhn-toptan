import { NextRequest, NextResponse } from 'next/server'
import { getTrendyolClient } from '@catkapinda/trendyol-integration'

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    
    if (!settings.api_key || !settings.api_secret || !settings.supplier_id) {
      return NextResponse.json({
        success: false,
        error: 'API bilgileri eksik'
      }, { status: 400 })
    }

    const client = getTrendyolClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)

    const isConnected = await client.testConnection()
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Trendyol API bağlantısı başarılı!'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Trendyol API bağlantısı başarısız. API bilgilerini kontrol edin.'
      })
    }
  } catch (error: any) {
    console.error('API test hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'API test sırasında hata oluştu'
    }, { status: 500 })
  }
}
