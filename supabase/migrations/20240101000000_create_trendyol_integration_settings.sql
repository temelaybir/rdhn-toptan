-- Trendyol entegrasyon ayarları tablosu
CREATE TABLE IF NOT EXISTS trendyol_integration_settings (
  id SERIAL PRIMARY KEY,
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  supplier_id VARCHAR(50) NOT NULL,
  mock_mode BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS devre dışı - API route'da admin kimlik doğrulaması yapılıyor
-- ALTER TABLE trendyol_integration_settings ENABLE ROW LEVEL SECURITY;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trendyol_integration_settings_updated_at 
  BEFORE UPDATE ON trendyol_integration_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
