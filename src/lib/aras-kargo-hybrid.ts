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
    
    // Credentials from environment - Deploy'da environment variables zorunlu
    // Öncelik sırası: ARAS_KARGO_* > ARAS_CARGO_* > ARAS_KARGO_SETORDER_*
    this.username = process.env.ARAS_KARGO_USERNAME || 
                    process.env.ARAS_CARGO_USERNAME || 
                    process.env.ARAS_KARGO_SETORDER_USERNAME
    
    this.password = process.env.ARAS_KARGO_PASSWORD || 
                    process.env.ARAS_CARGO_PASSWORD || 
                    process.env.ARAS_KARGO_SETORDER_PASSWORD
    
    this.customerCode = process.env.ARAS_KARGO_CUSTOMER_CODE || 
                       process.env.ARAS_CARGO_CUSTOMER_CODE
    
    // Deploy'da environment variables kontrolü
    if (!this.username || !this.password || !this.customerCode) {
      const missingVars = []
      if (!this.username) missingVars.push('ARAS_KARGO_USERNAME veya ARAS_CARGO_USERNAME')
      if (!this.password) missingVars.push('ARAS_KARGO_PASSWORD veya ARAS_CARGO_PASSWORD')
      if (!this.customerCode) missingVars.push('ARAS_KARGO_CUSTOMER_CODE veya ARAS_CARGO_CUSTOMER_CODE')
      
      console.error('❌ Aras Kargo environment variables eksik:', missingVars.join(', '))
      console.error('💡 Vercel Environment Variables ayarlarını kontrol edin')
      
      // Deploy'da hata fırlat, local'de uyarı ver
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error(`Aras Kargo credentials eksik: ${missingVars.join(', ')}`)
      }
    }
    
    // Debug log (sadece development'ta)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Aras Kargo credentials yüklendi:', {
        username: this.username?.substring(0, 3) + '...',
        hasPassword: !!this.password,
        customerCode: this.customerCode
      })
    }
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
   * SOAP Fault mesajını parse eder
   */
  private parseSOAPFault(xmlResponse: string): { code: string; message: string; detail?: string } | null {
    try {
      const faultMatch = xmlResponse.match(/<s:Fault>([\s\S]*?)<\/s:Fault>/)
      if (!faultMatch) return null

      const faultXml = faultMatch[1]
      const faultcodeMatch = faultXml.match(/<faultcode[^>]*>([\s\S]*?)<\/faultcode>/)
      const faultstringMatch = faultXml.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/)
      const detailMatch = faultXml.match(/<detail>([\s\S]*?)<\/detail>/)

      return {
        code: faultcodeMatch ? faultcodeMatch[1].trim() : 'Unknown',
        message: faultstringMatch ? faultstringMatch[1].trim() : 'Unknown error',
        detail: detailMatch ? detailMatch[1].trim() : undefined
      }
    } catch {
      return null
    }
  }

  /**
   * Integration Code ile kargo takip bilgisi sorgular
   * 
   * ÖNEMLİ: IntegrationCode, SetOrder API'sinden dönen orgReceiverCustId değeri olmalıdır.
   * Bu değer veritabanında kargo_talepno alanında saklanır.
   * 
   * @param integrationCode - Aras API'den dönen orgReceiverCustId (örnek: 919508001128007)
   * @returns Kargo detay bilgileri
   */
  async getTrackingInfo(integrationCode: string): Promise<ArasTrackingResponse> {
    try {
      // IntegrationCode validasyonu - sadece sayılar ve maksimum uzunluk kontrolü
      const cleanIntegrationCode = integrationCode.trim().replace(/\D/g, '')
      if (!cleanIntegrationCode || cleanIntegrationCode.length === 0) {
        throw new Error('IntegrationCode geçersiz: Boş veya geçersiz format')
      }

      // Login XML
      const loginInfoXml = `<LoginInfo><UserName>${this.username}</UserName><Password>${this.password}</Password><CustomerCode>${this.customerCode}</CustomerCode></LoginInfo>`

      // Query XML - temizlenmiş IntegrationCode kullan
      const queryInfoXml = `<QueryInfo><QueryType>1</QueryType><IntegrationCode>${cleanIntegrationCode}</IntegrationCode></QueryInfo>`

      // SOAP Envelope oluştur
      const soapEnvelope = this.createSOAPEnvelope(loginInfoXml, queryInfoXml)

      console.log('📤 SOAP Request gönderiliyor...')
      console.log('🔍 IntegrationCode:', cleanIntegrationCode)
      console.log('🔍 CustomerCode:', this.customerCode)
      console.log('🌐 Endpoint:', this.wcfEndpoint)
      console.log('🌍 Environment:', process.env.VERCEL ? 'Vercel' : process.env.NODE_ENV || 'unknown')

      // HTTP POST ile SOAP request gönder
      // Deploy ortamında daha uzun timeout ve retry mekanizması
      const axiosConfig: any = {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IArasCargoIntegrationService/GetQueryJSON',
          'User-Agent': 'ArdahanTicaret/1.0'
        },
        timeout: process.env.VERCEL ? 45000 : 30000, // Vercel'de daha uzun timeout
        maxRedirects: 5,
        validateStatus: (status: number) => status < 500, // 500'e kadar status kodlarını kabul et
        // SSL/TLS ayarları
        httpsAgent: process.env.NODE_ENV === 'production' ? undefined : undefined,
        // Deploy'da daha fazla retry
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }

      const response = await axios.post(this.wcfEndpoint, soapEnvelope, axiosConfig)

      // 500 hatası kontrolü - SOAP Fault olabilir
      if (response.status === 500 || response.data?.includes('<s:Fault>')) {
        const fault = this.parseSOAPFault(response.data)
        if (fault) {
          console.error('❌ SOAP Fault alındı:', fault)
          throw new Error(`Aras Kargo API hatası: ${fault.message} (${fault.code})`)
        }
      }

      console.log('✅ SOAP Response alındı')

      // SOAP Response'u parse et
      const parsed = this.parseSOAPResponse(response.data)
      
      return parsed
      
    } catch (error: any) {
      console.error('❌ WCF Tracking hatası:', error.message)
      
      // Axios error details
      if (error.response) {
        console.error('📥 Response Status:', error.response.status)
        const responseData = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
        
        console.error('📥 Response Data:', responseData?.substring(0, 1000))
        
        // SOAP Fault parse et
        if (error.response.status === 500 && responseData) {
          const fault = this.parseSOAPFault(responseData)
          if (fault) {
            const faultMessage = `Aras Kargo API hatası (500): ${fault.message}`
            console.error('📥 SOAP Fault Details:', fault)
            throw new Error(faultMessage)
          }
        }
      }
      
      // Network/timeout hataları
      if (error.code === 'ECONNABORTED') {
        throw new Error('Aras Kargo API\'ye bağlanılamadı: Timeout (30 saniye)')
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Aras Kargo API\'ye bağlanılamadı: Sunucu bulunamadı')
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
      // TrackingNumber validasyonu - sadece sayılar
      const cleanTrackingNumber = trackingNumber.trim().replace(/\D/g, '')
      if (!cleanTrackingNumber || cleanTrackingNumber.length === 0) {
        throw new Error('TrackingNumber geçersiz: Boş veya geçersiz format')
      }

      const loginInfoXml = `<LoginInfo><UserName>${this.username}</UserName><Password>${this.password}</Password><CustomerCode>${this.customerCode}</CustomerCode></LoginInfo>`
      const queryInfoXml = `<QueryInfo><QueryType>1</QueryType><TrackingNumber>${cleanTrackingNumber}</TrackingNumber></QueryInfo>`

      const soapEnvelope = this.createSOAPEnvelope(loginInfoXml, queryInfoXml)

      console.log('📤 SOAP Request gönderiliyor...')
      console.log('🔍 TrackingNumber:', cleanTrackingNumber)
      console.log('🔍 CustomerCode:', this.customerCode)
      console.log('🌐 Endpoint:', this.wcfEndpoint)
      console.log('🌍 Environment:', process.env.VERCEL ? 'Vercel' : process.env.NODE_ENV || 'unknown')

      // Deploy ortamında daha uzun timeout ve retry mekanizması
      const axiosConfig: any = {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/IArasCargoIntegrationService/GetQueryJSON',
          'User-Agent': 'ArdahanTicaret/1.0'
        },
        timeout: process.env.VERCEL ? 45000 : 30000, // Vercel'de daha uzun timeout
        maxRedirects: 5,
        validateStatus: (status: number) => status < 500,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }

      const response = await axios.post(this.wcfEndpoint, soapEnvelope, axiosConfig)

      // 500 hatası kontrolü - SOAP Fault olabilir
      if (response.status === 500 || response.data?.includes('<s:Fault>')) {
        const fault = this.parseSOAPFault(response.data)
        if (fault) {
          console.error('❌ SOAP Fault alındı:', fault)
          throw new Error(`Aras Kargo API hatası: ${fault.message} (${fault.code})`)
        }
      }

      console.log('✅ SOAP Response alındı')

      const parsed = this.parseSOAPResponse(response.data)
      
      return parsed
      
    } catch (error: any) {
      console.error('❌ WCF Tracking Number sorgusu hatası:', error.message)
      
      if (error.response) {
        console.error('📥 Response Status:', error.response.status)
        const responseData = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
        
        console.error('📥 Response Data:', responseData?.substring(0, 1000))
        
        // SOAP Fault parse et
        if (error.response.status === 500 && responseData) {
          const fault = this.parseSOAPFault(responseData)
          if (fault) {
            const faultMessage = `Aras Kargo API hatası (500): ${fault.message}`
            console.error('📥 SOAP Fault Details:', fault)
            throw new Error(faultMessage)
          }
        }
      }
      
      // Network/timeout hataları
      if (error.code === 'ECONNABORTED') {
        throw new Error('Aras Kargo API\'ye bağlanılamadı: Timeout (30 saniye)')
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Aras Kargo API\'ye bağlanılamadı: Sunucu bulunamadı')
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
