# Aras Cargo Entegrasyon Paketi

Bu paket, `rdhn-commerce` projesi için Aras Kargo entegrasyonunun tüm mantığını içerir. Ana uygulamadan bağımsız, modüler bir yapı olarak tasarlanmıştır.

## Önemli: Client vs Server Kullanımı

Bu paket hem client-safe hem de server-only kod içerir. Server-only kod, tarayıcı ortamlarında kullanılamayan Node.js modüllerini (`https-proxy-agent` ve `http-proxy-agent`) kullanır.

## Proje Yapısı

```
packages/aras-cargo-integration/
├── src/
│   ├── aras-cargo-service.ts           # Aras Kargo API ile iletişimi yönetir (SERVER ONLY)
│   ├── aras-cargo-tracking-urls.ts    # Takip URL'leri oluşturur (CLIENT SAFE)
│   ├── cargo-notification-service.ts   # Kargo durum bildirimlerini yönetir
│   └── index.ts                        # Ana export dosyası
│
├── docs/
│   ├── aras-cargo-integration.md      # Ana entegrasyon dokümanı
│   ├── aras-doc.md                    # API dokümanları
│   ├── aras-doc2.md                   # Ek teknik dokümanlar
│   └── doc-aras.md                    # Test bilgileri ve örnekler
│
├── package.json                       # Paketin bağımlılıkları
└── README.md                          # Bu dosya
```

## Modüllerin Sorumlulukları

### `aras-cargo-service.ts` (SERVER ONLY)
- **Sorumluluk:** Aras Kargo API'si ile tüm doğrudan iletişimi kurar.
- **Kullanım:** Sadece API route'ları veya server component'lerde kullanılabilir.
- **Özellikler:**
  - SOAP tabanlı API entegrasyonu
  - Kargo durumu sorgulama (GetCargoInfo)
  - Barkod oluşturma (GetArasBarcode)
  - Şehir listesi alma (GetCityList)
  - Test ve canlı ortam desteği
  - Proxy desteği (Node.js modülleri kullanır)

### `aras-cargo-tracking-urls.ts` (CLIENT SAFE)
- **Sorumluluk:** Kargo takip URL'lerini oluşturur.
- **Kullanım:** Client component'lerde güvenle kullanılabilir.
- **Özellikler:**
  - Takip numarasından URL oluşturma
  - Barkod'dan URL oluşturma
  - Sipariş numarasından URL oluşturma

### `cargo-notification-service.ts`
- **Sorumluluk:** Kargo durum değişikliklerinde müşteri bildirimlerini yönetir.
- **Özellikler:**
  - Email bildirimleri gönderme
  - Kargo durum güncellemelerini formatla
  - Müşteri iletişim yönetimi

## API Özellikler

### Kargo Takip
- **GetCargoInfo:** Barkod ile kargo durum sorgulama
- **GetArasBarcode:** Sipariş numarasından barkod oluşturma
- **generateTrackingUrls:** Farklı takip URL'leri oluşturma

### Bildirim Sistemi
- Otomatik durum güncellemeleri
- Email bildirimleri
- Kargo teslim bildirimleri

## E-Ticaret Uygulaması ile Etkileşim Noktaları

Bu paket, ana `commerce` uygulaması tarafından aşağıdaki noktalarda kullanılır:

- **API Rotaları:** `commerce/src/app/api/cron/sync-cargo/` altındaki cron job'lar
- **Admin Panel:** `commerce/src/app/(admin)/admin/kargo/` altındaki yönetim arayüzleri
- **Kargo Takip:** `commerce/src/components/tracking/` altındaki kullanıcı arayüzleri
- **Sipariş Takibi:** `commerce/src/app/(customer)/siparis-takibi/` sayfalarında kullanım

## Kullanım Örnekleri

### Client Component'lerde Kullanım

```typescript
// Client component'lerde güvenli kullanım
'use client'

import { getArasTrackingUrls } from '@rdhn-commerce/aras-cargo-integration/client'
// veya
import { getArasTrackingUrls } from '@rdhn-commerce/aras-cargo-integration'

// Takip URL'leri oluşturma
const trackingUrls = getArasTrackingUrls('1234567890123')
```

### Server Component veya API Route'larda Kullanım

```typescript
// Sadece server-side'da kullanım
import { ArasCargoService } from '@rdhn-commerce/aras-cargo-integration/server'
// veya
import { ArasCargoService, createCargoService } from '@rdhn-commerce/aras-cargo-integration'

// Factory function kullanımı
const arasService = createCargoService()

// Manuel konfigürasyon
const arasService = new ArasCargoService({
  serviceUrl: 'https://customerws.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
  username: 'your-username',
  password: 'your-password',
  customerCode: 'your-customer-code'
})

// Kargo durumu sorgulama
const cargoStatus = await arasService.queryCargoStatus('1234567890123')
```

### Bildirim Servisi Kullanımı

```typescript
import { CargoNotificationService } from '@rdhn-commerce/aras-cargo-integration'

// Kargo durum güncellemesi emaili gönder
await CargoNotificationService.sendCargoUpdateEmail(order, cargoStatus)
```

## Konfigürasyon

Paket aşağıdaki environment variable'ları kullanır:

- `ARAS_CARGO_SERVICE_URL`: API endpoint URL'i
- `ARAS_CARGO_USERNAME`: API kullanıcı adı  
- `ARAS_CARGO_PASSWORD`: API şifresi
- `ARAS_CARGO_CUSTOMER_CODE`: Müşteri kodu
- `CARGO_AUTO_TRACKING_UPDATE`: Otomatik takip güncellemesi (true/false)
- `CARGO_CUSTOMER_NOTIFICATIONS`: Müşteri bildirimleri (true/false)

## Test ve Geliştirme

Test ortamı için:
- Test API URL: `https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx`
- Test kredensiyelleri `docs/doc-aras.md` dosyasında mevcuttur 