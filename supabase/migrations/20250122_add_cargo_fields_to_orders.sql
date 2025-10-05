-- Add cargo tracking fields to orders table
-- Based on PHP teknokargo system

-- Add cargo fields to orders table (PostgreSQL requires separate ADD COLUMN statements)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_sonuc TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_barcode TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_firma TEXT DEFAULT 'aras';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_tarih TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_talepno TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_takipno TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kargo_paketadet INTEGER DEFAULT 1;

-- Add comments to explain fields
COMMENT ON COLUMN orders.kargo_sonuc IS 'Cargo status from Aras Kargo system ("Kargoya Verildi", "Teslim Edildi" etc.)';
COMMENT ON COLUMN orders.kargo_barcode IS 'Printed barcode for Aras Kargo (ARD-ORDER-XXXX format)';
COMMENT ON COLUMN orders.kargo_firma IS 'Cargo company code (default: aras)';
COMMENT ON COLUMN orders.kargo_tarih IS 'Cargo handover date';
COMMENT ON COLUMN orders.kargo_talepno IS 'Internal request number';
COMMENT ON COLUMN orders.kargo_takipno IS 'Tracking number assigned by Aras Kargo after barcode scan';
COMMENT ON COLUMN orders.kargo_url IS 'Direct tracking URL for this shipment';
COMMENT ON COLUMN orders.kargo_paketadet IS 'Package count (default: 1)';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_kargo_barcode ON orders(kargo_barcode);
CREATE INDEX IF NOT EXISTS idx_orders_kargo_takipno ON orders(kargo_takipno);
CREATE INDEX IF NOT EXISTS idx_orders_kargo_firma ON orders(kargo_firma);
CREATE INDEX IF NOT EXISTS idx_orders_kargo_sonuc ON orders(kargo_sonuc);

-- Add index for cron job queries (pending cargo orders)
CREATE INDEX IF NOT EXISTS idx_orders_cargo_pending ON orders(kargo_firma, kargo_sonuc, updated_at)
WHERE kargo_barcode IS NOT NULL AND kargo_sonuc != 'Teslim Edildi';

-- Create cargo status enum for consistency
DO $$ BEGIN
    CREATE TYPE cargo_status AS ENUM (
        'Hazırlanıyor',
        'Kargoya Verildi', 
        'Dağıtım Merkezinde',
        'Kurye ile Dağıtımda',
        'Teslim Edildi',
        'Teslim Edilemedi',
        'İade',
        'Beklemede'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sample data for testing (optional)
-- INSERT INTO orders (kargo_barcode, kargo_firma, kargo_sonuc) VALUES 
-- ('ARD-TEST-001', 'aras', 'Hazırlanıyor') 
-- WHERE NOT EXISTS (SELECT 1 FROM orders WHERE kargo_barcode = 'ARD-TEST-001'); 