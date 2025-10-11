# Vercel Link Sorunu - Düzeltme

## 🐛 Sorun

Email'de yanlış link geliyordu:
```
❌ https://catkapinda-m3y0yvnhr-rdhns-projects.vercel.app/auth/reset-password?token=...
✅ https://catkapinda.com.tr/auth/reset-password?token=...
```

**Neden**: Vercel preview URL'i kullanılıyordu, production domain yerine.

---

## ✅ Düzeltme

### 1. Kod Düzeltmesi

**Dosya**: `src/app/api/customer/forgot-password/route.ts`

```typescript
// ❌ ÖNCE (Vercel URL kullanıyordu):
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                'https://catkapinda.com.tr'

// ✅ SONRA (Her zaman production domain):
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://catkapinda.com.tr')
```

**Mantık**:
1. Önce `NEXT_PUBLIC_APP_URL` environment variable'ını kontrol et
2. Yoksa NODE_ENV'e bak:
   - Development → `http://localhost:3000`
   - Production → `https://catkapinda.com.tr`

---

### 2. Vercel Environment Variable Ekle

**Önemli**: Bu değişken Vercel'de **mutlaka** eklenmelidir!

#### Adımlar:

1. **Vercel Dashboard**'a git
   - https://vercel.com/dashboard

2. **Projeyi seç**
   - catkapinda projesini aç

3. **Settings → Environment Variables**

4. **Yeni variable ekle**:
   ```
   Key: NEXT_PUBLIC_APP_URL
   Value: https://catkapinda.com.tr
   ```

5. **Environments seç**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. **Save**

7. **Redeploy**:
   - Deployments → Latest → ⋯ (More) → Redeploy

---

## 🧪 Test

### Email Link Testi

1. Şifre sıfırlama talebi gönder
2. Email'i kontrol et
3. Link şu şekilde olmalı:

```
✅ https://catkapinda.com.tr/auth/reset-password?token=...
```

**NOT**: `catkapinda-xxx-vercel.app` ile başlıyorsa hâlâ yanlış!

---

## 📊 Vercel Environment Variables

### Gerekli Variables (Production)

```bash
# App URL (ÇOK ÖNEMLİ!)
NEXT_PUBLIC_APP_URL=https://catkapinda.com.tr

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# SMTP (Fallback)
SMTP_ENABLED=true
SMTP_HOST=plante.biz
SMTP_PORT=587
SMTP_USERNAME=halil@plante.biz
SMTP_PASSWORD=...
SMTP_FROM_EMAIL=noreply@catkapinda.com.tr

# BizimHesap
BIZIMHESAP_FIRM_ID=...
BIZIMHESAP_USE_PROXY=true
...

# iyzico
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=https://api.iyzipay.com

# Security
JWT_SECRET=...
```

---

## 🔍 Sorun Giderme

### Email'de hâlâ yanlış link var

**1. Environment variable eklendi mi?**
```bash
# Vercel → Settings → Environment Variables
NEXT_PUBLIC_APP_URL = https://catkapinda.com.tr ✅
```

**2. Redeploy yapıldı mı?**
```bash
# Deployments → Latest → Redeploy
# Environment variable değişiklikleri sonrası MUTLAKA redeploy!
```

**3. Cache temizle**
```bash
# Browser cache'i temizle
# Vercel edge cache'i otomatik yenilenir
```

**4. Hangi environment?**
```bash
# Production deployment'ını kullanıyor musunuz?
# Preview branch değil, main branch olmalı
```

---

## 🎯 Checklist

### Vercel Yapılandırma
- [ ] `NEXT_PUBLIC_APP_URL` eklendi
- [ ] Value: `https://catkapinda.com.tr`
- [ ] Production environment seçildi
- [ ] Redeploy yapıldı

### Test
- [ ] Şifre sıfırlama talebi gönderildi
- [ ] Email geldi
- [ ] Link `catkapinda.com.tr` ile başlıyor
- [ ] Link çalışıyor (404 yok)
- [ ] Yeni şifre belirlenebilir

---

## 🚀 Deployment Sonrası

### Production'da Test

1. **Şifre sıfırlama talebi**:
   ```
   https://catkapinda.com.tr/auth/forgot-password
   ```

2. **Email kontrolü**:
   ```
   ✅ Link: https://catkapinda.com.tr/auth/reset-password?token=...
   ```

3. **Şifre sıfırlama**:
   - Link'e tıkla
   - Yeni şifre gir
   - "Şifreniz başarıyla güncellendi" ✅

4. **Login testi**:
   - Yeni şifre ile giriş yap
   - Başarılı ✅

---

## 📝 Özet

| Sorun | Durum | Çözüm |
|-------|-------|-------|
| Vercel preview URL | ✅ Düzeltildi | Production domain zorunlu |
| Environment variable | ⚠️ Eklenecek | Vercel'de manuel eklenmeli |
| Kod mantığı | ✅ Düzeltildi | NODE_ENV kontrolü eklendi |

**Sonraki adım**: Vercel'de `NEXT_PUBLIC_APP_URL` ekle ve redeploy yap!

---

## 💡 İpuçları

### Custom Domain Kullanıyorsanız

Eğer `www.catkapinda.com.tr` kullanıyorsanız:

```bash
NEXT_PUBLIC_APP_URL=https://www.catkapinda.com.tr
```

### Multiple Domains

Eğer birden fazla domain varsa, ana domain'i kullanın:

```bash
# Ana domain
NEXT_PUBLIC_APP_URL=https://catkapinda.com.tr

# www redirect otomatik çalışır
```

### Preview Deployments

Preview branch'lerde test için:
- Environment variable **Preview** için de eklenmeli
- Ama value yine production domain olmalı
- Böylece test email'leri de çalışır

---

## ✅ Son Durum

```bash
# Kod: ✅ Düzeltildi
# Vercel: ⚠️ Environment variable eklenmeli
# Test: ⏳ Redeploy sonrası

# Beklenen sonuç:
✅ https://catkapinda.com.tr/auth/reset-password?token=...
```

**Artık her zaman doğru link gidecek!** 🎉

