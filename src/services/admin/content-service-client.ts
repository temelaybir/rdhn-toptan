import { createClient } from '@/lib/supabase/client'

// Banner interfaces - server versiyondan kopyalıyoruz
export interface Banner {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string
  color_theme: string | null
  size: 'small' | 'medium' | 'large'
  order_position: number
  is_active: boolean
  is_raw_image: boolean
  start_date: string | null
  end_date: string | null
  click_count: number
  created_at: string
  updated_at: string
}

// Announcement interfaces
export interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  start_date: string
  end_date: string | null
  is_active: boolean
  position: 'site_wide' | 'homepage' | 'category' | 'product'
  order_position: number
  created_at: string
  updated_at: string
}

// Site page interfaces
export interface SitePage {
  id: string
  title: string
  slug: string
  content: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  status: 'draft' | 'published' | 'archived'
  view_count: number
  show_in_footer: boolean
  show_in_header: boolean
  order_position: number
  created_at: string
  updated_at: string
}

// Banner CRUD operations (client-side)
export async function getBanners(): Promise<Banner[]> {
  console.log('🔍 getBanners() çağrıldı')
  
  try {
    const supabase = createClient()
    console.log('✅ Supabase client oluşturuldu')
    
    console.log('📡 Campaign banners sorgusu başlatılıyor...')
    const { data, error } = await supabase
      .from('campaign_banners')
      .select('*')
      .order('order_position')

    console.log('📊 Supabase sonucu:', { data, error, dataLength: data?.length })

    if (error) {
      console.error('❌ Banner getirme hatası:', error)
      console.error('❌ Hata detayları:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Fallback: boş array döndür
      console.warn('⚠️ Veritabanı hatası nedeniyle boş banner listesi döndürülüyor')
      return []
    }

    // Data'yı validate et - geçersiz URL'leri temizle
    const validatedData = (data || []).map((banner: any) => {
      // image_url kontrolü
      if (!banner.image_url || typeof banner.image_url !== 'string' || banner.image_url.trim() === '') {
        console.warn('⚠️ Geçersiz image_url düzeltildi:', banner.id, banner.image_url)
        banner.image_url = '/placeholder-product.svg'
      }
      
      // Temel alanları kontrol et
      if (!banner.id) {
        console.error('❌ Banner ID eksik:', banner)
        return null
      }
      
      if (!banner.title || typeof banner.title !== 'string') {
        console.warn('⚠️ Geçersiz title düzeltildi:', banner.id)
        banner.title = 'Başlık Yok'
      }
      
      return banner
    }).filter(Boolean) // null değerleri filtrele

    console.log('✅ Banners başarıyla getirildi ve validate edildi:', validatedData.length, 'adet')
    return validatedData
  } catch (error) {
    console.error('💥 getBanners() genel hatası:', error)
    console.error('💥 Hata stack:', error instanceof Error ? error.stack : 'Stack yok')
    
    // Fallback: boş array döndür
    console.warn('⚠️ Genel hata nedeniyle boş banner listesi döndürülüyor')
    return []
  }
}

export async function createBanner(banner: Omit<Banner, 'id' | 'created_at' | 'updated_at' | 'click_count'>): Promise<Banner> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('campaign_banners')
    .insert(banner)
    .select()
    .single()

  if (error) {
    console.error('Banner oluşturma hatası:', error)
    throw new Error(`Banner oluşturma hatası: ${error.message}`)
  }

  return data
}

export async function updateBanner(id: string, banner: Partial<Banner>): Promise<Banner> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('campaign_banners')
    .update(banner)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Banner güncelleme hatası:', error)
    throw new Error(`Banner güncelleme hatası: ${error.message}`)
  }

  return data
}

export async function deleteBanner(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('campaign_banners')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Banner silme hatası:', error)
    throw new Error(`Banner silme hatası: ${error.message}`)
  }
}

// Announcement CRUD operations (client-side)
export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('site_announcements')
    .select('*')
    .order('order_position')

  if (error) {
    console.error('Duyuru getirme hatası:', error)
    throw new Error(`Duyuru getirme hatası: ${error.message}`)
  }

  return data || []
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('site_announcements')
    .insert(announcement)
    .select()
    .single()

  if (error) {
    console.error('Duyuru oluşturma hatası:', error)
    throw new Error(`Duyuru oluşturma hatası: ${error.message}`)
  }

  return data
}

export async function updateAnnouncement(id: string, announcement: Partial<Announcement>): Promise<Announcement> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('site_announcements')
    .update(announcement)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Duyuru güncelleme hatası:', error)
    throw new Error(`Duyuru güncelleme hatası: ${error.message}`)
  }

  return data
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('site_announcements')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Duyuru silme hatası:', error)
    throw new Error(`Duyuru silme hatası: ${error.message}`)
  }
}

// Site page CRUD operations (client-side)
export async function getSitePages(): Promise<SitePage[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('site_pages')
    .select('*')
    .order('order_position')

  if (error) {
    console.error('Sayfa getirme hatası:', error)
    throw new Error(`Sayfa getirme hatası: ${error.message}`)
  }

  return data || []
}

export async function createSitePage(page: Omit<SitePage, 'id' | 'created_at' | 'updated_at' | 'view_count'>): Promise<SitePage> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('site_pages')
    .insert(page)
    .select()
    .single()

  if (error) {
    console.error('Sayfa oluşturma hatası:', error)
    throw new Error(`Sayfa oluşturma hatası: ${error.message}`)
  }

  return data
}

export async function updateSitePage(id: string, page: Partial<SitePage>): Promise<SitePage> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('site_pages')
    .update(page)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Sayfa güncelleme hatası:', error)
    throw new Error(`Sayfa güncelleme hatası: ${error.message}`)
  }

  return data
}

export async function deleteSitePage(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('site_pages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Sayfa silme hatası:', error)
    throw new Error(`Sayfa silme hatası: ${error.message}`)
  }
}

// Banner tıklama sayısını artır (client-side)
export async function incrementBannerClick(bannerId: string, bannerType: 'campaign' | 'hero' = 'campaign'): Promise<void> {
  const supabase = createClient()
  
  // RPC fonksiyon ile
  const { error: updateError } = await supabase.rpc('increment_banner_click', {
    banner_id: bannerId,
    banner_type: bannerType
  })

  if (updateError) {
    console.error('Banner tıklama sayısı güncelleme hatası:', updateError)
  }
} 