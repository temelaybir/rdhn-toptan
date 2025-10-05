import { createClient } from '@/lib/supabase/server'
import { 
  SyncQueue, 
  TrendyolOperationType, 
  SyncResult, 
  BatchSyncResult 
} from '@/types/trendyol'

export class QueueManager {
  private batchSize = 100
  private maxRetries = 3
  private retryDelay = 5000 // 5 seconds

  /**
   * Kuyruğa yeni işlem ekler
   */
  async addToQueue(
    operationType: TrendyolOperationType,
    payload: Record<string, any>,
    scheduledAt?: Date
  ): Promise<SyncResult> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('sync_queue')
        .insert({
          operation_type: operationType,
          payload,
          status: 'PENDING',
          retry_count: 0,
          max_retries: this.maxRetries,
          scheduled_at: scheduledAt?.toISOString() || new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: `Kuyruk ekleme hatası: ${error.message}` }
      }

      return { 
        success: true, 
        message: 'İşlem kuyruğa eklendi',
        data: { queueId: data.id }
      }

    } catch (error) {
      console.error('Queue ekleme hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kuyruk ekleme başarısız'
      }
    }
  }

  /**
   * Birden fazla işlemi toplu olarak kuyruğa ekler
   */
  async addBatchToQueue(
    operations: Array<{
      operationType: TrendyolOperationType
      payload: Record<string, any>
      scheduledAt?: Date
    }>
  ): Promise<BatchSyncResult> {
    const results: BatchSyncResult = {
      total: operations.length,
      successful: 0,
      failed: 0,
      errors: []
    }

    try {
      const supabase = await createClient()

      // Batch insert için veri hazırla
      const queueItems = operations.map(op => ({
        operation_type: op.operationType,
        payload: op.payload,
        status: 'PENDING' as const,
        retry_count: 0,
        max_retries: this.maxRetries,
        scheduled_at: op.scheduledAt?.toISOString() || new Date().toISOString()
      }))

      // Batch'leri böl (Supabase batch limit)
      const batches = this.chunkArray(queueItems, this.batchSize)

      for (const batch of batches) {
        try {
          const { error } = await supabase
            .from('sync_queue')
            .insert(batch)

          if (error) {
            results.failed += batch.length
            results.errors.push({
              barcode: 'batch',
              error: error.message
            })
          } else {
            results.successful += batch.length
          }

        } catch (batchError) {
          results.failed += batch.length
          results.errors.push({
            barcode: 'batch',
            error: batchError instanceof Error ? batchError.message : 'Batch hatası'
          })
        }
      }

      return results

    } catch (error) {
      console.error('Batch queue ekleme hatası:', error)
      return {
        total: operations.length,
        successful: 0,
        failed: operations.length,
        errors: [{
          barcode: 'all',
          error: error instanceof Error ? error.message : 'Toplu kuyruk ekleme başarısız'
        }]
      }
    }
  }

  /**
   * Bekleyen işlemleri işler
   */
  async processPendingQueue(): Promise<BatchSyncResult> {
    try {
      const supabase = await createClient()

      // Bekleyen işlemleri al (scheduled_at geçmiş olanlar)
      const { data: pendingItems, error } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('status', 'PENDING')
        .lt('scheduled_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(this.batchSize)

      if (error) {
        throw new Error(`Bekleyen işlemler alınamadı: ${error.message}`)
      }

      if (!pendingItems || pendingItems.length === 0) {
        return {
          total: 0,
          successful: 0,
          failed: 0,
          errors: []
        }
      }

      const results: BatchSyncResult = {
        total: pendingItems.length,
        successful: 0,
        failed: 0,
        errors: []
      }

      // Her işlemi sırayla process et
      for (const item of pendingItems) {
        try {
          // İşlemi PROCESSING olarak işaretle
          await supabase
            .from('sync_queue')
            .update({ status: 'PROCESSING' })
            .eq('id', item.id)

          // İşlemi gerçekleştir
          const processResult = await this.processQueueItem(item)

          if (processResult.success) {
            // Başarılı - SUCCESS olarak işaretle
            await supabase
              .from('sync_queue')
              .update({ 
                status: 'SUCCESS',
                processed_at: new Date().toISOString()
              })
              .eq('id', item.id)

            results.successful++
          } else {
            // Başarısız - retry logic
            const newRetryCount = item.retry_count + 1
            
            if (newRetryCount >= item.max_retries) {
              // Max retry'a ulaştı - ERROR olarak işaretle
              await supabase
                .from('sync_queue')
                .update({ 
                  status: 'ERROR',
                  error_message: processResult.error,
                  processed_at: new Date().toISOString()
                })
                .eq('id', item.id)

              results.failed++
              results.errors.push({
                barcode: item.payload.barcode || item.id,
                error: processResult.error || 'İşlem başarısız'
              })
            } else {
              // Retry için tekrar PENDING yap
              const nextScheduledAt = new Date(Date.now() + this.retryDelay * newRetryCount)
              
              await supabase
                .from('sync_queue')
                .update({ 
                  status: 'PENDING',
                  retry_count: newRetryCount,
                  scheduled_at: nextScheduledAt.toISOString(),
                  error_message: processResult.error
                })
                .eq('id', item.id)

              // Bu retry olarak sayılır
              results.failed++
            }
          }

        } catch (processError) {
          console.error(`Queue item işleme hatası (${item.id}):`, processError)
          
          // Hata durumunda item'ı ERROR olarak işaretle
          await supabase
            .from('sync_queue')
            .update({ 
              status: 'ERROR',
              error_message: processError instanceof Error ? processError.message : 'İşlem hatası',
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id)

          results.failed++
          results.errors.push({
            barcode: item.payload.barcode || item.id,
            error: processError instanceof Error ? processError.message : 'İşlem hatası'
          })
        }

        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      return results

    } catch (error) {
      console.error('Queue işleme hatası:', error)
      return {
        total: 0,
        successful: 0,
        failed: 0,
        errors: [{
          barcode: 'system',
          error: error instanceof Error ? error.message : 'Queue işleme sistemi hatası'
        }]
      }
    }
  }

  /**
   * Tekil queue item'ını işler
   */
  private async processQueueItem(item: SyncQueue): Promise<SyncResult> {
    try {
      switch (item.operation_type) {
        case 'CREATE_PRODUCT':
          return await this.processCreateProduct(item.payload)
        
        case 'UPDATE_STOCK':
          return await this.processUpdateStock(item.payload)
        
        case 'UPDATE_PRICE':
          return await this.processUpdatePrice(item.payload)
        
        case 'UPLOAD_IMAGE':
          return await this.processUploadImage(item.payload)
        
        default:
          return { 
            success: false, 
            error: `Bilinmeyen işlem tipi: ${item.operation_type}` 
          }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'İşlem gerçekleştirme hatası'
      }
    }
  }

  /**
   * Ürün oluşturma işlemini gerçekleştirir
   */
  private async processCreateProduct(payload: any): Promise<SyncResult> {
    try {
      // SyncEngine'i dinamik olarak import et
      const { SyncEngine } = await import('./sync-engine')
      const syncEngine = new SyncEngine()
      
      return await syncEngine.createProduct(payload.productId)

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ürün oluşturma hatası'
      }
    }
  }

  /**
   * Stok güncelleme işlemini gerçekleştirir
   */
  private async processUpdateStock(payload: any): Promise<SyncResult> {
    try {
      const { SyncEngine } = await import('./sync-engine')
      const syncEngine = new SyncEngine()
      
      return await syncEngine.updateStock([{
        barcode: payload.barcode,
        quantity: payload.quantity
      }])

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stok güncelleme hatası'
      }
    }
  }

  /**
   * Fiyat güncelleme işlemini gerçekleştirir
   */
  private async processUpdatePrice(payload: any): Promise<SyncResult> {
    try {
      const { SyncEngine } = await import('./sync-engine')
      const syncEngine = new SyncEngine()
      
      return await syncEngine.updatePrices([{
        barcode: payload.barcode,
        listPrice: payload.listPrice,
        salePrice: payload.salePrice
      }])

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fiyat güncelleme hatası'
      }
    }
  }

  /**
   * Görsel yükleme işlemini gerçekleştirir
   */
  private async processUploadImage(payload: any): Promise<SyncResult> {
    try {
      // ImageProcessor'ı dinamik olarak import et
      const { ImageProcessor } = await import('./image-processor')
      
      // FTP config'i al
      const supabase = await createClient()
      const { data: settings, error } = await supabase
        .from('trendyol_settings')
        .select('ftp_host, ftp_user, ftp_password, ftp_base_path')
        .eq('is_active', true)
        .single()

      if (error || !settings) {
        return { success: false, error: 'FTP ayarları bulunamadı' }
      }

      const imageProcessor = new ImageProcessor({
        host: settings.ftp_host!,
        user: settings.ftp_user!,
        password: settings.ftp_password!,
        basePath: settings.ftp_base_path || '/products'
      })

      const result = await imageProcessor.processProductImages(
        payload.productId,
        payload.imageUrls
      )

      if (result.length > 0) {
        // Sonuçları veritabanına kaydet
        const { error: insertError } = await supabase
          .from('ftp_images')
          .insert(result)

        if (insertError) {
          return { success: false, error: `Görsel kayıt hatası: ${insertError.message}` }
        }
      }

      return { success: true, message: `${result.length} görsel işlendi` }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Görsel yükleme hatası'
      }
    }
  }

  /**
   * Kuyruk durumunu getir
   */
  async getQueueStatus(): Promise<{
    pending: number
    processing: number
    successful: number
    failed: number
  }> {
    try {
      const supabase = await createClient()

      const [pendingResult, processingResult, successResult, failedResult] = await Promise.all([
        supabase.from('sync_queue').select('id', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('sync_queue').select('id', { count: 'exact' }).eq('status', 'PROCESSING'),
        supabase.from('sync_queue').select('id', { count: 'exact' }).eq('status', 'SUCCESS'),
        supabase.from('sync_queue').select('id', { count: 'exact' }).eq('status', 'ERROR')
      ])

      return {
        pending: pendingResult.count || 0,
        processing: processingResult.count || 0,
        successful: successResult.count || 0,
        failed: failedResult.count || 0
      }

    } catch (error) {
      console.error('Queue status hatası:', error)
      return { pending: 0, processing: 0, successful: 0, failed: 0 }
    }
  }

  /**
   * Eski işlemleri temizler
   */
  async cleanupOldJobs(daysOld = 7): Promise<SyncResult> {
    try {
      const supabase = await createClient()
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

      const { error } = await supabase
        .from('sync_queue')
        .delete()
        .in('status', ['SUCCESS', 'ERROR'])
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        return { success: false, error: `Temizlik hatası: ${error.message}` }
      }

      return { success: true, message: 'Eski işlemler temizlendi' }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Temizlik işlemi başarısız'
      }
    }
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
   * Batch boyutunu ayarlar
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(size, 500)) // 1-500 arası
  }

  /**
   * Max retry sayısını ayarlar
   */
  setMaxRetries(retries: number): void {
    this.maxRetries = Math.max(0, Math.min(retries, 10)) // 0-10 arası
  }

  /**
   * Retry delay'ini ayarlar (milisaniye)
   */
  setRetryDelay(delay: number): void {
    this.retryDelay = Math.max(1000, Math.min(delay, 60000)) // 1-60 saniye arası
  }
} 