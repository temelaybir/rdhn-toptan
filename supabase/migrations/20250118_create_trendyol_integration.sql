-- Trendyol Entegrasyonu için Veritabanı Şeması
-- Created: 2025-01-18

-- 1. Trendyol Ayarları Tablosu
CREATE TABLE IF NOT EXISTS trendyol_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    ftp_host TEXT,
    ftp_user TEXT,
    ftp_password TEXT,
    ftp_base_path TEXT DEFAULT '/products',
    sync_interval INTEGER DEFAULT 15, -- dakika
    is_active BOOLEAN DEFAULT TRUE,
    last_category_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trendyol Kategorileri Tablosu
CREATE TABLE IF NOT EXISTS trendyol_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trendyol_category_id INTEGER NOT NULL UNIQUE,
    category_name TEXT NOT NULL,
    parent_category_id INTEGER,
    local_category_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Trendyol Kategori Zorunlu Alanları
CREATE TABLE IF NOT EXISTS trendyol_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trendyol_category_id INTEGER NOT NULL,
    attribute_name TEXT NOT NULL,
    attribute_type TEXT NOT NULL, -- text, number, select, multiselect
    is_required BOOLEAN DEFAULT FALSE,
    allowed_values JSONB, -- select için seçenekler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (trendyol_category_id) REFERENCES trendyol_categories(trendyol_category_id)
);

-- 4. Trendyol Ürün Eşleştirmeleri
CREATE TABLE IF NOT EXISTS trendyol_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    trendyol_product_id TEXT, -- Trendyol'dan dönen ID
    barcode TEXT NOT NULL,
    approval_status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    rejection_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'PENDING', -- PENDING, SUCCESS, ERROR
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, barcode)
);

-- 5. FTP Görsel Yönetimi
CREATE TABLE IF NOT EXISTS ftp_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    ftp_url TEXT,
    webp_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    upload_status TEXT DEFAULT 'PENDING', -- PENDING, UPLOADING, SUCCESS, ERROR
    upload_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Senkronizasyon İşlem Kuyruğu
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type TEXT NOT NULL, -- CREATE_PRODUCT, UPDATE_STOCK, UPDATE_PRICE, UPLOAD_IMAGE
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCESS, ERROR
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Trendyol Senkronizasyon Logları
CREATE TABLE IF NOT EXISTS trendyol_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type TEXT NOT NULL,
    product_id UUID REFERENCES products(id),
    trendyol_product_id TEXT,
    status TEXT NOT NULL, -- SUCCESS, ERROR, WARNING
    details JSONB,
    error_code TEXT,
    error_message TEXT,
    sync_duration INTEGER, -- milisaniye
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_trendyol_products_product_id ON trendyol_products(product_id);
CREATE INDEX IF NOT EXISTS idx_trendyol_products_barcode ON trendyol_products(barcode);
CREATE INDEX IF NOT EXISTS idx_trendyol_products_status ON trendyol_products(approval_status);
CREATE INDEX IF NOT EXISTS idx_trendyol_categories_category_id ON trendyol_categories(trendyol_category_id);
CREATE INDEX IF NOT EXISTS idx_trendyol_categories_local_id ON trendyol_categories(local_category_id);
CREATE INDEX IF NOT EXISTS idx_ftp_images_product_id ON ftp_images(product_id);
CREATE INDEX IF NOT EXISTS idx_ftp_images_status ON ftp_images(upload_status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled ON sync_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON trendyol_sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_product_id ON trendyol_sync_logs(product_id);

-- Updated at trigger'ları
CREATE TRIGGER update_trendyol_settings_updated_at BEFORE UPDATE ON trendyol_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trendyol_categories_updated_at BEFORE UPDATE ON trendyol_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trendyol_products_updated_at BEFORE UPDATE ON trendyol_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ftp_images_updated_at BEFORE UPDATE ON ftp_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE trendyol_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trendyol_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trendyol_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trendyol_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ftp_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE trendyol_sync_logs ENABLE ROW LEVEL SECURITY;

-- Admin erişim politikaları
CREATE POLICY "Admin can manage trendyol settings" ON trendyol_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage trendyol categories" ON trendyol_categories
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage trendyol attributes" ON trendyol_attributes
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage trendyol products" ON trendyol_products
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage ftp images" ON ftp_images
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage sync queue" ON sync_queue
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can view sync logs" ON trendyol_sync_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Başlangıç verisi (örnek ayarlar)
INSERT INTO trendyol_settings (supplier_id, api_key, api_secret, is_active) 
VALUES ('SUPPLIER_ID_PLACEHOLDER', 'API_KEY_PLACEHOLDER', 'API_SECRET_PLACEHOLDER', FALSE)
ON CONFLICT DO NOTHING; 