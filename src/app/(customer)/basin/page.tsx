import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Newspaper, 
  Mail, 
  Phone, 
  Download, 
  Calendar,
  FileText,
  Image,
  Send
} from 'lucide-react'

const pressReleases = [
  {
    id: 1,
    title: 'RDHN Commerce\'den Yeni Teknoloji Yatırımı',
    date: '15 Ocak 2025',
    category: 'Teknoloji',
    summary: 'Şirketimiz, müşteri deneyimini geliştirmek için yapay zeka destekli yeni teknolojilere 10 milyon TL yatırım yapacağını duyurdu.',
    content: 'RDHN Commerce, müşteri deneyimini geliştirmek ve operasyonel verimliliği artırmak amacıyla yapay zeka destekli yeni teknolojilere 10 milyon TL yatırım yapacağını duyurdu. Bu yatırım kapsamında, müşteri hizmetleri, ürün önerileri ve stok yönetimi alanlarında yapay zeka çözümleri geliştirilecek.',
    attachments: ['Basın Bülteni', 'Logo Paketi', 'Görseller']
  },
  {
    id: 2,
    title: '2024 Yılı Satış Rakamları Açıklandı',
    date: '10 Ocak 2025',
    category: 'Finansal',
    summary: 'RDHN Commerce, 2024 yılında %45 büyüme ile 500 milyon TL ciroya ulaştığını açıkladı.',
    content: 'RDHN Commerce, 2024 yılı finansal sonuçlarını açıkladı. Şirket, geçen yıla göre %45 büyüme göstererek 500 milyon TL ciroya ulaştı. Bu büyümede, e-ticaret sektöründeki genel artış trendi ve şirketin müşteri odaklı stratejileri etkili oldu.',
    attachments: ['Finansal Rapor', 'Grafikler']
  },
  {
    id: 3,
    title: 'Yeni Kargo Ortaklığı ile Teslimat Süreleri Kısaldı',
    date: '5 Ocak 2025',
    category: 'Operasyonel',
    summary: 'Aras Kargo ile yapılan yeni anlaşma ile Türkiye genelinde teslimat süreleri ortalama 1 gün kısaldı.',
    content: 'RDHN Commerce, Aras Kargo ile yaptığı yeni anlaşma kapsamında Türkiye genelinde teslimat sürelerini ortalama 1 gün kısalttığını duyurdu. Bu gelişme ile müşteriler artık siparişlerini daha hızlı alabilecek.',
    attachments: ['Anlaşma Detayları', 'Teslimat Haritası']
  }
]

const mediaKit = {
  logo: {
    title: 'Logo Paketi',
    description: 'Yüksek çözünürlüklü logo dosyaları ve kullanım kılavuzu',
    formats: ['SVG', 'PNG', 'JPG', 'PDF']
  },
  images: {
    title: 'Görsel Paketi',
    description: 'Şirket görselleri, ofis fotoğrafları ve ürün görselleri',
    formats: ['JPG', 'PNG', 'TIFF']
  },
  documents: {
    title: 'Doküman Paketi',
    description: 'Şirket profili, yönetim ekibi ve finansal bilgiler',
    formats: ['PDF', 'DOCX']
  }
}

export default function BasinPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Basın</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          RDHN Commerce ile ilgili güncel haberler, basın bültenleri ve medya materyalleri. 
          Basın mensupları için özel içerikler ve iletişim bilgileri.
        </p>
      </div>

      {/* Basın Bültenleri */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Basın Bültenleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pressReleases.map((release) => (
              <Card key={release.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{release.title}</h3>
                        <Badge variant="secondary">{release.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {release.date}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4">{release.summary}</p>
                      <p className="text-sm text-muted-foreground mb-4">{release.content}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {release.attachments.map((attachment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {attachment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="lg:flex-shrink-0 space-y-2">
                      <Button variant="outline" className="w-full lg:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Detayları Görüntüle
                      </Button>
                      <Button className="w-full lg:w-auto">
                        <Mail className="h-4 w-4 mr-2" />
                        İletişime Geç
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medya Kit */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Medya Kit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(mediaKit).map(([key, kit]) => (
              <Card key={key} className="text-center">
                <CardContent className="pt-6">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    {key === 'logo' && <FileText className="h-8 w-8 text-primary" />}
                    {key === 'images' && <Image className="h-8 w-8 text-primary" />}
                    {key === 'documents' && <FileText className="h-8 w-8 text-primary" />}
                  </div>
                  <h3 className="font-semibold mb-2">{kit.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{kit.description}</p>
                  <div className="flex flex-wrap gap-1 justify-center mb-4">
                    {kit.formats.map((format) => (
                      <Badge key={format} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    İndir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basın İletişimi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* İletişim Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>Basın İletişimi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Basın İletişimi</p>
                  <p className="text-sm text-muted-foreground">basin@rdhncommerce.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Basın Hattı</p>
                  <p className="text-sm text-muted-foreground">+90 (212) 123 45 70</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Çalışma Saatleri</h4>
                <p className="text-sm text-muted-foreground">
                  Pazartesi - Cuma: 09:00 - 18:00<br />
                  Acil durumlar için 7/24 ulaşılabilir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basın Sorgusu Formu */}
        <Card>
          <CardHeader>
            <CardTitle>Basın Sorgusu</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ad</Label>
                  <Input id="firstName" placeholder="Adınız" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input id="lastName" placeholder="Soyadınız" required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="media">Medya Kurumu</Label>
                <Input id="media" placeholder="Çalıştığınız medya kurumu" required />
              </div>
              
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" placeholder="ornek@medya.com" required />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" placeholder="+90 (5XX) XXX XX XX" />
              </div>
              
              <div>
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" placeholder="Sorgunuzun konusu" required />
              </div>
              
              <div>
                <Label htmlFor="message">Mesaj</Label>
                <Textarea 
                  id="message" 
                  placeholder="Sorgunuzu detaylandırın..." 
                  rows={4}
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Sorgu Gönder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
