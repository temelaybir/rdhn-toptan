-- Siparişler tablosuna müşteri tipi ve kurumsal bilgileri ekle

-- Müşteri tipi (bireysel/kurumsal)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_type VARCHAR(20) DEFAULT 'individual' CHECK (customer_type IN ('individual', 'corporate'));
  END IF;
END $$;

-- TC Kimlik No (bireysel için opsiyonel)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'identity_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN identity_number VARCHAR(11);
  END IF;
END $$;

-- Şirket Adı (kurumsal için)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN company_name VARCHAR(255);
  END IF;
END $$;

-- Vergi Numarası (kurumsal için)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tax_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_number VARCHAR(20);
  END IF;
END $$;

-- Vergi Dairesi (kurumsal için)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tax_office'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_office VARCHAR(255);
  END IF;
END $$;

-- İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_orders_customer_type ON orders(customer_type);
CREATE INDEX IF NOT EXISTS idx_orders_tax_number ON orders(tax_number);

-- Yorum ekle
COMMENT ON COLUMN orders.customer_type IS 'Müşteri tipi: individual (bireysel) veya corporate (kurumsal)';
COMMENT ON COLUMN orders.identity_number IS 'TC Kimlik Numarası (bireysel müşteriler için)';
COMMENT ON COLUMN orders.company_name IS 'Şirket adı (kurumsal müşteriler için)';
COMMENT ON COLUMN orders.tax_number IS 'Vergi numarası (kurumsal müşteriler için)';
COMMENT ON COLUMN orders.tax_office IS 'Vergi dairesi (kurumsal müşteriler için)';

