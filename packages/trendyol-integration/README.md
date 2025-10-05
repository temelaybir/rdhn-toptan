# Trendyol Entegrasyon Paketi

Bu paket, `rdhn-commerce` projesi için Trendyol entegrasyonunun tüm mantığını içerir. Ana uygulamadan bağımsız, modüler bir yapı olarak tasarlanmıştır.

## Proje Yapısı

```
packages/trendyol-integration/
├── src/
│   ├── api-client.ts           # Trendyol API ile iletişimi yönetir
│   ├── attribute-mapper.ts     # Ürün özelliklerini Trendyol formatına eşler
│   ├── image-processor.ts      # Görselleri işler ve FTP'ye yükler
│   ├── queue-manager.ts        # Arka plan işlemlerini (kuyruk) yönetir
│   ├── sync-engine.ts          # Tüm senkronizasyon sürecini yönetir
│   ├── index.ts                # Paket export'ları
│   ├── components/             # React bileşenleri
│   │   └── ui/                 # UI bileşenleri
│   ├── lib/                    # Utility fonksiyonları
│   │   ├── utils.ts            # Genel utility fonksiyonları
│   │   ├── trendyol/           # Trendyol özel fonksiyonları
│   │   └── supabase/           # Supabase konfigürasyonu
│   └── types/                  # TypeScript tip tanımları
│       └── trendyol.ts         # Trendyol API tipleri
│
├── docs/                       # Dokümantasyon
├── package.json                # Paketin bağımlılıkları
└── README.md                   # Bu dosya
```

## Modüllerin Sorumlulukları

### `api-client.ts`
- **Sorumluluk:** Trendyol API'si ile tüm doğrudan iletişimi kurar.
- **Özellikler:**
  - Güvenli kimlik doğrulama (API Key/Secret).
  - Canlı ve Test ortamları arasında geçiş.
  - Hata yönetimi ve otomatik yeniden deneme (rate limit, timeout vb.).
  - Temel API endpoint'leri (ürün, kategori, marka işlemleri).

### `attribute-mapper.ts`
- **Sorumluluk:** Yerel ürün verilerini Trendyol'un beklediği yapıya dönüştürür.
- **Özellikler:**
  - Trendyol kategorilerini ve özelliklerini veritabanına senkronize eder.
  - Yerel ürünleri Trendyol ürün formatına haritalar.
  - Göndermeden önce ürün verilerinin zorunlu alanlarını doğrular.

### `image-processor.ts`
- **Sorumluluk:** Ürün görsellerini işler ve Trendyol'un erişebileceği bir sunucuya yükler.
- **Özellikler:**
  - Görselleri optimize eder ve WebP formatına dönüştürür.
  - İşlenmiş görselleri FTP sunucusuna yükler.

### `queue-manager.ts`
- **Sorumluluk:** Uzun süren senkronizasyon işlemlerini arka planda güvenilir bir şekilde çalıştırır.
- **Özellikler:**
  - İşlemleri veritabanı tabanlı bir kuyruğa ekler.
  - Başarısız işlemleri otomatik olarak yeniden dener.
  - Toplu işlemleri yönetir.

### `sync-engine.ts`
- **Sorumluluk:** Entegrasyonun tüm parçalarını bir araya getirerek senkronizasyon akışını yönetir.
- **Özellikler:**
  - Tek veya çoklu ürün oluşturma/güncelleme işlemlerini başlatır.
  - Stok ve fiyat senkronizasyonunu yönetir.
  - Tüm işlemlerin sonuçlarını loglar (kaydeder).

### `components/`
- **Sorumluluk:** Trendyol entegrasyonu için React bileşenleri.
- **Özellikler:**
  - UI bileşenleri (formlar, tablolar, grafikler).
  - Admin panel bileşenleri.
  - Dashboard bileşenleri.

### `lib/`
- **Sorumluluk:** Utility fonksiyonları ve konfigürasyonlar.
- **Özellikler:**
  - Genel utility fonksiyonları.
  - Trendyol özel fonksiyonları.
  - Supabase konfigürasyonu.

### `types/`
- **Sorumluluk:** TypeScript tip tanımları.
- **Özellikler:**
  - Trendyol API tipleri.
  - Bileşen prop tipleri.
  - Utility fonksiyon tipleri.

## E-Ticaret Uygulaması ile Etkileşim Noktaları

Bu paket, ana `commerce` uygulaması tarafından aşağıdaki noktalarda kullanılır:

- **Sayfalar:** `commerce/src/app/trendyol/` altındaki sayfalar bu paketteki bileşenleri kullanır.
- **API Rotaları:** `commerce/src/app/trendyol/api/` altındaki rotalar, bu paketteki servisleri çağırarak dış dünyaya açılır.
- **Yönetim Paneli:** `commerce/src/app/trendyol/admin/` altındaki arayüzler, bu paketi kullanarak entegrasyonu yönetir.
- **Veritabanı:** `sync_queue`, `trendyol_categories`, `trendyol_attributes` gibi tablolar aracılığıyla veri alışverişi yapılır.

## Kullanım

Ana commerce uygulamasında bu paketi kullanmak için:

```typescript
import { TrendyolAPIClient, SyncEngine } from '@rdhn-commerce/trendyol-integration'

// API client kullanımı
const client = new TrendyolAPIClient(apiKey, apiSecret)

// Sync engine kullanımı
const syncEngine = new SyncEngine()
await syncEngine.syncProducts(products)
```

## Kurulum

Bu paket ana commerce uygulamasının `package.json` dosyasında şu şekilde tanımlanmıştır:

```json
{
  "dependencies": {
    "@rdhn-commerce/trendyol-integration": "file:packages/trendyol-integration"
  }
}
```

Paket değişikliklerinden sonra ana uygulamada `npm install` komutunu çalıştırmanız gerekir. 