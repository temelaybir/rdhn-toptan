# Trendyol API Zaman Aşımı Sorunu ve Çözümler

## Sorun Tanımı

Yurt dışında bulunan internet servis sağlayıcıları (ISP) kullanıldığında Trendyol API'sine erişimde zaman aşımı hatası oluşabiliyor. Bu durum özellikle Avrupa, Amerika veya Asya'daki veri merkezlerinden Türkiye'deki Trendyol sunucularına bağlanırken yaşanıyor.

## Trendyol Tarafından Alınan Aksiyonlar

### ✅ Partner Destek Bildirimi Yapıldı
- **Tarih**: [Bildirim tarihi]
- **Kanal**: Partner Destek ekranı
- **Durum**: Trendyol teknik ekibi tarafından inceleniyor
- **Referans**: ISP tabanlı timeout sorunu

### İletişim Bilgileri
- **Telefon**: 0850 258 58 00
- **E-posta**: entegrasyon@trendyol.com
- **Partner Panel**: https://partner.trendyol.com

## Sistemimizde Yapılan İyileştirmeler

### 1. Timeout Süresi Artırıldı
```typescript
// Önceki değer: 45 saniye
timeout: 45000

// Yeni değer: 2 dakika (yurt dışı ISP için)
timeout: 120000
```

### 2. Gelişmiş Retry Logic
- **Maksimum Deneme**: 3 kez
- **Progresif Bekleme**: 5s → 10s → 20s
- **Timeout Tespiti**: ECONNABORTED, ETIMEDOUT kodları
- **Network Error Handling**: Connection reset, DNS hatalarını kapsar

### 3. Bağlantı Optimizasyonları
```typescript
// Keep-alive bağlantılar
'Connection': 'keep-alive',
'Keep-Alive': 'timeout=30, max=100'

// HTTP Agent optimizasyonları
httpAgent: false,
httpsAgent: false,
maxRedirects: 3,
validateStatus: (status) => status < 500
```

### 4. Detaylı Error Logging
```typescript
console.error('🚨 Trendyol API Error Details:', {
  message: error.message,
  code: error.code,
  status: error.response?.status,
  url: config.url,
  method: config.method
})
```

## Farklı Ortamlar için Çözümler

### 1. Üretim Ortamı (Önerilen)
- **URL**: https://apigw.trendyol.com
- **IP Yetkilendirmesi**: Gereksiz
- **Timeout**: 2 dakika
- **Retry**: 3 kez otomatik deneme

### 2. Test Ortamı + Plesk Proxy
- **Proxy URL**: https://trendyol-proxy.yourdomain.com
- **Statik IP**: Plesk sunucusunun IP'si
- **Konfigürasyon**: TRENDYOL_PROXY_URL environment variable
- **Dokümantasyon**: `plesk-proxy-setup.md`

### 3. Mock Mode (Geliştirme)
- **API Çağrısı**: Yok
- **Test Verileri**: Mock responses
- **Network**: Bağımsız
- **Hız**: Anında yanıt

## Hata Durumunda Sistem Davranışları

### Timeout Hatası
```
⏳ Zaman aşımı hatası (1/3), tekrar deneniyor...
🌍 Yurt dışı ISP bağlantı sorunu tespit edildi
```

### 556 Servisi Kullanılamıyor
```
⏳ 556 hatası alındı (1/3), 15 saniye bekleyip tekrar deneniyor...
🔧 Trendyol Partner Destek'e bildirim yapıldığı not edildi
```

### Rate Limiting (429)
```
⏳ Rate limit hatası, 5s bekleyip tekrar deneniyor...
```

## Kullanıcı Arayüzündeki Bilgilendirmeler

### Admin Panel Alert
```
🌍 Yurt Dışı ISP Kullanıcıları İçin Önemli Bilgi:
• Zaman aşımı hatası alıyorsanız Partner Destek'e bildirim yapın
• Tel: 0850 258 58 00 | E-posta: entegrasyon@trendyol.com
• Sistem otomatik olarak 3 kez yeniden deneme yapacak
• Timeout süresi 2 dakikaya çıkarıldı
• Bağlantı sorunu tespit edildiğinde progresif bekleyerek tekrar dener

✅ Partner Destek Bildirimi: Yapıldı
```

## Monitoring ve Debug

### Console Log'ları
```typescript
// Başarılı bağlantı
🚀 Trendyol API Request: { method: 'GET', url: '...' }

// Timeout tespit edildiğinde
⏳ Zaman aşımı hatası (1/3), tekrar deneniyor...
🌍 Yurt dışı ISP bağlantı sorunu tespit edildi

// Hata detayları
🚨 Trendyol API Error Details: {
  message: 'timeout of 120000ms exceeded',
  code: 'ECONNABORTED',
  url: '/v2/products'
}
```

### Sistem Durumu
- **Rate Limiter**: 60 istek/dakika
- **Concurrent Requests**: 1 (sıralı işlem)
- **Min Time Between Requests**: 1.1 saniye

## Gelecek Adımlar

### 1. Trendyol Yanıtı Bekleniyor
- Partner Destek incelemesi
- ISP routing optimizasyonu
- CDN/Proxy çözümü

### 2. Alternatif Çözümler
- **Türkiye VPS**: Statik IP ile proxy
- **Vercel Enterprise**: Dedike IP
- **CloudFlare Workers**: Edge computing
- **AWS API Gateway**: Regional proxy

### 3. Sistem İyileştirmeleri
- Connection pooling
- HTTP/2 desteği
- Circuit breaker pattern
- Fallback mechanism

## Test Senaryoları

### 1. Timeout Testi
```bash
# Manuel timeout simülasyonu
curl --max-time 5 https://apigw.trendyol.com/suppliers/[ID]/v2/products
```

### 2. Retry Logic Testi
```javascript
// Admin panelde API Connection Test butonu
await testApiConnection()
```

### 3. Environment Testi
```bash
# Environment variables
TRENDYOL_TEST_MODE=true
TRENDYOL_PROXY_URL=https://proxy.domain.com
```

## Önemli Notlar

### ⚠️ Dikkat
- Yurt dışı ISP'ler için timeout normal bir durumdur
- Sistem otomatik retry yapacak şekilde konfigüre edilmiştir
- Partner Destek bildirimi yapıldı, yanıt bekleniyor

### ✅ Çözüm Durumu
- **Sistem Tarafı**: ✅ Tamamlandı
- **Trendyol Tarafı**: ⏳ Bekleniyor
- **Alternative Solutions**: ✅ Mevcut

---

**Son Güncelleme**: [Tarih]  
**Durum**: Partner Destek bildirimi yapıldı, teknik inceleme devam ediyor  
**Geçici Çözüm**: Gelişmiş retry logic ve timeout handling aktif 