'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Token validation on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false)
        setIsValidToken(false)
        return
      }

      try {
        const response = await fetch('/api/customer/reset-password/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        const result = await response.json()
        setIsValidToken(result.valid)
      } catch (error) {
        console.error('Token validation error:', error)
        setIsValidToken(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/customer/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password
        })
      })

      const result = await response.json()

      if (result.success) {
        setResetSuccess(true)
        toast.success('Şifreniz başarıyla güncellendi')
        
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        toast.error(result.error || 'Şifre güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Link doğrulanıyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Geçersiz Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Şifre sıfırlama linkiniz geçersiz veya süresi dolmuş.
                </p>
                <p className="text-xs text-gray-500">
                  Lütfen yeni bir şifre sıfırlama talebi oluşturun.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Yeni Şifre Sıfırlama Talebi
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Giriş Sayfasına Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Şifre Güncellendi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Şifreniz başarıyla güncellendi.
                </p>
                <p className="text-xs text-gray-500">
                  Giriş sayfasına yönlendiriliyorsunuz...
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => router.push('/auth/login')}
            >
              Giriş Sayfasına Git
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reset form
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
          <CardTitle className="text-2xl font-bold">Yeni Şifre Oluştur</CardTitle>
          <CardDescription>
            Hesabınız için yeni bir şifre belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs text-blue-800">
                Şifreniz en az 6 karakter uzunluğunda olmalıdır.
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
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Şifremi Güncelle
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

