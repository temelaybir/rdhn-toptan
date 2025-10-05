-- İç sayfalar için veritabanı şeması
CREATE TABLE IF NOT EXISTS internal_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    meta_keywords TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan iç sayfaları ekle
INSERT INTO internal_pages (slug, title, content, meta_description, meta_keywords) VALUES
('hakkimizda', 'Hakkımızda', 
'<h1>Hakkımızda</h1>
<p>Biz, müşterilerimize en kaliteli ürünleri en uygun fiyatlarla sunmayı hedefleyen bir e-ticaret platformuyuz.</p>

<h2>Misyonumuz</h2>
<p>Müşterilerimize güvenilir, hızlı ve kaliteli alışveriş deneyimi sunmak.</p>

<h2>Vizyonumuz</h2>
<p>Türkiye''nin önde gelen e-ticaret platformlarından biri olmak.</p>

<h2>Değerlerimiz</h2>
<ul>
    <li>Müşteri memnuniyeti</li>
    <li>Kalite</li>
    <li>Güvenilirlik</li>
    <li>Şeffaflık</li>
</ul>

<h2>Hikayemiz</h2>
<p>2020 yılında kurulan şirketimiz, kısa sürede binlerce müşteriye hizmet vermeye başladı. Bugün Türkiye''nin dört bir yanından müşterilerimize hizmet veriyoruz.</p>

<h2>İstatistiklerimiz</h2>
<ul>
    <li>10.000+ ürün</li>
    <li>50.000+ mutlu müşteri</li>
    <li>%99 müşteri memnuniyeti</li>
    <li>24/7 müşteri desteği</li>
</ul>

<h2>İletişim</h2>
<p>Bizimle iletişime geçmek için <a href="/iletisim">iletişim sayfamızı</a> ziyaret edebilirsiniz.</p>',
'Şirketimiz hakkında detaylı bilgi alın. Misyon, vizyon ve değerlerimizi keşfedin.',
'hakkımızda, şirket, misyon, vizyon, değerler'),

('iletisim', 'İletişim', 
'<h1>İletişim</h1>
<p>Bizimle iletişime geçmek için aşağıdaki yöntemleri kullanabilirsiniz.</p>

<h2>İletişim Bilgileri</h2>
<div class="contact-info">
    <h3>Adres</h3>
    <p>Örnek Mahallesi, E-ticaret Caddesi No:123<br>
    Kadıköy/İstanbul, 34700</p>
    
    <h3>Telefon</h3>
    <p>+90 (212) 555 0123</p>
    
    <h3>E-posta</h3>
    <p>info@example.com</p>
    
    <h3>Çalışma Saatleri</h3>
    <p>Pazartesi - Cuma: 09:00 - 18:00<br>
    Cumartesi: 09:00 - 14:00<br>
    Pazar: Kapalı</p>
</div>

<h2>İletişim Formu</h2>
<p>Mesajınızı göndermek için aşağıdaki formu kullanabilirsiniz.</p>

<h2>Konum</h2>
<p>Harita burada görüntülenecek.</p>

<h2>Sık Sorulan Sorular</h2>
<p>Genel sorularınız için <a href="/sss">SSS sayfamızı</a> ziyaret edebilirsiniz.</p>',
'Bizimle iletişime geçin. Adres, telefon, e-posta ve çalışma saatlerimizi öğrenin.',
'iletişim, adres, telefon, e-posta, çalışma saatleri'),

('kariyer', 'Kariyer', 
'<h1>Kariyer</h1>
<p>Başarılı bir kariyer için doğru adrestesiniz. Dinamik ve yenilikçi ekibimize katılın.</p>

<h2>Neden Biz?</h2>
<ul>
    <li>Esnek çalışma saatleri</li>
    <li>Uzaktan çalışma imkanı</li>
    <li>Profesyonel gelişim fırsatları</li>
    <li>Rekabetçi maaş ve yan haklar</li>
    <li>Modern ofis ortamı</li>
    <li>Ekip aktiviteleri</li>
</ul>

<h2>Açık Pozisyonlar</h2>

<h3>Yazılım Geliştirici</h3>
<p><strong>Departman:</strong> Teknoloji<br>
<strong>Konum:</strong> İstanbul<br>
<strong>Çalışma Türü:</strong> Tam Zamanlı<br>
<strong>Deneyim:</strong> 2+ yıl<br>
<strong>Maaş:</strong> Rekabetçi</p>

<h4>Gereksinimler:</h4>
<ul>
    <li>JavaScript/TypeScript deneyimi</li>
    <li>React/Next.js bilgisi</li>
    <li>Veritabanı deneyimi</li>
    <li>Git kullanımı</li>
</ul>

<h3>Pazarlama Uzmanı</h3>
<p><strong>Departman:</strong> Pazarlama<br>
<strong>Konum:</strong> İstanbul<br>
<strong>Çalışma Türü:</strong> Tam Zamanlı<br>
<strong>Deneyim:</strong> 1+ yıl<br>
<strong>Maaş:</strong> Rekabetçi</p>

<h4>Gereksinimler:</h4>
<ul>
    <li>Dijital pazarlama deneyimi</li>
    <li>Sosyal medya yönetimi</li>
    <li>İçerik üretimi</li>
    <li>Analitik araçları bilgisi</li>
</ul>

<h2>Başvuru Formu</h2>
<p>Genel başvuru için aşağıdaki formu kullanabilirsiniz.</p>',
'Kariyer fırsatlarımızı keşfedin. Açık pozisyonlar ve başvuru bilgileri.',
'kariyer, iş ilanları, açık pozisyonlar, başvuru'),

('basin', 'Basın', 
'<h1>Basın</h1>
<p>Basın mensupları için özel bilgiler ve kaynaklar.</p>

<h2>Basın Bültenleri</h2>

<h3>Şirketimiz Yeni Ürün Kategorisi Lansmanı Yapıyor</h3>
<p><strong>Tarih:</strong> 15 Ocak 2024</p>
<p>Şirketimiz, müşterilerinin artan talepleri doğrultusunda yeni ürün kategorisi lansmanı gerçekleştiriyor...</p>
<p><a href="#">Devamını Oku</a> | <a href="#">PDF İndir</a></p>

<h3>2023 Yılı Performans Raporu</h3>
<p><strong>Tarih:</strong> 10 Ocak 2024</p>
<p>2023 yılında %150 büyüme kaydeden şirketimiz, 2024 yılında da büyümeye devam ediyor...</p>
<p><a href="#">Devamını Oku</a> | <a href="#">PDF İndir</a></p>

<h2>Medya Kit</h2>
<p>Aşağıdaki dosyaları indirebilirsiniz:</p>
<ul>
    <li><a href="#">Şirket Logosu (PNG)</a></li>
    <li><a href="#">Şirket Logosu (SVG)</a></li>
    <li><a href="#">Ürün Görselleri</a></li>
    <li><a href="#">Şirket Profili</a></li>
    <li><a href="#">Yönetim Kurulu Fotoğrafları</a></li>
</ul>

<h2>Basın İletişimi</h2>
<p><strong>Basın Sorumlusu:</strong> Ahmet Yılmaz<br>
<strong>E-posta:</strong> press@example.com<br>
<strong>Telefon:</strong> +90 (212) 555 0124</p>

<h2>Basın Sorgusu Formu</h2>
<p>Basın mensupları için özel sorgu formu.</p>',
'Basın mensupları için özel bilgiler, basın bültenleri ve medya kit.',
'basın, basın bültenleri, medya kit, basın iletişimi'),

('yardim', 'Yardım Merkezi', 
'<h1>Yardım Merkezi</h1>
<p>Size nasıl yardımcı olabiliriz?</p>

<div class="search-section">
    <h2>Arama</h2>
    <p>Yardım aramak için aşağıdaki kutuya yazabilirsiniz.</p>
</div>

<h2>Yardım Kategorileri</h2>

<h3>Alışveriş</h3>
<ul>
    <li><a href="#">Ürün nasıl sipariş edilir?</a></li>
    <li><a href="#">Sipariş durumu nasıl kontrol edilir?</a></li>
    <li><a href="#">Ürün filtreleme nasıl yapılır?</a></li>
    <li><a href="#">Favori ürünler nasıl kaydedilir?</a></li>
</ul>

<h3>Ödeme</h3>
<ul>
    <li><a href="#">Hangi ödeme yöntemleri kabul ediliyor?</a></li>
    <li><a href="#">Kredi kartı bilgileri güvenli mi?</a></li>
    <li><a href="#">Taksit seçenekleri nelerdir?</a></li>
    <li><a href="#">Fatura bilgileri nasıl değiştirilir?</a></li>
</ul>

<h3>Kargo ve Teslimat</h3>
<ul>
    <li><a href="#">Kargo takibi nasıl yapılır?</a></li>
    <li><a href="#">Teslimat süreleri ne kadar?</a></li>
    <li><a href="#">Kargo ücreti ne kadar?</a></li>
    <li><a href="#">Adres değişikliği nasıl yapılır?</a></li>
</ul>

<h3>İade ve Değişim</h3>
<ul>
    <li><a href="#">İade süreci nasıl işler?</a></li>
    <li><a href="#">Hangi ürünler iade edilemez?</a></li>
    <li><a href="#">Değişim nasıl yapılır?</a></li>
    <li><a href="#">Para iadesi ne kadar sürer?</a></li>
</ul>

<h2>Popüler Sorular</h2>
<ul>
    <li><a href="#">Şifremi unuttum, ne yapmalıyım?</a></li>
    <li><a href="#">Ürün stokta yok, ne zaman gelecek?</a></li>
    <li><a href="#">Kupon kodu nasıl kullanılır?</a></li>
    <li><a href="#">Hesabımı nasıl silebilirim?</a></li>
</ul>

<h2>İletişim Seçenekleri</h2>
<p>Hala yardıma ihtiyacınız varsa:</p>
<ul>
    <li><strong>Canlı Destek:</strong> 24/7 hizmet</li>
    <li><strong>Telefon:</strong> +90 (212) 555 0123</li>
    <li><strong>E-posta:</strong> destek@example.com</li>
    <li><strong>WhatsApp:</strong> +90 555 123 4567</li>
</ul>',
'Yardım merkezi. Sık sorulan sorular, kategoriler ve iletişim seçenekleri.',
'yardım, destek, sık sorulan sorular, iletişim'),

('iade-degisim', 'İade ve Değişim', 
'<h1>İade ve Değişim</h1>
<p>Müşteri memnuniyeti bizim için çok önemli. İade ve değişim süreçlerimiz hakkında bilgi alın.</p>

<h2>İade Süreci</h2>
<ol>
    <li><strong>Siparişinizi alın:</strong> Ürününüzü teslim aldıktan sonra 14 gün içinde iade talebinde bulunabilirsiniz.</li>
    <li><strong>İade talebi oluşturun:</strong> Hesabınızdan sipariş detaylarına giderek iade talebi oluşturun.</li>
    <li><strong>Ürünü gönderin:</strong> Size verilen kargo etiketi ile ürünü gönderin.</li>
    <li><strong>Kontrol süreci:</strong> Ürün kontrol edildikten sonra iade onaylanır.</li>
    <li><strong>Para iadesi:</strong> Onay sonrası 3-5 iş günü içinde para iadesi yapılır.</li>
</ol>

<h2>İade Koşulları</h2>
<ul>
    <li>Ürün orijinal ambalajında olmalıdır</li>
    <li>Ürün kullanılmamış olmalıdır</li>
    <li>Eksik parça olmamalıdır</li>
    <li>Etiketler çıkarılmamış olmalıdır</li>
    <li>14 günlük süre aşılmamış olmalıdır</li>
</ul>

<h2>İade Edilemeyen Ürünler</h2>
<ul>
    <li>Kişisel bakım ürünleri</li>
    <li>İç çamaşırı ve mayo</li>
    <li>Yüzük, küpe gibi takılar</li>
    <li>Dijital ürünler</li>
    <li>Özel sipariş ürünleri</li>
    <li>Gıda ürünleri</li>
</ul>

<h2>Değişim Süreci</h2>
<p>Ürününüzde kusur varsa veya yanlış ürün gönderildiyse:</p>
<ol>
    <li>Müşteri hizmetlerimizle iletişime geçin</li>
    <li>Fotoğraf veya video ile sorunu belgelendirin</li>
    <li>Ürünü kargo ile gönderin</li>
    <li>Yeni ürün size gönderilir</li>
</ol>

<h2>Kargo Ücretleri</h2>
<ul>
    <li><strong>İade:</strong> Müşteri tarafından karşılanır</li>
    <li><strong>Değişim:</strong> Şirket tarafından karşılanır</li>
    <li><strong>Kusurlu ürün:</strong> Şirket tarafından karşılanır</li>
</ul>

<h2>İade/Değişim Talebi Oluştur</h2>
<p>İade veya değişim talebinizi oluşturmak için <a href="/profil">hesabınıza</a> giriş yapın.</p>',
'İade ve değişim süreçleri, koşulları ve talep oluşturma.',
'iade, değişim, iade süreci, iade koşulları'),

('kargo-takip', 'Kargo Takip', 
'<h1>Kargo Takip</h1>
<p>Siparişinizin durumunu takip edin ve teslimat bilgilerini öğrenin.</p>

<h2>Sipariş Takibi</h2>
<p>Sipariş numaranızı girerek kargo durumunu öğrenebilirsiniz.</p>

<h2>Teslimat Süreleri</h2>
<ul>
    <li><strong>İstanbul:</strong> 1-2 iş günü</li>
    <li><strong>Ankara, İzmir:</strong> 2-3 iş günü</li>
    <li><strong>Diğer şehirler:</strong> 3-5 iş günü</li>
    <li><strong>Köy ve kasabalar:</strong> 5-7 iş günü</li>
</ul>

<h2>Kargo Durumları</h2>
<ul>
    <li><strong>Sipariş Alındı:</strong> Siparişiniz sisteme kaydedildi</li>
    <li><strong>Hazırlanıyor:</strong> Ürününüz paketleniyor</li>
    <li><strong>Kargoya Verildi:</strong> Kargo firmasına teslim edildi</li>
    <li><strong>Yolda:</strong> Kargo yola çıktı</li>
    <li><strong>Dağıtımda:</strong> Teslimat için yola çıktı</li>
    <li><strong>Teslim Edildi:</strong> Ürün teslim edildi</li>
</ul>

<h2>Kargo Firmaları</h2>
<p>Anlaşmalı kargo firmalarımız:</p>
<ul>
    <li>Aras Kargo</li>
    <li>Yurtiçi Kargo</li>
    <li>MNG Kargo</li>
    <li>PTT Kargo</li>
    <li>UPS Kargo</li>
</ul>

<h2>Sık Sorulan Sorular</h2>
<ul>
    <li><a href="#">Kargo takip numarası nerede bulunur?</a></li>
    <li><a href="#">Teslimat sırasında evde olmazsam ne olur?</a></li>
    <li><a href="#">Kargo ücreti ne kadar?</a></li>
    <li><a href="#">Adres değişikliği yapabilir miyim?</a></li>
    <li><a href="#">Kargo hasarlı gelirse ne yapmalıyım?</a></li>
</ul>

<h2>İletişim</h2>
<p>Kargo ile ilgili sorularınız için:</p>
<ul>
    <li><strong>Telefon:</strong> +90 (212) 555 0123</li>
    <li><strong>E-posta:</strong> kargo@example.com</li>
    <li><strong>Canlı Destek:</strong> 24/7 hizmet</li>
</ul>',
'Kargo takip, teslimat süreleri ve kargo firmaları hakkında bilgi.',
'kargo takip, teslimat, kargo durumu, kargo firmaları'),

('sss', 'Sık Sorulan Sorular', 
'<h1>Sık Sorulan Sorular</h1>
<p>En çok sorulan soruların cevaplarını burada bulabilirsiniz.</p>

<div class="search-section">
    <h2>Arama</h2>
    <p>Spesifik bir soru aramak için aşağıdaki kutuya yazabilirsiniz.</p>
</div>

<h2>Genel Sorular</h2>

<h3>Hesap ve Üyelik</h3>
<div class="faq-item">
    <h4>Hesap nasıl oluşturulur?</h4>
    <p>Ana sayfadaki "Giriş Yap" butonuna tıklayarak "Hesap Oluştur" seçeneğini seçebilirsiniz.</p>
</div>

<div class="faq-item">
    <h4>Şifremi unuttum, ne yapmalıyım?</h4>
    <p>Giriş sayfasında "Şifremi Unuttum" linkine tıklayarak e-posta adresinize sıfırlama linki gönderebiliriz.</p>
</div>

<div class="faq-item">
    <h4>Hesabımı nasıl silebilirim?</h4>
    <p>Hesap ayarlarından "Hesabı Sil" seçeneğini kullanabilirsiniz. Bu işlem geri alınamaz.</p>
</div>

<h3>Alışveriş</h3>
<div class="faq-item">
    <h4>Ürün nasıl sipariş edilir?</h4>
    <p>Ürün sayfasında "Sepete Ekle" butonuna tıklayın, sepetinizi kontrol edin ve ödeme adımlarını takip edin.</p>
</div>

<div class="faq-item">
    <h4>Kupon kodu nasıl kullanılır?</h4>
    <p>Ödeme sayfasında "Kupon Kodu" alanına kodunuzu yazın ve "Uygula" butonuna tıklayın.</p>
</div>

<div class="faq-item">
    <h4>Ürün stokta yok, ne zaman gelecek?</h4>
    <p>Ürün sayfasında "Stok Habercisi" butonuna tıklayarak e-posta ile bilgilendirme alabilirsiniz.</p>
</div>

<h3>Ödeme</h3>
<div class="faq-item">
    <h4>Hangi ödeme yöntemleri kabul ediliyor?</h4>
    <p>Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme seçenekleri mevcuttur.</p>
</div>

<div class="faq-item">
    <h4>Kredi kartı bilgileri güvenli mi?</h4>
    <p>Evet, tüm ödeme işlemleri SSL şifreleme ile korunmaktadır.</p>
</div>

<div class="faq-item">
    <h4>Taksit seçenekleri nelerdir?</h4>
    <p>Kredi kartınıza göre 3, 6, 9 veya 12 taksit seçenekleri sunulmaktadır.</p>
</div>

<h3>Kargo ve Teslimat</h3>
<div class="faq-item">
    <h4>Kargo takip numarası nerede bulunur?</h4>
    <p>Hesabınızdaki "Siparişlerim" bölümünden sipariş detaylarını görüntüleyebilirsiniz.</p>
</div>

<div class="faq-item">
    <h4>Teslimat sırasında evde olmazsam ne olur?</h4>
    <p>Kargo firması size bilgi notu bırakacak ve tekrar teslimat denemesi yapacaktır.</p>
</div>

<div class="faq-item">
    <h4>Kargo ücreti ne kadar?</h4>
    <p>150 TL üzeri alışverişlerde kargo ücretsizdir. Altındaki siparişlerde 15 TL kargo ücreti alınır.</p>
</div>

<h3>İade ve Değişim</h3>
<div class="faq-item">
    <h4>İade süreci nasıl işler?</h4>
    <p>14 gün içinde ürünü orijinal ambalajında iade edebilirsiniz. Detaylar için iade sayfamızı ziyaret edin.</p>
</div>

<div class="faq-item">
    <h4>Hangi ürünler iade edilemez?</h4>
    <p>Kişisel bakım ürünleri, iç çamaşırı, takılar ve dijital ürünler iade edilemez.</p>
</div>

<div class="faq-item">
    <h4>Para iadesi ne kadar sürer?</h4>
    <p>İade onayından sonra 3-5 iş günü içinde para iadesi yapılır.</p>
</div>

<h2>Hala Yardıma İhtiyacınız Var mı?</h2>
<p>Sorunuzun cevabını bulamadıysanız bizimle iletişime geçebilirsiniz:</p>
<ul>
    <li><strong>Canlı Destek:</strong> 24/7 hizmet</li>
    <li><strong>Telefon:</strong> +90 (212) 555 0123</li>
    <li><strong>E-posta:</strong> destek@example.com</li>
</ul>',
'Sık sorulan sorular ve cevapları. Hesap, alışveriş, ödeme, kargo ve iade konularında yardım.',
'sık sorulan sorular, SSS, yardım, destek'),

('gizlilik', 'Gizlilik Politikası', 
'<h1>Gizlilik Politikası</h1>
<p>Son güncelleme: 15 Ocak 2024</p>

<p>Bu gizlilik politikası, web sitemizi ziyaret ettiğinizde veya hizmetlerimizi kullandığınızda toplanan bilgilerin nasıl kullanıldığını açıklar.</p>

<h2>Toplanan Bilgiler</h2>

<h3>Kişisel Bilgiler</h3>
<p>Aşağıdaki kişisel bilgileri toplayabiliriz:</p>
<ul>
    <li>Ad ve soyad</li>
    <li>E-posta adresi</li>
    <li>Telefon numarası</li>
    <li>Adres bilgileri</li>
    <li>Doğum tarihi</li>
    <li>Cinsiyet</li>
</ul>

<h3>Otomatik Toplanan Bilgiler</h3>
<p>Web sitemizi ziyaret ettiğinizde aşağıdaki bilgiler otomatik olarak toplanır:</p>
<ul>
    <li>IP adresi</li>
    <li>Tarayıcı türü ve versiyonu</li>
    <li>İşletim sistemi</li>
    <li>Ziyaret edilen sayfalar</li>
    <li>Ziyaret süresi</li>
    <li>Çerezler</li>
</ul>

<h2>Bilgilerin Kullanımı</h2>
<p>Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:</p>
<ul>
    <li>Siparişlerinizi işlemek</li>
    <li>Müşteri hizmetleri sağlamak</li>
    <li>Ürün ve hizmetlerimizi geliştirmek</li>
    <li>Güvenliği sağlamak</li>
    <li>Yasal yükümlülükleri yerine getirmek</li>
    <li>Pazarlama faaliyetleri (izin verdiğiniz takdirde)</li>
</ul>

<h2>Bilgi Paylaşımı</h2>
<p>Kişisel bilgilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:</p>
<ul>
    <li>Açık rızanız olduğunda</li>
    <li>Yasal zorunluluk durumunda</li>
    <li>Hizmet sağlayıcılarımızla (kargo, ödeme sistemleri)</li>
    <li>Güvenlik tehditlerini önlemek için</li>
</ul>

<h2>Çerez Politikası</h2>
<p>Web sitemizde çerezler kullanılmaktadır:</p>

<h3>Zorunlu Çerezler</h3>
<p>Web sitesinin temel işlevleri için gereklidir ve devre dışı bırakılamaz.</p>

<h3>Analitik Çerezler</h3>
<p>Web sitesi kullanımını analiz etmek için kullanılır ve performansı iyileştirmemize yardımcı olur.</p>

<h3>Pazarlama Çerezleri</h3>
<p>Size kişiselleştirilmiş reklamlar göstermek için kullanılır.</p>

<h2>Güvenlik</h2>
<p>Kişisel bilgilerinizi korumak için aşağıdaki güvenlik önlemlerini alırız:</p>
<ul>
    <li>SSL şifreleme</li>
    <li>Güvenli veri depolama</li>
    <li>Düzenli güvenlik denetimleri</li>
    <li>Erişim kontrolü</li>
    <li>Veri yedekleme</li>
</ul>

<h2>KVKK Haklarınız</h2>
<p>Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:</p>
<ul>
    <li>Bilgilerinizin işlenip işlenmediğini öğrenme</li>
    <li>Bilgilerinizin işlenme amacını öğrenme</li>
    <li>Bilgilerinizin düzeltilmesini isteme</li>
    <li>Bilgilerinizin silinmesini isteme</li>
    <li>Bilgilerinizin işlenmesinin durdurulmasını isteme</li>
    <li>Bilgilerinizin aktarılmasını isteme</li>
</ul>

<h2>İletişim</h2>
<p>Gizlilik politikamızla ilgili sorularınız için:</p>
<p><strong>E-posta:</strong> gizlilik@example.com<br>
<strong>Adres:</strong> Örnek Mahallesi, E-ticaret Caddesi No:123, Kadıköy/İstanbul</p>

<h2>Değişiklikler</h2>
<p>Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler size e-posta ile bildirilecektir.</p>',
'Gizlilik politikası. Kişisel verilerin toplanması, kullanımı ve korunması hakkında bilgi.',
'gizlilik politikası, kişisel veriler, KVKK, çerez politikası'),

('kullanim-sartlari', 'Kullanım Şartları', 
'<h1>Kullanım Şartları</h1>
<p>Son güncelleme: 15 Ocak 2024</p>

<p>Bu kullanım şartları, web sitemizi kullanırken uymanız gereken kuralları belirler.</p>

<h2>Genel Hükümler</h2>
<p>Bu web sitesini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız:</p>
<ul>
    <li>18 yaşından büyük olduğunuzu</li>
    <li>Verdiğiniz bilgilerin doğru olduğunu</li>
    <li>Bu şartları okuduğunuzu ve kabul ettiğinizi</li>
    <li>Yasal yetkiye sahip olduğunuzu</li>
</ul>

<h2>Üyelik ve Hesap Kuralları</h2>

<h3>Hesap Oluşturma</h3>
<ul>
    <li>Bir kişi sadece bir hesap oluşturabilir</li>
    <li>Hesap bilgilerinizi güncel tutmalısınız</li>
    <li>Hesap güvenliğinizden siz sorumlusunuz</li>
    <li>Şüpheli aktiviteleri bize bildirmelisiniz</li>
</ul>

<h3>Yasaklı Kullanımlar</h3>
<p>Aşağıdaki faaliyetler yasaktır:</p>
<ul>
    <li>Sahte bilgi vermek</li>
    <li>Başkalarının hesaplarını kullanmak</li>
    <li>Sistemi kötüye kullanmak</li>
    <li>Zararlı yazılım yaymak</li>
    <li>Spam göndermek</li>
    <li>Telif hakkı ihlali yapmak</li>
</ul>

<h2>Alışveriş Kuralları</h2>

<h3>Sipariş Verme</h3>
<ul>
    <li>Siparişler stok durumuna göre kabul edilir</li>
    <li>Fiyatlar değişiklik gösterebilir</li>
    <li>Ödeme onayından sonra sipariş kesinleşir</li>
    <li>Yanlış bilgi verilmesi durumunda sipariş iptal edilebilir</li>
</ul>

<h3>Ödeme</h3>
<ul>
    <li>Tüm fiyatlar KDV dahildir</li>
    <li>Kargo ücreti ayrıca belirtilir</li>
    <li>Ödeme güvenliği sağlanır</li>
    <li>Dolandırıcılık durumunda yasal işlem başlatılır</li>
</ul>

<h2>Teslimat Koşulları</h2>
<ul>
    <li>Teslimat süreleri tahminidir</li>
    <li>Mücbir sebepler teslimatı geciktirebilir</li>
    <li>Teslimat sırasında kimlik gösterilmesi gerekebilir</li>
    <li>Adres hatalarından müşteri sorumludur</li>
</ul>

<h2>İade ve Değişim Politikası</h2>
<ul>
    <li>14 gün içinde iade yapılabilir</li>
    <li>Ürün orijinal durumunda olmalıdır</li>
    <li>Bazı ürünler iade edilemez</li>
    <li>İade kargo ücreti müşteriye aittir</li>
</ul>

<h2>Gizlilik ve Güvenlik</h2>
<ul>
    <li>Kişisel verileriniz korunur</li>
    <li>SSL şifreleme kullanılır</li>
 <li>Çerezler kullanılır</li>
    <li>Veriler üçüncü taraflarla paylaşılmaz</li>
</ul>

<h2>Sorumluluk Sınırlaması</h2>
<p>Şirketimiz aşağıdaki durumlarda sorumlu değildir:</p>
<ul>
    <li>Mücbir sebeplerden kaynaklanan zararlar</li>
    <li>Müşteri hatalarından kaynaklanan zararlar</li>
    <li>Üçüncü taraf hizmetlerinden kaynaklanan sorunlar</li>
    <li>Dolaylı zararlar</li>
</ul>

<h2>Fikri Mülkiyet Hakları</h2>
<ul>
    <li>Web sitesi içeriği telif hakkı ile korunur</li>
    <li>Logolar ve markalar tescillidir</li>
    <li>İçerik kopyalanamaz</li>
    <li>İzinsiz kullanım yasaktır</li>
</ul>

<h2>Uyuşmazlık Çözümü</h2>
<ul>
    <li>Öncelikle müzakere yapılır</li>
    <li>Anlaşmazlık durumunda İstanbul Mahkemeleri yetkilidir</li>
    <li>Türk hukuku uygulanır</li>
    <li>Hakemlik mümkündür</li>
</ul>

<h2>Değişiklikler</h2>
<p>Bu şartlar zaman zaman güncellenebilir. Değişiklikler web sitesinde yayınlanır.</p>

<h2>İletişim</h2>
<p>Kullanım şartlarıyla ilgili sorularınız için:</p>
<p><strong>E-posta:</strong> hukuk@example.com<br>
<strong>Adres:</strong> Örnek Mahallesi, E-ticaret Caddesi No:123, Kadıköy/İstanbul</p>',
'Kullanım şartları. Web sitesi kullanımı, üyelik, alışveriş ve yasal hükümler.',
'kullanım şartları, şartlar, yasal hükümler, üyelik kuralları')
ON CONFLICT (slug) DO NOTHING;

-- updated_at trigger oluştur
CREATE OR REPLACE FUNCTION update_internal_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_internal_pages_updated_at
    BEFORE UPDATE ON internal_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_internal_pages_updated_at();

-- RLS etkinleştir
ALTER TABLE internal_pages ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Public can read internal pages" ON internal_pages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage internal pages" ON internal_pages
    FOR ALL USING (auth.role() = 'authenticated');
