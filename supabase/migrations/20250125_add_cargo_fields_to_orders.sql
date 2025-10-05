-- Add tracking_number and cargo_company columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS cargo_company VARCHAR(100);

-- Add index for tracking number searches
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Add comment
COMMENT ON COLUMN orders.tracking_number IS 'Kargo takip numarası';
COMMENT ON COLUMN orders.cargo_company IS 'Kargo şirketi adı';