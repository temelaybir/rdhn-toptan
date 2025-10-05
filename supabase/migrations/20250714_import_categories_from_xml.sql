-- Migration: Import Categories from XML Data
-- This migration imports the category data from kategoriler_guncel2.xml
-- Date: 2025-07-14

-- First, let's ensure we have the categories table structure
-- (This should already exist from previous migrations)

-- Clear existing categories if needed (uncomment if you want to start fresh)
-- DELETE FROM categories;

-- Insert main categories (parent_id = 0)
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
-- Main categories from XML
(uuid_generate_v4(), 'Spor', 'spor', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyuncak', 'oyuncak', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Ateşleyici & Çakmak', 'atesleyici-cakmak', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Drone', 'drone', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Diğer Ürünler', 'diger-urunler', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyuncak Uçak & Helikopter', 'oyuncak-ucak-helikopter', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Spor & Outdoor', 'spor-outdoor', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Kişiye Özel Ürünler', 'kisiye-ozel-urunler', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Yaşam', 'yasam', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Anne & Bebek & Çocuk', 'anne-bebek-cocuk', NULL, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Create temporary variables for parent category IDs
-- We'll use these to reference parent categories for subcategories

-- Insert organized subcategories
-- 1. Spor & Outdoor categories
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Ekipman & Aksesuar', 'ekipman-aksesuar', (SELECT id FROM categories WHERE slug = 'spor-outdoor'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kamp', 'kamp', (SELECT id FROM categories WHERE slug = 'spor-outdoor'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kamp Çakmakları', 'kamp-cakmaklar', (SELECT id FROM categories WHERE slug = 'kamp'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. Oyuncak categories
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Oyuncak Bebek ve Aksesuarları', 'oyuncak-bebek-aksesuar', (SELECT id FROM categories WHERE slug = 'oyuncak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyuncak Arabalar', 'oyuncak-arabalar', (SELECT id FROM categories WHERE slug = 'oyuncak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Diğer Oyuncaklar', 'diger-oyuncaklar', (SELECT id FROM categories WHERE slug = 'oyuncak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kaykay', 'kaykay', (SELECT id FROM categories WHERE slug = 'oyuncak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Çocuk Scooteri', 'cocuk-scooteri', (SELECT id FROM categories WHERE slug = 'diger-oyuncaklar'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 3. Çakmak categories (organized under Ateşleyici & Çakmak)
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Şarjlı Çakmak', 'sarjli-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Taşlı Çakmak', 'tasli-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Turbo Çakmak', 'turbo-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Manyetolu Çakmak', 'manyetolu-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Benzinli Çakmak', 'benzinli-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Plastik Çakmak', 'plastik-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Clipper Çakmak', 'clipper-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Ocak Çakmağı', 'ocak-cakmagi', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Klasik Çakmak', 'klasik-cakmak', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Pipo Çakmağı', 'pipo-cakmagi', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Puro Çakmağı', 'puro-cakmagi', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Çakmak Gazı', 'cakmak-gazi', (SELECT id FROM categories WHERE slug = 'atesleyici-cakmak'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 4. Yaşam categories
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Hobi & Eğlence', 'hobi-eglence', (SELECT id FROM categories WHERE slug = 'yasam'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Tütün & Tütün Aksesuarları', 'tutun-aksesuar', (SELECT id FROM categories WHERE slug = 'hobi-eglence'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Çakmaklar', 'cakmaklar', (SELECT id FROM categories WHERE slug = 'tutun-aksesuar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Uzaktan Kumandalı Araçlar', 'uzaktan-kumandali-araclar', (SELECT id FROM categories WHERE slug = 'hobi-eglence'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kumandalı Araçlar', 'kumandali-araclar', (SELECT id FROM categories WHERE slug = 'uzaktan-kumandali-araclar'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 5. Anne & Bebek & Çocuk categories
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Çocuk Oyuncakları', 'cocuk-oyuncaklar', (SELECT id FROM categories WHERE slug = 'anne-bebek-cocuk'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyuncak Araçlar', 'oyuncak-araclar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Çocuk Oyuncak Arabalar', 'cocuk-oyuncak-arabalar', (SELECT id FROM categories WHERE slug = 'oyuncak-araclar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kumandalı Oyuncaklar', 'kumandali-oyuncaklar', (SELECT id FROM categories WHERE slug = 'oyuncak-araclar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Diğer Çocuk Oyuncakları', 'diger-cocuk-oyuncaklar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyun Setleri', 'oyun-setleri', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Evcilik ve Mutfak Setleri', 'evcilik-mutfak-setleri', (SELECT id FROM categories WHERE slug = 'oyun-setleri'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyuncak Bebek ve Aksesuarları', 'cocuk-oyuncak-bebek-aksesuar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Bahçe & Dış Mekan Oyuncakları', 'bahce-dis-mekan-oyuncaklar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Top Havuzu ve Toplar', 'top-havuzu-toplar', (SELECT id FROM categories WHERE slug = 'bahce-dis-mekan-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Figür Oyuncaklar', 'figur-oyuncaklar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Hayvan Figür Oyuncaklar', 'hayvan-figur-oyuncaklar', (SELECT id FROM categories WHERE slug = 'figur-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Eğitici Oyuncaklar', 'egitici-oyuncaklar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Lego & Yapı Oyuncakları', 'lego-yapi-oyuncaklar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Oyun Setler', 'oyun-setler', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Bebek & Okul Öncesi Oyuncaklar', 'bebek-okul-oncesi-oyuncaklar', (SELECT id FROM categories WHERE slug = 'cocuk-oyuncaklar'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kukla', 'kukla', (SELECT id FROM categories WHERE slug = 'bebek-okul-oncesi-oyuncaklar'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 6. Spor & Outdoor (different from first one) - Electronic/Optical products
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Elektronik - Optik Ürünler', 'elektronik-optik-urunler', (SELECT id FROM categories WHERE slug = 'kamp'), true, NOW(), NOW()),
(uuid_generate_v4(), 'El Feneri', 'el-feneri', (SELECT id FROM categories WHERE slug = 'elektronik-optik-urunler'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Lazer & Lazer Aksesuarları', 'lazer-aksesuar', (SELECT id FROM categories WHERE slug = 'elektronik-optik-urunler'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Add some additional organized categories for better e-commerce structure
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
-- Electronics (new main category)
(uuid_generate_v4(), 'Elektronik', 'elektronik', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Telefon & Aksesuar', 'telefon-aksesuar', (SELECT id FROM categories WHERE slug = 'elektronik'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Bilgisayar', 'bilgisayar', (SELECT id FROM categories WHERE slug = 'elektronik'), true, NOW(), NOW()),
(uuid_generate_v4(), 'TV & Ses Sistemi', 'tv-ses-sistemi', (SELECT id FROM categories WHERE slug = 'elektronik'), true, NOW(), NOW()),
-- Fashion (new main category)
(uuid_generate_v4(), 'Moda & Giyim', 'moda-giyim', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Kadın Giyim', 'kadin-giyim', (SELECT id FROM categories WHERE slug = 'moda-giyim'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Erkek Giyim', 'erkek-giyim', (SELECT id FROM categories WHERE slug = 'moda-giyim'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Ayakkabı', 'ayakkabi', (SELECT id FROM categories WHERE slug = 'moda-giyim'), true, NOW(), NOW()),
-- Home & Living (new main category)
(uuid_generate_v4(), 'Ev & Yaşam', 'ev-yasam', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Mobilya', 'mobilya', (SELECT id FROM categories WHERE slug = 'ev-yasam'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Ev Aletleri', 'ev-aletleri', (SELECT id FROM categories WHERE slug = 'ev-yasam'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Dekorasyon', 'dekorasyon', (SELECT id FROM categories WHERE slug = 'ev-yasam'), true, NOW(), NOW()),
-- Books (new main category)
(uuid_generate_v4(), 'Kitap & Kırtasiye', 'kitap-kirtasiye', NULL, true, NOW(), NOW()),
(uuid_generate_v4(), 'Roman', 'roman', (SELECT id FROM categories WHERE slug = 'kitap-kirtasiye'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Akademik Kitap', 'akademik-kitap', (SELECT id FROM categories WHERE slug = 'kitap-kirtasiye'), true, NOW(), NOW()),
(uuid_generate_v4(), 'Kırtasiye', 'kirtasiye', (SELECT id FROM categories WHERE slug = 'kitap-kirtasiye'), true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Update category metadata and SEO info
UPDATE categories SET 
    description = CASE 
        WHEN slug = 'spor' THEN 'Spor malzemeleri ve ekipmanları'
        WHEN slug = 'oyuncak' THEN 'Çocuklar için güvenli ve eğlenceli oyuncaklar'
        WHEN slug = 'atesleyici-cakmak' THEN 'Çeşitli çakmak türleri ve aksesuarları'
        WHEN slug = 'drone' THEN 'Drone ve uzaktan kumandalı hava araçları'
        WHEN slug = 'spor-outdoor' THEN 'Outdoor ve kamp malzemeleri'
        WHEN slug = 'anne-bebek-cocuk' THEN 'Anne, bebek ve çocuk ürünleri'
        WHEN slug = 'yasam' THEN 'Günlük yaşam ürünleri ve aksesuarları'
        WHEN slug = 'elektronik' THEN 'Elektronik cihazlar ve aksesuarları'
        WHEN slug = 'moda-giyim' THEN 'Moda ve giyim ürünleri'
        WHEN slug = 'ev-yasam' THEN 'Ev ve yaşam ürünleri'
        WHEN slug = 'kitap-kirtasiye' THEN 'Kitap ve kırtasiye malzemeleri'
        ELSE description
    END,
    meta_title = CASE 
        WHEN slug = 'spor' THEN 'Spor Malzemeleri | RDHN Commerce'
        WHEN slug = 'oyuncak' THEN 'Oyuncaklar | RDHN Commerce'
        WHEN slug = 'atesleyici-cakmak' THEN 'Çakmaklar | RDHN Commerce'
        WHEN slug = 'drone' THEN 'Drone ve RC Araçlar | RDHN Commerce'
        WHEN slug = 'elektronik' THEN 'Elektronik Ürünler | RDHN Commerce'
        WHEN slug = 'moda-giyim' THEN 'Moda ve Giyim | RDHN Commerce'
        WHEN slug = 'ev-yasam' THEN 'Ev ve Yaşam | RDHN Commerce'
        WHEN slug = 'kitap-kirtasiye' THEN 'Kitap ve Kırtasiye | RDHN Commerce'
        ELSE meta_title
    END,
    meta_description = CASE 
        WHEN slug = 'spor' THEN 'Spor malzemeleri, ekipmanları ve aksesuarlarında en uygun fiyatlar'
        WHEN slug = 'oyuncak' THEN 'Çocuklar için güvenli, eğlenceli ve eğitici oyuncaklar'
        WHEN slug = 'atesleyici-cakmak' THEN 'Kaliteli çakmak çeşitleri ve aksesuarları'
        WHEN slug = 'drone' THEN 'Drone ve uzaktan kumandalı araçlarda geniş seçenek'
        WHEN slug = 'elektronik' THEN 'Elektronik cihazlar ve aksesuarlarında en iyi fiyatlar'
        WHEN slug = 'moda-giyim' THEN 'Moda ve giyimde trend ürünler'
        WHEN slug = 'ev-yasam' THEN 'Ev ve yaşam ürünlerinde kalite ve uygun fiyat'
        WHEN slug = 'kitap-kirtasiye' THEN 'Kitap ve kırtasiye malzemelerinde geniş seçenek'
        ELSE meta_description
    END
WHERE slug IN ('spor', 'oyuncak', 'atesleyici-cakmak', 'drone', 'spor-outdoor', 'anne-bebek-cocuk', 'yasam', 'elektronik', 'moda-giyim', 'ev-yasam', 'kitap-kirtasiye');

-- Create category hierarchy view for easier querying
CREATE OR REPLACE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- Base case: main categories
    SELECT 
        id,
        name,
        slug,
        parent_id,
        is_active,
        0 as level,
        name as path
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: subcategories
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.parent_id,
        c.is_active,
        ct.level + 1,
        ct.path || ' > ' || c.name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree
ORDER BY path;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent_active ON categories(parent_id, is_active);

-- Insert sample data count for verification
INSERT INTO categories (id, name, slug, parent_id, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Test Kategori', 'test-kategori', NULL, false, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Final verification query (uncomment to run)
-- SELECT 
--     COUNT(*) as total_categories,
--     COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
--     COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories,
--     COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories
-- FROM categories;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Category migration completed successfully!';
    RAISE NOTICE 'Total categories imported from XML data with additional e-commerce categories';
END $$;