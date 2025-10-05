-- Add email notification settings to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS order_notification_emails TEXT,
ADD COLUMN IF NOT EXISTS enable_order_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS order_email_subject TEXT DEFAULT 'Yeni Sipariş - #{ORDER_NUMBER}',
ADD COLUMN IF NOT EXISTS order_email_template TEXT,
-- SMTP Configuration
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_username TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_email TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS smtp_enabled BOOLEAN DEFAULT false;

-- Set default email template
UPDATE site_settings 
SET order_email_template = 'Merhaba,

Yeni bir sipariş alındı:

Sipariş No: {ORDER_NUMBER}
Müşteri: {CUSTOMER_NAME}
E-mail: {CUSTOMER_EMAIL}
Telefon: {CUSTOMER_PHONE}
Toplam Tutar: {TOTAL_AMOUNT} {CURRENCY}

Sipariş Detayları:
{ORDER_ITEMS}

Teslimat Adresi:
{SHIPPING_ADDRESS}

Sipariş Takibi: {BASE_URL}/siparis-takibi/{ORDER_NUMBER}

Saygılarımızla,
{SITE_NAME}'
WHERE order_email_template IS NULL;

-- Set default SMTP settings  
UPDATE site_settings 
SET 
  smtp_from_name = 'Ardahan Ticaret',
  smtp_from_email = 'siparis@ardahanticaret.com'
WHERE smtp_from_name IS NULL;

-- Add comments for new columns
COMMENT ON COLUMN site_settings.order_notification_emails IS 'E-mail bildirimlerinin gönderileceği adresler (her satırda bir)';
COMMENT ON COLUMN site_settings.enable_order_notifications IS 'Sipariş e-mail bildirimleri aktif/pasif';
COMMENT ON COLUMN site_settings.order_email_subject IS 'Sipariş bildirimi e-mail konusu şablonu';
COMMENT ON COLUMN site_settings.order_email_template IS 'Sipariş bildirimi e-mail içerik şablonu'; 