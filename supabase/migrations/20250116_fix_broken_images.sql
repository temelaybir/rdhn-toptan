-- Fix broken image URLs in products table
-- Replace ardahanticaret.com URLs that return 404 with placeholder

UPDATE products 
SET images = ARRAY['/placeholder-product.svg']
WHERE images::text ~ 'ardahanticaret\.com'
  AND (
    images::text ~ 'clipper-orjinal-kutulu-cakmak' OR
    images::text ~ '404' OR
    images::text ~ 'error'
  );

-- Update any empty or null image arrays
UPDATE products 
SET images = ARRAY['/placeholder-product.svg']
WHERE images IS NULL 
   OR images = '{}' 
   OR array_length(images, 1) IS NULL;

-- Update any images that contain empty strings or invalid URLs
UPDATE products 
SET images = array_remove(images, '') -- Remove empty strings
WHERE '' = ANY(images);

-- If after removing empty strings the array becomes empty, set placeholder
UPDATE products 
SET images = ARRAY['/placeholder-product.svg']
WHERE array_length(images, 1) IS NULL; 