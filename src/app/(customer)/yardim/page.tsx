import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  HelpCircle, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  User, 
  Settings,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

const helpCategories = [
  {
    icon: ShoppingCart,
    title: 'Alışveriş',
    description: 'Ürün seçimi, sepet işlemleri ve sipariş verme',
    articles: [
      'Nasıl ürün satın alabilirim?',
      'Sepetime ürün nasıl eklerim?',
      'Siparişimi nasıl iptal edebilirim?',
      'Kampanya kodları nasıl kullanılır?'
    ]
  },
  {
    icon: CreditCard,
    title: 'Ödeme',
    description: 'Ödeme yöntemleri ve güvenlik',
    articles: [
      'Hangi ödeme yöntemlerini kullanabilirim?',
      'Kredi kartı bilgilerim güvende mi?',
      'Taksitli ödeme seçenekleri nelerdir?',
      'Fatura bilgilerimi nasıl değiştirebilirim?'
    ]
  },
  {
    icon: Truck,
    title: 'Kargo & Teslimat',
    description: 'Kargo takibi ve teslimat bilgileri',
    articles: [
      'Siparişim ne zaman teslim edilecek?',
      'Kargo takip numarasını nasıl öğrenebilirim?',
      'Teslimat süreleri ne kadar?',
      'Kargo ücreti ne kadar?'
    ]
  },
  {
    icon: User,
    title: 'Hesap & Profil',
    description: 'Hesap yönetimi ve kişisel bilgiler',
    articles: [
      'Şifremi nasıl değiştirebilirim?',
      'Adres bilgilerimi nasıl güncelleyebilirim?',
      'Sipariş geçmişimi nasıl görüntüleyebilirim?',
      'Hesabımı nasıl silebilirim?'
    ]
  },
  {
    icon: Settings,
    title: 'Teknik Destek',
    description: 'Site kullanımı ve teknik sorunlar',
    articles: [
      'Site açılmıyor, ne yapmalıyım?',
      'Mobil uygulamada sorun yaşıyorum',
      'Arama yapamıyorum',
      'Sayfa yüklenmiyor'
    ]
  },
  {
    icon: HelpCircle,
    title: 'İade & Değişim',
    description: 'İade ve değişim işlemleri',
    articles: [
      'Ürünü nasıl iade edebilirim?',
      'İade süresi ne kadar?',
      'Değişim yapabilir miyim?',
      'İade kargo ücreti kim öder?'
    ]
  }
]

const popularQuestions = [
  {
    question: 'Siparişim ne zaman teslim edilecek?',
    answer: 'Siparişinizin teslimat süresi, seçtiğiniz kargo firmasına ve bulunduğunuz bölgeye göre 1-3 iş günü arasında değişmektedir. Kargo takip numaranızı kullanarak siparişinizin durumunu anlık olarak takip edebilirsiniz.'
  },
  {
    question: 'Hangi ödeme yöntemlerini kullanabilirim?',
    answer: 'Kredi kartı, banka kartı, havale/EFT, kapıda ödeme ve taksitli ödeme seçeneklerini kullanabilirsiniz. Tüm ödeme işlemleriniz SSL sertifikası ile güvenli şekilde gerçekleştirilmektedir.'
  },
  {
    question: 'Ürünü nasıl iade edebilirim?',
    answer: 'Ürününüzü teslim aldıktan sonra 14 gün içinde iade edebilirsiniz. İade işlemi için müşteri hizmetlerimizle iletişime geçebilir veya hesabınızdan iade talebinde bulunabilirsiniz.'
  },
  {
    question: 'Kampanya kodları nasıl kullanılır?',
    answer: 'Kampanya kodlarınızı sepet sayfasında "İndirim Kodu" bölümüne girerek kullanabilirsiniz. Kodunuz geçerliyse indirim otomatik olarak uygulanacaktır.'
  }
]

export default function YardimPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Yardım Merkezi</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Size nasıl yardımcı olabiliriz? Sorularınızın yanıtlarını burada bulabilir veya 
          bizimle iletişime geçebilirsiniz.
        </p>
        
        {/* Arama */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Sorunuzu yazın veya anahtar kelime arayın..." 
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Yardım Kategorileri */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Yardım Kategorileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-primary" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link 
                        href="#" 
                        className="text-sm text-primary hover:underline block py-1"
                      >
                        {article}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4">
                  Tümünü Görüntüle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sık Sorulan Sorular */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Sık Sorulan Sorular</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {popularQuestions.map((item, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-b-0">
                <h3 className="font-semibold mb-2 text-lg">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* İletişim Seçenekleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Canlı Destek */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Canlı Destek</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Anında yanıt alın
            </p>
            <Button className="w-full">
              Sohbet Başlat
            </Button>
          </CardContent>
        </Card>

        {/* Telefon */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Telefon</h3>
            <p className="text-sm text-muted-foreground mb-4">
              +90 (212) 123 45 67
            </p>
            <Button variant="outline" className="w-full">
              Ara
            </Button>
          </CardContent>
        </Card>

        {/* E-posta */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">E-posta</h3>
            <p className="text-sm text-muted-foreground mb-4">
              destek@rdhncommerce.com
            </p>
            <Button variant="outline" className="w-full">
              E-posta Gönder
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Çalışma Saatleri */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Müşteri Hizmetleri Çalışma Saatleri</h3>
            <p className="text-muted-foreground">
              Pazartesi - Cuma: 09:00 - 18:00 | Cumartesi: 10:00 - 16:00 | Pazar: Kapalı
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Acil durumlar için 7/24 online destek hizmetimiz mevcuttur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
