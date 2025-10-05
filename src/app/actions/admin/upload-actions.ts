'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

export interface UploadResult {
  url: string
  path: string
  size: number
  type: string
}

const BUCKET_NAME = 'products'

export async function uploadProductImage(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string | null

    // Dosya doğrulama
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'Dosya bulunamadı' }
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Sadece görsel dosyaları yüklenebilir' }
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return { success: false, error: 'Dosya boyutu 5MB\'dan büyük olamaz' }
    }

    // Dosya adı oluştur
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId || 'temp'}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `images/${fileName}`

    const supabase = await createAdminSupabaseClient()

    // Dosyayı Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { success: false, error: `Dosya yükleme hatası: ${error.message}` }
    }

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return {
      success: true,
      result: {
        url: publicUrl,
        path: data.path,
        size: file.size,
        type: file.type
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Görsel yükleme sırasında hata oluştu' 
    }
  }
}

export async function deleteProductImage(path: string) {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      return { success: false, error: `Dosya silme hatası: ${error.message}` }
    }

    return { success: true, message: 'Görsel başarıyla silindi' }
  } catch (error) {
    console.error('Delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Görsel silme sırasında hata oluştu' 
    }
  }
}

export async function uploadMultipleImages(formData: FormData) {
  try {
    const files = formData.getAll('files') as File[]
    const productId = formData.get('productId') as string | null

    if (!files || files.length === 0) {
      return { success: false, error: 'Dosya bulunamadı' }
    }

    const results: UploadResult[] = []
    const errors: string[] = []

    for (const file of files) {
      const singleFormData = new FormData()
      singleFormData.append('file', file)
      if (productId) {
        singleFormData.append('productId', productId)
      }

      const result = await uploadProductImage(singleFormData)
      
      if (result.success && result.result) {
        results.push(result.result)
      } else {
        errors.push(result.error || 'Bilinmeyen hata')
      }
    }

    if (errors.length > 0) {
      return { 
        success: false, 
        error: `Bazı dosyalar yüklenemedi: ${errors.join(', ')}`,
        results: results 
      }
    }

    return { success: true, results }
  } catch (error) {
    console.error('Multiple upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Görseller yüklenirken hata oluştu' 
    }
  }
}

// Site ayarları için logo/favicon yükleme fonksiyonu
export async function uploadSiteLogo(formData: FormData) {
  try {
    console.log('uploadSiteLogo server action başladı')
    
    const file = formData.get('file') as File
    const logoType = formData.get('logoType') as string // 'logo', 'logo-dark', 'favicon', 'social'

    console.log('FormData parse edildi:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size, 
      logoType 
    })

    // Dosya doğrulama
    if (!file || !(file instanceof File)) {
      console.error('Dosya bulunamadı')
      return { success: false, error: 'Dosya bulunamadı' }
    }

    if (!file.type.startsWith('image/')) {
      console.error('Geçersiz dosya tipi:', file.type)
      return { success: false, error: 'Sadece görsel dosyaları yüklenebilir' }
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      console.error('Dosya çok büyük:', file.size)
      return { success: false, error: 'Dosya boyutu 5MB\'dan büyük olamaz' }
    }

    // Favicon için boyut kontrolü
    if (logoType === 'favicon' && file.size > 1024 * 1024) { // 1MB for favicon
      console.error('Favicon çok büyük:', file.size)
      return { success: false, error: 'Favicon boyutu 1MB\'dan büyük olamaz' }
    }

    console.log('Dosya validasyonu geçti, Supabase client oluşturuluyor...')

    // Dosya adı oluştur
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2)
    const fileName = `${logoType}_${timestamp}_${randomId}.${fileExt}`
    const filePath = `site-assets/${fileName}`

    console.log('Dosya yolu oluşturuldu:', { fileName, filePath })

    const supabase = await createAdminSupabaseClient()

    console.log('Supabase storage upload başlatılıyor...')

    // Dosyayı Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('Storage upload sonucu:', { data, error })

    if (error) {
      console.error('Storage upload hatası:', error)
      return { success: false, error: `Dosya yükleme hatası: ${error.message}` }
    }

    console.log('Upload başarılı, public URL alınıyor...')

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    console.log('Public URL alındı:', publicUrl)

    const result = {
      url: publicUrl,
      path: data.path,
      size: file.size,
      type: file.type,
      logoType
    }

    console.log('Upload tamamlandı:', result)

    return {
      success: true,
      result
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Logo yükleme sırasında hata oluştu' 
    }
  }
}

// Site logo silme fonksiyonu
export async function deleteSiteLogo(path: string) {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      return { success: false, error: `Logo silme hatası: ${error.message}` }
    }

    return { success: true, message: 'Logo başarıyla silindi' }
  } catch (error) {
    console.error('Logo delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Logo silme sırasında hata oluştu' 
    }
  }
} 