'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SafeImage } from '@/components/ui/safe-image'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Printer,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Edit,
  Navigation,
  Loader2,
  AlertCircle,
  Receipt
} from 'lucide-react'

// Order interfaces
interface OrderItem {
  id: number
  name: string
  image: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  customer: string
  email: string
  phone: string
  date: string
  total: number
  status: string
  items: number
  payment: string
  currency: string
  shippingAddress?: {
    fullName: string
    address: string
    city: string
    district: string
    postalCode: string
  }
  billingAddress?: {
    fullName: string
    address: string
    city: string
    district: string
    postalCode: string
  }
  orderItems?: OrderItem[]
  trackingNumber?: string
  cargoCompany?: string
  notes?: string
}

interface OrderStats {
  total: number
  pending: number
  paid: number // Ödeme Alındı
  confirmed: number // Başarılı Sipariş - Kargolanacak
  shipped: number // Kargoda
  delivered: number // Teslim edildi
  cancelled: number
  awaiting_payment: number
  total_revenue: number
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false)
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [cargoCompany, setCargoCompany] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    paid: 0, // Ödeme Alındı
    confirmed: 0, // Başarılı Sipariş - Kargolanacak
    shipped: 0, // Kargoda
    delivered: 0, // Teslim edildi
    cancelled: 0,
    awaiting_payment: 0,
    total_revenue: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  // Invoice creation state
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null)

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: selectedStatus
      })

      // Debug: Cookie kontrolü
      const cookies = document.cookie
      console.log('🍪 Client cookies:', cookies)
      console.log('🌐 Environment:', process.env.NODE_ENV)

      const response = await fetch(`/api/admin/orders?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        console.error(`API Response not OK: ${response.status} - ${response.statusText}`)
        throw new Error(`Siparişler yüklenirken hata oluştu (${response.status})`)
      }

      const result = await response.json()
      
      if (!result.success) {
        console.error('API Error:', result.error)
        throw new Error(result.error || 'Siparişler alınamadı')
      }

      setOrders(result.data.orders)
      setOrderStats(result.data.stats)
      setTotalPages(result.data.pagination.totalPages)
    } catch (err: any) {
      console.error('Orders fetch error:', err)
      setError(err.message || 'Siparişler yüklenirken hata oluştu')
      toast.error(err.message || 'Siparişler yüklenirken hata oluştu')
      
      // Hata durumunda boş veri göster
      setOrders([])
      setOrderStats({
        total: 0,
        pending: 0,
        paid: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        awaiting_payment: 0,
        total_revenue: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch orders on component mount and when filters change
  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, selectedStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setIsDetailDialogOpen(true)
  }

  const handleUpdateStatusClick = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setIsUpdateStatusDialogOpen(true)
  }

  const handleCreateInvoice = async (orderId: string) => {
    // Loading state başlat
    setInvoiceLoading(orderId)
    
    try {
      toast.loading('Fatura oluşturuluyor...', { id: `invoice-${orderId}` })
      
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          invoiceType: 3, // Satış faturası
          createRecord: true,
          sendNotification: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // API error response
        const errorMsg = result.error || `HTTP ${response.status}: Fatura oluşturulurken hata oluştu`
        throw new Error(errorMsg)
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Fatura oluşturulamadı')
      }

      // Success feedback
      toast.success(`🎉 Fatura başarıyla oluşturuldu!`, { 
        id: `invoice-${orderId}`,
        description: `Fatura ID: ${result.invoiceId}`
      })
      
    } catch (error: any) {
      console.error('📄 Invoice creation error:', error)
      
      // Detaylı error feedback
      const errorMessage = error.message?.includes('BIZIMHESAP_FIRM_ID') 
        ? '⚠️ BizimHesap ayarları eksik! .env.local dosyasında BIZIMHESAP_FIRM_ID tanımlanmalı.'
        : error.message?.includes('environment variable')
        ? '⚠️ Sistem ayarları eksik! BizimHesap entegrasyonu yapılandırılmamış.'
        : error.message || 'Fatura oluşturulurken bilinmeyen hata oluştu'
      
      toast.error(errorMessage, { 
        id: `invoice-${orderId}`,
        duration: 6000
      })
    } finally {
      // Loading state temizle
      setInvoiceLoading(null)
    }
  }

  const handleUpdateCargoInfo = async (orderId: string) => {
    try {
      if (!trackingNumber.trim()) {
        toast.error('Kargo takip numarası gereklidir')
        return
      }

      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          status: 'shipped', // Kargo girişi yapıldığında otomatik olarak "shipped" yap
          trackingNumber,
          cargoCompany: cargoCompany || 'aras'
        })
      })

      if (!response.ok) {
        throw new Error('Kargo bilgileri güncellenirken hata oluştu')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Kargo bilgileri güncellenemedi')
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, trackingNumber, cargoCompany: cargoCompany || 'aras', status: 'shipped' }
            : order
        )
      )
      
      // Update selected order if it's the same one
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, trackingNumber, cargoCompany: cargoCompany || 'aras', status: 'shipped' } : null)
      }
      
      toast.success('Kargo bilgileri güncellendi ve sipariş "Kargoda" durumuna geçti')
      setIsCargoDialogOpen(false)
      setTrackingNumber('')
      setCargoCompany('')
      
      // Refresh orders to update stats
      fetchOrders()
    } catch (err: any) {
      console.error('Update cargo info error:', err)
      toast.error(err.message || 'Kargo bilgileri güncellenirken hata oluştu')
    }
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          status
        })
      })

      if (!response.ok) {
        throw new Error('Sipariş durumu güncellenirken hata oluştu')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Sipariş durumu güncellenemedi')
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: status }
            : order
        )
      )
      
      // Update selected order if it's the same one
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: status } : null)
      }
      
      toast.success(`Sipariş durumu "${getStatusText(status)}" olarak güncellendi`)
      setIsUpdateStatusDialogOpen(false)
      
      // Refresh stats
      fetchOrders()
    } catch (err: any) {
      console.error('Update status error:', err)
      toast.error(err.message || 'Sipariş durumu güncellenirken hata oluştu')
    }
  }

  const handleTrackCargo = (trackingNumber: string) => {
    if (trackingNumber) {
      window.open(`https://kargotakip.com.tr/sorgula/${trackingNumber}`, '_blank')
    } else {
      toast.error('Kargo takip numarası bulunamadı')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Ödeme Alındı'
      case 'confirmed': return 'Başarılı Sipariş - Kargolanacak'
      case 'shipped': return 'Kargoda'
      case 'delivered': return 'Teslim Edildi'
      case 'pending': return 'Beklemede'
      case 'cancelled': return 'İptal Edildi'
      case 'awaiting_payment': return 'Ödeme Bekliyor'
      default: return 'Bilinmiyor'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Ödeme Alındı
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Başarılı Sipariş - Kargolanacak
          </Badge>
        )
      case 'shipped':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Truck className="mr-1 h-3 w-3" />
            Kargoda
          </Badge>
        )
      case 'delivered':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Package className="mr-1 h-3 w-3" />
            Teslim Edildi
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Beklemede
          </Badge>
        )
      case 'awaiting_payment':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <CreditCard className="mr-1 h-3 w-3" />
            Ödeme Bekliyor
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            İptal Edildi
          </Badge>
        )
      default:
        return <Badge>Bilinmiyor</Badge>
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Siparişler</h1>
            <p className="text-muted-foreground">
              Müşteri siparişlerini yönetin
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <div className="mt-4 text-center">
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Siparişler</h1>
          <p className="text-muted-foreground">
            Müşteri siparişlerini yönetin
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Dışa Aktar
        </Button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Ödeme Bekliyor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.awaiting_payment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Beklemede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Başarılı Sipariş - Kargolanacak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">Kargoda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.shipped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Teslim Edildi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">İptal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sipariş Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedStatus('all')}>
                Tümü
              </TabsTrigger>
              <TabsTrigger value="awaiting_payment" onClick={() => setSelectedStatus('awaiting_payment')}>
                Ödeme Bekliyor
              </TabsTrigger>
              <TabsTrigger value="pending" onClick={() => setSelectedStatus('pending')}>
                Beklemede
              </TabsTrigger>
              <TabsTrigger value="processing" onClick={() => setSelectedStatus('processing')}>
                Hazırlanıyor
              </TabsTrigger>
              <TabsTrigger value="shipped" onClick={() => setSelectedStatus('shipped')}>
                Kargoda
              </TabsTrigger>
              <TabsTrigger value="completed" onClick={() => setSelectedStatus('completed')}>
                Tamamlandı
              </TabsTrigger>
              <TabsTrigger value="cancelled" onClick={() => setSelectedStatus('cancelled')}>
                İptal
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Arama */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sipariş no, müşteri veya e-posta ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Siparişler yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Tablo */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Ödeme</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'Arama kriterlerine uygun sipariş bulunamadı' : 'Henüz sipariş bulunmamaktadır'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer}</p>
                              <p className="text-sm text-muted-foreground">{order.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{order.date}</TableCell>
                          <TableCell>
                            {order.total.toLocaleString('tr-TR', { 
                              style: 'currency', 
                              currency: order.currency || 'TRY',
                              minimumFractionDigits: 2 
                            })}
                          </TableCell>
                          <TableCell>{order.payment}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Görüntüle
                                </DropdownMenuItem>
                                {order.status === 'paid' && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedOrder(order)
                                    setTrackingNumber('')
                                    setCargoCompany('aras')
                                    setIsCargoDialogOpen(true)
                                  }}>
                                    <Truck className="mr-2 h-4 w-4" />
                                    Kargo Girişi
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleUpdateStatusClick(order)}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Durumu Güncelle
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleCreateInvoice(order.id)}
                                  disabled={invoiceLoading === order.id}
                                >
                                  {invoiceLoading === order.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Receipt className="mr-2 h-4 w-4" />
                                  )}
                                  {invoiceLoading === order.id ? 'Fatura Oluşturuluyor...' : 'BizimHesap Fatura Oluştur'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTrackCargo(order.trackingNumber || '')}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Kargo Takibi
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => window.open(`/siparis-takibi/${order.id.replace('#', '')}`, '_blank')}
                                >
                                  <Navigation className="mr-2 h-4 w-4" />
                                  Sipariş Takibi (Müşteri Görünümü)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Sayfalama */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {filteredOrders.length} siparişten {filteredOrders.length} tanesi gösteriliyor
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  >
                    Önceki
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sipariş Detayları Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-none w-[70vw] h-[85vh] max-h-[85vh] overflow-y-auto p-6 rounded-lg border shadow-2xl min-w-[800px] min-h-[600px]">
          <DialogHeader>
            <DialogTitle>Sipariş Detayları</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Sipariş Bilgileri</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p><span className="font-medium">Sipariş No:</span> {selectedOrder.id}</p>
                    <p><span className="font-medium">Tarih:</span> {selectedOrder.date}</p>
                    <p><span className="font-medium">Toplam:</span> {selectedOrder.total.toLocaleString('tr-TR', { 
                      style: 'currency', 
                      currency: selectedOrder.currency || 'TRY',
                      minimumFractionDigits: 2 
                    })}</p>
                    <p><span className="font-medium">Ödeme:</span> {selectedOrder.payment}</p>
                    <p><span className="font-medium">Durum:</span> {getStatusText(selectedOrder.status)}</p>
                    <p><span className="font-medium">Kargo Şirketi:</span> {selectedOrder.cargoCompany || 'Belirtilmemiş'}</p>
                    <p><span className="font-medium">Kargo Takip No:</span> {selectedOrder.trackingNumber || 'Belirtilmemiş'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Müşteri:</span> {selectedOrder.customer}</p>
                    <p><span className="font-medium">E-posta:</span> {selectedOrder.email}</p>
                    <p><span className="font-medium">Telefon:</span> {selectedOrder.phone}</p>
                    {selectedOrder.shippingAddress && (
                      <>
                        <p><span className="font-medium">Adres:</span> {selectedOrder.shippingAddress.fullName}</p>
                        <p>{selectedOrder.shippingAddress.address}</p>
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.district} - {selectedOrder.shippingAddress.postalCode}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold">Sipariş Öğeleri</h3>
                  <Separator />
                  <div className="overflow-x-auto mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ürün</TableHead>
                          <TableHead>Adet</TableHead>
                          <TableHead>Fiyat</TableHead>
                          <TableHead>Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <SafeImage 
                                  src={item.image} 
                                  alt={item.name} 
                                  width={50} 
                                  height={50} 
                                  className="mr-3 rounded-md" 
                                />
                                <span>{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.price.toLocaleString('tr-TR', { 
                              style: 'currency', 
                              currency: selectedOrder.currency || 'TRY',
                              minimumFractionDigits: 2 
                            })}</TableCell>
                            <TableCell>{item.total.toLocaleString('tr-TR', { 
                              style: 'currency', 
                              currency: selectedOrder.currency || 'TRY',
                              minimumFractionDigits: 2 
                            })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold">Notlar</h3>
                <Separator />
                <p>{selectedOrder.notes || 'Yok'}</p>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Kapat
                </Button>
                <Button onClick={() => handleUpdateStatusClick(selectedOrder!)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Durumu Güncelle
                </Button>
                <Button onClick={() => {
                  setTrackingNumber(selectedOrder?.trackingNumber || '')
                  setCargoCompany(selectedOrder?.cargoCompany || '')
                  setIsCargoDialogOpen(true)
                }}>
                  <Truck className="mr-2 h-4 w-4" />
                  Kargo Bilgileri
                </Button>
                {selectedOrder?.trackingNumber && (
                  <Button variant="outline" onClick={() => handleTrackCargo(selectedOrder.trackingNumber!)}>
                    <Navigation className="mr-2 h-4 w-4" />
                    Kargo Takip
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Durum Güncelleme Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Durumunu Güncelle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Mevcut Durum: {selectedOrder && getStatusText(selectedOrder.status)}</label>
            </div>
            <div>
              <label className="text-sm font-medium">Yeni Durum:</label>
              <Select onValueChange={(value) => setNewStatus(value)} value={newStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sipariş durumunu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awaiting_payment">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Ödeme Bekliyor
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Beklemede
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Başarılı Sipariş - Kargolanacak
                    </div>
                  </SelectItem>
                  <SelectItem value="shipped">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Kargoda
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Teslim Edildi
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      İptal Edildi
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={() => handleUpdateStatus(selectedOrder?.id || '', newStatus)}>
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kargo Bilgileri Dialog */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgilerini Güncelle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Sipariş No: {selectedOrder?.id}</label>
            </div>
            <div>
              <label className="text-sm font-medium">Kargo Şirketi</label>
              <Select onValueChange={(value) => setCargoCompany(value)} value={cargoCompany || 'aras'}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Kargo şirketi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aras">Aras Kargo</SelectItem>
                  <SelectItem value="yurtici">Yurtiçi Kargo</SelectItem>
                  <SelectItem value="mng">MNG Kargo</SelectItem>
                  <SelectItem value="ptt">PTT Kargo</SelectItem>
                  <SelectItem value="surat">Sürat Kargo</SelectItem>
                  <SelectItem value="ups">UPS</SelectItem>
                  <SelectItem value="dhl">DHL</SelectItem>
                  <SelectItem value="fedex">FedEx</SelectItem>
                  <SelectItem value="sendeo">Sendeo</SelectItem>
                  <SelectItem value="hepsijet">HepsiJet</SelectItem>
                  <SelectItem value="trendyol">Trendyol Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Kargo Takip Numarası</label>
              <Input
                className="mt-2"
                placeholder="Örn: 123456789"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCargoDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={() => handleUpdateCargoInfo(selectedOrder?.id || '')}>
                <Truck className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 