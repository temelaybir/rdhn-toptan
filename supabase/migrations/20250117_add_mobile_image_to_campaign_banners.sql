-- Migration: Campaign banners tablosuna mobile_image_url alanı ekleme
-- Created: 2025-01-17

-- Campaign banners tablosuna mobile_image_url kolonu ekle
ALTER TABLE campaign_banners 
ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;

-- Mevcut bannerlar için mobile_image_url'yi image_url ile aynı yap (başlangıç için)
UPDATE campaign_banners 
SET mobile_image_url = image_url 
WHERE mobile_image_url IS NULL;

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_campaign_banners_mobile_image 
ON campaign_banners(mobile_image_url) 
WHERE mobile_image_url IS NOT NULL;

-- Güncelleme sonucunu kontrol et
SELECT 
  'campaign_banners' as table_name,
  COUNT(*) as total_records,
  COUNT(mobile_image_url) as mobile_images_set
FROM campaign_banners; 