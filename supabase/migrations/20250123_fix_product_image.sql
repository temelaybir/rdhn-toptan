-- Fix specific product image URL
-- Update the product image for "2-adet-cakmak-gazi-1-adet-mini-cok-amacli-cakmak"

UPDATE products 
SET images = ARRAY['https://ardahanticaret.com/image/cache/catalog/easyentegre/2-adet-cakmak-gazi-1-adet-mini-cok-amacli-cakmak-gaz02-0-500x500h.jpg'],
    updated_at = NOW()
WHERE slug = '2-adet-cakmak-gazi-1-adet-mini-cok-amacli-cakmak';

-- Check if the update was successful
SELECT id, name, slug, images 
FROM products 
WHERE slug = '2-adet-cakmak-gazi-1-adet-mini-cok-amacli-cakmak'; 