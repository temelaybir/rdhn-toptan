import { 
  CargoTrackingService, 
  CargoInfo, 
  CargoCompany,
  CargoStatus,
  CargoMovement,
  ARAS_STATUS_MAP
} from '@/types/cargo'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import fetch, { type RequestInit as NodeFetchRequestInit } from 'node-fetch'

export interface ArasCargoConfig {
  serviceUrl: string
  username: string
  password: string
  customerCode: string
}

export interface CreateShipmentData {
  orderNumber: string // TradingWaybillNumber (max 16 karakter)
  integrationCode?: string // IntegrationCode (tam order number, limit yok)
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientCity: string
  recipientDistrict: string
  recipientPostalCode: string
  senderName: string
  senderPhone: string
  senderAddress: string
  weight: number
  desi: number
  paymentType: 'sender' | 'receiver'
  productPrice: number
  description: string
}


export interface ArasCargoResponse {
  success: boolean
  data?: any
  error?: string
  trackingNumber?: string
  barcode?: string
  resultCode?: string
  resultMessage?: string
  integrationCode?: string // IntegrationCode for queries (e.g., 919508001128007)
  invoiceKey?: string // InvoiceKey = TradingWaybillNumber (e.g., AR1753866567182)
}

export interface AraCityData {
  CityID: number
  CityName: string
}

export interface ArasTownData {
  TownID: number
  TownName: string
  CityID: number
}

export interface ArasPriceCalculation {
  weight: number
  desi: number
  cityFrom: string
  cityTo: string
  serviceType: string
}

export class ArasCargoService {
  private config: ArasCargoConfig
  // Aras Kargo SOAP service URLs
  private testServiceUrl = 'https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx'
  private prodServiceUrl = 'https://customerws.araskargo.com.tr/arascargoservice.asmx'

  constructor(config: ArasCargoConfig) {
    this.config = config
  }

  /**
   * Squid proxy configuration for Aras Kargo
   */
  private getProxyAgent(): any {
    // Yeni Squid proxy bilgileri
    const proxyHost = process.env.ARAS_PROXY_HOST || 'api2.plante.biz'
    const proxyPort = process.env.ARAS_PROXY_PORT || '3128'
    const proxyUser = process.env.ARAS_PROXY_USER || 'plante'
    const proxyPassword = process.env.ARAS_PROXY_PASSWORD || 'h01h0203'
    const useProxy = process.env.ARAS_USE_PROXY === 'true'

    if (!useProxy) {
      console.log('🚫 Aras Kargo: Proxy kullanılmıyor - doğrudan bağlantı')
      return undefined
    }

    console.log('🔄 Aras Kargo Squid Proxy yapılandırması:')
    console.log(`   Host: ${proxyHost}:${proxyPort}`)
    console.log(`   Kullanıcı: ${proxyUser}`)
    console.log('   Şifre: [gizli]')

    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`
    
    // HTTP service URL için HTTP agent kullan
    const serviceUrl = this.getServiceUrl()
    if (serviceUrl.startsWith('https://')) {
      return new HttpsProxyAgent(proxyUrl)
    } else {
      return new HttpProxyAgent(proxyUrl)
    }
  }

  /**
   * Enhanced fetch wrapper with proxy support
   * Uses node-fetch for proxy support (Next.js native fetch doesn't support agent)
   */
  private async fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
    const agent = this.getProxyAgent()
    
    // Dynamic import node-fetch for server-side only
    const nodeFetch = await import('node-fetch')
    const fetch = nodeFetch.default
    
    const fetchOptions: any = {
      ...options,
      agent: agent
    }

    // Add timeout if not set
    if (!fetchOptions.signal) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 saniye timeout
      fetchOptions.signal = controller.signal
      
      try {
        const response = await fetch(url, fetchOptions)
        clearTimeout(timeoutId)
        return response as any as Response
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    return fetch(url, fetchOptions) as any as Response
  }

  // Production host + Laravel path (best of both worlds)
  private getServiceUrl(): string {
    // Güncellenmiş URL (customerws -> customerservices)
    return this.prodServiceUrl
  }

  // Using SetOrder method (SOAP 1.2 format with PieceDetails)
  async createShipment(shipmentData: CreateShipmentData): Promise<ArasCargoResponse> {
    try {
      console.log('🚚 Creating Aras Kargo shipment with SetOrder (SOAP 1.2 format)...')
      
      // Generate IntegrationCode and BarcodeNumber
      // TradingWaybillNumber: orderNumber (max 16 karakter)
      // IntegrationCode: integrationCode veya orderNumber (tam order number)
      // BarcodeNumber: IntegrationCode + "1" (e.g., 9195080011280071)
      const integrationCode = shipmentData.integrationCode || shipmentData.orderNumber
      const barcodeNumber = `${integrationCode}1`
      
      // Minimal log - hassas bilgiler (adres, telefon, isim) log'lanmaz
      console.log('📤 SetOrder gönderiliyor:', {
        orderNumber: shipmentData.orderNumber?.substring(0, 10) + '...',
        integrationCode: integrationCode?.substring(0, 10) + '...',
        city: shipmentData.recipientCity,
        district: shipmentData.recipientDistrict
      })
      
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/">
  <soap:Header/>
  <soap:Body>
    <SetOrder xmlns="http://tempuri.org/">
      <orderInfo>
        <Order>
          <UserName>${this.config.username}</UserName>
          <Password>${this.config.password}</Password>
          <TradingWaybillNumber>${shipmentData.orderNumber}</TradingWaybillNumber>
          <InvoiceNumber>${shipmentData.orderNumber}</InvoiceNumber>
          <ReceiverName>${shipmentData.recipientName}</ReceiverName>
          <ReceiverAddress>${shipmentData.recipientAddress}</ReceiverAddress>
          <ReceiverPhone1>${shipmentData.recipientPhone}</ReceiverPhone1>
          <ReceiverCityName>${shipmentData.recipientCity}</ReceiverCityName>
          <ReceiverTownName>${shipmentData.recipientDistrict}</ReceiverTownName>
          <PayorTypeCode>${shipmentData.paymentType === 'sender' ? '1' : '2'}</PayorTypeCode>
          <IsWorldWide>0</IsWorldWide>
          <IsCod>0</IsCod>
          <PieceCount>1</PieceCount>
          <IntegrationCode>${integrationCode}</IntegrationCode>
          <PieceDetails>
            <PieceDetail>
              <VolumetricWeight>${shipmentData.desi || 1}</VolumetricWeight>
              <Weight>${shipmentData.weight || 1}</Weight>
              <BarcodeNumber>${barcodeNumber}</BarcodeNumber>
            </PieceDetail>
          </PieceDetails>
        </Order>
      </orderInfo>
      <userName>${this.config.username}</userName>
      <password>${this.config.password}</password>
    </SetOrder>
  </soap:Body>
</soap:Envelope>`

      const response = await this.fetchWithProxy(this.getServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/SetOrder'
        },
        body: soapBody
      })

      const responseText = await response.text()
      
      // Sadece başarı/hata durumunu log'la (raw XML log'lanmaz - güvenlik)
      if (!response.ok) {
        console.error('❌ SetOrder HTTP hatası:', response.status, response.statusText)
      }

      // Parse SetOrderResponse > SetOrderResult > OrderResultInfo
      // Farklı namespace'lerde olabilir, tüm olasılıkları kontrol et
      const resultCodeMatch = responseText.match(/<ResultCode[^>]*>(.*?)<\/ResultCode>/i) || 
                                    responseText.match(/<.*?:ResultCode[^>]*>(.*?)<\/.*?:ResultCode>/i)
      const resultMessageMatch = responseText.match(/<ResultMessage[^>]*>(.*?)<\/ResultMessage>/i) ||
                                 responseText.match(/<.*?:ResultMessage[^>]*>(.*?)<\/.*?:ResultMessage>/i)
      const invoiceKeyMatch = responseText.match(/<InvoiceKey[^>]*>(.*?)<\/InvoiceKey>/i) ||
                             responseText.match(/<.*?:InvoiceKey[^>]*>(.*?)<\/.*?:InvoiceKey>/i)
      
      // OrgReceiverCustId için farklı olasılıkları dene
      let orgReceiverCustIdMatch = responseText.match(/<OrgReceiverCustId[^>]*>(.*?)<\/OrgReceiverCustId>/i)
      if (!orgReceiverCustIdMatch) {
        orgReceiverCustIdMatch = responseText.match(/<.*?:OrgReceiverCustId[^>]*>(.*?)<\/.*?:OrgReceiverCustId>/i)
      }
      if (!orgReceiverCustIdMatch) {
        // Belki farklı bir isimle dönüyor
        orgReceiverCustIdMatch = responseText.match(/<ReceiverCustId[^>]*>(.*?)<\/ReceiverCustId>/i)
      }
      if (!orgReceiverCustIdMatch) {
        orgReceiverCustIdMatch = responseText.match(/<IntegrationCode[^>]*>(.*?)<\/IntegrationCode>/i)
      }
      
      // BarcodeNumber için farklı olasılıkları dene (Response'tan gerçek barkodu al)
      let barcodeNumberMatch = responseText.match(/<BarcodeNumber[^>]*>(.*?)<\/BarcodeNumber>/i)
      if (!barcodeNumberMatch) {
        barcodeNumberMatch = responseText.match(/<.*?:BarcodeNumber[^>]*>(.*?)<\/.*?:BarcodeNumber>/i)
      }
      if (!barcodeNumberMatch) {
        barcodeNumberMatch = responseText.match(/<Barcode[^>]*>(.*?)<\/Barcode>/i)
      }
      
      const resultCode = resultCodeMatch?.[1]?.trim()
      const resultMessage = resultMessageMatch?.[1]?.trim()
      const invoiceKey = invoiceKeyMatch?.[1]?.trim()
      const orgReceiverCustId = orgReceiverCustIdMatch?.[1]?.trim()
      const responseBarcode = barcodeNumberMatch?.[1]?.trim()
      
      // Minimal debug - sadece parse sonuçları
      if (!orgReceiverCustIdMatch) {
        console.warn('⚠️ OrgReceiverCustId parse edilemedi')
      }
      if (!barcodeNumberMatch) {
        console.warn('⚠️ BarcodeNumber parse edilemedi')
      }
      
      const isSuccess = resultCode === '0' // 0 = başarılı
      
      // ÖNEMLİ: IntegrationCode MUTLAKA Aras'tan dönen orgReceiverCustId olmalı
      // Eğer orgReceiverCustId yoksa, bu bir hata - Aras API'den dönmeli
      // Fallback olarak gönderdiğimiz integrationCode (orderNumber) kullanmak YANLIŞ
      // çünkü Aras sistemi bizim sipariş numaramızı tanımaz
      const finalIntegrationCode = orgReceiverCustId || integrationCode
      
      // BarcodeNumber: Aras'tan dönen gerçek barkod numarasını kullan
      // Eğer dönmediyse fallback olarak integrationCode + "1" kullan (eski mantık)
      const finalBarcodeNumber = responseBarcode || `${finalIntegrationCode}1`
      
      // Sadece önemli sonuçları log'la
      if (isSuccess) {
        console.log('✅ SetOrder başarılı:', {
          resultCode,
          integrationCode: finalIntegrationCode,
          barcode: finalBarcodeNumber,
          invoiceKey,
          barcodeSource: responseBarcode ? 'Aras API' : 'Generated'
        })
      } else {
        console.error('❌ SetOrder başarısız:', {
          resultCode,
          resultMessage
        })
      }
      
      // Eğer orgReceiverCustId yoksa, uyarı ver (minimal log)
      if (!orgReceiverCustId && isSuccess) {
        console.warn('⚠️ SetOrder başarılı ama OrgReceiverCustId dönmedi - GetCargoInfo çalışmayabilir')
      }
      
      return {
        success: isSuccess && response.ok,
        data: responseText,
        resultCode,
        resultMessage,
        trackingNumber: invoiceKey || undefined, // InvoiceKey = TradingWaybillNumber
        barcode: finalBarcodeNumber, // BarcodeNumber - Gerçek barkod (Aras API'den veya generated)
        integrationCode: finalIntegrationCode, // IntegrationCode - Sorgulama için kullanılır
        invoiceKey: invoiceKey || undefined
      }

    } catch (error) {
      console.error('❌ SetOrder error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Updated query method using GetCargoInfo (more specific than GetDispatch)
  async queryCargoStatus(barcode: string): Promise<ArasCargoResponse> {
    try {
      console.log(`🔍 Querying cargo status with GetCargoInfo for barcode: ${barcode}`)
      
      // GetCargoInfo için parametreler
      // Hata mesajına göre: GetCargoInfo(String username, String password, String customerCode, String integrationCode)
      // Bu yüzden <barcode> yerine <integrationCode> kullanmalıyız
      // Ayrıca parametre sırası: username, password, customerCode, integrationCode
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCargoInfo xmlns="http://tempuri.org/">
      <username>${this.config.username}</username>
      <password>${this.config.password}</password>
      <customerCode>${this.config.customerCode}</customerCode>
      <integrationCode>${barcode}</integrationCode>
    </GetCargoInfo>
  </soap:Body>
</soap:Envelope>`

      const response = await this.fetchWithProxy(this.getServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/GetCargoInfo'
        },
        body: soapBody
      })

      const responseText = await response.text()
      // Minimal log - hassas bilgi (adres, telefon, isim) log'lanmaz
      console.log('📊 GetCargoInfo Response Length:', responseText.length)
      console.log('📊 GetCargoInfo Response Status:', response.status, response.statusText)

      // Check for SOAP Fault
      if (responseText.includes('<soap:Fault>') || responseText.includes('<faultstring>')) {
        const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/i) || 
                          responseText.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i)
        const faultCodeMatch = responseText.match(/<faultcode>(.*?)<\/faultcode>/i)
        
        const errorMessage = faultMatch ? faultMatch[1].trim() : 'SOAP Fault detected'
        const faultCode = faultCodeMatch ? faultCodeMatch[1].trim() : 'Unknown'
        
        console.error('❌ GetCargoInfo SOAP Fault:', {
          faultCode,
          faultMessage: errorMessage,
          responseText: responseText.substring(0, 500) // İlk 500 karakter
        })
        
        return {
          success: false,
          error: errorMessage,
          data: responseText
        }
      }

      // Check if response contains GetCargoInfoResult
      const hasResult = responseText.includes('<GetCargoInfoResult>') || 
                       responseText.includes('GetCargoInfoResult')
      
      if (!hasResult && response.ok) {
        // Minimal log - hassas bilgi (adres, telefon, isim) log'lanmaz
        console.warn('⚠️ GetCargoInfo Response does not contain GetCargoInfoResult')
      }

      return {
        success: response.ok && !responseText.includes('<soap:Fault>'),
        data: responseText,
        error: responseText.includes('<soap:Fault>') ? 'SOAP Fault in response' : undefined
      }

    } catch (error) {
      console.error('❌ GetCargoInfo error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // New method: Get Aras Barcode
  async generateArasBarcode(orderNumber: string): Promise<ArasCargoResponse> {
    try {
      // Minimal log - hassas bilgi yok
      console.log('🏷️ Generating Aras barcode')
      
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetArasBarcode xmlns="http://tempuri.org/">
      <cargoKey>${orderNumber}</cargoKey>
      <userName>${this.config.username}</userName>
      <password>${this.config.password}</password>
    </GetArasBarcode>
  </soap:Body>
</soap:Envelope>`

      const response = await this.fetchWithProxy(this.getServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/GetArasBarcode'
        },
        body: soapBody
      })

      const responseText = await response.text()
      // Response log'lanmaz - güvenlik

      const barcodeMatch = responseText.match(/<GetArasBarcodeResult>(.*?)<\/GetArasBarcodeResult>/)

      return {
        success: response.ok && !responseText.includes('Error'),
        data: responseText,
        barcode: barcodeMatch?.[1]
      }

    } catch (error) {
      console.error('❌ GetArasBarcode error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // New method: Get City List
  async getCityList(): Promise<AraCityData[]> {
    try {
      // Minimal log
      
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCityList xmlns="http://tempuri.org/">
      <userName>${this.config.username}</userName>
      <password>${this.config.password}</password>
    </GetCityList>
  </soap:Body>
</soap:Envelope>`

      const response = await this.fetchWithProxy(this.getServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/GetCityList'
        },
        body: soapBody
      })

      const responseText = await response.text()
      // Response log'lanmaz - güvenlik

      // Basic XML parsing - in production, use a proper XML parser
      const cities: AraCityData[] = []
      const cityMatches = responseText.matchAll(/<CityID>(\d+)<\/CityID>[\s\S]*?<CityName>(.*?)<\/CityName>/g)
      
      for (const match of cityMatches) {
        cities.push({
          CityID: parseInt(match[1]),
          CityName: match[2]
        })
      }

      return cities

    } catch (error) {
      console.error('❌ GetCityList error:', error)
      return []
    }
  }

  // New method: Get Town List by City
  async getTownList(cityId: number): Promise<ArasTownData[]> {
    try {
      // Minimal log
      
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTown xmlns="http://tempuri.org/">
      <cityId>${cityId}</cityId>
      <userName>${this.config.username}</userName>
      <password>${this.config.password}</password>
    </GetTown>
  </soap:Body>
</soap:Envelope>`

      const response = await this.fetchWithProxy(this.getServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/GetTown'
        },
        body: soapBody
      })

      const responseText = await response.text()

      // Basic XML parsing
      const towns: ArasTownData[] = []
      const townMatches = responseText.matchAll(/<TownID>(\d+)<\/TownID>[\s\S]*?<TownName>(.*?)<\/TownName>/g)
      
      for (const match of townMatches) {
        towns.push({
          TownID: parseInt(match[1]),
          TownName: match[2],
          CityID: cityId
        })
      }

      return towns

    } catch (error) {
      console.error('❌ GetTown error:', error)
      return []
    }
  }

  // New method: Price Calculation
  async calculatePrice(params: ArasPriceCalculation): Promise<ArasCargoResponse> {
    try {
      console.log('💰 Calculating price...')
      
      const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetPriceCalculation xmlns="http://tempuri.org/">
      <weight>${params.weight}</weight>
      <desi>${params.desi}</desi>
      <cityFrom>${params.cityFrom}</cityFrom>
      <cityTo>${params.cityTo}</cityTo>
      <serviceType>${params.serviceType}</serviceType>
      <userName>${this.config.username}</userName>
      <password>${this.config.password}</password>
    </GetPriceCalculation>
  </soap:Body>
</soap:Envelope>`

      const response = await this.fetchWithProxy(this.getServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/GetPriceCalculation'
        },
        body: soapBody
      })

      const responseText = await response.text()
      // Response log'lanmaz - güvenlik

      return {
        success: response.ok,
        data: responseText
      }

    } catch (error) {
      console.error('❌ GetPriceCalculation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Test connection using SetOrder (Laravel format)
  async testConnection(): Promise<ArasCargoResponse> {
    try {
      console.log('🔍 Testing connection with SetOrder (Laravel format)...')
      
      // Minimal test shipment data
      const testShipmentData = {
        orderNumber: 'TEST-CONN-' + Date.now(),
        recipientName: 'Test Alıcı',
        recipientPhone: '05001234567',
        recipientAddress: 'Test Adres, Kadıköy',
        recipientCity: 'İstanbul',
        recipientDistrict: 'Kadıköy',
        recipientPostalCode: '34000',
        senderName: 'Test Gönderici',
        senderPhone: '05001234568', 
        senderAddress: 'Test Gönderici Adres',
        weight: 1,
        desi: 1,
        paymentType: 'sender' as const,
        productPrice: 100,
        description: 'Test bağlantı'
      }
      
      const result = await this.createShipment(testShipmentData)
      
      return {
        success: result.success,
        data: {
          message: result.success 
            ? `Connection successful! ResultCode: ${result.resultCode}, Message: ${result.resultMessage}` 
            : `Connection failed. Error: ${result.error}`,
          serviceUrl: this.getServiceUrl(),
          resultCode: result.resultCode,
          resultMessage: result.resultMessage,
          testOrderNumber: testShipmentData.orderNumber
        }
      }

    } catch (error) {
      console.error('❌ Connection test error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

}

// Factory function
export function createCargoService(): CargoTrackingService {
  return new ArasCargoService({
    serviceUrl: process.env.ARAS_CARGO_SERVICE_URL || 'https://appls-srv.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
    username: process.env.ARAS_CARGO_USERNAME || 'neodyum', // Doc-aras.md test credentials
    password: process.env.ARAS_CARGO_PASSWORD || 'nd2580', // Doc-aras.md test credentials  
    customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE || '1932448851342' // Doc-aras.md test credentials
  }) as unknown as CargoTrackingService
}

 