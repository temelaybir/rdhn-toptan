-- Header ayarları tablosu
CREATE TABLE IF NOT EXISTS header_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'RDHN Commerce',
  show_logo BOOLEAN DEFAULT true,
  show_search BOOLEAN DEFAULT true,
  search_placeholder TEXT DEFAULT 'Ürün ara...',
  show_categories BOOLEAN DEFAULT true,
  show_all_products_link BOOLEAN DEFAULT true,
  all_products_text TEXT DEFAULT 'Tüm Ürünler',
  show_wishlist BOOLEAN DEFAULT true,
  show_cart BOOLEAN DEFAULT true,
  show_user_account BOOLEAN DEFAULT true,
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Header menü öğeleri tablosu
CREATE TABLE IF NOT EXISTS header_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  is_dropdown BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES header_menu_items(id) ON DELETE CASCADE,
  icon_name TEXT, -- lucide icon adı
  is_external BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Footer ayarları tablosu
CREATE TABLE IF NOT EXISTS footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'RDHN Commerce',
  company_description TEXT DEFAULT 'Türkiye''nin en güvenilir online alışveriş platformu.',
  show_newsletter BOOLEAN DEFAULT true,
  newsletter_title TEXT DEFAULT 'Bültenimize Abone Olun',
  newsletter_description TEXT DEFAULT 'En yeni ürünler ve kampanyalardan ilk siz haberdar olun.',
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  show_social_media BOOLEAN DEFAULT true,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  linkedin_url TEXT,
  copyright_text TEXT DEFAULT '© 2025 RDHN Commerce. Tüm hakları saklıdır.',
  custom_css TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Footer link grupları tablosu
CREATE TABLE IF NOT EXISTS footer_link_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Footer linkler tablosu
CREATE TABLE IF NOT EXISTS footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES footer_link_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  is_external BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varsayılan header ayarlarını ekle
INSERT INTO header_settings (
  site_name, 
  search_placeholder, 
  all_products_text,
  is_active
) VALUES (
  'RDHN Commerce',
  'Ürün ara...',
  'Tüm Ürünler',
  true
) ON CONFLICT (id) DO NOTHING;

-- Varsayılan header menü öğelerini ekle
INSERT INTO header_menu_items (title, url, order_position, is_active) VALUES
('Ana Sayfa', '/', 0, true),
('Tüm Ürünler', '/urunler', 1, true),
('Kategoriler', '/kategoriler', 2, true),
('Kampanyalar', '/kampanyalar', 3, true),
('İletişim', '/iletisim', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Varsayılan footer ayarlarını ekle
INSERT INTO footer_settings (
  company_name,
  company_description,
  newsletter_title,
  newsletter_description,
  contact_phone,
  contact_email,
  contact_address,
  copyright_text,
  is_active
) VALUES (
  'RDHN Commerce',
  'Türkiye''nin en güvenilir online alışveriş platformu. Binlerce ürün, hızlı kargo ve müşteri memnuniyeti odaklı hizmet.',
  'Bültenimize Abone Olun',
  'En yeni ürünler ve kampanyalardan ilk siz haberdar olun.',
  '+90 (212) 123 45 67',
  'info@rdhncommerce.com',
  'İstanbul, Türkiye',
  '© 2025 RDHN Commerce. Tüm hakları saklıdır.',
  true
) ON CONFLICT (id) DO NOTHING;

-- Varsayılan footer link gruplarını ekle
INSERT INTO footer_link_groups (title, order_position, is_active) VALUES
('Şirket', 0, true),
('Destek', 1, true),
('Yasal', 2, true),
('Kategoriler', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Varsayılan footer linklerini ekle
WITH groups AS (
  SELECT id, title FROM footer_link_groups WHERE title IN ('Şirket', 'Destek', 'Yasal', 'Kategoriler')
)
INSERT INTO footer_links (group_id, title, url, order_position, is_active) 
SELECT 
  g.id,
  links.title,
  links.url,
  links.order_position,
  true
FROM groups g
CROSS JOIN (
  SELECT 'Hakkımızda' as title, '/hakkimizda' as url, 0 as order_position WHERE g.title = 'Şirket'
  UNION ALL SELECT 'İletişim', '/iletisim', 1 WHERE g.title = 'Şirket'
  UNION ALL SELECT 'Kariyer', '/kariyer', 2 WHERE g.title = 'Şirket'
  UNION ALL SELECT 'Basın', '/basin', 3 WHERE g.title = 'Şirket'
  UNION ALL SELECT 'Yardım Merkezi', '/yardim', 0 WHERE g.title = 'Destek'
  UNION ALL SELECT 'İade & Değişim', '/iade-degisim', 1 WHERE g.title = 'Destek'
  UNION ALL SELECT 'Kargo Takip', '/kargo-takip', 2 WHERE g.title = 'Destek'
  UNION ALL SELECT 'SSS', '/sss', 3 WHERE g.title = 'Destek'
  UNION ALL SELECT 'Gizlilik Politikası', '/gizlilik', 0 WHERE g.title = 'Yasal'
  UNION ALL SELECT 'Kullanım Şartları', '/kullanim-sartlari', 1 WHERE g.title = 'Yasal'
  UNION ALL SELECT 'Çerez Politikası', '/cerez-politikasi', 2 WHERE g.title = 'Yasal'
  UNION ALL SELECT 'KVKK', '/kvkk', 3 WHERE g.title = 'Yasal'
  UNION ALL SELECT 'Elektronik', '/kategoriler/elektronik', 0 WHERE g.title = 'Kategoriler'
  UNION ALL SELECT 'Giyim', '/kategoriler/giyim', 1 WHERE g.title = 'Kategoriler'
  UNION ALL SELECT 'Kitap', '/kategoriler/kitap', 2 WHERE g.title = 'Kategoriler'
  UNION ALL SELECT 'Ev & Yaşam', '/kategoriler/ev-yasam', 3 WHERE g.title = 'Kategoriler'
) links WHERE g.title = CASE 
  WHEN links.title IN ('Hakkımızda', 'İletişim', 'Kariyer', 'Basın') THEN 'Şirket'
  WHEN links.title IN ('Yardım Merkezi', 'İade & Değişim', 'Kargo Takip', 'SSS') THEN 'Destek'
  WHEN links.title IN ('Gizlilik Politikası', 'Kullanım Şartları', 'Çerez Politikası', 'KVKK') THEN 'Yasal'
  WHEN links.title IN ('Elektronik', 'Giyim', 'Kitap', 'Ev & Yaşam') THEN 'Kategoriler'
END
ON CONFLICT (id) DO NOTHING;

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_header_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_footer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları oluştur
CREATE TRIGGER update_header_settings_updated_at_trigger
  BEFORE UPDATE ON header_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_header_settings_updated_at();

CREATE TRIGGER update_footer_settings_updated_at_trigger
  BEFORE UPDATE ON footer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_footer_settings_updated_at();

-- RLS Policies
ALTER TABLE header_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE header_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_link_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Public can read header_settings" ON header_settings FOR SELECT USING (true);
CREATE POLICY "Public can read header_menu_items" ON header_menu_items FOR SELECT USING (true);
CREATE POLICY "Public can read footer_settings" ON footer_settings FOR SELECT USING (true);
CREATE POLICY "Public can read footer_link_groups" ON footer_link_groups FOR SELECT USING (true);
CREATE POLICY "Public can read footer_links" ON footer_links FOR SELECT USING (true);

-- Admin işlemleri (authenticated kullanıcılar)
CREATE POLICY "Authenticated can manage header_settings" ON header_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage header_menu_items" ON header_menu_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage footer_settings" ON footer_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage footer_link_groups" ON footer_link_groups FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage footer_links" ON footer_links FOR ALL USING (auth.role() = 'authenticated'); 