-- Eksik ürünü veritabanına ekle
-- Migration: 20250110_add_missing_product_576972960
-- Ürün: Bk Jet 1975 Torch Turbo Pürmüz Çakmak Mavi Doldurulabilir Hazneli

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
) VALUES (
    gen_random_uuid(),
    'Bk Jet 1975 Torch Turbo Pürmüz Çakmak Mavi Doldurulabilir Hazneli',
    'bk-jet-1975-torch-turbo-purumuz-cakmak-mavi-doldurulabilir-hazneli',
    'Bk Jet 1975 Torch Turbo Pürmüz Çakmak Mavi Rüzgar ve yağmurda yanabilen torch özelliği sayesinde çakmak yatay ve baş aşağı şekilde kullanılır. Ürün gazı dolu şekilde gönderilir. Ürün gazı bittiğinde tekrar doldurabilir. Ürün Uzunluğu: 11 Cm',
    0.76,
    10,
    (SELECT id FROM categories WHERE name = 'Çakmak' LIMIT 1),
    ARRAY['https://ardahanticaret.com/image/cache/catalog/ardahan-logo-1000x230-998x230.png'],
    true,
    false,
    true,
    true,
    576972960,
    'Bk Jet 1975 Torch Turbo Pürmüz Çakmak Mavi Doldurulabilir Hazneli',
    'Bk Jet 1975 Torch Turbo Pürmüz Çakmak Mavi Doldurulabilir Hazneli - Rüzgar ve yağmurda yanabilen torch özelliği',
    'çakmak, torch, pürmüz, bk jet, doldurulabilir',
    NOW(),
    NOW()
) ON CONFLICT (legacy_id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    updated_at = NOW();
