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
  Banknote, 
  AlertTriangle,
  TestTube,
  Database,
  Shield,
  RefreshCw,
  DollarSign,
  Calculator,
  Building,
  Mail,
  Clock,
  Info,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CreditCard
} from 'lucide-react'

// Form validation schemas
const bankTransferSettingsSchema = z.object({
  is_active: z.boolean(),
  bank_name: z.string().min(1, 'Banka adı gerekli'),
  account_holder: z.string().min(1, 'Hesap sahibi gerekli'),
  account_number: z.string().min(1, 'Hesap numarası gerekli'),
  iban: z.string().min(26, 'Geçerli bir IBAN giriniz'),
  swift_code: z.string().optional(),
  branch_name: z.string().optional(),
  branch_code: z.string().optional(),
  customer_message: z.string().min(10, 'Müşteri mesajı en az 10 karakter olmalı'),
  payment_note: z.string().min(5, 'Ödeme notu en az 5 karakter olmalı'),
  payment_deadline_hours: z.number().min(1).max(168), // 1 saat ile 7 gün arası
  email_subject: z.string().min(5, 'E-posta konusu gerekli'),
  email_message: z.string().min(20, 'E-posta mesajı en az 20 karakter olmalı')
})

// TypeScript interfaces
interface BankTransferSettings {
  id: string
  is_active: boolean
  bank_name: string
  account_holder: string
  account_number: string
  iban: string
  swift_code?: string
  branch_name?: string
  branch_code?: string
  alternative_accounts: any[]
  customer_message: string
  payment_note: string
  payment_deadline_hours: number
  email_subject: string
  email_message: string
  created_at: string
  updated_at: string
}

interface AlternativeAccount {
  id: string
  bank_name: string
  account_holder: string
  iban: string
  account_number: string
}

type BankTransferFormData = z.infer<typeof bankTransferSettingsSchema>

export default function BankTransferAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<BankTransferSettings | null>(null)
  const [alternativeAccounts, setAlternativeAccounts] = useState<AlternativeAccount[]>([])
  const [showIban, setShowIban] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<BankTransferFormData>({
    resolver: zodResolver(bankTransferSettingsSchema),
    defaultValues: {
      is_active: true,
      payment_deadline_hours: 24,
      customer_message: 'Sipariş onayından sonra aşağıdaki hesap bilgilerimize ödeme yapabilirsiniz. Ödemenizin açıklama kısmına mutlaka sipariş numaranızı yazınız.',
      payment_note: 'Ödeme açıklamasına sipariş numaranızı yazmayı unutmayın!',
      email_subject: 'Havale/EFT Ödeme Bilgileri - Sipariş No: {ORDER_NUMBER}',
      email_message: 'Merhaba,\n\nSiparişiniz için ödeme bilgileri aşağıdadır:\n\nSipariş No: {ORDER_NUMBER}\nTutar: {AMOUNT} {CURRENCY}\n\nBanka Hesap Bilgileri:\n{BANK_INFO}\n\nÖdemenizi {DEADLINE} saati içinde yapmanız gerekmektedir.\n\nTeşekkürler.'
    }
  })



  // Load settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/bank-transfer')
      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Ayarlar yüklenirken hata oluştu')
        return
      }

      const data = result.data.bankTransferSettings
      if (data) {
        setSettings(data)
        setAlternativeAccounts(data.alternative_accounts || [])
        
        // Form'u güncelle
        Object.keys(data).forEach((key) => {
          if (key in bankTransferSettingsSchema.shape) {
            setValue(key as keyof BankTransferFormData, data[key])
          }
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Ayarlar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: BankTransferFormData) => {
    setIsSaving(true)
    
    try {
      const updateData = {
        ...data,
        alternative_accounts: alternativeAccounts,
        updated_at: new Date().toISOString()
      }

      const response = await fetch('/api/settings/bank-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Ayarlar kaydedilirken hata oluştu')
        return
      }

      toast.success('Banka havalesi ayarları başarıyla kaydedildi!')
      await loadSettings()
      
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Ayarlar kaydedilirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const addAlternativeAccount = () => {
    const newAccount: AlternativeAccount = {
      id: Date.now().toString(),
      bank_name: '',
      account_holder: '',
      iban: '',
      account_number: ''
    }
    setAlternativeAccounts([...alternativeAccounts, newAccount])
  }

  const removeAlternativeAccount = (id: string) => {
    setAlternativeAccounts(alternativeAccounts.filter(acc => acc.id !== id))
  }

  const updateAlternativeAccount = (id: string, field: keyof AlternativeAccount, value: string) => {
    setAlternativeAccounts(alternativeAccounts.map(acc => 
      acc.id === id ? { ...acc, [field]: value } : acc
    ))
  }

  const formatIban = (iban: string) => {
    if (!showIban && iban.length > 8) {
      return iban.substring(0, 4) + ' **** **** **** **** ' + iban.substring(iban.length - 4)
    }
    return iban.replace(/(.{4})/g, '$1 ').trim()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-8 w-8 text-primary" />
            Banka Havalesi Ayarları
          </h1>
          <p className="text-muted-foreground mt-2">
            Banka havalesi ödeme yöntemi ayarları ve hesap bilgileri
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={watch('is_active') ? 'default' : 'secondary'}>
            {watch('is_active') ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Genel Ayarlar
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Hesap Bilgileri
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Mesajlar
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Temel Ayarlar
                </CardTitle>
                <CardDescription>
                  Banka havalesi ödeme yönteminin temel konfigürasyonu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active" className="text-base">
                      Banka Havalesi Ödeme Sistemi
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Banka havalesi ödeme yöntemini aktif/pasif duruma getirir
                    </div>
                  </div>
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_deadline_hours">Ödeme Süresi (Saat)</Label>
                    <Input
                      id="payment_deadline_hours"
                      type="number"
                      min="1"
                      max="168"
                      {...register('payment_deadline_hours', { valueAsNumber: true })}
                      placeholder="24"
                    />
                    {errors.payment_deadline_hours && (
                      <p className="text-sm text-red-500">{errors.payment_deadline_hours.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Müşterilerin ödeme yapması için verilen süre (1-168 saat arası)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Güvenlik</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showIban}
                        onCheckedChange={setShowIban}
                      />
                      <Label className="text-sm">IBAN numaralarını tam göster</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      IBAN numaralarının tam halini gösterir (güvenlik için kapatılabilir)
                    </p>
                  </div>
                </div>

                {!watch('is_active') && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Banka havalesi ödeme yöntemi şu anda <strong>pasif</strong> durumda. 
                      Müşteriler bu ödeme yöntemini göremeyecekler.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Ana Banka Hesabı
                </CardTitle>
                <CardDescription>
                  Müşterilere gösterilecek ana banka hesap bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Banka Adı *</Label>
                    <Input
                      id="bank_name"
                      {...register('bank_name')}
                      placeholder="Örnek Bankası"
                    />
                    {errors.bank_name && (
                      <p className="text-sm text-red-500">{errors.bank_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_holder">Hesap Sahibi *</Label>
                    <Input
                      id="account_holder"
                      {...register('account_holder')}
                      placeholder="RDHN COMMERCE A.Ş."
                    />
                    {errors.account_holder && (
                      <p className="text-sm text-red-500">{errors.account_holder.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN *</Label>
                    <div className="relative">
                      <Input
                        id="iban"
                        {...register('iban')}
                        placeholder="TR12 3456 7890 1234 5678 9012 34"
                        type={showIban ? 'text' : 'password'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowIban(!showIban)}
                      >
                        {showIban ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.iban && (
                      <p className="text-sm text-red-500">{errors.iban.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Hesap Numarası *</Label>
                    <Input
                      id="account_number"
                      {...register('account_number')}
                      placeholder="1234567890123456"
                    />
                    {errors.account_number && (
                      <p className="text-sm text-red-500">{errors.account_number.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="swift_code">SWIFT Kodu</Label>
                    <Input
                      id="swift_code"
                      {...register('swift_code')}
                      placeholder="TRBKTR2A"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch_name">Şube Adı</Label>
                    <Input
                      id="branch_name"
                      {...register('branch_name')}
                      placeholder="MERKEZ ŞUBE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch_code">Şube Kodu</Label>
                    <Input
                      id="branch_code"
                      {...register('branch_code')}
                      placeholder="001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternatif Hesaplar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Alternatif Hesaplar
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAlternativeAccount}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Hesap Ekle
                  </Button>
                </CardTitle>
                <CardDescription>
                  Müşterilere sunabileceğiniz alternatif banka hesapları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alternativeAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz alternatif hesap eklenmemiş
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alternativeAccounts.map((account) => (
                      <Card key={account.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Banka Adı</Label>
                            <Input
                              value={account.bank_name}
                              onChange={(e) => updateAlternativeAccount(account.id, 'bank_name', e.target.value)}
                              placeholder="Banka adı"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hesap Sahibi</Label>
                            <Input
                              value={account.account_holder}
                              onChange={(e) => updateAlternativeAccount(account.id, 'account_holder', e.target.value)}
                              placeholder="Hesap sahibi"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>IBAN</Label>
                            <Input
                              value={account.iban}
                              onChange={(e) => updateAlternativeAccount(account.id, 'iban', e.target.value)}
                              placeholder="TR12 3456 7890 1234 5678 9012 34"
                            />
                          </div>
                          <div className="space-y-2 flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeAlternativeAccount(account.id)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Sil
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Müşteri Mesajları
                </CardTitle>
                <CardDescription>
                  Ödeme sayfasında ve e-postalarda gösterilecek mesajlar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_message">Ödeme Sayfası Mesajı *</Label>
                  <Textarea
                    id="customer_message"
                    {...register('customer_message')}
                    placeholder="Sipariş onayından sonra banka hesap bilgilerimiz..."
                    rows={3}
                  />
                  {errors.customer_message && (
                    <p className="text-sm text-red-500">{errors.customer_message.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Bu mesaj ödeme sayfasında banka havalesi seçildiğinde gösterilir
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_note">Ödeme Notu *</Label>
                  <Input
                    id="payment_note"
                    {...register('payment_note')}
                    placeholder="Ödeme açıklamasına sipariş numaranızı yazmayı unutmayın!"
                  />
                  {errors.payment_note && (
                    <p className="text-sm text-red-500">{errors.payment_note.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Önemli ödeme notları ve uyarılar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_subject">E-posta Konusu *</Label>
                  <Input
                    id="email_subject"
                    {...register('email_subject')}
                    placeholder="Havale/EFT Ödeme Bilgileri - Sipariş No: {ORDER_NUMBER}"
                  />
                  {errors.email_subject && (
                    <p className="text-sm text-red-500">{errors.email_subject.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Kullanılabilir değişkenler: {'{ORDER_NUMBER}'}, {'{AMOUNT}'}, {'{CURRENCY}'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_message">E-posta Mesajı *</Label>
                  <Textarea
                    id="email_message"
                    {...register('email_message')}
                    placeholder="Merhaba, siparişiniz için ödeme bilgileri..."
                    rows={6}
                  />
                  {errors.email_message && (
                    <p className="text-sm text-red-500">{errors.email_message.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Kullanılabilir değişkenler: {'{ORDER_NUMBER}'}, {'{AMOUNT}'}, {'{CURRENCY}'}, {'{BANK_INFO}'}, {'{DEADLINE}'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Son güncelleme: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString('tr-TR') : 'Henüz kaydedilmemiş'}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset()
                  loadSettings()
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sıfırla
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving}
                className="min-w-32"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Tabs>
    </div>
  )
} 