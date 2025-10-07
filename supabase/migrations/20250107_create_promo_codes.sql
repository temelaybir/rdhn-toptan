-- Promosyon Kodları Tablosu
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Kullanım ayarları
  usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('single', 'multiple')),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Tarih ayarları
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Minimum sepet tutarı
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Durum
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER -- Admin user ID (no FK - auth.users is in different schema)
);

-- İndeksler
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_dates ON promo_codes(start_date, end_date);

-- Promosyon Kodu Kullanım Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id SERIAL PRIMARY KEY,
  promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id VARCHAR(100),
  user_id INTEGER, -- User ID (no FK - auth.users is in different schema)
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_usage_order ON promo_code_usage(order_id);
CREATE INDEX idx_promo_usage_user ON promo_code_usage(user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_codes_updated_at();

-- Kullanım sayısını artırma fonksiyonu
CREATE OR REPLACE FUNCTION increment_promo_code_usage(promo_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes 
  SET current_uses = current_uses + 1
  WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql;

-- Promosyon kodunu doğrulama fonksiyonu
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code VARCHAR(50),
  p_order_amount DECIMAL(10, 2),
  p_user_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
  valid BOOLEAN,
  discount_type VARCHAR(20),
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_calculated_discount DECIMAL(10, 2);
BEGIN
  -- Promosyon kodunu bul
  SELECT * INTO v_promo FROM promo_codes WHERE code = p_code;
  
  -- Kod bulunamadı
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::DECIMAL, NULL::DECIMAL, 'Geçersiz promosyon kodu'::TEXT;
    RETURN;
  END IF;
  
  -- Aktif değil
  IF NOT v_promo.is_active THEN
    RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::DECIMAL, NULL::DECIMAL, 'Bu promosyon kodu artık geçerli değil'::TEXT;
    RETURN;
  END IF;
  
  -- Tarih kontrolü
  IF v_promo.start_date IS NOT NULL AND NOW() < v_promo.start_date THEN
    RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::DECIMAL, NULL::DECIMAL, 'Bu promosyon kodu henüz başlamadı'::TEXT;
    RETURN;
  END IF;
  
  IF v_promo.end_date IS NOT NULL AND NOW() > v_promo.end_date THEN
    RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::DECIMAL, NULL::DECIMAL, 'Bu promosyon kodunun süresi dolmuş'::TEXT;
    RETURN;
  END IF;
  
  -- Kullanım limiti kontrolü
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::DECIMAL, NULL::DECIMAL, 'Bu promosyon kodunun kullanım limiti dolmuş'::TEXT;
    RETURN;
  END IF;
  
  -- Tek kullanımlık kontrolü
  IF v_promo.usage_type = 'single' AND p_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM promo_code_usage WHERE promo_code_id = v_promo.id AND user_id = p_user_id) THEN
      RETURN QUERY SELECT false, NULL::VARCHAR(20), NULL::DECIMAL, NULL::DECIMAL, 'Bu promosyon kodunu zaten kullandınız'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Minimum sepet tutarı kontrolü
  IF p_order_amount < v_promo.min_order_amount THEN
    RETURN QUERY SELECT 
      false, 
      NULL::VARCHAR(20), 
      NULL::DECIMAL, 
      NULL::DECIMAL, 
      CONCAT('Minimum sepet tutarı ', v_promo.min_order_amount, ' TL olmalıdır')::TEXT;
    RETURN;
  END IF;
  
  -- İndirim hesaplama
  IF v_promo.discount_type = 'percentage' THEN
    v_calculated_discount := (p_order_amount * v_promo.discount_value / 100);
  ELSE
    v_calculated_discount := v_promo.discount_value;
  END IF;
  
  -- Geçerli
  RETURN QUERY SELECT 
    true, 
    v_promo.discount_type, 
    v_promo.discount_value, 
    v_calculated_discount,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Politikaları
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcılar her şeyi görebilir/yapabilir
-- Not: Admin kontrolü uygulama seviyesinde yapılacak
CREATE POLICY "Admin full access to promo_codes"
  ON promo_codes
  FOR ALL
  TO authenticated
  USING (true) -- Admin kontrolü backend'de yapılıyor
  WITH CHECK (true);

-- Herkes aktif promosyon kodlarını görebilir (validation için)
CREATE POLICY "Public can view active promo codes"
  ON promo_codes
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admin kullanım geçmişini görebilir
-- Not: Admin kontrolü uygulama seviyesinde yapılacak
CREATE POLICY "Admin can view usage history"
  ON promo_code_usage
  FOR ALL
  TO authenticated
  USING (true) -- Admin kontrolü backend'de yapılıyor
  WITH CHECK (true);
