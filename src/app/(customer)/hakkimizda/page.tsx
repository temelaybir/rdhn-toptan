import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Users, Award, Truck, Shield } from 'lucide-react'
import Link from 'next/link'

export default function HakkimizdaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Hakkımızda</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Türkiye'nin en güvenilir online alışveriş platformu olarak, müşterilerimize en kaliteli ürünleri 
          en uygun fiyatlarla sunmaya devam ediyoruz.
        </p>
      </div>

      {/* Misyon & Vizyon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Misyonumuz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Müşterilerimize güvenli, hızlı ve kaliteli alışveriş deneyimi sunarak, 
              teknolojinin gücüyle hayatlarını kolaylaştırmak ve memnuniyetlerini en üst seviyede tutmak.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Vizyonumuz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Türkiye'nin lider e-ticaret platformu olarak, sürekli yenilikçi çözümlerle 
              müşteri deneyimini geliştirmek ve sektörde öncü olmaya devam etmek.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Değerlerimiz */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Değerlerimiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Müşteri Odaklılık</h3>
              <p className="text-sm text-muted-foreground">
                Müşterilerimizin ihtiyaçlarını anlayarak en iyi çözümleri sunarız.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Hızlı Teslimat</h3>
              <p className="text-sm text-muted-foreground">
                Siparişlerinizi en kısa sürede kapınıza getiririz.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Güvenilirlik</h3>
              <p className="text-sm text-muted-foreground">
                Kaliteli ürünler ve güvenli ödeme sistemleri ile hizmet veririz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hikayemiz */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Hikayemiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              2020 yılında kurulan şirketimiz, müşterilerimize en kaliteli ürünleri en uygun fiyatlarla 
              sunma hedefiyle yola çıktı. Kısa sürede Türkiye'nin önde gelen e-ticaret platformlarından 
              biri haline geldik.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Bugün binlerce ürün kategorisinde hizmet veriyor, yüzbinlerce müşterimize güvenle 
              hizmet sunuyoruz. Teknoloji ve müşteri memnuniyetini ön planda tutarak, 
              sürekli kendimizi geliştirmeye devam ediyoruz.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Rakamlarla Biz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100K+</div>
              <div className="text-sm text-muted-foreground">Mutlu Müşteri</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Ürün Çeşidi</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Müşteri Desteği</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">81</div>
              <div className="text-sm text-muted-foreground">İl'e Teslimat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İletişim CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Bizimle İletişime Geçin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sorularınız için bizimle iletişime geçebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/iletisim">
                  <Mail className="h-4 w-4 mr-2" />
                  İletişim Sayfası
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/yardim">
                  Yardım Merkezi
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
