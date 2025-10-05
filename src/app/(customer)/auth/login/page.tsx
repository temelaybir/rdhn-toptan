'use client'

// Next.js 15 dynamic rendering fix
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [devLoginUrl, setDevLoginUrl] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Lütfen e-mail adresinizi girin')
      return
    }

    if (!email.includes('@')) {
      toast.error('Geçerli bir e-mail adresi girin')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/customer/magic-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const result = await response.json()

      if (result.success) {
        setEmailSent(true)
        toast.success('Giriş linki e-mail adresinize gönderildi!')
        
        // Development'da direkt link göster
        if (result.loginUrl) {
          setDevLoginUrl(result.loginUrl)
        }
      } else {
        toast.error(result.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryAgain = () => {
    setEmailSent(false)
    setDevLoginUrl('')
    setEmail('')
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-xl text-green-800">E-mail Gönderildi!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              <span className="font-medium">{email}</span> adresine giriş linki gönderildi.
            </p>
            <p className="text-sm text-gray-500">
              E-mail kutunuzu kontrol edin ve giriş linkine tıklayın.
              Link 30 dakika geçerlidir.
            </p>
            
            {/* Development amaçlı direkt link */}
            {devLoginUrl && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 mb-2">
                  🚧 Development Mode - Direkt Giriş:
                </p>
                <Button 
                  onClick={() => window.open(devLoginUrl, '_self')}
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs"
                >
                  Direkt Giriş Yap
                </Button>
              </div>
            )}
            
            <div className="space-y-2 pt-4">
              <Button variant="outline" onClick={handleTryAgain} className="w-full">
                Farklı E-mail ile Dene
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/'} className="w-full">
                Ana Sayfa'ya Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <CardTitle className="text-2xl">Hesabınıza Giriş</CardTitle>
          <p className="text-gray-600">
            Şifre gerektirmez. E-mail adresinize giriş linki göndereceğiz.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  Giriş Linki Gönder
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Giriş yaptığınızda geçmiş siparişlerinizi görüntüleyebilir, 
              adreslerinizi yönetebilir ve hızlı sipariş verebilirsiniz.
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => window.location.href = '/'} className="text-sm">
              Ana Sayfa'ya Dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 