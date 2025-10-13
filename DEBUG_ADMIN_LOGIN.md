# 🔍 Admin Login Debug Rehberi

Admin login sorununuzu çözmek için aşağıdaki adımları takip edin:

## 1. Supabase Database Kontrolü

### a) Admin Users Tablosunu Kontrol Edin

**Supabase Dashboard** → SQL Editor'de şu query'yi çalıştırın:

```sql
SELECT id, username, email, is_active, role, force_password_change, 
       length(password_hash) as password_hash_length
FROM admin_users;
```

**Kontrol Listesi:**
- ✅ `admin_users` tablosu var mı?
- ✅ En az bir admin kullanıcı var mı?
- ✅ `is_active` = `true` mı?
- ✅ `password_hash` dolumu? (uzunluk ~60 karakter olmalı - bcrypt)

### b) Admin Kullanıcı Oluşturun (Eğer Yoksa)

`scripts/create-admin-user.sql` dosyasını Supabase SQL Editor'de çalıştırın.

**Test Kullanıcı Bilgileri:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@ardahanticaret.com`
- Role: `super_admin`

---

## 2. Environment Variables Kontrolü

`.env.local` dosyanızda şunlar olmalı:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rfdlhpcvdwhfemgupmof.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Admin JWT Secret (önemli!)
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key-change-this-in-production
```

---

## 3. Browser Console ile Test

1. `/admin/login` sayfasına gidin
2. Browser DevTools'u açın (F12)
3. Console tab'ına gidin
4. `scripts/test-admin-login.js` içeriğini kopyalayıp console'a yapıştırın
5. Çıktıları inceleyin:

### Başarılı Login Çıktısı:
```
✅ Login başarılı!
👤 User: {id: "...", username: "admin", ...}
🎫 Session Token: "abc123..."
```

### Başarısız Login Çıktıları:
```
❌ "Geçersiz kullanıcı adı veya şifre"
   → Supabase'de kullanıcı yok veya şifre yanlış

❌ "Hesap kilitli"
   → failed_login_attempts > 5, locked_until'i sıfırlayın

❌ "Kullanıcı aktif değil"
   → is_active = false, true yapın
```

---

## 4. Backend Logs Kontrolü

### Development'ta:

Terminal'de şunları göreceksiniz:
```
Admin login attempt from IP: ..., Username: admin
Successful admin login - IP: ..., Username: admin, User ID: ...
```

veya hata:
```
Failed admin login attempt - IP: ..., Username: admin, Error: ...
```

### Vercel'de:

**Vercel Dashboard** → Project → Logs → Functions
`/api/admin/auth/login` fonksiyonunun loglarını inceleyin.

---

## 5. Şifre Hash Kontrolü

Eğer kullanıcı var ama giriş yapmıyorsa, şifre hash'i bozuk olabilir.

### Manuel Şifre Hash Oluşturma:

```javascript
// Node.js console'da:
const bcrypt = require('bcryptjs');
const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
// Çıktı: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

### Hash'i Güncelleme:

```sql
UPDATE admin_users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    updated_at = NOW()
WHERE username = 'admin';
```

---

## 6. Session Tablosu Kontrolü

```sql
-- Admin sessions tablosunu kontrol edin
SELECT * FROM admin_sessions
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- Eski session'ları temizleyin (opsiyonel)
DELETE FROM admin_sessions
WHERE expires_at < NOW();
```

---

## 7. RLS (Row Level Security) Kontrolü

Admin tabloları için RLS **kapalı** olmalı veya service role kullanılmalı.

```sql
-- RLS durumunu kontrol edin
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'admin_sessions', 'admin_role_permissions');

-- Eğer RLS aktifse, kapatın (admin tabloları için güvenli)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_permissions DISABLE ROW LEVEL SECURITY;
```

---

## 8. Network Tab Kontrolü

Browser DevTools → Network tab'ında:

1. `/api/admin/auth/login` isteğini bulun
2. **Request Payload** kontrol edin:
   ```json
   {"username":"admin","password":"admin123","remember_me":false}
   ```

3. **Response** kontrol edin:
   - Status: `200` (başarılı) veya `401` (unauthorized)
   - Body: `{"success": true, ...}` veya `{"success": false, "error": "..."}`

4. **Response Headers** → `Set-Cookie` kontrol edin:
   ```
   Set-Cookie: admin_session_token=...; Path=/; HttpOnly; SameSite=Lax
   ```

---

## 9. Common Issues & Solutions

### Issue 1: "Module not found: bcryptjs"
**Solution:**
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Issue 2: Database connection hatası
**Solution:**
- `SUPABASE_SERVICE_ROLE_KEY` doğru mu kontrol edin
- Supabase project ID doğru mu kontrol edin

### Issue 3: Cookie set edilmiyor
**Solution:**
- `sameSite: 'lax'` → `sameSite: 'none'` değiştirin (CORS için)
- `secure: true` sadece HTTPS'de çalışır (development'ta `false` yapın)

### Issue 4: Session token null
**Solution:**
- `admin_sessions` tablosunun INSERT iznini kontrol edin
- Session oluşturma hatalarını backend log'larında arayın

---

## 10. Quick Fix Script

Hızlı düzeltme için Supabase SQL Editor'de çalıştırın:

```sql
-- 1. Tüm admin session'ları temizle
DELETE FROM admin_sessions;

-- 2. Failed login attempts'i sıfırla
UPDATE admin_users 
SET failed_login_attempts = 0,
    locked_until = NULL,
    is_active = true
WHERE role IN ('super_admin', 'admin');

-- 3. Admin kullanıcıları listele
SELECT id, username, email, is_active, role
FROM admin_users;
```

---

## 📞 Hala Çalışmıyorsa?

1. **Full logs** gönderin:
   - Browser console logs
   - Network tab request/response
   - Backend terminal logs

2. **Database export** gönderin:
   ```sql
   SELECT * FROM admin_users WHERE username = 'admin';
   ```

3. **Environment variables** (hassas bilgileri maskeleyerek) gönderin

