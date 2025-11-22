'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  TestTube, 
  Key, 
  Globe, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  ExternalLink 
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ArasCargoConfig {
  serviceUrl: string
  username: string
  password: string
  customerCode: string
  isActive: boolean
  autoCreateShipment: boolean
  autoTrackingUpdate: boolean
  customerNotifications: boolean
  testMode: boolean
}

export function ArasCargoSettings() {
  const [config, setConfig] = useState<ArasCargoConfig>({
    serviceUrl: 'https://appls-srv.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
    username: '',
    password: '',
    customerCode: '',
    isActive: false,
    autoCreateShipment: true,
    autoTrackingUpdate: true,
    customerNotifications: true,
    testMode: true
  })

  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/cargo/aras/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.settings) {
            setConfig(prev => ({
              ...prev,
              ...data.settings
            }))
          }
        }
      } catch (error) {
        console.error('Settings yüklenemedi:', error)
      }
    }

    loadSettings()
  }, [])

  const handleInputChange = (field: keyof ArasCargoConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const testConnection = async () => {
    setConnectionStatus('testing')
    setIsLoading(true)

    try {
      // API test çağrısı
      const response = await fetch('/api/admin/cargo/aras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceUrl: config.serviceUrl,
          username: config.username,
          password: config.password
        })
      })

      if (response.ok) {
        setConnectionStatus('success')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsLoading(true)
    setSaveStatus('saving')
    
    try {
      const response = await fetch('/api/admin/cargo/aras/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSaveStatus('success')
        console.log('✅ Ayarlar kaydedildi')
        
        // Success status'u 3 saniye sonra temizle
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        console.error('❌ Ayarlar kaydedilemedi:', result.error)
        setTimeout(() => setSaveStatus('idle'), 5000)
      }
    } catch (error) {
      setSaveStatus('error')
      console.error('❌ Network hatası:', error)
      setTimeout(() => setSaveStatus('idle'), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge className="bg-yellow-100 text-yellow-800">Test Ediliyor...</Badge>
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Bağlantı Başarılı
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Bağlantı Hatası
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Genel Durum */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Aras Kargo SOAP entegrasyonu için sadece 3 bilgi gerekli: Kullanıcı adı, şifre ve müşteri kodu.
        </AlertDescription>
      </Alert>

      {/* API Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            SOAP API Bilgileri
          </CardTitle>
          <CardDescription>
            Aras Kargo SOAP Web Servisi için gerekli bilgiler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceUrl">Servis URL</Label>
            <Input
              id="serviceUrl"
              value={config.serviceUrl}
              onChange={(e) => handleInputChange('serviceUrl', e.target.value)}
              placeholder="https://appls-srv.araskargo.com.tr/arascargoservice/arascargoservice.asmx"
              className="font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                value={config.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Aras Kargo kullanıcı adınız"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Aras Kargo şifreniz"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerCode">Müşteri Kodu</Label>
            <Input
              id="customerCode"
              value={config.customerCode}
              onChange={(e) => handleInputChange('customerCode', e.target.value)}
              placeholder="123456789musterino"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Aras Kargo tarafından verilen müşteri kodunuz
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              variant="outline" 
              disabled={isLoading || !config.username || !config.password}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Bağlantı Test Et
            </Button>
            {getConnectionStatusBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Kargo Takip Bilgilendirmesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Kargo Takip Sistemi
          </CardTitle>
          <CardDescription>
            Web tabanlı kargo takip bilgileri (opsiyonel)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Not:</strong> Kargo takip sistemimiz doğrudan tracking numarası ile çalışır. 
              Sipariş numarası ile takip için ayrı account ID'ye ihtiyaç duyulur.
            </AlertDescription>
          </Alert>

          <div className="text-sm space-y-2">
            <p><strong>Mevcut takip yöntemleri:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Kargo takip numarası ile (13 haneli)</li>
              <li>Barkod ile (20 haneli)</li>
              <li>Sipariş numarası ile (account ID gerekli)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Otomatik İşlemler */}
      <Card>
        <CardHeader>
          <CardTitle>Otomatik İşlemler</CardTitle>
          <CardDescription>
            Kargo işlemlerini otomatikleştirin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aras Kargo Entegrasyonu</Label>
              <p className="text-sm text-muted-foreground">
                Aras Kargo entegrasyonunu aktif et/pasif et
              </p>
            </div>
            <Switch
              checked={config.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Otomatik Kargo Oluşturma</Label>
              <p className="text-sm text-muted-foreground">
                Onaylanan siparişler için otomatik kargo kaydı oluştur
              </p>
            </div>
            <Switch
              checked={config.autoCreateShipment}
              onCheckedChange={(checked) => handleInputChange('autoCreateShipment', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Otomatik Takip Güncelleme</Label>
              <p className="text-sm text-muted-foreground">
                Kargo durumlarını otomatik olarak güncelle
              </p>
            </div>
            <Switch
              checked={config.autoTrackingUpdate}
              onCheckedChange={(checked) => handleInputChange('autoTrackingUpdate', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Müşteri Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Kargo durumu değişikliklerinde müşteriye e-posta gönder
              </p>
            </div>
            <Switch
              checked={config.customerNotifications}
              onCheckedChange={(checked) => handleInputChange('customerNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Test Modu</Label>
              <p className="text-sm text-muted-foreground">
                Gerçek kargo oluşturmadan test yapın
              </p>
            </div>
            <Switch
              checked={config.testMode}
              onCheckedChange={(checked) => handleInputChange('testMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dokümantasyon Linkleri */}
      <Card>
        <CardHeader>
          <CardTitle>Dokümantasyon</CardTitle>
          <CardDescription>
            Aras Kargo entegrasyon dokümantasyonu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" asChild className="w-full justify-start">
              <a 
                href="https://www.araskargo.com.tr/kurumsal/entegrasyonlar" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Aras Kargo Entegrasyon Sayfası
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <a 
                href="http://kargotakip.araskargo.com.tr/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Kargo Takip Web Sayfası
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kaydet */}
      <div className="flex justify-end items-center gap-4">
        {saveStatus === 'success' && (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Kaydedildi!
          </Badge>
        )}
        {saveStatus === 'error' && (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Kaydetme Hatası
          </Badge>
        )}
        <Button onClick={saveSettings} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
      </div>
    </div>
  )
} 