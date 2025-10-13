-- Admin Kullanıcı Oluşturma Script'i
-- Bu script'i Supabase SQL Editor'de çalıştırın

-- 1. Admin users tablosunun varlığını kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users'
);

-- 2. Mevcut admin kullanıcıları listele
SELECT id, username, email, is_active, role, force_password_change, created_at
FROM admin_users;

-- 3. Test admin kullanıcısı oluştur (eğer yoksa)
-- Şifre: admin123 (bcrypt hash'i)
INSERT INTO admin_users (
    username,
    email,
    full_name,
    password_hash,
    role,
    is_active,
    two_factor_enabled,
    force_password_change,
    created_at,
    updated_at
)
VALUES (
    'admin',
    'admin@ardahanticaret.com',
    'System Administrator',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
    'super_admin',
    true,
    false,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING
RETURNING id, username, email, role;

-- 4. Admin sessions tablosunun varlığını kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_sessions'
);

-- 5. Admin role permissions tablosunun varlığını kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_role_permissions'
);

-- 6. Eğer admin_role_permissions tablosu yoksa veya boşsa, varsayılan yetkiler ekle
INSERT INTO admin_role_permissions (role, permission_name)
VALUES 
    ('super_admin', '*'),
    ('admin', 'products.view'),
    ('admin', 'products.create'),
    ('admin', 'products.update'),
    ('admin', 'products.delete'),
    ('admin', 'orders.view'),
    ('admin', 'orders.update'),
    ('admin', 'customers.view'),
    ('admin', 'customers.update'),
    ('editor', 'products.view'),
    ('editor', 'products.create'),
    ('editor', 'products.update'),
    ('viewer', 'products.view'),
    ('viewer', 'orders.view'),
    ('viewer', 'customers.view')
ON CONFLICT (role, permission_name) DO NOTHING;

-- 7. Test giriş için kullanıcı bilgilerini göster
SELECT 
    username,
    email,
    role,
    is_active,
    force_password_change,
    'admin123' as test_password,
    created_at
FROM admin_users
WHERE username = 'admin';

