-- ============================================================================
-- Admin Authentication System Migration
-- Tarih: 2025-01-20
-- Açıklama: Admin paneli için güvenli kullanıcı ve session yönetimi
-- ============================================================================

-- 1. Admin Kullanıcıları Tablosu
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Kullanıcı Bilgileri
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
    email TEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password_hash TEXT NOT NULL,
    
    -- Profil Bilgileri
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    
    -- Yetkilendirme
    role TEXT DEFAULT 'admin' NOT NULL 
        CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '[]'::jsonb, -- Specific permissions array
    
    -- Güvenlik
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    force_password_change BOOLEAN DEFAULT true NOT NULL,
    
    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
    two_factor_secret TEXT, -- TOTP secret
    backup_codes TEXT[], -- Recovery codes
    
    -- Login & Session Management
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id)
);

-- 2. Admin Session Tablosu
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Session Info
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    
    -- Session Details
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB, -- Country, city, etc.
    
    -- Timing
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Security
    is_active BOOLEAN DEFAULT true NOT NULL,
    logout_reason TEXT, -- 'user_logout', 'timeout', 'security', 'admin_revoked'
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Admin Aktivite Logları
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Who & What
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'login', 'logout', 'create_product', 'update_settings', etc.
    resource_type TEXT, -- 'product', 'category', 'user', 'settings', etc.
    resource_id TEXT, -- ID of the affected resource
    
    -- Details
    description TEXT,
    old_values JSONB, -- Before state
    new_values JSONB, -- After state
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES admin_sessions(id) ON DELETE SET NULL,
    
    -- Result
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
    error_message TEXT,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Admin Permissions (Role-Based)
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Permission Details
    name TEXT UNIQUE NOT NULL, -- 'products.create', 'products.edit', 'settings.view', etc.
    description TEXT,
    category TEXT, -- 'products', 'orders', 'users', 'settings', 'reports'
    
    -- Metadata
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Role Permission Mapping
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL,
    permission_name TEXT NOT NULL REFERENCES admin_permissions(name) ON DELETE CASCADE,
    
    -- Constraints
    UNIQUE(role, permission_name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Admin Users Indexes
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
CREATE INDEX idx_admin_users_last_login ON admin_users(last_login_at);

-- Admin Sessions Indexes
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_activity ON admin_sessions(last_activity_at);

-- Activity Logs Indexes
CREATE INDEX idx_admin_activity_user ON admin_activity_logs(admin_user_id);
CREATE INDEX idx_admin_activity_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_resource ON admin_activity_logs(resource_type, resource_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_logs(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_sessions_updated_at 
    BEFORE UPDATE ON admin_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Clean expired sessions function
CREATE OR REPLACE FUNCTION clean_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deactivate expired sessions
    UPDATE admin_sessions 
    SET is_active = false, logout_reason = 'timeout'
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old inactive sessions (older than 30 days)
    DELETE FROM admin_sessions 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Password validation function
CREATE OR REPLACE FUNCTION validate_admin_password(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Password must be at least 8 characters
    IF length(password) < 8 THEN
        RETURN false;
    END IF;
    
    -- Must contain at least one uppercase letter
    IF password !~ '[A-Z]' THEN
        RETURN false;
    END IF;
    
    -- Must contain at least one lowercase letter
    IF password !~ '[a-z]' THEN
        RETURN false;
    END IF;
    
    -- Must contain at least one number
    IF password !~ '[0-9]' THEN
        RETURN false;
    END IF;
    
    -- Must contain at least one special character
    IF password !~ '[^A-Za-z0-9]' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_permissions ENABLE ROW LEVEL SECURITY;

-- Admin Users Policies (Very restrictive - only for specific admin operations)
CREATE POLICY "admin_users_select_own" ON admin_users
    FOR SELECT USING (
        id = current_setting('app.current_admin_user_id', true)::uuid
    );

-- Admin Sessions Policies
CREATE POLICY "admin_sessions_own_sessions" ON admin_sessions
    FOR ALL USING (
        admin_user_id = current_setting('app.current_admin_user_id', true)::uuid
    );

-- Activity Logs (Read-only for auditing)
CREATE POLICY "admin_activity_logs_insert" ON admin_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_activity_logs_select" ON admin_activity_logs
    FOR SELECT USING (true);

-- Permissions (Read-only)
CREATE POLICY "admin_permissions_select" ON admin_permissions
    FOR SELECT USING (true);

CREATE POLICY "admin_role_permissions_select" ON admin_role_permissions
    FOR SELECT USING (true);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Default Permissions
INSERT INTO admin_permissions (name, description, category) VALUES
-- Products
('products.view', 'Ürünleri görüntüleme', 'products'),
('products.create', 'Ürün oluşturma', 'products'),
('products.edit', 'Ürün düzenleme', 'products'),
('products.delete', 'Ürün silme', 'products'),
('products.import', 'Ürün import/export', 'products'),

-- Categories
('categories.view', 'Kategorileri görüntüleme', 'categories'),
('categories.create', 'Kategori oluşturma', 'categories'),
('categories.edit', 'Kategori düzenleme', 'categories'),
('categories.delete', 'Kategori silme', 'categories'),

-- Orders
('orders.view', 'Siparişleri görüntüleme', 'orders'),
('orders.edit', 'Sipariş düzenleme', 'orders'),
('orders.fulfill', 'Sipariş teslimi', 'orders'),
('orders.refund', 'İade işlemleri', 'orders'),

-- Users/Customers
('customers.view', 'Müşterileri görüntüleme', 'customers'),
('customers.edit', 'Müşteri bilgilerini düzenleme', 'customers'),

-- Settings
('settings.view', 'Ayarları görüntüleme', 'settings'),
('settings.edit', 'Ayarları düzenleme', 'settings'),

-- Reports
('reports.view', 'Raporları görüntüleme', 'reports'),
('reports.export', 'Rapor export', 'reports'),

-- Admin Management
('admin.users', 'Admin kullanıcı yönetimi', 'admin'),
('admin.logs', 'Sistem loglarını görüntüleme', 'admin'),
('admin.security', 'Güvenlik ayarları', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Default Role Permissions
INSERT INTO admin_role_permissions (role, permission_name) VALUES
-- Super Admin (All permissions)
('super_admin', 'products.view'), ('super_admin', 'products.create'), ('super_admin', 'products.edit'), ('super_admin', 'products.delete'), ('super_admin', 'products.import'),
('super_admin', 'categories.view'), ('super_admin', 'categories.create'), ('super_admin', 'categories.edit'), ('super_admin', 'categories.delete'),
('super_admin', 'orders.view'), ('super_admin', 'orders.edit'), ('super_admin', 'orders.fulfill'), ('super_admin', 'orders.refund'),
('super_admin', 'customers.view'), ('super_admin', 'customers.edit'),
('super_admin', 'settings.view'), ('super_admin', 'settings.edit'),
('super_admin', 'reports.view'), ('super_admin', 'reports.export'),
('super_admin', 'admin.users'), ('super_admin', 'admin.logs'), ('super_admin', 'admin.security'),

-- Admin (Most permissions)
('admin', 'products.view'), ('admin', 'products.create'), ('admin', 'products.edit'), ('admin', 'products.import'),
('admin', 'categories.view'), ('admin', 'categories.create'), ('admin', 'categories.edit'),
('admin', 'orders.view'), ('admin', 'orders.edit'), ('admin', 'orders.fulfill'), ('admin', 'orders.refund'),
('admin', 'customers.view'), ('admin', 'customers.edit'),
('admin', 'settings.view'), ('admin', 'settings.edit'),
('admin', 'reports.view'), ('admin', 'reports.export'),

-- Editor (Content management)
('editor', 'products.view'), ('editor', 'products.create'), ('editor', 'products.edit'), ('editor', 'products.import'),
('editor', 'categories.view'), ('editor', 'categories.create'), ('editor', 'categories.edit'),
('editor', 'orders.view'),
('editor', 'customers.view'),

-- Viewer (Read-only)
('viewer', 'products.view'), ('viewer', 'categories.view'), ('viewer', 'orders.view'), ('viewer', 'customers.view'), ('viewer', 'reports.view')
ON CONFLICT (role, permission_name) DO NOTHING;

-- ============================================================================
-- DEFAULT ADMIN USER
-- ============================================================================

-- Create default admin user (password: Admin123!)
-- Note: This should be changed immediately after first login
INSERT INTO admin_users (
    username,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    is_verified,
    force_password_change,
    created_at
) VALUES (
    'admin',
    'admin@rdhncommerce.com',
    '$2a$12$RnRts6e5NgcZzPNymVpi2estJ8e894sPJC9BS41/t7g.otEuMreFO', -- Admin123!
    'Sistem Yöneticisi',
    'super_admin',
    true,
    true,
    true, -- Force password change on first login
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Admin Authentication System başarıyla kuruldu!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Varsayılan Admin Kullanıcısı:';
    RAISE NOTICE 'Kullanıcı Adı: admin';
    RAISE NOTICE 'E-posta: admin@rdhncommerce.com';
    RAISE NOTICE 'Şifre: Admin123!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'GÜVENLİK UYARISI:';
    RAISE NOTICE '1. İlk girişte şifrenizi değiştirin';
    RAISE NOTICE '2. Güçlü bir şifre seçin';
    RAISE NOTICE '3. 2FA aktifleştirin';
    RAISE NOTICE '4. Admin paneli URL''sini koruyun';
    RAISE NOTICE '==================================================';
END $$; 