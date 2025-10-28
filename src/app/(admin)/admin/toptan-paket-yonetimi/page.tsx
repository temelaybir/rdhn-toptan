'use client'

import { useState, useEffect } from 'react'
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
import { toast } from 'sonner'
import { getProducts } from '@/app/actions/admin/product-actions'
import type { Product } from '@/types/admin/product'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Package,
  Save,
  CheckCircle,
  Search,
  DollarSign,
  X,
  Pencil,
  Check,
  XCircle
} from 'lucide-react'

// Paket varyasyonları
const PACKAGE_OPTIONS = [
  { value: 10, label: '1 paket (10 adet)' },
  { value: 12, label: '1 paket (12 adet)' },
  { value: 15, label: '1 paket (15 adet)' },
  { value: 20, label: '1 paket (20 adet)' },
  { value: 24, label: '1 paket (24 adet)' },
  { value: 48, label: '1 paket (48 adet)' },
  { value: 50, label: '1 paket (50 adet)' },
]

interface ProductEdit {
  id: string
  packageQuantity: number | null
  price: number
  name?: string
  unitPrice?: number // Adet fiyatı (paket seçilmeden önceki fiyat)
}

export default function WholesalePackageManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [packageFilter, setPackageFilter] = useState<string>('all')
  const [isSaving, setIsSaving] = useState(false)
  
  // Düzenleme state'i - her ürün için ayrı
  const [edits, setEdits] = useState<Map<string, ProductEdit>>(new Map())
  
  // Ürün adı düzenleme state'i
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')

  // Verileri yükle
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const result = await getProducts({
        page: 1,
        pageSize: 1000, // Tüm ürünleri getir
        sortBy: 'name',
        sortOrder: 'asc'
      })
      
      if (result.success && result.data) {
        setProducts(result.data.products)
        
        // Mevcut değerleri edits'e koy
        const initialEdits = new Map<string, ProductEdit>()
        result.data.products.forEach((p: Product) => {
          // Eğer paketi varsa, birim fiyatı hesapla (mevcut fiyat / paket adedi)
          const unitPrice = p.packageQuantity && p.packageQuantity > 0 
            ? p.price / p.packageQuantity 
            : p.price
          
          initialEdits.set(p.id, {
            id: p.id,
            packageQuantity: p.packageQuantity || null,
            price: p.price,
            unitPrice: unitPrice,
            name: p.name
          })
        })
        setEdits(initialEdits)
      } else {
        toast.error(result.error || 'Ürünler yüklenemedi')
      }
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu')
      console.error('Load products error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    // Arama filtresi
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    // Kategori filtresi
    if (categoryFilter !== 'all' && product.categoryId !== categoryFilter) {
      return false
    }
    
    // Paket filtresi
    if (packageFilter !== 'all') {
      if (packageFilter === 'with_package') {
        return product.packageQuantity !== null && product.packageQuantity > 0
      } else if (packageFilter === 'without_package') {
        return !product.packageQuantity || product.packageQuantity === 0
      }
    }
    
    return true
  })

  // Tüm ürünleri seç/kaldır
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  // Tekil ürün seçimi
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  // Paket adedi değiştir
  const updatePackageQuantity = (productId: string, quantity: number | null) => {
    const newEdits = new Map(edits)
    const product = products.find(p => p.id === productId)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: null, 
      price: product?.price || 0,
      unitPrice: product?.price || 0,
      name: product?.name || ''
    }
    
    // Paket seçildiğinde fiyatı otomatik hesapla (birim fiyat x paket adedi)
    const newPrice = quantity && quantity > 0 && currentEdit.unitPrice
      ? currentEdit.unitPrice * quantity
      : currentEdit.unitPrice || 0
    
    newEdits.set(productId, { 
      ...currentEdit, 
      packageQuantity: quantity,
      price: newPrice
    })
    setEdits(newEdits)
  }

  // Birim fiyat değiştir (adet fiyatı)
  const updateUnitPrice = (productId: string, unitPrice: number) => {
    const newEdits = new Map(edits)
    const product = products.find(p => p.id === productId)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: product?.packageQuantity || null, 
      price: 0,
      unitPrice: 0,
      name: product?.name || ''
    }
    
    // Paket varsa otomatik olarak paket fiyatını hesapla
    const newPrice = currentEdit.packageQuantity && currentEdit.packageQuantity > 0
      ? unitPrice * currentEdit.packageQuantity
      : unitPrice
    
    newEdits.set(productId, { 
      ...currentEdit, 
      unitPrice,
      price: newPrice
    })
    setEdits(newEdits)
  }

  // Ürün adı düzenlemeye başla
  const startEditingName = (productId: string, currentName: string) => {
    setEditingProductId(productId)
    setEditingName(currentName)
  }

  // Ürün adı düzenlemeyi iptal et
  const cancelEditingName = () => {
    setEditingProductId(null)
    setEditingName('')
  }

  // Ürün adını kaydet
  const saveProductName = (productId: string) => {
    if (!editingName.trim()) {
      toast.error('Ürün adı boş olamaz')
      return
    }

    const newEdits = new Map(edits)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: products.find(p => p.id === productId)?.packageQuantity || null, 
      price: products.find(p => p.id === productId)?.price || 0
    }
    newEdits.set(productId, { ...currentEdit, name: editingName.trim() })
    setEdits(newEdits)
    setEditingProductId(null)
    setEditingName('')
  }

  // Toplu paket adedi atama
  const bulkAssignPackage = async (quantity: number) => {
    if (selectedProducts.size === 0) {
      toast.error('Lütfen önce ürün seçin')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/products/bulk-package-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
          packageQuantity: quantity,
          packageUnit: 'adet'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        await loadProducts()
        setSelectedProducts(new Set())
      } else {
        toast.error(result.error || 'Güncelleme başarısız')
      }
    } catch (error) {
      toast.error('Güncelleme sırasında hata oluştu')
      console.error('Bulk package update error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Değişiklikleri kaydet
  const saveChanges = async () => {
    // Değişen ürünleri bul
    const changedProducts = Array.from(edits.values()).filter(edit => {
      const original = products.find(p => p.id === edit.id)
      if (!original) return false
      return (
        original.price !== edit.price ||
        (original.packageQuantity || null) !== edit.packageQuantity ||
        (edit.name && original.name !== edit.name)
      )
    })

    if (changedProducts.length === 0) {
      toast.info('Değişiklik yapılmadı')
      return
    }

    try {
      setIsSaving(true)
      
      // Fiyat güncellemeleri
      const priceUpdates = changedProducts
        .filter(p => {
          const original = products.find(prod => prod.id === p.id)
          return original && original.price !== p.price
        })
        .map(p => ({ id: p.id, price: p.price }))

      // İsim güncellemeleri
      const nameUpdates = changedProducts
        .filter(p => {
          const original = products.find(prod => prod.id === p.id)
          return original && p.name && original.name !== p.name
        })
        .map(p => ({ id: p.id, name: p.name }))

      // Paket güncellemeleri
      const packageUpdates = changedProducts.filter(p => {
        const original = products.find(prod => prod.id === p.id)
        return original && (original.packageQuantity || null) !== p.packageQuantity
      })

      const promises = []

      // Fiyat güncellemeleri
      if (priceUpdates.length > 0) {
        promises.push(
          fetch('/api/admin/products/bulk-price-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: priceUpdates })
          })
        )
      }

      // İsim güncellemeleri
      if (nameUpdates.length > 0) {
        promises.push(
          fetch('/api/admin/products/bulk-name-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: nameUpdates })
          })
        )
      }

      // Her paket güncellemesi için ayrı istek
      packageUpdates.forEach(update => {
        promises.push(
          fetch('/api/admin/products/bulk-package-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [update.id],
              packageQuantity: update.packageQuantity,
              packageUnit: 'adet'
            })
          })
        )
      })

      const results = await Promise.all(promises)
      
      // Her response'u kontrol et
      let allSuccess = true
      for (const response of results) {
        if (!response.ok) {
          allSuccess = false
          console.error('Response not ok:', response.status, response.statusText)
          continue
        }
        
        try {
          const data = await response.json()
          if (!data.success) {
            allSuccess = false
            console.error('API error:', data.error)
          }
        } catch (error) {
          allSuccess = false
          console.error('JSON parse error:', error)
        }
      }

      if (allSuccess) {
        toast.success(`${changedProducts.length} ürün güncellendi`)
        await loadProducts()
      } else {
        toast.warning('Bazı güncellemeler başarısız oldu')
        await loadProducts()
      }
    } catch (error) {
      toast.error('Güncelleme sırasında hata oluştu')
      console.error('Save changes error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Değişiklik var mı?
  const hasChanges = Array.from(edits.values()).some(edit => {
    const original = products.find(p => p.id === edit.id)
    if (!original) return false
    return (
      original.price !== edit.price ||
      (original.packageQuantity || null) !== edit.packageQuantity ||
      (edit.name && original.name !== edit.name)
    )
  })

  // Kategori listesi (unique)
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Toptan Paket Yönetimi</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Birim fiyat (adet fiyatı) girin, paket seçtiğinizde otomatik olarak toplam fiyat hesaplanır
          </p>
          <p className="text-xs text-blue-600 mt-1">
            💡 Örnek: Adet fiyatı 45₺ → 12&apos;li paket seçildiğinde → Otomatik 540₺ olur
          </p>
        </div>
        {hasChanges && (
          <Button onClick={saveChanges} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        )}
      </div>

      {/* Filtreler ve Toplu İşlemler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler ve Toplu İşlemler</CardTitle>
          <CardDescription>
            {selectedProducts.size > 0 && (
              <span className="text-primary font-medium">
                {selectedProducts.size} ürün seçili
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtreler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Paket Durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ürünler</SelectItem>
                <SelectItem value="with_package">Paketi Olan</SelectItem>
                <SelectItem value="without_package">Paketi Olmayan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map((cat, index) => (
                  <SelectItem key={`${cat?.id}-${index}`} value={cat?.id || ''}>
                    {cat?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toplu İşlem Butonları */}
          {selectedProducts.size > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium flex items-center">
                Seçili {selectedProducts.size} ürüne paket ata:
              </span>
              {PACKAGE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => bulkAssignPackage(option.value)}
                  disabled={isSaving}
                >
                  <Package className="h-4 w-4 mr-1" />
                  {option.value} adet
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProducts(new Set())}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Seçimi Temizle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ürün Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>
            Ürün Listesi ({filteredProducts.length})
          </CardTitle>
          <CardDescription>
            Önce birim fiyat (adet başı) girin, sonra paket seçin. Toplam fiyat otomatik hesaplanır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="w-[200px]">Paket Adedi</TableHead>
                  <TableHead className="w-[150px]">Birim Fiyat (₺/adet)</TableHead>
                  <TableHead className="w-[150px]">Toplam Fiyat (₺)</TableHead>
                  <TableHead className="w-[100px] text-center">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Filtreye uygun ürün bulunamadı
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, index) => {
                    const edit = edits.get(product.id)
                    const hasChange = 
                      edit?.price !== product.price || 
                      (edit?.packageQuantity || null) !== (product.packageQuantity || null) ||
                      (edit?.name && edit.name !== product.name)

                    return (
                      <TableRow key={`${product.id}-${index}`} className={hasChange ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            {editingProductId === product.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="h-8"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveProductName(product.id)
                                    } else if (e.key === 'Escape') {
                                      cancelEditingName()
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveProductName(product.id)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEditingName}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <p className="font-medium flex-1">
                                  {edit?.name || product.name}
                                  {edit?.packageQuantity && edit.packageQuantity > 0 && (
                                    <span className="ml-2 text-blue-600 font-semibold">
                                      ({edit.packageQuantity}&apos;li paket)
                                    </span>
                                  )}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditingName(product.id, edit?.name || product.name)}
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            {product.sku && (
                              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="outline">{product.category.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={edit?.packageQuantity?.toString() || 'none'}
                            onValueChange={(value) => 
                              updatePackageQuantity(product.id, value === 'none' ? null : parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Paket Yok</SelectItem>
                              {PACKAGE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={edit?.unitPrice || 0}
                              onChange={(e) => updateUnitPrice(product.id, parseFloat(e.target.value) || 0)}
                              className="w-full"
                              placeholder="Adet fiyatı"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="font-semibold text-green-600">
                              {edit?.price ? `₺${edit.price.toFixed(2)}` : '₺0.00'}
                            </div>
                            {edit?.packageQuantity && edit.packageQuantity > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({edit.packageQuantity} paket)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasChange ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Değişti
                            </Badge>
                          ) : product.packageQuantity ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Alt Bilgi */}
          {filteredProducts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Toplam {filteredProducts.length} ürün görüntüleniyor
              {hasChanges && (
                <span className="ml-2 text-yellow-600 font-medium">
                  • Kaydedilmemiş değişiklikler var
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



