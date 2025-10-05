# Çat Kapında E-Ticaret Platformu

Modern e-ticaret platformu - Next.js 15, TypeScript, Supabase ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Teknolojiler

- **Next.js 15** - App Router ile modern React geliştirme
- **TypeScript** - Tip güvenliği
- **Supabase** - Veritabanı ve authentication
- **Tailwind CSS** - Modern UI styling
- **Shadcn UI** - Component library

## ⚡ Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Production sunucusunu başlat
npm start
```

## 🔧 Environment Değişkenleri

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# İyzico Ödeme
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret
IYZICO_BASE_URL=https://api.iyzipay.com

# BizimHesap Fatura
BIZIMHESAP_FIRM_ID=your_firm_id
BIZIMHESAP_API_ENDPOINT=https://bizimhesap.com/api/b2b/addinvoice

# Trendyol Entegrasyon
TRENDYOL_API_KEY=your_api_key
TRENDYOL_API_SECRET=your_api_secret
TRENDYOL_SUPPLIER_ID=your_supplier_id

# Uygulama
NEXT_PUBLIC_BASE_URL=https://catkapinda.com.tr
NODE_ENV=production
```

## 🎯 Özellikler

- ✅ Kapsamlı admin paneli
- ✅ Kategori ve ürün yönetimi
- ✅ İyzico ödeme entegrasyonu
- ✅ BizimHesap fatura entegrasyonu
- ✅ Trendyol marketplace entegrasyonu
- ✅ Kargo takip sistemi
- ✅ Müşteri yönetimi
- ✅ Magic link authentication
- ✅ Responsive tasarım

## 📦 Proje Yapısı

```
catkapinda/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React bileşenleri
│   ├── services/         # İş mantığı servisleri
│   ├── lib/             # Utility fonksiyonlar
│   └── types/           # TypeScript tipleri
├── packages/            # Özel entegrasyon paketleri
│   ├── bizimhesap-integration/
│   └── trendyol-integration/
├── public/              # Statik dosyalar
└── supabase/            # Veritabanı migrations
```

## 🔐 Güvenlik

- Row Level Security (RLS) ile veritabanı güvenliği
- Zod ile input validasyonu
- Güvenli authentication sistemi
- CSRF koruması

## 📝 Lisans

Özel - Çat Kapında © 2025