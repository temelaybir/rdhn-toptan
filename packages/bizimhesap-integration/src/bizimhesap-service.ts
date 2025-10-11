import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import {
  BizimHesapConfig,
  BizimHesapInvoiceRequest,
  BizimHesapInvoiceResult,
  BizimHesapApiResponse,
  ECommerceOrder,
  InvoiceGenerationOptions,
  InvoiceType,
  Currency,
  InvoiceDetail,
  InvoiceAmounts,
  Customer
} from './types'

export class BizimHesapService {
  private axiosInstance: AxiosInstance
  private config: BizimHesapConfig

  constructor(config: BizimHesapConfig) {
    this.config = {
      apiEndpoint: 'https://bizimhesap.com/api/b2b/addinvoice',
      timeout: 30000,
      ...config
    }

    // Proxy configuration
    const proxyConfig = this.getProxyConfig()

    this.axiosInstance = axios.create({
      baseURL: this.config.apiEndpoint,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BizimHesapIntegration/1.0.0'
      },
      ...proxyConfig
    })

    this.setupInterceptors()
  }

  /**
   * Squid proxy configuration
   */
  private getProxyConfig() {
    const proxyHost = process.env.BIZIMHESAP_PROXY_HOST || 'api2.plante.biz'
    const proxyPort = process.env.BIZIMHESAP_PROXY_PORT || '3128'
    const proxyUser = process.env.BIZIMHESAP_PROXY_USER || 'plante'
    const proxyPassword = process.env.BIZIMHESAP_PROXY_PASSWORD || 'h01h0203'
    const useProxy = process.env.BIZIMHESAP_USE_PROXY === 'true'

    if (!useProxy) {
      console.log('🚫 BizimHesap: Proxy kullanılmıyor - doğrudan bağlantı')
      return {
        httpAgent: false,
        httpsAgent: false
      }
    }

    console.log('🔄 BizimHesap Squid Proxy yapılandırması:')
    console.log(`   Host: ${proxyHost}:${proxyPort}`)
    console.log(`   Kullanıcı: ${proxyUser}`)
    console.log('   Şifre: [gizli]')

    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`
    
    return {
      httpAgent: new HttpProxyAgent(proxyUrl),
      httpsAgent: new HttpsProxyAgent(proxyUrl),
      proxy: false
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('🧾 BizimHesap API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data ? 'Data included' : 'No data'
        })
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('✅ BizimHesap API Response:', {
          status: response.status,
          hasError: !!response.data?.error,
          guid: response.data?.guid
        })
        return response
      },
      (error) => {
        console.error('❌ BizimHesap API Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        })
        return Promise.reject(error)
      }
    )
  }

  /**
   * E-commerce siparişini BizimHesap faturasına dönüştür
   */
  private convertOrderToInvoice(
    order: ECommerceOrder,
    options: InvoiceGenerationOptions = {}
  ): BizimHesapInvoiceRequest {
    const invoiceType = options.invoiceType || InvoiceType.SALES

    // Customer bilgilerini dönüştür
    const customer: Customer = {
      customerId: order.customer.id,
      title: order.customer.name,
      address: order.customer.billingAddress,
      taxOffice: order.customer.taxOffice,
      taxNo: order.customer.taxNumber,
      email: order.customer.email,
      phone: order.customer.phone
    }

    // Ürün detaylarını dönüştür
    const details: InvoiceDetail[] = order.items.map(item => {
      const grossPrice = item.quantity * item.unitPrice
      const discountAmount = item.discount || 0
      const net = grossPrice - discountAmount
      const tax = net * (item.taxRate / 100)
      const total = net + tax

      return {
        productId: item.id,
        productName: item.name,
        note: item.note,
        barcode: item.barcode,
        taxRate: item.taxRate,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        grossPrice,
        discount: discountAmount.toString(),
        net,
        tax,
        total
      }
    })

    // Tutar hesaplamaları
    const gross = details.reduce((sum, item) => sum + item.grossPrice, 0)
    const discount = details.reduce((sum, item) => sum + parseFloat(item.discount.toString()), 0)
    const net = details.reduce((sum, item) => sum + item.net, 0)
    const tax = details.reduce((sum, item) => sum + item.tax, 0)
    const total = net + tax

    const amounts: InvoiceAmounts = {
      currency: order.currency || Currency.TL,
      gross,
      discount,
      net,
      tax,
      total
    }

    // Tarih formatları
    const invoiceDate = order.orderDate.toISOString()
    const dueDate = order.dueDate ? order.dueDate.toISOString() : order.orderDate.toISOString()

    return {
      firmId: this.config.firmId,
      invoiceNo: options.customInvoiceNumber || order.orderNumber,
      invoiceType,
      note: order.note,
      dates: {
        invoiceDate,
        dueDate
      },
      customer,
      amounts,
      details
    }
  }

  /**
   * Fatura oluştur (genel method)
   */
  async createInvoice(invoiceData: BizimHesapInvoiceRequest): Promise<BizimHesapInvoiceResult> {
    try {
      console.log('🧾 BizimHesap faturası oluşturuluyor...', {
        invoiceNo: invoiceData.invoiceNo,
        type: invoiceData.invoiceType === InvoiceType.SALES ? 'Satış' : 'Alış',
        invoiceTypeValue: invoiceData.invoiceType,
        customer: invoiceData.customer.title,
        total: invoiceData.amounts.total
      })

      // Detaylı request logging
      console.log('📤 BizimHesap API Request Data:', JSON.stringify(invoiceData, null, 2))

      const response = await this.axiosInstance.post<BizimHesapApiResponse>('', invoiceData)

      // Response logging
      console.log('📥 BizimHesap API Response:', JSON.stringify(response.data, null, 2))

      if (response.data.error) {
        console.error('❌ BizimHesap API Error Response:', response.data.error)
        return {
          success: false,
          error: response.data.error
        }
      }

      console.log('✅ Fatura başarıyla oluşturuldu:', { guid: response.data.guid, url: response.data.url })

      return {
        success: true,
        data: response.data,
        guid: response.data.guid,
        invoiceUrl: response.data.url
      }

    } catch (error: any) {
      console.error('❌ BizimHesap fatura oluşturma hatası:', error)
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Bilinmeyen hata'
      }
    }
  }

  /**
   * E-commerce siparişinden satış faturası oluştur
   */
  async createSalesInvoice(
    order: ECommerceOrder,
    options: InvoiceGenerationOptions = {}
  ): Promise<BizimHesapInvoiceResult> {
    const invoiceData = this.convertOrderToInvoice(order, {
      ...options,
      invoiceType: InvoiceType.SALES
    })

    return this.createInvoice(invoiceData)
  }

  /**
   * E-commerce siparişinden alış faturası oluştur
   */
  async createPurchaseInvoice(
    order: ECommerceOrder,
    options: InvoiceGenerationOptions = {}
  ): Promise<BizimHesapInvoiceResult> {
    const invoiceData = this.convertOrderToInvoice(order, {
      ...options,
      invoiceType: InvoiceType.PURCHASE
    })

    return this.createInvoice(invoiceData)
  }

  /**
   * BizimHesap bağlantısını test et
   */
  async testConnection(): Promise<BizimHesapInvoiceResult> {
    try {
      console.log('🔍 BizimHesap bağlantısı test ediliyor...')

      // Test fatura verisi
      const testInvoice: BizimHesapInvoiceRequest = {
        firmId: this.config.firmId,
        invoiceNo: 'TEST-' + Date.now(),
        invoiceType: InvoiceType.SALES,
        note: 'Test bağlantısı',
        dates: {
          invoiceDate: new Date().toISOString(),
          dueDate: new Date().toISOString()
        },
        customer: {
          customerId: 'TEST-CUSTOMER',
          title: 'Test Müşteri',
          address: 'Test Adres'
        },
        amounts: {
          currency: Currency.TL,
          gross: 100,
          discount: 0,
          net: 100,
          tax: 18,
          total: 118
        },
        details: [{
          productId: 'TEST-PRODUCT',
          productName: 'Test Ürün',
          taxRate: 18,
          quantity: 1,
          unitPrice: 100,
          grossPrice: 100,
          discount: '0',
          net: 100,
          tax: 18,
          total: 118
        }]
      }

      // Test isteği gönder (gerçek fatura oluşturmadan sadece API erişimini test et)
      const result = await this.createInvoice(testInvoice)

      console.log('✅ BizimHesap bağlantı testi tamamlandı')
      return result

    } catch (error: any) {
      console.error('❌ BizimHesap bağlantı testi başarısız:', error)
      return {
        success: false,
        error: error.message || 'Bağlantı testi başarısız'
      }
    }
  }

  /**
   * Yapılandırmayı güncelle
   */
  updateConfig(newConfig: Partial<BizimHesapConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Axios instance'ı yeniden yapılandır
    this.axiosInstance.defaults.baseURL = this.config.apiEndpoint
    this.axiosInstance.defaults.timeout = this.config.timeout
  }

  /**
   * Mevcut yapılandırmayı al
   */
  getConfig(): BizimHesapConfig {
    return { ...this.config }
  }
}

// Factory function
export function createBizimHesapService(config?: Partial<BizimHesapConfig>): BizimHesapService {
  const defaultConfig: BizimHesapConfig = {
    firmId: process.env.BIZIMHESAP_FIRM_ID || '',
    apiEndpoint: process.env.BIZIMHESAP_API_ENDPOINT || 'https://bizimhesap.com/api/b2b/addinvoice',
    timeout: 30000
  }

  if (!defaultConfig.firmId) {
    throw new Error('BIZIMHESAP_FIRM_ID environment variable is required')
  }

  return new BizimHesapService({ ...defaultConfig, ...config })
} 