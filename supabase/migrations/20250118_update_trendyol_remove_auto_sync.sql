-- Trendyol Otomatik Senkronizasyon Kaldırma
-- Created: 2025-01-18

-- sync_interval alanını kaldır - sadece manuel senkronizasyon
ALTER TABLE trendyol_settings DROP COLUMN IF EXISTS sync_interval;

-- Mock mode alanı ekle (eğer yoksa)
ALTER TABLE trendyol_settings 
ADD COLUMN IF NOT EXISTS mock_mode BOOLEAN DEFAULT FALSE;

-- Stok güncelleme için son_stok_sync alanı ekle
ALTER TABLE trendyol_settings 
ADD COLUMN IF NOT EXISTS last_stock_sync TIMESTAMP WITH TIME ZONE;

-- Sadece stok senkronizasyonu için yeni tablo
CREATE TABLE IF NOT EXISTS trendyol_stock_sync_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_enabled BOOLEAN DEFAULT FALSE,
    sync_hour_1 INTEGER DEFAULT 9, -- Günde 2 kez: sabah 9
    sync_hour_2 INTEGER DEFAULT 18, -- ve akşam 18
    last_sync_1 TIMESTAMP WITH TIME ZONE,
    last_sync_2 TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default stok sync config ekle
INSERT INTO trendyol_stock_sync_config (is_enabled, sync_hour_1, sync_hour_2) 
VALUES (FALSE, 9, 18)
ON CONFLICT DO NOTHING;

-- RLS policy
ALTER TABLE trendyol_stock_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage stock sync config" ON trendyol_stock_sync_config
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Updated at trigger
CREATE TRIGGER update_trendyol_stock_sync_config_updated_at 
    BEFORE UPDATE ON trendyol_stock_sync_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 