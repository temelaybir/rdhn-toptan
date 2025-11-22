import { NextRequest, NextResponse } from 'next/server'
import { ArasCargoService } from '@/aras-cargo/aras-cargo-service'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

// Simple admin check for quick login compatibility  
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

    console.log('🧪 SetOrder + GetCargoInfo testi başlatılıyor...')

    // Environment variables'dan API bilgilerini al
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL || 'https://customerservices.araskargo.com.tr/arascargoservice/arascargoservice.asmx'
    const username = process.env.ARAS_CARGO_USERNAME
    const password = process.env.ARAS_CARGO_PASSWORD
    const customerCode = process.env.ARAS_CARGO_CUSTOMER_CODE

    if (!username || !password || !customerCode) {
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo API bilgileri eksik',
        details: 'Environment variables (ARAS_CARGO_USERNAME, ARAS_CARGO_PASSWORD, ARAS_CARGO_CUSTOMER_CODE) ayarlanmalı'
      }, { status: 500 })
    }

    // Aras Kargo servisini oluştur
    const arasService = new ArasCargoService({
      serviceUrl,
      username,
      password,
      customerCode
    })

    // Test shipment data
    const testOrderNumber = 'TEST-SETORDER-' + Date.now()
    const testShipmentData = {
      orderNumber: testOrderNumber,
      recipientName: 'Test Alıcı Adı',
      recipientPhone: '05001234567',
      recipientAddress: 'Test Mahallesi, Test Sokak No:1',
      recipientCity: 'İstanbul',
      recipientDistrict: 'Kadıköy',
      recipientPostalCode: '34000',
      senderName: 'Test Gönderici',
      senderPhone: '05001234568',
      senderAddress: 'Test Gönderici Adresi',
      weight: 1,
      desi: 1,
      paymentType: 'sender' as const,
      productPrice: 100,
      description: 'SetOrder + GetCargoInfo test kargo'
    }

    // Minimal log - hassas bilgi (isim, adres, telefon) log'lanmaz
    console.log('📦 1. Adım: SetOrder ile kargo oluşturuluyor...', {
      orderNumber: testOrderNumber?.substring(0, 10) + '...',
      recipientCity: testShipmentData.recipientCity
    })

    // 1. SetOrder ile kargo oluştur
    const shipmentResult = await arasService.createShipment(testShipmentData)

    if (!shipmentResult.success && shipmentResult.resultCode !== '0') {
      return NextResponse.json({
        success: false,
        error: 'SetOrder başarısız',
        details: {
          resultCode: shipmentResult.resultCode,
          resultMessage: shipmentResult.resultMessage,
          error: shipmentResult.error,
          rawResponse: shipmentResult.data
        }
      }, { status: 400 })
    }

    console.log('✅ SetOrder başarılı!', {
      resultCode: shipmentResult.resultCode,
      resultMessage: shipmentResult.resultMessage,
      trackingNumber: shipmentResult.trackingNumber,
      barcode: shipmentResult.barcode
    })

    // 2. Barkod/takip numarasını al
    let barcode = shipmentResult.trackingNumber || shipmentResult.barcode

    if (!barcode) {
      console.log('⚠️ SetOrder response\'unda barkod yok, GetArasBarcode ile alınıyor...')
      const barcodeResult = await arasService.generateArasBarcode(testOrderNumber)
      barcode = barcodeResult.barcode

      if (!barcode) {
        return NextResponse.json({
          success: false,
          error: 'Barkod alınamadı',
          details: {
            setOrderResponse: shipmentResult.data,
            getArasBarcodeResponse: barcodeResult.data
          }
        }, { status: 400 })
      }
    }

    // Minimal log - hassas bilgi yok
    console.log('🏷️ Barkod alındı')

    // 3. GetCargoInfo ile adres bilgilerini çek
    // Minimal log - hassas bilgi yok
    console.log('🔍 2. Adım: GetCargoInfo ile adres bilgileri çekiliyor...')
    
    const cargoInfo = await arasService.queryCargoStatus(barcode)

    if (!cargoInfo.success || !cargoInfo.data) {
      return NextResponse.json({
        success: false,
        error: 'GetCargoInfo başarısız',
        details: {
          error: cargoInfo.error,
          hasData: !!cargoInfo.data,
          dataLength: cargoInfo.data?.length || 0
        }
      }, { status: 400 })
    }

    console.log('✅ GetCargoInfo başarılı!')

    // 4. Adres bilgilerini parse et
    const responseText = cargoInfo.data
    const addressInfo = parseCargoInfoResponse(responseText)

    return NextResponse.json({
      success: true,
      message: 'SetOrder + GetCargoInfo testi başarılı!',
      data: {
        step1_setOrder: {
          success: true,
          orderNumber: testOrderNumber,
          resultCode: shipmentResult.resultCode,
          resultMessage: shipmentResult.resultMessage,
          trackingNumber: shipmentResult.trackingNumber,
          barcode: shipmentResult.barcode
        },
        step2_barcode: {
          barcode,
          source: shipmentResult.trackingNumber || shipmentResult.barcode ? 'SetOrder response' : 'GetArasBarcode'
        },
        step3_getCargoInfo: {
          success: true,
          barcode,
          addressInfo,
          rawResponse: responseText.substring(0, 1000) + '...' // İlk 1000 karakter
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Test hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Test hatası',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * Parse GetCargoInfo response to extract address and cargo information
 */
function parseCargoInfoResponse(responseText: string): any {
  try {
    const result: any = {}

    // Extract receiver information
    const receiverNameMatch = responseText.match(/<ReceiverName>(.*?)<\/ReceiverName>/i) ||
                              responseText.match(/<AlıcıAdı>(.*?)<\/AlıcıAdı>/i)
    if (receiverNameMatch) {
      result.receiverName = receiverNameMatch[1]
    }

    const receiverAddressMatch = responseText.match(/<ReceiverAddress>(.*?)<\/ReceiverAddress>/i) ||
                                 responseText.match(/<AlıcıAdres>(.*?)<\/AlıcıAdres>/i)
    if (receiverAddressMatch) {
      result.receiverAddress = receiverAddressMatch[1]
    }

    const receiverPhoneMatch = responseText.match(/<ReceiverPhone1>(.*?)<\/ReceiverPhone1>/i) ||
                               responseText.match(/<AlıcıTelefon>(.*?)<\/AlıcıTelefon>/i)
    if (receiverPhoneMatch) {
      result.receiverPhone = receiverPhoneMatch[1]
    }

    const receiverCityMatch = responseText.match(/<ReceiverCityName>(.*?)<\/ReceiverCityName>/i) ||
                             responseText.match(/<AlıcıŞehir>(.*?)<\/AlıcıŞehir>/i)
    if (receiverCityMatch) {
      result.receiverCity = receiverCityMatch[1]
    }

    const receiverTownMatch = responseText.match(/<ReceiverTownName>(.*?)<\/ReceiverTownName>/i) ||
                             responseText.match(/<Alıcıİlçe>(.*?)<\/Alıcıİlçe>/i)
    if (receiverTownMatch) {
      result.receiverTown = receiverTownMatch[1]
    }

    // Extract sender information
    const senderNameMatch = responseText.match(/<SenderName>(.*?)<\/SenderName>/i) ||
                           responseText.match(/<GönderenAdı>(.*?)<\/GönderenAdı>/i)
    if (senderNameMatch) {
      result.senderName = senderNameMatch[1]
    }

    const senderAddressMatch = responseText.match(/<SenderAddress>(.*?)<\/SenderAddress>/i) ||
                              responseText.match(/<GönderenAdres>(.*?)<\/GönderenAdres>/i)
    if (senderAddressMatch) {
      result.senderAddress = senderAddressMatch[1]
    }

    // Extract status
    const statusMatch = responseText.match(/<Status>(.*?)<\/Status>/i) ||
                       responseText.match(/<Durum>(.*?)<\/Durum>/i)
    if (statusMatch) {
      result.status = statusMatch[1]
    }

    // Extract tracking number
    const trackingMatch = responseText.match(/<TrackingNumber>(.*?)<\/TrackingNumber>/i) ||
                         responseText.match(/<TakipNo>(.*?)<\/TakipNo>/i)
    if (trackingMatch) {
      result.trackingNumber = trackingMatch[1]
    }

    return result
  } catch (error) {
    console.error('❌ Response parse hatası:', error)
    return {}
  }
}

