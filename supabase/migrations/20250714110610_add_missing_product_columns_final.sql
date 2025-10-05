-- Add missing columns to products table that are causing PGRST204 errors
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_options JSONB DEFAULT '[]'::jsonb;

-- Ensure all previously added columns exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
