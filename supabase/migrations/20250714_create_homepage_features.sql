-- Create hero_slides table for homepage carousel
CREATE TABLE IF NOT EXISTS hero_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link_url TEXT NOT NULL,
    button_text TEXT DEFAULT 'Keşfet',
    badge_text TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create campaign_banners table
CREATE TABLE IF NOT EXISTS campaign_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    color_theme TEXT, -- for gradient colors like 'from-red-600 to-red-800'
    size VARCHAR(20) DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create featured_brands table
CREATE TABLE IF NOT EXISTS featured_brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    campaign_text TEXT, -- like '%30 İndirim'
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create product_collections table for dynamic product carousels
CREATE TABLE IF NOT EXISTS product_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    collection_type VARCHAR(50) NOT NULL CHECK (collection_type IN ('super_deals', 'best_sellers', 'new_arrivals', 'featured', 'custom')),
    view_all_link TEXT,
    show_timer BOOLEAN DEFAULT false,
    timer_end_date TIMESTAMP WITH TIME ZONE,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create product_collection_items table to link products to collections
CREATE TABLE IF NOT EXISTS product_collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_position INTEGER DEFAULT 0,
    badge_text TEXT, -- like 'Süper Fiyat', 'Yeni'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(collection_id, product_id)
);

-- Add indexes for better performance
CREATE INDEX idx_hero_slides_active ON hero_slides(is_active, order_position);
CREATE INDEX idx_hero_slides_dates ON hero_slides(start_date, end_date);
CREATE INDEX idx_campaign_banners_active ON campaign_banners(is_active, order_position);
CREATE INDEX idx_campaign_banners_dates ON campaign_banners(start_date, end_date);
CREATE INDEX idx_featured_brands_active ON featured_brands(is_active, order_position);
CREATE INDEX idx_product_collections_active ON product_collections(is_active, order_position);
CREATE INDEX idx_product_collections_type ON product_collections(collection_type);
CREATE INDEX idx_product_collection_items_collection ON product_collection_items(collection_id);
CREATE INDEX idx_product_collection_items_product ON product_collection_items(product_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON hero_slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_banners_updated_at BEFORE UPDATE ON campaign_banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_featured_brands_updated_at BEFORE UPDATE ON featured_brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_collections_updated_at BEFORE UPDATE ON product_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_collection_items ENABLE ROW LEVEL SECURITY;

-- Public read access for all homepage features
CREATE POLICY "Public can view active hero slides" ON hero_slides
    FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Public can view active campaign banners" ON campaign_banners
    FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Public can view active featured brands" ON featured_brands
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active product collections" ON product_collections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view collection items" ON product_collection_items
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM product_collections pc 
        WHERE pc.id = collection_id AND pc.is_active = true
    ));

-- Admin policies (assuming admin check function exists)
CREATE POLICY "Admins can manage hero slides" ON hero_slides
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage campaign banners" ON campaign_banners
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage featured brands" ON featured_brands
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage product collections" ON product_collections
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage collection items" ON product_collection_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert some sample data
INSERT INTO hero_slides (title, subtitle, image_url, mobile_image_url, link_url, button_text, badge_text, order_position) VALUES
('Kış Koleksiyonu', 'Sezonun en trend parçaları %50''ye varan indirimlerle', '/placeholder-product.svg', '/placeholder-product.svg', '/kategoriler/giyim', 'Alışverişe Başla', 'Yeni Sezon', 1),
('Teknoloji Festivali', 'Elektronik ürünlerde büyük fırsatlar', '/placeholder-product.svg', '/placeholder-product.svg', '/kategoriler/elektronik', 'Fırsatları Keşfet', 'Süper Fiyat', 2),
('Ev & Yaşam', 'Evinizi yenileyin, konforunuzu artırın', '/placeholder-product.svg', '/placeholder-product.svg', '/kategoriler/ev-yasam', 'Ürünleri İncele', NULL, 3);

INSERT INTO campaign_banners (title, subtitle, image_url, link_url, color_theme, size, order_position) VALUES
('Yılbaşı Alışverişi', 'Hediyeler %60''a varan indirimlerle', '/placeholder-product.svg', '/kampanyalar/yilbasi', 'from-red-600 to-red-800', 'large', 1),
('Teknoloji Haftası', 'Laptop ve telefonda süper fiyatlar', '/placeholder-product.svg', '/kampanyalar/teknoloji', 'from-blue-600 to-blue-800', 'medium', 2),
('Moda Festivali', '3 Al 2 Öde', '/placeholder-product.svg', '/kampanyalar/moda', 'from-purple-600 to-purple-800', 'medium', 3);

INSERT INTO featured_brands (name, logo_url, link_url, campaign_text, order_position) VALUES
('Nike', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png', '/markalar/nike', '%30 İndirim', 1),
('Adidas', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png', '/markalar/adidas', NULL, 2),
('Apple', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png', '/markalar/apple', 'Ücretsiz Kargo', 3),
('Samsung', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png', '/markalar/samsung', NULL, 4);