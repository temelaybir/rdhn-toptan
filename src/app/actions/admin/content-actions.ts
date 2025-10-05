'use server'

import { revalidatePath } from 'next/cache'
import { 
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getSitePages,
  createSitePage,
  updateSitePage,
  deleteSitePage,
  incrementBannerClick,
  type Banner,
  type Announcement,
  type SitePage
} from '@/services/admin/content-service'

// Banner actions
export async function getBannersAction() {
  try {
    return await getBanners()
  } catch (error) {
    console.error('Banner getirme action hatası:', error)
    throw error
  }
}

export async function createBannerAction(data: FormData) {
  try {
    const banner = {
      title: data.get('title') as string,
      subtitle: data.get('subtitle') as string || null,
      image_url: data.get('image_url') as string,
      link_url: data.get('link_url') as string,
      color_theme: data.get('color_theme') as string || null,
      size: data.get('size') as 'small' | 'medium' | 'large',
      order_position: parseInt(data.get('order_position') as string || '0'),
      is_active: data.get('is_active') === 'true',
      start_date: data.get('start_date') as string || null,
      end_date: data.get('end_date') as string || null,
    }

    const result = await createBanner(banner)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Banner oluşturma action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function updateBannerAction(id: string, data: FormData) {
  try {
    const banner = {
      title: data.get('title') as string,
      subtitle: data.get('subtitle') as string || null,
      image_url: data.get('image_url') as string,
      link_url: data.get('link_url') as string,
      color_theme: data.get('color_theme') as string || null,
      size: data.get('size') as 'small' | 'medium' | 'large',
      order_position: parseInt(data.get('order_position') as string || '0'),
      is_active: data.get('is_active') === 'true',
      start_date: data.get('start_date') as string || null,
      end_date: data.get('end_date') as string || null,
    }

    const result = await updateBanner(id, banner)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Banner güncelleme action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function deleteBannerAction(id: string) {
  try {
    await deleteBanner(id)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Banner silme action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function toggleBannerActiveAction(id: string, isActive: boolean) {
  try {
    await updateBanner(id, { is_active: isActive })
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Banner aktif/pasif action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

// Announcement actions
export async function getAnnouncementsAction() {
  try {
    return await getAnnouncements()
  } catch (error) {
    console.error('Duyuru getirme action hatası:', error)
    throw error
  }
}

export async function createAnnouncementAction(data: FormData) {
  try {
    const announcement = {
      title: data.get('title') as string,
      content: data.get('content') as string,
      type: data.get('type') as 'info' | 'warning' | 'success' | 'error',
      start_date: data.get('start_date') as string || new Date().toISOString(),
      end_date: data.get('end_date') as string || null,
      is_active: data.get('is_active') === 'true',
      position: data.get('position') as 'site_wide' | 'homepage' | 'category' | 'product',
      order_position: parseInt(data.get('order_position') as string || '0'),
    }

    const result = await createAnnouncement(announcement)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Duyuru oluşturma action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function updateAnnouncementAction(id: string, data: FormData) {
  try {
    const announcement = {
      title: data.get('title') as string,
      content: data.get('content') as string,
      type: data.get('type') as 'info' | 'warning' | 'success' | 'error',
      start_date: data.get('start_date') as string || new Date().toISOString(),
      end_date: data.get('end_date') as string || null,
      is_active: data.get('is_active') === 'true',
      position: data.get('position') as 'site_wide' | 'homepage' | 'category' | 'product',
      order_position: parseInt(data.get('order_position') as string || '0'),
    }

    const result = await updateAnnouncement(id, announcement)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Duyuru güncelleme action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    await deleteAnnouncement(id)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Duyuru silme action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function toggleAnnouncementActiveAction(id: string, isActive: boolean) {
  try {
    await updateAnnouncement(id, { is_active: isActive })
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Duyuru aktif/pasif action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

// Site page actions
export async function getSitePagesAction() {
  try {
    return await getSitePages()
  } catch (error) {
    console.error('Sayfa getirme action hatası:', error)
    throw error
  }
}

export async function createSitePageAction(data: FormData) {
  try {
    const page = {
      title: data.get('title') as string,
      slug: data.get('slug') as string,
      content: data.get('content') as string || null,
      meta_title: data.get('meta_title') as string || null,
      meta_description: data.get('meta_description') as string || null,
      meta_keywords: data.get('meta_keywords') as string || null,
      status: data.get('status') as 'draft' | 'published' | 'archived',
      show_in_footer: data.get('show_in_footer') === 'true',
      show_in_header: data.get('show_in_header') === 'true',
      order_position: parseInt(data.get('order_position') as string || '0'),
    }

    const result = await createSitePage(page)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Sayfa oluşturma action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function updateSitePageAction(id: string, data: FormData) {
  try {
    const page = {
      title: data.get('title') as string,
      slug: data.get('slug') as string,
      content: data.get('content') as string || null,
      meta_title: data.get('meta_title') as string || null,
      meta_description: data.get('meta_description') as string || null,
      meta_keywords: data.get('meta_keywords') as string || null,
      status: data.get('status') as 'draft' | 'published' | 'archived',
      show_in_footer: data.get('show_in_footer') === 'true',
      show_in_header: data.get('show_in_header') === 'true',
      order_position: parseInt(data.get('order_position') as string || '0'),
    }

    const result = await updateSitePage(id, page)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Sayfa güncelleme action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

export async function deleteSitePageAction(id: string) {
  try {
    await deleteSitePage(id)
    revalidatePath('/admin/icerik')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Sayfa silme action hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
}

// Banner click tracking
export async function trackBannerClickAction(bannerId: string, bannerType: 'campaign' | 'hero' = 'campaign') {
  try {
    await incrementBannerClick(bannerId, bannerType)
    return { success: true }
  } catch (error) {
    console.error('Banner tıklama tracking hatası:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  }
} 