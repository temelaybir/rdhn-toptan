-- ============================================================================
-- Site Ayarları ve Tema Sistemi Migration
-- Tarih: 2025-01-21
-- Açıklama: Site ayarları ve global tema sistemi için veritabanı yapısı
-- ============================================================================

-- Site Ayarları Tablosu
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Site Temel Bilgileri
    site_name TEXT NOT NULL DEFAULT 'RDHN Commerce',
    site_description TEXT DEFAULT 'Ardahan Ticaret - Kaliteli ürünler, uygun fiyatlar',
    site_slogan TEXT DEFAULT 'Kaçırılmayacak fırsatlar, en uygun fiyatlarla',
    
    -- Logo & Favicon
    site_logo_url TEXT DEFAULT '/logo.svg',
    site_logo_dark_url TEXT,
    logo_display_mode TEXT DEFAULT 'logo_only' CHECK (logo_display_mode IN ('logo_only', 'logo_with_text')),
    logo_size TEXT DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
    favicon_url TEXT DEFAULT '/favicon.ico',
    social_image_url TEXT DEFAULT '/social-preview.jpg',
    
    -- SEO Meta Bilgileri
    meta_keywords TEXT DEFAULT 'e-ticaret, alışveriş, ürün, satış',
    meta_author TEXT DEFAULT 'RDHN Commerce',
    meta_robots TEXT DEFAULT 'index, follow',
    
    -- İletişim Bilgileri
    contact_email TEXT,
    contact_phone TEXT,
    whatsapp_number TEXT,
    address TEXT,
    
    -- Sosyal Medya Bağlantıları
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    linkedin_url TEXT,
    
    -- Para Birimi & Ticaret Ayarları
    currency_code TEXT DEFAULT 'TRY',
    currency_symbol TEXT DEFAULT '₺',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    free_shipping_threshold DECIMAL(10,2) DEFAULT 150.00,
    
    -- Analytics & Tracking
    google_analytics_id TEXT,
    google_tag_manager_id TEXT,
    facebook_pixel_id TEXT,
    
    -- TEMA SİSTEMİ - Global tema ayarları
    theme_color_scheme TEXT DEFAULT 'light' CHECK (theme_color_scheme IN ('light', 'dark', 'ocean', 'forest')),
    theme_design_style TEXT DEFAULT 'default' CHECK (theme_design_style IN ('default', 'minimal', 'modern', 'playful', 'brutal')),
    theme_font_style TEXT DEFAULT 'modern-sans' CHECK (theme_font_style IN ('modern-sans', 'elegant-serif', 'playful-mix', 'professional', 'tech-modern', 'warm-reading', 'bold-statement', 'retro-vibes')),
    theme_product_card_style TEXT DEFAULT 'default' CHECK (theme_product_card_style IN ('default', 'minimal', 'detailed', 'compact')),
    
    -- Sistem
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Varsayılan site ayarlarını ekle
INSERT INTO public.site_settings (
    site_name,
    site_description,
    site_slogan,
    site_logo_url,
    favicon_url,
    social_image_url,
    meta_keywords,
    meta_author,
    meta_robots,
    currency_code,
    currency_symbol,
    tax_rate,
    free_shipping_threshold,
    theme_color_scheme,
    theme_design_style,
    theme_font_style,
    theme_product_card_style,
    is_active
) VALUES (
    'RDHN Commerce',
    'Ardahan Ticaret - Kaliteli ürünler, uygun fiyatlar',
    'Kaçırılmayacak fırsatlar, en uygun fiyatlarla',
    '/logo.svg',
    '/favicon.ico',
    '/social-preview.jpg',
    'e-ticaret, alışveriş, ürün, satış',
    'RDHN Commerce',
    'index, follow',
    'TRY',
    '₺',
    18.00,
    150.00,
    'light',
    'default',
    'modern-sans',
    'default',
    true
) ON CONFLICT (id) DO NOTHING;

-- Updated at trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
CREATE TRIGGER update_site_settings_updated_at_trigger
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_site_settings_updated_at();

-- RLS Policies
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Herkes site ayarlarını okuyabilir
CREATE POLICY "Public can read site_settings" ON public.site_settings
    FOR SELECT USING (true);

-- Sadece authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Authenticated can update site_settings" ON public.site_settings
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Index'ler
CREATE INDEX idx_site_settings_active ON public.site_settings(is_active);
CREATE INDEX idx_site_settings_theme ON public.site_settings(theme_color_scheme, theme_design_style, theme_font_style); 