-- Promosyon kodları tablosuna tarih sütunlarını ekle (eğer yoksa)

-- end_date sütununu ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- start_date sütununu ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE promo_codes ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Tarih indeksini yeniden oluştur
DROP INDEX IF EXISTS idx_promo_codes_dates;
CREATE INDEX idx_promo_codes_dates ON promo_codes(start_date, end_date);

