import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Shield, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Truck,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function KullanimSartlariPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Kullanım Şartları</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          RDHN Commerce web sitesini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız. 
          Bu şartlar, hizmetlerimizi kullanırken uymanız gereken kuralları belirler.
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          Son güncelleme: 15 Ocak 2025
        </div>
      </div>

      {/* Genel Hükümler */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Genel Hükümler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bu kullanım şartları, RDHN Commerce web sitesini kullanırken geçerli olan 
              tüm kuralları ve koşulları içerir. Siteyi kullanarak bu şartları kabul etmiş sayılırsınız.
            </p>
            <p className="text-muted-foreground">
              Şirketimiz, bu şartları önceden haber vermeksizin değiştirme hakkını saklı tutar. 
              Değişiklikler yayınlandığı tarihten itibaren geçerli olur.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Üyelik ve Hesap */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Üyelik ve Hesap Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Hesap Oluşturma</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 18 yaşından büyük olmanız gerekmektedir</li>
                <li>• Doğru ve güncel bilgiler vermeniz zorunludur</li>
                <li>• Hesap bilgilerinizi güvenli tutmanız sorumluluğunuzdadır</li>
                <li>• Hesabınızla yapılan tüm işlemlerden sorumlusunuz</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Hesap Güvenliği</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Şifrenizi kimseyle paylaşmayın</li>
                <li>• Güçlü bir şifre seçin ve düzenli olarak değiştirin</li>
                <li>• Hesabınızda şüpheli aktivite fark ederseniz bizi bilgilendirin</li>
                <li>• Hesabınızı başkalarının kullanmasına izin vermeyin</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Hesap İptali</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Bu şartları ihlal etmeniz durumunda hesabınız kapatılabilir</li>
                <li>• Hesap kapatma kararı geri alınamaz</li>
                <li>• Kapatılan hesaplarla ilgili veriler saklanabilir</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alışveriş Kuralları */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Alışveriş Kuralları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Ürün Satın Alma</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Ürün fiyatları KDV dahil olarak gösterilir</li>
                <li>• Stok durumu gerçek zamanlı olarak güncellenir</li>
                <li>• Sipariş onayı e-posta ile gönderilir</li>
                <li>• Ödeme onayından sonra sipariş işleme alınır</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Fiyat ve Ödeme</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Fiyatlar değişiklik gösterebilir, sipariş anındaki fiyat geçerlidir</li>
                <li>• Kredi kartı bilgileriniz güvenli şekilde işlenir</li>
                <li>• Taksit seçenekleri bankanıza göre değişiklik gösterir</li>
                <li>• Kapıda ödeme seçeneği mevcuttur</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Sipariş İptali</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Kargoya verilmeden önce sipariş iptal edilebilir</li>
                <li>• İptal durumunda ödeme iadesi yapılır</li>
                <li>• İade süresi ödeme yöntemine göre değişir</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teslimat Koşulları */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Teslimat Koşulları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Teslimat Süreleri</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• İstanbul: 1-2 iş günü</li>
                <li>• Diğer iller: 2-3 iş günü</li>
                <li>• Uzak bölgeler: 3-5 iş günü</li>
                <li>• Özel durumlarda süre uzayabilir</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Teslimat Adresi</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Doğru ve güncel adres bilgisi vermeniz zorunludur</li>
                <li>• Adres hatasından kaynaklanan sorunlardan sorumlusunuz</li>
                <li>• Teslimat sırasında kimlik gösterilmesi gerekebilir</li>
                <li>• Evde bulunmama durumunda kargo firması ile iletişime geçin</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Kargo Ücreti</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 150 TL üzeri alışverişlerde kargo ücretsizdir</li>
                <li>• 150 TL altı siparişlerde 29,90 TL kargo ücreti alınır</li>
                <li>• Uzak bölgeler için ek ücret uygulanabilir</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İade ve Değişim */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>İade ve Değişim Koşulları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">İade Süresi</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Ürünü teslim aldığınız tarihten itibaren 14 gün</li>
                <li>• Ürün kullanılmamış ve orijinal ambalajında olmalıdır</li>
                <li>• İade kargo ücreti şirketimiz tarafından karşılanır</li>
                <li>• İade işlemi 3-5 iş günü içinde tamamlanır</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Değişim Koşulları</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 30 gün içinde beden/renk değişimi yapılabilir</li>
                <li>• Değişim ürünü stokta mevcut olmalıdır</li>
                <li>• Değişim kargo ücreti ücretsizdir</li>
                <li>• Fark ücreti varsa ödeme yapmanız gerekir</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">İade Edilemeyen Ürünler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Kişisel bakım ürünleri</li>
                <li>• İç çamaşırı ve mayo</li>
                <li>• Dijital ürünler</li>
                <li>• Özel sipariş verilen ürünler</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gizlilik ve Güvenlik */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gizlilik ve Güvenlik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Kişisel Veriler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Kişisel verileriniz KVKK kapsamında korunur</li>
                <li>• Verileriniz üçüncü taraflarla paylaşılmaz</li>
                <li>• SSL şifreleme ile güvenli iletişim sağlanır</li>
                <li>• Detaylı bilgi için gizlilik politikamızı inceleyin</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Ödeme Güvenliği</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• PCI DSS standartlarına uygun güvenlik</li>
                <li>• Kredi kartı bilgileri sistemimizde saklanmaz</li>
                <li>• 3D Secure ile ek güvenlik</li>
                <li>• Dolandırıcılık önleme sistemleri</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sorumluluk Sınırları */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sorumluluk Sınırları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Şirket Sorumluluğu</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Hizmet kalitesini koruma yükümlülüğü</li>
                <li>• Kişisel veri güvenliğini sağlama</li>
                <li>• Müşteri hizmetleri desteği sunma</li>
                <li>• Yasal yükümlülüklere uyum</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Kullanıcı Sorumluluğu</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Doğru bilgi verme yükümlülüğü</li>
                <li>• Hesap güvenliğini koruma</li>
                <li>• Yasal düzenlemelere uyum</li>
                <li>• Site kurallarına uyma</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Sorumluluk Sınırları</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Dolaylı zararlardan sorumluluk kabul edilmez</li>
                <li>• Maksimum sorumluluk sipariş tutarı ile sınırlıdır</li>
                <li>• Mücbir sebeplerden kaynaklanan sorunlardan sorumluluk yoktur</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fikri Mülkiyet */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fikri Mülkiyet Hakları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Web sitemizdeki tüm içerik, tasarım, logo, marka ve yazılım RDHN Commerce'in 
              fikri mülkiyeti altındadır. Bu içeriklerin izinsiz kullanımı yasaktır.
            </p>
            <p className="text-muted-foreground">
              Ürün görselleri ve açıklamaları üretici firmaların izni ile kullanılmaktadır. 
              Bu içeriklerin ticari amaçla kullanımı için ilgili firmalardan izin alınması gerekir.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uyuşmazlık Çözümü */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Uyuşmazlık Çözümü</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bu kullanım şartlarından doğan uyuşmazlıklar öncelikle müzakere yoluyla çözülmeye çalışılır. 
              Müzakere sonucu çözüm bulunamazsa, İstanbul Mahkemeleri ve İcra Müdürlükleri yetkilidir.
            </p>
            <p className="text-muted-foreground">
              Tüketici uyuşmazlıkları için Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* İletişim */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>İletişim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kullanım şartlarıyla ilgili sorularınız için aşağıdaki iletişim kanallarından 
              bize ulaşabilirsiniz:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">hukuk@rdhncommerce.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">+90 (212) 123 45 67</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Pazartesi - Cuma: 09:00 - 18:00</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Adres: Merkez Mahallesi, E-Ticaret Caddesi No: 123, Şişli / İstanbul
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Güncellemeler */}
      <Card>
        <CardHeader>
          <CardTitle>Şartların Güncellenmesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bu kullanım şartları, yasal düzenlemelerdeki değişiklikler veya 
              iş süreçlerimizdeki güncellemeler nedeniyle değiştirilebilir. 
              Önemli değişiklikler olduğunda sizi e-posta ile bilgilendireceğiz.
            </p>
            <p className="text-muted-foreground">
              Güncel kullanım şartlarını her zaman bu sayfada bulabilirsiniz. 
              Siteyi kullanmaya devam ederek güncel şartları kabul etmiş sayılırsınız.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
