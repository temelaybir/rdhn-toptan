-- Google Maps alanlarını site_settings tablosuna ekle

-- Google Maps embed URL alanı
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'google_maps_embed_url'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN google_maps_embed_url TEXT;
  END IF;
END $$;

-- Haritayı göster/gizle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'show_google_maps'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN show_google_maps BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Harita genişliği
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'google_maps_width'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN google_maps_width VARCHAR(20) DEFAULT '100%';
  END IF;
END $$;

-- Harita yüksekliği
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'google_maps_height'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN google_maps_height VARCHAR(20) DEFAULT '300';
  END IF;
END $$;

