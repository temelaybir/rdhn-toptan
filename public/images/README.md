E-ticaret sitenizde kullanılan görsel alanlarının boyutlarını analiz edelim. Önce mevcut kodlardaki görsel boyutlarını inceleyelim:
Search files...
Ran tool

Mevcut sisteminizdeki tüm görsel alanlarının boyutlarını analiz ettim. İşte detaylı bilgiler:

## 🖼️ **RDHN Commerce - Görsel Boyutları Rehberi**

### **📱 Mobil ve Masaüstü Boyutlar**

---

### 1. Hero Carousel Görselleri (`/hero/`)

#### 🎯 Optimal Boyutlar (Container'a Uygun)
- **Desktop:** `1920x600px` (3.2:1 ratio) - MEVCUT BOYUT İDEAL
- **Mobile:** `768x400px` (1.9:1 ratio) - Mobil için optimize
- **Retina Desktop:** `3840x1200px` (3.2:1 ratio, 2x çözünürlük)
- **Retina Mobile:** `1536x800px` (1.9:1 ratio, 2x çözünürlük)

#### 📱 Responsive Container Boyutları
| Breakpoint | Container Yükseklik | İdeal Görsel Boyutu |
|------------|--------------------|--------------------|
| Base (320px+) | 280px | 896x280px |
| Small (640px+) | 320px | 1024x320px |
| Medium (768px+) | 360px | 1152x360px |
| Large (1024px+) | 400px | 1280x400px |
| XL (1280px+) | 480px | 1536x480px |
| 2XL (1536px+) | 520px | 1920x600px ✅ |

#### 🔧 Teknik Özellikler
- **Format:** WebP (öncelikli), JPG alternatif
- **Kalite:** %95 compression (hero için en yüksek)
- **Dosya boyutu:** Max 300KB (desktop), Max 200KB (mobile)
- **Priority Loading:** Aktif (above-the-fold content)
- **Açıklama:** Ana sayfa hero slider görselleri

**Dosya adlandırma:**
- `hero-01-desktop-1920x600.webp` (masaüstü)
- `hero-01-mobile-768x400.webp` (mobil)
- `hero-02-desktop-1920x600.webp`
- `hero-02-mobile-768x400.webp`

---

### 2. Kampanya Banners (`/banners/`)

#### 🎯 Optimal Boyutlar (Container'a Uygun)
- **Büyük banner:** `1200x400px` (3:1 ratio) - NET GÖRÜNTÜ İÇİN ÖNERİLEN
- **Orta banner:** `600x200px` (3:1 ratio) - NET GÖRÜNTÜ İÇİN ÖNERİLEN  
- **Küçük banner:** `600x200px` (3:1 ratio)

#### 📱 Retina/Yüksek Çözünürlük İçin
- **Büyük banner:** `2400x800px` (3:1 ratio, 2x boyut)
- **Orta banner:** `1200x400px` (3:1 ratio, 2x boyut)
- **Küçük banner:** `1200x400px` (3:1 ratio, 2x boyut)

#### 🔧 Teknik Özellikler
- **Format:** WebP (öncelikli), JPG alternatif
- **Kalite:** %85-90 arası compression
- **Dosya boyutu:** Max 150KB (standard), Max 250KB (retina)
- **Color Space:** sRGB
- **DPI:** 72 (web için)

**Dosya adlandırma:**
- `banner-yilbasi-1200x400.webp` (standard)
- `banner-yilbasi-2400x800.webp` (retina)
- `banner-teknoloji-600x200.webp` (küçük)

---

## **3. 🛍️ Ürün Görselleri**

### **Product Card (Liste/Grid)**
- **Container:** `200px` - `240px` yükseklik
- **Önerilen Boyut:** `400x400px` (1:1 kare)
- **Format:** JPG/WebP, Max 100KB

### **Product Detail Sayfası**
- **Ana Görsel:** `600x600px` (1:1 kare)
- **Thumbnail'lar:** `100x100px` (1:1 kare)
- **Galeri Görselleri:** `600x600px` (1:1 kare)
- **Format:** JPG/WebP, Max 200KB

### **Ürün Yöneticisi (Admin)**
- **Admin Listesi:** `50x50px` (küçük önizleme)
- **Görsel Yöneticisi:** `aspect-square` (1:1 kare)

---

## **4. 🏢 Site Logosu (Header)**

**Boyut Seçenekleri:**
- **Küçük:** `140x140px`
- **Orta:** `160x160px`  
- **Büyük:** `180x180px`
- **Format:** PNG (şeffaf), SVG tercih edilir
- **Max Boyut:** 50KB

---

## **5. 🏷️ Kategori Görselleri**

**Önerilen Boyutlar:**
- **Showcase:** `400x400px` (1:1 kare)
- **Liste:** `300x300px` (1:1 kare)
- **Format:** JPG/WebP, Max 100KB

---

## **6. 🏭 Marka Logoları**

**Boyutlar:**
- **Standard:** `200x100px` (2:1 oranı)
- **Showcase:** `90x90px` (1:1 kare)
- **Format:** PNG (şeffaf arka plan)
- **Max Boyut:** 50KB

---

## **7. 🔧 Default/Fallback Boyutlar**

**SafeImage Component:**
- **Default:** `400x400px` (width/height belirtilmezse)
- **Placeholder:** `400x400px` (placeholder-product.svg)

---

## **📏 Responsive Breakpoints**

```css
/* Tailwind CSS Breakpoints */
sm: 640px    /* Küçük tablet */
md: 768px    /* Tablet */
lg: 1024px   /* Küçük masaüstü */
xl: 1280px   /* Masaüstü */
2xl: 1536px  /* Büyük masaüstü */
```

---

## **🎨 Görsel Optimizasyon Tavsiyeleri**

### **Format Seçimi:**
- **JPG:** Fotoğrafik görseller, renkli ürünler
- **WebP:** Modern tarayıcılar için optimizasyon (%30 daha küçük)
- **PNG:** Logolar, şeffaf arka plan gereken görseller
- **SVG:** İkonlar, basit logolar (vektör)

### **Kalite Ayarları:**
- **DPI:** 72 (web için yeterli)
- **Color Space:** sRGB
- **Compression:** Web için optimize

### **Dosya Boyutu Limitleri:**
- **Hero Slider:** Max 300KB
- **Banner:** Max 150KB  
- **Ürün Ana:** Max 200KB
- **Ürün Thumb:** Max 100KB
- **Logo:** Max 50KB

---

## **📱 Mobil Optimizasyon**

### **Önemli Notlar:**
1. **Mobile First:** Önce küçük ekran boyutları düşünülmeli
2. **Art Direction:** Önemli detaylar mobilde görünür olmalı
3. **Loading Performance:** Mobilde daha küçük boyutlar kullan
4. **Touch Friendly:** Tıklanabilir alanlar minimum 44px

### **Responsive Images Kullanımı:**
```jsx
<SafeImage
  src={imageUrl}
  alt="Açıklama"
  width={600}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

Bu boyutlar mevcut sisteminize göre optimize edilmiştir. Yeni görseller eklerken bu standartları takip etmenizi öneriyorum! 🎯

---

## **🎉 YENİ ÖZELLİKLER**

### **📱 Mobil Görsel Desteği Eklendi!**

#### **Admin Panel Güncellemeleri:**

**1. Hero Slider:**
- ✅ Mobil görsel alanı zaten mevcut
- Admin panelde "Mobil Görsel URL" alanı var
- Masaüstü ve mobil için ayrı görseller yükleyebilirsiniz

**2. Kampanya Bannerları:**
- ✅ **YENİ!** Mobil görsel desteği eklendi
- Admin panel → İçerik → Bannerlar bölümünde:
  - "Görsel URL (Desktop)" - Masaüstü için
  - "Mobil Görsel URL" - Mobil cihazlar için (YENİ!)

#### **Mobil Optimizasyon İyileştirmeleri:**

**1. Kategori Showcase:**
- ✅ Mobilde daha kompakt görünüm
- ✅ Radius eklendi (rounded-2xl)
- ✅ Boşluklar azaltıldı (gap-3 md:gap-4)
- ✅ Mobil touch indicator eklendi
- ✅ Responsive text boyutları

**2. Campaign Banners:**
- ✅ Picture element ile responsive görsel desteği
- ✅ Mobilde otomatik olarak mobil görsel gösterir

**3. Hero Carousel:**
- ✅ Mobil/masaüstü görsel otomatiği mevcut
- ✅ Responsive boyutlandırma aktif

#### **Kullanım Rehberi:**

**Hero Slider için:**
```
Admin → Hero Slider → Yeni/Düzenle
• Görsel URL: /images/hero/slide-1-desktop.jpg
• Mobil Görsel URL: /images/hero/slide-1-mobile.jpg
```

**Kampanya Bannerları için:**
```
Admin → İçerik → Bannerlar → Yeni/Düzenle
• Görsel URL (Desktop): /images/banners/banner-desktop.jpg
• Mobil Görsel URL: /images/banners/banner-mobile.jpg
```

**Önerilen Mobil Boyutlar:**
- **Hero Mobil:** 768x400px
- **Banner Mobil:** 400x300px

Bu güncellemelerle mobil deneyim çok daha iyi olacak! 🚀