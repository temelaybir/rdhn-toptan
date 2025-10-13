-- Products Tablosu için RLS Politikaları
-- Bu migration, products tablosuna RLS politikaları ekler
-- Service role key varsa RLS bypass edilir, yoksa bu politikalar çalışır

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for service role" ON products;
DROP POLICY IF EXISTS "Enable update for service role" ON products;
DROP POLICY IF EXISTS "Enable delete for service role" ON products;

-- RLS'i aktif et (eğer değilse)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 1. Herkes okuyabilir (Public read)
-- Tüm kullanıcılar (authenticated ve anon) products tablosundan okuyabilir
CREATE POLICY "Enable read access for all users"
ON products FOR SELECT
USING (true);

-- 2. Service role ve authenticated kullanıcılar insert yapabilir
CREATE POLICY "Enable insert for service role"
ON products FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

-- 3. Service role ve authenticated kullanıcılar update yapabilir
CREATE POLICY "Enable update for service role"
ON products FOR UPDATE
USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

-- 4. Service role ve authenticated kullanıcılar delete yapabilir
CREATE POLICY "Enable delete for service role"
ON products FOR DELETE
USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

-- Product Variants tablosu için de aynı politikaları uygula
DROP POLICY IF EXISTS "Enable read access for all users" ON product_variants;
DROP POLICY IF EXISTS "Enable insert for service role" ON product_variants;
DROP POLICY IF EXISTS "Enable update for service role" ON product_variants;
DROP POLICY IF EXISTS "Enable delete for service role" ON product_variants;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON product_variants FOR SELECT
USING (true);

CREATE POLICY "Enable insert for service role"
ON product_variants FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable update for service role"
ON product_variants FOR UPDATE
USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable delete for service role"
ON product_variants FOR DELETE
USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

-- Categories tablosu için de aynı politikaları uygula
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for service role" ON categories;
DROP POLICY IF EXISTS "Enable update for service role" ON categories;
DROP POLICY IF EXISTS "Enable delete for service role" ON categories;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Enable insert for service role"
ON categories FOR INSERT
WITH CHECK (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable update for service role"
ON categories FOR UPDATE
USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

CREATE POLICY "Enable delete for service role"
ON categories FOR DELETE
USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);

