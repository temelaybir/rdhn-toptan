# Sipariş Sorunları Düzeltmeleri

## 🐛 Tespit Edilen Sorunlar

### 1. **Duplicate Sipariş Kayıtları** ❌
- **Sorun**: Aynı sipariş numarası ile 4 kayıt oluşturuluyordu
- **Neden**: `/api/orders` ve `/api/payment/iyzico/initialize` her ikisi de sipariş kaydı oluşturuyordu
- **Sonuç**: BizimHesap fatura servisi "multiple rows returned" hatası veriyordu

### 2. **Müşteri İsmi "Misafir Kullanıcı"** ❌
- **Sorun**: İsim-soyisim girilmesine rağmen "Misafir Kullanıcı" görünüyordu
- **Neden**: Address field isimleri tutarsız (`fullName` vs `contactName`)
- **Sonuç**: Email ve admin panelinde yanlış isim gösteriliyordu

### 3. **Email Gönderimi Hatası** ❌
- **Sorun**: "No recipients defined" hatası
- **Neden**: Email field'ı boş geliyordu
- **Sonuç**: Müşteri ve admin email bildirimleri gönderilmiyordu

### 4. **Geçersiz Admin Email** ❌
- **Sorun**: `admin@ardahanticaret.com` adresi mevcut değil
- **Neden**: Site ayarlarında yanlış email
- **Sonuç**: Admin bildirim email'leri bounce ediyordu

---

## ✅ Uygulanan Düzeltmeler

### 1. Duplicate Sipariş Kaydı Düzeltildi
**Dosya**: `src/app/api/payment/iyzico/initialize/route.ts`

```typescript
// ❌ ÖNCE (Yanlış - sipariş 2. kez oluşturuluyordu):
const { error: orderError } = await supabase
  .from('orders')
  .insert({ order_number: paymentRequest.orderNumber, ... })

// ✅ SONRA (Doğru - sadece yorum):
// ⚠️ NOT: Order zaten /api/orders route'unda oluşturuldu
// Burada sadece payment transaction kaydediyoruz
```

### 2. İsim Field İsimleri Normalize Edildi
**Dosyalar**: 
- `src/app/api/orders/route.ts`
- `src/app/api/admin/orders/route.ts`

```typescript
// ✅ Her iki field ismi de kontrol ediliyor:
const customerName = billingAddress?.fullName || billingAddress?.contactName || 
                     shippingAddress?.fullName || shippingAddress?.contactName || 
                     'Müşteri'
```

### 3. Email Data Logging Eklendi
**Dosya**: `src/app/api/orders/route.ts`

```typescript
console.log('📧 Email data hazırlandı:', {
  orderNumber,
  customerName,
  customerEmail: email,
  hasItems: (items?.length || 0) > 0
})
```

### 4. BizimHesap Fatura UUID Kullanımı
**Dosya**: `src/app/api/payment/iyzico/callback/route.ts`

```typescript
// ❌ ÖNCE (order_number ile multiple rows hatası):
invoiceService.createInvoiceFromOrderId(transaction.order_number, ...)

// ✅ SONRA (UUID ile unique kayıt):
invoiceService.createInvoiceFromOrderId(fullOrder.id, ...) // UUID kullan
```

---

## 🗄️ Veritabanı Migration'ları

### Migration 1: Duplicate Temizleme ve UNIQUE Constraint
**Dosya**: `supabase/migrations/20251011_fix_duplicate_orders.sql`

```sql
-- Duplicate kayıtları temizle (en eski kaydı tut)
WITH duplicates AS (...)
DELETE FROM orders WHERE id IN (...)

-- UNIQUE constraint ekle
ALTER TABLE orders
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Index ekle
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

### Migration 2: Admin Email Düzeltme
**Dosya**: `supabase/migrations/20251011_fix_admin_email.sql`

```sql
-- Admin email'i güncelle
UPDATE site_settings
SET order_notification_emails = 'halil@plante.biz'
WHERE is_active = true;
```

---

## 🚀 Migration'ları Çalıştırma

### Supabase Dashboard'dan:
1. Supabase Dashboard → SQL Editor
2. Her migration dosyasını sırayla çalıştır:
   - `20251011_fix_duplicate_orders.sql`
   - `20251011_fix_admin_email.sql`
   - `20251011_add_password_reset_fields.sql` (daha önce oluşturuldu)

### Local CLI ile:
```bash
npx supabase db push
```

---

## 🔍 Test Adımları

### 1. Duplicate Kontrolü
```sql
-- Duplicate var mı kontrol et:
SELECT order_number, COUNT(*) as count
FROM orders
GROUP BY order_number
HAVING COUNT(*) > 1;

-- Sonuç: 0 rows (hiç duplicate olmamalı)
```

### 2. Yeni Sipariş Testi
1. Sitede yeni sipariş ver
2. Kontrol et:
   - ✅ Tek kayıt oluşturulmalı
   - ✅ İsim doğru görünmeli (Misafir Kullanıcı değil)
   - ✅ Email gönderilmeli
   - ✅ Admin panelde doğru görünmeli

### 3. Fatura Testi
1. Admin panelde siparişi "Faturala"
2. Kontrol et:
   - ✅ "Sipariş bulunamadı" hatası vermemeli
   - ✅ BizimHesap'ta fatura oluşmalı

---

## 📊 Beklenen Sonuçlar

### Önce (❌ Hatalı):
```
Orders Table:
- SIP-1760190979855 (id: uuid1, created_at: 16:56:10)
- SIP-1760190979855 (id: uuid2, created_at: 16:56:12) ← Duplicate!
- SIP-1760190979855 (id: uuid3, created_at: 16:56:14) ← Duplicate!
- SIP-1760190979855 (id: uuid4, created_at: 16:56:16) ← Duplicate!

Admin Panel:
- Müşteri: "Misafir Kullanıcı"
- Email: ""

Fatura:
- Hata: "multiple rows returned"
```

### Sonra (✅ Düzeltildi):
```
Orders Table:
- SIP-1760190979855 (id: uuid1, created_at: 16:56:10) ← TEK KAYIT!

Admin Panel:
- Müşteri: "Halil İbrahim GÜREL"
- Email: "halilg@gmail.com"

Fatura:
- ✅ Başarıyla oluşturuldu
- BizimHesap GUID: xxx-xxx-xxx
```

---

## 🔗 İlgili Dosyalar

### Backend API:
- `src/app/api/orders/route.ts` ✅ Düzeltildi
- `src/app/api/admin/orders/route.ts` ✅ Düzeltildi
- `src/app/api/payment/iyzico/initialize/route.ts` ✅ Düzeltildi
- `src/app/api/payment/iyzico/callback/route.ts` ✅ Düzeltildi

### Services:
- `src/services/email-notification-service.ts` ℹ️ Değişiklik yok (sadece log eklendi)
- `src/services/invoice/bizimhesap-invoice-service.ts` ℹ️ UUID ile çağrılıyor

### Database:
- `supabase/migrations/20251011_fix_duplicate_orders.sql` 🆕
- `supabase/migrations/20251011_fix_admin_email.sql` 🆕

---

## 📝 Notlar

1. **Migration çalıştırıldıktan sonra** mevcut duplicate kayıtlar temizlenecek
2. **Yeni siparişler** artık duplicate oluşturmayacak (UNIQUE constraint sayesinde)
3. **Admin email** güncellendi, ama isterseniz site ayarlarından değiştirebilirsiniz
4. **Email logging** eklendi, sorun yaşanırsa console'da görebilirsiniz
5. **İsim field isimleri** normalize edildi, artık her iki format da destekleniyor

---

## ⚠️ Önemli

Migration'ları çalıştırmadan önce:
1. ✅ Veritabanı yedek alın
2. ✅ Test ortamında deneyin
3. ✅ Production'da çalıştırın

Migration başarılı olduktan sonra:
1. Yeni sipariş verin ve test edin
2. Fatura oluşturmayı deneyin
3. Email bildirimlerini kontrol edin

