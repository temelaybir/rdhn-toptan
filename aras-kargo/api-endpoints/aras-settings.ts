import { NextRequest, NextResponse } from 'next/server'

// Settings'i kaydetmek için POST
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    console.log('⚙️ Aras Kargo ayarları kaydediliyor...', {
      serviceUrl: settings.serviceUrl,
      username: settings.username ? settings.username.substring(0, 3) + '***' : undefined,
      hasCustomerCode: !!settings.customerCode,
      isActive: settings.isActive,
      timestamp: new Date().toISOString()
    })

    // Burada gerçek uygulamada ayarları veritabanına kaydedersiniz
    // Şimdilik console'a yazdırıyoruz
    
    console.log('💾 Kaydedilen ayarlar:', {
      serviceUrl: settings.serviceUrl,
      hasUsername: !!settings.username,
      hasPassword: !!settings.password,
      hasCustomerCode: !!settings.customerCode,
      isActive: settings.isActive,
      autoCreateShipment: settings.autoCreateShipment,
      autoTrackingUpdate: settings.autoTrackingUpdate,
      customerNotifications: settings.customerNotifications,
      testMode: settings.testMode
    })

    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      message: 'Aras Kargo ayarları başarıyla kaydedildi',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Ayar kaydetme hatası:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Settings'leri getirmek için GET
export async function GET() {
  try {
    console.log('📖 Aras Kargo ayarları getiriliyor...')

    // Burada gerçek uygulamada ayarları veritabanından çekersiniz
    // Şimdilik environment variables'dan mock data döndürüyoruz
    
    const settings = {
      serviceUrl: process.env.ARAS_CARGO_SERVICE_URL || 'https://appls-srv.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
      username: process.env.ARAS_CARGO_USERNAME || '',
      password: '', // Güvenlik için password döndürmüyoruz
      customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE || '',
      isActive: process.env.NEXT_PUBLIC_ARAS_CARGO_ENABLED === 'true',
      autoCreateShipment: process.env.CARGO_AUTO_CREATE_SHIPMENT === 'true',
      autoTrackingUpdate: process.env.CARGO_AUTO_TRACKING_UPDATE === 'true',
      customerNotifications: process.env.CARGO_CUSTOMER_NOTIFICATIONS === 'true',
      testMode: process.env.CARGO_TEST_MODE === 'true'
    }

    console.log('📋 Mevcut ayarlar:', {
      hasServiceUrl: !!settings.serviceUrl,
      hasUsername: !!settings.username,
      hasCustomerCode: !!settings.customerCode,
      isActive: settings.isActive,
      testMode: settings.testMode
    })

    return NextResponse.json({
      success: true,
      settings,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Ayar getirme hatası:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 