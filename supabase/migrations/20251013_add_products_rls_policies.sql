-- Tüm Admin Tabloları için RLS Politikaları
-- Bu migration, tüm admin tablolarına RLS politikaları ekler
-- Service role key varsa RLS bypass edilir, yoksa bu politikalar çalışır

-- ============================================
-- PRODUCTS & CATEGORIES
-- ============================================

-- Products tablosu
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for service role" ON products;
DROP POLICY IF EXISTS "Enable update for service role" ON products;
DROP POLICY IF EXISTS "Enable delete for service role" ON products;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON products FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role"
ON products FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for service role"
ON products FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON products FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Product Variants
DROP POLICY IF EXISTS "Enable read access for all users" ON product_variants;
DROP POLICY IF EXISTS "Enable insert for service role" ON product_variants;
DROP POLICY IF EXISTS "Enable update for service role" ON product_variants;
DROP POLICY IF EXISTS "Enable delete for service role" ON product_variants;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON product_variants FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role"
ON product_variants FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for service role"
ON product_variants FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON product_variants FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Categories
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for service role" ON categories;
DROP POLICY IF EXISTS "Enable update for service role" ON categories;
DROP POLICY IF EXISTS "Enable delete for service role" ON categories;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON categories FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role"
ON categories FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for service role"
ON categories FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON categories FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ============================================
-- ORDERS & CUSTOMERS
-- ============================================

-- Orders
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated" ON orders;
DROP POLICY IF EXISTS "Enable delete for service role" ON orders;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON orders FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON orders FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON orders FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON orders FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Order Items
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON order_items;
DROP POLICY IF EXISTS "Enable update for authenticated" ON order_items;
DROP POLICY IF EXISTS "Enable delete for service role" ON order_items;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON order_items FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON order_items FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON order_items FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON order_items FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Customers
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated" ON customers;
DROP POLICY IF EXISTS "Enable delete for service role" ON customers;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON customers FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON customers FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON customers FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON customers FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ============================================
-- SETTINGS & CONTENT
-- ============================================

-- Site Settings
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON site_settings;
DROP POLICY IF EXISTS "Enable update for authenticated" ON site_settings;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON site_settings FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON site_settings FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON site_settings FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Footer Settings
DROP POLICY IF EXISTS "Enable read access for all users" ON footer_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON footer_settings;
DROP POLICY IF EXISTS "Enable update for authenticated" ON footer_settings;

ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON footer_settings FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON footer_settings FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON footer_settings FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Promo Codes
DROP POLICY IF EXISTS "Enable read access for all users" ON promo_codes;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON promo_codes;
DROP POLICY IF EXISTS "Enable update for authenticated" ON promo_codes;
DROP POLICY IF EXISTS "Enable delete for service role" ON promo_codes;

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON promo_codes FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON promo_codes FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON promo_codes FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON promo_codes FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Invoices
DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON invoices;
DROP POLICY IF EXISTS "Enable update for authenticated" ON invoices;
DROP POLICY IF EXISTS "Enable delete for service role" ON invoices;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON invoices FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated"
ON invoices FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated"
ON invoices FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON invoices FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ============================================
-- ADMIN USERS & SESSIONS
-- ============================================

-- Admin Users (sadece service role ve authenticated erişebilir)
DROP POLICY IF EXISTS "Enable read for service role" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for service role" ON admin_users;
DROP POLICY IF EXISTS "Enable update for service role" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for service role" ON admin_users;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for service role"
ON admin_users FOR SELECT
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable insert for service role"
ON admin_users FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for service role"
ON admin_users FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON admin_users FOR DELETE
USING (auth.role() = 'service_role');

-- Admin Sessions
DROP POLICY IF EXISTS "Enable read for service role" ON admin_sessions;
DROP POLICY IF EXISTS "Enable insert for service role" ON admin_sessions;
DROP POLICY IF EXISTS "Enable update for service role" ON admin_sessions;
DROP POLICY IF EXISTS "Enable delete for service role" ON admin_sessions;

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for service role"
ON admin_sessions FOR SELECT
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable insert for service role"
ON admin_sessions FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for service role"
ON admin_sessions FOR UPDATE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for service role"
ON admin_sessions FOR DELETE
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

