-- Faturalar tablosunu oluştur

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL UNIQUE, -- Benzersiz fatura numarası (SIP-XXX-timestamp)
  invoice_guid VARCHAR(255) NOT NULL UNIQUE,
  invoice_url TEXT,
  provider VARCHAR(50) DEFAULT 'bizimhesap',
  invoice_type VARCHAR(20) CHECK (invoice_type IN ('SALES', 'PURCHASE')),
  status VARCHAR(50) DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Admin kullanıcıları tüm faturalara erişebilir
CREATE POLICY "Admin users can access all invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

