-- SEO URL Mappings tablosu
-- Eski URL'leri yeni URL'lere yönlendirmek için

CREATE TABLE IF NOT EXISTS seo_url_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_url TEXT NOT NULL UNIQUE,
  new_url TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301, -- 301, 302, 410 (gone)
  match_type VARCHAR(20) DEFAULT 'manual', -- 'exact', 'similarity', 'manual', 'fallback'
  confidence DECIMAL(3,2) DEFAULT 1.0, -- Eşleşme güvenirliği (0.00-1.00)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  old_product_name TEXT,
  old_barcode TEXT,
  hit_count INTEGER DEFAULT 0, -- Kaç kez kullanıldı
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_seo_url_mappings_old_url ON seo_url_mappings(old_url);
CREATE INDEX IF NOT EXISTS idx_seo_url_mappings_new_url ON seo_url_mappings(new_url);
CREATE INDEX IF NOT EXISTS idx_seo_url_mappings_active ON seo_url_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_seo_url_mappings_hit_count ON seo_url_mappings(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_seo_url_mappings_product_id ON seo_url_mappings(product_id);

-- RLS Politikaları
ALTER TABLE seo_url_mappings ENABLE ROW LEVEL SECURITY;

-- Admin'ler tüm işlemleri yapabilir
CREATE POLICY "Admin tam erişim seo_url_mappings" ON seo_url_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- Public okuma (middleware için)
CREATE POLICY "Public okuma seo_url_mappings" ON seo_url_mappings
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Updated at trigger
CREATE TRIGGER update_seo_url_mappings_updated_at
  BEFORE UPDATE ON seo_url_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Hit count güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION increment_url_hit_count(old_url_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE seo_url_mappings 
  SET 
    hit_count = hit_count + 1,
    last_used_at = CURRENT_TIMESTAMP
  WHERE old_url = old_url_param AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toplu URL mapping ekleme fonksiyonu
CREATE OR REPLACE FUNCTION bulk_insert_url_mappings(mappings JSONB)
RETURNS INTEGER AS $$
DECLARE
  mapping JSONB;
  inserted_count INTEGER := 0;
BEGIN
  FOR mapping IN SELECT * FROM jsonb_array_elements(mappings)
  LOOP
    INSERT INTO seo_url_mappings (
      old_url,
      new_url,
      match_type,
      confidence,
      old_product_name,
      old_barcode,
      product_id
    ) VALUES (
      mapping->>'old_url',
      mapping->>'new_url',
      COALESCE(mapping->>'match_type', 'manual'),
      COALESCE((mapping->>'confidence')::DECIMAL, 1.0),
      mapping->>'old_product_name',
      mapping->>'old_barcode',
      CASE 
        WHEN mapping->>'product_id' IS NOT NULL 
        THEN (mapping->>'product_id')::UUID 
        ELSE NULL 
      END
    )
    ON CONFLICT (old_url) DO UPDATE SET
      new_url = EXCLUDED.new_url,
      match_type = EXCLUDED.match_type,
      confidence = EXCLUDED.confidence,
      updated_at = CURRENT_TIMESTAMP;
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
