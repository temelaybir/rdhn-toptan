import { createClient } from '@/lib/supabase/server'
import type { 
  BizimHesapService as IBizimHesapService,
  BizimHesapInvoiceResult,
  ECommerceOrder
} from '@ardahanticaret/bizimhesap-integration'
import { InvoiceType } from '@ardahanticaret/bizimhesap-integration'

// Re-export InvoiceType for backwards compatibility
export { InvoiceType }

export interface InvoiceCreationResult {
  success: boolean
  invoiceGuid?: string
  invoiceUrl?: string
  error?: string
  orderId: string
}

export interface InvoiceCreationOptions {
  createInvoiceRecord?: boolean
  sendNotification?: boolean
  invoiceType?: InvoiceType
}

export class BizimHesapInvoiceService {
  private bizimHesapService: IBizimHesapService | null = null

  constructor() {
    // BizimHesap service'i lazy load ediyoruz
    try {
      const { createBizimHesapService } = require('@ardahanticaret/bizimhesap-integration')
      this.bizimHesapService = createBizimHesapService()
    } catch (error) {
      console.warn('⚠️ BizimHesap integration yüklenemedi:', error)
    }
  }

  /**
   * Sipariş ID'si ile fatura oluştur
   */
  async createInvoiceFromOrderId(
    orderId: string,
    options: InvoiceCreationOptions = {}
  ): Promise<InvoiceCreationResult> {
    try {
      if (!this.bizimHesapService) {
        console.warn('⚠️ BizimHesap servisi yüklenmedi, fatura oluşturulamıyor')
        return {
          success: false,
          error: 'BizimHesap servisi kullanılamıyor',
          orderId
        }
      }

      console.log(`🧾 Sipariş ${orderId} için fatura oluşturuluyor...`)

      // Supabase'den sipariş bilgilerini al
      const order = await this.getOrderFromDatabase(orderId)
      if (!order) {
        return {
          success: false,
          error: 'Sipariş bulunamadı',
          orderId
        }
      }

      // Sipariş formatını dönüştür
      const { convertSupabaseOrderToBizimHesap } = require('@ardahanticaret/bizimhesap-integration')
      const ecommerceOrder = convertSupabaseOrderToBizimHesap(order)

      // ✅ SALES (Satış faturası) olarak zorla
      const invoiceOptions = {
        ...options,
        invoiceType: InvoiceType.SALES // 3 - Satış faturası
      }

      console.log('🔍 Invoice Type Forced:', {
        optionsType: options.invoiceType,
        forcedType: invoiceOptions.invoiceType,
        InvoiceTypeSALES: InvoiceType.SALES,
        InvoiceTypePURCHASE: InvoiceType.PURCHASE
      })

      // Faturayı oluştur
      const result = await this.createInvoiceFromOrder(ecommerceOrder, invoiceOptions)

      // Sonucu veritabanına kaydet  
      if (result.success && options.createInvoiceRecord !== false) {
        await this.saveInvoiceRecord(order.id, result) // Gerçek UUID kullan
      }

      return {
        ...result,
        orderId
      }

    } catch (error: any) {
      console.error(`❌ Sipariş ${orderId} fatura oluşturma hatası:`, error)
      return {
        success: false,
        error: error.message || 'Fatura oluşturma hatası',
        orderId
      }
    }
  }

  /**
   * E-commerce siparişinden fatura oluştur
   */
  async createInvoiceFromOrder(
    order: ECommerceOrder,
    options: InvoiceCreationOptions = {}
  ): Promise<BizimHesapInvoiceResult> {
    try {
      if (!this.bizimHesapService) {
        return {
          success: false,
          error: 'BizimHesap servisi yüklenemedi. Lütfen yapılandırmayı kontrol edin.'
        }
      }

      console.log(`🧾 ${order.orderNumber} numaralı sipariş için fatura oluşturuluyor...`)

      // Fatura tipini belirle
      const invoiceType = options.invoiceType || InvoiceType.SALES

      // Faturayı oluştur
      let result: BizimHesapInvoiceResult

      if (invoiceType === InvoiceType.SALES) {
        result = await this.bizimHesapService.createSalesInvoice(order)
      } else {
        result = await this.bizimHesapService.createPurchaseInvoice(order)
      }

      if (result.success) {
        console.log(`✅ Fatura başarıyla oluşturuldu:`, {
          orderNumber: order.orderNumber,
          guid: result.guid,
          url: result.invoiceUrl
        })

        // Bildirim gönder
        if (options.sendNotification !== false) {
          await this.sendInvoiceNotification(order, result)
        }
      } else {
        console.error(`❌ Fatura oluşturulamadı:`, result.error)
      }

      return result

    } catch (error: any) {
      console.error('❌ Fatura oluşturma hatası:', error)
      return {
        success: false,
        error: error.message || 'Fatura oluşturma hatası'
      }
    }
  }

  /**
   * Toplu fatura oluşturma
   */
  async createInvoicesForOrders(
    orderIds: string[],
    options: InvoiceCreationOptions = {}
  ): Promise<InvoiceCreationResult[]> {
    console.log(`🧾 ${orderIds.length} sipariş için toplu fatura oluşturuluyor...`)

    const results: InvoiceCreationResult[] = []

    for (const orderId of orderIds) {
      try {
        const result = await this.createInvoiceFromOrderId(orderId, options)
        results.push(result)

        // API rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          orderId
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`📊 Toplu fatura sonucu: ${successCount}/${orderIds.length} başarılı`)

    return results
  }

  /**
   * Supabase'den sipariş bilgilerini al
   */
  private async getOrderFromDatabase(orderId: string) {
    const supabase = await createClient()

    // UUID mi yoksa order number mı kontrol et
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)
    
    console.log(`🔍 Order ID tipi: ${orderId} -> ${isUUID ? 'UUID' : 'Order Number'}`)

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (
            name,
            sku,
            barcode
          )
        ),
        customer:customers (
          *
        )
      `)
      .eq(isUUID ? 'id' : 'order_number', orderId)
      .single()

    console.log('🔍 Database Order Result:', {
      hasError: !!error,
      hasOrder: !!order,
      orderItemsField: order?.order_items ? 'EXISTS' : 'NULL',
      orderItemsLength: order?.order_items?.length || 0,
      orderItemsRaw: JSON.stringify(order?.order_items || [])
    })

    if (error) {
      console.error('Sipariş bilgisi alınamadı:', error)
      return null
    }

    return order
  }

  /**
   * Fatura kaydını veritabanına kaydet
   */
  private async saveInvoiceRecord(orderId: string, result: BizimHesapInvoiceResult) {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('invoices')
        .insert({
          order_id: orderId,
          invoice_number: result.invoiceNumber || result.guid, // Benzersiz fatura numarası
          invoice_guid: result.guid,
          invoice_url: result.invoiceUrl,
          provider: 'bizimhesap',
          invoice_type: 'SALES', // Her zaman satış faturası
          status: 'created',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Fatura kaydı veritabanına kaydedilemedi:', error)
      } else {
        console.log('✅ Fatura kaydı veritabanına kaydedildi')
      }

      // Siparişin fatura durumunu güncelle
      await supabase
        .from('orders')
        .update({ 
          invoice_status: 'invoiced',
          invoice_guid: result.guid,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    } catch (error) {
      console.error('Fatura kaydı kaydetme hatası:', error)
    }
  }

  /**
   * Fatura bildirimi gönder
   */
  private async sendInvoiceNotification(order: ECommerceOrder, result: BizimHesapInvoiceResult) {
    try {
      // Email bildirim gönder (eğer email service varsa)
      if (order.customer.email && result.invoiceUrl) {
        console.log(`📧 Fatura bildirimi gönderiliyor: ${order.customer.email}`)
        
        // TODO: Email service entegrasyonu
        // await emailService.sendInvoiceNotification({
        //   to: order.customer.email,
        //   orderNumber: order.orderNumber,
        //   invoiceUrl: result.invoiceUrl
        // })
      }

    } catch (error) {
      console.error('Fatura bildirimi gönderme hatası:', error)
    }
  }

  /**
   * BizimHesap bağlantısını test et
   */
  async testConnection(): Promise<BizimHesapInvoiceResult> {
    if (!this.bizimHesapService) {
      return {
        success: false,
        error: 'BizimHesap servisi yüklenemedi. Lütfen yapılandırmayı kontrol edin.'
      }
    }
    
    try {
      return await this.bizimHesapService.testConnection()
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Bağlantı testi başarısız'
      }
    }
  }

  /**
   * Belirli tarih aralığındaki siparişler için fatura oluştur
   */
  async createInvoicesForDateRange(
    startDate: Date,
    endDate: Date,
    options: InvoiceCreationOptions = {}
  ): Promise<InvoiceCreationResult[]> {
    try {
      const supabase = await createClient()

      // Belirtilen tarih aralığındaki faturalanmamış siparişleri al
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .is('invoice_guid', null)
        .eq('status', 'completed')

      if (error) {
        throw new Error(`Siparişler alınamadı: ${error.message}`)
      }

      const orderIds = orders.map(order => order.id)
      console.log(`📅 ${startDate.toDateString()} - ${endDate.toDateString()} arası ${orderIds.length} sipariş bulundu`)

      return this.createInvoicesForOrders(orderIds, options)

    } catch (error: any) {
      console.error('Tarih aralığı fatura oluşturma hatası:', error)
      return []
    }
  }
}

// Singleton instance
let bizimHesapInvoiceService: BizimHesapInvoiceService | null = null

export function getBizimHesapInvoiceService(): BizimHesapInvoiceService {
  if (!bizimHesapInvoiceService) {
    bizimHesapInvoiceService = new BizimHesapInvoiceService()
  }
  return bizimHesapInvoiceService
} 