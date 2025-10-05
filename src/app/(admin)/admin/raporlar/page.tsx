import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  LineChart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package
} from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground">
            Detaylı satış ve performans analizleri
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="thisMonth">
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tarih aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="yesterday">Dün</SelectItem>
              <SelectItem value="thisWeek">Bu Hafta</SelectItem>
              <SelectItem value="lastWeek">Geçen Hafta</SelectItem>
              <SelectItem value="thisMonth">Bu Ay</SelectItem>
              <SelectItem value="lastMonth">Geçen Ay</SelectItem>
              <SelectItem value="thisYear">Bu Yıl</SelectItem>
              <SelectItem value="custom">Özel Aralık</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Rapor İndir
          </Button>
        </div>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺127,450.00</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">+15.2%</span>
              <span className="ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sipariş Sayısı</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">+8.7%</span>
              <span className="ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Sepet</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺372.66</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
              <span className="text-red-600">-2.3%</span>
              <span className="ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Müşteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">+12.5%</span>
              <span className="ml-1">geçen aya göre</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Alanları */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Satış Trendi</TabsTrigger>
          <TabsTrigger value="products">En Çok Satanlar</TabsTrigger>
          <TabsTrigger value="categories">Kategori Performansı</TabsTrigger>
          <TabsTrigger value="customers">Müşteri Analizi</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aylık Satış Trendi</CardTitle>
              <CardDescription>Son 12 aylık satış performansı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Satış trend grafiği (Chart.js veya Recharts ile doldurulacak)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>En Çok Satan Ürünler</CardTitle>
                <CardDescription>Bu ay en çok satılan 10 ürün</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'iPhone 15 Pro', sales: 45, revenue: '₺2,474,955' },
                    { name: 'MacBook Air M2', sales: 32, revenue: '₺1,375,968' },
                    { name: 'Nike Air Max', sales: 78, revenue: '₺272,922' },
                    { name: 'Bluetooth Hoparlör', sales: 156, revenue: '₺140,244' },
                    { name: 'Kahve Makinesi', sales: 43, revenue: '₺124,657' },
                  ].map((product, i) => (
                    <div key={i} className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} adet satıldı</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stok Durumu</CardTitle>
                <CardDescription>Kritik stok seviyesindeki ürünler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Pamuklu T-Shirt', stock: 0, status: 'Stok Yok' },
                    { name: 'Yoga Matı', stock: 5, status: 'Kritik' },
                    { name: 'Sırt Çantası', stock: 0, status: 'Stok Yok' },
                    { name: 'Spor Ayakkabı', stock: 8, status: 'Düşük' },
                    { name: 'Akıllı Saat', stock: 3, status: 'Kritik' },
                  ].map((product, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Stok: {product.stock}</p>
                      </div>
                      <div className={`text-xs font-medium ${
                        product.status === 'Stok Yok' ? 'text-red-600' :
                        product.status === 'Kritik' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {product.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori Bazlı Satış Dağılımı</CardTitle>
              <CardDescription>Her kategorinin toplam satıştaki payı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Kategori dağılım grafiği (Chart.js veya Recharts ile doldurulacak)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Segmentasyonu</CardTitle>
                <CardDescription>Harcama bazlı müşteri grupları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">VIP Müşteriler</p>
                      <p className="text-xs text-muted-foreground">₺10,000+ harcama</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">23</p>
                      <p className="text-xs text-muted-foreground">%4.6</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sadık Müşteriler</p>
                      <p className="text-xs text-muted-foreground">₺5,000-10,000 harcama</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">87</p>
                      <p className="text-xs text-muted-foreground">%17.4</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Düzenli Müşteriler</p>
                      <p className="text-xs text-muted-foreground">₺1,000-5,000 harcama</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">245</p>
                      <p className="text-xs text-muted-foreground">%49</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Yeni Müşteriler</p>
                      <p className="text-xs text-muted-foreground">₺1,000 altı harcama</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">145</p>
                      <p className="text-xs text-muted-foreground">%29</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Müşteri Memnuniyeti</CardTitle>
                <CardDescription>Son 30 günlük değerlendirmeler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Ortalama Puan</p>
                      <p className="text-2xl font-bold">4.7</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>5 yıldız: 234 değerlendirme (%68)</p>
                      <p>4 yıldız: 87 değerlendirme (%25)</p>
                      <p>3 yıldız: 18 değerlendirme (%5)</p>
                      <p>2 yıldız: 5 değerlendirme (%1.5)</p>
                      <p>1 yıldız: 2 değerlendirme (%0.5)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 