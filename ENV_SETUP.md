# Environment Variables Kurulumu

## 🔧 Gerekli Environment Variables

### 1. Production (Vercel/Hosting)

Vercel Dashboard → Settings → Environment Variables → Ekle:

```bash
# Ana Uygulama URL (ÇOK ÖNEMLİ!)
NEXT_PUBLIC_APP_URL=https://catkapinda.com.tr

# veya custom domain
NEXT_PUBLIC_APP_URL=https://www.catkapinda.com.tr
```

### 2. Local Development

Proje root'unda `.env.local` dosyası oluştur:
git add
```bash
# .env.local dosyası
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# BizimHesap
BIZIMHESAP_FIRM_ID=your_firm_id
BIZIMHESAP_API_ENDPOINT=https://bizimhesap.com/api/b2b/addinvoice
BIZIMHESAP_USE_PROXY=true
BIZIMHESAP_PROXY_HOST=api2.plante.biz
BIZIMHESAP_PROXY_PORT=3128
BIZIMHESAP_PROXY_USER=plante
BIZIMHESAP_PROXY_PASSWORD=your_password

# iyzico
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

---

## 🔍 Sorun Çözme

### Problem: Link'te "localhost" görünüyor
**Çözüm**: `NEXT_PUBLIC_APP_URL` environment variable'ını production URL ile ayarlayın

### Problem: Email gelmiyor
**Çözüm**: 
1. SMTP ayarlarını admin panelden kontrol edin
2. Site Settings → SMTP ayarları
3. Test email gönderin

### Problem: İsim "null null" görünüyor
**Çözüm**: 
1. Customer tablosunda `first_name` ve `last_name` alanları doluysa sorun yok
2. Yoksa, müşteri kaydı oluşturulurken bu alanlar doldurulmalı

---

## ✅ Doğrulama

Environment variable'ın doğru çalıştığını test etmek için:

```bash
# 1. Şifre sıfırlama talebi gönderin
# 2. Console loglarına bakın:

🔐 Password reset link: https://catkapinda.com.tr/auth/reset-password?token=...
# ✅ Doğru: https://catkapinda.com.tr ile başlamalı
# ❌ Yanlış: http://localhost:3000 ile başlıyor
```

---

## 📝 Not

- `NEXT_PUBLIC_` prefix'i ile başlayan değişkenler **browser**'da da erişilebilir
- Prefix olmayan değişkenler **sadece server-side**'da erişilebilir
- Production deploy'dan sonra değişkenleri güncelle ve rebuild et

---

## 🚀 Deployment Sonrası

Vercel'de deploy ettikten sonra:

1. ✅ Settings → Environment Variables kontrol et
2. ✅ `NEXT_PUBLIC_APP_URL` ekle/güncelle
3. ✅ Redeploy yap (Deployments → Latest → Redeploy)
4. ✅ Test et: Şifre sıfırlama talebi gönder
5. ✅ Email'deki link'i kontrol et (production domain olmalı)

