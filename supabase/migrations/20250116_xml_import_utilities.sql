-- XML Import Utility Functions
-- Bu fonksiyonlar products-final.xml dosyasının import edilmesi için gerekli

-- HTML tag'lerini temizleme fonksiyonu
CREATE OR REPLACE FUNCTION clean_html_tags(html_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF html_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- HTML tag'lerini kaldır ve HTML entity'leri temizle
    RETURN TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(html_text, '<[^>]*>', '', 'g'),
        '&[a-zA-Z0-9#]+;', '', 'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- Kategori ID mapping fonksiyonu (legacy_id'ler ile)
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

-- Slug oluşturma fonksiyonu (Türkçe karakter dönüşümü ile)
CREATE OR REPLACE FUNCTION create_product_slug(product_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Başlangıç kontrolü
    IF product_name IS NULL OR TRIM(product_name) = '' THEN
        RETURN 'urun-' || gen_random_uuid()::TEXT;
    END IF;
    
    -- Küçük harfe çevir
    base_slug := LOWER(product_name);
    
    -- Türkçe karakterleri değiştir
    base_slug := REPLACE(base_slug, 'ç', 'c');
    base_slug := REPLACE(base_slug, 'ğ', 'g');
    base_slug := REPLACE(base_slug, 'ı', 'i');
    base_slug := REPLACE(base_slug, 'ö', 'o');
    base_slug := REPLACE(base_slug, 'ş', 's');
    base_slug := REPLACE(base_slug, 'ü', 'u');
    base_slug := REPLACE(base_slug, 'İ', 'i');
    
    -- Özel karakterleri tire ile değiştir
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-', 'g');
    
    -- Başındaki ve sonundaki tire'ları kaldır
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Boş slug kontrolü
    IF base_slug = '' THEN
        base_slug := 'urun';
    END IF;
    
    -- Slug benzersizliğini kontrol et
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::TEXT;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Batch import için ürün ekleme fonksiyonu
CREATE OR REPLACE FUNCTION import_product_from_xml(
    xml_product_id INTEGER,
    xml_name TEXT,
    xml_categories TEXT,
    xml_quantity INTEGER,
    xml_image_url TEXT,
    xml_price NUMERIC,
    xml_description TEXT,
    xml_meta_title TEXT DEFAULT '',
    xml_meta_description TEXT DEFAULT '',
    xml_meta_keywords TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    new_product_id UUID;
    category_uuid UUID;
    cleaned_description TEXT;
    image_array TEXT[];
BEGIN
    -- Kategori ID'sini al
    category_uuid := get_category_id_by_legacy_ids(xml_categories);
    
    -- Açıklamayı temizle
    cleaned_description := clean_html_tags(xml_description);
    
    -- Görsel array'i oluştur
    IF xml_image_url IS NOT NULL AND TRIM(xml_image_url) != '' THEN
        image_array := ARRAY[xml_image_url];
    ELSE
        image_array := ARRAY['https://ardahanticaret.com/image/cache/catalog/ardahan-logo-1000x230-998x230.png'];
    END IF;
    
    -- Ürünü ekle
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
        xml_name,
        create_product_slug(xml_name),
        cleaned_description,
        COALESCE(xml_price, 0),
        COALESCE(xml_quantity, 0),
        category_uuid,
        image_array,
        true,
        false,
        true,
        true,
        xml_product_id,
        COALESCE(xml_meta_title, ''),
        COALESCE(xml_meta_description, ''),
        COALESCE(xml_meta_keywords, ''),
        NOW(),
        NOW()
    ) RETURNING id INTO new_product_id;
    
    RETURN new_product_id;
END;
$$ LANGUAGE plpgsql;

-- Import sonrası temizlik fonksiyonu (isteğe bağlı)
CREATE OR REPLACE FUNCTION cleanup_xml_import_functions()
RETURNS VOID AS $$
BEGIN
    DROP FUNCTION IF EXISTS clean_html_tags(TEXT);
    DROP FUNCTION IF EXISTS get_category_id_by_legacy_ids(TEXT);
    DROP FUNCTION IF EXISTS create_product_slug(TEXT);
    DROP FUNCTION IF EXISTS import_product_from_xml(INTEGER, TEXT, TEXT, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT);
END;
$$ LANGUAGE plpgsql; 