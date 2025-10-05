-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER,
ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS shipping_class TEXT DEFAULT 'standard';

-- Add constraints
ALTER TABLE products 
ADD CONSTRAINT check_shipping_class 
CHECK (shipping_class IN ('standard', 'fragile', 'oversized'));

-- Update existing products to have default values
UPDATE products 
SET 
    track_stock = TRUE,
    allow_backorders = FALSE,
    requires_shipping = TRUE,
    shipping_class = 'standard'
WHERE track_stock IS NULL 
   OR allow_backorders IS NULL 
   OR requires_shipping IS NULL 
   OR shipping_class IS NULL; 