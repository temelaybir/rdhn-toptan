-- Add missing columns to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;

-- Update RLS policies for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Allow category creation" ON categories;
DROP POLICY IF EXISTS "Allow category updates" ON categories;
DROP POLICY IF EXISTS "Allow category deletion" ON categories;

-- Create new policies for categories
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Allow category creation" ON categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow category updates" ON categories
    FOR UPDATE USING (true);

CREATE POLICY "Allow category deletion" ON categories
    FOR DELETE USING (true);

-- Update products RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Allow products creation" ON products;
DROP POLICY IF EXISTS "Allow products updates" ON products;
DROP POLICY IF EXISTS "Allow products deletion" ON products;

-- Create new policies for products
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow products creation" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow products updates" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Allow products deletion" ON products
    FOR DELETE USING (true); 