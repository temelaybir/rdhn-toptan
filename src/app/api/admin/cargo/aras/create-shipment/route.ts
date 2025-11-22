import { NextRequest, NextResponse } from 'next/server'
import { ArasCargoService } from '@/aras-cargo/aras-cargo-service'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { CreateShipmentData } from '@/types/cargo'

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
    const { orderId, shipmentData } = body

    if (!orderId || !shipmentData) {
      return NextResponse.json({
        success: false,
        error: 'Sipariş ID ve kargo bilgileri gerekli'
      }, { status: 400 })
    }

    console.log('🔍 Sipariş sorgulanıyor:', { orderId })

    // Get order details
    // orderId can be either order_number (string) or id (integer)
    const supabase = await createAdminSupabaseClient()
    
    // Try to parse as integer first (if it's a numeric ID)
    const orderIdInt = parseInt(orderId, 10)
    const isNumericId = !isNaN(orderIdInt)
    
    let query = supabase
      .from('orders')
      .select('*, shipping_address, billing_address')
    
    if (isNumericId) {
      // If it's a numeric ID, search by id
      query = query.eq('id', orderIdInt)
    } else {
      // Otherwise, search by order_number
      query = query.eq('order_number', orderId)
    }
    
    const { data: order, error: orderError } = await query.single()

    if (orderError) {
      console.error('❌ Sipariş sorgulama hatası:', orderError)
      return NextResponse.json({
        success: false,
        error: 'Sipariş bulunamadı',
        details: orderError.message
      }, { status: 404 })
    }

    if (!order) {
      console.error('❌ Sipariş bulunamadı:', { orderId, orderIdInt })
      return NextResponse.json({
        success: false,
        error: 'Sipariş bulunamadı'
      }, { status: 404 })
    }

    // Aras Kargo API configuration
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL || 'https://customerws.araskargo.com.tr/arascargoservice.asmx'
    
    // SetOrder için ayrı kullanıcı adı ve şifre kullanılır
    const setOrderUsername = process.env.ARAS_KARGO_SETORDER_USERNAME || process.env.ARAS_CARGO_USERNAME
    const setOrderPassword = process.env.ARAS_KARGO_SETORDER_PASSWORD || process.env.ARAS_CARGO_PASSWORD
    const customerCode = process.env.ARAS_CARGO_CUSTOMER_CODE

    if (!setOrderUsername || !setOrderPassword || !customerCode) {
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo SetOrder bilgileri eksik. Lütfen environment variables\'ı kontrol edin.',
        required: {
          ARAS_KARGO_SETORDER_USERNAME: !!setOrderUsername,
          ARAS_KARGO_SETORDER_PASSWORD: !!setOrderPassword,
          ARAS_CARGO_CUSTOMER_CODE: !!customerCode
        }
      }, { status: 500 })
    }

    // Create Aras Kargo service instance with SetOrder credentials
    const arasService = new ArasCargoService({
      serviceUrl,
      username: setOrderUsername,
      password: setOrderPassword,
      customerCode
    })

    // Prepare shipment data
    const shippingAddress = order.shipping_address as any
    
    // TradingWaybillNumber 16 karakter limiti var
    // Order number'ı 16 karaktere sınırla (uzunsa kes, kısaysa olduğu gibi kullan)
    const rawOrderNumber = order.order_number || orderId.toString()
    const tradingWaybillNumber = rawOrderNumber.length > 16 
      ? rawOrderNumber.substring(0, 16) 
      : rawOrderNumber // 16 karakter veya daha kısa ise olduğu gibi kullan
    
    // IntegrationCode için sadece sayıları kullan (klasik barkod sistemi sadece sayı okuyabilir)
    // Order number'dan sadece sayıları çıkar (örn: "SIP-1762940574537" -> "1762940574537")
    // Eğer sayı yoksa, timestamp kullan
    const extractNumbers = (str: string): string => {
      const numbers = str.replace(/\D/g, '') // Sadece sayıları al
      return numbers || Date.now().toString() // Eğer sayı yoksa timestamp
    }
    
    // Base IntegrationCode: Order number'dan sayıları çıkar
    const baseOrderNumbers = extractNumbers(rawOrderNumber)
    
    // Benzersizlik için timestamp + random sayı ekle
    // Bu sayede hem farklı orderlar hem de aynı order için birden fazla kargo gönderildiğinde benzersiz kod oluşur
    // Timestamp'in milisaniye kısmını kullan (son 8 hane) + random 2 hane = toplam 10 hane
    const timestampMs = Date.now().toString().slice(-8) // Son 8 hane (milisaniye, örn: 12345678)
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0') // 00-99 arası random
    const uniqueSuffix = `${timestampMs}${randomSuffix}` // Toplam 10 hane
    
    // IntegrationCode: Base order numbers'ın son 6 hanesi + unique suffix (10 hane) = toplam 16 karakter
    // Bu sayede:
    // 1. Farklı orderlar için farklı kodlar (order number'dan gelen 6 hane farklı olacak)
    // 2. Aynı order için birden fazla kargo için farklı kodlar (timestamp + random farklı olacak)
    // 3. Sadece sayılardan oluşur (klasik barkod sistemi ile okunabilir)
    const baseNumbers = baseOrderNumbers.slice(-6) // Son 6 hane (order number'dan - farklı orderlar için farklı)
    const numericIntegrationCode = `${baseNumbers}${uniqueSuffix}` // Toplam 16 karakter
    
    // IntegrationCode oluşturuldu - minimal log (hassas bilgi yok)
    
    // İlçe bilgisini çeşitli kaynaklardan al (öncelik sırasına göre)
    const recipientDistrict = shipmentData.recipientDistrict || 
                              shippingAddress?.district || 
                              shippingAddress?.town || 
                              shippingAddress?.townName ||
                              shippingAddress?.county ||
                              ''
    
    // İlçe bilgisi zorunlu - eğer yoksa hata ver
    if (!recipientDistrict || recipientDistrict.trim() === '') {
      console.error('❌ İlçe bilgisi eksik')
      return NextResponse.json({
        success: false,
        error: 'İlçe Adını Girmeniz Gerekmektedir.',
        details: 'Sipariş adresinde ilçe bilgisi bulunamadı. Lütfen ilçe bilgisini manuel olarak girin.',
        missingField: 'recipientDistrict',
        availableFields: {
          fromShipmentData: !!shipmentData.recipientDistrict,
          fromShippingAddress: {
            district: !!shippingAddress?.district,
            town: !!shippingAddress?.town,
            townName: !!shippingAddress?.townName,
            county: !!shippingAddress?.county
          }
        }
      }, { status: 400 })
    }
    
    const createShipmentData: CreateShipmentData = {
      orderNumber: tradingWaybillNumber, // TradingWaybillNumber için 16 karakter
      integrationCode: numericIntegrationCode, // IntegrationCode için sadece sayılar (klasik barkod için)
      recipientName: shipmentData.recipientName || shippingAddress?.fullName || shippingAddress?.contactName || 'Müşteri',
      recipientPhone: shipmentData.recipientPhone || order.phone || '',
      recipientAddress: shipmentData.recipientAddress || shippingAddress?.address || shippingAddress?.addressLine1 || '',
      recipientCity: shipmentData.recipientCity || shippingAddress?.city || '',
      recipientDistrict: recipientDistrict, // Artık boş olamaz
      recipientPostalCode: shipmentData.recipientPostalCode || shippingAddress?.postalCode || '',
      senderName: shipmentData.senderName || 'Ardahan Ticaret',
      senderPhone: shipmentData.senderPhone || '',
      senderAddress: shipmentData.senderAddress || '',
      weight: shipmentData.weight || 1,
      desi: shipmentData.desi || 1,
      paymentType: shipmentData.paymentType || 'sender',
      productPrice: shipmentData.productPrice || parseFloat(order.total_amount) || 0,
      description: shipmentData.description || `Sipariş: ${order.order_number}`
    }

    // Minimal log - hassas bilgiler (adres, telefon, isim) log'lanmaz
    console.log('🚚 Kargo oluşturuluyor:', {
      orderNumber: createShipmentData.orderNumber?.substring(0, 10) + '...',
      city: createShipmentData.recipientCity,
      district: createShipmentData.recipientDistrict,
      integrationCode: createShipmentData.integrationCode?.substring(0, 10) + '...'
    })

    // Create shipment via Aras Kargo API
    const shipmentResult = await arasService.createShipment(createShipmentData)

    // Minimal log - sadece başarı/hata durumu
    if (shipmentResult.success || shipmentResult.resultCode === '0') {
      console.log('✅ Kargo oluşturuldu:', {
        integrationCode: shipmentResult.integrationCode,
        barcode: shipmentResult.barcode
      })
    } else {
      console.error('❌ Kargo oluşturulamadı:', shipmentResult.resultMessage)
    }

    if (shipmentResult.success || shipmentResult.resultCode === '0') {
      // SetOrder response'undan barcode ve integrationCode al
      // Response'tan gelen değerler:
      // - orgReceiverCustId: Aras tarafından atanan IntegrationCode (örnek: 919508001128007)
      // - invoiceKey: TradingWaybillNumber (örnek: AR1753866567182)
      // - barcode: BarcodeNumber = IntegrationCode + "1" (örnek: 9195080011280071)
      
      // ÖNEMLİ: IntegrationCode MUTLAKA Aras API'den dönen orgReceiverCustId olmalı
      // shipmentResult.integrationCode zaten aras-cargo-service.ts'de orgReceiverCustId olarak parse ediliyor
      const integrationCode = shipmentResult.integrationCode // Aras'tan dönen orgReceiverCustId (örnek: 919508001128007)
      const barcode = shipmentResult.barcode // BarcodeNumber for cargo tracking (IntegrationCode + "1")
      const invoiceKey = shipmentResult.invoiceKey || shipmentResult.trackingNumber // InvoiceKey = TradingWaybillNumber
      
      // Eğer IntegrationCode yoksa, bu bir hata - Aras'tan dönmeli
      if (!integrationCode) {
        console.error('⚠️ IntegrationCode Aras\'tan dönmedi')
      }

      // Update order with cargo information
      const updateData: any = {
        kargo_firma: 'aras',
        kargo_tarih: new Date().toISOString(),
        kargo_sonuc: 'Hazırlanıyor',
        kargo_paketadet: 1,
        status: 'CONFIRMED', // Kargolanacak durumuna geçir
        updated_at: new Date().toISOString()
      }

      if (barcode) {
        // BarcodeNumber: Parça barkodu (örnek: 9195080011280071) - Kargo üzerinde bulunur
        // IntegrationCode: Sorgulama için kullanılır (örnek: 919508001128007)
        // InvoiceKey: TradingWaybillNumber (örnek: AR1753866567182)
        updateData.kargo_barcode = barcode // BarcodeNumber (parça barkodu)
        updateData.kargo_takipno = invoiceKey || barcode // InvoiceKey (TradingWaybillNumber)
        updateData.kargo_talepno = integrationCode // IntegrationCode (sorgulama için kullanılır)
        
        // Not: Şube veriyi işleme aldıktan sonra GetCargoInfo ile sorgulama yapılabilir
        // IntegrationCode ile sorgulama yapılmalı (barcodeNumber ile değil)
        // Minimal log - sadece kodlar
        console.log('📋 Kargo kaydediliyor')
      }

      // Update order - use the actual database id
      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id)

      if (updateError) {
        console.error('❌ Sipariş güncellenirken hata:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Kargo oluşturuldu ancak sipariş güncellenemedi: ' + updateError.message
        }, { status: 500 })
      }

      const responseData = {
        orderId,
        barcode: barcode, // BarcodeNumber (parça barkodu) - kargo üzerinde yazdırılır
        integrationCode: integrationCode, // IntegrationCode (sorgulama için) - Aras sistemine okutulduğunda adres bilgilerini getirir
        invoiceKey: invoiceKey, // InvoiceKey (TradingWaybillNumber) - Aras Kargo tarafından atanan irsaliye numarası
        trackingNumber: invoiceKey || barcode, // InvoiceKey veya barcode
        resultCode: shipmentResult.resultCode,
        resultMessage: shipmentResult.resultMessage,
        note: 'SetOrder ile oluşturulan kargo. IntegrationCode ile GetCargoInfo çağrılarak adres bilgileri alınabilir.',
        databaseFields: {
          kargo_barcode: barcode,
          kargo_takipno: invoiceKey || barcode,
          kargo_talepno: integrationCode
        }
      }

      // Minimal log - sadece önemli bilgiler
      console.log('✅ Kargo başarıyla oluşturuldu ve kaydedildi')

      return NextResponse.json({
        success: true,
        message: 'Kargo başarıyla oluşturuldu',
        data: responseData
      })
    } else {
      // Minimal log - hassas bilgi yok
      console.error('❌ SetOrder başarısız:', {
        resultCode: shipmentResult.resultCode,
        resultMessage: shipmentResult.resultMessage
      })
      
      return NextResponse.json({
        success: false,
        error: shipmentResult.resultMessage || shipmentResult.error || 'Kargo oluşturulamadı',
        resultCode: shipmentResult.resultCode
      }, { status: 400 })
    }

  } catch (error) {
    // Minimal log - hassas bilgi yok
    console.error('💥 Kargo oluşturma hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
  }
}

