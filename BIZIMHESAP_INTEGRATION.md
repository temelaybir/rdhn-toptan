# BizimHesap Entegrasyonu Kurulum ve Kullanım

## 🚀 Kurulum Tamamlandı!

BizimHesap entegrasyonu başarıyla yapılandırıldı ve projeye entegre edildi.

## 📋 Yapılan Değişiklikler

### 1. **Package.json Güncellendi**
```json
"@catkapinda/bizimhesap-integration": "file:packages/bizimhesap-integration"
```
- BizimHesap integration package'ı dependencies'e eklendi

### 2. **Next.js Config Güncellendi** (`next.config.ts`)
```typescript
transpilePackages: ['@catkapinda/bizimhesap-integration', '@catkapinda/trendyol-integration']
```
- Local package'lar transpile edilecek şekilde ayarlandı

### 3. **TypeScript Config Güncellendi** (`tsconfig.json`)
```json
"include": ["...", "packages/**/*.ts"]
```
- Packages klasörü TypeScript derlemesine dahil edildi

### 4. **Dependencies Yüklendi**
```bash
npm install
```
- Tüm bağımlılıklar yeniden yüklendi

### 5. **Build Cache Temizlendi**
```bash
.next klasörü silindi
```
- Eski build cache'i temizlendi

## 🔧 Gerekli Ortam Değişkenleri

`.env` dosyanıza şu değişkenleri ekleyin:

```env
# BizimHesap API Ayarları
BIZIMHESAP_FIRM_ID=your_firm_id_here
BIZIMHESAP_API_ENDPOINT=https://bizimhesap.com/api/b2b/addinvoice

# BizimHesap Proxy Ayarları (Opsiyonel)
BIZIMHESAP_USE_PROXY=false
BIZIMHESAP_PROXY_HOST=api2.plante.biz
BIZIMHESAP_PROXY_PORT=3128
BIZIMHESAP_PROXY_USER=plante
BIZIMHESAP_PROXY_PASSWORD=your_password_here
```

## 📝 Kullanım

### API Endpoint'i

**Fatura Oluşturma:**
```bash
POST /api/admin/invoices
{
  "orderId": "uuid-here",
  "invoiceType": "SALES",
  "createRecord": true,
  "sendNotification": true
}
```

**Toplu Fatura Oluşturma:**
```bash
PUT /api/admin/invoices
{
  "orderIds": ["uuid-1", "uuid-2"],
  "invoiceType": "SALES",
  "createRecord": true,
  "sendNotification": true
}
```

**Bağlantı Testi:**
```bash
GET /api/admin/invoices
```

### Service Kullanımı

```typescript
import { getBizimHesapInvoiceService } from '@/services/invoice/bizimhesap-invoice-service'

const invoiceService = getBizimHesapInvoiceService()

// Tek sipariş için fatura
const result = await invoiceService.createInvoiceFromOrderId('order-uuid', {
  invoiceType: 'SALES',
  createInvoiceRecord: true,
  sendNotification: true
})

// Toplu fatura
const results = await invoiceService.createInvoicesForOrders(['uuid-1', 'uuid-2'], {
  invoiceType: 'SALES'
})
```

## ✅ Test Etme

1. **Sunucuyu Yeniden Başlatın:**
```bash
npm run dev
# veya production için
pm2 restart catkapinda
```

2. **Bağlantı Testini Çalıştırın:**
```bash
curl http://localhost:3000/api/admin/invoices
```

3. **Tek Fatura Oluşturun:**
```bash
curl -X POST http://localhost:3000/api/admin/invoices \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-order-uuid"}'
```

## 🐛 Hata Ayıklama

### Module Not Found Hatası
✅ **Çözüldü!** Aşağıdaki adımlar tamamlandı:
- Package.json'a eklendi
- Next.config'e transpilePackages eklendi
- tsconfig'e packages klasörü eklendi
- npm install çalıştırıldı
- Build cache temizlendi

### Proxy Hatası
Eğer Squid proxy sorunları yaşarsanız:
```env
BIZIMHESAP_USE_PROXY=false
```

### Firm ID Hatası
```env
BIZIMHESAP_FIRM_ID ortam değişkenini ayarlayın
```

## 📚 Package Yapısı

```
packages/bizimhesap-integration/
├── src/
│   ├── index.ts                    # Ana export dosyası
│   ├── bizimhesap-service.ts       # BizimHesap API servisi
│   ├── types.ts                    # TypeScript tipleri
│   └── utils.ts                    # Yardımcı fonksiyonlar
├── package.json
└── README.md
```

## 🔄 Sonraki Adımlar

1. ✅ `.env` dosyasına `BIZIMHESAP_FIRM_ID` ekleyin
2. ✅ Sunucuyu yeniden başlatın (`npm run dev` veya `pm2 restart`)
3. ✅ Bağlantı testini çalıştırın
4. ✅ Gerçek bir siparişle fatura oluşturmayı test edin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- Console loglarını kontrol edin
- `/api/admin/invoices` GET endpoint'ine istek göndererek bağlantıyı test edin
- Ortam değişkenlerinin doğru ayarlandığından emin olun

---

**Not:** Bu entegrasyon monorepo yapısı kullanılarak geliştirilmiştir ve local file: dependency olarak yüklenmiştir.

