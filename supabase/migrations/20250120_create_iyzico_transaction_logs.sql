-- İyzico Transaction Logs Migration
-- Tüm İyzico işlemlerini detaylı logging için

-- Transaction logs tablosu
CREATE TABLE IF NOT EXISTS iyzico_transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- İşlem bilgileri
  conversation_id TEXT NOT NULL,
  order_number TEXT,
  payment_id TEXT,
  
  -- İşlem durumu
  operation_type TEXT NOT NULL, -- 'initialize', 'callback', 'webhook', 'test'
  status TEXT NOT NULL, -- 'pending', 'success', 'failure', 'error'
  
  -- Request/Response
  request_data JSONB,
  response_data JSONB,
  error_data JSONB,
  
  -- İyzico spesifik
  iyzico_status TEXT,
  iyzico_error_code TEXT,
  iyzico_error_message TEXT,
  
  -- Debug bilgileri
  user_agent TEXT,
  ip_address TEXT,
  session_info JSONB,
  
  -- Timing
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_iyzico_logs_conversation_id ON iyzico_transaction_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_iyzico_logs_order_number ON iyzico_transaction_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_iyzico_logs_operation_type ON iyzico_transaction_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_iyzico_logs_status ON iyzico_transaction_logs(status);
CREATE INDEX IF NOT EXISTS idx_iyzico_logs_created_at ON iyzico_transaction_logs(created_at DESC);

-- RLS politikaları
ALTER TABLE iyzico_transaction_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin can manage transaction logs" ON iyzico_transaction_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- Public read access for system operations
CREATE POLICY "System can write transaction logs" ON iyzico_transaction_logs
  FOR INSERT WITH CHECK (true);

-- İyzico debug events tablosu
CREATE TABLE IF NOT EXISTS iyzico_debug_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event bilgileri
  event_type TEXT NOT NULL, -- 'api_call', 'auth_generation', 'parsing_error', 'validation_error'
  severity TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  
  -- Context
  conversation_id TEXT,
  operation_context TEXT,
  
  -- Event data
  event_data JSONB,
  error_stack TEXT,
  
  -- Environment
  environment TEXT, -- 'development', 'production'
  user_session_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debug events indeksleri
CREATE INDEX IF NOT EXISTS idx_debug_events_type ON iyzico_debug_events(event_type);
CREATE INDEX IF NOT EXISTS idx_debug_events_severity ON iyzico_debug_events(severity);
CREATE INDEX IF NOT EXISTS idx_debug_events_created_at ON iyzico_debug_events(created_at DESC);

-- Debug events RLS
ALTER TABLE iyzico_debug_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage debug events" ON iyzico_debug_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can write debug events" ON iyzico_debug_events
  FOR INSERT WITH CHECK (true);

-- İyzico 3D Secure sessions tablosu
CREATE TABLE IF NOT EXISTS iyzico_3ds_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session bilgileri
  conversation_id TEXT NOT NULL UNIQUE,
  order_number TEXT NOT NULL,
  
  -- 3DS durum bilgileri
  status TEXT NOT NULL DEFAULT 'initialized', -- 'initialized', 'redirected', 'completed', 'failed'
  
  -- İyzico response data
  payment_id TEXT,
  three_ds_html_content TEXT,
  payment_page_url TEXT,
  
  -- Müşteri bilgileri
  customer_email TEXT,
  customer_phone TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'TRY',
  
  -- Tracking
  initialized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redirected_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_callback_at TIMESTAMP WITH TIME ZONE,
  
  -- Debug data
  session_data JSONB,
  callback_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3DS sessions indeksleri
CREATE INDEX IF NOT EXISTS idx_3ds_sessions_conversation_id ON iyzico_3ds_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_3ds_sessions_order_number ON iyzico_3ds_sessions(order_number);
CREATE INDEX IF NOT EXISTS idx_3ds_sessions_status ON iyzico_3ds_sessions(status);

-- 3DS sessions RLS
ALTER TABLE iyzico_3ds_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage 3DS sessions" ON iyzico_3ds_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can manage 3DS sessions" ON iyzico_3ds_sessions
  FOR ALL WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_iyzico_transaction_logs_updated_at 
  BEFORE UPDATE ON iyzico_transaction_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iyzico_3ds_sessions_updated_at 
  BEFORE UPDATE ON iyzico_3ds_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success!
SELECT 'İyzico logging tables created successfully!' as result; 