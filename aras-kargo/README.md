# Aras Kargo Entegrasyon Yönetim Rehberi

Bu dokümanta, Aras Kargo entegrasyonunun tüm süreçleri, API bilgileri ve yönetimi hakkında kapsamlı bilgiler yer almaktadır.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Proje Yapısı](#proje-yapısı)
3. [API Entegrasyonu](#api-entegrasyonu)
4. [Proxy Konfigürasyonu](#proxy-konfigürasyonu)
5. [Kargo Oluşturma Süreci](#kargo-oluşturma-süreci)
6. [Takip Etiketi Yazdırma](#takip-etiketi-yazdırma)
7. [Kargo Takip Sistemi](#kargo-takip-sistemi)
8. [Environment Variables](#environment-variables)
9. [Test ve Geliştirme](#test-ve-geliştirme)
10. [Sorun Giderme](#sorun-giderme)
11. [Deployment Rehberi](#deployment-rehberi)

---

## Genel Bakış

Bu klonlama işlemi, Aras Kargo entegrasyonunun tüm bileşenlerini içermektedir:

### 🚀 Ana Özellikler
- **Kargo Oluşturma**: Siparişten otomatik kargo kaydı oluşturma
- **Barkod Üretimi**: Aras Kargo API'si ile barkod alma
- **Takip Etiketi**: Yazdırılabilir kargo etiketleri
- **Kargo Takip**: Gerçek zamanlı kargo durumu sorgulama
- **Bildirim Sistemi**: Müşteri email bildirimleri
- **Proxy Desteği**: Güvenli API iletişimi

### 💡 Teknik Özellikler
- **SOAP API**: Aras Kargo SOAP web servisi entegrasyonu
- **Modüler Yapı**: Bağımsız paket olarak geliştirilmiş
- **TypeScript**: Tam tip güvenliği
- **Server/Client**: Hybrid kullanım desteği
- **Cron Jobs**: Otomatik kargo durumu güncellemeleri

---

## Proje Yapısı

```
aras-copy/
├── aras-cargo-integration/          # Ana entegrasyon paketi
│   ├── src/
│   │   ├── aras-cargo-service.ts           # SOAP API servisi (SERVER ONLY)
│   │   ├── aras-cargo-tracking-urls.ts     # URL oluşturucu (CLIENT SAFE)
│   │   ├── cargo-notification-service.ts   # Email bildirimleri
│   │   └── index.ts                        # Paket export'ları
│   ├── docs/                        # API dokümantasyonları
│   ├── package.json                 # Paket bağımlılıkları
│   └── README.md                   # Paket dokümantasyonu
│
├── api-endpoints/                   # NextJS API route'ları
│   ├── cargo-tracking.ts           # Kargo durumu sorgulama
│   ├── sync-cargo.ts              # Otomatik kargo güncelleme (CRON)
│   ├── test-tracking.ts           # Test endpoint'i
│   ├── test-connection.ts         # Bağlantı testi
│   ├── aras-settings.ts           # Kargo ayarları
│   ├── test-set-dispatch.ts       # Sevkiyat testi
│   ├── test-get-dispatch.ts       # Sevkiyat sorgulama
│   └── test-email.ts              # Email test endpoint'i
│
├── components/                      # React bileşenleri
│   ├── aras-cargo-tracking.tsx     # Müşteri takip arayüzü
│   ├── aras-cargo-settings.tsx     # Admin ayarlar paneli
│   ├── aras-cargo-test-panel.tsx   # Test paneli
│   └── barcode-printer.tsx         # Barkod yazdırma
│
├── pages/                          # NextJS sayfaları
│   ├── admin-cargo.tsx            # Admin kargo yönetimi
│   └── customer-cargo-tracking.tsx # Müşteri takip sayfası
│
├── services/                       # Yardımcı servisler
│   └── barcode-service.ts         # Barkod işlemleri
│
├── types/                          # TypeScript tipleri
│   └── cargo.ts                   # Kargo tip tanımları
│
└── README.md                       # Bu dosya
```

---

## API Entegrasyonu

### 🔗 Aras Kargo SOAP API

Aras Kargo, SOAP tabanlı web servisi kullanmaktadır:

```typescript
// API Yapılandırması
const config = {
  serviceUrl: 'https://customerservices.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
  username: process.env.ARAS_CARGO_USERNAME,
  password: process.env.ARAS_CARGO_PASSWORD,
  customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE
}
```

### 📋 Ana API Metodları

#### 1. `GetCargoInfo` - Kargo Durumu Sorgulama
```xml
<!-- SOAP Request -->
<GetCargoInfo>
  <username>kullanici_adi</username>
  <password>sifre</password>
  <customerCode>musteri_kodu</customerCode>
  <barcode>1234567890123</barcode>
</GetCargoInfo>
```

#### 2. `GetArasBarcode` - Barkod Oluşturma
```xml
<!-- SOAP Request -->
<GetArasBarcode>
  <username>kullanici_adi</username>
  <password>sifre</password>
  <customerCode>musteri_kodu</customerCode>
  <orderNumber>siparis_no</orderNumber>
</GetArasBarcode>
```

#### 3. `GetCityList` - Şehir Listesi
```xml
<!-- SOAP Request -->
<GetCityList>
  <username>kullanici_adi</username>
  <password>sifre</password>
</GetCityList>
```

### 🛠️ API Kullanım Örnekleri

```typescript
import { ArasCargoService } from './aras-cargo-integration'

// Servis oluşturma
const arasService = new ArasCargoService({
  serviceUrl: process.env.ARAS_CARGO_SERVICE_URL,
  username: process.env.ARAS_CARGO_USERNAME,
  password: process.env.ARAS_CARGO_PASSWORD,
  customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE
})

// Kargo durumu sorgulama
const cargoStatus = await arasService.queryCargoStatus('1234567890123')

// Barkod oluşturma
const barcode = await arasService.getArasBarcode('ORD-2024-001')

// Şehir listesi alma
const cities = await arasService.getCityList()
```

---

## Proxy Konfigürasyonu

### 🌐 Squid Proxy Ayarları

Aras Kargo API'sine erişim için proxy kullanılması gereklidir:

```bash
# Aras Kargo Proxy Ayarları
ARAS_USE_PROXY=true
ARAS_PROXY_HOST=api2.plante.biz
ARAS_PROXY_PORT=3128
ARAS_PROXY_USER=plante
ARAS_PROXY_PASSWORD=h01h0203
```

### 🔧 Proxy Implementasyonu

```typescript
// Node.js'te proxy agent kullanımı
import { HttpsProxyAgent } from 'https-proxy-agent'
import { HttpProxyAgent } from 'http-proxy-agent'

const proxyConfig = {
  protocol: 'http:',
  host: process.env.ARAS_PROXY_HOST,
  port: process.env.ARAS_PROXY_PORT,
  auth: `${process.env.ARAS_PROXY_USER}:${process.env.ARAS_PROXY_PASSWORD}`
}

const agent = new HttpsProxyAgent(proxyConfig)
```

---

## Kargo Oluşturma Süreci

### 📦 Sipariş → Kargo Akışı

1. **Sipariş Tamamlanması**
   - Müşteri siparişi tamamlar
   - Ödeme onaylanır
   - Sipariş "hazırlanıyor" durumuna geçer

2. **Kargo Kaydı Oluşturma**
   ```typescript
   // Admin panelinde kargo oluşturma
   const createCargo = async (orderId: string) => {
     const order = await getOrderById(orderId)
     const barcode = await arasService.getArasBarcode(order.orderNumber)
     
     // Sipariş güncelle
     await updateOrder(orderId, {
       cargoBarcode: barcode,
       status: 'kargoda'
     })
   }
   ```

3. **Barkod Yazdırma**
   - Admin panelinde barkod görüntüleme
   - QR kod oluşturma
   - Yazdırma özelliği

### 🏷️ Barkod Formatı

Aras Kargo barkodları:
- **Format**: 13 haneli sayısal
- **Örnek**: `1234567890123`
- **QR Kod**: Takip URL'si içeren

---

## Takip Etiketi Yazdırma

### 🖨️ Etiket Bileşenleri

```typescript
// Yazdırılabilir etiket bileşeni
const BarcodeLabel = ({ order, barcode }) => (
  <div className="print-label">
    <div className="header">
      <img src="/aras-logo.png" alt="Aras Kargo" />
      <h3>Kargo Etiketi</h3>
    </div>
    
    <div className="barcode-section">
      <QRCode value={barcode} />
      <p className="barcode-text">{barcode}</p>
    </div>
    
    <div className="address-section">
      <h4>Alıcı Bilgileri</h4>
      <p>{order.customerName}</p>
      <p>{order.shippingAddress}</p>
      <p>{order.phone}</p>
    </div>
    
    <div className="sender-section">
      <h4>Gönderen</h4>
      <p>Plante E-Ticaret</p>
      <p>Adres bilgileri...</p>
    </div>
  </div>
)
```

### 🎨 CSS Print Stilleri

```css
@media print {
  .print-label {
    width: 10cm;
    height: 15cm;
    padding: 1cm;
    font-family: Arial, sans-serif;
    border: 1px solid #000;
  }
  
  .barcode-section {
    text-align: center;
    margin: 1cm 0;
  }
  
  .address-section, .sender-section {
    margin: 0.5cm 0;
    border-top: 1px dashed #ccc;
    padding-top: 0.5cm;
  }
}
```

---

## Kargo Takip Sistemi

### 🔍 Takip Süreci

1. **Manuel Takip**
   ```typescript
   // Müşteri arayüzünde takip
   const trackCargo = async (trackingNumber: string) => {
     const response = await fetch('/api/cargo/tracking', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ trackingNumber })
     })
     
     const result = await response.json()
     return result
   }
   ```

2. **Otomatik Güncelleme (CRON)**
   ```typescript
   // Her saat başı çalışan cron job
   export async function POST() {
     const pendingCargos = await getPendingCargos()
     
     for (const cargo of pendingCargos) {
       const status = await arasService.queryCargoStatus(cargo.barcode)
       
       if (status.success) {
         await updateCargoStatus(cargo.id, status.data)
         
         // Durum değişmişse bildirim gönder
         if (status.data.delivered) {
           await sendDeliveryNotification(cargo.orderId)
         }
       }
     }
   }
   ```

### 📊 Kargo Durumları

```typescript
enum CargoStatus {
  PREPARING = 'hazirlaniyor',
  SHIPPED = 'kargoda', 
  IN_TRANSIT = 'transit',
  OUT_FOR_DELIVERY = 'dagitimda',
  DELIVERED = 'teslim_edildi',
  RETURNED = 'iade',
  CANCELLED = 'iptal'
}
```

### 📧 Email Bildirimleri

```typescript
// Kargo durumu değiştiğinde email gönderme
const sendCargoUpdateEmail = async (order: Order, status: CargoStatus) => {
  const emailData = {
    to: order.customerEmail,
    subject: `Kargo Durumu Güncellendi - ${order.orderNumber}`,
    template: 'cargo-update',
    data: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      cargoStatus: status,
      trackingUrl: generateTrackingUrl(order.cargoBarcode)
    }
  }
  
  await emailService.sendEmail(emailData)
}
```

---

## Environment Variables

### 🔐 Gerekli Ortam Değişkenleri

```bash
# Aras Kargo API Ayarları
ARAS_CARGO_SERVICE_URL=https://customerservices.araskargo.com.tr/arascargoservice/arascargoservice.asmx
ARAS_CARGO_USERNAME=your_username
ARAS_CARGO_PASSWORD=your_password  
ARAS_CARGO_CUSTOMER_CODE=your_customer_code

# Proxy Ayarları
ARAS_USE_PROXY=true
ARAS_PROXY_HOST=api2.plante.biz
ARAS_PROXY_PORT=3128
ARAS_PROXY_USER=plante
ARAS_PROXY_PASSWORD=h01h0203

# Kargo Sistem Ayarları
CARGO_AUTO_TRACKING_UPDATE=true
CARGO_CUSTOMER_NOTIFICATIONS=true
CARGO_EMAIL_NOTIFICATIONS=true
CARGO_UPDATE_INTERVAL_HOURS=1

# Test Ortamı
NODE_ENV=production
ARAS_TEST_MODE=false
```

### 🧪 Test Ortamı Ayarları

```bash
# Test API URL'i
ARAS_CARGO_SERVICE_URL=https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx

# Test kredensiyelleri
ARAS_CARGO_USERNAME=test
ARAS_CARGO_PASSWORD=test
ARAS_CARGO_CUSTOMER_CODE=test

# Test modu aktif
ARAS_TEST_MODE=true
```

---

## Test ve Geliştirme

### 🧪 Test Endpoint'leri

1. **API Bağlantı Testi**
   ```bash
   POST /api/admin/cargo/aras/test-connection
   ```

2. **Kargo Takip Testi**
   ```bash
   POST /api/admin/cargo/aras/test-tracking
   Body: { "trackingNumber": "1234567890123" }
   ```

3. **Email Bildirim Testi**
   ```bash
   GET /api/admin/cargo/test-email
   ```

### 🔧 Geliştirme Ortamı Kurulumu

1. **Dependency Installation**
   ```bash
   cd aras-cargo-integration
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

### ✅ Test Kontrol Listesi

- [ ] API bağlantısı çalışıyor
- [ ] Proxy konfigürasyonu doğru
- [ ] Barkod oluşturma fonksiyonel
- [ ] Kargo durumu sorgulama çalışıyor
- [ ] Email bildirimleri gönderiliyor
- [ ] CRON job'lar çalışıyor
- [ ] Admin paneli erişilebilir
- [ ] Müşteri takip sayfası aktif

---

## Sorun Giderme

### 🚨 Yaygın Hatalar ve Çözümleri

#### 1. SOAP API Bağlantı Hatası
```
Error: ENOTFOUND customerservices.araskargo.com.tr
```
**Çözüm:**
- Proxy ayarlarını kontrol edin
- DNS çözümlemesini test edin
- Firewall kurallarını kontrol edin

#### 2. Proxy Authentication Hatası
```
Error: 407 Proxy Authentication Required
```
**Çözüm:**
- Proxy kullanıcı adı/şifresini kontrol edin
- Proxy sunucu erişimini test edin

#### 3. SOAP Parse Hatası
```
Error: Invalid SOAP response
```
**Çözüm:**
- API response'unu logla
- XML formatını kontrol et
- API versiyon uyumluluğunu kontrol et

#### 4. Barkod Oluşturulamıyor
```
Error: Barcode generation failed
```
**Çözüm:**
- Müşteri kodu doğruluğunu kontrol edin
- Sipariş numarası formatını kontrol edin
- API quota'nızı kontrol edin

### 🔍 Debug Araçları

```typescript
// Debug modu aktifleştirme
const arasService = new ArasCargoService({
  ...config,
  debug: true
})

// API response logging
console.log('SOAP Request:', soapRequest)
console.log('SOAP Response:', soapResponse)
```

### 📝 Log Analizi

```bash
# Kargo güncellemelerini takip etme
tail -f /var/log/cargo-updates.log

# API çağrılarını izleme  
grep "Aras API" /var/log/application.log
```

---

## Deployment Rehberi

### 🚀 Production Deployment

1. **Environment Variables**
   ```bash
   # Production ortamı için gerekli değişkenler
   ARAS_CARGO_SERVICE_URL=https://customerservices.araskargo.com.tr/...
   ARAS_USE_PROXY=true
   CARGO_AUTO_TRACKING_UPDATE=true
   NODE_ENV=production
   ```

2. **CRON Job Kurulumu**
   ```bash
   # Vercel/Netlify için Cron Jobs
   0 */1 * * * curl -X POST https://yourdomain.com/api/cron/sync-cargo
   ```

3. **Monitoring Setup**
   - API uptime monitoring
   - Error rate tracking
   - Performance metrics
   - Email delivery rates

### 📊 Production Checklist

- [ ] SSL sertifikaları aktif
- [ ] Environment variables güvenli
- [ ] Proxy bağlantıları test edildi
- [ ] CRON job'lar scheduled
- [ ] Error monitoring aktif
- [ ] Backup stratejisi mevcut
- [ ] API rate limits belirlendi
- [ ] Performance monitoring kurulu

---

## 📚 Ek Kaynaklar

### 📖 Dokümantasyon
- [Aras Kargo API Dokümantasyonu](./aras-cargo-integration/docs/)
- [NextJS API Routes Guide](https://nextjs.org/docs/api-routes/introduction)
- [SOAP Web Services](https://www.w3.org/TR/soap/)

### 🔗 Faydalı Linkler
- [Aras Kargo Resmi Site](https://www.araskargo.com.tr/)
- [Aras Kargo İş Ortağı Portalı](https://isortagi.araskargo.com.tr/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### 💬 Destek
- **Email**: development@plante.com.tr
- **Slack**: #aras-kargo-integration
- **Issue Tracking**: GitHub Issues

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için LICENSE dosyasını inceleyiniz.

---

**Son Güncelleme**: 17 Kasım 2024
**Versiyon**: 2.0.0
**Hazırlayan**: Development Team
