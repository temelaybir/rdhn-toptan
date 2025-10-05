'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Server, 
  CreditCard, 
  AlertTriangle,
  TestTube,
  Database,
  Shield,
  RefreshCw,
  DollarSign,
  Calculator
} from 'lucide-react'

// Form validation schema
const iyzicoSettingsSchema = z.object({
  is_active: z.boolean(),
  test_mode: z.boolean(),
  api_key: z.string().min(1, 'API Key gerekli'),
  secret_key: z.string().min(1, 'Secret Key gerekli'),
  sandbox_api_key: z.string().optional(),
  sandbox_secret_key: z.string().optional(),
  callback_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
  default_currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']),
  force_3d_secure: z.boolean(),
  auto_capture: z.boolean(),
  allow_installments: z.boolean(),
  max_installment_count: z.number().min(1).max(12),
  minimum_installment_amount: z.number().min(0),
  commission_rate: z.number().min(0).max(1),
  installment_commission_rate: z.number().min(0).max(1),
  company_name: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email().optional()
})

type IyzicoSettingsFormData = z.infer<typeof iyzicoSettingsSchema>

interface TestResult {
  success: boolean
  message?: string
  error?: string
  details?: any
}

interface PaymentStats {
  total_transactions: number
  successful_transactions: number
  failed_transactions: number
  pending_transactions: number
  total_amount: number
  total_refunded: number
  total_refunds: number
  successful_refunds: number
  pending_refunds: number
  iyzico_active: boolean
  test_mode: boolean
  recent_transactions: any[]
  recent_refunds: any[]
}

export default function IyzicoAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<TestResult | null>(null)
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<IyzicoSettingsFormData>({
    resolver: zodResolver(iyzicoSettingsSchema),
    defaultValues: {
      is_active: false,
      test_mode: true,
      default_currency: 'TRY',
      force_3d_secure: true,
      auto_capture: true,
      allow_installments: true,
      max_installment_count: 12,
      minimum_installment_amount: 100,
      commission_rate: 0.0280,
      installment_commission_rate: 0.0320
    }
  })

  // Load settings
  useEffect(() => {
    loadSettings()
    loadPaymentStats()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/iyzico/settings')
      const data = await response.json()

      if (data.success && data.settings) {
        // Form'u doldur
        reset({
          is_active: data.settings.is_active,
          test_mode: data.settings.test_mode,
          api_key: data.settings.api_key,
          secret_key: data.settings.secret_key,
          sandbox_api_key: data.settings.sandbox_api_key || '',
          sandbox_secret_key: data.settings.sandbox_secret_key || '',
          callback_url: data.settings.callback_url || '',
          webhook_url: data.settings.webhook_url || '',
          default_currency: data.settings.default_currency,
          force_3d_secure: data.settings.force_3d_secure,
          auto_capture: data.settings.auto_capture,
          allow_installments: data.settings.allow_installments,
          max_installment_count: data.settings.max_installment_count,
          minimum_installment_amount: data.settings.minimum_installment_amount,
          commission_rate: data.settings.commission_rate,
          installment_commission_rate: data.settings.installment_commission_rate,
          company_name: data.settings.company_name || '',
          company_phone: data.settings.company_phone || '',
          company_email: data.settings.company_email || ''
        })
      }
    } catch (error) {
      console.error('Settings load error:', error)
      toast.error('Ayarlar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPaymentStats = async () => {
    try {
      const response = await fetch('/api/admin/iyzico/stats')
      const data = await response.json()

      if (data.success && data.stats) {
        // Gelen veriyi doğrula ve default değerlerle birleştir
        const validatedStats: PaymentStats = {
          total_transactions: data.stats.total_transactions || 0,
          successful_transactions: data.stats.successful_transactions || 0,
          failed_transactions: data.stats.failed_transactions || 0,
          pending_transactions: data.stats.pending_transactions || 0,
          total_amount: data.stats.total_amount || 0,
          total_refunded: data.stats.total_refunded || 0,
          total_refunds: data.stats.total_refunds || 0,
          successful_refunds: data.stats.successful_refunds || 0,
          pending_refunds: data.stats.pending_refunds || 0,
          iyzico_active: data.stats.iyzico_active || false,
          test_mode: data.stats.test_mode || true,
          recent_transactions: data.stats.recent_transactions || [],
          recent_refunds: data.stats.recent_refunds || []
        }
        
        setPaymentStats(validatedStats)
      } else {
        console.warn('İstatistik verileri alınamadı:', data.error)
        // Boş stats set et - UI hata göstermeyecek
        setPaymentStats(null)
      }
    } catch (error) {
      console.error('Stats load error:', error)
      // Network hatası durumunda da null set et
      setPaymentStats(null)
    }
  }

  const onSubmit = async (data: IyzicoSettingsFormData) => {
    try {
      setIsSaving(true)
      
      const response = await fetch('/api/admin/iyzico/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('İyzico ayarları başarıyla kaydedildi')
        loadPaymentStats() // Stats'ları yenile
      } else {
        toast.error(result.error || 'Ayarlar kaydedilirken hata oluştu')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Ayarlar kaydedilirken hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      setIsTestingConnection(true)
      setConnectionTestResult(null)

      const formData = watch()
      
      const response = await fetch('/api/admin/iyzico/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      setConnectionTestResult(result)

      if (result.success) {
        toast.success('İyzico API bağlantısı başarılı')
      } else {
        toast.error(result.error || 'Bağlantı testi başarısız')
      }

    } catch (error) {
      console.error('Connection test error:', error)
      setConnectionTestResult({
        success: false,
        error: 'Bağlantı testi sırasında hata oluştu'
      })
      toast.error('Bağlantı testi sırasında hata oluştu')
    } finally {
      setIsTestingConnection(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İyzico Ödeme Sistemi</h1>
          <p className="text-muted-foreground">
            İyzico ödeme entegrasyonu ayarları ve yönetimi
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {watch('is_active') ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aktif
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="h-3 w-3 mr-1" />
              Pasif
            </Badge>
          )}
          
          {watch('test_mode') ? (
            <Badge variant="outline" className="border-orange-200 text-orange-600">
              <TestTube className="h-3 w-3 mr-1" />
              Test Modu
            </Badge>
          ) : (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              <Server className="h-3 w-3 mr-1" />
              Canlı
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam İşlem</p>
                  <p className="text-2xl font-bold">{paymentStats.total_transactions || 0}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Başarılı Ödeme</p>
                  <p className="text-2xl font-bold text-green-600">{paymentStats.successful_transactions || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Başarısız Ödeme</p>
                  <p className="text-2xl font-bold text-red-600">{paymentStats.failed_transactions || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                  <p className="text-2xl font-bold">₺{(paymentStats.total_amount || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Genel Ayarlar</TabsTrigger>
            <TabsTrigger value="api">API Bilgileri</TabsTrigger>
            <TabsTrigger value="payment">Ödeme Ayarları</TabsTrigger>
            <TabsTrigger value="installment">Taksit Ayarları</TabsTrigger>
          </TabsList>

          {/* Genel Ayarlar */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Temel Konfigürasyon
                </CardTitle>
                <CardDescription>
                  İyzico ödeme sisteminin temel ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active" className="text-base">
                      İyzico Ödeme Sistemi
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Ödeme sistemini aktif/pasif duruma getirir
                    </div>
                  </div>
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="test_mode" className="text-base">
                      Test Modu
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Sandbox API kullanımı (geliştirme için)
                    </div>
                  </div>
                  <Switch
                    id="test_mode"
                    checked={watch('test_mode')}
                    onCheckedChange={(checked) => setValue('test_mode', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default_currency">Para Birimi *</Label>
                    <Select
                      value={watch('default_currency')}
                      onValueChange={(value) => setValue('default_currency', value as 'TRY' | 'USD' | 'EUR' | 'GBP')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="company_name">Firma Adı</Label>
                    <Input
                      id="company_name"
                      {...register('company_name')}
                      placeholder="RDHN Commerce"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_email">Firma E-posta</Label>
                    <Input
                      id="company_email"
                      type="email"
                      {...register('company_email')}
                      placeholder="info@rdhncommerce.com"
                    />
                    {errors.company_email && (
                      <p className="text-sm text-red-500 mt-1">{errors.company_email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="company_phone">Firma Telefon</Label>
                    <Input
                      id="company_phone"
                      {...register('company_phone')}
                      placeholder="+90 212 123 45 67"
                    />
                  </div>
                </div>

                {/* Connection Test */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">API Bağlantı Testi</h4>
                      <p className="text-sm text-muted-foreground">
                        İyzipay API ile bağlantıyı test edin (npm paketi kullanarak)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Test Ediliyor...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Bağlantıyı Test Et
                        </>
                      )}
                    </Button>
                  </div>

                  {connectionTestResult && (
                    <Alert className={connectionTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      {connectionTestResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={connectionTestResult.success ? 'text-green-800' : 'text-red-800'}>
                        <strong>
                          {connectionTestResult.success ? 'Başarılı:' : 'Hata:'}
                        </strong>{' '}
                        {connectionTestResult.message || connectionTestResult.error}
                        {connectionTestResult.details && (
                          <div className="mt-2 text-sm">
                            <strong>Ortam:</strong> {connectionTestResult.details.environment}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Bilgileri */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  API Kimlik Bilgileri
                </CardTitle>
                <CardDescription>
                  İyzico API anahtarları ve güvenlik ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api_key">API Key (Canlı) *</Label>
                    <Input
                      id="api_key"
                      type="password"
                      {...register('api_key')}
                      placeholder="sandbox-xxxxxxxxxxxx"
                    />
                    {errors.api_key && (
                      <p className="text-sm text-red-500 mt-1">{errors.api_key.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="secret_key">Secret Key (Canlı) *</Label>
                    <Input
                      id="secret_key"
                      type="password"
                      {...register('secret_key')}
                      placeholder="sandbox-xxxxxxxxxxxx"
                    />
                    {errors.secret_key && (
                      <p className="text-sm text-red-500 mt-1">{errors.secret_key.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sandbox_api_key">Sandbox API Key</Label>
                    <Input
                      id="sandbox_api_key"
                      type="password"
                      {...register('sandbox_api_key')}
                      placeholder="sandbox-xxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sandbox_secret_key">Sandbox Secret Key</Label>
                    <Input
                      id="sandbox_secret_key"
                      type="password"
                      {...register('sandbox_secret_key')}
                      placeholder="sandbox-xxxxxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="callback_url">Callback URL</Label>
                    <Input
                      id="callback_url"
                      {...register('callback_url')}
                      placeholder="https://yourdomain.com/api/payment/iyzico/callback"
                    />
                    {errors.callback_url && (
                      <p className="text-sm text-red-500 mt-1">{errors.callback_url.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      {...register('webhook_url')}
                      placeholder="https://yourdomain.com/api/payment/iyzico/webhook"
                    />
                    {errors.webhook_url && (
                      <p className="text-sm text-red-500 mt-1">{errors.webhook_url.message}</p>
                    )}
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Güvenlik Uyarısı:</strong>
                    <br />• API anahtarlarınızı güvenli tutun ve paylaşmayın
                    <br />• Test modu için sandbox anahtarlarını kullanın
                    <br />• Callback ve webhook URL'leri HTTPS protokolü kullanmalıdır
                    <br />• Production'a geçmeden önce mutlaka test edin
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ödeme Ayarları */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ödeme Güvenlik Ayarları
                </CardTitle>
                <CardDescription>
                  3D Secure ve ödeme güvenlik konfigürasyonları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="force_3d_secure" className="text-base">
                      3D Secure Zorunlu
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Tüm ödemeler için 3D Secure doğrulaması istenir
                    </div>
                  </div>
                  <Switch
                    id="force_3d_secure"
                    checked={watch('force_3d_secure')}
                    onCheckedChange={(checked) => setValue('force_3d_secure', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_capture" className="text-base">
                      Otomatik Tahsilat
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Ödeme başarılı olduğunda otomatik olarak tahsil edilir
                    </div>
                  </div>
                  <Switch
                    id="auto_capture"
                    checked={watch('auto_capture')}
                    onCheckedChange={(checked) => setValue('auto_capture', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission_rate">Komisyon Oranı (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      {...register('commission_rate', { valueAsNumber: true })}
                      placeholder="0.0280"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Örnek: 0.0280 = %2.80
                    </p>
                    {errors.commission_rate && (
                      <p className="text-sm text-red-500 mt-1">{errors.commission_rate.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="installment_commission_rate">Taksit Komisyon Oranı (%)</Label>
                    <Input
                      id="installment_commission_rate"
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      {...register('installment_commission_rate', { valueAsNumber: true })}
                      placeholder="0.0320"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Örnek: 0.0320 = %3.20
                    </p>
                    {errors.installment_commission_rate && (
                      <p className="text-sm text-red-500 mt-1">{errors.installment_commission_rate.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Taksit Ayarları */}
          <TabsContent value="installment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Taksit Seçenekleri
                </CardTitle>
                <CardDescription>
                  Müşterilere sunulacak taksit seçenekleri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow_installments" className="text-base">
                      Taksit Seçeneği
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Müşterilere taksit seçeneği sunulur
                    </div>
                  </div>
                  <Switch
                    id="allow_installments"
                    checked={watch('allow_installments')}
                    onCheckedChange={(checked) => setValue('allow_installments', checked)}
                  />
                </div>

                {watch('allow_installments') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max_installment_count">Maksimum Taksit Sayısı</Label>
                        <Select
                          value={watch('max_installment_count').toString()}
                          onValueChange={(value) => setValue('max_installment_count', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 6, 9, 12].map(count => (
                              <SelectItem key={count} value={count.toString()}>
                                {count} Taksit
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.max_installment_count && (
                          <p className="text-sm text-red-500 mt-1">{errors.max_installment_count.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="minimum_installment_amount">Minimum Taksit Tutarı (₺)</Label>
                        <Input
                          id="minimum_installment_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register('minimum_installment_amount', { valueAsNumber: true })}
                          placeholder="100.00"
                        />
                        {errors.minimum_installment_amount && (
                          <p className="text-sm text-red-500 mt-1">{errors.minimum_installment_amount.message}</p>
                        )}
                      </div>
                    </div>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Taksit Bilgileri:</strong>
                        <br />• Taksit seçenekleri kart ve banka bazlı değişir
                        <br />• İyzico her kart için farklı taksit oranları uygular
                        <br />• Minimum tutar altındaki ödemeler tek çekim olur
                        <br />• Taksit komisyonları müşteriye yansıtılabilir
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Kaydet Butonu */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving}
            className="min-w-[150px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Kaydediliyor...
              </>
            ) : (
              'Ayarları Kaydet'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 