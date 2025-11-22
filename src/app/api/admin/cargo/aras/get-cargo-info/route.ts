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

    const body = await request.json()
    const { barcode, integrationCode } = body

    // IntegrationCode veya barcode kullanılabilir
    // IntegrationCode öncelikli (SetOrder ile oluşturulan kargolar için)
    // IntegrationCode = orgReceiverCustId (Aras API'den dönen değer, örnek: 919508001128007)
    const queryKey = integrationCode || barcode

    if (!queryKey) {
      return NextResponse.json({
        success: false,
        error: 'Barkod, IntegrationCode veya takip numarası gerekli'
      }, { status: 400 })
    }

    // Minimal log
    console.log('🔍 GetCargoInfo sorgulanıyor:', { queryKey: queryKey.substring(0, 10) + '...' })

    // Aras Kargo API configuration
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL || 'https://customerws.araskargo.com.tr/arascargoservice.asmx'
    
    // GetCargoInfo için sorgulama kullanıcı adı/şifre
    // Öncelik sırası:
    // 1. ARAS_KARGO_QUERY_USERNAME/PASSWORD (GetCargoInfo için özel)
    // 2. ARAS_KARGO_SETORDER_USERNAME/PASSWORD (SetOrder ile aynı - önerilen)
    // 3. ARAS_CARGO_USERNAME/PASSWORD (genel)
    const queryUsername = process.env.ARAS_KARGO_QUERY_USERNAME || 
                         process.env.ARAS_KARGO_SETORDER_USERNAME || 
                         process.env.ARAS_CARGO_USERNAME
    const queryPassword = process.env.ARAS_KARGO_QUERY_PASSWORD || 
                         process.env.ARAS_KARGO_SETORDER_PASSWORD || 
                         process.env.ARAS_CARGO_PASSWORD
    const customerCode = process.env.ARAS_CARGO_CUSTOMER_CODE
    
    // Eğer SetOrder credentials'ı varsa, onları kullan (GetCargoInfo genellikle SetOrder ile aynı credentials'ı kullanır)
    const finalUsername = queryUsername || process.env.ARAS_KARGO_SETORDER_USERNAME
    const finalPassword = queryPassword || process.env.ARAS_KARGO_SETORDER_PASSWORD

    // Credentials log'lanmaz - güvenlik

    if (!finalUsername || !finalPassword || !customerCode) {
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo sorgulama bilgileri eksik',
        details: {
          missing: {
            username: !queryUsername,
            password: !queryPassword,
            customerCode: !customerCode
          },
          availableEnvVars: {
            ARAS_KARGO_QUERY_USERNAME: !!process.env.ARAS_KARGO_QUERY_USERNAME,
            ARAS_KARGO_QUERY_PASSWORD: !!process.env.ARAS_KARGO_QUERY_PASSWORD,
            ARAS_KARGO_SETORDER_USERNAME: !!process.env.ARAS_KARGO_SETORDER_USERNAME,
            ARAS_KARGO_SETORDER_PASSWORD: !!process.env.ARAS_KARGO_SETORDER_PASSWORD,
            ARAS_CARGO_USERNAME: !!process.env.ARAS_CARGO_USERNAME,
            ARAS_CARGO_PASSWORD: !!process.env.ARAS_CARGO_PASSWORD,
            ARAS_CARGO_CUSTOMER_CODE: !!process.env.ARAS_CARGO_CUSTOMER_CODE
          }
        }
      }, { status: 500 })
    }

    // Create Aras Kargo service instance
    const arasService = new ArasCargoService({
      serviceUrl,
      username: finalUsername,
      password: finalPassword,
      customerCode
    })

    // Minimal log - hassas bilgi yok
    console.log('🔍 Aras Kargo kargo bilgisi sorgulanıyor...', { 
      queryKeyLength: queryKey?.length || 0,
      usingIntegrationCode: !!integrationCode
    })

    // Query cargo status - IntegrationCode ile sorgulama yapılır
    // Not: GetCargoInfo cargoKey parametresi IntegrationCode'u bekler
    // Minimal log - hassas bilgi yok
    
    const cargoInfo = await arasService.queryCargoStatus(queryKey)

    // Minimal log - hassas bilgi (adres, telefon, isim) log'lanmaz
    console.log('📦 GetCargoInfo sonucu:', {
      success: cargoInfo.success,
      hasData: !!cargoInfo.data,
      dataLength: cargoInfo.data?.length || 0
    })

    if (!cargoInfo.success || !cargoInfo.data) {
      return NextResponse.json({
        success: false,
        error: cargoInfo.error || 'Kargo bilgisi bulunamadı',
        details: {
          queryKeyLength: queryKey?.length || 0,
          hasIntegrationCode: !!integrationCode,
          hasBarcode: !!barcode,
          arasError: cargoInfo.error,
          rawResponseLength: cargoInfo.data?.length || 0
        }
      }, { status: 404 })
    }

    // Parse GetCargoInfo response to extract address information
    const responseText = cargoInfo.data
    const addressInfo = parseCargoInfoResponse(responseText)

    return NextResponse.json({
      success: true,
      data: {
        integrationCode: integrationCode || barcode, // Sorgulama için kullanılan IntegrationCode
        barcode: barcode || integrationCode, // BarcodeNumber (varsa)
        addressInfo,
        rawResponse: responseText
      }
    })

  } catch (error) {
    console.error('💥 Kargo bilgisi sorgulama hatası:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

/**
 * Parse GetCargoInfo response to extract address and cargo information
 * Aras sistemine barkod okutulduğunda adres bilgileri bu response'tan çıkar
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

