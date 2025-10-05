import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Bottleneck from 'bottleneck'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'
import { 
  TrendyolApiCredentials, 
  TrendyolApiProduct, 
  TrendyolApiResponse,
  TrendyolApiError,
  TrendyolApiCategoryResponse,
  TrendyolApiAttributeResponse,
  TrendyolSettings
} from '@/types/trendyol'
import { mockApiResponses } from '@/lib/supabase/mock/trendyol-mock-data'

export class TrendyolAPIClient {
  private axiosInstance: AxiosInstance
  private limiter: Bottleneck
  private credentials: TrendyolApiCredentials
  private mockMode: boolean = false
  private testMode: boolean = false

  constructor(credentials: TrendyolApiCredentials, mockMode: boolean = false, testMode: boolean = false) {
    this.credentials = credentials
    this.mockMode = mockMode
    this.testMode = testMode
    
    // Environment-based base URL selection with Plesk proxy support
    const baseURL = this.getBaseURL()
    
    // Squid proxy configuration
    const proxyConfig = this.getProxyConfig()
    
    // Enhanced timeout configuration for international ISPs
    this.axiosInstance = axios.create({
      baseURL: baseURL, // Yeni endpoint yapısında /suppliers kaldırıldı
      timeout: 120000, // 2 dakika (yurt dışı ISP için artırıldı)
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrendyolIntegration/1.0.0',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100'
      },
      // Proxy configuration
      ...proxyConfig,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      maxRedirects: 3,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    })

    // Rate limiter - Trendyol API limit: 60 requests per minute
    this.limiter = new Bottleneck({
      minTime: 1100, // 1.1 seconds between requests (safe margin)
      maxConcurrent: 1,
      reservoir: 60, // Max 60 requests
      reservoirRefreshAmount: 60,
      reservoirRefreshInterval: 60 * 1000, // Refresh every minute
    })

    this.setupInterceptors()
  }

  /**
   * Squid proxy configuration
   */
  private getProxyConfig() {
    // Yeni Squid proxy bilgileri
    const proxyHost = process.env.TRENDYOL_PROXY_HOST || 'api2.plante.biz'
    const proxyPort = process.env.TRENDYOL_PROXY_PORT || '3128'
    const proxyUser = process.env.TRENDYOL_PROXY_USER || 'plante'
    const proxyPassword = process.env.TRENDYOL_PROXY_PASSWORD || 'h01h0203'
    const useProxy = process.env.TRENDYOL_USE_PROXY === 'true'

    if (!useProxy) {
      console.log('🚫 Proxy kullanılmıyor - doğrudan bağlantı')
      return {
        httpAgent: false,
        httpsAgent: false
      }
    }

    console.log('🔄 Squid Proxy yapılandırması:')
    console.log(`   Host: ${proxyHost}:${proxyPort}`)
    console.log(`   Kullanıcı: ${proxyUser}`)
    console.log('   Şifre: [gizli]')

    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`
    
    return {
      httpAgent: new HttpProxyAgent(proxyUrl),
      httpsAgent: new HttpsProxyAgent(proxyUrl),
      proxy: false // Disable Axios's default proxy handling since we're using agents
    }
  }

  /**
   * Environment-based base URL selection with Plesk proxy support
   */
  private getBaseURL(): string {
    const isProduction = process.env.NODE_ENV === 'production'
    const forceTestMode = process.env.TRENDYOL_TEST_MODE === 'true'
    const pleskProxy = process.env.TRENDYOL_PROXY_URL
    
    // Eski Plesk proxy URL desteği (geriye uyumluluk için)
    if (pleskProxy && (this.testMode || (!isProduction || forceTestMode))) {
      console.log('⚠️  Eski Plesk Proxy URL tespit edildi - Yeni Squid proxy kullanmanız önerilir')
      console.log('🌐 Proxy URL:', pleskProxy)
      console.log('🎯 Target:', 'https://stageapigw.trendyol.com')
      return pleskProxy
    }
    
    // Mock mode always uses production URL but doesn't make real requests
    if (this.mockMode) {
      console.log('🎭 Mock Mode: Using production URL for validation')
      return 'https://apigw.trendyol.com'
    }
    
    // Test mode from settings or environment (requires IP authorization from Trendyol)
    if (this.testMode || (!isProduction || forceTestMode)) {
      console.log('🧪 Test Mode: Using Trendyol test environment')
      console.log('⚠️  Test ortamı IP yetkilendirmesi gerektirir!')
      return 'https://stageapigw.trendyol.com'
    }
    
    // Production mode
    console.log('🚀 Production Mode: Using live Trendyol API')
    return 'https://apigw.trendyol.com'
  }

  private setupInterceptors(): void {
    // Request interceptor - Add authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add basic auth header
        const auth = Buffer.from(`${this.credentials.apiKey}:${this.credentials.apiSecret}`).toString('base64')
        config.headers.Authorization = `Basic ${auth}`
        
        // Yeni endpoint yapısında sellerId URL'de zaten var, ekleme yapmıyoruz
        // Sadece eski endpoint'ler için supplier ID ekleme
        const needsSupplierId = config.url && (
          config.url.startsWith('/v2/products') || 
          config.url.startsWith('/product-categories') ||
          config.url.startsWith('/brands')
        )
        
        if (needsSupplierId && !config.url.includes(this.credentials.supplierId)) {
          config.url = `/${this.credentials.supplierId}${config.url}`
        }
        
        // Debug logging
        console.log('🚀 Trendyol API Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization ? `Basic ${auth.substring(0, 16)}***` : 'undefined'
          }
        })
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // Enhanced response interceptor with better timeout handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        const maxRetries = 3
        
        // Initialize retry count
        if (!originalRequest._retryCount) {
          originalRequest._retryCount = 0
        }

        // Handle network timeouts and connection errors (for international ISPs)
        if ((error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) 
            && originalRequest._retryCount < maxRetries) {
          originalRequest._retryCount++
          
          console.log(`⏳ Zaman aşımı hatası (${originalRequest._retryCount}/${maxRetries}), tekrar deneniyor...`)
          console.log('🌍 Yurt dışı ISP bağlantı sorunu tespit edildi')
          
          // Progressive backoff: 5s, 10s, 20s
          const retryDelay = 5000 * Math.pow(2, originalRequest._retryCount - 1)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          
          return this.axiosInstance(originalRequest)
        }

        // Handle rate limiting (429)
        if (error.response?.status === 429 && originalRequest._retryCount < maxRetries) {
          originalRequest._retryCount++
          
          // Exponential backoff for rate limiting
          const retryDelay = Math.min(1000 * Math.pow(2, originalRequest._retryCount), 30000)
          console.log(`⏳ Rate limit hatası, ${retryDelay/1000}s bekleyip tekrar deneniyor...`)
          
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return this.axiosInstance(originalRequest)
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          throw new Error('Trendyol API kimlik doğrulama hatası. API anahtarlarını kontrol edin.')
        }

        // Handle IP authorization errors (test environment)
        if (error.response?.status === 503) {
          const baseURL = this.getBaseURL()
          if (baseURL.includes('stageapigw')) {
            throw new Error('Test ortamı IP yetkilendirmesi hatası. Trendyol Partner Destek\'e bildirim yapıldığı belirtildi. Onay bekleniyor...')
          }
        }

        // Enhanced 556 error handling with multiple retries
        if (error.response?.status === 556 && originalRequest._retryCount < maxRetries) {
          originalRequest._retryCount++
          
          console.log(`⏳ 556 hatası alındı (${originalRequest._retryCount}/${maxRetries}), 15 saniye bekleyip tekrar deneniyor...`)
          console.log('🔧 Trendyol Partner Destek\'e bildirim yapıldığı not edildi')
          
          await new Promise(resolve => setTimeout(resolve, 15000))
          return this.axiosInstance(originalRequest)
        }
        
        if (error.response?.status === 556) {
          throw new Error('Trendyol API servisi kullanılamıyor (556). Partner Destek bildirimi yapıldı, onay bekleniyor.')
        }

        // Handle final rate limiting or blocked IP (production)
        if (error.response?.status === 429) {
          throw new Error('API rate limit aşıldı. Lütfen 1 dakika bekleyin ve tekrar deneyin.')
        }

        // Handle blocked IP in production
        if (error.response?.status === 403) {
          throw new Error('IP adresiniz engellenmiş olabilir. Trendyol desteği ile iletişime geçin: 0850 258 58 00')
        }

        // Handle final timeout errors
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
          throw new Error('Bağlantı zaman aşımı. Yurt dışı ISP sorunu tespit edildi. Partner Destek\'e bildirim yapıldı.')
        }

        // Handle API errors
        if (error.response?.data?.errors) {
          const apiErrors = error.response.data.errors as TrendyolApiError[]
          throw new Error(`Trendyol API hatası: ${apiErrors.map(e => e.message).join(', ')}`)
        }

        return Promise.reject(error)
      }
    )
  }

  // Enhanced rate limited request wrapper with timeout handling
  private async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    return this.limiter.schedule(async () => {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance(config)
        return response.data
      } catch (error: any) {
        // Log detailed error for debugging
        console.error('🚨 Trendyol API Error Details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          url: config.url,
          method: config.method
        })
        throw error
      }
    })
  }

  // Product Operations
  async createProducts(products: TrendyolApiProduct[]): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: '/v2/products',
      data: { items: products }
    })
  }

  async updateStock(updates: Array<{ barcode: string; quantity: number }>): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: '/v2/products/price-and-inventory',
      data: { items: updates.map(update => ({ ...update, listPrice: 0, salePrice: 0 })) }
    })
  }

  async updatePrices(updates: Array<{ barcode: string; listPrice: number; salePrice: number }>): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: '/v2/products/price-and-inventory',
      data: { items: updates.map(update => ({ ...update, quantity: 0 })) }
    })
  }

  async updatePriceAndStock(updates: Array<{ 
    barcode: string
    quantity: number
    listPrice: number
    salePrice: number 
  }>): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: '/v2/products/price-and-inventory',
      data: { items: updates }
    })
  }

  async deleteProducts(barcodes: string[]): Promise<TrendyolApiResponse> {
    const deletePromises = barcodes.map(barcode => 
      this.makeRequest({
        method: 'DELETE',
        url: `/v2/products/${barcode}`
      })
    )
    
    return Promise.all(deletePromises)
  }

  async getProducts(page = 0, size = 100, filters?: any): Promise<TrendyolApiResponse> {
    if (this.mockMode) {
      console.log('🎭 Mock Mode: Returning mock products...')
      await this.mockDelay()
      return mockApiResponses.products as TrendyolApiResponse
    }

    const params: any = { page, size }
    
    // Filtreleri ekle
    if (filters) {
      if (filters.approved !== undefined) params.approved = filters.approved
      if (filters.onSale !== undefined) params.onSale = filters.onSale
      if (filters.archived !== undefined) params.archived = filters.archived
      if (filters.brandId) params.brandId = filters.brandId
      if (filters.categoryId) params.categoryId = filters.categoryId
    }

    return this.makeRequest({
      method: 'GET',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products`,
      params
    })
  }

  async getProductByBarcode(barcode: string): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'GET',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products/${barcode}`
    })
  }

  // Category Operations
  async getCategories(): Promise<TrendyolApiCategoryResponse[]> {
    return this.makeRequest({
      method: 'GET',
      url: '/integration/product/product-categories'
    })
  }

  async getCategoryAttributes(categoryId: number): Promise<TrendyolApiAttributeResponse[]> {
    return this.makeRequest({
      method: 'GET',
      url: `/integration/product/product-categories/${categoryId}/attributes`
    })
  }

  // Batch Operations
  async getBatchRequestResult(batchRequestId: string): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'GET',
      url: `/v2/products/batch-requests/${batchRequestId}`
    })
  }

  // Brand Operations
  async getBrands(): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'GET',
      url: '/integration/product/brands'
    })
  }

  // Mock Mode Utilities
  private async mockDelay(min: number = 300, max: number = 800): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  setMockMode(enabled: boolean): void {
    this.mockMode = enabled
    console.log(`🎭 Mock Mode ${enabled ? 'aktif' : 'deaktif'}`)
  }

  setTestMode(enabled: boolean): void {
    this.testMode = enabled
    console.log(`🧪 Test Mode ${enabled ? 'aktif' : 'deaktif'}`)
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      if (this.mockMode) {
        console.log('🎭 Mock Mode: API bağlantı testi simülasyonu...')
        await this.mockDelay(500, 1000)
        console.log('✅ Mock API bağlantı testi başarılı!')
        return true
      }

      console.log('🔍 Trendyol API test başlatılıyor...')
      console.log('🌐 Base URL:', this.getBaseURL())
      console.log('📡 Credentials:', {
        supplierId: this.credentials.supplierId,
        apiKey: this.credentials.apiKey ? this.credentials.apiKey.substring(0, 8) + '***' : 'undefined',
        apiSecret: this.credentials.apiSecret ? this.credentials.apiSecret.substring(0, 8) + '***' : 'undefined'
      })

      // Test ortamı ve proxy bilgilendirmesi
      const baseURL = this.getBaseURL()
      const pleskProxy = process.env.TRENDYOL_PROXY_URL
      
      if (pleskProxy && (this.testMode || process.env.TRENDYOL_TEST_MODE === 'true')) {
        console.log('🔄 Plesk Proxy aktif - Statik IP üzerinden test API erişimi')
        console.log('📞 Proxy IP yetkilendirmesi için: 0850 258 58 00')
      } else if (baseURL.includes('stageapigw')) {
        console.log('⚠️  Test ortamı kullanılıyor - IP yetkilendirmesi gerekli!')
        console.log('📞 IP yetkilendirmesi için: 0850 258 58 00')
        console.log('🔗 Test Panel: https://stagepartner.trendyol.com')
        console.log('💡 Çözüm: Plesk Proxy kullanın (plesk-proxy-setup.md)')
      }
      
      const result = await this.getProducts(0, 1)
      console.log('✅ API bağlantı testi başarılı!')
      return true
    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        status: error.status || error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: this.getBaseURL()
      }

      console.error('❌ Trendyol API bağlantı testi başarısız:', errorDetails)

      // 556 hatası için özel rehberlik
      if (errorDetails.status === 556) {
        console.error('💡 556 Hatası Çözüm Önerileri:')
        console.error('   1. Birkaç dakika bekleyin ve tekrar deneyin')
        console.error('   2. API credentials doğru olduğundan emin olun')
        console.error('   3. IP adresiniz bloklanmış olabilir')
        console.error('   4. Trendyol desteği: 0850 258 58 00')
      }
      return false
    }
  }

  updateCredentials(credentials: TrendyolApiCredentials): void {
    this.credentials = credentials
  }

  // Get current rate limit status
  getRateLimitStatus(): {
    running: number
    queued: number
    reservoir: number | null
  } {
    return {
      running: this.limiter.running(),
      queued: this.limiter.queued(),
      reservoir: this.limiter.reservoir()
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    await this.limiter.stop({ dropWaitingJobs: false })
  }
}

// Singleton instance
let trendyolClient: TrendyolAPIClient | null = null

export function getTrendyolClient(credentials?: TrendyolApiCredentials, mockMode?: boolean, testMode?: boolean): TrendyolAPIClient {
  if (!trendyolClient && credentials) {
    trendyolClient = new TrendyolAPIClient(credentials, mockMode, testMode)
  } else if (!trendyolClient) {
    throw new Error('TrendyolAPIClient henüz initialize edilmedi. Credentials gerekli.')
  }
  
  // Update modes if provided
  if (mockMode !== undefined && trendyolClient) {
    trendyolClient.setMockMode(mockMode)
  }
  if (testMode !== undefined && trendyolClient) {
    trendyolClient.setTestMode(testMode)
  }
  
  return trendyolClient
}

export function updateTrendyolClient(credentials: TrendyolApiCredentials, mockMode?: boolean, testMode?: boolean): void {
  if (trendyolClient) {
    trendyolClient.updateCredentials(credentials)
    if (mockMode !== undefined) {
      trendyolClient.setMockMode(mockMode)
    }
    if (testMode !== undefined) {
      trendyolClient.setTestMode(testMode)
    }
  } else {
    trendyolClient = new TrendyolAPIClient(credentials, mockMode, testMode)
  }
} 