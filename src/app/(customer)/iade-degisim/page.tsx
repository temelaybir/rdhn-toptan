import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Clock, 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle,
  AlertCircle,
  FileText,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

const returnSteps = [
  {
    icon: Package,
    title: 'Ürünü Paketleyin',
    description: 'Ürünü orijinal ambalajında ve tüm aksesuarlarıyla birlikte paketleyin'
  },
  {
    icon: FileText,
    title: 'İade Talebi Oluşturun',
    description: 'Hesabınızdan veya müşteri hizmetlerimizle iletişime geçerek iade talebi oluşturun'
  },
  {
    icon: Truck,
    title: 'Kargo ile Gönderin',
    description: 'Ücretsiz iade kargosu ile ürünü bize gönderin'
  },
  {
    icon: CheckCircle,
    title: 'İade Onayı',
    description: 'Ürün kontrol edildikten sonra iade işleminiz tamamlanır'
  }
]

const returnConditions = [
  {
    title: 'İade Süresi',
    value: '14 Gün',
    description: 'Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade edebilirsiniz'
  },
  {
    title: 'Ürün Durumu',
    value: 'Kullanılmamış',
    description: 'Ürün orijinal ambalajında ve kullanılmamış durumda olmalıdır'
  },
  {
    title: 'Kargo Ücreti',
    value: 'Ücretsiz',
    description: 'İade kargo ücreti şirketimiz tarafından karşılanmaktadır'
  },
  {
    title: 'İade Süreci',
    value: '3-5 İş Günü',
    description: 'İade işleminiz 3-5 iş günü içinde tamamlanmaktadır'
  }
]

const exchangeConditions = [
  {
    title: 'Değişim Süresi',
    value: '30 Gün',
    description: 'Ürünü teslim aldığınız tarihten itibaren 30 gün içinde değişim yapabilirsiniz'
  },
  {
    title: 'Değişim Nedeni',
    value: 'Beden/Renk',
    description: 'Sadece beden veya renk değişimi için değişim yapılabilir'
  },
  {
    title: 'Stok Durumu',
    value: 'Mevcut',
    description: 'Değişim yapmak istediğiniz ürün stokta mevcut olmalıdır'
  },
  {
    title: 'Kargo Ücreti',
    value: 'Ücretsiz',
    description: 'Değişim kargo ücreti şirketimiz tarafından karşılanmaktadır'
  }
]

const nonReturnableItems = [
  'Kişisel bakım ürünleri',
  'İç çamaşırı ve mayo',
  'Hijyen ürünleri',
  'Dijital ürünler (yazılım, e-kitap)',
  'Özel sipariş verilen ürünler',
  'Açılmış kozmetik ürünleri',
  'Gıda ürünleri'
]

export default function IadeDegisimPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">İade & Değişim</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Memnun kalmadığınız ürünleri kolayca iade edebilir veya değiştirebilirsiniz. 
          İade ve değişim işlemleriniz için detaylı bilgiler burada.
        </p>
      </div>

      {/* İade Süreci */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            İade Süreci
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {returnSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* İade Koşulları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              İade Koşulları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {returnConditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{condition.title}</h4>
                      <Badge variant="secondary">{condition.value}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{condition.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Değişim Koşulları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {exchangeConditions.map((condition, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{condition.title}</h4>
                      <Badge variant="secondary">{condition.value}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{condition.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* İade Edilemeyen Ürünler */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            İade Edilemeyen Ürünler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonReturnableItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* İade & Değişim Formu */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>İade & Değişim Talebi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Online İade Talebi</h3>
              <p className="text-muted-foreground mb-4">
                Hesabınızdan sipariş geçmişinize giderek iade talebinde bulunabilirsiniz.
              </p>
              <Button asChild>
                <Link href="/profil">
                  Hesabıma Git
                </Link>
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Müşteri Hizmetleri</h3>
              <p className="text-muted-foreground mb-4">
                İade işleminiz için müşteri hizmetlerimizle iletişime geçebilirsiniz.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">+90 (212) 123 45 67</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">iade@rdhncommerce.com</span>
                </div>
              </div>
            </div>
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
              <h3 className="font-semibold mb-2">İade işlemi ne kadar sürer?</h3>
              <p className="text-muted-foreground">
                İade işleminiz, ürünün bize ulaşmasından sonra 3-5 iş günü içinde tamamlanır. 
                Para iadesi, kullandığınız ödeme yöntemine göre 1-7 iş günü içinde gerçekleştirilir.
              </p>
            </div>
            
            <div className="border-b border-border pb-6">
              <h3 className="font-semibold mb-2">İade kargo ücretini kim öder?</h3>
              <p className="text-muted-foreground">
                İade kargo ücreti şirketimiz tarafından karşılanmaktadır. Ürünü kargo firmasına 
                teslim ettiğinizde herhangi bir ücret ödemenize gerek yoktur.
              </p>
            </div>
            
            <div className="border-b border-border pb-6">
              <h3 className="font-semibold mb-2">Değişim için ürün stokta yoksa ne olur?</h3>
              <p className="text-muted-foreground">
                Değişim yapmak istediğiniz ürün stokta yoksa, ürünü iade edebilir veya 
                farklı bir ürün seçebilirsiniz. Fark ücreti varsa ödeme yapmanız gerekir.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">İade edilen ürünün ambalajı açılmışsa ne olur?</h3>
              <p className="text-muted-foreground">
                Ürünün ambalajı açılmış olsa bile, ürün kullanılmamış ve hasarsız durumda ise 
                iade kabul edilir. Ancak ürünün orijinal ambalajında olması tercih edilir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
