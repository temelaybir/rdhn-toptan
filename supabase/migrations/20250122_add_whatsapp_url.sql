-- WhatsApp URL alanını ekle
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS whatsapp_url text;

-- Mevcut WhatsApp numaralarından URL oluştur (eğer varsa)
UPDATE site_settings 
SET whatsapp_url = CASE 
  WHEN whatsapp_number IS NOT NULL AND whatsapp_number != '' 
  THEN 'https://wa.me/' || REGEXP_REPLACE(whatsapp_number, '[^0-9]', '', 'g')
  ELSE NULL 
END
WHERE whatsapp_number IS NOT NULL AND whatsapp_url IS NULL; 