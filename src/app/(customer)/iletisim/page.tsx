import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react'

export default function IletisimPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">İletişim</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Sorularınız, önerileriniz veya şikayetleriniz için bizimle iletişime geçebilirsiniz. 
          Size en kısa sürede dönüş yapacağız.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* İletişim Formu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Bize Yazın
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
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
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" placeholder="ornek@email.com" required />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" placeholder="+90 (5XX) XXX XX XX" />
              </div>
              
              <div>
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" placeholder="Mesajınızın konusu" required />
              </div>
              
              <div>
                <Label htmlFor="message">Mesaj</Label>
                <Textarea 
                  id="message" 
                  placeholder="Mesajınızı buraya yazın..." 
                  rows={5}
                  required 
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Mesaj Gönder
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* İletişim Bilgileri */}
        <div className="space-y-6">
          {/* Adres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Adres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Merkez Mahallesi, E-Ticaret Caddesi<br />
                No: 123, Kat: 5<br />
                Şişli / İstanbul<br />
                34000 Türkiye
              </p>
            </CardContent>
          </Card>

          {/* Telefon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Telefon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Müşteri Hizmetleri:</strong><br />
                  +90 (212) 123 45 67
                </p>
                <p className="text-muted-foreground">
                  <strong>Satış:</strong><br />
                  +90 (212) 123 45 68
                </p>
                <p className="text-muted-foreground">
                  <strong>Teknik Destek:</strong><br />
                  +90 (212) 123 45 69
                </p>
              </div>
            </CardContent>
          </Card>

          {/* E-posta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                E-posta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Genel:</strong><br />
                  info@rdhncommerce.com
                </p>
                <p className="text-muted-foreground">
                  <strong>Destek:</strong><br />
                  destek@rdhncommerce.com
                </p>
                <p className="text-muted-foreground">
                  <strong>Satış:</strong><br />
                  satis@rdhncommerce.com
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Çalışma Saatleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Çalışma Saatleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pazartesi - Cuma:</span>
                  <span className="font-medium">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cumartesi:</span>
                  <span className="font-medium">10:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pazar:</span>
                  <span className="font-medium">Kapalı</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>Online Destek:</strong> 7/24
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Harita */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Konum</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-64 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4" />
              <p>Harita burada görüntülenecek</p>
              <p className="text-sm">Google Maps entegrasyonu</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSS Linki */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Sık Sorulan Sorular</h3>
            <p className="text-muted-foreground mb-4">
              Hızlı yanıtlar için SSS sayfamızı ziyaret edin.
            </p>
            <Button variant="outline" asChild>
              <a href="/sss">SSS Sayfasına Git</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
