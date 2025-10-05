-- ============================================================================
-- Customer System Migration - Magic Link Authentication
-- Tarih: 2025-01-27
-- Açıklama: Şifresiz müşteri sistemi, magic link authentication
-- ============================================================================

-- 1. Customers Tablosu (ana müşteri bilgileri)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Temel Bilgiler
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    
    -- Adres Bilgileri (varsayılan adres)
    default_address JSONB,
    
    -- İstatistikler
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    
    -- Müşteri Tercihleri
    accepts_marketing BOOLEAN DEFAULT false,
    accepts_sms BOOLEAN DEFAULT false,
    preferred_language TEXT DEFAULT 'tr',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    first_order_date TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 2. Customer Addresses Tablosu (müşteri adresleri)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Adres Bilgileri
    title TEXT NOT NULL, -- Ev, İş, vs.
    contact_name TEXT NOT NULL,
    phone TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'TR',
    
    -- Adres Tipleri
    is_default BOOLEAN DEFAULT false,
    is_billing BOOLEAN DEFAULT false,
    is_shipping BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Magic Login Tokens Tablosu (şifresiz giriş için)
CREATE TABLE IF NOT EXISTS public.magic_login_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Token Bilgileri
    token TEXT UNIQUE NOT NULL,
    token_hash TEXT NOT NULL, -- Güvenlik için hash'lenmiş token
    
    -- Token Metadata
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    
    -- Güvenlik
    is_used BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Orders tablosunu customers ile ilişkilendir
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- 5. İndeksler oluştur
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON customer_addresses(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_magic_login_tokens_token ON magic_login_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_login_tokens_expires_at ON magic_login_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_login_tokens_customer_id ON magic_login_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- 6. Unique constraint'ler (conditional unique index)
CREATE UNIQUE INDEX IF NOT EXISTS unique_default_address_per_customer 
ON customer_addresses (customer_id) 
WHERE is_default = true;

-- 7. RLS (Row Level Security) politikaları
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_login_tokens ENABLE ROW LEVEL SECURITY;

-- Customers politikaları
CREATE POLICY "Customers can view their own profile" ON customers
    FOR SELECT USING (
        -- Token'dan gelen customer_id ile eşleşme (magic link)
        id = current_setting('app.current_customer_id', true)::uuid
    );

CREATE POLICY "Customers can update their own profile" ON customers
    FOR UPDATE USING (
        id = current_setting('app.current_customer_id', true)::uuid
    );

-- Customer addresses politikaları
CREATE POLICY "Customers can view their own addresses" ON customer_addresses
    FOR SELECT USING (
        customer_id = current_setting('app.current_customer_id', true)::uuid
    );

CREATE POLICY "Customers can manage their own addresses" ON customer_addresses
    FOR ALL USING (
        customer_id = current_setting('app.current_customer_id', true)::uuid
    );

-- Magic tokens politikaları (sadece sistem kullanır)
CREATE POLICY "System can manage magic tokens" ON magic_login_tokens
    FOR ALL USING (true); -- Sadece backend'den erişim

-- 8. Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Sipariş sayısı ve toplam harcama güncelle
    UPDATE customers 
    SET 
        total_orders = (
            SELECT COUNT(*) 
            FROM orders 
            WHERE customer_id = NEW.customer_id 
            AND status IN ('COMPLETED', 'DELIVERED')
        ),
        total_spent = (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE customer_id = NEW.customer_id 
            AND status IN ('COMPLETED', 'DELIVERED')
        ),
        last_order_date = NEW.created_at,
        first_order_date = COALESCE(
            first_order_date,
            NEW.created_at
        )
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger ekle
CREATE TRIGGER update_customer_stats_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.customer_id IS NOT NULL)
    EXECUTE FUNCTION update_customer_stats();

-- 9. Updated at trigger'ları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER customer_addresses_updated_at_trigger
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Utility fonksiyonlar
CREATE OR REPLACE FUNCTION get_customer_by_email(customer_email TEXT)
RETURNS TABLE(customer_data customers) AS $$
BEGIN
    RETURN QUERY
    SELECT c.* FROM customers c WHERE c.email = customer_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Customer System başarıyla kuruldu!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Özellikler:';
    RAISE NOTICE '- Magic Link Authentication';
    RAISE NOTICE '- Şifresiz giriş sistemi';
    RAISE NOTICE '- Müşteri profil yönetimi';
    RAISE NOTICE '- Adres yönetimi';
    RAISE NOTICE '- Sipariş geçmişi';
    RAISE NOTICE '- Otomatik istatistik güncelleme';
    RAISE NOTICE '==================================================';
END $$; 