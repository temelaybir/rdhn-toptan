'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Package, 
  MapPin, 
  Plus,
  Edit,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  ShoppingBag,
  LogOut,
  Eye
} from 'lucide-react'
import { Customer, CustomerAddress, getCustomerOrders, getCustomerAddresses, updateCustomerProfile } from '@/services/customer-auth-service'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    // Session storage'dan müşteri bilgilerini al
    const customerData = sessionStorage.getItem('customer')
    
    if (!customerData) {
      // Giriş yapmamışsa login sayfasına yönlendir
      router.push('/auth/login')
      return
    }

    try {
      const parsedCustomer = JSON.parse(customerData) as Customer
      setCustomer(parsedCustomer)
      setEditForm({
        first_name: parsedCustomer.first_name || '',
        last_name: parsedCustomer.last_name || '',
        phone: parsedCustomer.phone || ''
      })
      
      loadCustomerData(parsedCustomer.id)
    } catch (error) {
      console.error('Invalid customer data:', error)
      router.push('/auth/login')
    }
  }

  const loadCustomerData = async (customerId: string) => {
    setIsLoading(true)
    
    try {
      // Siparişleri ve adresleri paralel olarak yükle
      const [ordersData, addressesData] = await Promise.all([
        getCustomerOrders(customerId),
        getCustomerAddresses(customerId)
      ])
      
      setOrders(ordersData)
      setAddresses(addressesData)
    } catch (error) {
      console.error('Error loading customer data:', error)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!customer) return
    
    try {
      const updatedCustomer = await updateCustomerProfile(customer.id, {
        first_name: editForm.first_name.trim() || null,
        last_name: editForm.last_name.trim() || null,
        phone: editForm.phone.trim() || null
      })
      
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
        sessionStorage.setItem('customer', JSON.stringify(updatedCustomer))
        setIsEditing(false)
        toast.success('Profil bilgileriniz güncellendi')
      } else {
        toast.error('Profil güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Profil güncellenirken hata oluştu')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('customer')
    toast.success('Başarıyla çıkış yaptınız')
    router.push('/')
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Beklemede'
      case 'paid': return 'Ödeme Alındı'
      case 'confirmed': return 'Onaylandı'
      case 'shipped': return 'Kargoda'
      case 'delivered': return 'Teslim Edildi'
      case 'cancelled': return 'İptal Edildi'
      case 'awaiting_payment': return 'Ödeme Bekliyor'
      default: return 'Bilinmiyor'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Profil bilgileriniz yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hoş geldiniz, {customer.first_name || customer.email}
              </h1>
              <p className="text-gray-600">Hesap bilgilerinizi yönetin</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                  <p className="text-2xl font-bold text-gray-900">{customer.total_orders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Harcama</p>
                  <p className="text-2xl font-bold text-gray-900">{(customer.total_spent || 0).toFixed(2)} TL</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Üyelik Tarihi</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Siparişlerim ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adreslerim ({addresses.length})
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profil Bilgileri</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? 'İptal' : 'Düzenle'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">Ad</Label>
                        <Input
                          id="first_name"
                          value={editForm.first_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="Adınız"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Soyad</Label>
                        <Input
                          id="last_name"
                          value={editForm.last_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Soyadınız"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Telefon numaranız"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleUpdateProfile}>
                        Kaydet
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">E-mail</p>
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Ad Soyad</p>
                        <p className="font-medium">
                          {customer.first_name || customer.last_name 
                            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                            : 'Belirtilmemiş'
                          }
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Telefon</p>
                        <p className="font-medium">{customer.phone || 'Belirtilmemiş'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Henüz hiç siparişiniz yok</p>
                    <Button className="mt-4" onClick={() => router.push('/')}>
                      Alışverişe Başla
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                            <p className="text-lg font-bold mt-1">
                              {(order.total_amount || 0).toFixed(2)} TL
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {order.order_items?.length || 0} ürün
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/siparis-takibi/${order.order_number}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detayları Gör
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Adreslerim</CardTitle>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Adres
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Henüz hiç adresiniz yok</p>
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      İlk Adresinizi Ekleyin
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{address.title}</h4>
                              {address.is_default && (
                                <Badge variant="secondary" className="text-xs">
                                  Varsayılan
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{address.contact_name}</p>
                            <p className="text-sm text-gray-600">{address.address}</p>
                            <p className="text-sm text-gray-600">
                              {address.district} / {address.city}
                            </p>
                            {address.phone && (
                              <p className="text-sm text-gray-600">{address.phone}</p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 