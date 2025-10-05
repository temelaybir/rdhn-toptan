import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  Database, 
  Mail,
  Phone,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function GizlilikPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Gizlilik Politikası</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Kişisel verilerinizin güvenliği bizim için çok önemlidir. Bu politika, 
          verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          Son güncelleme: 15 Ocak 2025
        </div>
      </div>

      {/* Genel Bilgiler */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Genel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              RDHN Commerce olarak, kişisel verilerinizin güvenliğini korumak ve gizliliğinizi 
              sağlamak için gerekli tüm önlemleri almaktayız. Bu gizlilik politikası, 
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır.
            </p>
            <p className="text-muted-foreground">
              Bu politika, web sitemizi ziyaret ettiğinizde, ürün satın aldığınızda veya 
              hizmetlerimizi kullandığınızda hangi bilgilerin toplandığını ve nasıl kullanıldığını açıklar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toplanan Veriler */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Topladığımız Veriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Kişisel Bilgiler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Ad, soyad ve iletişim bilgileri</li>
                <li>• E-posta adresi ve telefon numarası</li>
                <li>• Doğum tarihi ve cinsiyet bilgisi</li>
                <li>• Adres bilgileri</li>
                <li>• Ödeme bilgileri (güvenli şekilde işlenir)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Teknik Bilgiler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• IP adresi ve tarayıcı bilgileri</li>
                <li>• Çerez (cookie) verileri</li>
                <li>• Cihaz bilgileri ve işletim sistemi</li>
                <li>• Site kullanım istatistikleri</li>
                <li>• Arama geçmişi ve tercihler</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Veri Kullanım Amaçları */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Verilerin Kullanım Amaçları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Hizmet Sağlama</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Sipariş işleme ve teslimat</li>
                  <li>• Müşteri hizmetleri desteği</li>
                  <li>• Hesap yönetimi ve güvenlik</li>
                  <li>• Ödeme işlemleri</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">İyileştirme ve Analiz</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Site performansını iyileştirme</li>
                  <li>• Kullanıcı deneyimini geliştirme</li>
                  <li>• Ürün önerileri sunma</li>
                  <li>• Pazarlama analizleri</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Yasal Yükümlülükler</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Vergi ve muhasebe gereklilikleri</li>
                <li>• Yasal düzenlemelere uyum</li>
                <li>• Güvenlik ve dolandırıcılık önleme</li>
                <li>• Hukuki uyuşmazlık çözümü</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Veri Paylaşımı */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Veri Paylaşımı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verilerinizi, aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Hizmet Sağlayıcılar</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Kargo firmaları (teslimat için)</li>
                  <li>• Ödeme işlemcileri (güvenli ödeme için)</li>
                  <li>• Hosting ve teknik hizmet sağlayıcıları</li>
                  <li>• Müşteri hizmetleri platformları</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Yasal Durumlar</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Yasal zorunluluk durumunda</li>
                  <li>• Mahkeme kararı ile</li>
                  <li>• Güvenlik tehdidi durumunda</li>
                  <li>• Hukuki hakların korunması için</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Veri Güvenliği */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Veri Güvenliği
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verilerinizin güvenliği için aşağıdaki önlemleri almaktayız:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Teknik Önlemler</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• SSL şifreleme protokolü</li>
                  <li>• Güvenli veri depolama sistemleri</li>
                  <li>• Düzenli güvenlik güncellemeleri</li>
                  <li>• Erişim kontrolü ve yetkilendirme</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Organizasyonel Önlemler</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Personel gizlilik eğitimleri</li>
                  <li>• Veri erişim protokolleri</li>
                  <li>• Düzenli güvenlik denetimleri</li>
                  <li>• Olay müdahale planları</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Çerezler */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Çerez (Cookie) Politikası</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Web sitemizde, kullanıcı deneyimini iyileştirmek ve site performansını 
              artırmak için çerezler kullanmaktayız.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Zorunlu Çerezler</h3>
                <p className="text-sm text-muted-foreground">
                  Sitenin temel işlevleri için gerekli olan çerezlerdir. 
                  Bu çerezler olmadan site düzgün çalışmaz.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Analitik Çerezler</h3>
                <p className="text-sm text-muted-foreground">
                  Site kullanımını analiz etmek ve performansı iyileştirmek 
                  için kullanılan çerezlerdir.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Pazarlama Çerezleri</h3>
                <p className="text-sm text-muted-foreground">
                  Size özel reklamlar ve içerikler sunmak için kullanılan çerezlerdir. 
                  Bu çerezleri tarayıcınızdan kontrol edebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Haklarınız */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>KVKK Kapsamındaki Haklarınız</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>• Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>• Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>• Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
              </ul>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                <li>• KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>• Kişisel verilerinizin aktarıldığı üçüncü kişilere yukarıda sayılan (e) ve (f) bentleri uyarınca yapılan işlemlerin bildirilmesini isteme</li>
                <li>• İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişiliğiniz aleyhine bir sonucun ortaya çıkmasına itiraz etme</li>
              </ul>
            </div>
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
              Gizlilik politikamızla ilgili sorularınız veya haklarınızı kullanmak istiyorsanız, 
              aşağıdaki iletişim kanallarından bize ulaşabilirsiniz:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">kvkk@rdhncommerce.com</span>
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
          <CardTitle>Politika Güncellemeleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bu gizlilik politikası, yasal düzenlemelerdeki değişiklikler veya 
              iş süreçlerimizdeki güncellemeler nedeniyle değiştirilebilir. 
              Önemli değişiklikler olduğunda sizi e-posta ile bilgilendireceğiz.
            </p>
            <p className="text-muted-foreground">
              Politikanın güncel versiyonunu her zaman bu sayfada bulabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
