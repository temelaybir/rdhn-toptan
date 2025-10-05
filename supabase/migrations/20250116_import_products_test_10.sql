-- İlk 10 XML ürününü test etmek için import migration
-- Önce utility function oluşturalım

-- HTML tag'lerini temizleme fonksiyonu
CREATE OR REPLACE FUNCTION clean_html_tags(html_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF html_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- HTML tag'lerini kaldır
    RETURN TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(html_text, '<[^>]*>', '', 'g'),
        '&[a-zA-Z0-9#]+;', '', 'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- Kategori ID mapping fonksiyonu
CREATE OR REPLACE FUNCTION get_category_id_by_legacy_ids(legacy_ids TEXT)
RETURNS UUID AS $$
DECLARE
    legacy_id_array TEXT[];
    first_legacy_id INTEGER;
    category_uuid UUID;
BEGIN
    -- Virgülle ayrılmış string'i array'e çevir
    legacy_id_array := string_to_array(legacy_ids, ',');
    
    -- İlk legacy ID'yi al (öncelik sırasına göre)
    IF array_length(legacy_id_array, 1) > 0 THEN
        BEGIN
            first_legacy_id := legacy_id_array[1]::INTEGER;
            
            -- Legacy ID'ye göre kategori bul
            SELECT id INTO category_uuid 
            FROM categories 
            WHERE legacy_id = first_legacy_id;
            
            RETURN category_uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Hata durumunda NULL döndür
            RETURN NULL;
        END;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Slug oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_product_slug(product_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Türkçe karakterleri değiştir ve slug formatına çevir
    base_slug := LOWER(
        REGEXP_REPLACE(
            REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    product_name,
                    'ç', 'c'), 'ğ', 'g'), 'ı', 'i'), 'ö', 'o'), 'ş', 's'), 'ü', 'u'),
                'Ç', 'c'), 'Ğ', 'g'), 'I', 'i'), 'İ', 'i'), 'Ö', 'o'), 'Ş', 's'), 'Ü', 'u'),
            '[^a-z0-9]+', '-', 'g'
        )
    );
    
    -- Başındaki ve sonundaki tire'ları kaldır
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Slug benzersizliğini kontrol et
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::TEXT;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Test için ilk 10 ürünü ekle
INSERT INTO products (
    id,
    name,
    slug,
    description,
    price,
    stock_quantity,
    category_id,
    images,
    is_active,
    is_featured,
    track_stock,
    requires_shipping,
    legacy_id,
    meta_title,
    meta_description,
    meta_keywords,
    created_at,
    updated_at
) VALUES 
-- 1. Nostaljik El Atarisi Tetris Atari
(
    gen_random_uuid(),
    'Nostaljik El Atarisi Tetris Atari',
    create_product_slug('Nostaljik El Atarisi Tetris Atari'),
    clean_html_tags('Nostaljik el atarisi tetris 90 lı yılların en güzel oyuncağı nostaljik lezzetler farkıyla sizlerle gönderilecektir ürün rengi stok durumuna göre belirlenmektedir nostalji ek işimiz değil asıl işimizdir diğer nostaljik ürünler için mağazamızı ziyaret edebilirsiniz.'),
    99.00,
    9,
    get_category_id_by_legacy_ids('260,276'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/easyentegre/nostaljik-el-atarisi-tetris-atari-siyahatari-0-550x550h.jpg'],
    true,
    false,
    true,
    true,
    1643,
    'Ruj Modeli Çakmak',
    'Ruj Modeli Çakmak',
    'Ruj Modeli Çakmak',
    NOW(),
    NOW()
),
-- 2. Tahta Kaykay 60x15 cm
(
    gen_random_uuid(),
    'Tahta Kaykay 60x15 cm',
    create_product_slug('Tahta Kaykay 60x15 cm'),
    clean_html_tags('Dayanıklı malzemeden imal edilmiştir. Kaymaz ayak basma yeri Kaliteli rulmanlar sayesinde rahat sürüş sağlar. Stok durumuna göre farklı desen gönderilebilir. ÖLÇÜLERİ: 60x15 cm'),
    300.00,
    5,
    get_category_id_by_legacy_ids('260,263'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/IMG_E0690-removebg-preview-550x550h.png'],
    true,
    false,
    true,
    true,
    664,
    'Icylour Benzinli Muhtar Çakmağı',
    'Icylour Benzinli Muhtar Çakmağı',
    'Icylour Benzinli Muhtar Çakmağı',
    NOW(),
    NOW()
),
-- 3. Clipper Kutulu Icy Çakmak
(
    gen_random_uuid(),
    'Clipper Kutulu Icy Çakmak',
    create_product_slug('Clipper Kutulu Icy Çakmak'),
    clean_html_tags('Clipper Icy Çakmak ürünümüz, Normal çakmak gazı ile alttan tekrar doldurulabilir. Ürün gazlı ve taşlıdır. Dış kısmı ve iç kısmı da metaldir. Alt kısmından alev ayarı kolaylıkla yapabilirsiniz. Günlük kullanım için ideal şık ve kullanışlı bir çakmaktır. Ürün özel hediyelik metal kutusunda gönderilir.'),
    300.00,
    5,
    get_category_id_by_legacy_ids('247,277'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/1-org-zoom-7-1-550x550h.png'],
    true,
    false,
    true,
    true,
    817,
    'Ikmal Seti / Orijinal Benzin - Çakmak Taşı - Fitil (3''lü Set)',
    'Ikmal Seti / Orijinal Benzin - Çakmak Taşı - Fitil (3''lü Set)',
    'Ikmal Seti / Orijinal Benzin - Çakmak Taşı - Fitil (3''lü Set)',
    NOW(),
    NOW()
),
-- 4. Clipper Mat Black
(
    gen_random_uuid(),
    'Clipper Mat Black',
    create_product_slug('Clipper Mat Black'),
    clean_html_tags('Clipper Mat Black Çakmak ürünümüz, Normal çakmak gazı ile alttan tekrar doldurulabilir. Ürün taşlı ve gazlıdır. Dış kısmı ve iç kısmı da metaldir. Alt kısmından alev ayarı kolaylıkla yapabilirsiniz. Günlük kullanım için ideal şık ve kullanışlı bir çakmaktır. Ürün özel hediyelik metal kutusunda gönderilir.'),
    599.00,
    5,
    get_category_id_by_legacy_ids('247,277'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/2_org_zoom-_1_-550x550h.png'],
    true,
    false,
    true,
    true,
    827,
    'Squid Game Beş Taş',
    '',
    '',
    NOW(),
    NOW()
),
-- 5. Clipper Benzin 2 ADET
(
    gen_random_uuid(),
    'Clipper Benzin 2 ADET',
    create_product_slug('Clipper Benzin 2 ADET'),
    clean_html_tags('Clipper Benzin 133 ml''dir.'),
    165.00,
    9,
    get_category_id_by_legacy_ids('247,277'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/easyentegre/clipper-benzin-2-adet-cb2-0153-0-550x550h.jpg'],
    true,
    false,
    true,
    true,
    865,
    'boks dişliği',
    '',
    '',
    NOW(),
    NOW()
),
-- 6. Clipper Benzin
(
    gen_random_uuid(),
    'Clipper Benzin',
    create_product_slug('Clipper Benzin'),
    clean_html_tags('Clipper Benzin 133 ml''dir.'),
    90.00,
    19,
    get_category_id_by_legacy_ids('247,277'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/easyentegre/clipper-benzin-cb2-0129-0-550x550h.jpg'],
    true,
    false,
    true,
    true,
    864,
    'oyuncak helikopter',
    '',
    '',
    NOW(),
    NOW()
),
-- 7. Clipper Orjinal Kutulu Çakmak
(
    gen_random_uuid(),
    'Clipper Orjinal Kutulu Çakmak',
    create_product_slug('Clipper Orjinal Kutulu Çakmak'),
    clean_html_tags('Ürün Orjinal Clipper Çakmak Metaldir. Özel clipper kutusunda gönderilir.'),
    300.00,
    5,
    get_category_id_by_legacy_ids('247,277'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/easyentegre/clipper-orjinal-kutulu-cakmak-cc4-2449-0-550x550h.png'],
    true,
    false,
    true,
    true,
    725,
    'Clipper Kutulu Icy Çakmak',
    'Clipper Kutulu Icy Çakmak',
    'Clipper Kutulu Icy Çakmak',
    NOW(),
    NOW()
),
-- 8. Çakmak Ikmal Seti,4 Bidon Benzin Set4
(
    gen_random_uuid(),
    'Çakmak Ikmal Seti,4 Bidon Benzin Set4',
    create_product_slug('Çakmak Ikmal Seti,4 Bidon Benzin Set4'),
    clean_html_tags('Zippo Çakmak ikmal Seti,4 bidon benzin'),
    610.00,
    50,
    get_category_id_by_legacy_ids('247,275'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/easyentegre/cakmak-ikmal-seti-4-bidon-benzin-set4-0702-0-550x550h.jpg'],
    true,
    false,
    true,
    true,
    1780,
    'Clipper Mat Black',
    'Clipper Mat Black',
    'Clipper Mat Black',
    NOW(),
    NOW()
),
-- 9. Toscow Manyetolu Şeffaf Çakmak 50 Adet (dosyadan kesik görünüyor, placeholder veriler)
(
    gen_random_uuid(),
    'Toscow Manyetolu Şeffaf Çakmak 50 Adet',
    create_product_slug('Toscow Manyetolu Şeffaf Çakmak 50 Adet'),
    'Toscow manyetolu şeffaf çakmak toptan satış',
    250.00,
    5,
    get_category_id_by_legacy_ids('246,248'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/ardahan-logo-1000x230-998x230.png'],
    true,
    false,
    true,
    true,
    875,
    'Toscow Manyetolu Şeffaf Çakmak',
    'Toscow Manyetolu Şeffaf Çakmak',
    'Toscow Manyetolu Şeffaf Çakmak',
    NOW(),
    NOW()
),
-- 10. Test ürünü (placeholder)
(
    gen_random_uuid(),
    'Test Ürünü XML Import',
    create_product_slug('Test Ürünü XML Import'),
    'XML import testi için oluşturulan ürün',
    100.00,
    10,
    get_category_id_by_legacy_ids('276'),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/ardahan-logo-1000x230-998x230.png'],
    true,
    false,
    true,
    true,
    9999,
    'Test XML Import',
    'Test XML Import',
    'Test XML Import',
    NOW(),
    NOW()
);

-- Utility fonksiyonları temizle (isteğe bağlı)
-- DROP FUNCTION IF EXISTS clean_html_tags(TEXT);
-- DROP FUNCTION IF EXISTS get_category_id_by_legacy_ids(TEXT);
-- DROP FUNCTION IF EXISTS create_product_slug(TEXT); 