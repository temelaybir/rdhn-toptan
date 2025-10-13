-- Ürünlere paket bilgisi alanları ekleme
-- Toptan satış için paket adedi ve birim bilgisi

-- Önce mevcut kolonları kontrol et ve yoksa ekle
DO $$ 
BEGIN
  -- package_quantity kolonu yoksa ekle (1 pakette kaç adet var)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'package_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN package_quantity INTEGER;
    COMMENT ON COLUMN products.package_quantity IS 'Bir paketteki ürün adedi (ör: 10, 12, 15, 20, 24, 48, 50)';
  END IF;

  -- package_unit kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'package_unit'
  ) THEN
    ALTER TABLE products ADD COLUMN package_unit VARCHAR(50) DEFAULT 'adet';
    COMMENT ON COLUMN products.package_unit IS 'Paket birimi (adet, kg, litre vb.)';
  END IF;

  -- is_wholesale kolonu yoksa ekle (toptan ürün mü?)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_wholesale'
  ) THEN
    ALTER TABLE products ADD COLUMN is_wholesale BOOLEAN DEFAULT false;
    COMMENT ON COLUMN products.is_wholesale IS 'Ürün toptan satış ürünü mü?';
  END IF;

  -- wholesale_only kolonu yoksa ekle (sadece toptan mı?)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'wholesale_only'
  ) THEN
    ALTER TABLE products ADD COLUMN wholesale_only BOOLEAN DEFAULT false;
    COMMENT ON COLUMN products.wholesale_only IS 'Ürün sadece toptan olarak mı satılıyor?';
  END IF;

  -- moq kolonu yoksa ekle (minimum sipariş miktarı)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'moq'
  ) THEN
    ALTER TABLE products ADD COLUMN moq INTEGER;
    COMMENT ON COLUMN products.moq IS 'Minimum sipariş miktarı (Minimum Order Quantity)';
  END IF;

  -- moq_unit kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'moq_unit'
  ) THEN
    ALTER TABLE products ADD COLUMN moq_unit VARCHAR(20) DEFAULT 'piece';
    COMMENT ON COLUMN products.moq_unit IS 'MOQ birimi: piece (adet), package (paket), koli';
  END IF;
END $$;

-- Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_products_is_wholesale ON products(is_wholesale) WHERE is_wholesale = true;
CREATE INDEX IF NOT EXISTS idx_products_package_quantity ON products(package_quantity) WHERE package_quantity IS NOT NULL;

-- Örnek veri ekleme (test için - isterseniz silebilirsiniz)
-- UPDATE products SET 
--   is_wholesale = true,
--   package_quantity = 12,
--   package_unit = 'adet',
--   moq = 1,
--   moq_unit = 'package'
-- WHERE id IN (SELECT id FROM products LIMIT 5);

