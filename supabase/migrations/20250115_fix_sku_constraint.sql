-- Migration: SKU unique constraint sorununu çöz
-- Created: 2025-01-15

-- Eski problematic constraint'i kaldır
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

-- Akıllı partial unique index ekle - sadece dolu SKU'lar unique olsun
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx 
ON products (sku) 
WHERE sku IS NOT NULL AND sku != '';

-- Bu sayede:
-- 1. Boş string SKU'lar duplicate olabilir (sorun çıkarmaz)
-- 2. NULL SKU'lar duplicate olabilir (sorun çıkarmaz)
-- 3. Sadece gerçek SKU değerleri unique olmak zorunda 