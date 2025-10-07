'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

import { 
  CheckCircle,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Timer,
  Clock,
  RefreshCw,
  ShoppingBag,
  ChefHat,
  Bike,
  User,
  LogIn,
  Mail,
  Home,
  XCircle,
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { CargoInfo, CargoStatus } from '@/types/cargo'
import { getProductImageByCategory } from '@/lib/utils/category-images'
import { Customer } from '@/services/customer-auth-service'

interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

interface Order {
  orderNumber: string
  status: string
  date: Date
  total: number
  items: OrderItem[]
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    district: string
    phone: string
  }
  paymentMethod: string
  cardLastFour: string
  trackingNumber: string
  cargoCompany: string
}

const orderStatuses = [
  { key: 'awaiting_payment', label: 'Ödeme Bekleniyor', icon: Clock, description: 'Havale/EFT ödemesi bekleniyor' },
  { key: 'pending', label: 'Sipariş Alındı', icon: ShoppingBag, description: 'Siparişiniz onaylandı' },
  { key: 'processing', label: 'Hazırlanıyor', icon: ChefHat, description: 'Siparişiniz hazırlanıyor' },
  { key: 'shipped', label: 'Yolda', icon: Bike, description: 'Kargo yolda' },
  { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle, description: 'Siparişiniz teslim edildi' },
  { key: 'cancelled', label: 'İptal Edildi', icon: XCircle, description: 'Siparişiniz iptal edilmiştir' }
]

const DEMO_MODE = false

// Tahmini teslimat süreleri (saat cinsinden)
const estimatedDeliveryHours = {
  awaiting_payment: 24,  // 24 saat (ödeme bekleniyor)
  pending: 96,      // 4 gün (sipariş alındı)
  processing: 72,   // 3 gün (hazırlanıyor)
  shipped: 48,      // 2 gün (kargoya verildi)
  delivered: 0      // Teslim edildi
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Query parameter veya URL path'inden sipariş numarasını al
  const orderNumberFromUrl = params.orderNumber as string
  const orderNumberFromQuery = searchParams.get('orderNumber')
  const orderNumber = orderNumberFromQuery || orderNumberFromUrl
  
  // Eğer query parameter ile gelindiyse, URL'i düzenle
  useEffect(() => {
    if (orderNumberFromQuery && !orderNumberFromUrl) {
      // Query parameter ile gelindi, URL'i path parametresine dönüştür
      router.replace(`/siparis-takibi/${orderNumberFromQuery}`)
    }
  }, [orderNumberFromQuery, orderNumberFromUrl, router])
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [cargoInfo, setCargoInfo] = useState<CargoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStatus, setCurrentStatus] = useState('pending')
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [refreshingCargo, setRefreshingCargo] = useState(false)
  
  // Customer entegrasyonu
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isCustomerOrder, setIsCustomerOrder] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Customer authentication check
  useEffect(() => {
    const customerData = sessionStorage.getItem('customer')
    if (customerData) {
      try {
        const parsedCustomer = JSON.parse(customerData) as Customer
        setCustomer(parsedCustomer)
      } catch (error) {
        console.error('Invalid customer data:', error)
      }
    }
  }, [])

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        // Gerçek API'den sipariş verilerini çek
        const response = await fetch(`/api/orders?orderNumber=${orderNumber}`)
        const result = await response.json()

        if (result.success && result.data) {
          const orderData = result.data
          
          // API verisini component'in beklediği formata dönüştür
          const transformedOrder: Order = {
            orderNumber: orderData.order_number || orderData.id,
            status: mapOrderStatus(orderData.status, orderData.payment_status),
            date: new Date(orderData.created_at),
            total: orderData.total_amount,
            items: orderData.order_items?.map((item: any) => ({
              id: item.id,
              name: item.product_snapshot?.name || item.products?.name || 'Ürün',
              price: item.price,
              quantity: item.quantity,
              image: item.product_snapshot?.image || item.products?.images?.[0] || getProductImageByCategory('elektronik')
            })) || [],
            shippingAddress: {
              fullName: orderData.shipping_address?.fullName || 'Müşteri',
              addressLine1: orderData.shipping_address?.addressLine1 || orderData.shipping_address?.address || 'Adres',
              addressLine2: orderData.shipping_address?.addressLine2,
              city: orderData.shipping_address?.city || 'İstanbul',
              district: orderData.shipping_address?.district || 'Merkez',
              phone: orderData.phone || orderData.shipping_address?.phone || '+90 555 000 0000'
            },
            paymentMethod: getPaymentMethodLabel(orderData.payment_status),
            cardLastFour: 'XXXX', // Bu bilgi güvenlik açısından API'de olmayabilir
            trackingNumber: orderData.tracking_number || orderData.kargo_takipno || orderData.kargo_barcode || null,
            cargoCompany: orderData.cargo_company || orderData.kargo_firma || 'Aras Kargo'
          }

          setOrder(transformedOrder)
          setCurrentStatus(transformedOrder.status)
          setEstimatedTime(estimatedDeliveryHours[transformedOrder.status as keyof typeof estimatedDeliveryHours] || 0)
          
          // Customer ownership check
          if (customer && orderData.email) {
            const isOwner = customer.email.toLowerCase() === orderData.email.toLowerCase()
            setIsCustomerOrder(isOwner)
            if (!isOwner) {
              setShowLoginPrompt(true)
            }
          } else if (!customer) {
            setShowLoginPrompt(true)
          }
        } else {
          // Sipariş bulunamadıysa order'ı null bırak
          setOrder(null)
        }
      } catch (error) {
        console.error('Order fetch error:', error)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderNumber])

  // Order status mapping function
  const mapOrderStatus = (status: string, paymentStatus: string): string => {
    // Banka havalesi siparişleri için özel durum
    if (paymentStatus === 'awaiting_payment') return 'awaiting_payment'
    
    if (paymentStatus === 'paid' && status === 'processing') return 'processing'
    if (status === 'shipped') return 'shipped'
    if (status === 'delivered') return 'delivered'
    if (status === 'cancelled') return 'cancelled'
    if (status === 'confirmed') return 'pending'
    return 'pending'
  }

  // Payment method label function
  const getPaymentMethodLabel = (paymentStatus: string): string => {
    if (paymentStatus === 'awaiting_payment') return 'Banka Havalesi'
    return 'Kredi Kartı'
  }

  const mapCargoStatusToOrderStatus = (cargoStatus: CargoStatus): string => {
    switch (cargoStatus) {
      case CargoStatus.CREATED:
      case CargoStatus.PICKED_UP: return 'processing'
      case CargoStatus.IN_TRANSIT:
      case CargoStatus.IN_DISTRIBUTION: return 'shipped'
      case CargoStatus.DELIVERED: return 'delivered'
      default: return 'pending'
    }
  }

  useEffect(() => {
    async function fetchCargoInfo() {
      if (!order?.trackingNumber) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        
        // Gerçek Aras Kargo API'sinden kargo bilgisi çek
        const response = await fetch('/api/cargo/tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trackingNumber: order.trackingNumber,
            company: order.cargoCompany?.toLowerCase() || 'aras'
          })
        })

        const result = await response.json()

        if (result.success && result.data) {
          const cargoData = result.data
          
          // API'den gelen veriyi component formatına dönüştür
          const cargoInfo: CargoInfo = {
            trackingNumber: order.trackingNumber,
            company: 'ARAS' as any,
            recipientName: order.shippingAddress.fullName,
            recipientPhone: order.shippingAddress.phone,
            senderName: 'Ardahan Ticaret',
            currentStatus: cargoData.currentStatus || 'IN_TRANSIT' as any,
            estimatedDeliveryDate: cargoData.estimatedDeliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            movements: cargoData.movements || []
          }
          
          setCargoInfo(cargoInfo)
          
          // Kargo durumuna göre sipariş durumunu güncelle
          if (cargoData.currentStatus) {
            const newStatus = mapCargoStatusToOrderStatus(cargoData.currentStatus)
            setCurrentStatus(newStatus)
            
            // Kargo hareketlerine göre daha akıllı tahmini süre hesaplama
            if (cargoData.estimatedDeliveryDate) {
              const deliveryDate = new Date(cargoData.estimatedDeliveryDate)
              const now = new Date()
              const hoursUntilDelivery = Math.max(0, Math.ceil((deliveryDate.getTime() - now.getTime()) / (60 * 60 * 1000)))
              setEstimatedTime(hoursUntilDelivery)
            } else {
              // Fallback: Varsayılan süreleri kullan
              setEstimatedTime(estimatedDeliveryHours[newStatus as keyof typeof estimatedDeliveryHours] || 0)
            }
          }
        } else {
          // API'den veri gelmezse veya kargo henüz sisteme girilmemişse boş bırak
          setCargoInfo(null)
          console.log('Kargo takip bilgisi bulunamadı:', result.error || 'Henüz kargoya verilmemiş olabilir')
        }
      } catch (error) {
        console.error('Kargo bilgisi alınamadı:', error)
        // Hata durumunda boş bırak, kullanıcıya hata gösterme
        setCargoInfo(null)
      } finally {
        setIsLoading(false)
      }
    }
    if (order) {
      fetchCargoInfo()
      const interval = setInterval(fetchCargoInfo, 30000)
      return () => clearInterval(interval)
    }
  }, [order])

  useEffect(() => {
    if (currentStatus === 'delivered' || currentStatus === 'cancelled' || !DEMO_MODE) return
    const timer = setInterval(() => {
      setEstimatedTime(prev => {
        if (prev <= 1) {
          const currentIndex = orderStatuses.findIndex(s => s.key === currentStatus)
          if (currentIndex < orderStatuses.length - 2) { // cancelled'ı atla
            const nextStatus = orderStatuses.filter(s => s.key !== 'cancelled')[currentIndex + 1]?.key
            if (nextStatus) {
              setCurrentStatus(nextStatus)
              return estimatedDeliveryHours[nextStatus as keyof typeof estimatedDeliveryHours] || 0
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [currentStatus])

  const currentStatusIndex = useMemo(() => orderStatuses.findIndex(s => s.key === currentStatus), [currentStatus])
  const progressPercentage = useMemo(() => {
    if (currentStatus === 'cancelled') return 0 // İptal edilen siparişler için progress yok
    return ((currentStatusIndex + 1) / (orderStatuses.length - 1)) * 100 // cancelled'ı sayma
  }, [currentStatusIndex, currentStatus])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded animate-pulse mb-4 w-1/2" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sipariş Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              <span className="font-mono">{orderNumber}</span> numaralı sipariş bulunamadı.
            </p>
            <Button asChild>
              <Link href="/profil">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Siparişlerime Dön
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sipariş Takibi</h1>
          <p className="text-muted-foreground">Sipariş No: <span className="font-medium">{orderNumber}</span></p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/profil"><ArrowLeft className="h-4 w-4 mr-2" />Siparişlerime Dön</Link>
        </Button>
      </div>
      
      {/* Customer Login Prompt */}
      {showLoginPrompt && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <User className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {customer && !isCustomerOrder 
                    ? 'Bu sipariş size ait değil' 
                    : 'Hesabınıza giriş yapın'
                  }
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  {customer && !isCustomerOrder 
                    ? 'Bu siparişi takip etmek için doğru hesabınızla giriş yapmanız gerekiyor.' 
                    : 'Tüm siparişlerinizi görüntülemek ve hesabınızı yönetmek için giriş yapın.'
                  }
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => router.push('/auth/login')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Giriş Yap
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLoginPrompt(false)}
                    size="sm"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Info (if logged in and owns order) */}
      {customer && isCustomerOrder && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  Hoş geldiniz, {customer.first_name || customer.email}
                </p>
                <p className="text-sm text-green-700">
                  Bu sipariş size aittir • {customer.total_orders} toplam sipariş
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {currentStatus === 'cancelled' ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 mb-1">Sipariş Durumu</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-red-700">İptal Edildi</p>
                    </div>
                    <p className="text-sm text-red-600 mt-2">Siparişiniz iptal edilmiştir. Ödeme iadesi 3-5 iş günü içinde hesabınıza yansıyacaktır.</p>
                  </div>
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
              </CardContent>
            </Card>
          ) : currentStatus !== 'delivered' && (
            <Card className="border-primary">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tahmini Teslimat Süresi</p>
                    <div className="flex items-baseline gap-2">
                      {estimatedTime > 24 ? (
                        <>
                          <p className="text-4xl font-bold text-primary">{Math.ceil(estimatedTime / 24)}</p>
                          <span className="text-lg text-muted-foreground">gün</span>
                        </>
                      ) : estimatedTime > 0 ? (
                        <>
                          <p className="text-4xl font-bold text-primary">{estimatedTime}</p>
                          <span className="text-lg text-muted-foreground">saat</span>
                        </>
                      ) : (
                        <>
                          <p className="text-4xl font-bold text-green-600">Teslim Edildi</p>
                        </>
                      )}
                    </div>
                  </div>
                  <Timer className="h-12 w-12 text-primary animate-pulse" />
                </div>
                <Progress value={progressPercentage} className="mt-4 h-2" />
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader><CardTitle>Sipariş Durumu</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(currentStatus === 'cancelled' 
                  ? [orderStatuses[0], orderStatuses[4]] // Sadece "Sipariş Alındı" ve "İptal Edildi"
                  : orderStatuses.filter(s => s.key !== 'cancelled') // Normal akış, cancelled hariç
                ).map((status, index, filteredStatuses) => {
                  const Icon = status.icon
                  const isActive = currentStatus === 'cancelled' 
                    ? (status.key === 'pending' || status.key === 'cancelled')
                    : index <= currentStatusIndex
                  const isCurrent = status.key === currentStatus
                  return (
                    <div key={status.key} className="relative">
                      {index < filteredStatuses.length - 1 && (
                        <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                          currentStatus === 'cancelled' && status.key === 'pending' 
                            ? 'bg-red-300' 
                            : isActive && !isCurrent 
                              ? 'bg-primary' 
                              : 'bg-muted'
                        }`} />
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          currentStatus === 'cancelled' && status.key === 'cancelled'
                            ? 'bg-red-500 text-white'
                            : isActive 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            currentStatus === 'cancelled' && status.key === 'cancelled'
                              ? 'text-red-700'
                              : isActive 
                                ? '' 
                                : 'text-muted-foreground'
                          }`}>{status.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{status.description}</p>
                          {isCurrent && status.key !== 'cancelled' && index < filteredStatuses.length - 1 && (
                            <Badge className="mt-2" variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />Şu an burada
                            </Badge>
                          )}
                        </div>
                        {isActive && <CheckCircle className="h-5 w-5 text-primary mt-0.5" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          
          {currentStatus === 'shipped' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Kargo Durumu</CardTitle>
                  <Badge variant="secondary">
                    <Truck className="h-3 w-3 mr-1" />
                    Yolda
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Son Konum</p>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress.city} Dağıtım Merkezi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Tahmini Teslimat</p>
                      <p className="text-sm text-muted-foreground">
                        {estimatedTime <= 24 ? (
                          estimatedTime <= 8 ? (
                            'Bugün 16:00 - 18:00 arası'
                          ) : (
                            'Yarın 09:00 - 18:00 arası'
                          )
                        ) : (
                          `${Math.ceil(estimatedTime / 24)} gün içinde`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(cargoInfo && cargoInfo.movements.length > 0) || isLoading || (order && order.trackingNumber) ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Kargo Hareketleri</CardTitle>
                  {cargoInfo?.trackingNumber && (
                    <Badge variant="outline">
                      Takip No: {cargoInfo.trackingNumber}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 bg-muted rounded animate-pulse w-16" />
                          <div className="h-3 bg-muted rounded animate-pulse w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : cargoInfo && cargoInfo.movements.length > 0 ? (
                  <div className="space-y-4">
                    {cargoInfo.movements.map((movement, index) => (
                    <div key={movement.id} className="relative">
                      {index < cargoInfo.movements.length - 1 && (
                        <div className="absolute left-4 top-10 w-0.5 h-full bg-gradient-to-b from-primary to-muted" />
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          index === 0 
                            ? 'bg-primary text-primary-foreground shadow-md animate-pulse' 
                            : index === cargoInfo.movements.length - 1 
                              ? 'bg-blue-500 text-white shadow-md' 
                              : 'bg-green-500 text-white'
                        }`}>
                          {index === 0 ? (
                            <Truck className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className={`font-medium ${index === 0 ? 'text-primary' : ''}`}>
                                {movement.description}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {movement.location}
                              </p>
                              {index === 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  Son Güncelleme
                                </Badge>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p className="font-medium">{movement.date}</p>
                              <p>{movement.time}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-3">
                      <Truck className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-muted-foreground">Kargo Bilgisi Henüz Yok</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order?.trackingNumber 
                            ? 'Takip numaranız sisteme henüz kaydedilmemiş. Kargo şirketinin güncellemesini bekleyin.'
                            : 'Siparişiniz henüz kargoya verilmemiş. Hazırlandıktan sonra kargo bilgileri burada görünecek.'
                          }
                        </p>
                        {order?.trackingNumber && (
                          <div className="mt-3">
                            <Badge variant="outline" className="text-xs">
                              Takip No: {order.trackingNumber}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4" 
                  onClick={() => {
                    setRefreshingCargo(true)
                    setTimeout(() => setRefreshingCargo(false), 1000)
                    // Kargo bilgilerini yeniden çek
                    if (order) {
                      setTimeout(() => {
                        const interval = setInterval(() => {
                          // fetchCargoInfo fonksiyonunu çağır
                          setIsLoading(true)
                          setTimeout(() => setIsLoading(false), Math.random() * 1000 + 500)
                        }, 100)
                        setTimeout(() => clearInterval(interval), 100)
                      }, 100)
                    }
                  }} 
                  disabled={refreshingCargo}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshingCargo ? 'animate-spin' : ''}`} />
                  {refreshingCargo ? 'Güncelleniyor...' : 'Kargo Durumunu Güncelle'}
                </Button>
              </CardContent>
            </Card>
          ) : null}

        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Sipariş Özeti</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                    <span className="font-medium">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4" />
              <div className="flex justify-between">
                <span className="font-medium">Toplam</span>
                <span className="font-bold text-lg">{order.total.toLocaleString('tr-TR')} ₺</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" />Teslimat Adresi</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}</p>
                <p className="text-muted-foreground">{order.shippingAddress.district} / {order.shippingAddress.city}</p>
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Sipariş Bilgileri</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sipariş Tarihi</span>
                <span className="font-medium">{new Date(order.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ödeme Yöntemi</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Sorun mu yaşıyorsunuz?</p>
              <Button variant="outline" className="w-full">Yardım Merkezi</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 