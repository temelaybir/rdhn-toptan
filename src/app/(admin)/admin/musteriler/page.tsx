'use client'

import React from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Download,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  CreditCard,
  Package,
  Send,
  Edit,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

// Customer interfaces
interface CustomerOrder {
  id: string
  orderNumber: string
  date: string
  total: number
  status: string
  items: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  registrationDate: string
  lastOrder: string
  totalOrders: number
  totalSpent: number
  status: string
  avatar?: string | null
  address?: {
    fullName: string
    address: string
    city: string
    district: string
    postalCode: string
  }
  orders?: CustomerOrder[]
}

interface CustomerStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  totalRevenue: number
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
    totalRevenue: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: selectedStatus
      })

      const response = await fetch(`/api/admin/customers?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Müşteriler yüklenirken hata oluştu (${response.status})`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteriler alınamadı')
      }

      setCustomers(result.data.customers)
      setCustomerStats(result.data.stats)
      setTotalPages(result.data.pagination.totalPages)
    } catch (err: any) {
      console.error('Customers fetch error:', err)
      setError(err.message || 'Müşteriler yüklenirken hata oluştu')
      toast.error(err.message || 'Müşteriler yüklenirken hata oluştu')
      
      // Hata durumunda boş veri göster
      setCustomers([])
      setCustomerStats({
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0,
        totalRevenue: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch customers on component mount and when filters change
  useEffect(() => {
    fetchCustomers()
  }, [currentPage, searchTerm, selectedStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailDialogOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === updatedCustomer.id 
          ? updatedCustomer
          : customer
      )
    )
    toast.success('Müşteri bilgileri güncellendi')
    setIsEditDialogOpen(false)
  }

  const handleSendEmail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEmailSubject('')
    setEmailContent('')
    setIsEmailDialogOpen(true)
  }

  const handleSendEmailSubmit = () => {
    if (!emailSubject || !emailContent) {
      toast.error('Konu ve içerik alanları zorunludur')
      return
    }
    // Gerçek uygulamada e-posta gönderim işlemi
    toast.success(`${selectedCustomer?.name} adlı müşteriye e-posta gönderildi`)
    setIsEmailDialogOpen(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <UserCheck className="mr-1 h-3 w-3" />
            Aktif
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <UserX className="mr-1 h-3 w-3" />
            Pasif
          </Badge>
        )
      default:
        return <Badge>Bilinmiyor</Badge>
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const renderError = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground">
            Müşteri bilgilerini yönetin ve analiz edin
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
            <Button onClick={fetchCustomers} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (error) {
    return renderError()
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground">
            Müşteri bilgilerini ve alışveriş geçmişini yönetin
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Dışa Aktar
        </Button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {customerStats.active} aktif, {customerStats.inactive} pasif
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{customerStats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Tüm müşterilerden
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Yeni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Bu ay kayıt olan müşteri
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Müşteriler</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.active}</div>
            <p className="text-xs text-muted-foreground">
              Son 30 günde sipariş veren
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Müşteri Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Arama ve Filtreleme */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ad, e-posta veya telefon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Durum
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                  Tümü
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                  Aktif
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('inactive')}>
                  Pasif
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Müşteriler yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Tablo */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>İletişim</TableHead>
                      <TableHead>Kayıt Tarihi</TableHead>
                      <TableHead>Siparişler</TableHead>
                      <TableHead>Toplam Harcama</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'Arama kriterlerine uygun müşteri bulunamadı' : 'Henüz müşteri bulunmamaktadır'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer, index) => (
                        <TableRow key={`${customer.id}-${index}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={customer.avatar || ''} />
                                <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Son sipariş: {customer.lastOrder}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {customer.registrationDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-medium">{customer.totalOrders}</p>
                              <p className="text-xs text-muted-foreground">sipariş</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            ₺{customer.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewCustomerDetails(customer)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(customer)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  E-posta Gönder
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
                  {customers.length} müşteriden {customers.length} tanesi gösteriliyor
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

      {/* Müşteri Detayları Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-none w-[70vw] h-[85vh] max-h-[85vh] overflow-y-auto p-6 rounded-lg border shadow-2xl min-w-[800px] min-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedCustomer?.avatar || ''} />
                <AvatarFallback>
                  {selectedCustomer?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selectedCustomer?.name}
              {getStatusBadge(selectedCustomer?.status || '')}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Müşteri Bilgileri</TabsTrigger>
              <TabsTrigger value="orders">Sipariş Geçmişi</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer?.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Kayıt Tarihi: {selectedCustomer?.registrationDate}</span>
                    </div>
                  </CardContent>
                </Card>

                {selectedCustomer?.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Adres Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">{selectedCustomer.address.fullName}</p>
                          <p>{selectedCustomer.address.address}</p>
                          <p>{selectedCustomer.address.city}, {selectedCustomer.address.district}</p>
                          <p>{selectedCustomer.address.postalCode}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alışveriş İstatistikleri</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedCustomer?.totalOrders}</div>
                      <div className="text-sm text-muted-foreground">Toplam Sipariş</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ₺{selectedCustomer?.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">Toplam Harcama</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        ₺{selectedCustomer?.totalOrders ? (selectedCustomer.totalSpent / selectedCustomer.totalOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0.00'}
                      </div>
                      <div className="text-sm text-muted-foreground">Ortalama Sipariş</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sipariş Geçmişi</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCustomer?.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCustomer.orders.map((order, index) => (
                        <div key={`${order.id}-${index}`} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.date}</p>
                              <p className="text-sm">{order.items} ürün</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₺{order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                {order.status === 'completed' ? 'Tamamlandı' : 
                                 order.status === 'processing' ? 'Hazırlanıyor' : order.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="mx-auto h-12 w-12 mb-4" />
                      <p>Henüz sipariş bulunmuyor</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => handleSendEmail(selectedCustomer!)}>
              <Mail className="mr-2 h-4 w-4" />
              E-posta Gönder
            </Button>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Müşteri Düzenleme Dialog */}
      <CustomerEditDialog
        customer={selectedCustomer}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateCustomer}
      />

      {/* E-posta Gönder Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-posta Gönder</DialogTitle>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="emailSubject" className="block text-sm font-medium text-muted-foreground">
                Konu
              </label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="E-posta konusu"
              />
            </div>
            <div>
              <label htmlFor="emailContent" className="block text-sm font-medium text-muted-foreground">
                İçerik
              </label>
              <Textarea
                id="emailContent"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="E-posta içeriği"
                rows={10}
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end mt-4">
            <Button onClick={handleSendEmailSubmit}>Gönder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 

// Müşteri Düzenleme Dialog Component
interface CustomerEditDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (customer: Customer) => void
}

function CustomerEditDialog({ customer, open, onOpenChange, onSave }: CustomerEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    address: {
      fullName: '',
      address: '',
      city: '',
      district: '',
      postalCode: ''
    }
  })

  // Form'u customer verisiyle doldur
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        address: customer.address || {
          fullName: '',
          address: '',
          city: '',
          district: '',
          postalCode: ''
        }
      })
    }
  }, [customer])

  const handleSave = () => {
    if (!customer) return
    
    const updatedCustomer: Customer = {
      ...customer,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      address: formData.address
    }
    
    onSave(updatedCustomer)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[70vw] h-[85vh] max-h-[85vh] overflow-y-auto p-6 rounded-lg border shadow-2xl min-w-[800px] min-h-[600px]">
        <DialogHeader>
          <DialogTitle>Müşteri Bilgilerini Düzenle</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Kişisel Bilgiler</TabsTrigger>
            <TabsTrigger value="address">Adres Bilgileri</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="text-sm font-medium">E-posta</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="E-posta adresi"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Telefon numarası"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="address" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input
                  value={formData.address.fullName}
                  onChange={(e) => handleAddressChange('fullName', e.target.value)}
                  placeholder="Teslimat ad soyad"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Posta Kodu</label>
                <Input
                  value={formData.address.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="Posta kodu"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Adres</label>
                <Textarea
                  value={formData.address.address}
                  onChange={(e) => handleAddressChange('address', e.target.value)}
                  placeholder="Tam adres"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">İl</label>
                <Input
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="İl"
                />
              </div>
              <div>
                <label className="text-sm font-medium">İlçe</label>
                <Input
                  value={formData.address.district}
                  onChange={(e) => handleAddressChange('district', e.target.value)}
                  placeholder="İlçe"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 