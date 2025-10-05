-- Sosyal medya widget ayarları ekle
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS show_social_widget boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS social_widget_position text DEFAULT 'bottom-right' CHECK (social_widget_position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
ADD COLUMN IF NOT EXISTS social_widget_style text DEFAULT 'floating' CHECK (social_widget_style IN ('floating', 'minimal', 'compact'));

-- Mevcut kayıtları güncelle
UPDATE site_settings 
SET 
  show_social_widget = true,
  social_widget_position = 'bottom-right',
  social_widget_style = 'floating'
WHERE id IS NOT NULL; 