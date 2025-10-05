-- Trendyol Test/Production Ortam Ayarları
-- Created: 2025-01-18

-- Test mode alanı ekle
ALTER TABLE trendyol_settings 
ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT FALSE;

-- Test mode ayarları için comment ekle
COMMENT ON COLUMN trendyol_settings.test_mode IS 'Test ortamı kullanımı (IP yetkilendirmesi gerektirir)';

-- Default mock_mode false yap (eğer null ise)
UPDATE trendyol_settings 
SET mock_mode = FALSE 
WHERE mock_mode IS NULL; 