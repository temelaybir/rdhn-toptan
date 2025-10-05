-- Migration: Görsel URL'lerini güncelle
-- -550x550h.jpg -> -550x550.jpg 
-- .png -> -550x550.png

-- 1. Products tablosunda images array'ini güncelle
-- (products tablosunda image_url kolonu yok, sadece images array var!)

-- -550x550h.jpg -> -550x550.jpg değişimi
UPDATE products 
SET images = ARRAY(
    SELECT REPLACE(unnest(images), '-550x550h.jpg', '-550x550.jpg')
)
WHERE EXISTS (
    SELECT 1 FROM unnest(images) AS img 
    WHERE img LIKE '%-550x550h.jpg%'
);

-- .png -> -550x550.png değişimi
UPDATE products 
SET images = ARRAY(
    SELECT 
        CASE 
            WHEN unnest(images) LIKE '%.png' AND unnest(images) NOT LIKE '%-550x550.png'
            THEN REPLACE(unnest(images), '.png', '-550x550.png')
            ELSE unnest(images)
        END
)
WHERE EXISTS (
    SELECT 1 FROM unnest(images) AS img 
    WHERE img LIKE '%.png' AND img NOT LIKE '%-550x550.png'
);

-- 2. Categories tablosunda image_url alanını güncelle
UPDATE categories 
SET image_url = REPLACE(image_url, '-550x550h.jpg', '-550x550.jpg')
WHERE image_url LIKE '%-550x550h.jpg%';

UPDATE categories 
SET image_url = REPLACE(image_url, '.png', '-550x550.png')
WHERE image_url LIKE '%.png' 
AND image_url NOT LIKE '%-550x550.png'; 