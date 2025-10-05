import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()

    console.log('📋 Aras Kargo GetDispatch testi başlatılıyor...', {
      date,
      timestamp: new Date().toISOString()
    })

    // Environment variables
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL
    const username = process.env.ARAS_CARGO_USERNAME
    const password = process.env.ARAS_CARGO_PASSWORD

    if (!serviceUrl || !username || !password) {
      console.error('❌ Environment variables eksik!')
      return NextResponse.json({
        success: false,
        error: 'Aras Kargo API bilgileri bulunamadı',
        details: 'Environment variables ayarlanmalı'
      }, { status: 500 })
    }

    // Tarih formatını düzenle (gg.aa.yyyy formatında olmalı)
    const searchDate = date || new Date().toLocaleDateString('tr-TR')
    
    console.log('📅 GetDispatch tarihi:', searchDate)

    // GetDispatch SOAP mesajı
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetDispatch xmlns="http://tempuri.org/">
      <userName>${username}</userName>
      <password>${password}</password>
      <date>${searchDate}</date>
    </GetDispatch>
  </soap:Body>
</soap:Envelope>`

    console.log('📤 GetDispatch SOAP mesajı gönderiliyor:', {
      url: serviceUrl,
      date: searchDate,
      messageLength: soapMessage.length
    })

    // SOAP servisine çağrı
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://tempuri.org/GetDispatch',
        'User-Agent': 'RDHN-Commerce/1.0'
      },
      body: soapMessage,
      signal: AbortSignal.timeout(15000)
    })

    console.log('📥 GetDispatch response alındı:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    })

    const responseText = await response.text()
    
    console.log('📄 GetDispatch response içeriği:', {
      length: responseText.length,
      preview: responseText.substring(0, 500) + '...'
    })

    if (!response.ok) {
      console.error('❌ GetDispatch API hatası:', {
        status: response.status,
        response: responseText
      })

      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: responseText,
        soapRequest: soapMessage
      }, { status: 400 })
    }

    // SOAP Fault kontrolü
    if (responseText.includes('<soap:Fault>')) {
      console.warn('⚠️ GetDispatch SOAP Fault:', responseText)
      
      const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/)
      const faultDetail = faultMatch ? faultMatch[1] : 'SOAP Fault'

      return NextResponse.json({
        success: false,
        error: 'GetDispatch SOAP hatası',
        details: faultDetail,
        fullResponse: responseText,
        type: 'soap_fault'
      }, { status: 400 })
    }

    // Response'u parse et
    try {
      // ShippingOrder elementlerini say
      const shipmentMatches = responseText.match(/<ShippingOrder>/g)
      const shipmentCount = shipmentMatches ? shipmentMatches.length : 0

      console.log('📊 GetDispatch sonuçları:', {
        shipmentCount,
        date: searchDate
      })

      // Basit parse - ilk ShippingOrder'ı örnek olarak al
      let sampleShipment = null
      const shipmentMatch = responseText.match(/<ShippingOrder>(.*?)<\/ShippingOrder>/s)
      if (shipmentMatch) {
        const shipmentXml = shipmentMatch[1]
        
        // Temel bilgileri çıkar
        const cargoKeyMatch = shipmentXml.match(/<CargoKey>(.*?)<\/CargoKey>/)
        const customerNameMatch = shipmentXml.match(/<ReceiverCustName>(.*?)<\/ReceiverCustName>/)
        const cityMatch = shipmentXml.match(/<CityName>(.*?)<\/CityName>/)

        sampleShipment = {
          cargoKey: cargoKeyMatch ? cargoKeyMatch[1] : null,
          customerName: customerNameMatch ? customerNameMatch[1] : null,
          city: cityMatch ? cityMatch[1] : null
        }
      }

      console.log('📦 Örnek gönderi:', sampleShipment)

      return NextResponse.json({
        success: true,
        message: `${searchDate} tarihi için ${shipmentCount} gönderi bulundu`,
        date: searchDate,
        shipmentCount,
        sampleShipment,
        fullResponse: responseText,
        timestamp: new Date().toISOString()
      })

    } catch (parseError) {
      console.error('💥 GetDispatch parse hatası:', parseError)
      
      return NextResponse.json({
        success: false,
        error: 'GetDispatch response parse edilemedi',
        details: responseText,
        parseError: parseError instanceof Error ? parseError.message : 'Parse error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 GetDispatch test hatası:', error)

    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'GetDispatch timeout',
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