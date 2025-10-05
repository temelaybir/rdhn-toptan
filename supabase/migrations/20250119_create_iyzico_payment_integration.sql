-- ============================================================================
-- İyzico Ödeme Entegrasyonu Veritabanı Migration
-- Tarih: 2025-01-19
-- Açıklama: İyzico ödeme sistemi için gerekli tüm tablolar ve konfigürasyonlar
-- ============================================================================

-- 1. İyzico Ayarları Tablosu
CREATE TABLE IF NOT EXISTS public.iyzico_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active BOOLEAN DEFAULT false NOT NULL,
    test_mode BOOLEAN DEFAULT true NOT NULL,
    
    -- API Credentials
    api_key TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    
    -- Sandbox Credentials (Test)
    sandbox_api_key TEXT,
    sandbox_secret_key TEXT,
    
    -- Base URLs
    production_base_url TEXT DEFAULT 'https://api.iyzipay.com' NOT NULL,
    sandbox_base_url TEXT DEFAULT 'https://sandbox-api.iyzipay.com' NOT NULL,
    
    -- Business Settings
    callback_url TEXT, -- 3D Secure geri dönüş URL'i
    webhook_url TEXT,  -- Webhook bildirim URL'i
    
    -- Default Settings
    default_currency TEXT DEFAULT 'TRY' NOT NULL,
    force_3d_secure BOOLEAN DEFAULT true NOT NULL,
    auto_capture BOOLEAN DEFAULT true NOT NULL, -- Otomatik tahsilat
    
    -- Installment Settings
    allow_installments BOOLEAN DEFAULT true NOT NULL,
    max_installment_count INTEGER DEFAULT 12 CHECK (max_installment_count BETWEEN 1 AND 12),
    minimum_installment_amount DECIMAL(10,2) DEFAULT 100.00,
    
    -- Commission Settings
    commission_rate DECIMAL(5,4) DEFAULT 0.0280, -- %2.80 default
    installment_commission_rate DECIMAL(5,4) DEFAULT 0.0320, -- %3.20 for installments
    
    -- Contact & Company Info
    company_name TEXT,
    company_phone TEXT,
    company_email TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Ödeme İşlemleri Tablosu
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference Info
    order_number TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- İyzico Transaction Info
    iyzico_payment_id TEXT UNIQUE, -- İyzico'dan dönen payment ID
    conversation_id TEXT NOT NULL, -- Benzersiz conversation ID
    
    -- Transaction Details
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'TRY' NOT NULL,
    installment INTEGER DEFAULT 1 CHECK (installment BETWEEN 1 AND 12),
    
    -- Payment Method
    payment_channel TEXT, -- MOBILE_WEB, MOBILE_APP, WEB
    payment_group TEXT,   -- PRODUCT, LISTING, SUBSCRIPTION
    payment_source TEXT,  -- API, MOBILE, WEB
    
    -- Card Info (Masked)
    card_family TEXT,      -- Bonus, Maximum, vs.
    card_type TEXT,        -- CREDIT_CARD, DEBIT_CARD
    card_association TEXT, -- VISA, MASTER_CARD, TROY
    card_bin TEXT,         -- İlk 6 hanesi
    last_four_digits TEXT, -- Son 4 hanesi
    card_holder_name TEXT,
    
    -- Transaction Status
    status TEXT DEFAULT 'PENDING' NOT NULL 
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILURE', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUND')),
    
    -- 3D Secure
    is_3d_secure BOOLEAN DEFAULT false,
    auth_code TEXT,        -- 3D Secure auth kodu
    host_reference TEXT,   -- Banka referans kodu
    
    -- Fees & Commission
    paid_price DECIMAL(10,2), -- Müşterinin ödediği tutar (komisyon dahil)
    merchant_commission_rate DECIMAL(5,4),
    merchant_commission_rate_amount DECIMAL(10,2),
    iyzi_commission_rate_amount DECIMAL(10,2),
    
    -- Error Handling
    error_code TEXT,
    error_message TEXT,
    error_group TEXT,
    
    -- İyzico Response Data (JSON)
    iyzico_response JSONB,
    
    -- Address & Contact
    billing_address JSONB,  -- Fatura adresi
    shipping_address JSONB, -- Teslimat adresi
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT unique_conversation_id UNIQUE (conversation_id)
);

-- 3. İyzico Taksit Seçenekleri Tablosu
CREATE TABLE IF NOT EXISTS public.iyzico_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Bank & Card Info
    bank_name TEXT NOT NULL,
    bank_code TEXT,
    card_family TEXT NOT NULL, -- Bonus, Maximum, vs.
    card_type TEXT NOT NULL,   -- CREDIT_CARD, DEBIT_CARD
    card_association TEXT NOT NULL, -- VISA, MASTER_CARD, TROY
    
    -- Installment Options
    installment_count INTEGER NOT NULL CHECK (installment_count BETWEEN 1 AND 12),
    installment_rate DECIMAL(5,4) DEFAULT 0, -- Taksit oranı (0 = tek çekim)
    
    -- Pricing
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2),
    
    -- Settings
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_bank_card_installment 
        UNIQUE (bank_name, card_family, card_type, installment_count)
);

-- 4. Kayıtlı Kartlar Tablosu (Opsiyonel)
CREATE TABLE IF NOT EXISTS public.user_payment_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User Reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- İyzico Card Token
    card_token TEXT NOT NULL, -- İyzico'dan dönen kart token'ı
    card_user_key TEXT NOT NULL, -- Kullanıcı anahtarı
    
    -- Card Info (Masked)
    card_alias TEXT, -- Kullanıcının verdiği isim
    card_family TEXT,
    card_type TEXT,
    card_association TEXT,
    card_bin TEXT,
    last_four_digits TEXT NOT NULL,
    
    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT unique_user_card_token UNIQUE (user_id, card_token)
);

-- 5. İade İşlemleri Tablosu
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference
    payment_transaction_id UUID NOT NULL 
        REFERENCES payment_transactions(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    
    -- İyzico Refund Info
    iyzico_refund_id TEXT UNIQUE,
    conversation_id TEXT NOT NULL,
    
    -- Refund Details
    refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount > 0),
    currency TEXT DEFAULT 'TRY' NOT NULL,
    reason TEXT,
    
    -- Status
    status TEXT DEFAULT 'PENDING' NOT NULL 
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILURE')),
    
    -- Error Handling
    error_code TEXT,
    error_message TEXT,
    
    -- İyzico Response
    iyzico_response JSONB,
    
    -- Admin Info
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_note TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT unique_refund_conversation_id UNIQUE (conversation_id)
);

-- ============================================================================
-- INDEXES & PERFORMANCE
-- ============================================================================

-- Payment Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_number 
    ON payment_transactions(order_number);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id 
    ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
    ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at 
    ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_iyzico_payment_id 
    ON payment_transactions(iyzico_payment_id);

-- User Cards Indexes
CREATE INDEX IF NOT EXISTS idx_user_payment_cards_user_id 
    ON user_payment_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_cards_is_default 
    ON user_payment_cards(user_id, is_default) WHERE is_default = true;

-- Refunds Indexes
CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction_id 
    ON payment_refunds(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_number 
    ON payment_refunds(order_number);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.iyzico_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iyzico_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

-- İyzico Settings - Sadece admin erişimi
CREATE POLICY "iyzico_settings_admin_only" ON public.iyzico_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

-- Payment Transactions - Kullanıcılar sadece kendi işlemlerini görebilir
CREATE POLICY "payment_transactions_user_own" ON public.payment_transactions
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "payment_transactions_admin_all" ON public.payment_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

-- Installments - Herkes okuyabilir
CREATE POLICY "installments_read_all" ON public.iyzico_installments
    FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "installments_admin_write" ON public.iyzico_installments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

-- User Cards - Kullanıcılar sadece kendi kartlarını görebilir
CREATE POLICY "user_cards_own_only" ON public.user_payment_cards
    FOR ALL USING (user_id = auth.uid());

-- Refunds - Admin ve ilgili kullanıcı görebilir
CREATE POLICY "refunds_user_and_admin" ON public.payment_refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payment_transactions pt
            WHERE pt.id = payment_refunds.payment_transaction_id
            AND (pt.user_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM auth.users 
                     WHERE auth.users.id = auth.uid() 
                     AND auth.users.role = 'admin'
                 ))
        )
    );

CREATE POLICY "refunds_admin_write" ON public.payment_refunds
    FOR INSERT, UPDATE, DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_iyzico_settings_updated_at 
    BEFORE UPDATE ON public.iyzico_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON public.payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_iyzico_installments_updated_at 
    BEFORE UPDATE ON public.iyzico_installments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_payment_cards_updated_at 
    BEFORE UPDATE ON public.user_payment_cards 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at 
    BEFORE UPDATE ON public.payment_refunds 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Default İyzico Settings (Test Mode)
INSERT INTO public.iyzico_settings (
    is_active,
    test_mode,
    api_key,
    secret_key,
    sandbox_api_key,
    sandbox_secret_key,
    callback_url,
    company_name,
    company_email
) VALUES (
    false, -- Initially inactive
    true,  -- Test mode
    'sandbox-api-key-placeholder',
    'sandbox-secret-key-placeholder',
    'sandbox-api-key-placeholder',
    'sandbox-secret-key-placeholder',
    'https://yourdomain.com/api/payment/iyzico/callback',
    'RDHN Commerce',
    'info@rdhncommerce.com'
) ON CONFLICT DO NOTHING;

-- Default Installment Options (Common Turkish Banks)
INSERT INTO public.iyzico_installments (bank_name, card_family, card_type, card_association, installment_count, installment_rate, min_amount) VALUES
-- Tek Çekim
('Akbank', 'Bonus', 'CREDIT_CARD', 'VISA', 1, 0.0000, 0),
('Akbank', 'Bonus', 'CREDIT_CARD', 'MASTER_CARD', 1, 0.0000, 0),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'VISA', 1, 0.0000, 0),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'MASTER_CARD', 1, 0.0000, 0),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'VISA', 1, 0.0000, 0),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'MASTER_CARD', 1, 0.0000, 0),

-- 2 Taksit
('Akbank', 'Bonus', 'CREDIT_CARD', 'VISA', 2, 0.0000, 200),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'VISA', 2, 0.0000, 200),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'VISA', 2, 0.0000, 200),

-- 3 Taksit
('Akbank', 'Bonus', 'CREDIT_CARD', 'VISA', 3, 0.0000, 300),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'VISA', 3, 0.0000, 300),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'VISA', 3, 0.0000, 300),

-- 6 Taksit
('Akbank', 'Bonus', 'CREDIT_CARD', 'VISA', 6, 0.0490, 600),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'VISA', 6, 0.0520, 600),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'VISA', 6, 0.0480, 600),

-- 9 Taksit  
('Akbank', 'Bonus', 'CREDIT_CARD', 'VISA', 9, 0.0790, 900),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'VISA', 9, 0.0820, 900),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'VISA', 9, 0.0770, 900),

-- 12 Taksit
('Akbank', 'Bonus', 'CREDIT_CARD', 'VISA', 12, 0.1190, 1200),
('İş Bankası', 'Maximum', 'CREDIT_CARD', 'VISA', 12, 0.1220, 1200),
('Garanti BBVA', 'Bonus', 'CREDIT_CARD', 'VISA', 12, 0.1170, 1200)

ON CONFLICT (bank_name, card_family, card_type, installment_count) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.iyzico_settings IS 'İyzico ödeme sistemi genel ayarları';
COMMENT ON TABLE public.payment_transactions IS 'Tüm ödeme işlemlerinin kayıtları';
COMMENT ON TABLE public.iyzico_installments IS 'Banka ve kart bazlı taksit seçenekleri';
COMMENT ON TABLE public.user_payment_cards IS 'Kullanıcıların kayıtlı kartları';
COMMENT ON TABLE public.payment_refunds IS 'İade işlemleri kayıtları';

COMMENT ON COLUMN public.payment_transactions.conversation_id IS 'Her işlem için benzersiz ID - İyzico ile eşleştirme için kritik';
COMMENT ON COLUMN public.payment_transactions.iyzico_response IS 'İyzico''dan dönen tüm response JSON olarak saklanır';
COMMENT ON COLUMN public.iyzico_installments.installment_rate IS 'Taksit oranı - 0.0490 = %4.90 komisyon';

-- Migration tamamlandı
SELECT 'İyzico Payment Integration migration completed successfully!' as result; 