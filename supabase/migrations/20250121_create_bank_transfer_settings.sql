-- ============================================================================
-- Banka Havalesi Ödeme Yöntemi Ayarları Migration
-- Tarih: 2025-01-21
-- Açıklama: Banka havalesi ödeme yöntemi için ayarlar tablosu ve ödeme yöntemleri kontrolü
-- ============================================================================

-- 1. Banka Havalesi Ayarları Tablosu
CREATE TABLE IF NOT EXISTS public.bank_transfer_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    -- Banka Hesap Bilgileri
    bank_name TEXT NOT NULL DEFAULT 'Örnek Bankası',
    account_holder TEXT NOT NULL DEFAULT 'RDHN COMMERCE A.Ş.',
    account_number TEXT NOT NULL DEFAULT '1234567890123456',
    iban TEXT NOT NULL DEFAULT 'TR12 3456 7890 1234 5678 9012 34',
    swift_code TEXT DEFAULT 'TRBKTR2A',
    branch_name TEXT DEFAULT 'MERKEZ ŞUBE',
    branch_code TEXT DEFAULT '001',
    
    -- Alternatif Hesaplar (JSON)
    alternative_accounts JSONB DEFAULT '[]',
    
    -- Müşteri Mesajları
    customer_message TEXT DEFAULT 'Sipariş onayından sonra aşağıdaki hesap bilgilerimize ödeme yapabilirsiniz. Ödemenizin açıklama kısmına mutlaka sipariş numaranızı yazınız.',
    payment_note TEXT DEFAULT 'Ödeme açıklamasına sipariş numaranızı yazmayı unutmayın!',
    payment_deadline_hours INTEGER DEFAULT 24 NOT NULL,
    
    -- E-posta Mesajları
    email_subject TEXT DEFAULT 'Havale/EFT Ödeme Bilgileri - Sipariş No: {ORDER_NUMBER}',
    email_message TEXT DEFAULT 'Merhaba,\n\nSiparişiniz için ödeme bilgileri aşağıdadır:\n\nSipariş No: {ORDER_NUMBER}\nTutar: {AMOUNT} {CURRENCY}\n\nBanka Hesap Bilgileri:\n{BANK_INFO}\n\nÖdemenizi {DEADLINE} saati içinde yapmanız gerekmektedir.\n\nTeşekkürler.',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Ödeme Yöntemleri Kontrol Tablosu
CREATE TABLE IF NOT EXISTS public.payment_method_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    method_type TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    display_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon TEXT DEFAULT 'CreditCard',
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Varsayılan Banka Havalesi Ayarları Ekle
INSERT INTO public.bank_transfer_settings (
    is_active,
    bank_name,
    account_holder,
    account_number,
    iban,
    customer_message,
    payment_note
) VALUES (
    true,
    'Örnek Bankası',
    'RDHN COMMERCE A.Ş.',
    '1234567890123456',
    'TR12 3456 7890 1234 5678 9012 34',
    'Sipariş onayından sonra aşağıdaki hesap bilgilerimize ödeme yapabilirsiniz. Ödemenizin açıklama kısmına mutlaka sipariş numaranızı yazınız.',
    'Ödeme açıklamasına sipariş numaranızı yazmayı unutmayın!'
) ON CONFLICT DO NOTHING;

-- 4. Varsayılan Ödeme Yöntemleri Ekle
INSERT INTO public.payment_method_settings (method_type, is_active, display_name, display_order, icon, description) VALUES
('credit_card', true, 'Kredi Kartı', 1, 'CreditCard', 'Tüm kredi kartları kabul edilir'),
('debit_card', true, 'Banka Kartı', 2, 'CreditCard', 'Banka kartları ile ödeme'),
('bank_transfer', true, 'Havale/EFT', 3, 'Banknote', 'Banka havalesi veya EFT ile ödeme')
ON CONFLICT (method_type) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description;

-- 5. Güncelleme trigger'ları oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları ekle
CREATE TRIGGER update_bank_transfer_settings_updated_at
    BEFORE UPDATE ON public.bank_transfer_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_method_settings_updated_at
    BEFORE UPDATE ON public.payment_method_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS Policies (Admin-only access)
ALTER TABLE public.bank_transfer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_method_settings ENABLE ROW LEVEL SECURITY;

-- Admin okuma politikası
CREATE POLICY "Admin can read bank transfer settings" ON public.bank_transfer_settings
    FOR SELECT USING (true);

CREATE POLICY "Admin can read payment method settings" ON public.payment_method_settings
    FOR SELECT USING (true);

-- Admin yazma politikası (şimdilik herkese açık, sonra auth eklenebilir)
CREATE POLICY "Admin can modify bank transfer settings" ON public.bank_transfer_settings
    FOR ALL USING (true);

CREATE POLICY "Admin can modify payment method settings" ON public.payment_method_settings
    FOR ALL USING (true);

-- 7. İndeksler
CREATE INDEX IF NOT EXISTS idx_payment_method_settings_type ON public.payment_method_settings(method_type);
CREATE INDEX IF NOT EXISTS idx_payment_method_settings_active ON public.payment_method_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_method_settings_order ON public.payment_method_settings(display_order);

-- 8. Açıklamalar
COMMENT ON TABLE public.bank_transfer_settings IS 'Banka havalesi ödeme yöntemi ayarları';
COMMENT ON TABLE public.payment_method_settings IS 'Ödeme yöntemlerinin aktif/pasif durumu ve görünüm ayarları';

COMMENT ON COLUMN public.bank_transfer_settings.alternative_accounts IS 'Alternatif banka hesapları JSON formatında';
COMMENT ON COLUMN public.bank_transfer_settings.payment_deadline_hours IS 'Ödeme için verilen süre (saat)';
COMMENT ON COLUMN public.payment_method_settings.method_type IS 'Ödeme yöntemi tipi (credit_card, debit_card, bank_transfer vb.)';
COMMENT ON COLUMN public.payment_method_settings.display_order IS 'Ödeme yöntemlerinin görüntülenme sırası'; 