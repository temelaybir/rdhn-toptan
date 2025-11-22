import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Info,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

const shippingCompanies = [
  {
    name: 'Aras Kargo',
    logo: 'ARAS',
    phone: '+90 (212) 444 25 26',
    website: 'https://www.araskargo.com.tr'
  },
  {
    name: 'Yurtiçi Kargo',
    logo: 'YURTİÇİ',
    phone: '+90 (212) 444 99 99',
    website: 'https://www.yurticikargo.com'
  },
  {
    name: 'MNG Kargo',
    logo: 'MNG',
    phone: '+90 (212) 444 0 444',
    website: 'https://www.mngkargo.com.tr'
  },
  {
    name: 'PTT Kargo',
    logo: 'PTT',
    phone: '+90 (212) 444 1 788',
    website: 'https://www.pttkargo.com.tr'
  }
]

const trackingSteps = [
  {
    status: 'completed',
    title: 'Sipariş Alındı',
    description: 'Siparişiniz başarıyla alındı ve hazırlanıyor',
    time: '15 Ocak 2025, 14:30'
  },
  {
    status: 'completed',
    title: 'Hazırlanıyor',
    description: 'Ürününüz paketleniyor ve kargoya verilmeye hazırlanıyor',
    time: '15 Ocak 2025, 16:45'
  },
  {
    status: 'completed',
    title: 'Kargoya Verildi',
    description: 'Ürününüz kargo firmasına teslim edildi',
    time: '16 Ocak 2025, 09:15'
  },
  {
    status: 'current',
    title: 'Yolda',
    description: 'Ürününüz size doğru yola çıktı',
    time: '16 Ocak 2025, 11:30'
  },
  {
    status: 'pending',
    title: 'Dağıtım Merkezi',
    description: 'Ürününüz bölge dağıtım merkezine ulaşacak',
    time: '17 Ocak 2025, 08:00'
  },
  {
    status: 'pending',
    title: 'Teslimat',
    description: 'Ürününüz adresinize teslim edilecek',
    time: '17 Ocak 2025, 14:00'
  }
]

const estimatedDelivery = {
  date: '17 Ocak 2025',
  time: '14:00 - 18:00',
  status: 'Yolda',
  company: 'Aras Kargo'
}

export default function KargoTakipPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Kargo Takip</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Siparişinizin durumunu anlık olarak takip edebilir, teslimat tarihini öğrenebilirsiniz.
        </p>
      </div>

      {/* Kargo Takip Formu */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Kargo Takip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="trackingNumber">Kargo Takip Numarası</Label>
                <Input 
                  id="trackingNumber" 
                  placeholder="Örn: AR123456789TR" 
                  className="text-lg"
                />
              </div>
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Sorgula
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Örnek Takip Sonucu */}
      <div className="space-y-8">
        {/* Teslimat Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Teslimat Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Tahmini Teslimat</h3>
                <p className="text-sm text-muted-foreground">{estimatedDelivery.date}</p>
                <p className="text-sm text-muted-foreground">{estimatedDelivery.time}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Kargo Firması</h3>
                <p className="text-sm text-muted-foreground">{estimatedDelivery.company}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Teslimat Adresi</h3>
                <p className="text-sm text-muted-foreground">İstanbul, Türkiye</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Durum</h3>
                <Badge variant="secondary">{estimatedDelivery.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Takip Adımları */}
        <Card>
          <CardHeader>
            <CardTitle>Kargo Takip Adımları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {trackingSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100 text-green-600' :
                    step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'completed' && <CheckCircle className="h-5 w-5" />}
                    {step.status === 'current' && <Clock className="h-5 w-5" />}
                    {step.status === 'pending' && <Info className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      {step.status === 'current' && (
                        <Badge variant="default">Güncel</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{step.description}</p>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kargo Firmaları */}
        <Card>
          <CardHeader>
            <CardTitle>Kargo Firmaları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {shippingCompanies.map((company, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="font-bold text-primary">{company.logo}</span>
                    </div>
                    <h3 className="font-semibold mb-2">{company.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{company.phone}</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          Web Sitesi
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sık Sorulan Sorular */}
        <Card>
          <CardHeader>
            <CardTitle>Sık Sorulan Sorular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">Kargo takip numarasını nereden bulabilirim?</h3>
                <p className="text-muted-foreground">
                  Kargo takip numaranızı sipariş onay e-postanızda veya hesabınızdaki sipariş 
                  detaylarında bulabilirsiniz. Ayrıca müşteri hizmetlerimizle iletişime geçerek 
                  de öğrenebilirsiniz.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">Siparişim ne zaman teslim edilecek?</h3>
                <p className="text-muted-foreground">
                  Teslimat süresi, bulunduğunuz bölgeye ve seçtiğiniz kargo firmasına göre 
                  1-3 iş günü arasında değişmektedir. Kargo takip numaranızı kullanarak 
                  anlık durumu takip edebilirsiniz.
                </p>
              </div>
              
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">Kargo firması ürünü teslim etmeye çalıştı ama evde yoktum, ne olur?</h3>
                <p className="text-muted-foreground">
                  Kargo firması ürünü teslim etmeye çalıştığında evde bulunmazsanız, 
                  size bilgi notu bırakacaktır. Bu notta bulunan bilgilerle kargo firmasıyla 
                  iletişime geçerek yeniden teslimat talep edebilirsiniz.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Kargo ücreti ne kadar?</h3>
                <p className="text-muted-foreground">
                  Kargo ücreti, sipariş tutarınıza ve bulunduğunuz bölgeye göre değişmektedir. 
                  150 TL ve üzeri alışverişlerinizde kargo ücretsizdir. Detaylı bilgi için 
                  sepet sayfanızı kontrol edebilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İletişim */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Sorun mu yaşıyorsunuz?</h3>
              <p className="text-muted-foreground mb-4">
                Kargo ile ilgili sorunlarınız için müşteri hizmetlerimizle iletişime geçebilirsiniz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/iletisim">
                    <Phone className="h-4 w-4 mr-2" />
                    İletişime Geç
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
    </div>
  )
}
