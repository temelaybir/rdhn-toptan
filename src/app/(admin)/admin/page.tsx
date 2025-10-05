'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  activeProducts: number
  outOfStockProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  monthlyGrowth: {
    revenue: number
    orders: number
    customers: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dashboard verilerini yükle
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/dashboard-stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Dashboard verileri alınamadı (${response.status})`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Dashboard verileri alınamadı')
      }

      setStats(result.data)
    } catch (err: any) {
      console.error('Dashboard stats fetch error:', err)
      setError(err.message || 'Dashboard verileri yüklenirken hata oluştu')
      toast.error(err.message || 'Dashboard verileri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Mağazanızın genel performansını takip edin
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Dashboard verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Mağazanızın genel performansını takip edin
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardStats}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Mağazanızın genel performansını takip edin
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{stats?.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={stats?.monthlyGrowth.revenue && stats.monthlyGrowth.revenue > 0 ? 'text-green-600' : 'text-red-600'}>
                {stats?.monthlyGrowth.revenue ? `${stats.monthlyGrowth.revenue > 0 ? '+' : ''}${stats.monthlyGrowth.revenue.toFixed(1)}%` : '0%'}
              </span> geçen aya göre
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siparişler</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats?.monthlyGrowth.orders && stats.monthlyGrowth.orders > 0 ? 'text-green-600' : 'text-red-600'}>
                {stats?.monthlyGrowth.orders ? `${stats.monthlyGrowth.orders > 0 ? '+' : ''}${stats.monthlyGrowth.orders.toFixed(1)}%` : '0%'}
              </span> geçen aya göre
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteriler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.monthlyGrowth.customers || 0}</span> yeni müşteri
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Ürünler</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">{stats?.outOfStockProducts || 0}</span> stokta yok
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafik ve Son Siparişler */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Satış Grafiği */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Satış Özeti</CardTitle>
            <CardDescription>Aylık satış performansınız</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Grafik alanı (Chart.js veya Recharts ile doldurulacak)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Son Siparişler */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Son Siparişler</CardTitle>
            <CardDescription>En son gelen 5 sipariş</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ₺{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs ${
                        order.status === 'delivered' ? 'text-green-600' :
                        order.status === 'shipped' ? 'text-blue-600' :
                        order.status === 'confirmed' ? 'text-yellow-600' :
                        order.status === 'paid' ? 'text-purple-600' :
                        'text-gray-600'
                      }`}>
                        {order.status === 'delivered' ? 'Teslim Edildi' :
                         order.status === 'shipped' ? 'Kargoda' :
                         order.status === 'confirmed' ? 'Onaylandı' :
                         order.status === 'paid' ? 'Ödendi' :
                         order.status === 'pending' ? 'Beklemede' :
                         order.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Henüz sipariş bulunmuyor</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Eylemler */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Eylemler</CardTitle>
          <CardDescription>Sık kullanılan işlemler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/urunler" className="p-4 border rounded-lg hover:bg-accent transition-colors text-left block">
              <Package className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium">Ürünleri Yönet</h3>
              <p className="text-sm text-muted-foreground">Ürün kataloğunu yönetin</p>
            </Link>
            <Link href="/admin/siparisler" className="p-4 border rounded-lg hover:bg-accent transition-colors text-left block">
              <ShoppingCart className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium">Siparişleri Görüntüle</h3>
              <p className="text-sm text-muted-foreground">Tüm siparişleri kontrol edin</p>
            </Link>
            <Link href="/admin/musteriler" className="p-4 border rounded-lg hover:bg-accent transition-colors text-left block">
              <Users className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium">Müşteri Listesi</h3>
              <p className="text-sm text-muted-foreground">Müşteri bilgilerini yönetin</p>
            </Link>
            <Link href="/admin/raporlar" className="p-4 border rounded-lg hover:bg-accent transition-colors text-left block">
              <TrendingUp className="h-5 w-5 mb-2 text-primary" />
              <h3 className="font-medium">Raporları İncele</h3>
              <p className="text-sm text-muted-foreground">Detaylı satış raporlarını görüntüleyin</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 