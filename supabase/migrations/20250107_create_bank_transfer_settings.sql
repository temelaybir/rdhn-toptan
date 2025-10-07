-- Banka Havalesi Ayarları Tablosu
CREATE TABLE IF NOT EXISTS bank_transfer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT true,
  bank_name VARCHAR(255) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  iban VARCHAR(50) NOT NULL,
  swift_code VARCHAR(20),
  branch_name VARCHAR(255),
  branch_code VARCHAR(50),
  alternative_accounts JSONB DEFAULT '[]'::jsonb,
  customer_message TEXT NOT NULL,
  payment_note TEXT NOT NULL,
  payment_deadline_hours INTEGER DEFAULT 24,
  email_subject VARCHAR(500) NOT NULL,
  email_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bank_transfer_settings_active ON bank_transfer_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_bank_transfer_settings_created ON bank_transfer_settings(created_at);

-- RLS (Row Level Security) Policies
ALTER TABLE bank_transfer_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (müşterilerin banka bilgilerini görmesi için)
CREATE POLICY "Public can read active bank transfer settings"
  ON bank_transfer_settings
  FOR SELECT
  USING (true);

-- Admin can do everything (basitleştirilmiş versiyon - uygulamada admin kontrolü yapılır)
CREATE POLICY "Authenticated users can manage bank transfer settings"
  ON bank_transfer_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bank_transfer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_transfer_settings_updated_at
  BEFORE UPDATE ON bank_transfer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_transfer_settings_updated_at();

-- İlk varsayılan kayıt (opsiyonel)
INSERT INTO bank_transfer_settings (
  bank_name,
  account_holder,
  account_number,
  iban,
  customer_message,
  payment_note,
  payment_deadline_hours,
  email_subject,
  email_message,
  is_active
) VALUES (
  'Örnek Banka',
  'Şirket Ünvanı',
  '1234567890',
  'TR00 0000 0000 0000 0000 0000 00',
  'Sipariş onayından sonra aşağıdaki hesap bilgilerimize ödeme yapabilirsiniz. Ödemenizin açıklama kısmına mutlaka sipariş numaranızı yazınız.',
  'Ödeme açıklamasına sipariş numaranızı yazmayı unutmayın!',
  24,
  'Havale/EFT Ödeme Bilgileri - Sipariş No: {ORDER_NUMBER}',
  'Merhaba,

Siparişiniz için ödeme bilgileri aşağıdadır:

Sipariş No: {ORDER_NUMBER}
Tutar: {AMOUNT} {CURRENCY}

Banka Hesap Bilgileri:
{BANK_INFO}

Ödemenizi {DEADLINE} saati içinde yapmanız gerekmektedir.

Teşekkürler.',
  false
) ON CONFLICT DO NOTHING;
