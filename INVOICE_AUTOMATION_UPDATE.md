# 🧾 Otomatik Faturalama Sistemi Güncelleme

**Tarih:** 11 Ekim 2025

## 📋 Değişiklik Özeti

### Önceki Durum (Yanlış)
Fatura sadece şu durumlarda oluşturuluyordu:
- ✅ Kredi kartı ödemesi başarılı olduğunda (callback)
- ✅ Banka havalesi onaylandığında (`paymentStatus === 'paid'`)

**Sorun:** Ödeme yöntemi admin panelde yanlış gösteriliyordu (her şey "kredi kartı" görünüyordu).

### Yeni Durum (Doğru)
Fatura **her zaman** şu durumda oluşturulur:
- ✅ Sipariş durumu **"İşleme Alındı" (PENDING)** yapıldığında
- ✅ Ödeme yöntemi doğru gösteriliyor (Kredi Kartı / Banka Havalesi)

## 🔧 Teknik Değişiklikler

### 1. Ödeme Yöntemi Kaydı (`src/app/api/orders/route.ts`)
```typescript
payment_method: paymentMethod, // ✅ Database'e kaydediliyor
```

### 2. Admin Panel SELECT Query (`src/app/api/admin/orders/route.ts`)
```typescript
payment_method,  // ✅ Database'den çekiliyor
```

### 3. Ödeme Yöntemi Gösterimi
```typescript
const paymentMethod = order.payment_method === 'bank_transfer' 
  ? 'Banka Havalesi / EFT' 
  : order.payment_method === 'credit_card'
  ? 'Kredi Kartı'
  : order.payment_method || 'Kredi Kartı'
```

### 4. **YENİ:** Otomatik Faturalama Mantığı
```typescript
// Sipariş "İşleme Alındı" (PENDING) durumuna getirildiğinde
if (order && dbStatus === 'PENDING') {
  // BizimHesap'a fatura gönder
  invoiceService.createInvoiceFromOrderId(order.id, {
    invoiceType: InvoiceType.SALES,
    createInvoiceRecord: true,
    sendNotification: true
  })
}
```

## 📊 Sipariş Akışı

### Banka Havalesi
```
1. Sipariş oluştur → "Ödeme Bekliyor" (awaiting_payment)
2. Admin havaleyi onaylar → "İşleme Alındı" (pending)
   └─→ ✅ OTOMATIK FATURA OLUŞTURULUR
3. Admin manuel → "Başarılı Sipariş - Kargolanacak" (confirmed)
4. Kargo bilgileri girilir → "Kargoda" (shipped)
```

### Kredi Kartı
```
1. Sipariş oluştur + 3DS Ödeme → "Ödeme Bekliyor"
2. Ödeme başarılı (callback) → Otomatik fatura
3. Admin manuel → "İşleme Alındı" (pending)
   └─→ ℹ️ Zaten fatura oluşturuldu, tekrar oluşturulmaz*
4. Admin manuel → "Başarılı Sipariş - Kargolanacak"
5. Kargo bilgileri → "Kargoda"
```

*Not: Kredi kartı ödemeleri için callback'te fatura oluşturulur. "İşleme Alındı" durumuna geçişte ikinci kez fatura oluşturulmaz (BizimHesap duplicate kontrolü yapar).

## 🧪 Test Senaryoları

### Senaryo 1: Banka Havalesi
1. ✅ Banka havalesi ile sipariş oluştur
2. ✅ Admin panelde "Ödeme Bekliyor" tab'ında görünür
3. ✅ "Ödemeyi Onayla (Havale)" butonuna tıkla
4. ✅ Sipariş "İşleme Alındı" tab'ına geçer
5. ✅ **BizimHesap'a otomatik fatura gönderilir**
6. ✅ Ödeme yöntemi: "Banka Havalesi / EFT"

### Senaryo 2: Kredi Kartı
1. ✅ Kredi kartı ile sipariş oluştur
2. ✅ 3DS ödeme başarılı
3. ✅ **Callback'te otomatik fatura oluşturulur**
4. ✅ Admin panelde görünür
5. ✅ Ödeme yöntemi: "Kredi Kartı"

### Senaryo 3: Manuel Durum Değişikliği
1. ✅ Herhangi bir siparişi "İşleme Alındı" durumuna getir
2. ✅ **Otomatik fatura oluşturulur**
3. ✅ Log'larda fatura oluşturma mesajları görünür

## 📁 Değiştirilen Dosyalar

1. `src/app/api/orders/route.ts` - payment_method kaydı
2. `src/app/api/admin/orders/route.ts` - Fatura mantığı + payment_method okuma
3. `supabase/migrations/20251011_fix_payment_method.sql` - Eski siparişleri düzelt

## ⚠️ Önemli Notlar

1. **Duplicate Fatura Koruması:** BizimHesap duplicate fatura kontrolü yapar
2. **Async İşlem:** Fatura oluşturma background'da çalışır, sipariş güncellemesini engellemez
3. **Kredi Kartı:** Callback'te zaten fatura oluşur, "İşleme Alındı" durumunda tekrar oluşturmaz
4. **Eski Siparişler:** Migration ile düzeltilebilir

## 🔄 Migration (Opsiyonel)

Eski siparişlerin payment_method değerini düzeltmek için:
```sql
UPDATE orders
SET payment_method = 'bank_transfer'
WHERE payment_status = 'awaiting_payment';

UPDATE orders
SET payment_method = 'credit_card'
WHERE payment_method IS NULL OR payment_method = '';
```

## ✅ Sonuç

- ✅ Ödeme yöntemi artık doğru gösteriliyor
- ✅ Her "İşleme Alındı" durumuna geçişte otomatik fatura oluşuyor
- ✅ Banka havalesi ve kredi kartı için ayrı akışlar çalışıyor
- ✅ Duplicate fatura koruması var

