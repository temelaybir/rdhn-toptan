-- Faturalar tablosunu oluştur veya güncelle

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_guid VARCHAR(255) NOT NULL UNIQUE,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Yeni kolonları ekle (eğer yoksa)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR(100) UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'provider'
  ) THEN
    ALTER TABLE invoices ADD COLUMN provider VARCHAR(50) DEFAULT 'bizimhesap';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_type VARCHAR(20) CHECK (invoice_type IN ('SALES', 'PURCHASE'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'status'
  ) THEN
    ALTER TABLE invoices ADD COLUMN status VARCHAR(50) DEFAULT 'created';
  END IF;
END $$;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_guid ON invoices(invoice_guid);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- Yorumlar
COMMENT ON TABLE invoices IS 'BizimHesap fatura kayıtları';
COMMENT ON COLUMN invoices.order_id IS 'İlişkili sipariş ID';
COMMENT ON COLUMN invoices.invoice_number IS 'Benzersiz fatura numarası (örn: SIP-1760187918741-918741)';
COMMENT ON COLUMN invoices.invoice_guid IS 'BizimHesap fatura GUID';
COMMENT ON COLUMN invoices.invoice_url IS 'BizimHesap fatura URL';
COMMENT ON COLUMN invoices.provider IS 'Fatura sağlayıcı (bizimhesap)';
COMMENT ON COLUMN invoices.invoice_type IS 'Fatura tipi: SALES (satış) veya PURCHASE (alış)';
COMMENT ON COLUMN invoices.status IS 'Fatura durumu (created, sent, cancelled, vb.)';

-- RLS (Row Level Security) politikaları
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admin kullanıcıları tüm faturalara erişebilir (policy varsa önce sil)
DROP POLICY IF EXISTS "Admin users can access all invoices" ON invoices;

CREATE POLICY "Admin users can access all invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

