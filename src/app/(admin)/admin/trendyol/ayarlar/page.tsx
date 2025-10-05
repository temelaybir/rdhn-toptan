'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Key,
  Shield,
  Store
} from 'lucide-react'

interface TrendyolSettings {
  api_key: string
  api_secret: string
  supplier_id: string
  mock_mode: boolean
  test_mode: boolean
}

export default function TrendyolAyarlarPage() {
  const [settings, setSettings] = useState<TrendyolSettings>({
    api_key: '',
    api_secret: '',
    supplier_id: '',
    mock_mode: false,
    test_mode: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/trendyol/settings')
      const result = await response.json()
      
      if (result.success && result.settings) {
        setSettings(result.settings)
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error)
      toast.error('Ayarlar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/trendyol/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Ayarlar kaydedildi')
      } else {
        toast.error(result.error || 'Ayarlar kaydedilemedi')
      }
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error)
      toast.error('Ayarlar kaydedilirken hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/trendyol/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      
      setTestResult({
        success: result.success,
        message: result.message || result.error || 'Test tamamlandı'
      })
      
      if (result.success) {
        toast.success('API bağlantısı başarılı!')
      } else {
        toast.error('API bağlantısı başarısız')
      }
    } catch (error) {
      console.error('API test hatası:', error)
      setTestResult({
        success: false,
        message: 'Test sırasında hata oluştu'
      })
      toast.error('API test sırasında hata oluştu')
    } finally {
      setIsTesting(false)
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trendyol API Ayarları</h1>
          <p className="text-muted-foreground">
            Trendyol API entegrasyonu için gerekli ayarları yapılandırın
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Kimlik Bilgileri
            </CardTitle>
            <CardDescription>
              Trendyol'dan aldığınız API anahtarlarını girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="text"
                value={settings.api_key}
                onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Trendyol API Key'inizi girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_secret">API Secret</Label>
              <div className="relative">
                <Input
                  id="api_secret"
                  type={showSecret ? 'text' : 'password'}
                  value={settings.api_secret}
                  onChange={(e) => setSettings(prev => ({ ...prev, api_secret: e.target.value }))}
                  placeholder="Trendyol API Secret'ınızı girin"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier ID</Label>
              <Input
                id="supplier_id"
                type="text"
                value={settings.supplier_id}
                onChange={(e) => setSettings(prev => ({ ...prev, supplier_id: e.target.value }))}
                placeholder="Trendyol Supplier ID'nizi girin"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mod Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Mod Ayarları
            </CardTitle>
            <CardDescription>
              API'nin nasıl çalışacağını belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mock Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Gerçek API çağrıları yerine sahte veriler kullan
                </p>
              </div>
              <Switch
                checked={settings.mock_mode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, mock_mode: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Trendyol test ortamını kullan
                </p>
              </div>
              <Switch
                checked={settings.test_mode}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, test_mode: checked }))}
              />
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Güvenlik:</strong> API bilgileriniz güvenli bir şekilde saklanır ve 
                sadece Trendyol API'si ile iletişim kurmak için kullanılır.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Test Sonucu */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Sonucu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* İşlem Butonları */}
      <div className="flex items-center gap-4">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Ayarları Kaydet
        </Button>

        <Button 
          variant="outline" 
          onClick={testConnection} 
          disabled={isTesting || !settings.api_key || !settings.api_secret || !settings.supplier_id}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          API Bağlantısını Test Et
        </Button>
      </div>

      {/* Bilgi */}
      <Alert>
        <Store className="h-4 w-4" />
        <AlertDescription>
          <strong>API Bilgileri:</strong> Trendyol API bilgilerinizi almak için 
          <a href="https://partner.trendyol.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
            Trendyol Partner Portal
          </a>
          'a giriş yapın ve API bölümünden gerekli bilgileri alın.
        </AlertDescription>
      </Alert>
    </div>
  )
} 