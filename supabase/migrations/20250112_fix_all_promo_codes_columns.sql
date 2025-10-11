-- Promosyon kodları tablosuna tüm eksik sütunları ekle

-- description sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'description'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN description TEXT;
  END IF;
END $$;

-- discount_type sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed'));
    -- Default'u kaldır (sadece ekleme için gerekli)
    ALTER TABLE promo_codes ALTER COLUMN discount_type DROP DEFAULT;
  END IF;
END $$;

-- discount_value sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0;
    ALTER TABLE promo_codes ALTER COLUMN discount_value DROP DEFAULT;
  END IF;
END $$;

-- usage_type sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN usage_type VARCHAR(20) NOT NULL DEFAULT 'multiple' CHECK (usage_type IN ('single', 'multiple'));
    ALTER TABLE promo_codes ALTER COLUMN usage_type DROP DEFAULT;
  END IF;
END $$;

-- max_uses sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'max_uses'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN max_uses INTEGER;
  END IF;
END $$;

-- current_uses sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'current_uses'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN current_uses INTEGER DEFAULT 0;
  END IF;
END $$;

-- start_date sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- end_date sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- min_order_amount sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'min_order_amount'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN min_order_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- is_active sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- created_by sütunu
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN created_by INTEGER;
  END IF;
END $$;

-- İndeksleri oluştur (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_dates ON promo_codes(start_date, end_date);

