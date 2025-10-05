import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Briefcase, 
  Users, 
  GraduationCap, 
  Heart, 
  Zap, 
  Globe, 
  Send,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react'

const jobOpenings = [
  {
    id: 1,
    title: 'Frontend Geliştirici',
    department: 'Teknoloji',
    location: 'İstanbul',
    type: 'Tam Zamanlı',
    experience: '3-5 yıl',
    salary: '25.000 - 35.000 TL',
    description: 'React, Next.js ve TypeScript deneyimi olan frontend geliştirici arıyoruz.',
    requirements: [
      'React ve Next.js deneyimi',
      'TypeScript bilgisi',
      'Responsive tasarım deneyimi',
      'Git versiyon kontrol sistemi',
      'Takım çalışmasına yatkınlık'
    ]
  },
  {
    id: 2,
    title: 'Müşteri Hizmetleri Uzmanı',
    department: 'Müşteri Hizmetleri',
    location: 'İstanbul',
    type: 'Tam Zamanlı',
    experience: '1-3 yıl',
    salary: '15.000 - 20.000 TL',
    description: 'Müşteri memnuniyetini ön planda tutan, iletişim becerileri güçlü uzman arıyoruz.',
    requirements: [
      'Mükemmel Türkçe konuşma ve yazma',
      'Müşteri odaklı yaklaşım',
      'Problem çözme becerisi',
      'Bilgisayar kullanımında yetkinlik',
      'Esnek çalışma saatlerine uyum'
    ]
  },
  {
    id: 3,
    title: 'Pazarlama Uzmanı',
    department: 'Pazarlama',
    location: 'İstanbul',
    type: 'Tam Zamanlı',
    experience: '2-4 yıl',
    salary: '18.000 - 25.000 TL',
    description: 'Dijital pazarlama deneyimi olan, yaratıcı düşünceye sahip uzman arıyoruz.',
    requirements: [
      'Dijital pazarlama deneyimi',
      'Sosyal medya yönetimi',
      'Google Ads ve Facebook Ads deneyimi',
      'Analitik düşünme becerisi',
      'Yaratıcı içerik üretme yeteneği'
    ]
  }
]

const benefits = [
  {
    icon: Heart,
    title: 'Sağlık Sigortası',
    description: 'Tam kapsamlı sağlık sigortası'
  },
  {
    icon: GraduationCap,
    title: 'Eğitim Desteği',
    description: 'Sürekli öğrenme ve gelişim fırsatları'
  },
  {
    icon: Zap,
    title: 'Esnek Çalışma',
    description: 'Hibrit çalışma modeli'
  },
  {
    icon: Globe,
    title: 'Uluslararası Fırsatlar',
    description: 'Global projelerde yer alma'
  },
  {
    icon: Users,
    title: 'Takım Aktiviteleri',
    description: 'Düzenli takım etkinlikleri'
  },
  {
    icon: DollarSign,
    title: 'Performans Primi',
    description: 'Yıllık performans bazlı primler'
  }
]

export default function KariyerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Kariyer</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Geleceğin teknolojisini bugünden inşa ediyoruz. Eğer siz de bu yolculuğa katılmak istiyorsanız, 
          doğru yerdesiniz!
        </p>
      </div>

      {/* Neden Biz */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Neden RDHN Commerce?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Açık Pozisyonlar */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Açık Pozisyonlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {jobOpenings.map((job) => (
              <Card key={job.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge variant="secondary">{job.department}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{job.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{job.experience}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{job.salary}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Gereksinimler:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {job.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="lg:flex-shrink-0">
                      <Button className="w-full lg:w-auto">
                        <Send className="h-4 w-4 mr-2" />
                        Başvur
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Başvuru Formu */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Başvuru</CardTitle>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" placeholder="ornek@email.com" required />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" placeholder="+90 (5XX) XXX XX XX" required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">İlgilendiğiniz Pozisyon</Label>
                <Input id="position" placeholder="Pozisyon adı" />
              </div>
              <div>
                <Label htmlFor="experience">Deneyim Yılı</Label>
                <Input id="experience" placeholder="Örn: 3 yıl" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="coverLetter">Ön Yazı</Label>
              <Textarea 
                id="coverLetter" 
                placeholder="Kendinizi tanıtın ve neden bizimle çalışmak istediğinizi belirtin..." 
                rows={5}
              />
            </div>
            
            <div>
              <Label htmlFor="cv">CV Yükle</Label>
              <Input id="cv" type="file" accept=".pdf,.doc,.docx" />
              <p className="text-sm text-muted-foreground mt-1">
                PDF, DOC veya DOCX formatında, maksimum 5MB
              </p>
            </div>
            
            <Button type="submit" className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Başvuruyu Gönder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
