'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  Key, 
  Users, 
  Activity,
  Play,
  RefreshCw,
  Settings
} from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message?: string
  duration?: number
  details?: any
}

interface ApiSettings {
  api_key: string
  api_secret: string
  supplier_id: string
  mock_mode: boolean
  test_mode: boolean
  environment: 'test' | 'production'
  proxy_url?: string
  proxy_enabled?: boolean
}

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<ApiSettings>({
    api_key: '',
    api_secret: '',
    supplier_id: '',
    mock_mode: false,
    test_mode: false,
    environment: 'test',
    proxy_url: '',
    proxy_enabled: false
  })
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [progress, setProgress] = useState(0)
  const [activeTest, setActiveTest] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/trendyol/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          api_key: data.settings?.api_key || '',
          api_secret: data.settings?.api_secret || '',
          supplier_id: data.settings?.supplier_id || '',
          mock_mode: data.settings?.mock_mode || false,
          test_mode: data.settings?.test_mode || false,
          environment: data.settings?.environment || 'test',
          proxy_url: data.settings?.proxy_url || '',
          proxy_enabled: data.settings?.proxy_enabled || false
        })
      }
    } catch (error) {
      console.error('Settings yüklenirken hata:', error)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/trendyol/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Ayarlar başarıyla kaydedildi')
        addLog('✅ Ayarlar kaydedildi')
      } else {
        toast.error('Ayarlar kaydedilemedi')
        addLog('❌ Ayarlar kaydedilemedi')
      }
    } catch (error) {
      toast.error('Ayarları kaydetme sırasında hata oluştu')
      addLog('❌ Ayar kaydetme hatası: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setProgress(0)
    setTestResults([])
    setLogs([])
    
    addLog('🚀 Test süreci başlatıldı')
    
    const tests = [
      { name: 'API Bağlantı Testi', key: 'connection' },
      { name: 'API Kimlik Doğrulama', key: 'auth' },
      { name: 'Supplier ID Kontrolü', key: 'supplier' },
      { name: 'Kategori Listesi Alma', key: 'categories' },
      { name: 'Rate Limit Durumu', key: 'ratelimit' }
    ]

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      setActiveTest(test.name)
      setProgress(((i + 1) / tests.length) * 100)
      
      addLog(`🔄 ${test.name} başlatılıyor...`)
      await runSingleTest(test.key)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
    }
    
    setIsLoading(false)
    setActiveTest('')
    addLog('✅ Tüm testler tamamlandı!')
    toast.success('Tüm testler tamamlandı!')
  }

  const runSingleTest = async (testType: string) => {
    const startTime = Date.now()
    const testName = getTestName(testType)
    
    try {
      addLog(`📤 ${testName} - API isteği gönderiliyor...`)
      addLog(`🔧 Test parametreleri: API Key: ${settings.api_key ? '***' : 'YOK'}, API Secret: ${settings.api_secret ? '***' : 'YOK'}, Supplier ID: ${settings.supplier_id || 'YOK'}`)
      
      const response = await fetch(`/api/trendyol/test/${testType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      const duration = Date.now() - startTime
      
      addLog(`📥 ${testName} - Yanıt alındı (${duration}ms)`)
      addLog(`📊 HTTP Status: ${response.status}`)
      addLog(`💬 Mesaj: ${result.message || result.error}`)
      
      if (result.details) {
        addLog(`🔍 Detaylar: ${JSON.stringify(result.details, null, 2)}`)
      }
      
      const testResult: TestResult = {
        name: testName,
        status: response.ok ? 'success' : 'error',
        message: result.message || result.error,
        duration,
        details: result.details
      }
      
      if (response.ok) {
        addLog(`✅ ${testName} - BAŞARILI`)
      } else {
        addLog(`❌ ${testName} - HATA: ${result.error || result.message}`)
      }
      
      setTestResults(prev => [...prev, testResult])
      
    } catch (error) {
      const duration = Date.now() - startTime
      addLog(`💥 ${testName} - İstek hatası: ${error.message}`)
      
      const testResult: TestResult = {
        name: testName,
        status: 'error',
        message: 'Test sırasında beklenmeyen hata oluştu: ' + error.message,
        duration
      }
      
      setTestResults(prev => [...prev, testResult])
    }
  }

  const getTestName = (testType: string): string => {
    const names = {
      'connection': 'API Bağlantı Testi',
      'auth': 'API Kimlik Doğrulama',
      'supplier': 'Supplier ID Kontrolü',
      'categories': 'Kategori Listesi Alma',
      'ratelimit': 'Rate Limit Durumu'
    }
    return names[testType] || testType
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      'success': 'bg-green-100 text-green-800',
      'error': 'bg-red-100 text-red-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      'success': 'Başarılı',
      'error': 'Hata',
      'warning': 'Uyarı',
      'pending': 'Bekliyor'
    }

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const toggleMockMode = async () => {
    try {
      const newMockMode = !settings.mock_mode
      
      const response = await fetch('/api/trendyol/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock_mode: newMockMode })
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, mock_mode: newMockMode }))
        toast.success(`Mock mode ${newMockMode ? 'açıldı' : 'kapandı'}`)
      } else {
        toast.error('Mock mode güncellenirken hata oluştu')
      }
    } catch (error) {
      toast.error('Mock mode güncellenirken hata oluştu')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Test Console</h1>
          <p className="text-muted-foreground">
            Trendyol API bağlantı ve fonksiyon testleri
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings.mock_mode ? "secondary" : "outline"}>
            {settings.mock_mode ? '🎭 Mock Mode' : '🔴 Live Mode'}
          </Badge>
          <Badge variant={settings.test_mode ? "secondary" : "outline"}>
            {settings.test_mode ? '🧪 Test Mode' : '🚀 Production'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Testler
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Konfigürasyon
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    API Test Suite
                  </CardTitle>
                  <CardDescription>
                    Trendyol API entegrasyonunuzun tüm yönlerini test edin
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={runAllTests}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isLoading ? 'Test Ediliyor...' : 'Tüm Testleri Çalıştır'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTestResults([])
                      setProgress(0)
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{activeTest}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Test Sonuçları</h3>
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          {result.message && (
                            <p className="text-sm text-muted-foreground">
                              {result.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <span className="text-xs text-muted-foreground">
                            {result.duration}ms
                          </span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {testResults.length === 0 && !isLoading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Test çalıştırmak için yukarıdaki butonu kullanın. Mock mode aktifse gerçek API çağrıları yapılmaz.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Kimlik Bilgileri
                </CardTitle>
                <CardDescription>
                  Test için kullanılacak API kimlik bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-api-key">API Key</Label>
                  <Input
                    id="test-api-key"
                    type="password"
                    value={settings.api_key}
                    onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Trendyol API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-api-secret">API Secret</Label>
                  <Input
                    id="test-api-secret"
                    type="password"
                    value={settings.api_secret}
                    onChange={(e) => setSettings(prev => ({ ...prev, api_secret: e.target.value }))}
                    placeholder="Trendyol API Secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-supplier-id">Supplier ID</Label>
                  <Input
                    id="test-supplier-id"
                    value={settings.supplier_id}
                    onChange={(e) => setSettings(prev => ({ ...prev, supplier_id: e.target.value }))}
                    placeholder="Supplier ID"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Test Ayarları
                </CardTitle>
                <CardDescription>
                  Test davranışını kontrol eden ayarlar
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
                    onCheckedChange={toggleMockMode}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Test ortamı API endpoint'lerini kullan
                    </p>
                  </div>
                  <Switch
                    checked={settings.test_mode}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, test_mode: checked }))
                    }
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Trendyol API Ortamı</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, environment: 'test' }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        settings.environment === 'test' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">🧪 Test Ortamı</div>
                      <div className="text-xs text-muted-foreground mt-1">stageapi.trendyol.com</div>
                      <div className="text-xs text-orange-600 mt-1">⚠️ IP yetkilendirmesi gerekli</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, environment: 'production' }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        settings.environment === 'production' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">🚀 Canlı Ortam</div>
                      <div className="text-xs text-muted-foreground mt-1">apigw.trendyol.com</div>
                      <div className="text-xs text-green-600 mt-1">✅ IP kısıtlaması yok</div>
                    </button>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {settings.environment === 'test' ? (
                        <>
                          <strong>Test Ortamı:</strong> IP yetkilendirmesi için 0850 258 58 00'ı arayın. 
                          Test hesabı bilgileri canlı hesaptan tamamen farklıdır.
                        </>
                      ) : (
                        <>
                          <strong>Canlı Ortam:</strong> Gerçek API key ve supplier ID'nizi kullanın. 
                          IP kısıtlaması yoktur ancak gerçek sistemdir.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Proxy Ayarları
                </CardTitle>
                <CardDescription>
                  Test için proxy sunucu konfigürasyonu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Proxy Kullan</Label>
                    <p className="text-sm text-muted-foreground">
                      API çağrıları için proxy sunucu kullan
                    </p>
                  </div>
                  <Switch
                    checked={settings.proxy_enabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, proxy_enabled: checked }))
                    }
                  />
                </div>
                {settings.proxy_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="proxy-url">Proxy URL</Label>
                    <Input
                      id="proxy-url"
                      value={settings.proxy_url}
                      onChange={(e) => setSettings(prev => ({ ...prev, proxy_url: e.target.value }))}
                      placeholder="http://proxy.server.com:8080"
                    />
                    <p className="text-xs text-muted-foreground">
                      Örnek: http://localhost:8080 veya http://proxy.company.com:3128
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Ayarları Kaydet
                  </CardTitle>
                  <Button 
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    API bilgilerinizi girdikten sonra "Ayarları Kaydet" butonuna tıklayın. 
                    Bu bilgiler sistem ayarlarında saklanacak ve diğer sayfalarda da kullanılacaktır.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Test Logları
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogs([])}
                    disabled={logs.length === 0}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Temizle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">Henüz log bulunmuyor. Test çalıştırın...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1 break-words">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Test İstatistikleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.filter(r => r.status === 'success').length}
                    </div>
                    <div className="text-sm text-green-600">Başarılı</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.filter(r => r.status === 'error').length}
                    </div>
                    <div className="text-sm text-red-600">Başarısız</div>
                  </div>
                </div>
                
                {testResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Son Test Sonuçları:</h4>
                    {testResults.slice(-3).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{result.name}</span>
                        <Badge className={
                          result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }>
                          {result.status === 'success' ? 'Başarılı' : 'Hata'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 