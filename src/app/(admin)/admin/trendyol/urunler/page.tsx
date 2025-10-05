'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { 
  Loader2, 
  Download, 
  Search, 
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  MoreHorizontal,
  Filter,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Check,
  Plus,
  Settings,
  Info,
  ArrowRight
} from 'lucide-react'

interface TrendyolProduct {
  id: string
  barcode: string
  title: string
  productMainId: string
  brandId: number
  categoryId: number
  quantity: number
  stockCode: string
  dimensionalWeight: number
  description: string
  currencyType: string
  listPrice: number
  salePrice: number
  vatRate: number
  images: Array<{
    url: string
  }>
  attributes: Array<{
    attributeId: number
    attributeName: string
    attributeValue: string
  }>
  approved: boolean
  onSale: boolean
  archived: boolean
  rejected?: boolean
  blacklisted?: boolean
  productUrl?: string
  lastUpdateDate?: string
  creationDate?: string
  brand?: string
  categoryName?: string
  stockUnitType?: string
  platformListingId?: string
  stockId?: string
  hasActiveCampaign?: boolean
  locked?: boolean
  productContentId?: number
  pimCategoryId?: number
  version?: number
  color?: string
  size?: string
  lockedByUnSuppliedReason?: boolean
}

interface ImportSettings {
  updateExisting: boolean
  importImages: boolean
  importAttributes: boolean
  categoryMapping: 'auto' | 'manual'
  priceMultiplier: number
  stockMultiplier: number
}

export default function TrendyolUrunlerPage() {
  // Ana state'ler
  const [activeTab, setActiveTab] = useState('approved')
  const [currentStep, setCurrentStep] = useState<'fetch' | 'import'>('fetch')
  
  // Ürün çekme state'leri
  const [fetchedProducts, setFetchedProducts] = useState<TrendyolProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<TrendyolProduct[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [fetchProgress, setFetchProgress] = useState(0)
  const [lastFetchTime, setLastFetchTime] = useState<string>('')
  
  // Ürün seçme state'leri
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [matchFilter, setMatchFilter] = useState<string>('all') // 'all', 'matched', 'unmatched'
  const [sortBy, setSortBy] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Import state'leri
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  
  // Fetch ayarları
  const [fetchSize, setFetchSize] = useState<number>(200)
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    updateExisting: true,
    importImages: true,
    importAttributes: true,
    categoryMapping: 'auto',
    priceMultiplier: 1,
    stockMultiplier: 1
  })
  
  // İstatistik state'leri
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    archived: 0,
    active: 0,
    inactive: 0
  })

  useEffect(() => {
    filterAndSortProducts()
  }, [searchTerm, statusFilter, matchFilter, sortBy, sortOrder, fetchedProducts])

  useEffect(() => {
    calculateStats(filteredProducts)
  }, [filteredProducts])

  useEffect(() => {
    // Tab değiştiğinde seçimleri temizle
    setSelectedProducts(new Set())
    setSelectAll(false)
  }, [activeTab])

  /**
   * 1. AŞAMA: Trendyol'dan ürünleri çek
   */
  const fetchProductsFromTrendyol = async (bulkFetch = false) => {
    setIsFetching(true)
    setFetchProgress(0)
    
    try {
      let url = `/api/trendyol/fetch/products?status=${activeTab}&size=${bulkFetch ? fetchSize * 2 : fetchSize}`
      
      if (bulkFetch) {
        // Toplu çekme için POST kullan
        const response = await fetch('/api/trendyol/fetch/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: activeTab,
            maxPages: Math.ceil(2000 / fetchSize), // Max 2000 ürün
            pageSize: fetchSize
          })
        })
        
        const result = await response.json()
        
        if (result.success && result.data) {
          setFetchedProducts(result.data.items || [])
          setLastFetchTime(new Date().toLocaleString('tr-TR'))
          
          const matchStats = result.data.matchStats
          let message = `${result.data.items?.length || 0} ürün toplu olarak çekildi`
          if (matchStats) {
            message += ` - ${matchStats.matched} eşleşme, ${matchStats.unmatched} yeni ürün`
          }
          toast.success(message)
        } else {
          toast.error(result.error || 'Ürünler çekilemedi')
        }
      } else {
        // Tek sayfa çekme
        const response = await fetch(url)
        const result = await response.json()
        
        if (result.success && result.data) {
          setFetchedProducts(result.data.items || [])
          setLastFetchTime(new Date().toLocaleString('tr-TR'))
          
          const matchStats = result.data.matchStats
          let message = `${result.data.items?.length || 0} ürün çekildi`
          if (matchStats) {
            message += ` - ${matchStats.matched} eşleşme, ${matchStats.unmatched} yeni ürün`
          }
          toast.success(message)
        } else {
          toast.error(result.error || 'Ürünler çekilemedi')
        }
      }
      
      setFetchProgress(100)
    } catch (error) {
      console.error('Ürün çekme hatası:', error)
      toast.error('Ürün çekme sırasında hata oluştu')
    } finally {
      setIsFetching(false)
    }
  }

  /**
   * 2. AŞAMA: Seçilen ürünleri veritabanına aktar
   */
  const importSelectedProducts = async () => {
    const productsToImport = Array.from(selectedProducts)
      .map(barcode => fetchedProducts.find(p => p.barcode === barcode))
      .filter(Boolean)

    if (productsToImport.length === 0) {
      toast.error('Aktarılacak ürün seçin')
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const response = await fetch('/api/trendyol/import/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsToImport,
          importSettings: importSettings
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        
        // Başarılı aktarılanları seçimden çıkar
        const failedBarcodes = new Set(
          result.data.errors?.map((err: any) => err.barcode) || []
        )
        
        setSelectedProducts(prev => {
          const newSet = new Set<string>()
          prev.forEach(barcode => {
            if (failedBarcodes.has(barcode)) {
              newSet.add(barcode)
            }
          })
          return newSet
        })

        if (result.data.errors && result.data.errors.length > 0) {
          console.log('Import hataları:', result.data.errors)
        }
      } else {
        toast.error(result.error || 'Ürün aktarma başarısız')
      }
      
      setImportProgress(100)
    } catch (error) {
      console.error('Ürün aktarma hatası:', error)
      toast.error('Ürün aktarma sırasında hata oluştu')
    } finally {
      setIsImporting(false)
    }
  }

  const calculateStats = (productList: TrendyolProduct[]) => {
    const stats = productList.reduce((acc, product) => {
      acc.total += 1
      if (product.approved) {
        acc.approved += 1
      } else if (product.rejected) {
        // Reddedilen ürünler pending'e dahil değil
      } else {
        acc.pending += 1
      }
      if (product.archived) {
        acc.archived += 1
      }
      if (product.onSale) {
        acc.active += 1
      } else {
        acc.inactive += 1
      }
      return acc
    }, {
      total: 0,
      approved: 0,
      pending: 0,
      archived: 0,
      active: 0,
      inactive: 0
    })

    setStats(stats)
  }

  const filterAndSortProducts = () => {
    let filtered = fetchedProducts.filter(product => {
      const matchesSearch = 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.stockCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
      
      // Sekme bazlı filtreleme
      const matchesTab = 
        (activeTab === 'approved' && product.approved && product.onSale) ||
        (activeTab === 'inactive' && !product.onSale) ||
        (activeTab === 'archived' && product.archived)
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'approved' && product.approved) ||
        (statusFilter === 'pending' && !product.approved) ||
        (statusFilter === 'rejected' && product.rejected) ||
        (statusFilter === 'archived' && product.archived) ||
        (statusFilter === 'blacklisted' && product.blacklisted) ||
        (statusFilter === 'onSale' && product.onSale) ||
        (statusFilter === 'notOnSale' && !product.onSale)
      
      // Eşleştirme filtresi
      const matchesMatchFilter = 
        matchFilter === 'all' ||
        (matchFilter === 'matched' && (product as any).existsInSite) ||
        (matchFilter === 'unmatched' && !(product as any).existsInSite)
      
      return matchesSearch && matchesStatus && matchesTab && matchesMatchFilter
    })

    // Sıralama
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof TrendyolProduct]
      let bValue: any = b[sortBy as keyof TrendyolProduct]

      if (sortBy === 'title' || sortBy === 'stockCode') {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredProducts(filtered)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const allBarcodes = new Set(filteredProducts.map(p => p.barcode))
      setSelectedProducts(allBarcodes)
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (barcode: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(barcode)
    } else {
      newSelected.delete(barcode)
    }
    setSelectedProducts(newSelected)
    
    // Select all durumunu güncelle
    setSelectAll(newSelected.size === filteredProducts.length && filteredProducts.length > 0)
  }

  const getMatchBadge = (product: TrendyolProduct) => {
    const productWithMatch = product as any
    if (productWithMatch.existsInSite) {
      const matchType = productWithMatch.matchedBy || 'barcode'
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sitede Var
          </Badge>
          <Badge variant="outline" className="text-xs">
            {matchType === 'title' ? '📝 Ad ile' : '🏷️ Barkod ile'}
          </Badge>
        </div>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Sitede Yok
        </Badge>
      )
    }
  }

  const getStatusBadge = (product: TrendyolProduct) => {
    if (product.archived) {
      return (
        <Badge variant="secondary">
          <XCircle className="w-3 h-3 mr-1" />
          Arşiv
        </Badge>
      )
    } else if (product.rejected) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Red
        </Badge>
      )
    } else if (product.approved) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Onaylı
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Beklemede
        </Badge>
      )
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price / 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trendyol Ürün Yöneticisi</h1>
          <p className="text-muted-foreground">
            İki aşamalı sistem: Önce ürünleri çekin, sonra seçip aktarın
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {fetchedProducts.length} ürün çekildi
          </Badge>
          <Badge variant="outline" className="text-sm">
            {selectedProducts.size} seçili
          </Badge>
        </div>
      </div>

      {/* Adım Göstergesi */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                currentStep === 'fetch' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  currentStep === 'fetch' ? 'border-primary bg-primary text-white' : 
                  fetchedProducts.length > 0 ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                }`}>
                  {fetchedProducts.length > 0 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="font-medium">Ürün Çekme</span>
              </div>
              
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              
              <div className={`flex items-center space-x-2 ${
                currentStep === 'import' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  currentStep === 'import' ? 'border-primary bg-primary text-white' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="font-medium">Ürün Aktarma</span>
              </div>
            </div>
            
            {lastFetchTime && (
              <div className="text-sm text-muted-foreground">
                Son çekme: {lastFetchTime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Onaylı</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Beklemede</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Arşiv</p>
                <p className="text-2xl font-bold">{stats.archived}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pasif</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sekmeler */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="approved">Onaylı Ürünler</TabsTrigger>
            <TabsTrigger value="inactive">Pasif Ürünler</TabsTrigger>
            <TabsTrigger value="archived">Arşiv Ürünler</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Select value={fetchSize.toString()} onValueChange={(value) => setFetchSize(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 ürün</SelectItem>
                <SelectItem value="100">100 ürün</SelectItem>
                <SelectItem value="200">200 ürün</SelectItem>
                <SelectItem value="500">500 ürün</SelectItem>
                <SelectItem value="1000">1000 ürün</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => fetchProductsFromTrendyol(false)}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Ürün Çek ({fetchSize})
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => fetchProductsFromTrendyol(true)}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Toplu Çek (Max 2000)
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isFetching && (
          <div className="space-y-2">
            <Progress value={fetchProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Trendyol'dan ürünler çekiliyor...
            </p>
          </div>
        )}
      </Tabs>

      {/* Filtreler ve Arama */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="approved">Onaylı</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="rejected">Reddedilen</SelectItem>
                <SelectItem value="archived">Arşivlenmiş</SelectItem>
                <SelectItem value="onSale">Satışta</SelectItem>
                <SelectItem value="notOnSale">Satış Dışı</SelectItem>
              </SelectContent>
            </Select>

            <Select value={matchFilter} onValueChange={setMatchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Eşleştirme filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="matched">🟢 Sitede Var</SelectItem>
                <SelectItem value="unmatched">🔴 Sitede Yok</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Ürün Adı</SelectItem>
                <SelectItem value="salePrice">Fiyat</SelectItem>
                <SelectItem value="quantity">Stok</SelectItem>
                <SelectItem value="lastUpdateDate">Güncelleme</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
              <SelectTrigger>
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Artan</SelectItem>
                <SelectItem value="desc">Azalan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Seçim ve Aktarma Bölümü */}
      {fetchedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Ürün Seçimi ({filteredProducts.length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} ürün seçili
                </span>
                <Button
                  onClick={importSelectedProducts}
                  disabled={selectedProducts.size === 0 || isImporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Seçilenleri Aktar ({selectedProducts.size})
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Aktarmak istediğiniz ürünleri seçin ve "Seçilenleri Aktar" butonuna tıklayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            {isImporting && (
              <div className="space-y-2 mb-4">
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  Ürünler veritabanına aktarılıyor...
                </p>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchTerm || statusFilter !== 'all' || matchFilter !== 'all'
                    ? 'Arama kriterlerinize uygun ürün bulunamadı.' 
                    : 'Önce Trendyol\'dan ürün çekin.'
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Stok Kodu</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Eşleştirme</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.barcode}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.barcode)}
                            onCheckedChange={(checked) => 
                              handleSelectProduct(product.barcode, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {product.images?.[0]?.url ? (
                                <img 
                                  src={product.images[0].url} 
                                  alt={product.title}
                                  className="w-12 h-12 rounded object-cover border"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm leading-tight">
                                {product.title.substring(0, 60)}...
                              </h4>
                              <p className="text-xs text-muted-foreground">Barkod: {product.barcode}</p>
                              {product.brand && (
                                <p className="text-xs text-muted-foreground">Marka: {product.brand}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.stockCode}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatPrice(product.salePrice)}</div>
                            {product.listPrice !== product.salePrice && (
                              <div className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.listPrice)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            product.quantity === 0 ? 'text-destructive' : ''
                          }`}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getMatchBadge(product)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Detayları Görüntüle
                              </DropdownMenuItem>
                              {product.productUrl && (
                                <DropdownMenuItem 
                                  onClick={() => window.open(product.productUrl, '_blank')}
                                >
                                  <TrendingUp className="w-4 h-4 mr-2" />
                                  Trendyol'da Görüntüle
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* İmport Ayarları */}
      {selectedProducts.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Aktarma Ayarları</span>
            </CardTitle>
            <CardDescription>
              Ürünlerin nasıl aktarılacağını belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="updateExisting">Mevcut ürünleri güncelle</Label>
                  <Checkbox
                    id="updateExisting"
                    checked={importSettings.updateExisting}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({...prev, updateExisting: checked as boolean}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="importImages">Görsel linklerini aktar</Label>
                  <Checkbox
                    id="importImages"
                    checked={importSettings.importImages}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({...prev, importImages: checked as boolean}))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="importAttributes">Ürün özelliklerini aktar</Label>
                  <Checkbox
                    id="importAttributes"
                    checked={importSettings.importAttributes}
                    onCheckedChange={(checked) => 
                      setImportSettings(prev => ({...prev, importAttributes: checked as boolean}))
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="priceMultiplier">Fiyat çarpanı</Label>
                  <Input
                    id="priceMultiplier"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={importSettings.priceMultiplier}
                    onChange={(e) => 
                      setImportSettings(prev => ({
                        ...prev, 
                        priceMultiplier: parseFloat(e.target.value) || 1
                      }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stockMultiplier">Stok çarpanı</Label>
                  <Input
                    id="stockMultiplier"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={importSettings.stockMultiplier}
                    onChange={(e) => 
                      setImportSettings(prev => ({
                        ...prev, 
                        stockMultiplier: parseFloat(e.target.value) || 1
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bilgi */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Kullanım:</strong> Bu sayfa iki aşamalı çalışır:
          <br />
          <strong>1. Aşama:</strong> Size seçicisinden istediğiniz miktarı seçin (50-1000 ürün), sonra "Ürün Çek" veya "Toplu Çek" ile Trendyol'dan ürünleri getirin
          <br />
          <strong>2. Aşama:</strong> Çekilen ürünlerden istediğinizi seçip "Seçilenleri Aktar" ile veritabanınıza ekleyin
          <br />
          <strong>💡 İpucu:</strong> "Toplu Çek" ile maksimum 2000 ürün, birden fazla sayfa halinde çekilir
        </AlertDescription>
      </Alert>
    </div>
  )
}