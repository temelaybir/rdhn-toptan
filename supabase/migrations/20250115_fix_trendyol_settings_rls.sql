-- Trendyol integration settings tablosu için RLS'yi devre dışı bırak
-- API route'da zaten admin kimlik doğrulaması yapılıyor

-- Mevcut RLS politikalarını sil
DROP POLICY IF EXISTS "Admin users can read trendyol settings" ON trendyol_integration_settings;
DROP POLICY IF EXISTS "Admin users can write trendyol settings" ON trendyol_integration_settings;
DROP POLICY IF EXISTS "Admin users can manage trendyol settings" ON trendyol_integration_settings;

-- RLS'yi devre dışı bırak
ALTER TABLE trendyol_integration_settings DISABLE ROW LEVEL SECURITY;
