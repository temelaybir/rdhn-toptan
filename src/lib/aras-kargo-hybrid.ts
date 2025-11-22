/**
 * Aras Kargo WCF Web Service Entegrasyonu
 * 
 * Bu servis Aras Kargo'nun WCF SOAP servisi ile iletişim kurar.
 * GetQueryJSON metodunu kullanarak kargo takip sorgular.
 * 
 * Manuel SOAP Request ile çalışır (node-soap kullanmaz)
 * 
 * @see E:\ardahanticaret-toptan\kargotakip.md
 */

import axios from 'axios';

interface ArasCargoInfo {
  MUSTERI_OZEL_KODU: string
  IRSALIYE_NUMARA: string
  GONDERICI: string
  ALICI: string
  KARGO_TAKIP_NO: string
  CIKIS_SUBE: string
  VARIS_SUBE: string
  CIKIS_TARIH: string
  ADET: string
  DESI: string
  ODEME_TIPI: string
  TUTAR: string
  REFERANS: string
  VARIS_KODU: string
  TIP_KODU: string
  DURUM_KODU: string
  DURUMU: string
  KARGO_LINK_NO: string
  WORLDWIDE: string
  KARGO_KODU: string
  DURUM_EN: string
  ISLEM_TARIHI: string
  HACIMSEL_AGIRLIK: string
  AGIRLIK: string
}

interface ArasTrackingResponse {
  QueryResult: {
    Cargo?: ArasCargoInfo
    VARIS_KODU?: string
    TIP_KODU?: string
    DURUM_KODU?: string
    DURUMU?: string
    KARGO_LINK_NO?: string
    WORLDWIDE?: string
    KARGO_KODU?: string
    DURUM_EN?: string
    ISLEM_TARIHI?: string
    HACIMSEL_AGIRLIK?: string
    AGIRLIK?: string
  }
  meta?: {
    success: boolean
    message: string
    queriedAt: string
    service: string
    integrationCode: string
  }
}

class ArasKargoHybridService {
  private wcfEndpoint: string
  private username: string
  private password: string
  private customerCode: string

  constructor() {
    // WCF Service Endpoint (SOAP değil, direkt endpoint)
    this.wcfEndpoint = "https://customerservices.araskargo.com.tr/ArasCargoCustomerIntegrationService/ArasCargoIntegrationService.svc"
    
    // Credentials from environment
    this.username = process.env.ARAS_KARGO_USERNAME || 
                    process.env.ARAS_CARGO_USERNAME || 
                    process.env.ARAS_KARGO_SETORDER_USERNAME || 
                    'ardahan'
    this.password = process.env.ARAS_KARGO_PASSWORD || 
                    process.env.ARAS_CARGO_PASSWORD || 
                    process.env.ARAS_KARGO_SETORDER_PASSWORD || 
                    'ardahanticaret'
    this.customerCode = process.env.ARAS_KARGO_CUSTOMER_CODE || 
                       process.env.ARAS_CARGO_CUSTOMER_CODE || 
                       '919508001128'
  }

  /**
   * Manuel SOAP Request oluşturur
   */
  private createSOAPEnvelope(loginInfoXml: string, queryInfoXml: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:GetQueryJSON>
      <tem:loginInfo><![CDATA[${loginInfoXml}]]></tem:loginInfo>
      <tem:queryInfo><![CDATA[${queryInfoXml}]]></tem:queryInfo>
    </tem:GetQueryJSON>
  </soap:Body>
</soap:Envelope>`
  }

  /**
   * SOAP Response'dan JSON'ı parse eder
   */
  private parseSOAPResponse(xmlResponse: string): any {
    try {
      // GetQueryJSONResult tag'i içindeki JSON'ı bul
      const jsonMatch = xmlResponse.match(/<GetQueryJSONResult>(.*?)<\/GetQueryJSONResult>/s)
      if (!jsonMatch) {
        throw new Error('GetQueryJSONResult bulunamadı')
      }

      // XML entities decode et
      let jsonString = jsonMatch[1]
      jsonString = jsonString
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')

      // JSON parse et
      return JSON.parse(jsonString)
    } catch (error: any) {
      console.error('❌ SOAP Response parse hatası:', error.message)
      throw new Error(`SOAP Response parse edilemedi: ${error.message}`)
    }
  }

  /**
   * Integration Code ile kargo takip bilgisi sorgular
   * 
   * @param integrationCode - Sipariş numarası / MUSTERI_OZEL_KODU
   * @returns Kargo detay bilgileri
   */
  async getTrackingInfo(integrationCode: string): Promise<ArasTrackingResponse> {
    try {
      // Login XML
      const loginInfoXml = `<LoginInfo><UserName>${this.username}</UserName><Password>${this.password}</Password><CustomerCode>${this.customerCode}</CustomerCode></LoginInfo>`

      // Query XML
      const queryInfoXml = `<QueryInfo><QueryType>1</QueryType><IntegrationCode>${integrationCode}</IntegrationCode></QueryInfo>`

      // SOAP Envelope oluştur
      const soapEnvelope = this.createSOAPEnvelope(loginInfoXml, queryInfoXml)

      console.log('📤 SOAP Request gönderiliyor...')
      console.log('🔍 IntegrationCode:', integrationCode)

      // HTTP POST ile SOAP request gönder
      const response = await axios.post(this.wcfEndpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IArasCargoIntegrationService/GetQueryJSON'
        },
        timeout: 30000 // 30 saniye
      })

      console.log('✅ SOAP Response alındı')

      // SOAP Response'u parse et
      const parsed = this.parseSOAPResponse(response.data)
      
      return parsed
      
    } catch (error: any) {
      console.error('❌ WCF Tracking hatası:', error.message)
      
      // Axios error details
      if (error.response) {
        console.error('📥 Response Status:', error.response.status)
        console.error('📥 Response Data:', error.response.data?.substring(0, 500))
      }
      
      throw new Error(`Kargo takip sorgusu başarısız: ${error.message}`)
    }
  }

  /**
   * Tracking Number (KARGO_TAKIP_NO) ile sorgulama
   * 
   * @param trackingNumber - 13 haneli Aras Kargo takip numarası
   * @returns Kargo detay bilgileri
   */
  async getTrackingInfoByTrackingNumber(trackingNumber: string): Promise<ArasTrackingResponse> {
    try {
      const loginInfoXml = `<LoginInfo><UserName>${this.username}</UserName><Password>${this.password}</Password><CustomerCode>${this.customerCode}</CustomerCode></LoginInfo>`
      const queryInfoXml = `<QueryInfo><QueryType>1</QueryType><TrackingNumber>${trackingNumber}</TrackingNumber></QueryInfo>`

      const soapEnvelope = this.createSOAPEnvelope(loginInfoXml, queryInfoXml)

      console.log('📤 SOAP Request gönderiliyor...')
      console.log('🔍 TrackingNumber:', trackingNumber)

      const response = await axios.post(this.wcfEndpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IArasCargoIntegrationService/GetQueryJSON'
        },
        timeout: 30000
      })

      console.log('✅ SOAP Response alındı')

      const parsed = this.parseSOAPResponse(response.data)
      
      return parsed
      
    } catch (error: any) {
      console.error('❌ WCF Tracking Number sorgusu hatası:', error.message)
      
      if (error.response) {
        console.error('📥 Response Status:', error.response.status)
        console.error('📥 Response Data:', error.response.data?.substring(0, 500))
      }
      
      throw new Error(`Kargo takip numarası sorgusu başarısız: ${error.message}`)
    }
  }

  /**
   * Kargo durum kodunu Türkçe açıklamasına çevirir
   */
  static getStatusDescription(statusCode: string): string {
    const statusMap: { [key: string]: string } = {
      '1': 'ALINDI',
      '2': 'YOLDA - NORMAL',
      '3': 'ŞUBEDE',
      '4': 'DAĞITIMDA',
      '5': 'TESLİM ALINMADI',
      '6': 'TESLİM EDİLDİ'
    }
    return statusMap[statusCode] || 'BİLİNMEYEN DURUM'
  }

  /**
   * Kargo durum kodunu İngilizce açıklamasına çevirir
   */
  static getStatusDescriptionEN(statusCode: string): string {
    const statusMap: { [key: string]: string } = {
      '1': 'RECEIVED',
      '2': 'PROCESSED AT LOCATION',
      '3': 'AT BRANCH',
      '4': 'OUT FOR DELIVERY',
      '5': 'NOT DELIVERED',
      '6': 'DELIVERED'
    }
    return statusMap[statusCode] || 'UNKNOWN STATUS'
  }
}

export default ArasKargoHybridService
export type { ArasCargoInfo, ArasTrackingResponse }
