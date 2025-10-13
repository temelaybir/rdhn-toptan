-- Create Supabase Storage buckets for media files

-- 1. Products bucket (product images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Logos bucket (site logo, favicon)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Banners bucket (campaign banners, hero slides)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Avatars bucket (user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Products bucket
DROP POLICY IF EXISTS "Public read access for products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for products" ON storage.objects;

CREATE POLICY "Public read access for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated upload for products"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() IN ('authenticated', 'service_role', 'anon'));

CREATE POLICY "Authenticated update for products"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.role() IN ('authenticated', 'service_role', 'anon'));

CREATE POLICY "Authenticated delete for products"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.role() IN ('authenticated', 'service_role'));

-- RLS Policies for Logos bucket
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for logos" ON storage.objects;

CREATE POLICY "Public read access for logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Authenticated upload for logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.role() IN ('authenticated', 'service_role', 'anon'));

-- RLS Policies for Banners bucket
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for banners" ON storage.objects;

CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated upload for banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND auth.role() IN ('authenticated', 'service_role', 'anon'));

-- RLS Policies for Avatars bucket
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for avatars" ON storage.objects;

CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated upload for avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() IN ('authenticated', 'service_role', 'anon'));

