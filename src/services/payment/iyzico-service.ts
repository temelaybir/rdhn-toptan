import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'
// İyzipay npm paketini kaldır - Next.js 15 uyumlu değil
// import Iyzipay from 'iyzipay'
import { 
  IyzicoSettings,
  CreatePaymentRequest,
  PaymentInitResponse,
  InstallmentRequest,
  IyzicoInstallmentResponse,
  IyzicoPaymentRequest,
  IyzicoPaymentResponse,
  Iyzico3DSecureRequest,
  Iyzico3DSecureInitResponse,
  IyzicoCard,
  IyzicoBuyer,
  IyzicoAddress,
  IyzicoBasketItem,
  PaymentTransaction,
  UserPaymentCard,
  ApiResponse,
  Currency,
  PaymentChannel,
  PaymentGroup,
  IyzicoConfig
} from '@/types/iyzico'
import { logger } from '@/lib/logger'
import { iyzicoLogger } from './iyzico-logger'

export class IyzicoService {
  private settings: IyzicoSettings
  private config: IyzicoConfig
  private httpClient: AxiosInstance

  constructor(settings: IyzicoSettings) {
    this.settings = settings
    this.config = this.buildConfig(settings)
    this.httpClient = this.createHttpClient()
  }

  /**
   * İyzico custom HTTP client kullanıyoruz (npm paketi Next.js 15 uyumlu değil)
   */

  /**
   * İyzico API'sine HTTP request yapar - YENİ HmacSHA256 Auth ile
   */
  async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`

      // YENİ sistem için headers - endpoint bilgisini geç
      const headers = this.generateSDKHeaders(this.config.apiKey, this.config.secretKey, data, endpoint)

      logger.info('📤 İyzico API çağrısı (YENİ Auth):', {
        url,
        endpoint,
        hasData: !!data,
        authHeaderLength: headers['Authorization']?.length,
        baseUrl: this.config.baseUrl,
        testMode: this.config.testMode
      })

      const response = await this.httpClient.post(url, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      logger.info('📥 İyzico API response:', {
        status: response.status,
        hasData: !!response.data,
        iyzicoStatus: response.data?.status
      })

      return response.data

    } catch (error: any) {
      logger.error('❌ İyzico API request error:', {
        endpoint,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        authError: error.response?.data?.errorCode === '1001' ? 'Auth header sorunu olabilir' : 'Bilinmeyen hata'
      })

      // İyzico API error response'unu döndür
      if (error.response?.data) {
        return error.response.data
      }

      // Network veya diğer hatalar için generic error döndür
      throw new Error(`İyzico API request failed: ${error.message}`)
    }
  }

  /**
   * İyzico configuration'ını ayarları base alarak oluşturur
   */
  private buildConfig(settings: IyzicoSettings): IyzicoConfig {
    // 🔧 SANDBOX/PRODUCTION Config: Flexible logic
    const isTestMode = settings.test_mode || process.env.IYZICO_TEST_MODE === 'true'
    
    let apiKey: string
    let secretKey: string
    let baseUrl: string
    
    if (isTestMode) {
      // SANDBOX Mode
      apiKey = settings.sandbox_api_key || process.env.IYZICO_API_KEY || ''
      secretKey = settings.sandbox_secret_key || process.env.IYZICO_SECRET_KEY || ''
      baseUrl = settings.sandbox_base_url || process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
      
      logger.info('🧪 İyzico SANDBOX config oluşturuluyor:', {
        baseUrl,
        hasApiKey: !!apiKey,
        hasSecretKey: !!secretKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : 'NOT_SET'
      })
    } else {
      // PRODUCTION Mode
      apiKey = settings.api_key || process.env.IYZICO_API_KEY || ''
      secretKey = settings.secret_key || process.env.IYZICO_SECRET_KEY || ''
      baseUrl = settings.production_base_url || process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com'
      
      logger.info('🚀 İyzico PRODUCTION config oluşturuluyor:', {
        baseUrl,
        hasApiKey: !!apiKey,
        hasSecretKey: !!secretKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET'
      })
    }
    
    // API credentials validation
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('İyzico API Key gerekli (IYZICO_API_KEY)')
    }
    
    if (!secretKey || secretKey.trim() === '') {
      throw new Error('İyzico Secret Key gerekli (IYZICO_SECRET_KEY)')
    }
    
    // URL format kontrolü
    if (!baseUrl.startsWith('https://')) {
      logger.warn(`⚠️ Base URL HTTPS değil: ${baseUrl}`)
    }

    return {
      testMode: isTestMode,
      baseUrl,
      apiKey,
      secretKey
    }
  }

  /**
   * HTTP client oluşturur
   */
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'RDHN-Commerce-Iyzico-Integration/1.0'
      }
    })

    // İmzalama işlemi artık `makeRequest` içinde tek seferde yapıldığı için interceptor'a gerek kalmadı.

    // Response interceptor - Error handling
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('💥 İyzico HTTP Error:', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        })
        return Promise.reject(error)
      }
    )

    return client
  }

  /**
   * İyzico'nun YENİ HmacSHA256 Auth Sistemi - Resmi Dokümantasyona Göre
   */
  private generateSDKHeaders(apiKey: string, secretKey: string, payload: any, endpoint: string = '/payment/test'): { [key: string]: string } {
    try {
      // SDK constants
      const HEADER_NAME_CLIENT_VERSION = 'x-iyzi-client-version'
      const HEADER_NAME_RANDOM_STRING = 'x-iyzi-rnd'
      const HEADER_NAME_AUTHORIZATION = 'Authorization'
      const HEADER_VALUE_AUTHORIZATION_PREFIX = 'IYZWSv2' // YENİ PREFIX
      const DEFAULT_CLIENT_VERSION = 'iyzipay-node-2.0.61'
      
      // Headers object
      let headers: { [key: string]: string } = {}
      
      // 1. Client version header
      headers[HEADER_NAME_CLIENT_VERSION] = DEFAULT_CLIENT_VERSION
      
      // 2. Random string header - Dokümantasyona göre format
      const randomKey = new Date().getTime() + "123456789"
      headers[HEADER_NAME_RANDOM_STRING] = randomKey
      
      logger.debug('🔍 İyzico YENİ Auth System:', {
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        randomKey,
        payloadKeys: Object.keys(payload || {})
      })

      // 3. Authorization header - YENİ HmacSHA256 Sistemi
      
      // URI path - endpoint parametresinden al
      const uriPath = endpoint
      
      // Request body as JSON string
      const requestBody = JSON.stringify(payload || {})
      
      // Payload: randomKey + uriPath + requestBody
      const authPayload = randomKey + uriPath + requestBody
      
      logger.debug('🔍 Auth payload components:', {
        randomKey,
        uriPath,
        requestBodyPreview: requestBody.substring(0, 50) + '...',
        fullPayloadPreview: authPayload.substring(0, 100) + '...'
      })

      // HmacSHA256 encryption
      const hmac = crypto.createHmac('sha256', secretKey)
      hmac.update(authPayload, 'utf-8')
      const encryptedData = hmac.digest('hex')

      // Authorization string format: apiKey:xxx&randomKey:xxx&signature:xxx
      const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${encryptedData}`
      
      // Base64 encode
      const base64EncodedAuthorization = Buffer.from(authorizationString).toString('base64')

      // Final authorization header: IYZWSv2 base64string
      headers[HEADER_NAME_AUTHORIZATION] = HEADER_VALUE_AUTHORIZATION_PREFIX + ' ' + base64EncodedAuthorization
      
      logger.debug('🔐 İyzico YENİ Auth headers generated:', {
        authHeaderLength: headers[HEADER_NAME_AUTHORIZATION].length,
        clientVersion: headers[HEADER_NAME_CLIENT_VERSION],
        randomKeyLength: headers[HEADER_NAME_RANDOM_STRING].length,
        encryptedDataPreview: encryptedData.substring(0, 16) + '...',
        authorizationStringPreview: authorizationString.substring(0, 50) + '...'
      })
      
      return headers
      
    } catch (error: any) {
      logger.error('❌ YENİ Auth Headers generation error:', { error, message: error.message })
      throw new Error(`YENİ Auth Headers oluşturulamadı: ${error.message}`)
    }
  }



  /**
   * String değerleri imza oluşturma için güvenli hale getirir.
   */
  private sanitizeString(value: any): string {
    if (typeof value !== 'string') {
      return value
    }
    // JSON'da sorun yaratabilecek karakterleri escape'le
    // ve bazı özel Türkçe karakterleri normalize et
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'i')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 's')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'g')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'o')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'u')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'c')
  }

  /**
   * Telefon numarasını İyzico'nun beklediği +90 formatına normalize eder.
   */
  private normalizePhoneNumber(phone?: string): string {
    const defaultPhone = '+905555555555'
    if (!phone) {
      return defaultPhone
    }

    // Tüm non-digit karakterleri temizle
    let digits = phone.replace(/\D/g, '')

    // '0' ile başlıyorsa, onu kaldır
    if (digits.startsWith('0')) {
      digits = digits.substring(1)
    }

    // Türkiye numarası olduğunu varsay (5xx xxx xxxx)
    if (digits.length === 10) {
      return `+90${digits}`
    }
    
    // Zaten 90 ile başlıyorsa, sadece '+' ekle
    if (digits.startsWith('90') && digits.length === 12) {
      return `+${digits}`
    }

    // Tanınmayan formatlar için varsayılan numarayı döndür
    return defaultPhone
  }

  /**
   * Benzersiz conversation ID oluşturur
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // generateRandomString metodu kaldırıldı - V2 auth kendi random string'ini üretiyor

  /**
   * IP adresini alır (fallback ile)
   */
  private getClientIp(request?: Request): string {
    // Production'da gerçek IP'yi almaya çalış
    if (typeof window === 'undefined' && request) {
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const clientIp = request.headers.get('x-client-ip')
      
      if (forwarded) return forwarded.split(',')[0].trim()
      if (realIp) return realIp
      if (clientIp) return clientIp
    }
    
    // Fallback IP (development için)
    return '127.0.0.1'
  }

  /**
   * Production için güvenli IP adresi alır
   */
  private getProductionClientIp(request: any): string {
    // Production'da gerçek client IP'sini almaya çalış
    const headers = request?.headers || {}
    
    // Cloudflare
    if (headers['cf-connecting-ip']) return headers['cf-connecting-ip']
    
    // Vercel/AWS
    if (headers['x-forwarded-for']) {
      const ips = headers['x-forwarded-for'].split(',')
      return ips[0].trim()
    }
    
    // Other proxies
    if (headers['x-real-ip']) return headers['x-real-ip']
    if (headers['x-client-ip']) return headers['x-client-ip']
    
    // Fallback - safe production IP (Türkiye IP)
    return '88.249.67.35' // Türkiye safe IP for production
  }

  /**
   * Para birimini formatlar (İyzico string bekliyor)
   * Community fix: Precision çok önemli! 29.432 ❌, 29.43 ✅
   */
  private formatPrice(amount: number | undefined): string {
    if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
      logger.warn('⚠️ formatPrice: Invalid amount, using 0.00', { amount })
      return '0.00'
    }
    
    // Community fix: Tam 2 decimal precision zorunlu
    const formatted = Number(amount).toFixed(2)
    
    // Debug için log ekle
    if (amount.toString() !== formatted) {
      logger.debug('💰 Price formatting:', { original: amount, formatted })
    }
    
    return formatted
  }

  /**
   * İyzico tarih formatına çevirir: "2015-09-17 23:45:06"
   */
  private formatIyzicoDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  /**
   * Basket items'ları İyzico formatına çevirir ve price uyumluluğunu sağlar
   */
  private prepareBasketItems(basketItems: any[], totalAmount: number): any[] {
    // Basket items yoksa veya boşsa, default item oluştur
    if (!basketItems || basketItems.length === 0) {
      logger.warn('⚠️ Basket items boş, default item oluşturuluyor')
      return [{
        id: 'default_product',
        name: 'Ürün',
        category1: 'Genel',
        category2: '',
        itemType: 'PHYSICAL',
        price: this.formatPrice(totalAmount)
      }]
    }

    // Basket items toplamını hesapla (güvenli)
    const basketTotal = basketItems.reduce((sum, item) => {
      const itemPrice = Number(item.price || 0)
      return sum + (isNaN(itemPrice) ? 0 : itemPrice)
    }, 0)
    
    const safeTotalAmount = Number(totalAmount || 0)
    const difference = safeTotalAmount - basketTotal
    
    logger.debug('💰 Basket price calculation:', {
      basketTotal: basketTotal.toFixed(2),
      totalAmount: safeTotalAmount.toFixed(2),
      difference: difference.toFixed(2),
      itemsCount: basketItems.length
    })
    
    const items = basketItems.map((item) => ({
      id: item.id || `item_${Date.now()}`,
      name: item.name || 'Ürün',
      category1: item.category || 'Genel',
      category2: '',
      itemType: 'PHYSICAL',
      price: this.formatPrice(item.price || 0)
    }))
    
    // 🚚 Ücretsiz kargo politikası - kargo ücreti eklenmez
    // Eğer fark varsa sadece vergi vs. için ekle (kargo hariç)
    if (difference > 0.01) {
      items.push({
        id: 'tax_fee',
        name: 'Vergi ve İşlem Ücreti',
        category1: 'Hizmet',
        category2: '',
        itemType: 'PHYSICAL',
        price: this.formatPrice(difference)
      })
    } else if (difference < -0.01) {
      // Eğer basket toplamı main price'dan büyükse, proportional olarak düşür
      const ratio = totalAmount / basketTotal
      return basketItems.map((item) => ({
        id: item.id || `item_${Date.now()}`,
        name: item.name || 'Ürün',
        category1: item.category || 'Genel',
        category2: '',
        itemType: 'PHYSICAL',
        price: this.formatPrice((item.price || 0) * ratio)
      }))
    }
    
    // Final validation: En az bir item olmalı
    if (items.length === 0) {
      items.push({
        id: 'fallback_item',
        name: 'Ürün',
        category1: 'Genel',
        category2: '',
        itemType: 'PHYSICAL',
        price: this.formatPrice(totalAmount)
      })
    }
    
    return items
  }

  /**
   * Test bağlantısı kontrolü (İyzico doğru endpoint ile)
   */
  async testConnection(): Promise<ApiResponse<any>> {
    const startTime = Date.now()
    const conversationId = this.generateConversationId()
    
    try {
      logger.info('🧪 İyzico connection test başlatılıyor (doğru endpoint):', {
        testMode: this.settings.test_mode,
        baseUrl: this.config.baseUrl,
        conversationId
      })

      // Test connection debug event
      await iyzicoLogger.logDebugEvent({
        eventType: 'api_call',
        severity: 'info',
        conversationId,
        operationContext: 'test_connection',
        eventData: {
          testMode: this.settings.test_mode,
          baseUrl: this.config.baseUrl
        }
      })

      // İyzico API test için installment endpoint kullanıyoruz (daha güvenilir)
      try {
        const testData = {
          locale: 'tr',
          conversationId: conversationId,
          binNumber: '554960', // Test BIN
          price: '1.00',
          currency: 'TRY'
        }

        const result = await this.makeRequest('/payment/iyzipos/installment', testData)
        const duration = Date.now() - startTime
        
        logger.info('📊 İyzico test response (doğru endpoint):', { result })

        if (result.status === 'success') {
          // Başarılı test connection
          await iyzicoLogger.logTransaction({
            conversationId,
            operationType: 'test',
            status: 'success',
            responseData: result,
            iyzicoStatus: result.status,
            durationMs: duration
          })

          return {
            success: true,
            data: {
              message: 'İyzico API bağlantısı başarılı (doğru endpoint)',
              testMode: this.settings.test_mode,
              environment: this.settings.test_mode ? 'Sandbox' : 'Production',
              responseStatus: result.status,
              apiEndpoint: this.config.baseUrl,
              endpoint: '/payment/test',
              method: 'GET',
              systemTime: result.systemTime
            }
          }
        } else {
          // İyzico API hatası
          await iyzicoLogger.logTransaction({
            conversationId,
            operationType: 'test',
            status: 'failure',
            responseData: result,
            iyzicoStatus: result?.status,
            iyzicoErrorCode: result?.errorCode,
            iyzicoErrorMessage: result?.errorMessage,
            durationMs: duration
          })

          return {
            success: false,
            error: {
              code: result?.errorCode || 'API_ERROR',
              message: result?.errorMessage || 'İyzico API hatası'
            }
          }
        }
      } catch (error: any) {
        const duration = Date.now() - startTime
        logger.error('💥 İyzico Connection Test Error:', { error, message: error.message })
        
        await iyzicoLogger.logTransaction({
          conversationId,
          operationType: 'test',
          status: 'error',
          errorData: error,
          iyzicoErrorCode: error.response?.data?.errorCode,
          iyzicoErrorMessage: error.response?.data?.errorMessage,
          durationMs: duration
        })

        return {
          success: false,
          error: {
            code: error.response?.data?.errorCode || 'CONNECTION_ERROR',
            message: error.response?.data?.errorMessage || 'İyzico API bağlantısı kurulamadı'
          }
        }
      }

    } catch (error: any) {
      logger.error('💥 İyzico Connection Test Exception:', { error, message: error.message })
      
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: error.message || 'Bağlantı testi başarısız'
        }
      }
    }
  }

  /**
   * 3D Secure ödeme başlatır
   */
  async initiate3DSecurePayment(request: CreatePaymentRequest): Promise<PaymentInitResponse> {
    const startTime = Date.now()
    const conversationId = this.generateConversationId()
    
    try {
      logger.info('🚀 İyzico 3D Secure payment başlatılıyor:', {
        orderNumber: request.orderNumber,
        amount: request.amount,
        currency: request.currency,
        conversationId
      })

      // Debug event - payment initialization
      await iyzicoLogger.logDebugEvent({
        eventType: 'api_call',
        severity: 'info',
        conversationId,
        operationContext: 'initiate_3d_secure_payment',
        eventData: {
          orderNumber: request.orderNumber,
          amount: request.amount,
          currency: request.currency,
          userAgent: request.userAgent,
          ipAddress: request.ipAddress
        }
      })
      
      // Callback URL validation - Community fix: Bazı durumlarda callback URL olmadan çalışıyor
      const callbackUrl = request.callbackUrl || this.settings.callback_url
      const skipCallbackUrl = process.env.IYZICO_SKIP_CALLBACK_URL === 'true'
      
      if (!skipCallbackUrl && (!callbackUrl || callbackUrl.trim() === '')) {
        logger.error('❌ Callback URL eksik!')
        return {
          success: false,
          conversationId,
          errorCode: 'CALLBACK_URL_MISSING',
          errorMessage: 'Callback URL gerekli'
        }
      }

      // COMMUNITY FIX: Parameter sırası çok önemli! İyzico dökümanına göre sıralama
      const requestData = {
        locale: 'tr',
        conversationId,
        price: this.formatPrice(request.amount),
        paidPrice: this.formatPrice(request.amount),
        installment: (request.installment || 1).toString(),
        basketId: `basket_${request.orderNumber}`,
        paymentCard: {
          cardHolderName: request.card.cardHolderName?.trim() || 'Card Holder',
          cardNumber: request.card.cardNumber.replace(/\s/g, ''),
          expireMonth: request.card.expireMonth,
          expireYear: request.card.expireYear,
          cvc: request.card.cvc,
          registerCard: request.card.saveCard ? '1' : '0'
        },
        buyer: {
          id: request.userId || `guest_${Date.now()}`,
          name: request.buyer.name?.trim() || 'Guest',
          surname: request.buyer.surname?.trim() || 'User',
          identityNumber: request.buyer.identityNumber?.trim() || '11111111111',
          email: request.buyer.email?.trim() || 'guest@example.com',
          gsmNumber: this.normalizePhoneNumber(request.buyer.phone),
          registrationAddress: request.buyer.address?.trim() || 'İstanbul, Türkiye',
          city: request.buyer.city?.trim() || 'İstanbul',
          country: request.buyer.country?.trim() || 'Turkey',
          ip: this.getProductionClientIp(request),
          lastLoginDate: this.formatIyzicoDate(new Date()),
          registrationDate: this.formatIyzicoDate(new Date()),
          zipCode: request.buyer.zipCode?.trim() || '34000'
        },
        shippingAddress: {
          contactName: request.shippingAddress?.contactName?.trim() || 
                      `${request.buyer.name?.trim() || 'Guest'} ${request.buyer.surname?.trim() || 'User'}`,
          address: request.shippingAddress?.address?.trim() || request.buyer.address?.trim() || 'İstanbul, Türkiye',
          city: request.shippingAddress?.city?.trim() || request.buyer.city?.trim() || 'İstanbul',
          country: request.shippingAddress?.country?.trim() || 'Turkey',
          zipCode: request.shippingAddress?.zipCode?.trim() || '34000'
        },
        billingAddress: {
          contactName: request.billingAddress?.contactName?.trim() || 
                      `${request.buyer.name?.trim() || 'Guest'} ${request.buyer.surname?.trim() || 'User'}`,
          address: request.billingAddress?.address?.trim() || request.buyer.address?.trim() || 'İstanbul, Türkiye',
          city: request.billingAddress?.city?.trim() || request.buyer.city?.trim() || 'İstanbul',
          country: request.billingAddress?.country?.trim() || 'Turkey',
          zipCode: request.billingAddress?.zipCode?.trim() || '34000'
        },
        basketItems: this.prepareBasketItemsForIyzipay(request.basketItems, request.amount),
        currency: 'TRY',
        paymentGroup: 'PRODUCT',
        paymentChannel: 'WEB'
      }

      // Callback URL'yi conditional olarak ekle
      if (!skipCallbackUrl && callbackUrl) {
        ;(requestData as any).callbackUrl = callbackUrl
      }
      
      // İsteği İyzico'nun beklediği sabit sırayla oluştur
      const iyzicoRequest: { [key: string]: any } = {
        locale: 'tr',
        conversationId,
        price: this.formatPrice(request.amount),
        paidPrice: this.formatPrice(request.amount),
        installment: (request.installment || 1).toString(),
        paymentChannel: 'WEB',
        basketId: `basket_${request.orderNumber}`,
        paymentGroup: 'PRODUCT',
        paymentCard: {
          cardHolderName: request.card.cardHolderName?.trim() || 'Card Holder',
          cardNumber: request.card.cardNumber.replace(/\s/g, ''),
          expireMonth: request.card.expireMonth,
          expireYear: request.card.expireYear,
          cvc: request.card.cvc,
          registerCard: request.card.saveCard ? '1' : '0'
        },
        buyer: {
          id: request.userId || `guest_${Date.now()}`,
          name: this.sanitizeString(request.buyer.name?.trim() || 'Guest'),
          surname: this.sanitizeString(request.buyer.surname?.trim() || 'User'),
          email: request.buyer.email?.trim() || 'guest@example.com',
          identityNumber: request.buyer.identityNumber?.trim() || '11111111111',
          registrationAddress: this.sanitizeString(request.buyer.address?.trim() || 'İstanbul, Türkiye'),
          ip: this.getProductionClientIp(request),
          city: this.sanitizeString(request.buyer.city?.trim() || 'İstanbul'),
          country: this.sanitizeString(request.buyer.country?.trim() || 'Turkey'),
          zipCode: request.buyer.zipCode?.trim() || '34000',
          lastLoginDate: this.formatIyzicoDate(new Date()),
          registrationDate: this.formatIyzicoDate(new Date())
        },
        shippingAddress: {
          contactName: this.sanitizeString(`${request.buyer.name?.trim() || 'Guest'} ${request.buyer.surname?.trim() || 'User'}`),
          city: this.sanitizeString(request.shippingAddress?.city?.trim() || request.buyer.city?.trim() || 'İstanbul'),
          country: this.sanitizeString(request.shippingAddress?.country?.trim() || 'Turkey'),
          address: this.sanitizeString(request.shippingAddress?.address?.trim() || request.buyer.address?.trim() || 'İstanbul, Türkiye'),
          zipCode: request.shippingAddress?.zipCode?.trim() || '34000'
        },
        billingAddress: {
          contactName: this.sanitizeString(`${request.buyer.name?.trim() || 'Guest'} ${request.buyer.surname?.trim() || 'User'}`),
          city: this.sanitizeString(request.billingAddress?.city?.trim() || request.buyer.city?.trim() || 'İstanbul'),
          country: this.sanitizeString(request.billingAddress?.country?.trim() || 'Turkey'),
          address: this.sanitizeString(request.billingAddress?.address?.trim() || request.buyer.address?.trim() || 'İstanbul, Türkiye'),
          zipCode: request.billingAddress?.zipCode?.trim() || '34000'
        },
        basketItems: this.prepareBasketItemsForIyzipay(request.basketItems, request.amount),
        currency: 'TRY'
      };

      // SDK'ya göre gsmNumber ana nesnede olmalı
      if (request.buyer.phone) {
        iyzicoRequest.gsmNumber = this.normalizePhoneNumber(request.buyer.phone)
      }

      // Callback URL'yi sona ekle
      if (!skipCallbackUrl && callbackUrl) {
        iyzicoRequest.callbackUrl = callbackUrl
      }
      
      // Geliştirilmiş loglama: Hassas verileri maskeleyerek tüm isteği logla
      const requestForLogging = JSON.parse(JSON.stringify(iyzicoRequest))
      if (requestForLogging.paymentCard) {
        requestForLogging.paymentCard.cardNumber = '**** **** **** ' + requestForLogging.paymentCard.cardNumber.slice(-4)
        requestForLogging.paymentCard.cvc = '***'
      }
      logger.info('📤 İyzipay 3D Secure request (Full, Masked):', { request: requestForLogging })

      // Custom HTTP client ile 3DS initialize
        try {
          const result = await this.makeRequest('/payment/3dsecure/initialize', iyzicoRequest)
        const duration = Date.now() - startTime
        
        logger.info('📊 İyzipay 3D Secure result:', { result })

        if (result.status === 'success') {
            // Başarılı 3DS initialization
            await iyzicoLogger.logTransaction({
              conversationId,
              orderNumber: request.orderNumber,
              paymentId: result.paymentId,
              operationType: 'initialize',
              status: 'success',
              requestData: iyzicoRequest,
              responseData: result,
              iyzicoStatus: result.status,
              userAgent: request.userAgent,
              ipAddress: request.ipAddress,
              durationMs: duration
            })

            // 3DS Session kaydet
            await iyzicoLogger.upsert3DSSession({
              conversationId,
              orderNumber: request.orderNumber,
              status: 'initialized',
              paymentId: result.paymentId,
              threeDSHtmlContent: result.threeDSHtmlContent,
              paymentPageUrl: result.paymentPageUrl,
              customerEmail: request.buyer.email,
              customerPhone: request.buyer.phone,
              amount: request.amount,
              currency: request.currency,
              sessionData: {
                basketItems: request.basketItems,
                buyer: request.buyer,
                shippingAddress: request.shippingAddress,
                billingAddress: request.billingAddress
              }
            })

            logger.info('✅ 3D Secure başarıyla başlatıldı:', { conversationId })

            return {
              success: true,
              paymentId: result.paymentId,
              htmlContent: result.threeDSHtmlContent,
              threeDSHtmlContent: result.threeDSHtmlContent,
              conversationId
            }
          } else {
            // Başarısız 3DS initialization
            logger.error('❌ İyzico 3D Secure Error:', { result })

            await iyzicoLogger.logTransaction({
              conversationId,
              orderNumber: request.orderNumber,
              operationType: 'initialize',
              status: 'failure',
              requestData: iyzicoRequest,
              responseData: result,
              iyzicoStatus: result?.status,
              iyzicoErrorCode: result?.errorCode,
              iyzicoErrorMessage: result?.errorMessage,
              userAgent: request.userAgent,
              ipAddress: request.ipAddress,
              durationMs: duration
            })

            return {
              success: false,
              conversationId,
              errorCode: result?.errorCode || 'PAYMENT_ERROR',
              errorMessage: result?.errorMessage || '3D Secure ödeme başlatılamadı'
            }
          }
      } catch (error: any) {
        const duration = Date.now() - startTime
        logger.error('❌ İyzico 3DS initialize error:', { error, message: error.message })
        
        await iyzicoLogger.logTransaction({
          conversationId,
          orderNumber: request.orderNumber,
          operationType: 'initialize',
          status: 'error',
          errorData: error instanceof Error ? { message: error.message, stack: error.stack } : error,
          iyzicoErrorCode: error.errorCode,
          iyzicoErrorMessage: error.errorMessage,
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          durationMs: duration
        })

        return {
          success: false,
          conversationId,
          errorCode: error.errorCode || 'INITIALIZE_ERROR',
          errorMessage: error.errorMessage || '3D Secure başlatılamadı'
        }
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      logger.error('💥 İyzico 3D Secure Error:', { error, message: error.message })
      
      // Error logging
      await iyzicoLogger.logTransaction({
        conversationId,
        orderNumber: request.orderNumber,
        operationType: 'initialize',
        status: 'error',
        errorData: {
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        durationMs: duration
      })

      return {
        success: false,
        conversationId,
        errorCode: 'SERVICE_ERROR',
        errorMessage: error.message || 'Ödeme servisi hatası'
      }
    }
  }

  /**
   * 3D Secure ödeme tamamlar - callbackdocs.md'ye göre
   * Callback'ten sonra ödemeyi authorize eder
   */
  async complete3DSecurePayment(paymentId: string): Promise<{
    status: 'success' | 'failure'
    errorCode?: string
    errorMessage?: string
    paymentData?: any
  }> {
    const startTime = Date.now()
    const conversationId = this.generateConversationId()
    
    try {
      logger.info('🎯 İyzico 3D Secure ödeme tamamlanıyor:', {
        paymentId,
        conversationId
      })

      // callbackdocs.md'ye göre 3DS tamamlama endpoint'i
      const request = {
        locale: 'tr',
        conversationId,
        paymentId: paymentId.toString()
      }

      const result = await this.makeRequest('/payment/3dsecure/auth', request)
      const duration = Date.now() - startTime
      
      logger.info('📊 İyzico 3DS Complete result:', { result })

      // Transaction log
      await iyzicoLogger.logTransaction({
        conversationId,
        paymentId,
        operationType: 'complete_3ds',
        status: result.status === 'success' ? 'success' : 'failure',
        requestData: request,
        responseData: result,
        iyzicoStatus: result.status,
        iyzicoErrorCode: result.errorCode,
        iyzicoErrorMessage: result.errorMessage,
        durationMs: duration
      })

      if (result.status === 'success') {
        // Başarılı 3DS tamamlama
        logger.info('✅ 3DS ödeme başarıyla tamamlandı:', {
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          authCode: result.authCode,
          mdStatus: result.mdStatus
        })
        
        return {
          status: 'success',
          paymentData: result
        }
      } else {
        // Başarısız 3DS tamamlama
        const errorCode = result.errorCode || 'THREEDS_AUTH_FAILED'
        const errorMessage = result.errorMessage || '3DS ödeme tamamlama başarısız'
        
        logger.error('❌ 3DS ödeme tamamlama başarısız:', {
          errorCode,
          errorMessage,
          paymentId,
          conversationId: result.conversationId,
          mdStatus: result.mdStatus
        })
        
        return {
          status: 'failure',
          errorCode,
          errorMessage,
          paymentData: result
        }
      }

    } catch (error: any) {
      const duration = Date.now() - startTime
      logger.error('💥 İyzico 3DS Complete Error:', { error, message: error.message })
      
      // Error logging
      await iyzicoLogger.logTransaction({
        conversationId,
        paymentId,
        operationType: 'complete_3ds',
        status: 'error',
        errorData: {
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        durationMs: duration
      })

      return {
        status: 'failure',
        errorCode: 'THREEDS_COMPLETE_ERROR',
        errorMessage: error.message || '3DS tamamlama işlemi başarısız'
      }
    }
  }

  /**
   * Basket items'ları İyzipay formatına çevirir
   */
  private prepareBasketItemsForIyzipay(basketItems: any[], totalAmount: number): any[] {
    if (!basketItems || basketItems.length === 0) {
      return [{
        id: 'default_product',
        name: 'Ürün',
        category1: 'Genel',
        category2: '',
        itemType: 'PHYSICAL', // SDK'nın BASKET_ITEM_TYPE.PHYSICAL yerine 'PHYSICAL' kullanıyoruz
        price: this.formatPrice(totalAmount)
      }]
    }

    const basketTotal = basketItems.reduce((sum, item) => sum + (item.price || 0), 0)
    const difference = totalAmount - basketTotal
    
    const items = basketItems.map((item) => ({
      id: item.id || `item_${Date.now()}`,
      name: item.name || 'Ürün',
      category1: item.category || 'Genel',
      category2: '',
      itemType: 'PHYSICAL', // SDK'nın BASKET_ITEM_TYPE.PHYSICAL yerine 'PHYSICAL' kullanıyoruz
      price: this.formatPrice(item.price || 0)
    }))
    
    // 🚚 Ücretsiz kargo politikası - sadece vergi vs. ekle  
    if (difference > 0.01) {
      items.push({
        id: 'tax_fee',
        name: 'Vergi ve İşlem Ücreti',
        category1: 'Hizmet',
        category2: '',
        itemType: 'PHYSICAL', // SDK'nın BASKET_ITEM_TYPE.PHYSICAL yerine 'PHYSICAL' kullanıyoruz
        price: this.formatPrice(difference)
      })
    }
    
    return items
  }

  /**
   * Diğer ödeme methodları henüz implement edilmedi
   * İhtiyaç duyuldukça eklenecek
   */
  async processDirectPayment(request: CreatePaymentRequest): Promise<PaymentInitResponse> {
    throw new Error('Bu method henüz implement edilmedi')
  }

  async getInstallmentOptions(request: InstallmentRequest): Promise<ApiResponse<IyzicoInstallmentResponse>> {
    throw new Error('Bu method henüz implement edilmedi')
  }

  async payWithSavedCard(request: CreatePaymentRequest & { cardToken: string; cardUserKey: string }): Promise<PaymentInitResponse> {
    throw new Error('Bu method henüz implement edilmedi')
  }

  async processRefund(paymentTransactionId: string, amount: number, reason?: string): Promise<ApiResponse<any>> {
    throw new Error('Bu method henüz implement edilmedi')
  }

  async retrievePayment(paymentId: string): Promise<ApiResponse<IyzicoPaymentResponse>> {
    throw new Error('Bu method henüz implement edilmedi')
  }

  /**
   * İyzico API'sine genel çağrı yapar (3DS complete için gerekli)
   */
  async callIyzicoAPI(endpoint: string, data: any): Promise<any> {
    try {
      const url = endpoint === 'threedsComplete' ? '/payment/3dsecure/auth' : `/${endpoint}`
      
      logger.info(`📡 İyzico API çağrısı: ${endpoint}`, {
        url,
        conversationId: data.conversationId,
        token: data.token?.substring(0, 10) + '...'
      })

      const response = await this.httpClient.post(url, data)
      
      logger.info(`📊 İyzico ${endpoint} response:`, {
        status: response.status,
        iyzicoStatus: response.data?.status,
        conversationId: response.data?.conversationId
      })

      return response.data
    } catch (error: any) {
      logger.error(`❌ İyzipico ${endpoint} API error:`, { error, message: error.message })
      
      if (error.response?.data) {
        return error.response.data
      }
      
      throw error
    }
  }

  /**
   * Payment durumunu İyzico API'den kontrol eder
   */
  async checkPaymentStatus(paymentId: string, token?: string, conversationId?: string): Promise<{
    status: 'success' | 'failure'
    errorCode?: string
    errorMessage?: string
    paymentData?: any
  }> {
    try {
      logger.info('🔍 İyzico payment status kontrol ediliyor:', { paymentId, hasToken: !!token, conversationId })
      
      const requestConversationId = conversationId || this.generateConversationId()

      // Token varsa 3DS complete endpoint kullan
      if (token && token !== 'undefined' && token.length > 10) {
        logger.info('🔐 Token mevcut - 3DS complete endpoint kullanılıyor')
        
        // Custom HTTP client ile 3DS complete çağrısı
        try {
          const request = {
            locale: 'tr',
            conversationId: requestConversationId,
            token: token
          }

          const response = await this.makeRequest('/payment/3dsecure/auth/complete', request)
          
          if (response.status === 'success') {
            return {
              status: 'success',
              paymentData: response
            }
          } else {
            return {
              status: 'failure',
              errorCode: response.errorCode || 'THREEDS_COMPLETE_FAILED',
              errorMessage: response.errorMessage || '3DS complete başarısız'
            }
          }
        } catch (error: any) {
          logger.error('❌ 3DS complete error:', { error, message: error.message })
          return {
            status: 'failure',
            errorCode: 'THREEDS_COMPLETE_ERROR',
            errorMessage: '3DS complete işlemi başarısız'
          }
        }
      } else {
        // Token yok, paymentId ile payment retrieve endpoint kullan
        logger.info('📋 Token yok - payment retrieve endpoint kullanılıyor')
        
        try {
          const request = {
            locale: 'tr',
            conversationId: requestConversationId,
            paymentId: paymentId.toString(),
            paymentConversationId: conversationId
          }

          const response = await this.makeRequest('/payment/detail', request)
          
          if (response.status === 'success' && (
            response.paymentStatus === 'SUCCESS' || 
            response.paymentStatus === 'CALLBACK_THREEDS'
          )) {
            // SUCCESS: Ödeme tamamen tamamlandı
            // CALLBACK_THREEDS: 3D Secure tamamlandı, ödeme authorize edildi
            logger.info('✅ Payment başarılı:', {
              paymentStatus: response.paymentStatus,
              phase: response.phase,
              mdStatus: response.mdStatus,
              conversationId: response.conversationId
            })
            
            return {
              status: 'success',
              paymentData: response
            }
          } else {
            return {
              status: 'failure',
              errorCode: response.errorCode || 'PAYMENT_NOT_SUCCESSFUL',
              errorMessage: response.errorMessage || 'Ödeme başarılı değil',
              paymentData: response
            }
          }
        } catch (error: any) {
          logger.error('❌ Payment retrieve error:', { error, message: error.message })
          return {
            status: 'failure',
            errorCode: 'PAYMENT_RETRIEVE_ERROR',
            errorMessage: 'Payment retrieve işlemi başarısız'
          }
        }
      }
    } catch (error: any) {
      logger.error('❌ Payment status kontrol hatası:', { error, message: error.message })
      
      return {
        status: 'failure',
        errorCode: 'STATUS_CHECK_ERROR',
        errorMessage: 'Payment durumu kontrol edilemedi'
      }
    }
  }

  /**
   * 3DS auth response parser
   */
  private parseAuthResponse(response: any) {
    logger.debug('📊 İyzico 3DS auth response:', { response })
    
    // Enhanced error logging for 3DS auth
    if (response.status !== 'success') {
      logger.error('❌ İyzico 3DS Auth Error:', {
        status: response.status,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
        errorGroup: response.errorGroup,
        locale: response.locale,
        conversationId: response.conversationId,
        paymentId: response.paymentId,
        mdStatus: response.mdStatus,
        authCode: response.authCode,
        fullResponse: response
      })
    }

    if (response.status === 'success') {
      // 3DS auth successful
      logger.info('✅ 3DS Auth Successful:', {
        paymentId: response.paymentId,
        conversationId: response.conversationId,
        paymentStatus: response.paymentStatus,
        authCode: response.authCode,
        mdStatus: response.mdStatus
      })
      
      return {
        status: 'success' as const,
        paymentData: response
      }
    } else {
      const errorCode = response.errorCode || 'THREEDS_AUTH_FAILED'
      const errorMessage = response.errorMessage || '3DS doğrulama başarısız'
      
      logger.error('🔐 3DS Auth Failed:', {
        errorCode,
        errorMessage,
        errorGroup: response.errorGroup,
        mdStatus: response.mdStatus,
        paymentId: response.paymentId,
        conversationId: response.conversationId
      })
      
      return {
        status: 'failure' as const,
        errorCode,
        errorMessage
      }
    }
  }

  /**
   * Payment detail response parser  
   */
  private parseDetailResponse(response: any) {
    logger.debug('📊 İyzico payment detail response:', { response })
    
    // Enhanced error logging
    if (response.status !== 'success') {
      logger.error('❌ İyzico Payment Detail Error:', {
        status: response.status,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
        errorGroup: response.errorGroup,
        locale: response.locale,
        conversationId: response.conversationId,
        fullResponse: response
      })
    }

    if (response.status === 'success') {
      // Payment detaylarını kontrol et
      const payment = response.payment || response
      
      if (payment?.paymentStatus === 'SUCCESS') {
        return {
          status: 'success' as const,
          paymentData: payment
        }
      } else {
        // Payment başarısız - detaylı error logging
        const errorCode = payment?.paymentError?.errorCode || payment?.errorCode || response.errorCode || 'PAYMENT_FAILED'
        const errorMessage = payment?.paymentError?.errorMessage || payment?.errorMessage || response.errorMessage || 'Ödeme başarısız'
        
        logger.error('💳 Payment Failed - Detail Response:', {
          paymentStatus: payment?.paymentStatus,
          errorCode,
          errorMessage,
          errorGroup: payment?.paymentError?.errorGroup || response.errorGroup,
          paymentId: payment?.paymentId,
          conversationId: response.conversationId,
          authCode: payment?.authCode,
          hostReference: payment?.hostReference,
          mdStatus: payment?.mdStatus,
          fraudStatus: payment?.fraudStatus,
          fullPayment: payment
        })
        
        return {
          status: 'failure' as const,
          errorCode,
          errorMessage,
          paymentData: payment
        }
      }
    } else {
      const errorCode = response.errorCode || 'API_ERROR'
      const errorMessage = response.errorMessage || 'Payment detail alınamadı'
      
      logger.error('🚨 İyzico API Error:', {
        errorCode,
        errorMessage,
        errorGroup: response.errorGroup,
        httpStatus: response.httpStatus,
        conversationId: response.conversationId
      })
      
      return {
        status: 'failure' as const,
        errorCode,
        errorMessage
      }
    }
  }
}

/**
 * Environment variables'dan İyzico ayarlarını okur
 */
export function getIyzicoSettingsFromEnv(): IyzicoSettings | null {
  // 🔧 SANDBOX/PRODUCTION Setup: Flexible environment variables
  const testMode = process.env.IYZICO_TEST_MODE === 'true'
  const apiKey = process.env.IYZICO_API_KEY
  const secretKey = process.env.IYZICO_SECRET_KEY
  const baseUrl = process.env.IYZICO_BASE_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!apiKey || !secretKey) {
    logger.warn('⚠️ İyzico API anahtarları (IYZICO_API_KEY, IYZICO_SECRET_KEY) bulunamadı')
    return null
  }

  // App URL fallback for local development
  const effectiveAppUrl = appUrl || 'http://localhost:3000'

  const mode = testMode ? 'SANDBOX' : 'PRODUCTION'
  const effectiveBaseUrl = baseUrl || (testMode ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com')

  logger.info(`✅ İyzico ${mode} ayarları yüklendi:`, {
    testMode,
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    baseUrl: effectiveBaseUrl,
    appUrl: effectiveAppUrl,
    apiKeyPrefix: apiKey.substring(0, testMode ? 15 : 10) + '...'
  })

  return {
    id: testMode ? 'sandbox_settings' : 'production_settings',
    is_active: true,
    test_mode: testMode,
    api_key: testMode ? '' : apiKey, // Production API key
    secret_key: testMode ? '' : secretKey, // Production Secret key
    sandbox_api_key: testMode ? apiKey : '', // Sandbox API key
    sandbox_secret_key: testMode ? secretKey : '', // Sandbox Secret key
    production_base_url: testMode ? 'https://api.iyzipay.com' : effectiveBaseUrl,
    sandbox_base_url: testMode ? effectiveBaseUrl : 'https://sandbox-api.iyzipay.com',
    callback_url: `${effectiveAppUrl}/api/payment/iyzico/callback`,
    webhook_url: `${effectiveAppUrl}/api/payment/iyzico/webhook`,
    default_currency: (process.env.IYZICO_DEFAULT_CURRENCY as Currency) || 'TRY',
    force_3d_secure: process.env.IYZICO_FORCE_3D_SECURE !== 'false', // Default true
    auto_capture: true,
    allow_installments: true,
    max_installment_count: 12,
    minimum_installment_amount: 100,
    commission_rate: 0.028,
    installment_commission_rate: 0.032,
    company_name: 'RDHN Commerce',
    company_phone: '+90 212 123 45 67',
    company_email: 'info@rdhncommerce.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * İyzico Service Factory
 * Ayarları base alarak service instance'ı oluşturur
 */
export function createIyzicoService(settings: IyzicoSettings): IyzicoService {
  return new IyzicoService(settings)
} 