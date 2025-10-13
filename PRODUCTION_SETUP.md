# 🚨 PRODUCTION SETUP - ACİL!

## Sorun: Ürünler Production'da Gelmiyor ama Local'de Geliyor

### Neden?
Local'de `.env.local` dosyasında `SUPABASE_SERVICE_ROLE_KEY` var, production'da yok!

---

## ✅ Çözüm (5 Dakika)

### 1. Supabase Service Role Key'i Alın

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Projenizi seçin**: `ardahan-toptan` (rfdlhpcvdwhfemgupmof)
3. **Settings → API'ye gidin**
4. **`service_role` (secret) key'i kopyalayın**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
   ```

### 2. Vercel'e Environment Variable Ekleyin

#### Seçenek A: Vercel Dashboard (Önerilen)

1. **Vercel Dashboard'a gidin**: https://vercel.com
2. **Projenizi seçin**: `ardahanticaret-toptan`
3. **Settings → Environment Variables**
4. **Add New** butonuna tıklayın
5. Şu değişkeni ekleyin:

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Supabase'den kopyaladığınız service_role key]
Environment: Production (✅), Preview (✅), Development (⚠️ opsiyonel)
```

6. **Save** butonuna tıklayın
7. **Redeploy** yapın:
   - Deployments tab → Son deployment → 3 nokta → Redeploy
   - **Use existing Build Cache:** UNCHECKED (✅)

#### Seçenek B: Vercel CLI

```bash
# Terminal'de:
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Service role key'i yapıştırın
# Enter'a basın
```

### 3. Redeploy Yapın

```bash
# Vercel CLI ile:
vercel --prod

# Veya Vercel Dashboard'dan:
# Deployments → Latest → ... → Redeploy → Redeploy
```

### 4. Test Edin (2-3 dakika sonra)

Build tamamlandıktan sonra:
```
https://www.ardahanticaret.com/admin/urunler
```

Hard refresh yapın:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

## 🔍 Kontrol Checklist

### Vercel Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ✅
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **ZORUNLU!**
- [ ] `NEXT_PUBLIC_APP_URL` ✅
- [ ] `JWT_SECRET` ✅

### Build Settings
- [ ] Build cache temizlendi
- [ ] Fresh redeploy yapıldı
- [ ] Build başarılı

### Runtime Kontrolleri
- [ ] `/admin/urunler` açılıyor
- [ ] Ürünler listeleniyor
- [ ] Kategoriler dropdown'da görünüyor
- [ ] Dashboard stats geliyor

---

## 📊 Vercel Logs'da Kontrol

Build tamamlandıktan sonra logs'da şunu görmelisiniz:

```
🔑 Supabase Admin Client using: service-role key   ✅ DOĞRU
```

Eğer şunu görüyorsanız YANLIŞ:
```
🔑 Supabase Admin Client using: anon key   ❌ YANLIŞ!
```

---

## 🎯 Sonuç

**Service role key** olmadan:
- ❌ Ürünler gelmiyor
- ❌ Kategoriler gelmiyor
- ❌ Dashboard stats gelmiyor
- ❌ RLS bypass edilemiyor

**Service role key** ile:
- ✅ Tüm veriler geliyor
- ✅ RLS bypass ediliyor
- ✅ Full admin access
- ✅ Local gibi çalışıyor

---

## ⚠️ Güvenlik Notu

**Service Role Key**:
- 🔒 ASLA git'e commit etmeyin!
- 🔒 ASLA client-side'da kullanmayın!
- 🔒 SADECE server-side'da kullanın
- 🔒 Environment variable olarak saklayın

---

## 🚀 Özet

1. Supabase'den service_role key al
2. Vercel'e environment variable olarak ekle
3. Redeploy yap (cache temizle)
4. 2-3 dakika bekle
5. Hard refresh yap
6. Ürünler gelecek! 🎉

---

**Son Güncelleme**: 13 Ekim 2025
**Durum**: ACİL - Production'da ürünler gelmiyor
**Çözüm Süresi**: 5 dakika

