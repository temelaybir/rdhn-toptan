import { NextRequest, NextResponse } from 'next/server'
import { CreateShipmentData } from '@/types/cargo'

export async function POST(request: NextRequest) {
  try {
    const shipmentData: CreateShipmentData = await request.json()

    console.log('🚚 Aras Kargo SetDispatch testi başlatılıyor...', {
      orderNumber: shipmentData.orderNumber,
      recipientName: shipmentData.recipientName,
      recipientCity: shipmentData.recipientCity,
      timestamp: new Date().toISOString()
    })

    // Environment variables'dan API bilgilerini al
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL
    const username = process.env.ARAS_CARGO_USERNAME
    const password = process.env.ARAS_CARGO_PASSWORD
    const customerCode = process.env.ARAS_CARGO_CUSTOMER_CODE

    if (!serviceUrl || !username || !password) {
      console.error('❌ Aras Kargo environment variables eksik!')
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo API bilgileri bulunamadı',
        details: 'Environment variables (ARAS_CARGO_SERVICE_URL, ARAS_CARGO_USERNAME, ARAS_CARGO_PASSWORD, ARAS_CARGO_CUSTOMER_CODE) ayarlanmalı'
      }, { status: 500 })
    }

    // SetDispatch SOAP mesajını oluştur (sopdetay.md'deki formata uygun)
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SetDispatch xmlns="http://tempuri.org/">
      <shippingOrders>
        <ShippingOrder>
          <UserName>${username}</UserName>
          <Password>${password}</Password>
          <CargoKey>${shipmentData.orderNumber}</CargoKey>
          <InvoiceKey>${shipmentData.orderNumber}</InvoiceKey>
          <ReceiverCustName>${shipmentData.recipientName}</ReceiverCustName>
          <ReceiverAddress>${shipmentData.recipientAddress}</ReceiverAddress>
          <ReceiverPhone1>${shipmentData.recipientPhone}</ReceiverPhone1>
          <CityName>${shipmentData.recipientCity}</CityName>
          <TownName>${shipmentData.recipientDistrict}</TownName>
          <Desi>${shipmentData.desi}</Desi>
          <Kg>${shipmentData.weight}</Kg>
          <CargoCount>1</CargoCount>
          <OrgReceiverCustId>${shipmentData.orderNumber}</OrgReceiverCustId>
          <Description>${shipmentData.description || 'Test ürün'}</Description>
          ${shipmentData.productPrice ? `<TtInvoiceAmount>${shipmentData.productPrice}</TtInvoiceAmount>` : ''}
          ${shipmentData.paymentType === 'recipient' ? '<TtCollectionType>0</TtCollectionType>' : ''}
        </ShippingOrder>
      </shippingOrders>
      <userName>${username}</userName>
      <password>${password}</password>
    </SetDispatch>
  </soap:Body>
</soap:Envelope>`

    console.log('📤 SetDispatch SOAP mesajı gönderiliyor:', {
      url: serviceUrl,
      messageLength: soapMessage.length,
      username: username.substring(0, 3) + '***',
      hasCustomerCode: !!customerCode
    })

    // Aras Kargo SOAP servisine çağrı yap
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/SetDispatch',
        'User-Agent': 'RDHN-Commerce/1.0'
      },
      body: soapMessage,
      signal: AbortSignal.timeout(15000) // 15 saniye timeout
    })

    console.log('📥 SetDispatch response alındı:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    })

    const responseText = await response.text()
    
    console.log('📄 SetDispatch response içeriği:', {
      length: responseText.length,
      preview: responseText.substring(0, 300) + '...'
    })

    if (!response.ok) {
      console.error('❌ SetDispatch API hatası:', {
        status: response.status,
        response: responseText
      })

      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: responseText,
        soapRequest: soapMessage,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // SOAP Fault kontrolü
    if (responseText.includes('<soap:Fault>')) {
      console.warn('⚠️ SetDispatch SOAP Fault:', responseText)
      
      // Fault detaylarını parse et
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const faultDetail = faultMatch ? faultMatch[1] : 'SOAP Fault'

      return NextResponse.json({
        success: false,
        error: 'SetDispatch SOAP hatası',
        details: faultDetail,
        fullResponse: responseText,
        type: 'soap_fault'
      }, { status: 400 })
    }

    // Response'u parse et
    try {
      // ErrorCode'u bul
      const errorCodeMatch = responseText.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
      const messageMatch = responseText.match(/<Message>(.*?)<\/Message>/)
      const trackingMatch = responseText.match(/<TrackingNumber>(.*?)<\/TrackingNumber>/)

      const errorCode = errorCodeMatch ? errorCodeMatch[1] : '999'
      const message = messageMatch ? messageMatch[1] : 'Bilinmeyen yanıt'
      const trackingNumber = trackingMatch ? trackingMatch[1] : null

      console.log('🔍 SetDispatch sonuç parse edildi:', {
        errorCode,
        message,
        trackingNumber
      })

      if (errorCode === '0') {
        // Başarılı
        console.log('✅ SetDispatch başarılı! Kargo oluşturuldu:', trackingNumber)
        
        return NextResponse.json({
          success: true,
          message: 'Kargo başarıyla oluşturuldu',
          trackingNumber,
          errorCode,
          fullResponse: responseText,
          shipmentData,
          timestamp: new Date().toISOString()
        })
      } else {
        // Hata kodu
        console.warn('⚠️ SetDispatch hata kodu:', errorCode, message)
        
        return NextResponse.json({
          success: false,
          error: `Aras Kargo Hatası (${errorCode})`,
          details: message,
          errorCode,
          fullResponse: responseText,
          type: 'business_error'
        }, { status: 400 })
      }

    } catch (parseError) {
      console.error('💥 Response parse hatası:', parseError)
      
      return NextResponse.json({
        success: false,
        error: 'Response parse edilemedi',
        details: responseText,
        parseError: parseError instanceof Error ? parseError.message : 'Parse error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 SetDispatch test hatası:', error)

    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'SetDispatch timeout',
        details: 'Aras Kargo servisi 15 saniye içinde yanıt vermedi.'
      }, { status: 408 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      details: error instanceof Error ? error.stack : JSON.stringify(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 