'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Lütfen e-posta adresinizi girin')
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Geçerli bir e-posta adresi girin')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/customer/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (result.success) {
        setEmailSent(true)
        toast.success('Şifre sıfırlama linki e-posta adresinize gönderildi')
      } else {
        toast.error(result.error || 'Bir hata oluştu, lütfen tekrar deneyin')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/auth/login')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Geri
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold">Şifremi Unuttum</CardTitle>
          <CardDescription>
            {emailSent 
              ? 'Şifre sıfırlama linki gönderildi'
              : 'E-posta adresinize şifre sıfırlama linki gönderelim'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta Adresi</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Kayıtlı e-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Şifre Sıfırlama Linki Gönder
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">E-posta Gönderildi!</h3>
                  <p className="text-sm text-gray-600">
                    <strong>{email}</strong> adresine şifre sıfırlama linki gönderdik.
                  </p>
                  <p className="text-xs text-gray-500">
                    E-posta gelmedi mi? Spam klasörünü kontrol edin veya birkaç dakika bekleyin.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                >
                  Farklı E-posta ile Tekrar Dene
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                >
                  Giriş Sayfasına Dön
                </Button>
              </div>
            </div>
          )}

          {!emailSent && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>
                Hesabınız yok mu?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => router.push('/auth/login')}
                >
                  Kayıt olun
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

