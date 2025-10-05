import { createClient } from '@/lib/supabase/server'
import { getTrendyolClient } from './api-client'
import { AttributeMapper } from './attribute-mapper'
import { QueueManager } from './queue-manager'
import { ImageProcessor } from './image-processor'
import { 
  SyncResult, 
  BatchSyncResult, 
  TrendyolApiCredentials,
  TrendyolProduct,
  TrendyolSyncLog
} from '@/types/trendyol'

export class SyncEngine {
  private attributeMapper: AttributeMapper
  private queueManager: QueueManager
  private credentials: TrendyolApiCredentials | null = null

  constructor(credentials?: TrendyolApiCredentials) {
    this.credentials = credentials || null
    this.attributeMapper = new AttributeMapper(credentials)
    this.queueManager = new QueueManager()
  }

  /**
   * Tek ürünü Trendyol'a gönderir
   */
  async createProduct(productId: string): Promise<SyncResult> {
    const startTime = Date.now()
    
    try {
      const supabase = await createClient()

      // Ürün mapping'ini kontrol et
      const mappingResult = await this.attributeMapper.mapProductToTrendyol(productId)
      if (!mappingResult.success) {
        await this.logSync('CREATE_PRODUCT', productId, null, 'ERROR', {
          error: mappingResult.error,
          duration: Date.now() - startTime
        })
        return mappingResult
      }

      const trendyolProduct = mappingResult.data!
      
      // Görselleri işle
      const imageResult = await this.processProductImages(productId)
      if (imageResult.success && imageResult.data?.imageUrls) {
        trendyolProduct.images = imageResult.data.imageUrls.map(url => ({ url }))
      }

      // Trendyol'a gönder
      const client = await this.getTrendyolClient()
      const createResult = await client.createProducts([trendyolProduct])

      if (createResult.batchRequestId) {
        // Batch request ID'yi kaydet
        const { error: productError } = await supabase
          .from('trendyol_products')
          .upsert({
            product_id: productId,
            barcode: trendyolProduct.barcode,
            approval_status: 'PENDING',
            sync_status: 'SUCCESS',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,barcode'
          })

        if (productError) {
          console.error('Trendyol product kayıt hatası:', productError)
        }

        await this.logSync('CREATE_PRODUCT', productId, null, 'SUCCESS', {
          batchRequestId: createResult.batchRequestId,
          barcode: trendyolProduct.barcode,
          duration: Date.now() - startTime
        })

        return {
          success: true,
          message: 'Ürün Trendyol\'a gönderildi',
          data: { batchRequestId: createResult.batchRequestId }
        }
      } else {
        throw new Error('Batch request ID alınamadı')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ürün oluşturma hatası'
      
      await this.logSync('CREATE_PRODUCT', productId, null, 'ERROR', {
        error: errorMessage,
        duration: Date.now() - startTime
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Birden fazla ürünü toplu olarak senkronize eder
   */
  async createMultipleProducts(productIds: string[]): Promise<BatchSyncResult> {
    const results: BatchSyncResult = {
      total: productIds.length,
      successful: 0,
      failed: 0,
      errors: []
    }

    // Batch'leri böl (Trendyol API limiti)
    const batches = this.chunkArray(productIds, 50)
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(productId => this.createProduct(productId))
      )

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.successful++
        } else {
          results.failed++
          const error = result.status === 'fulfilled' 
            ? result.value.error 
            : result.reason?.message || 'Bilinmeyen hata'
          
          results.errors.push({
            barcode: batch[index],
            error: error || 'İşlem başarısız'
          })
        }
      })

      // Rate limiting için bekleme
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return results
  }

  /**
   * Stok güncelleme
   */
  async updateStock(updates: Array<{ barcode: string; quantity: number }>): Promise<SyncResult> {
    const startTime = Date.now()
    
    try {
      const client = await this.getTrendyolClient()
      const result = await client.updateStock(updates)

      // Log kaydet
      await this.logSync('UPDATE_STOCK', null, null, 'SUCCESS', {
        updateCount: updates.length,
        batchRequestId: result.batchRequestId,
        duration: Date.now() - startTime
      })

      // Veritabanında sync zamanını güncelle
      const supabase = await createClient()
      for (const update of updates) {
        await supabase
          .from('trendyol_products')
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_status: 'SUCCESS'
          })
          .eq('barcode', update.barcode)
      }

      return {
        success: true,
        message: `${updates.length} ürünün stoğu güncellendi`,
        data: { batchRequestId: result.batchRequestId }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stok güncelleme hatası'
      
      await this.logSync('UPDATE_STOCK', null, null, 'ERROR', {
        error: errorMessage,
        updateCount: updates.length,
        duration: Date.now() - startTime
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Fiyat güncelleme
   */
  async updatePrices(updates: Array<{ 
    barcode: string
    listPrice: number
    salePrice: number 
  }>): Promise<SyncResult> {
    const startTime = Date.now()
    
    try {
      const client = await this.getTrendyolClient()
      const result = await client.updatePrices(updates)

      await this.logSync('UPDATE_PRICE', null, null, 'SUCCESS', {
        updateCount: updates.length,
        batchRequestId: result.batchRequestId,
        duration: Date.now() - startTime
      })

      // Veritabanında sync zamanını güncelle
      const supabase = await createClient()
      for (const update of updates) {
        await supabase
          .from('trendyol_products')
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_status: 'SUCCESS'
          })
          .eq('barcode', update.barcode)
      }

      return {
        success: true,
        message: `${updates.length} ürünün fiyatı güncellendi`,
        data: { batchRequestId: result.batchRequestId }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fiyat güncelleme hatası'
      
      await this.logSync('UPDATE_PRICE', null, null, 'ERROR', {
        error: errorMessage,
        updateCount: updates.length,
        duration: Date.now() - startTime
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Kombine stok ve fiyat güncelleme
   */
  async updateStockAndPrices(updates: Array<{ 
    barcode: string
    quantity: number
    listPrice: number
    salePrice: number 
  }>): Promise<SyncResult> {
    const startTime = Date.now()
    
    try {
      const client = await this.getTrendyolClient()
      const result = await client.updatePriceAndStock(updates)

      await this.logSync('UPDATE_STOCK_PRICE', null, null, 'SUCCESS', {
        updateCount: updates.length,
        batchRequestId: result.batchRequestId,
        duration: Date.now() - startTime
      })

      // Veritabanında sync zamanını güncelle
      const supabase = await createClient()
      for (const update of updates) {
        await supabase
          .from('trendyol_products')
          .update({ 
            last_sync_at: new Date().toISOString(),
            sync_status: 'SUCCESS'
          })
          .eq('barcode', update.barcode)
      }

      return {
        success: true,
        message: `${updates.length} ürünün stok ve fiyatı güncellendi`,
        data: { batchRequestId: result.batchRequestId }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stok/fiyat güncelleme hatası'
      
      await this.logSync('UPDATE_STOCK_PRICE', null, null, 'ERROR', {
        error: errorMessage,
        updateCount: updates.length,
        duration: Date.now() - startTime
      })

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Sadece stok senkronizasyonu (günlük cronjob için)
   */
  async performStockSync(): Promise<BatchSyncResult> {
    try {
      const supabase = await createClient()

      // Stok sync konfigürasyonunu kontrol et
      const { data: config, error: configError } = await supabase
        .from('trendyol_stock_sync_config')
        .select('*')
        .single()

      if (configError || !config || !config.is_enabled) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          errors: []
        }
      }

      // Trendyol'da aktif olan ürünleri al (sadece stok güncellemesi için)
      const { data: trendyolProducts, error } = await supabase
        .from('trendyol_products')
        .select(`
          *,
          products (
            stock_quantity
          )
        `)
        .eq('approval_status', 'APPROVED')
        .eq('is_active', true)

      if (error || !trendyolProducts) {
        return {
          total: 0,
          successful: 0,
          failed: 1,
          errors: [{ barcode: 'system', error: 'Aktif ürünler alınamadı' }]
        }
      }

      // Sadece stok güncelleme verilerini hazırla
      const stockUpdates = trendyolProducts
        .filter(tp => tp.products) // Ürün silinmemişse
        .map(tp => ({
          barcode: tp.barcode,
          quantity: tp.products.stock_quantity || 0
        }))

      if (stockUpdates.length === 0) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          errors: []
        }
      }

      // Batch'leri böl ve güncelle
      const batches = this.chunkArray(stockUpdates, 100)
      const results: BatchSyncResult = {
        total: stockUpdates.length,
        successful: 0,
        failed: 0,
        errors: []
      }

      const client = await this.getTrendyolClient()

      for (const batch of batches) {
        try {
          // Sadece stok güncellemesi yap
          const batchResult = await client.updateStock(batch)
          
          if (batchResult.batchRequestId) {
            results.successful += batch.length
            
            // Başarılı güncellemeler için sync zamanını güncelle
            for (const update of batch) {
              await supabase
                .from('trendyol_products')
                .update({ 
                  last_sync_at: new Date().toISOString(),
                  sync_status: 'SUCCESS'
                })
                .eq('barcode', update.barcode)
            }
          } else {
            results.failed += batch.length
            results.errors.push({
              barcode: 'batch',
              error: 'Stok güncelleme başarısız'
            })
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500))

        } catch (batchError) {
          results.failed += batch.length
          results.errors.push({
            barcode: 'batch',
            error: batchError instanceof Error ? batchError.message : 'Stok güncelleme hatası'
          })
        }
      }

      // Son sync zamanını güncelle
      const currentHour = new Date().getHours()
      const syncField = currentHour <= 12 ? 'last_sync_1' : 'last_sync_2'
      
      await supabase
        .from('trendyol_stock_sync_config')
        .update({ [syncField]: new Date().toISOString() })
        .eq('id', config.id)

      return results

    } catch (error) {
      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [{
          barcode: 'system',
          error: error instanceof Error ? error.message : 'Stok sync hatası'
        }]
      }
    }
  }

  /**
   * Ürün görsellerini işler
   */
  private async processProductImages(productId: string): Promise<{
    success: boolean;
    data?: { imageUrls: string[] };
    error?: string;
  }> {
    try {
      const supabase = await createClient()

      // Ürün görsellerini al
      const { data: product, error } = await supabase
        .from('products')
        .select('images')
        .eq('id', productId)
        .single()

      if (error || !product) {
        return { success: false, error: 'Ürün bulunamadı' }
      }

      if (!product.images || product.images.length === 0) {
        return { success: true, data: { imageUrls: [] } }
      }

      // Zaten işlenmiş görselleri kontrol et
      const { data: ftpImages } = await supabase
        .from('ftp_images')
        .select('webp_url')
        .eq('product_id', productId)
        .eq('upload_status', 'SUCCESS')
        .not('webp_url', 'is', null)

      if (ftpImages && ftpImages.length > 0) {
        // Zaten işlenmiş görseller var
        return {
          success: true,
          data: { imageUrls: ftpImages.map(img => img.webp_url!).filter(Boolean) }
        }
      }

      // Görselleri kuyruğa ekle (async processing)
      await this.queueManager.addToQueue('UPLOAD_IMAGE', {
        productId,
        imageUrls: product.images
      })

      // Şimdilik orijinal URL'leri döndür
      return {
        success: true,
        data: { imageUrls: product.images }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Görsel işleme hatası'
      }
    }
  }

  /**
   * Sync log'u kaydeder
   */
  private async logSync(
    operationType: string,
    productId: string | null,
    trendyolProductId: string | null,
    status: 'SUCCESS' | 'ERROR' | 'WARNING',
    details: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      await supabase
        .from('trendyol_sync_logs')
        .insert({
          operation_type: operationType,
          product_id: productId,
          trendyol_product_id: trendyolProductId,
          status,
          details,
          sync_duration: details.duration || null,
          error_code: details.errorCode || null,
          error_message: details.error || null
        })

    } catch (error) {
      console.error('Sync log kayıt hatası:', error)
    }
  }

  /**
   * Trendyol client'ı al
   */
  private async getTrendyolClient() {
    if (this.credentials) {
      return getTrendyolClient(this.credentials)
    }

    const supabase = await createClient()
    const { data: settings, error } = await supabase
      .from('trendyol_settings')
      .select('supplier_id, api_key, api_secret, mock_mode, test_mode')
      .eq('is_active', true)
      .single()

    if (error || !settings) {
      throw new Error('Aktif Trendyol ayarları bulunamadı')
    }

    return getTrendyolClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)
  }

  /**
   * Array'i chunk'lara böler
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Queue işlemlerini başlatır
   */
  async processQueue(): Promise<BatchSyncResult> {
    return await this.queueManager.processPendingQueue()
  }

  /**
   * Kredensiyalleri günceller
   */
  updateCredentials(credentials: TrendyolApiCredentials): void {
    this.credentials = credentials
    this.attributeMapper.updateCredentials(credentials)
  }

  /**
   * Attribute mapper'ı döndürür
   */
  getAttributeMapper(): AttributeMapper {
    return this.attributeMapper
  }

  /**
   * Queue manager'ı döndürür
   */
  getQueueManager(): QueueManager {
    return this.queueManager
  }
} 