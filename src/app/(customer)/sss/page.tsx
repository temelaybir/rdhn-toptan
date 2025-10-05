'use client'

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
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'

const faqCategories = [
  {
    id: 'shopping',
    title: 'Alışveriş',
    icon: ShoppingCart,
    questions: [
      {
        question: 'Nasıl ürün satın alabilirim?',
        answer: 'Ürün satın almak için önce ürünü seçin, sepete ekleyin ve ödeme sayfasından siparişinizi tamamlayın. Hesap oluşturmanız veya misafir olarak alışveriş yapabilirsiniz.'
      },
      {
        question: 'Sepetime ürün nasıl eklerim?',
        answer: 'Ürün sayfasında "Sepete Ekle" butonuna tıklayarak ürünü sepetinize ekleyebilirsiniz. Sepetinizde ürün miktarını artırıp azaltabilirsiniz.'
      },
      {
        question: 'Siparişimi nasıl iptal edebilirim?',
        answer: 'Siparişinizi, kargoya verilmeden önce hesabınızdan iptal edebilirsiniz. Kargoya verildikten sonra iptal için müşteri hizmetlerimizle iletişime geçmeniz gerekir.'
      },
      {
        question: 'Kampanya kodları nasıl kullanılır?',
        answer: 'Kampanya kodlarınızı sepet sayfasında "İndirim Kodu" bölümüne girerek kullanabilirsiniz. Kodunuz geçerliyse indirim otomatik olarak uygulanacaktır.'
      }
    ]
  },
  {
    id: 'payment',
    title: 'Ödeme',
    icon: CreditCard,
    questions: [
      {
        question: 'Hangi ödeme yöntemlerini kullanabilirim?',
        answer: 'Kredi kartı, banka kartı, havale/EFT, kapıda ödeme ve taksitli ödeme seçeneklerini kullanabilirsiniz. Tüm ödeme işlemleriniz SSL sertifikası ile güvenli şekilde gerçekleştirilmektedir.'
      },
      {
        question: 'Kredi kartı bilgilerim güvende mi?',
        answer: 'Evet, tüm ödeme işlemleriniz SSL sertifikası ile şifrelenmektedir. Kredi kartı bilgileriniz sistemimizde saklanmaz ve üçüncü taraf ödeme sistemleri ile güvenli şekilde işlenir.'
      },
      {
        question: 'Taksitli ödeme seçenekleri nelerdir?',
        answer: '3, 6, 9 ve 12 taksit seçenekleri mevcuttur. Taksit seçenekleri kredi kartınızın bankasına göre değişiklik gösterebilir.'
      },
      {
        question: 'Fatura bilgilerimi nasıl değiştirebilirim?',
        answer: 'Fatura bilgilerinizi hesabınızdan "Profil" bölümünde güncelleyebilirsiniz. Sipariş vermeden önce fatura bilgilerinizi kontrol etmeyi unutmayın.'
      }
    ]
  },
  {
    id: 'shipping',
    title: 'Kargo & Teslimat',
    icon: Truck,
    questions: [
      {
        question: 'Siparişim ne zaman teslim edilecek?',
        answer: 'Siparişinizin teslimat süresi, seçtiğiniz kargo firmasına ve bulunduğunuz bölgeye göre 1-3 iş günü arasında değişmektedir. Kargo takip numaranızı kullanarak siparişinizin durumunu anlık olarak takip edebilirsiniz.'
      },
      {
        question: 'Kargo takip numarasını nasıl öğrenebilirim?',
        answer: 'Kargo takip numaranızı sipariş onay e-postanızda veya hesabınızdaki sipariş detaylarında bulabilirsiniz. Ayrıca müşteri hizmetlerimizle iletişime geçerek de öğrenebilirsiniz.'
      },
      {
        question: 'Teslimat süreleri ne kadar?',
        answer: 'İstanbul için 1-2 iş günü, diğer iller için 2-3 iş günü teslimat süresi bulunmaktadır. Uzak bölgeler için süre 3-5 iş gününe kadar çıkabilir.'
      },
      {
        question: 'Kargo ücreti ne kadar?',
        answer: '150 TL ve üzeri alışverişlerinizde kargo ücretsizdir. 150 TL altı siparişlerde kargo ücreti 29,90 TL\'dir. Uzak bölgeler için ek ücret alınabilir.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Hesap & Profil',
    icon: User,
    questions: [
      {
        question: 'Şifremi nasıl değiştirebilirim?',
        answer: 'Hesabınıza giriş yaptıktan sonra "Profil" bölümünden "Şifre Değiştir" seçeneğini kullanarak şifrenizi güncelleyebilirsiniz.'
      },
      {
        question: 'Adres bilgilerimi nasıl güncelleyebilirim?',
        answer: 'Hesabınızdan "Adreslerim" bölümüne giderek mevcut adreslerinizi düzenleyebilir veya yeni adres ekleyebilirsiniz.'
      },
      {
        question: 'Sipariş geçmişimi nasıl görüntüleyebilirim?',
        answer: 'Hesabınızdan "Siparişlerim" bölümüne giderek tüm sipariş geçmişinizi görüntüleyebilir ve detaylarına ulaşabilirsiniz.'
      },
      {
        question: 'Hesabımı nasıl silebilirim?',
        answer: 'Hesabınızı silmek için müşteri hizmetlerimizle iletişime geçmeniz gerekmektedir. Bu işlem geri alınamaz ve tüm verileriniz silinir.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Teknik Destek',
    icon: Settings,
    questions: [
      {
        question: 'Site açılmıyor, ne yapmalıyım?',
        answer: 'Önce internet bağlantınızı kontrol edin. Sorun devam ederse tarayıcınızın önbelleğini temizleyin veya farklı bir tarayıcı deneyin.'
      },
      {
        question: 'Mobil uygulamada sorun yaşıyorum',
        answer: 'Uygulamayı güncelleyin ve cihazınızı yeniden başlatın. Sorun devam ederse uygulamayı kaldırıp yeniden yükleyin.'
      },
      {
        question: 'Arama yapamıyorum',
        answer: 'Arama kutusunu temizleyin ve farklı anahtar kelimeler deneyin. Sorun devam ederse sayfayı yenileyin.'
      },
      {
        question: 'Sayfa yüklenmiyor',
        answer: 'İnternet bağlantınızı kontrol edin ve sayfayı yenileyin. Sorun devam ederse farklı bir tarayıcı deneyin.'
      }
    ]
  }
]

export default function SSSPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Sık Sorulan Sorular</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          En çok sorulan soruların yanıtlarını burada bulabilirsiniz. 
          Aradığınız yanıtı bulamazsanız bizimle iletişime geçebilirsiniz.
        </p>
        
        {/* Arama */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Sorunuzu yazın veya anahtar kelime arayın..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* SSS Kategorileri */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-primary" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.questions.map((faq, index) => {
                  const questionId = `${category.id}-${index}`
                  const isExpanded = expandedQuestions.has(questionId)
                  
                  return (
                    <div key={index} className="border rounded-lg">
                      <button
                        onClick={() => toggleQuestion(questionId)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3">
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Arama Sonucu Yok */}
      {searchTerm && filteredCategories.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aradığınız soru bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                "{searchTerm}" ile ilgili bir soru bulamadık. Farklı anahtar kelimeler deneyebilir 
                veya müşteri hizmetlerimizle iletişime geçebilirsiniz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                >
                  Tüm Soruları Görüntüle
                </Button>
                <Button asChild>
                  <a href="/iletisim">İletişime Geç</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* İletişim CTA */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Hala sorunuz mu var?</h3>
            <p className="text-muted-foreground mb-4">
              Aradığınız yanıtı bulamadıysanız, müşteri hizmetlerimizle iletişime geçebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <a href="/iletisim">İletişime Geç</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/yardim">Yardım Merkezi</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
