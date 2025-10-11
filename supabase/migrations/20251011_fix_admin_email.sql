-- Fix admin email address in site settings
-- Değişen alan: order_notification_emails

-- Mevcut ayarları kontrol et
DO $$
DECLARE
  current_email TEXT;
BEGIN
  SELECT order_notification_emails INTO current_email 
  FROM site_settings 
  WHERE is_active = true 
  LIMIT 1;
  
  RAISE NOTICE 'Mevcut admin email: %', current_email;
END $$;

-- Admin email'i güncelle (geçerli bir email adresi ile)
-- NOT: Bu email'i kendi geçerli email adresinizle değiştirin
UPDATE site_settings
SET 
  order_notification_emails = 'halil@plante.biz', -- Geçerli email adresi
  updated_at = NOW()
WHERE is_active = true;

-- Sonucu göster
DO $$
DECLARE
  new_email TEXT;
BEGIN
  SELECT order_notification_emails INTO new_email 
  FROM site_settings 
  WHERE is_active = true 
  LIMIT 1;
  
  RAISE NOTICE '✅ Yeni admin email: %', new_email;
END $$;

-- Comment ekle
COMMENT ON COLUMN site_settings.order_notification_emails IS 
'Admin email address(es) for order notifications. Multiple emails can be separated by comma.';

