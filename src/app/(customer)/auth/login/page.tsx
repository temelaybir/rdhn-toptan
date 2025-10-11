'use client'

// Next.js 15 dynamic rendering fix
export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Mail, ArrowRight, CheckCircle, Loader2, UserPlus, LogIn, Package } from 'lucide-react'
import { toast } from 'sonner'

// Register form data interface
interface RegisterFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  district: string
  postalCode: string
  acceptsMarketing: boolean
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  
  // Register states
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [registerFormData, setRegisterFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    acceptsMarketing: false
  })
  
  // Order tracking states
  const [orderNumber, setOrderNumber] = useState('')
  const [isTrackingOrder, setIsTrackingOrder] = useState(false)

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim()) {
      toast.error('Lütfen e-mail adresinizi girin')
      return
    }

    if (!loginEmail.includes('@')) {
      toast.error('Geçerli bir e-mail adresi girin')
      return
    }

    if (!loginPassword.trim()) {
      toast.error('Lütfen şifrenizi girin')
      return
    }

    setIsLoginLoading(true)

    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Giriş başarılı! Yönlendiriliyorsunuz...')
        // Redirect after successful login
        setTimeout(() => {
          router.push(redirectTo)
          router.refresh()
        }, 500)
      } else {
        toast.error(result.error || 'Giriş başarısız')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setIsLoginLoading(false)
    }
  }

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!registerFormData.email || !registerFormData.password || !registerFormData.firstName || 
        !registerFormData.lastName || !registerFormData.phone || !registerFormData.address) {
      toast.error('Lütfen tüm zorunlu alanları doldurun')
      return
    }

    if (!registerFormData.email.includes('@')) {
      toast.error('Geçerli bir e-mail adresi girin')
      return
    }

    if (registerFormData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }

    setIsRegisterLoading(true)

    try {
      const response = await fetch('/api/customer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerFormData)
      })

      const result = await response.json()

      if (result.success) {
        setRegisterSuccess(true)
        toast.success('Üyeliğiniz oluşturuldu! Artık giriş yapabilirsiniz.')
      } else {
        toast.error(result.error || 'Kayıt sırasında bir hata oluştu')
      }
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Bir hata oluştu, lütfen tekrar deneyin')
    } finally {
      setIsRegisterLoading(false)
    }
  }

  const handleTryAgain = () => {
    setRegisterSuccess(false)
    setLoginEmail('')
    setLoginPassword('')
  }

  // Order tracking handler
  const handleOrderTracking = () => {
    if (!orderNumber.trim()) {
      toast.error('Lütfen sipariş numaranızı girin')
      return
    }

    setIsTrackingOrder(true)
    // Redirect to order tracking page (path parameter)
    router.push(`/siparis-takibi/${orderNumber.trim()}`)
  }

  // Success screen for register
  if (registerSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-xl text-green-800">
              Üyelik Başarıyla Oluşturuldu!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              <span className="font-medium">{registerFormData.email}</span> adresiyle üyeliğiniz oluşturuldu.
            </p>
            <p className="text-sm text-gray-500">
              Artık "Giriş Yap" sekmesinden e-mail ve şifrenizle giriş yapabilirsiniz.
            </p>
            
            <div className="space-y-2 pt-4">
              <Button onClick={handleTryAgain} className="w-full">
                Giriş Yap
              </Button>
              <Button variant="ghost" onClick={() => router.push('/')} className="w-full">
                Ana Sayfa'ya Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main login/register screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hesap İşlemleri</CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Giriş yapın veya yeni üyelik oluşturun
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Giriş Yap
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Üye Ol
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Sipariş Takibi
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <div className="text-center mb-4">
                <LogIn className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600 text-sm">
                  E-mail ve şifrenizle giriş yapın
                </p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail Adresi *</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoginLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Şifre *</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoginLoading}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isLoginLoading} className="w-full">
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Giriş Yap
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center text-xs text-gray-500 mt-4">
                Giriş yaptığınızda geçmiş siparişlerinizi görüntüleyebilir, 
                adreslerinizi yönetebilir ve hızlı sipariş verebilirsiniz.
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad *</Label>
                    <Input
                      id="firstName"
                      value={registerFormData.firstName}
                      onChange={(e) => setRegisterFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={isRegisterLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad *</Label>
                    <Input
                      id="lastName"
                      value={registerFormData.lastName}
                      onChange={(e) => setRegisterFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={isRegisterLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">E-mail *</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={registerFormData.email}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isRegisterLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Şifre *</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={registerFormData.password}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isRegisterLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Şifreniz en az 6 karakter olmalıdır
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={registerFormData.phone}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={isRegisterLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Textarea
                    id="address"
                    placeholder="Mahalle, sokak, bina no, daire no"
                    value={registerFormData.address}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={isRegisterLoading}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">İl</Label>
                    <Input
                      id="city"
                      value={registerFormData.city}
                      onChange={(e) => setRegisterFormData(prev => ({ ...prev, city: e.target.value }))}
                      disabled={isRegisterLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      value={registerFormData.district}
                      onChange={(e) => setRegisterFormData(prev => ({ ...prev, district: e.target.value }))}
                      disabled={isRegisterLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Posta Kodu</Label>
                    <Input
                      id="postalCode"
                      value={registerFormData.postalCode}
                      onChange={(e) => setRegisterFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      disabled={isRegisterLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptsMarketing"
                    checked={registerFormData.acceptsMarketing}
                    onChange={(e) => setRegisterFormData(prev => ({ ...prev, acceptsMarketing: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="acceptsMarketing" className="text-sm font-normal cursor-pointer">
                    Kampanya ve fırsatlardan haberdar olmak istiyorum
                  </Label>
                </div>
                
                <Button type="submit" disabled={isRegisterLoading} className="w-full">
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kayıt Yapılıyor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Üye Ol
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center text-xs text-gray-500 mt-4">
                Üyelik oluşturduğunuzda "Giriş Yap" sekmesinden e-mail ve şifrenizle giriş yapabilirsiniz.
              </div>
            </TabsContent>

            {/* Order Tracking Tab */}
            <TabsContent value="tracking" className="space-y-4">
              <div className="text-center mb-4">
                <Package className="w-12 h-12 mx-auto mb-2 text-orange-600" />
                <p className="text-gray-600 text-sm">
                  Sipariş numaranızla siparişinizi takip edin
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Sipariş Numarası *</Label>
                  <Input
                    id="orderNumber"
                    type="text"
                    placeholder="SIP-XXXXXX"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    disabled={isTrackingOrder}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sipariş numaranız "SIP-" ile başlar ve e-postanızda bulunur
                  </p>
                </div>
                
                <Button 
                  onClick={handleOrderTracking} 
                  disabled={isTrackingOrder} 
                  className="w-full"
                >
                  {isTrackingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Yönlendiriliyor...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Sipariş Sorgula
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-center text-xs text-gray-500 mt-4 space-y-2">
                <p>
                  Sipariş numaranızı bilmiyorsanız, e-posta adresinize gönderilen 
                  sipariş onay e-postasını kontrol edin.
                </p>
                <p className="text-orange-600 font-medium">
                  💡 Üye girişi yaparak tüm siparişlerinizi görüntüleyebilirsiniz
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => router.push('/')} className="text-sm">
              Ana Sayfa'ya Dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}