import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Clock, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-primary mb-2">
              404
            </CardTitle>
            <CardDescription className="text-lg">
              Sayfa Bulunamadı
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Yapım Aşamasında</span>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bu sayfa şu anda yapım aşamasındadır. Lütfen 24 saat içerisinde tekrar kontrol ediniz.
            </p>
            
            <p className="text-xs text-muted-foreground">
              Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Ana Sayfaya Dön
              </Link>
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/urunler">Ürünler</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/kategoriler">Kategoriler</Link>
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Yardıma mı ihtiyacınız var?{' '}
              <Link href="/iletisim" className="text-primary hover:underline">
                İletişime geçin
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const metadata = {
  title: '404 - Sayfa Bulunamadı | RDHN Commerce',
  description: 'Aradığınız sayfa bulunamadı. Ana sayfaya dönün veya diğer bölümlerimizi keşfedin.',
} 