-- Import new products from urunnew.txt
-- Formatted for correct database schema

INSERT INTO products (
  name,
  slug,
  category_id,
  price,
  stock_quantity,
  images,
  description,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Zippo Benzini 3'lü (category: 247)
(
  'Zippo Benzini 3''lü',
  'zippo-benzini-3-lu',
  (SELECT id FROM categories WHERE legacy_id = 247 LIMIT 1),
  599.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Zippo çakmaklar için özel benzin 3''lü set',
  true,
  NOW(),
  NOW()
),

-- YELPAZE Desenli Yelpaze (category: 276) 
(
  'YELPAZE Desenli Yelpaze',
  'yelpaze-desenli-yelpaze',
  (SELECT id FROM categories WHERE legacy_id = 276 LIMIT 1),
  59.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Desenli dekoratif yelpaze',
  true,
  NOW(),
  NOW()
),

-- Çiçek Desenli Dantelli Plastik Yelpaze (category: 276)
(
  'Çiçek Desenli Dantelli Plastik Yelpaze',
  'cicek-desenli-dantelli-plastik-yelpaze',
  (SELECT id FROM categories WHERE legacy_id = 276 LIMIT 1),
  110.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Çiçek desenli dantelli plastik yelpaze',
  true,
  NOW(),
  NOW()
),

-- Çakmak İkmal Seti,4 Bidon Benzin Set4 (category: 275)
(
  'Çakmak İkmal Seti, 4 Bidon Benzin Set4',
  'cakmak-ikmal-seti-4-bidon-benzin-set4',
  (SELECT id FROM categories WHERE legacy_id = 275 LIMIT 1),
  610.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Çakmak ikmal seti 4 bidon benzin ile',
  true,
  NOW(),
  NOW()
),

-- Pipo Tasarımlı Tütün Ürünleri İçilebilen Lüks Metal Kişiye Özel Pipo Çakmak (category: 314)
(
  'Pipo Tasarımlı Tütün Ürünleri İçilebilen Lüks Metal Kişiye Özel Pipo Çakmak',
  'pipo-tasarimli-tutun-urunleri-icilebilen-luks-metal-kisiye-ozel-pipo-cakmak',
  (SELECT id FROM categories WHERE legacy_id = 314 LIMIT 1),
  450.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Pipo tasarımlı lüks metal çakmak, kişiye özel',
  true,
  NOW(),
  NOW()
),

-- Pipo Tasarımlı Tütün Ürünleri İçilebilen Lüks Metal Pipo Çakmak Kişiye Özel (category: 314)
(
  'Pipo Tasarımlı Tütün Ürünleri İçilebilen Lüks Metal Pipo Çakmak Kişiye Özel Lazer Baskılı',
  'pipo-tasarimli-tutun-urunleri-icilebilen-luks-metal-pipo-cakmak-kisiye-ozel-lazer-baskili',
  (SELECT id FROM categories WHERE legacy_id = 314 LIMIT 1),
  450.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Pipo tasarımlı lüks metal çakmak, kişiye özel lazer baskılı hediye',
  true,
  NOW(),
  NOW()
),

-- Koko Çakmak Manyetolu 518 Şeffaf 5 Adet (category: 260)
(
  'Koko Çakmak Manyetolu 518 Şeffaf 5 Adet Tabaka Modeline Uygun',
  'koko-cakmak-manyetolu-518-seffaf-5-adet-tabaka-modeline-uygun',
  (SELECT id FROM categories WHERE legacy_id = 260 LIMIT 1),
  150.00,
  50,
  ARRAY['/placeholder-product.svg'],
  'Koko çakmak manyetolu 518 şeffaf 5 adet tabaka modeline uygun',
  true,
  NOW(),
  NOW()
),

-- Muhtar Çakmağı Benzin (category: 247)
(
  'Muhtar Çakmağı Benzin',
  'muhtar-cakmagi-benzin',
  (SELECT id FROM categories WHERE legacy_id = 247 LIMIT 1),
  425.00,
  49,
  ARRAY['/placeholder-product.svg'],
  'Muhtar çakmağı benzinli model',
  true,
  NOW(),
  NOW()
),

-- Koko Çakmak Manyetolu 518 Şeffaf 10 Adet (category: 233)
(
  'Koko Çakmak Manyetolu 518 Şeffaf 10 Adet Tabaka Modeline Uygun',
  'koko-cakmak-manyetolu-518-seffaf-10-adet-tabaka-modeline-uygun',
  (SELECT id FROM categories WHERE legacy_id = 233 LIMIT 1),
  150.00,
  49,
  ARRAY['/placeholder-product.svg'],
  'Koko çakmak manyetolu 518 şeffaf 10 adet tabaka modeline uygun',
  true,
  NOW(),
  NOW()
),

-- Als Tobacco 3 Pürmüz Çakmak (category: 241)
(
  'Als Tobacco 3 Pürmüz Çakmak',
  'als-tobacco-3-purmuz-cakmak',
  (SELECT id FROM categories WHERE legacy_id = 241 LIMIT 1),
  299.00,
  47,
  ARRAY['/placeholder-product.svg'],
  'Als Tobacco 3 pürmüz çakmak',
  true,
  NOW(),
  NOW()
);

-- Log the import
INSERT INTO admin_logs (action, details, created_at) 
VALUES ('PRODUCT_IMPORT', 'Imported 10 new products from urunnew.txt', NOW()); 