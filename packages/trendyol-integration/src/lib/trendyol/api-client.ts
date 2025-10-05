import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Bottleneck from 'bottleneck'
import { 
  TrendyolApiCredentials, 
  TrendyolApiProduct, 
  TrendyolApiResponse,
  TrendyolApiError,
  TrendyolApiCategoryResponse,
  TrendyolApiAttributeResponse,
  TrendyolSettings
} from '@/types/trendyol'
// Mock responses for testing
const mockApiResponses = {
  products: {
    totalElements: 5,
    totalPages: 1,
    page: 0,
    size: 100,
    items: [
      {
        id: 1,
        barcode: '1234567890123',
        title: 'Zippo Çakmak Klasik',
        stockQuantity: 50,
        listPrice: 299.99,
        salePrice: 249.99,
        categoryId: 12345,
        brandId: 1,
        attributes: [],
        images: ['https://example.com/zippo1.jpg'],
        approved: true,
        status: 'ACTIVE'
      },
      {
        id: 2,
        barcode: '1234567890124',
        title: 'Clipper Çakmak Metal',
        stockQuantity: 30,
        listPrice: 89.99,
        salePrice: 79.99,
        categoryId: 12345,
        brandId: 2,
        attributes: [],
        images: ['https://example.com/clipper1.jpg'],
        approved: true,
        status: 'ACTIVE'
      },
      {
        id: 3,
        barcode: '1234567890125',
        title: 'BIC Çakmak Çoklu',
        stockQuantity: 100,
        listPrice: 15.99,
        salePrice: 12.99,
        categoryId: 12345,
        brandId: 3,
        attributes: [],
        images: ['https://example.com/bic1.jpg'],
        approved: true,
        status: 'ACTIVE'
      },
      {
        id: 4,
        barcode: '1234567890126',
        title: 'Atkı Yün Karışık',
        stockQuantity: 25,
        listPrice: 45.99,
        salePrice: 39.99,
        categoryId: 382,
        brandId: 4,
        attributes: [],
        images: ['https://example.com/atki1.jpg'],
        approved: true,
        status: 'ACTIVE'
      },
      {
        id: 5,
        barcode: '1234567890127',
        title: 'Bere Kışlık',
        stockQuantity: 40,
        listPrice: 35.99,
        salePrice: 29.99,
        categoryId: 384,
        brandId: 5,
        attributes: [],
        images: ['https://example.com/bere1.jpg'],
        approved: true,
        status: 'ACTIVE'
      }
    ]
  }
}

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
    
    console.log('🏗️  TrendyolAPIClient başlatılıyor...', {
      mockMode,
      testMode,
      environment: process.env.NODE_ENV,
      forceTestMode: process.env.TRENDYOL_TEST_MODE
    })
    
    // Environment-based base URL selection with Plesk proxy support
    const baseURL = this.getBaseURL()
    
    // Squid proxy configuration if enabled
    const axiosConfig: any = {
      baseURL: baseURL,
      timeout: 120000, // 2 dakika
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TrendyolIntegration/1.0.0',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      maxRedirects: 3,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    }

    // Squid proxy configuration  
    if (process.env.TRENDYOL_PROXY_URL && process.env.TRENDYOL_PROXY_USERNAME && process.env.TRENDYOL_PROXY_PASSWORD) {
      const proxyUrl = new URL(process.env.TRENDYOL_PROXY_URL)
      
      // Use object format with explicit HTTP protocol for HTTPS tunneling
      axiosConfig.proxy = {
        protocol: 'http',
        host: 'api2.plante.biz',
        port: 3128,
        auth: {
          username: process.env.TRENDYOL_PROXY_USERNAME,
          password: process.env.TRENDYOL_PROXY_PASSWORD
        }
      }
      
      // Object format (commented out)
      // axiosConfig.proxy = {
      //   protocol: proxyUrl.protocol.replace(':', ''),
      //   host: proxyUrl.hostname,
      //   port: parseInt(proxyUrl.port) || 3128,
      //   auth: {
      //     username: process.env.TRENDYOL_PROXY_USERNAME,
      //     password: process.env.TRENDYOL_PROXY_PASSWORD
      //   }
      // }
      
      console.log('🔄 Squid Proxy Configuration (Object Format):', {
        host: axiosConfig.proxy.host,
        port: axiosConfig.proxy.port,
        username: process.env.TRENDYOL_PROXY_USERNAME,
        password: process.env.TRENDYOL_PROXY_PASSWORD ? '***' : 'NOT_SET'
      })
    } else {
      console.log('🚨 Squid Proxy NOT configured:', {
        TRENDYOL_PROXY_URL: process.env.TRENDYOL_PROXY_URL || 'NOT_SET',
        TRENDYOL_PROXY_USERNAME: process.env.TRENDYOL_PROXY_USERNAME || 'NOT_SET', 
        TRENDYOL_PROXY_PASSWORD: process.env.TRENDYOL_PROXY_PASSWORD ? 'SET' : 'NOT_SET'
      })
    }

    this.axiosInstance = axios.create(axiosConfig)

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
   * Environment-based base URL selection for Trendyol API
   * Updated according to latest Trendyol documentation
   */
  public getBaseURL(): string {
    const forceTestMode = process.env.TRENDYOL_TEST_MODE === 'true'
    
    // Mock mode always uses production URL but doesn't make real requests
    if (this.mockMode) {
      console.log('🎭 Mock Mode: Using production URL for validation')
      return 'https://apigw.trendyol.com'
    }
    
    // Test mode from settings or environment (requires IP authorization from Trendyol)
    if (this.testMode || forceTestMode) {
      console.log('🧪 Test Mode: Using Trendyol test environment')
      console.log('⚠️  Test ortamı IP yetkilendirmesi gerektirir!')
      return 'https://stageapigw.trendyol.com'
    }
    
    // Production mode (default) - Squid proxy will handle routing if configured
    console.log('🚀 Production Mode: Using live Trendyol API')
    if (process.env.TRENDYOL_PROXY_URL) {
      console.log('🌐 Squid proxy will route requests through:', process.env.TRENDYOL_PROXY_URL)
    }
    return 'https://apigw.trendyol.com'
  }

  private setupInterceptors(): void {
    // Request interceptor - Add authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Normal Trendyol API authorization
        const auth = Buffer.from(`${this.credentials.apiKey}:${this.credentials.apiSecret}`).toString('base64')
        config.headers.Authorization = `Basic ${auth}`
        
        console.log('🚀 Trendyol API Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          proxy: process.env.TRENDYOL_PROXY_URL ? 'Squid Enabled' : 'Direct',
          headers: {
            Authorization: `Basic ${auth.substring(0, 16)}***`
          }
        })
        
        // Add seller ID to URL only for endpoints that require it (updated according to latest docs)
        const urlStartsWithSellerId = /^\/?\d+\//.test(config.url || '')
        const needsSellerId = config.url && (
          config.url.startsWith('/integration/product/sellers') || 
          config.url.startsWith('/integration/inventory/sellers') ||
          config.url.startsWith('/integration/sellers')
        );

        if (needsSellerId && !urlStartsWithSellerId && !config.url.includes(this.credentials.supplierId)) {
          config.url = config.url.replace('/sellers/', `/sellers/${this.credentials.supplierId}/`)
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    // Enhanced response interceptor with better timeout handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Safely get original request - if undefined, skip retry logic
        const originalRequest = error.config
        const maxRetries = 3
        
        // If no config object, skip retry logic
        if (!originalRequest) {
          console.error('🚨 Error config undefined, skipping retry logic')
          return Promise.reject(error)
        }
        
        // Initialize retry count safely
        if (typeof originalRequest._retryCount !== 'number') {
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
        if (error.response?.status === 556 && originalRequest && originalRequest._retryCount < maxRetries) {
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
          message: error.message || 'Unknown error',
          code: error.code || 'NO_CODE',
          status: error.response?.status || 'NO_STATUS',
          statusText: error.response?.statusText || 'NO_STATUS_TEXT',
          url: config?.url || 'NO_URL',
          fullUrl: `${this.getBaseURL()}${config?.url}` || 'NO_FULL_URL',
          method: config?.method || 'NO_METHOD',
          responseData: error.response?.data || 'NO_RESPONSE_DATA',
          headers: error.response?.headers || 'NO_HEADERS',
          hasConfig: !!error.config,
          errorType: error.constructor?.name || typeof error
        })
        throw error
      }
    })
  }

  // Product Operations
  async createProducts(products: TrendyolApiProduct[]): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products`,
      data: { items: products }
    })
  }

  async updateStock(updates: Array<{ barcode: string; quantity: number }>): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: `/integration/inventory/sellers/${this.credentials.supplierId}/products/price-and-inventory`,
      data: { items: updates.map(update => ({ ...update, listPrice: 0, salePrice: 0 })) }
    })
  }

  async updatePrices(updates: Array<{ barcode: string; listPrice: number; salePrice: number }>): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'POST',
      url: `/integration/inventory/sellers/${this.credentials.supplierId}/products/price-and-inventory`,
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
      url: `/integration/inventory/sellers/${this.credentials.supplierId}/products/price-and-inventory`,
      data: { items: updates }
    })
  }

  async deleteProducts(barcodes: string[]): Promise<TrendyolApiResponse[]> {
    const deletePromises = barcodes.map(barcode => 
      this.makeRequest({
        method: 'DELETE',
        url: `/integration/product/sellers/${this.credentials.supplierId}/products/${barcode}`
      })
    )
    
    return Promise.all(deletePromises)
  }

  async getProducts(page = 0, size = 100, filters: any = {}): Promise<TrendyolApiResponse> {
    if (this.mockMode) {
      console.log('🎭 Mock Mode: Returning mock products...')
      await this.mockDelay()
      return mockApiResponses.products as TrendyolApiResponse
    }

    console.log('🔍 Gerçek API\'den ürün listesi alınıyor...', {
      page,
      size,
      filters,
      url: `/integration/product/sellers/${this.credentials.supplierId}/products`
    })

    const response = await this.makeRequest({
      method: 'GET',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products`,
      params: { page, size, ...filters }
    })

    console.log('📥 Ürün API Response:', {
      type: typeof response,
      isArray: Array.isArray(response),
      keys: response ? Object.keys(response) : null,
      totalElements: (response as any)?.totalElements,
      totalPages: (response as any)?.totalPages,
      page: (response as any)?.page,
      size: (response as any)?.size,
      itemsLength: (response as any)?.items?.length,
      sampleItems: (response as any)?.items?.slice(0, 2) || null
    })

    // Trendyol API response format kontrolü
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const responseObj = response as any
      
      // Farklı response formatlarını kontrol et
      if (responseObj.content && Array.isArray(responseObj.content)) {
        console.log('✅ Response format: content array found')
        return {
          totalElements: responseObj.totalElements || 0,
          totalPages: responseObj.totalPages || 0,
          page: responseObj.page || 0,
          size: responseObj.size || 0,
          items: responseObj.content
        }
      }
      
      if (responseObj.data && Array.isArray(responseObj.data)) {
        console.log('✅ Response format: data array found')
        return {
          totalElements: responseObj.totalElements || 0,
          totalPages: responseObj.totalPages || 0,
          page: responseObj.page || 0,
          size: responseObj.size || 0,
          items: responseObj.data
        }
      }
      
      if (responseObj.items && Array.isArray(responseObj.items)) {
        console.log('✅ Response format: items array found')
        return responseObj
      }
      
      console.log('❌ Response format: No array found in response')
      console.log('🔍 Response structure:', JSON.stringify(responseObj, null, 2))
    }

    return response
  }

  async getProductByBarcode(barcode: string): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'GET',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products/${barcode}`
    })
  }

  // Update Product (PUT method)
  async updateProduct(products: TrendyolApiProduct[]): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'PUT',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products`,
      data: { items: products }
    })
  }

  // Category Operations
  async getCategories(): Promise<TrendyolApiCategoryResponse[]> {
    console.log('🔍 Kategori API çağrısı yapılıyor...')
    
    // Mock mode - return mock data
    if (this.mockMode) {
      console.log('🎭 Mock Mode: Returning mock categories')
      return [
        { 
          id: 1162, 
          name: 'Atkı & Bere & Eldiven', 
          parentId: 368,
          subCategories: [
            {
              id: 382,
              name: 'Atkı',
              parentId: 1162,
              subCategories: []
            },
            {
              id: 1805,
              name: 'Atkı & Bere & Eldiven Set',
              parentId: 1162,
              subCategories: []
            },
            {
              id: 384,
              name: 'Bere',
              parentId: 1162,
              subCategories: []
            }
          ]
        },
        { 
          id: 12345, 
          name: 'Çakmaklar', 
          parentId: 0,
          subCategories: [
            {
              id: 12348,
              name: 'Elektronik Çakmaklar',
              parentId: 12345,
              subCategories: []
            },
            {
              id: 12349,
              name: 'Zippo Çakmaklar',
              parentId: 12345,
              subCategories: []
            }
          ]
        }
      ]
    }
    
    // Trendyol'un doğru kategori endpoint'i: https://developers.trendyol.com/docs/marketplace/urun-entegrasyonu/trendyol-kategori-listesi
    // Doğru endpoint: /integration/product/product-categories (getCategoryTree)
    const response = await this.makeRequest({
      method: 'GET',
      url: `/integration/product/product-categories`
    })
    
    console.log('📥 Kategori API Response:', {
      type: typeof response,
      isArray: Array.isArray(response),
      keys: response ? Object.keys(response) : null,
      sampleData: response ? (Array.isArray(response) ? response.slice(0, 2) : response) : null
    })
    
    // Response wrapper objesi olabilir, content/data/categories alanı kontrol et
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      console.log('🔄 Response wrapper object detected, extracting array...')
      
      // Possible wrapper patterns from Trendyol API
      const possibleArrays = [
        response.content,
        response.data,
        response.categories,
        response.items,
        response.result
      ]
      
      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          console.log(`✅ Array found in wrapper: ${arr.length} items`)
          return arr
        }
      }
      
      console.log('❌ No array found in wrapper object')
    }
    
    return Array.isArray(response) ? response : []
  }

  async getCategoryAttributes(categoryId: number): Promise<TrendyolApiAttributeResponse[]> {
    // Trendyol'un doğru attribute endpoint'i (updated according to latest docs)
    return this.makeRequest({
      method: 'GET',
      url: `/integration/product/product-categories/${categoryId}/attributes`
    })
  }

  // Batch Operations
  async getBatchRequestResult(batchRequestId: string): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'GET',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products/batch-requests/${batchRequestId}`
    })
  }

  // Brand Operations
  async getBrands(): Promise<TrendyolApiResponse> {
    // Mock mode - return mock data
    if (this.mockMode) {
      console.log('🎭 Mock Mode: Returning mock brands')
      return {
        content: [
          { id: 1, name: 'Zippo' },
          { id: 2, name: 'Clipper' },
          { id: 3, name: 'BIC' },
          { id: 4, name: 'Imco' },
          { id: 5, name: 'Colibri' }
        ]
      }
    }
    
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
  async getRateLimitStatus(): Promise<{
    running: number
    queued: number
  }> {
    return {
      running: await this.limiter.running(),
      queued: await this.limiter.queued()
    }
  }

  // Archive Products (PUT method)
  async archiveProducts(items: Array<{ barcode: string; archived: boolean }>): Promise<TrendyolApiResponse> {
    return this.makeRequest({
      method: 'PUT',
      url: `/integration/product/sellers/${this.credentials.supplierId}/products/archive-state`,
      data: { items }
    })
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