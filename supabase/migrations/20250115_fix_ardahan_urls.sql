-- Migration: ardahanticaret.net URL'lerini ardahanticaret.com olarak güncelle
-- Created: 2025-01-15

-- 1. Products tablosundaki images JSON'ında URL'leri güncelle
UPDATE products 
SET images = (
  SELECT jsonb_agg(
    CASE 
      WHEN jsonb_typeof(img) = 'object' AND img ? 'url' THEN
        jsonb_set(
          img,
          '{url}',
          to_jsonb(replace(img->>'url', 'ardahanticaret.net', 'ardahanticaret.com'))
        )
      ELSE img
    END
  )
  FROM jsonb_array_elements(images) as img
)
WHERE images::text ILIKE '%ardahanticaret.net%';

-- 2. Categories tablosundaki image_url'leri güncelle
UPDATE categories 
SET image_url = replace(image_url, 'ardahanticaret.net', 'ardahanticaret.com')
WHERE image_url ILIKE '%ardahanticaret.net%';

-- 3. Homepage hero slides tablosundaki image URL'lerini güncelle (eğer tablo varsa)
UPDATE homepage_hero_slides 
SET 
  image_url = replace(image_url, 'ardahanticaret.net', 'ardahanticaret.com'),
  mobile_image_url = replace(mobile_image_url, 'ardahanticaret.net', 'ardahanticaret.com')
WHERE image_url ILIKE '%ardahanticaret.net%' 
   OR mobile_image_url ILIKE '%ardahanticaret.net%';

-- 4. Homepage campaign banners tablosundaki image URL'lerini güncelle (eğer tablo varsa)
UPDATE homepage_campaign_banners 
SET image_url = replace(image_url, 'ardahanticaret.net', 'ardahanticaret.com')
WHERE image_url ILIKE '%ardahanticaret.net%';

-- Güncelleme sonuçlarını kontrol et
SELECT 
  'products' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN images::text ILIKE '%ardahanticaret.com%' THEN 1 END) as com_urls,
  COUNT(CASE WHEN images::text ILIKE '%ardahanticaret.net%' THEN 1 END) as net_urls_remaining
FROM products
UNION ALL
SELECT 
  'categories' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN image_url ILIKE '%ardahanticaret.com%' THEN 1 END) as com_urls,
  COUNT(CASE WHEN image_url ILIKE '%ardahanticaret.net%' THEN 1 END) as net_urls_remaining
FROM categories; 