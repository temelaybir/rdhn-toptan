# Promosyon Kodları Sistemi - Kurulum Rehberi

## ✅ Tamamlanan Özellikler

Kapsamlı bir promosyon kodu sistemi oluşturuldu:

### 1. **Veritabanı Şeması** (PostgreSQL)
- ✅ `promo_codes` tablosu
- ✅ `promo_code_usage` tablosu (kullanım geçmişi)
- ✅ Otomatik validation fonksiyonu
- ✅ RLS (Row Level Security) politikaları

### 2. **Backend**
- ✅ CRUD işlemleri (Create, Read, Update, Delete)
- ✅ Promosyon kodu doğrulama (validation)
- ✅ İstatistik hesaplama
- ✅ Kullanım kaydı

### 3. **Admin Panel**
- ✅ Kampanya yönetim sayfası (`/admin/kampanyalar`)
- ✅ Promosyon kodu oluşturma/düzenleme
- ✅ İstatistikler ve raporlama
- ✅ Sidebar menüye eklendi

### 4. **Sepet Entegrasyonu**
- ✅ Promosyon kodu uygulama alanı
- ✅ Backend validation entegrasyonu
- ✅ Dinamik indirim hesaplama
- ✅ Görsel geri bildirim

---

## 🚀 Kurulum Adımları

### Adım 1: Veritabanı Migration'ını Çalıştırın

Supabase Dashboard'da SQL Editor'ü açın ve şu dosyayı çalıştırın:

📁 `supabase/migrations/20250107_create_promo_codes.sql`

Bu migration şunları oluşturacak:
- ✅ `promo_codes` tablosu
- ✅ `promo_code_usage` tablosu
- ✅ İndeksler ve trigger'lar
- ✅ `validate_promo_code()` fonksiyonu
- ✅ `increment_promo_code_usage()` fonksiyonu
- ✅ RLS politikaları

### Adım 2: Uygulamayı Yeniden Başlatın

```bash
npm run dev
```

### Adım 3: Test Edin

1. **Admin Panel'e Gidin:**
   - `/admin/kampanyalar` sayfasına gidin
   - "Yeni Promosyon Kodu" butonuna tıklayın

2. **Örnek Promosyon Kodu Oluşturun:**
   ```
   Kod: YENI2025
   İndirim: %10 (Yüzde)
   Kullanım: Çoklu Kullanım
   Durum: Aktif
   ```

3. **Sepette Test Edin:**
   - Ürün ekleyin: `/urunler`
   - Sepete gidin: `/sepet`
   - "YENI2025" kodunu girin
   - "Uygula" butonuna tıklayın
   - İndirimin uygulandığını görün!

---

## 📋 Özellikler Detayı

### Promosyon Kodu Ayarları

#### 1. **İndirim Tipi**
- **Yüzde (%)**: Sepet toplamının yüzdesi kadar indirim
  - Örnek: %10 → 100₺ sepet = 10₺ indirim
- **Sabit Tutar (₺)**: Sabit bir miktar indirim
  - Örnek: 50₺ → Her kullanımda 50₺ indirim

#### 2. **Kullanım Tipi**
- **Tek Kullanımlık**: Her kullanıcı sadece 1 kez kullanabilir
  - Kullanıcı ID ile takip edilir
  - Aynı kullanıcı tekrar kullanamaz
- **Çoklu Kullanım**: Birden fazla kez kullanılabilir
  - Maksimum kullanım sayısı belirlenebilir
  - Veya sınırsız kullanım

#### 3. **Tarih Ayarları**
- **Başlangıç Tarihi**: Kodun geçerli olmaya başladığı tarih (opsiyonel)
- **Bitiş Tarihi**: Kodun geçerliliğini yitireceği tarih (opsiyonel)
- **Süresiz**: Her iki tarih boşsa süresiz geçerlidir

#### 4. **Minimum Sepet Tutarı**
- Kodun uygulanması için gereken minimum alışveriş tutarı
- Örnek: 100₺ minimum → Sepet 100₺'nin altındaysa kod çalışmaz

#### 5. **Aktif/Pasif Durum**
- Pasif kodlar kullanılamaz
- Geçici olarak devre dışı bırakmak için kullanılır

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yeni Müşteri İndirimi
```
Kod: HOSGELDIN
İndirim: %15 (Yüzde)
Kullanım: Tek Kullanımlık
Minimum: 200₺
Süre: 1 ay
```

### Senaryo 2: Sezon Kampanyası
```
Kod: YAZINDIRIMI
İndirim: 100₺ (Sabit)
Kullanım: Çoklu (Maks 500 kullanım)
Minimum: 500₺
Süre: 3 ay
```

### Senaryo 3: VIP Müşteri Kodu
```
Kod: VIP2025
İndirim: %20 (Yüzde)
Kullanım: Sınırsız
Minimum: 0₺
Süre: Süresiz
```

### Senaryo 4: Flash Sale
```
Kod: FLASH24H
İndirim: 50₺ (Sabit)
Kullanım: Tek Kullanımlık
Minimum: 150₺
Süre: 1 gün
```

---

## 📊 İstatistikler

Admin panelde şu istatistikler görüntülenir:

1. **Toplam Kod Sayısı**: Sistemdeki tüm promosyon kodları
2. **Aktif Kodlar**: Şu anda kullanılabilir durumda olan kodlar
3. **Süresi Dolan Kodlar**: Bitiş tarihi geçmiş kodlar
4. **Toplam Kullanım**: Kodların kaç kez kullanıldığı
5. **Toplam İndirim**: Müşterilere sağlanan toplam indirim miktarı

---

## 🔒 Güvenlik

- ✅ **RLS Politikaları**: Sadece adminler yönetebilir
- ✅ **Validation**: Her kod kullanımında backend'de kontrol edilir
- ✅ **Kullanım Takibi**: Her kullanım kaydedilir
- ✅ **Benzersizlik**: Aynı kod 2 kez oluşturulamaz

---

## 🐛 Sorun Giderme

### Promosyon kodu çalışmıyor?

1. **Veritabanı migration'ı çalıştırıldı mı?**
   - Supabase SQL Editor'de kontrol edin

2. **Kod aktif mi?**
   - Admin panel'den kontrolconfirm edin

3. **Tarih geçerli mi?**
   - Başlangıç/bitiş tarihlerini kontrol edin

4. **Minimum sepet tutarı sağlanıyor mu?**
   - Sepet toplamını kontrol edin

5. **Kullanım limiti doldu mu?**
   - Admin panel'den kullanım sayısını kontrol edin

### Console'da hata görmek için:

```javascript
// Browser Console'u açın (F12)
// Promosyon kodu uygulanırken hataları görebilirsiniz
```

---

## 📁 Oluşturulan Dosyalar

```
✅ supabase/migrations/20250107_create_promo_codes.sql
✅ src/types/promo-code.ts
✅ src/app/actions/admin/promo-code-actions.ts
✅ src/app/(admin)/admin/kampanyalar/page.tsx
✅ src/app/(customer)/sepet/page.tsx (güncellendi)
✅ src/components/admin/sidebar.tsx (güncellendi)
```

---

## 🎉 Başarıyla Tamamlandı!

Promosyon kodları sistemi hazır! Artık:
- ✅ Admin panelden kod oluşturabilirsiniz
- ✅ Müşteriler sepette kod uygulayabilir
- ✅ İstatistikleri izleyebilirsiniz
- ✅ Kullanım geçmişini görüntüleyebilirsiniz

**Sonraki Adım:** İlk promosyon kodunuzu oluşturun ve test edin! 🚀
