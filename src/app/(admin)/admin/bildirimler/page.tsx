'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, 
  ShoppingCart,
  Package,
  MessageSquare,
  XCircle,
  Archive,
  Trash2,
  Check,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

// Mock bildirim verisi
const mockNotifications = [
  {
    id: 1,
    type: 'order',
    title: 'Yeni Sipariş',
    message: 'Ahmet Yılmaz #3215 nolu yeni bir sipariş verdi.',
    amount: '₺1,250.00',
    time: '5 dakika önce',
    read: false,
    icon: ShoppingCart,
    color: 'text-blue-600'
  },
  {
    id: 2,
    type: 'stock',
    title: 'Stok Uyarısı',
    message: 'iPhone 15 Pro ürününde kritik stok seviyesi: 3 adet kaldı.',
    time: '1 saat önce',
    read: false,
    icon: Package,
    color: 'text-orange-600'
  },
  {
    id: 3,
    type: 'payment',
    title: 'Ödeme Alındı',
    message: '#3210 nolu sipariş için ödeme başarıyla alındı.',
    amount: '₺2,340.00',
    time: '2 saat önce',
    read: true,
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    id: 4,
    type: 'review',
    title: 'Yeni Değerlendirme',
    message: 'MacBook Air M2 ürünü için 5 yıldızlı yeni değerlendirme.',
    time: '3 saat önce',
    read: true,
    icon: MessageSquare,
    color: 'text-purple-600'
  },
  {
    id: 5,
    type: 'user',
    title: 'Yeni Müşteri',
    message: 'Fatma Öz yeni üye oldu.',
    time: '5 saat önce',
    read: true,
    icon: Users,
    color: 'text-indigo-600'
  },
  {
    id: 6,
    type: 'stock',
    title: 'Stok Tükendi',
    message: 'Pamuklu T-Shirt ürününde stok tükendi!',
    time: '1 gün önce',
    read: true,
    icon: AlertTriangle,
    color: 'text-red-600'
  },
]

// Mock sistem logları
const mockSystemLogs = [
  {
    id: 1,
    type: 'error',
    message: 'Ödeme gateway bağlantı hatası: Timeout',
    timestamp: '2024-01-15 14:32:15',
    severity: 'high'
  },
  {
    id: 2,
    type: 'warning',
    message: 'Yüksek sunucu yükü tespit edildi (%85)',
    timestamp: '2024-01-15 13:15:42',
    severity: 'medium'
  },
  {
    id: 3,
    type: 'info',
    message: 'Veritabanı yedekleme başarıyla tamamlandı',
    timestamp: '2024-01-15 12:00:00',
    severity: 'low'
  },
  {
    id: 4,
    type: 'success',
    message: 'SSL sertifikası başarıyla yenilendi',
    timestamp: '2024-01-14 10:30:00',
    severity: 'low'
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [selectedTab, setSelectedTab] = useState('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const filteredNotifications = selectedTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read)

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Yüksek</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Orta</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Düşük</Badge>
      default:
        return <Badge>Bilinmiyor</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bildirimler</h1>
          <p className="text-muted-foreground">
            Sistem bildirimleri ve uyarıları yönetin
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Okunmamış</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              bekleyen bildirim
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugün</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              yeni bildirim
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistem Uyarıları</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              aktif uyarı
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hata Logları</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              son 24 saat
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="system">Sistem Logları</TabsTrigger>
        </TabsList>

        {/* Bildirimler */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bildirim Merkezi</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTab === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTab('all')}
                  >
                    Tümü ({notifications.length})
                  </Button>
                  <Button
                    variant={selectedTab === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTab('unread')}
                  >
                    Okunmamış ({unreadCount})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Bildirim bulunmuyor</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => {
                    const Icon = notification.icon
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                          notification.read ? 'bg-background' : 'bg-accent/50'
                        }`}
                      >
                        <div className={`mt-1 ${notification.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              {notification.amount && (
                                <p className="text-sm font-medium mt-1">
                                  {notification.amount}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistem Logları */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sistem Logları</CardTitle>
              <Button variant="outline" size="sm">
                <Archive className="mr-2 h-4 w-4" />
                Logları İndir
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSystemLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border"
                  >
                    <div className="mt-1">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.timestamp}
                          </p>
                        </div>
                        {getSeverityBadge(log.severity)}
                      </div>
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