'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  RefreshCw, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Activity,
  Database,
  Mail,
  Search,
  Settings
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface TestResult {
  success: boolean
  message: string
  data?: any
  timestamp: string
  duration?: number
}

export function ArasCargoTestPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<TestResult | null>(null)
  const [syncResult, setSyncResult] = useState<TestResult | null>(null)
  const [testTrackingNumber, setTestTrackingNumber] = useState('3513773163316')
  const [trackingResult, setTrackingResult] = useState<TestResult | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [emailResult, setEmailResult] = useState<TestResult | null>(null)
  const { toast } = useToast()

  // Test connection to Aras Kargo
  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus(null)
    
    try {
      const response = await fetch('/api/admin/cargo/aras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceUrl: 'https://appls-srv.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
          username: 'test_user',
          password: 'test_password'
        })
      })

      const result = await response.json()
      
      setConnectionStatus({
        success: result.success || false,
        message: result.message || result.error || 'Bilinmeyen hata',
        data: result,
        timestamp: new Date().toISOString()
      })

             toast({
         title: result.success ? "Bağlantı Başarılı" : "Bağlantı Hatası",
         description: result.message || result.error,
         variant: result.success ? "default" : "destructive"
       })

    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Network hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
        timestamp: new Date().toISOString()
      }
      
             setConnectionStatus(errorResult)
       toast({
         title: "Bağlantı Hatası",
         description: errorResult.message,
         variant: "destructive"
       })
    } finally {
      setIsLoading(false)
    }
  }

  // Manual cargo sync
  const manualSync = async () => {
    setIsLoading(true)
    setSyncResult(null)
    
    try {
      const response = await fetch('/api/admin/cargo/sync-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      setSyncResult({
        success: result.success || false,
        message: result.message || result.error || 'Bilinmeyen hata',
        data: result,
        timestamp: new Date().toISOString(),
        duration: result.result?.duration
      })

      toast({
        title: result.success ? "Sync Tamamlandı" : "Sync Hatası",
        description: result.message || result.error,
        variant: result.success ? "default" : "destructive"
      })

    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Network hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
        timestamp: new Date().toISOString()
      }
      
      setSyncResult(errorResult)
      toast({
        title: "Sync Hatası",
        description: errorResult.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test tracking
  const testTracking = async () => {
    if (!testTrackingNumber.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen takip numarası girin",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setTrackingResult(null)
    
    try {
      const response = await fetch('/api/admin/cargo/aras/test-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: testTrackingNumber
        })
      })

      const result = await response.json()
      
      setTrackingResult({
        success: result.success || false,
        message: result.message || result.error || 'Bilinmeyen hata',
        data: result,
        timestamp: new Date().toISOString()
      })

      toast({
        title: result.success ? "Tracking Başarılı" : "Tracking Hatası",
        description: result.message || result.error,
        variant: result.success ? "default" : "destructive"
      })

    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Network hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
        timestamp: new Date().toISOString()
      }
      
      setTrackingResult(errorResult)
      toast({
        title: "Tracking Hatası",
        description: errorResult.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Test email notification
  const testEmailNotification = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen email adresi girin",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setEmailResult(null)
    
    try {
      // Call our notification service test endpoint
      const response = await fetch('/api/admin/cargo/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail
        })
      })

      const result = await response.json()
      
      setEmailResult({
        success: result.success || false,
        message: result.message || result.error || 'Email test tamamlandı',
        data: result,
        timestamp: new Date().toISOString()
      })

      toast({
        title: result.success ? "Email Gönderildi" : "Email Hatası",
        description: result.message || result.error,
        variant: result.success ? "default" : "destructive"
      })

    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Network hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'),
        timestamp: new Date().toISOString()
      }
      
      setEmailResult(errorResult)
      toast({
        title: "Email Hatası",
        description: errorResult.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const StatusIcon = ({ success }: { success: boolean | null }) => {
    if (success === null) return <Clock className="w-4 h-4 text-muted-foreground" />
    return success ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />
  }

  const StatusBadge = ({ success }: { success: boolean | null }) => {
    if (success === null) return <Badge variant="secondary">Beklemede</Badge>
    return success ? 
      <Badge variant="default" className="bg-green-500">Başarılı</Badge> : 
      <Badge variant="destructive">Hatalı</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Bağlantı Testi
          </CardTitle>
          <CardDescription>
            Aras Kargo SOAP servisine bağlantıyı test edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Bağlantıyı Test Et
          </Button>

          {connectionStatus && (
            <Alert>
              <StatusIcon success={connectionStatus.success} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{connectionStatus.message}</span>
                  <StatusBadge success={connectionStatus.success} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(connectionStatus.timestamp).toLocaleString('tr-TR')}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Manuel Senkronizasyon
          </CardTitle>
          <CardDescription>
            Tüm bekleyen kargo siparişlerini Aras Kargo ile senkronize edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={manualSync} 
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Manuel Sync Başlat
          </Button>

          {syncResult && (
            <Alert>
              <StatusIcon success={syncResult.success} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{syncResult.message}</span>
                  <StatusBadge success={syncResult.success} />
                </div>
                {syncResult.data && (
                  <div className="text-sm mt-2 space-y-1">
                    {syncResult.data.result && (
                      <>
                        <div>İşlenen: {syncResult.data.result.processedOrders || 0} sipariş</div>
                        <div>Güncellenen: {syncResult.data.result.updatedOrders || 0} sipariş</div>
                        <div>Hata: {syncResult.data.result.errors?.length || 0} adet</div>
                        {syncResult.duration && (
                          <div>Süre: {syncResult.duration}ms</div>
                        )}
                      </>
                    )}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(syncResult.timestamp).toLocaleString('tr-TR')}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Tracking Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Takip Testi
          </CardTitle>
          <CardDescription>
            Belirli bir takip numarası için kargo durumunu sorgulayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tracking-number">Takip Numarası</Label>
            <Input
              id="tracking-number"
              value={testTrackingNumber}
              onChange={(e) => setTestTrackingNumber(e.target.value)}
              placeholder="3513773163316"
            />
          </div>

          <Button 
            onClick={testTracking} 
            disabled={isLoading || !testTrackingNumber.trim()}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Takip Et
          </Button>

          {trackingResult && (
            <Alert>
              <StatusIcon success={trackingResult.success} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{trackingResult.message}</span>
                  <StatusBadge success={trackingResult.success} />
                </div>
                {trackingResult.data && trackingResult.data.trackingUrls && (
                  <div className="text-sm mt-2">
                    <div>Takip URL'leri oluşturuldu</div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(trackingResult.timestamp).toLocaleString('tr-TR')}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Email Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Bildirim Testi
          </CardTitle>
          <CardDescription>
            Test email gönderimi yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-email">Email Adresi</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <Button 
            onClick={testEmailNotification} 
            disabled={isLoading || !testEmail.trim()}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Test Email Gönder
          </Button>

          {emailResult && (
            <Alert>
              <StatusIcon success={emailResult.success} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{emailResult.message}</span>
                  <StatusBadge success={emailResult.success} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(emailResult.timestamp).toLocaleString('tr-TR')}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sistem Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cron Schedule:</span>
              <div>Her 30 dakika</div>
            </div>
            <div>
              <span className="text-muted-foreground">Next Run:</span>
              <div>~{30 - new Date().getMinutes() % 30} dakika</div>
            </div>
            <div>
              <span className="text-muted-foreground">Environment:</span>
              <div>{process.env.NODE_ENV || 'development'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Check:</span>
              <div>{new Date().toLocaleTimeString('tr-TR')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 