import { createClient } from '@/lib/supabase/server'

// Banner interfaces
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

// Banner CRUD operations
export async function getBanners(): Promise<Banner[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('campaign_banners')
    .select('*')
    .order('order_position')

  if (error) {
    console.error('Banner getirme hatası:', error)
    throw new Error(`Banner getirme hatası: ${error.message}`)
  }

  return data || []
}

export async function createBanner(banner: Omit<Banner, 'id' | 'created_at' | 'updated_at' | 'click_count'>): Promise<Banner> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('campaign_banners')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Banner silme hatası:', error)
    throw new Error(`Banner silme hatası: ${error.message}`)
  }
}

// Announcement CRUD operations
export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('site_announcements')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Duyuru silme hatası:', error)
    throw new Error(`Duyuru silme hatası: ${error.message}`)
  }
}

// Site page CRUD operations
export async function getSitePages(): Promise<SitePage[]> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('site_pages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Sayfa silme hatası:', error)
    throw new Error(`Sayfa silme hatası: ${error.message}`)
  }
}

// Banner tıklama sayısını artır
export async function incrementBannerClick(bannerId: string, bannerType: 'campaign' | 'hero' = 'campaign'): Promise<void> {
  const supabase = await createClient()
  
  // Banner tablosundaki click_count'u artır - RPC fonksiyon ile
  const { error: updateError } = await supabase.rpc('increment_banner_click', {
    banner_id: bannerId,
    banner_type: bannerType
  })

  if (updateError) {
    console.error('Banner tıklama sayısı güncelleme hatası:', updateError)
  }

  // İstatistik tablosuna da ekle
  const currentDate = new Date().toISOString().split('T')[0]
  
  // Önce mevcut stats kaydını bul
  const { data: existingStats } = await supabase
    .from('banner_stats')
    .select('*')
    .eq('banner_id', bannerId)
    .eq('date_tracked', currentDate)
    .single()

  if (existingStats) {
    // Mevcut kaydı güncelle
    const { error: statError } = await supabase
      .from('banner_stats')
      .update({ 
        clicks: existingStats.clicks + 1,
        impressions: existingStats.impressions || 0
      })
      .eq('banner_id', bannerId)
      .eq('date_tracked', currentDate)

    if (statError) {
      console.error('Banner istatistik güncelleme hatası:', statError)
    }
  } else {
    // Yeni kayıt oluştur
    const { error: statError } = await supabase
      .from('banner_stats')
      .insert({
        banner_id: bannerId,
        banner_type: bannerType,
        clicks: 1,
        impressions: 0,
        date_tracked: currentDate
      })

    if (statError) {
      console.error('Banner istatistik oluşturma hatası:', statError)
    }
  }
} 