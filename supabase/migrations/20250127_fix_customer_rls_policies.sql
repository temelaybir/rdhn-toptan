-- RLS Policy Düzeltmeleri - Customer Sistemi
-- Bu migration customers tablosuna eksik INSERT policy'leri ekler

-- 1. Customers için INSERT policy ekle (yeni customer oluşturma)
CREATE POLICY "Allow customer creation" ON customers
    FOR INSERT WITH CHECK (true);

-- 2. Customers için email ile arama policy'si ekle  
DROP POLICY IF EXISTS "Customers can view their own profile" ON customers;

CREATE POLICY "Customers can view profiles" ON customers
    FOR SELECT USING (
        -- Token'dan gelen customer_id ile eşleşme (magic link)
        id = current_setting('app.current_customer_id', true)::uuid
        OR
        -- Admin erişimi
        current_setting('app.admin_access', true)::boolean = true
        OR
        -- Email ile arama için (magic login)
        true
    );

-- 3. Customer addresses için INSERT policy
CREATE POLICY "Customers can create addresses" ON customer_addresses
    FOR INSERT WITH CHECK (true);

-- 4. Magic tokens için daha esnek policy
DROP POLICY IF EXISTS "System can manage magic tokens" ON magic_login_tokens;

CREATE POLICY "Allow magic token operations" ON magic_login_tokens
    FOR ALL USING (true);

-- 5. Orders tablosunda customer_email ile arama için policy güncelle
-- (Sadece policy yoksa ekle)
DO $$
BEGIN
    -- Email ile arama policy'si ekle (eğer yoksa)
    BEGIN
        CREATE POLICY "Allow order search by email" ON orders
            FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy zaten varsa pass
            NULL;
        WHEN others THEN
            -- Diğer hatalar (örn. RLS kapalı) için pass
            NULL;
    END;
END $$;

-- 6. Geçici olarak RLS'yi disable et (development amaçlı)
-- Production'da bu satırları kaldırın
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_addresses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE magic_login_tokens DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE customers IS 'Customer system with magic link authentication - RLS policies updated'; 