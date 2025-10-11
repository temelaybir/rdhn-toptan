-- Fix duplicate orders and add unique constraint
-- Bu migration mevcut duplicate kayıtları temizler ve tekrar oluşmasını engeller

-- 1. Duplicate kayıtları temizle (en eski kaydı tut, diğerlerini sil)
WITH duplicates AS (
  SELECT 
    id,
    order_number,
    ROW_NUMBER() OVER (PARTITION BY order_number ORDER BY created_at ASC) as rn
  FROM orders
)
DELETE FROM orders
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. UNIQUE constraint ekle (order_number benzersiz olmalı)
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_order_number_unique;

ALTER TABLE orders
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- 4. Comment ekle
COMMENT ON CONSTRAINT orders_order_number_unique ON orders IS 
'Ensures each order number is unique across the system to prevent duplicate orders';

-- Sonuçları göster
DO $$
DECLARE
  total_orders INTEGER;
  unique_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM orders;
  SELECT COUNT(DISTINCT order_number) INTO unique_orders FROM orders;
  
  RAISE NOTICE '✅ Duplicate temizleme tamamlandı';
  RAISE NOTICE 'Toplam sipariş: %', total_orders;
  RAISE NOTICE 'Benzersiz sipariş numarası: %', unique_orders;
  
  IF total_orders = unique_orders THEN
    RAISE NOTICE '✅ Tüm siparişler benzersiz!';
  ELSE
    RAISE WARNING '⚠️ Hala duplicate var: % adet', (total_orders - unique_orders);
  END IF;
END $$;

