'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { SafeImage } from '@/components/ui/safe-image'
import { getProducts, deleteProduct } from '@/app/actions/admin/product-actions'
import { getCategories } from '@/app/actions/admin/category-actions'
import { bulkFixProductImages, validateProductImages } from '@/app/actions/admin/bulk-image-update'
import type { Product, ProductFilters } from '@/types/admin/product'
import { ProductForm } from '@/components/admin/products/product-form'
import { ProductExportDialog } from '@/components/admin/products/product-export-dialog'
import { EnhancedProductImportDialog } from '@/components/admin/products/enhanced-product-import-dialog'
import { BulkEditDialog } from '@/components/admin/products/bulk-edit-dialog'
import { useActionHandler } from '@/hooks/use-action-handler'
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Package,
  Eye,
  Copy,
  Download,
  Upload,
  DollarSign,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false)
  const [isBulkImageFixDialogOpen, setIsBulkImageFixDialogOpen] = useState(false)
  const [isBulkImageFixing, setIsBulkImageFixing] = useState(false)
  const formatPrice = (price: number) => `₺${price.toFixed(2)}`
  const { execute: executeDelete } = useActionHandler({
    successMessage: 'Ürün başarıyla silindi',
    onSuccess: () => loadData()
  })
  
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: undefined,
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 100
  })
  
  const [totalCount, setTotalCount] = useState(0)

  // İstatistikler
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0
  })  // Verileri yükle
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [productsResult, categoriesResult] = await Promise.all([
        getProducts(filters),
        getCategories()
      ])
      
      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data.products)
        setTotalCount(productsResult.data.total)
        
        // Backend'den gelen istatistikleri kullan
        if (productsResult.data.stats) {
          setStats({
            totalProducts: productsResult.data.stats.totalProducts,
            activeProducts: productsResult.data.stats.activeProducts,
            outOfStock: productsResult.data.stats.outOfStock,
            lowStock: productsResult.data.stats.lowStock,
            totalValue: productsResult.data.stats.totalValue
          })
        }
      } else {
        toast.error(productsResult.error || 'Ürünler yüklenemedi')
      }
      
      if (categoriesResult.success && categoriesResult.data) {
        console.log('📂 Kategoriler yüklendi:', categoriesResult.data.length, categoriesResult.data.map(c => ({ id: c.id, name: c.name })))
        setCategories(categoriesResult.data)
      } else {
        console.error('❌ Kategori hatası:', categoriesResult.error)
        toast.error(categoriesResult.error || 'Kategoriler yüklenemedi')
      }
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Filtreler değiştiğinde verileri yeniden yükle
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Filtre değişikliklerinde (page hariç) sayfayı 1'e resetle
  const prevFiltersRef = useRef({ search: filters.search, categoryId: filters.categoryId, status: filters.status, sortBy: filters.sortBy, sortOrder: filters.sortOrder })
  
  useEffect(() => {
    const prev = prevFiltersRef.current
    const hasFilterChanged = 
      prev.search !== filters.search ||
      prev.categoryId !== filters.categoryId ||
      prev.status !== filters.status ||
      prev.sortBy !== filters.sortBy ||
      prev.sortOrder !== filters.sortOrder
    
    if (hasFilterChanged && filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }))
    }
    
    prevFiltersRef.current = { search: filters.search, categoryId: filters.categoryId, status: filters.status, sortBy: filters.sortBy, sortOrder: filters.sortOrder }
  }, [filters.search, filters.categoryId, filters.status, filters.sortBy, filters.sortOrder, filters.page])

  // Stats artık backend'den geliyor (loadData içinde set ediliyor)

  // Ürün işlemleri
  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setIsFormDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsFormDialogOpen(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    await executeDelete(deleteProduct(product.id))
  }

  const confirmDelete = () => {
    if (productToDelete) {
      handleDeleteProduct(productToDelete)
      setProductToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false)
    setSelectedProduct(null)
    loadData()
  }

  const handleFormError = (error: string) => {
    toast.error(error)
  }

  // Toplu işlemler
  const toggleSelectAll = () => {
    if (selectedProducts.size === displayedProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(displayedProducts.map(p => p.id)))
    }
  }

  const toggleProductSelection = (productId: number) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return
    setIsBulkEditDialogOpen(true)
  }

  // Toplu görsel düzeltme
  const handleBulkImageFix = async () => {
    setIsBulkImageFixing(true)
    try {
      const result = await bulkFixProductImages()
      
      if (result.success) {
        toast.success(`${result.updatedCount} ürünün görseli düzeltildi`)
        // Sayfayı yenile
        await loadData()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Bulk image fix error:', error)
      toast.error('Görsel düzeltme sırasında hata oluştu')
    } finally {
      setIsBulkImageFixing(false)
      setIsBulkImageFixDialogOpen(false)
    }
  }

  // Durum badge'i
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      : <Badge variant="secondary">Pasif</Badge>
  }

  // Backend'den zaten filtrelenmiş ve sıralanmış veri geldiği için
  // frontend'de tekrar filtrelemeye ve sıralamaya gerek yok
  const displayedProducts = products
  
  // Pagination
  const totalPages = Math.ceil(totalCount / (filters.pageSize || 100))
  const currentPage = filters.page || 1
  
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ürünler</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ürün kataloğunuzu yönetin ve düzenleyin
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)} size="sm" className="sm:size-default">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} size="sm" className="sm:size-default">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">İçe Aktar</span>
          </Button>
          <Button onClick={handleCreateProduct} size="sm" className="sm:size-default">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Yeni Ürün</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Ürün
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktif Ürünler
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stok Yok
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Düşük Stok
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreleme ve Arama */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
          <CardDescription>
            {selectedProducts.size > 0 && (
              <span className="text-primary">
                {selectedProducts.size} ürün seçili
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtre Toolbar */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.categoryId ? filters.categoryId.toString() : 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value === 'all' ? undefined : Number(value) }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as ProductFilters['status'] }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="outofstock">Stok Yok</SelectItem>
                  <SelectItem value="lowstock">Düşük Stok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  setFilters(prev => ({ ...prev, sortBy: sortBy as ProductFilters['sortBy'], sortOrder: sortOrder as ProductFilters['sortOrder'] }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sıralama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">En Yeni</SelectItem>
                  <SelectItem value="createdAt-asc">En Eski</SelectItem>
                  <SelectItem value="name-asc">Ada Göre (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Ada Göre (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Fiyat (Düşük-Yüksek)</SelectItem>
                  <SelectItem value="price-desc">Fiyat (Yüksek-Düşük)</SelectItem>
                  <SelectItem value="stockQuantity-asc">Stok (Az-Çok)</SelectItem>
                  <SelectItem value="stockQuantity-desc">Stok (Çok-Az)</SelectItem>
                </SelectContent>
              </Select>
            </div>            {selectedProducts.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} ürün seçili
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkEditDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Toplu Düzenle</span>
                  <span className="sm:hidden">Düzenle</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Toplu Sil</span>
                  <span className="sm:hidden">Sil</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkImageFixDialogOpen(true)}
                  className="text-blue-600 hover:text-blue-700 hidden md:flex"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Görselleri Düzelt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                >
                  <X className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Seçimi Temizle</span>
                  <span className="sm:hidden">Temizle</span>
                </Button>
              </div>
            )}
          </div>          {/* Ürün Tablosu */}
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] sticky left-0 bg-background z-10">
                    <Checkbox
                      checked={selectedProducts.size === displayedProducts.length && displayedProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[80px] hidden sm:table-cell">Görsel</TableHead>
                  <TableHead className="min-w-[200px]">Ürün</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Fiyat</TableHead>
                  <TableHead className="text-center whitespace-nowrap hidden lg:table-cell">Stok</TableHead>
                  <TableHead className="hidden md:table-cell">Durum</TableHead>
                  <TableHead className="text-right sticky right-0 bg-background z-10 w-[100px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : displayedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {filters.search || filters.categoryId || filters.status !== 'all' 
                          ? 'Arama kriterlerine uygun ürün bulunamadı' 
                          : 'Henüz ürün eklenmemiş'}
                      </p>
                      {!filters.search && !filters.categoryId && filters.status === 'all' && (
                        <Button onClick={handleCreateProduct}>
                          <Plus className="mr-2 h-4 w-4" /> İlk Ürünü Ekle
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : displayedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="sticky left-0 bg-background z-10">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="relative w-16 h-16">
                        <SafeImage
                          src={product.images?.[0]?.url || '/placeholder-product.svg'}
                          alt={product.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="font-medium truncate">{product.name}</p>
                        {product.shortDescription && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.shortDescription}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.category ? (
                        <Badge variant="outline" className="whitespace-nowrap">{product.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div>
                        <p className="font-medium">{formatPrice(product.price)}</p>
                        {product.comparePrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.comparePrice)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <div className="flex flex-col items-center">
                        <span className={`font-medium ${
                          product.stockQuantity === 0 ? 'text-red-600' : 
                          product.stockQuantity <= 10 ? 'text-yellow-600' : ''
                        }`}>
                          {product.stockQuantity}
                        </span>
                        {product.variants && product.variants.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            +{product.variants.length} varyant
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{getStatusBadge(product.isActive)}</TableCell>
                    <TableCell className="text-right sticky right-0 bg-background z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/urunler/${product.slug}`, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Kopyalama özelliği yakında eklenecek')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Kopyala
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            İstatistikler
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setProductToDelete(product)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <p className="text-sm text-muted-foreground">
              Toplam {totalCount} üründen {((currentPage - 1) * (filters.pageSize || 100)) + 1}-{Math.min(currentPage * (filters.pageSize || 100), totalCount)} arası gösteriliyor
              {(filters.search || filters.categoryId || filters.status !== 'all') && ' (filtrelenmiş)'}
            </p>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                
                <div className="flex gap-1">
                  {/* İlk sayfa */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(1)}
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2 py-1">...</span>}
                    </>
                  )}
                  
                  {/* Önceki sayfalar */}
                  {currentPage > 1 && currentPage - 1 >= 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      {currentPage - 1}
                    </Button>
                  )}
                  
                  {/* Mevcut sayfa */}
                  <Button
                    variant="default"
                    size="sm"
                  >
                    {currentPage}
                  </Button>
                  
                  {/* Sonraki sayfalar */}
                  {currentPage < totalPages && currentPage + 1 <= totalPages && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      {currentPage + 1}
                    </Button>
                  )}
                  
                  {/* Son sayfa */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="px-2 py-1">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ürün Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-none w-[80vw] h-[85vh] max-h-[85vh] overflow-y-auto p-6 rounded-lg border shadow-2xl min-w-[1200px] min-h-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormDialogOpen(false)}
            onError={handleFormError}
          />
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete?.name} ürünü silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <ProductExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        categories={categories}
      />

      {/* Enhanced Import Dialog */}
      <EnhancedProductImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={loadData}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
        selectedProductIds={Array.from(selectedProducts)}
        selectedProductsCount={selectedProducts.size}
        categories={categories}
        onSuccess={loadData}
      />

      {/* Bulk Image Fix Dialog */}
      <AlertDialog open={isBulkImageFixDialogOpen} onOpenChange={setIsBulkImageFixDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toplu Görsel Düzeltme</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem tüm aktif ürünlerin görsel sorunlarını düzeltecek:
              <br />
              <br />
              • Boş veya geçersiz görsellere placeholder eklenecek
              <br />
              • Bozuk URL'ler temizlenecek  
              <br />
              • Problem olan URL pattern'ları düzeltilecek
              <br />
              <br />
              Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkImageFixing}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkImageFix}
              disabled={isBulkImageFixing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBulkImageFixing ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                  Düzeltiliyor...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Düzelt
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}