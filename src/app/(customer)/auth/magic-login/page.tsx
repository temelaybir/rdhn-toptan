'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { verifyMagicToken, Customer } from '@/services/customer-auth-service'
import { toast } from 'sonner'

function MagicLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setError('Geçersiz giriş linki')
      return
    }

    verifyMagicLogin(token)
  }, [searchParams])

  const verifyMagicLogin = async (token: string) => {
    try {
      console.log('🔑 Magic token doğrulanıyor:', token)
      
      const result = await verifyMagicToken(token)
      
      if (result.success && result.customer) {
        setStatus('success')
        setCustomer(result.customer)
        
        // Session storage'a müşteri bilgilerini kaydet
        sessionStorage.setItem('customer', JSON.stringify(result.customer))
        
        toast.success(`Hoş geldiniz, ${result.customer.first_name || result.customer.email}!`)
        
        // 2 saniye bekleyip profil sayfasına yönlendir
        setTimeout(() => {
          router.push('/profil')
        }, 2000)
      } else {
        setStatus('error')
        setError(result.error || 'Giriş linki geçersiz veya süresi dolmuş')
      }
    } catch (error: any) {
      console.error('Magic login verification error:', error)
      setStatus('error')
      setError('Giriş sırasında bir hata oluştu')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoToProfile = () => {
    router.push('/profil')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Giriş yapılıyor...</h2>
            <p className="text-gray-600">Lütfen bekleyin, giriş işleminiz doğrulanıyor.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-800">Giriş Başarısız</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleGoHome} className="w-full">
                Ana Sayfa'ya Dön
              </Button>
              <Button variant="outline" onClick={() => router.push('/auth/login')} className="w-full">
                Tekrar Giriş Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-semibold mb-2 text-green-800">Giriş Başarılı!</h2>
          <p className="text-gray-600 mb-2">
            Hoş geldiniz, <span className="font-medium">{customer?.first_name || customer?.email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Profil sayfanıza yönlendiriliyorsunuz...
          </p>
          <div className="space-y-3">
            <Button onClick={handleGoToProfile} className="w-full">
              Profilime Git
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              Ana Sayfa'ya Dön
            </Button>
          </div>
          {customer && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Hesap Bilgileriniz</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>E-mail: {customer.email}</div>
                {customer.phone && <div>Telefon: {customer.phone}</div>}
                <div>Toplam Sipariş: {customer.total_orders}</div>
                <div>Toplam Harcama: {customer.total_spent.toFixed(2)} TL</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Yükleniyor...</h2>
            <p className="text-gray-600">Sayfa hazırlanıyor...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <MagicLoginContent />
    </Suspense>
  )
}