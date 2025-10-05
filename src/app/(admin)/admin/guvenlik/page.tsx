'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Shield, 
  Lock, 
  Key,
  UserCheck,
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Info,
  Download
} from 'lucide-react'

// Mock güvenlik ayarları
const mockSecuritySettings = {
  twoFactorAuth: true,
  ipWhitelist: false,
  sessionTimeout: 30,
  passwordExpiry: 90,
  loginAttempts: 5,
  forceHttps: true,
  csrfProtection: true,
  sqlInjectionProtection: true,
}

// Mock erişim logları
const mockAccessLogs = [
  {
    id: 1,
    user: 'admin@rdhncommerce.com',
    action: 'Giriş Yapıldı',
    ip: '192.168.1.1',
    location: 'İstanbul, TR',
    device: 'Chrome - Windows',
    time: '2024-01-15 14:30:12',
    status: 'success',
    icon: Monitor
  },
  {
    id: 2,
    user: 'editor@rdhncommerce.com',
    action: 'Ürün Düzenlendi',
    ip: '10.0.0.5',
    location: 'Ankara, TR',
    device: 'Safari - MacOS',
    time: '2024-01-15 13:25:45',
    status: 'success',
    icon: Monitor
  },
  {
    id: 3,
    user: 'unknown',
    action: 'Başarısız Giriş Denemesi',
    ip: '45.67.89.123',
    location: 'Unknown',
    device: 'Unknown',
    time: '2024-01-15 12:15:30',
    status: 'failed',
    icon: Globe
  },
  {
    id: 4,
    user: 'admin@rdhncommerce.com',
    action: 'Güvenlik Ayarları Değiştirildi',
    ip: '192.168.1.1',
    location: 'İstanbul, TR',
    device: 'Firefox - Linux',
    time: '2024-01-15 11:45:20',
    status: 'warning',
    icon: Monitor
  },
  {
    id: 5,
    user: 'manager@rdhncommerce.com',
    action: 'Giriş Yapıldı',
    ip: '172.16.0.10',
    location: 'İzmir, TR',
    device: 'Chrome - Android',
    time: '2024-01-15 10:30:15',
    status: 'success',
    icon: Smartphone
  },
]

// Mock kullanıcı yetkileri
const mockUserPermissions = [
  {
    id: 1,
    role: 'Admin',
    users: 2,
    permissions: ['Tüm Yetkiler'],
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  {
    id: 2,
    role: 'Editör',
    users: 5,
    permissions: ['Ürün Yönetimi', 'İçerik Yönetimi', 'Kategori Yönetimi'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 3,
    role: 'Müşteri Temsilcisi',
    users: 8,
    permissions: ['Sipariş Görüntüleme', 'Müşteri Yönetimi'],
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 4,
    role: 'Muhasebe',
    users: 3,
    permissions: ['Rapor Görüntüleme', 'Fatura Yönetimi'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
]

export default function SecurityPage() {
  const [settings, setSettings] = useState(mockSecuritySettings)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const handleSettingChange = (setting: string, value: boolean | number) => {
    setSettings({ ...settings, [setting]: value })
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold">Güvenlik</h1>
        <p className="text-muted-foreground">
          Güvenlik ayarlarını ve erişim kontrollerini yönetin
        </p>
      </div>

      {/* Güvenlik Durumu */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Güvenlik Skoru</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">92/100</div>
            <p className="text-xs text-muted-foreground">
              Çok İyi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Oturumlar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              kullanıcı çevrimiçi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız Girişler</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">
              son 24 saat
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Kullanımı</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              kullanıcılar aktif
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Güvenlik Ayarları</TabsTrigger>
          <TabsTrigger value="access">Erişim Logları</TabsTrigger>
          <TabsTrigger value="permissions">Yetkiler</TabsTrigger>
        </TabsList>

        {/* Güvenlik Ayarları */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kimlik Doğrulama</CardTitle>
                <CardDescription>
                  Kullanıcı giriş ve kimlik doğrulama ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>İki Faktörlü Doğrulama (2FA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Tüm kullanıcılar için zorunlu 2FA
                    </p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Oturum Zaman Aşımı (dakika)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Maksimum Giriş Denemesi</Label>
                  <Input
                    type="number"
                    value={settings.loginAttempts}
                    onChange={(e) => handleSettingChange('loginAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Parola Geçerlilik Süresi (gün)</Label>
                  <Input
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ağ Güvenliği</CardTitle>
                <CardDescription>
                  Ağ ve bağlantı güvenliği ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Beyaz Listesi</Label>
                    <p className="text-sm text-muted-foreground">
                      Sadece belirli IP adreslerinden erişim
                    </p>
                  </div>
                  <Switch
                    checked={settings.ipWhitelist}
                    onCheckedChange={(checked) => handleSettingChange('ipWhitelist', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>HTTPS Zorunlu</Label>
                    <p className="text-sm text-muted-foreground">
                      Tüm bağlantılar için SSL/TLS şifrelemesi
                    </p>
                  </div>
                  <Switch
                    checked={settings.forceHttps}
                    onCheckedChange={(checked) => handleSettingChange('forceHttps', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CSRF Koruması</Label>
                    <p className="text-sm text-muted-foreground">
                      Cross-Site Request Forgery koruması
                    </p>
                  </div>
                  <Switch
                    checked={settings.csrfProtection}
                    onCheckedChange={(checked) => handleSettingChange('csrfProtection', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SQL Injection Koruması</Label>
                    <p className="text-sm text-muted-foreground">
                      Veritabanı saldırılarına karşı koruma
                    </p>
                  </div>
                  <Switch
                    checked={settings.sqlInjectionProtection}
                    onCheckedChange={(checked) => handleSettingChange('sqlInjectionProtection', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Önerileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">SSL Sertifikası Aktif</p>
                    <p className="text-sm text-muted-foreground">
                      Siteniz geçerli bir SSL sertifikası kullanıyor
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Güvenlik Duvarı Aktif</p>
                    <p className="text-sm text-muted-foreground">
                      Web Application Firewall (WAF) koruması etkin
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Yedekleme Yapılandırması</p>
                    <p className="text-sm text-muted-foreground">
                      Otomatik yedekleme için son 3 gün kaldı
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Güvenlik Güncellemesi</p>
                    <p className="text-sm text-muted-foreground">
                      Yeni güvenlik yaması mevcut (v2.3.1)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Erişim Logları */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Erişim Logları</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Logları İndir
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>IP / Konum</TableHead>
                      <TableHead>Cihaz</TableHead>
                      <TableHead>Zaman</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAccessLogs.map((log) => {
                      const Icon = log.icon
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              {log.user}
                            </div>
                          </TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{log.ip}</p>
                              <p className="text-muted-foreground">{log.location}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{log.device}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{log.time}</TableCell>
                          <TableCell>{getStatusIcon(log.status)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yetkiler */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Rolleri ve Yetkileri</CardTitle>
              <CardDescription>
                Sistemdeki roller ve sahip oldukları yetkiler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUserPermissions.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          <Lock className={`h-4 w-4 ${role.color}`} />
                          {role.role}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.users} kullanıcı
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Düzenle
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className={`${role.bgColor} ${role.color} border-0`}
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 