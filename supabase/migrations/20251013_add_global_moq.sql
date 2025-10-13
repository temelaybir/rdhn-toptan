-- Site ayarlarına global minimum sipariş adedi ekle
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER DEFAULT 10;

-- Açıklama ekle
COMMENT ON COLUMN site_settings.minimum_order_quantity IS 'Sepetteki toplam minimum ürün adedi (tüm ürünler için)';

-- Varsayılan değeri ayarla
UPDATE site_settings 
SET minimum_order_quantity = 10 
WHERE minimum_order_quantity IS NULL;


