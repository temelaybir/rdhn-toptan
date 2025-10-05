import sharp from 'sharp'
import { Client as FtpClient } from 'ftp'
import { promisify } from 'util'
import path from 'path'
import { 
  ImageProcessingOptions, 
  FtpConfig, 
  FtpImage,
  SyncResult 
} from '@/types/trendyol'

export class ImageProcessor {
  private ftpConfig: FtpConfig
  private defaultOptions: ImageProcessingOptions

  constructor(ftpConfig: FtpConfig) {
    this.ftpConfig = ftpConfig
    this.defaultOptions = {
      quality: 80,
      maxWidth: 1024,
      maxHeight: 1024,
      format: 'webp'
    }
  }

  /**
   * Görseli WebP formatına dönüştürür ve optimize eder
   */
  async processImage(
    imageUrl: string, 
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<{ buffer: Buffer; filename: string; size: number }> {
    try {
      const processingOptions = { ...this.defaultOptions, ...options }
      
      // Görsel URL'den buffer oluştur
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Görsel indirilemedi: ${response.statusText}`)
      }
      
      const originalBuffer = Buffer.from(await response.arrayBuffer())
      
      // Sharp ile işle
      let sharpInstance = sharp(originalBuffer)
      
      // Metadata al
      const metadata = await sharpInstance.metadata()
      
      // Boyut kontrolü ve resize
      if (metadata.width && metadata.height) {
        if (metadata.width > processingOptions.maxWidth || metadata.height > processingOptions.maxHeight) {
          sharpInstance = sharpInstance.resize(
            processingOptions.maxWidth,
            processingOptions.maxHeight,
            {
              fit: 'inside',
              withoutEnlargement: true
            }
          )
        }
      }
      
      // Format dönüşümü
      let processedBuffer: Buffer
      let extension: string

      switch (processingOptions.format) {
        case 'webp':
          processedBuffer = await sharpInstance
            .webp({ quality: processingOptions.quality })
            .toBuffer()
          extension = '.webp'
          break
        case 'jpeg':
          processedBuffer = await sharpInstance
            .jpeg({ quality: processingOptions.quality })
            .toBuffer()
          extension = '.jpg'
          break
        case 'png':
          processedBuffer = await sharpInstance
            .png({ quality: processingOptions.quality })
            .toBuffer()
          extension = '.png'
          break
        default:
          throw new Error(`Desteklenmeyen format: ${processingOptions.format}`)
      }
      
      // Dosya adı oluştur
      const timestamp = Date.now()
      const filename = `${timestamp}${extension}`
      
      return {
        buffer: processedBuffer,
        filename,
        size: processedBuffer.length
      }
      
    } catch (error) {
      console.error('Görsel işleme hatası:', error)
      throw new Error(`Görsel işlenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  /**
   * İşlenmiş görseli FTP sunucusuna yükler
   */
  async uploadToFtp(
    buffer: Buffer, 
    filename: string, 
    productId: string
  ): Promise<{ ftpUrl: string; webpUrl: string }> {
    return new Promise((resolve, reject) => {
      const ftpClient = new FtpClient()
      
      ftpClient.on('ready', async () => {
        try {
          // Ürün klasörü oluştur
          const productDir = path.posix.join(this.ftpConfig.basePath, productId)
          await this.ensureDirectoryExists(ftpClient, productDir)
          
          // Dosya yolu
          const remotePath = path.posix.join(productDir, filename)
          
          // Upload işlemi
          const put = promisify(ftpClient.put.bind(ftpClient))
          await put(buffer, remotePath)
          
          // URL'leri oluştur
          const baseUrl = `ftp://${this.ftpConfig.host}${remotePath}`
          const ftpUrl = baseUrl
          const webpUrl = `https://${this.ftpConfig.host.replace('ftp.', 'cdn.')}${remotePath}`
          
          ftpClient.end()
          resolve({ ftpUrl, webpUrl })
          
        } catch (error) {
          ftpClient.end()
          reject(new Error(`FTP upload hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`))
        }
      })
      
      ftpClient.on('error', (error) => {
        reject(new Error(`FTP bağlantı hatası: ${error.message}`))
      })
      
      // FTP bağlantısı
      ftpClient.connect({
        host: this.ftpConfig.host,
        port: this.ftpConfig.port || 21,
        user: this.ftpConfig.user,
        password: this.ftpConfig.password,
        secure: this.ftpConfig.secure || false,
        secureOptions: {
          rejectUnauthorized: false
        }
      })
    })
  }

  /**
   * FTP'de klasör oluşturur (recursive)
   */
  private async ensureDirectoryExists(ftpClient: FtpClient, dirPath: string): Promise<void> {
    const mkdir = promisify(ftpClient.mkdir.bind(ftpClient))
    const list = promisify(ftpClient.list.bind(ftpClient))
    
    const parts = dirPath.split('/').filter(part => part.length > 0)
    let currentPath = ''
    
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      
      try {
        await list(currentPath)
      } catch (error) {
        // Klasör yoksa oluştur
        try {
          await mkdir(currentPath)
        } catch (mkdirError) {
          // Klasör zaten varsa devam et
          if (!mkdirError?.message?.includes('exists')) {
            throw mkdirError
          }
        }
      }
    }
  }

  /**
   * Ürünün tüm görsellerini işler ve FTP'ye yükler
   */
  async processProductImages(
    productId: string,
    imageUrls: string[],
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<FtpImage[]> {
    const results: FtpImage[] = []
    
    for (const [index, imageUrl] of imageUrls.entries()) {
      try {
        // Görseli işle
        const { buffer, filename, size } = await this.processImage(imageUrl, options)
        
        // FTP'ye yükle
        const { ftpUrl, webpUrl } = await this.uploadToFtp(buffer, filename, productId)
        
        // Sonuç objesi oluştur
        const ftpImage: FtpImage = {
          id: '', // Veritabanına kaydedilirken set edilecek
          product_id: productId,
          original_url: imageUrl,
          ftp_url: ftpUrl,
          webp_url: webpUrl,
          file_name: filename,
          file_size: size,
          upload_status: 'SUCCESS',
          upload_error: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        results.push(ftpImage)
        
        // Rate limiting için kısa bekleme
        if (index < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (error) {
        // Hata durumunda da kaydet
        const ftpImage: FtpImage = {
          id: '',
          product_id: productId,
          original_url: imageUrl,
          ftp_url: undefined,
          webp_url: undefined,
          file_name: undefined,
          file_size: undefined,
          upload_status: 'ERROR',
          upload_error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        results.push(ftpImage)
        console.error(`Görsel işleme hatası (${imageUrl}):`, error)
      }
    }
    
    return results
  }

  /**
   * FTP bağlantısını test eder
   */
  async testFtpConnection(): Promise<SyncResult> {
    return new Promise((resolve) => {
      const ftpClient = new FtpClient()
      let connectionTimeout: NodeJS.Timeout
      
      // Timeout ayarla
      connectionTimeout = setTimeout(() => {
        ftpClient.destroy()
        resolve({
          success: false,
          error: 'FTP bağlantı timeout'
        })
      }, 10000)
      
      ftpClient.on('ready', () => {
        clearTimeout(connectionTimeout)
        ftpClient.end()
        resolve({
          success: true,
          message: 'FTP bağlantısı başarılı'
        })
      })
      
      ftpClient.on('error', (error) => {
        clearTimeout(connectionTimeout)
        resolve({
          success: false,
          error: `FTP bağlantı hatası: ${error.message}`
        })
      })
      
      ftpClient.connect({
        host: this.ftpConfig.host,
        port: this.ftpConfig.port || 21,
        user: this.ftpConfig.user,
        password: this.ftpConfig.password,
        secure: this.ftpConfig.secure || false,
        secureOptions: {
          rejectUnauthorized: false
        }
      })
    })
  }

  /**
   * Batch görsel işleme
   */
  async processBatchImages(
    batches: Array<{
      productId: string
      imageUrls: string[]
    }>,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<Array<{ productId: string; images: FtpImage[] }>> {
    const results = []
    
    for (const batch of batches) {
      try {
        const images = await this.processProductImages(
          batch.productId,
          batch.imageUrls,
          options
        )
        
        results.push({
          productId: batch.productId,
          images
        })
        
        // Batch'ler arası bekleme
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Batch işleme hatası (${batch.productId}):`, error)
        
        // Hata durumunda boş sonuç ekle
        results.push({
          productId: batch.productId,
          images: []
        })
      }
    }
    
    return results
  }

  /**
   * FTP config'i günceller
   */
  updateFtpConfig(newConfig: FtpConfig): void {
    this.ftpConfig = newConfig
  }

  /**
   * İşleme seçeneklerini günceller
   */
  updateProcessingOptions(newOptions: Partial<ImageProcessingOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...newOptions }
  }
} 