import { createClient } from '@/lib/supabase/server'

// Tema türleri
export type ColorTheme = 'light' | 'dark' | 'ocean' | 'forest'
export type DesignStyle = 'default' | 'minimal' | 'modern' | 'playful' | 'brutal'
export type FontStyle = 'modern-sans' | 'elegant-serif' | 'playful-mix' | 'professional' | 'tech-modern' | 'warm-reading' | 'bold-statement' | 'retro-vibes'
export type ProductCardStyle = 'default' | 'minimal' | 'detailed' | 'compact'
export type SocialWidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
export type SocialWidgetStyle = 'floating' | 'minimal' | 'compact'

// Tema ayarları interface'i
export interface ThemeSettings {
  theme_color_scheme: ColorTheme
  theme_design_style: DesignStyle
  theme_font_style: FontStyle
  theme_product_card_style: ProductCardStyle
}

export interface SiteSettings {
  id: string
  site_name: string
  site_description: string
  site_slogan: string | null
  site_logo_url: string
  site_logo_dark_url: string | null
  logo_display_mode: 'logo_only' | 'logo_with_text'
  logo_size: 'small' | 'medium' | 'large'
  favicon_url: string
  social_image_url: string
  meta_keywords: string
  meta_author: string
  meta_robots: string
  contact_email: string | null
  contact_phone: string | null
  whatsapp_number: string | null
  address: string | null
  facebook_url: string | null
  instagram_url: string | null
  whatsapp_url: string | null
  twitter_url: string | null
  youtube_url: string | null
  linkedin_url: string | null
  currency_code: string
  currency_symbol: string
  tax_rate: number
  free_shipping_threshold: number
  google_analytics_id: string | null
  google_tag_manager_id: string | null
  facebook_pixel_id: string | null
  // Sosyal medya widget ayarları
  show_social_widget: boolean
  social_widget_position: SocialWidgetPosition
  social_widget_style: SocialWidgetStyle
  // Tema ayarları
  theme_color_scheme: ColorTheme
  theme_design_style: DesignStyle
  theme_font_style: FontStyle
  theme_product_card_style: ProductCardStyle
  is_active: boolean
}

// Fallback site ayarları
const defaultSettings: Partial<SiteSettings> = {
  site_name: 'catkapinda',
  site_description: 'Ardahan Ticaret - Kaliteli ürünler, uygun fiyatlar',
  site_slogan: 'Kaçırılmayacak fırsatlar, en uygun fiyatlarla',
  site_logo_url: '/logo.svg',
  favicon_url: '/favicon.ico',
  social_image_url: '/social-preview.jpg',
  meta_keywords: 'e-ticaret, alışveriş, ürün, satış',
  meta_author: 'RDHN Commerce',
  meta_robots: 'index, follow',
  currency_code: 'TRY',
  currency_symbol: '₺',
  tax_rate: 18.00,
  free_shipping_threshold: 150.00,
  // Sosyal medya widget varsayılanları
  show_social_widget: true,
  social_widget_position: 'bottom-right' as SocialWidgetPosition,
  social_widget_style: 'floating' as SocialWidgetStyle,
  // Varsayılan tema ayarları
  theme_color_scheme: 'light' as ColorTheme,
  theme_design_style: 'default' as DesignStyle,
  theme_font_style: 'modern-sans' as FontStyle,
  theme_product_card_style: 'default' as ProductCardStyle
}

// Site ayarlarını getir
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Site ayarları getirilemedi:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return { ...defaultSettings, id: '', is_active: true } as SiteSettings
    }

    return data as SiteSettings
  } catch (error) {
    console.error('Site ayarları servis hatası:', error instanceof Error ? error.message : String(error))
    return { ...defaultSettings, id: '', is_active: true } as SiteSettings
  }
}

// Sadece tema ayarlarını getir (performans için)
export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('theme_color_scheme, theme_design_style, theme_font_style, theme_product_card_style')
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Tema ayarları getirilemedi:', error)
      return {
        theme_color_scheme: defaultSettings.theme_color_scheme!,
        theme_design_style: defaultSettings.theme_design_style!,
        theme_font_style: defaultSettings.theme_font_style!,
        theme_product_card_style: defaultSettings.theme_product_card_style!
      }
    }

    return data as ThemeSettings
  } catch (error) {
    console.error('Tema ayarları servis hatası:', error instanceof Error ? error.message : String(error))
    return {
      theme_color_scheme: defaultSettings.theme_color_scheme!,
      theme_design_style: defaultSettings.theme_design_style!,
      theme_font_style: defaultSettings.theme_font_style!,
      theme_product_card_style: defaultSettings.theme_product_card_style!
    }
  }
}

// Tema ayarlarını güncelle
export async function updateThemeSettings(themeSettings: Partial<ThemeSettings>): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('site_settings')
      .update({
        ...themeSettings,
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true)

    if (error) {
      console.error('Tema ayarları güncellenemedi:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Tema ayarları güncelleme hatası:', error instanceof Error ? error.message : String(error))
    return false
  }
}

// Belirli ayarları getir
export async function getSiteSetting<K extends keyof SiteSettings>(
  key: K
): Promise<SiteSettings[K] | null> {
  try {
    const settings = await getSiteSettings()
    return settings[key] || null
  } catch (error) {
    console.error(`${key} ayarı getirilemedi:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

// Meta tag'ler için optimized fonksiyon
export async function getSiteMetadata() {
  try {
    const settings = await getSiteSettings()
    
    return {
      title: settings.site_name,
      description: settings.site_description,
      keywords: settings.meta_keywords,
      author: settings.meta_author,
      robots: settings.meta_robots,
      socialImage: settings.social_image_url,
      favicon: settings.favicon_url
    }
  } catch (error) {
    console.error('Site metadata getirilemedi:', error instanceof Error ? error.message : String(error))
    return {
      title: defaultSettings.site_name,
      description: defaultSettings.site_description,
      keywords: defaultSettings.meta_keywords,
      author: defaultSettings.meta_author,
      robots: defaultSettings.meta_robots,
      socialImage: defaultSettings.social_image_url,
      favicon: defaultSettings.favicon_url
    }
  }
}

// Logo URL'lerini getir
export async function getSiteLogos() {
  try {
    const settings = await getSiteSettings()
    
    return {
      logo: settings.site_logo_url,
      darkLogo: settings.site_logo_dark_url,
      favicon: settings.favicon_url
    }
  } catch (error) {
    console.error('Logo ayarları getirilemedi:', error instanceof Error ? error.message : String(error))
    return {
      logo: defaultSettings.site_logo_url,
      darkLogo: null,
      favicon: defaultSettings.favicon_url
    }
  }
} 