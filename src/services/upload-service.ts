import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

export interface UploadResult {
  url: string
  path: string
  size: number
  type: string
}

export class UploadService {
  private async getSupabase() {
    return await createAdminSupabaseClient()
  }
  private bucketName = 'products'

  async uploadProductImage(file: File, productId?: number): Promise<UploadResult> {
    // Dosya doğrulama
    if (!file.type.startsWith('image/')) {
      throw new Error('Sadece görsel dosyaları yüklenebilir')
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz')
    }

    // Dosya adı oluştur
    const fileName = `${productId || 'temp'}_${Date.now()}_${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`
    const filePath = `images/${fileName}`

    try {
      const supabase = await this.getSupabase()
      // Dosyayı Supabase Storage'a yükle
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Dosya yükleme hatası: ${error.message}`)
      }

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path)

      return {
        url: publicUrl,
        path: data.path,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error instanceof Error ? error : new Error('Görsel yükleme sırasında hata oluştu')
    }
  }

  async deleteProductImage(path: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path])

      if (error) {
        throw new Error(`Dosya silme hatası: ${error.message}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      throw error instanceof Error ? error : new Error('Görsel silme sırasında hata oluştu')
    }
  }

  async uploadMultipleImages(files: File[], productId?: number): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadProductImage(file, productId))
    return Promise.all(uploadPromises)
  }
}

export const uploadService = new UploadService() 