# Environment Variables Hızlı Kurulum

## 🚀 Hızlı Başlangıç

### 1. `.env.local` Dosyası Oluştur

```bash
# Proje root dizininde:
touch .env.local
```

### 2. Temel Ayarlar

```bash
# App URL
NEXT_PUBLIC_APP_URL=https://catkapinda.com.tr

# SMTP (Email gönderimi için)
SMTP_ENABLED=true
SMTP_HOST=plante.biz
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=halil@plante.biz
SMTP_PASSWORD=your_password
SMTP_FROM_EMAIL=noreply@catkapinda.com.tr
SMTP_FROM_NAME=CatKapında
SMTP_ADMIN_EMAIL=admin@catkapinda.com.tr
```

### 3. Supabase Ayarları

Supabase Dashboard'dan alın:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

## 📧 SMTP - İki Seviyeli Sistem

### Seviye 1: Admin Panel (Öncelikli)
Admin Panel → Site Ayarları → SMTP

### Seviye 2: .env (Fallback)
Admin panel boşsa `.env.local` kullanılır

**Avantaj**: Her durumda email çalışır! ✅

---

## 🧪 Test

```bash
# Şifre sıfırlama talebi gönder
# Log'lara bak:

# ✅ Admin panel çalışıyor:
"📧 SMTP Ayarları: { host: 'plante.biz', ... }"

# ✅ .env fallback çalışıyor:
"⚠️ Admin panel ayarları yok, .env fallback kullanılıyor"
"✅ .env SMTP ayarları kullanılıyor"

# ❌ Her ikisi de boş:
"❌ SMTP ayarları bulunamadı"
```

---

## 📝 Production Checklist

- [ ] `.env.local` oluşturuldu (development)
- [ ] Vercel'e environment variables eklendi (production)
- [ ] `NEXT_PUBLIC_APP_URL` production domain
- [ ] SMTP test edildi ve çalışıyor
- [ ] Redeploy yapıldı

---

## 📚 Detaylı Döküman

Tüm variable'ların açıklaması için:
👉 **`docs/ENV_VARIABLES.md`**

---

## ⚡ Hızlı Komutlar

```bash
# Development başlat
npm run dev

# .env değişkenleri değiştiyse server restart
Ctrl+C  # Stop
npm run dev  # Start

# Production build
npm run build
```

---

## 🔒 Güvenlik

```bash
# ❌ ASLA:
git add .env.local

# ✅ .gitignore zaten içeriyor:
.env
.env.local
.env.production
```

---

**Sorular?** → `docs/ENV_VARIABLES.md` dosyasına bakın! 📖

