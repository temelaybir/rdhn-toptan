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
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'

// Paket varyasyonları
const PACKAGE_OPTIONS = [
  { value: 3, label: '1 paket (3 adet)' },
  { value: 5, label: '1 paket (5 adet)' },
  { value: 10, label: '1 paket (10 adet)' },
  { value: 12, label: '1 paket (12 adet)' },
  { value: 15, label: '1 paket (15 adet)' },
  { value: 18, label: '1 paket (18 adet)' },
  { value: 20, label: '1 paket (20 adet)' },
  { value: 24, label: '1 paket (24 adet)' },
  { value: 30, label: '1 paket (30 adet)' },
  { value: 48, label: '1 paket (48 adet)' },
  { value: 50, label: '1 paket (50 adet)' },
]

interface ProductEdit {
  id: string
  packageQuantity: number | null
  price: number
  name?: string
  unitPrice?: number // Adet fiyatı (paket seçilmeden önceki fiyat)
  moq?: number | null // Minimum sipariş miktarı
  moqUnit?: 'piece' | 'package' | 'koli' | null // Minimum sipariş birimi
  hasMoq?: boolean // Minimum paket gerekli mi?
}

export default function WholesalePackageManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [packageFilter, setPackageFilter] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false) // Pasif ürünleri göster/gizle
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
          let unitPrice: number
          let packageQty: number
          let displayPrice: number
          
          if (p.packageQuantity && p.packageQuantity > 0) {
            // Paket varsa: birim fiyat = toplam fiyat / paket adedi
            packageQty = p.packageQuantity
            unitPrice = p.price / p.packageQuantity
            displayPrice = p.price // Paket fiyatı = mevcut fiyat
          } else {
            // Paket yok ise: mevcut fiyat birim fiyatıdır
            // Ancak önceki kod hatası nedeniyle veritabanında birim fiyat × 3 kaydedilmiş olabilir
            // Bu durumu kontrol etmek için: eğer fiyat 3'ün katı gibi görünüyorsa ve birim fiyat olarak kaydedilmişse
            // Ama genel mantık: paket yok ise mevcut fiyat = birim fiyat
            packageQty = 3
            unitPrice = p.price // Mevcut fiyat birim fiyattır (1 adet fiyatı)
            displayPrice = p.price * 3 // Toplam fiyat = birim fiyat × 3
          }
          
          initialEdits.set(p.id, {
            id: p.id,
            packageQuantity: packageQty,
            price: displayPrice, // Görüntüleme için toplam fiyat
            unitPrice: unitPrice, // Birim fiyat (adet başı)
            name: p.name,
            moq: p.moq || null,
            moqUnit: p.moqUnit || null,
            hasMoq: (p.moq && p.moq > 0) || false
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
    // Aktif/Pasif filtresi - varsayılan olarak sadece aktif ürünler gösterilir
    if (!showInactive && !product.isActive) {
      return false
    }
    
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
  const updatePackageQuantity = (productId: string, quantity: number) => {
    const newEdits = new Map(edits)
    const product = products.find(p => p.id === productId)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: 3, // Varsayılan 3 adet
      price: product?.price || 0,
      unitPrice: product?.price || 0, // Paket yok ise mevcut fiyat birim fiyattır
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
      packageQuantity: product?.packageQuantity || 3, // Varsayılan 3 adet
      price: 0,
      unitPrice: 0,
      name: product?.name || ''
    }
    
    // Paket varsa otomatik olarak paket fiyatını hesapla
    const newPrice = currentEdit.packageQuantity && currentEdit.packageQuantity > 0
      ? unitPrice * currentEdit.packageQuantity
      : unitPrice * 3 // Paket yok ise varsayılan 3 adet için hesapla
    
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

  // Ürün aktif/pasif durumunu değiştir
  const toggleProductStatus = async (productId: string | number, currentStatus: boolean) => {
    try {
      setIsSaving(true)
      const productIdNum = typeof productId === 'string' ? parseInt(productId) : productId
      const response = await fetch('/api/admin/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [productIdNum],
          isActive: !currentStatus
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Ürün ${!currentStatus ? 'aktif' : 'pasif'} edildi`)
        await loadProducts()
      } else {
        toast.error(result.error || 'Durum güncellenemedi')
      }
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu')
      console.error('Toggle product status error:', error)
    } finally {
      setIsSaving(false)
    }
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

  // Minimum paket gerekli mi? toggle
  const toggleHasMoq = (productId: string) => {
    const newEdits = new Map(edits)
    const product = products.find(p => p.id === productId)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: product?.packageQuantity || 3,
      price: product?.price || 0,
      unitPrice: product?.price || 0,
      name: product?.name || '',
      moq: product?.moq || null,
      moqUnit: product?.moqUnit || null,
      hasMoq: false
    }
    
    const newHasMoq = !currentEdit.hasMoq
    newEdits.set(productId, { 
      ...currentEdit, 
      hasMoq: newHasMoq,
      moq: newHasMoq ? (currentEdit.moq || 1) : null,
      moqUnit: newHasMoq ? (currentEdit.moqUnit || 'package') : null
    })
    setEdits(newEdits)
  }

  // Minimum paket adedi güncelle
  const updateMoq = (productId: string, moq: number | null) => {
    const newEdits = new Map(edits)
    const product = products.find(p => p.id === productId)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: product?.packageQuantity || 3,
      price: product?.price || 0,
      unitPrice: product?.price || 0,
      name: product?.name || '',
      moq: product?.moq || null,
      moqUnit: product?.moqUnit || null,
      hasMoq: false
    }
    
    newEdits.set(productId, { 
      ...currentEdit, 
      moq: moq,
      hasMoq: moq !== null && moq > 0
    })
    setEdits(newEdits)
  }

  // Minimum paket birimi güncelle
  const updateMoqUnit = (productId: string, moqUnit: 'piece' | 'package' | 'koli' | null) => {
    const newEdits = new Map(edits)
    const product = products.find(p => p.id === productId)
    const currentEdit = newEdits.get(productId) || { 
      id: productId, 
      packageQuantity: product?.packageQuantity || 3,
      price: product?.price || 0,
      unitPrice: product?.price || 0,
      name: product?.name || '',
      moq: product?.moq || null,
      moqUnit: product?.moqUnit || null,
      hasMoq: false
    }
    
    newEdits.set(productId, { 
      ...currentEdit, 
      moqUnit: moqUnit
    })
    setEdits(newEdits)
  }

  // Tek bir ürünü güncelle
  const updateSingleProduct = async (productId: string) => {
    const edit = edits.get(productId)
    if (!edit) {
      toast.error('Ürün bulunamadı')
      return
    }

    const product = products.find(p => p.id === productId)
    if (!product) {
      toast.error('Ürün bulunamadı')
      return
    }

    try {
      setIsSaving(true)
      
      const promises = []

      // Paket yok olan ürünler için birim fiyatı kontrol et
      const isPackageLess = !edit.packageQuantity || edit.packageQuantity === 0 || edit.packageQuantity === 3
      const priceChanged = isPackageLess
        ? product.price !== (edit.unitPrice || product.price)
        : product.price !== (edit.unitPrice && edit.packageQuantity ? edit.unitPrice * edit.packageQuantity : edit.price)
      
      const packageChanged = (product.packageQuantity || 3) !== (edit.packageQuantity || 3)
      const nameChanged = edit.name && edit.name !== product.name
      const moqChanged = (product.moq || null) !== (edit.moq || null) || (product.moqUnit || null) !== (edit.moqUnit || null)

      // Fiyat güncelleme
      if (priceChanged) {
        const priceToSave = isPackageLess 
          ? (edit.unitPrice || edit.price)
          : (edit.unitPrice && edit.packageQuantity ? edit.unitPrice * edit.packageQuantity : edit.price)
        
        promises.push(
          fetch('/api/admin/products/bulk-price-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: [{ id: productId, price: priceToSave }] })
          })
        )
      }

      // İsim güncelleme
      if (nameChanged && edit.name) {
        promises.push(
          fetch('/api/admin/products/bulk-name-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: [{ id: productId, name: edit.name }] })
          })
        )
      }

      // Paket güncelleme
      if (packageChanged) {
        const packageQty = edit.packageQuantity || 3
        promises.push(
          fetch('/api/admin/products/bulk-package-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [productId],
              packageQuantity: packageQty === 3 && !product.packageQuantity ? null : packageQty,
              packageUnit: 'adet'
            })
          })
        )
      }

      // MOQ güncelleme
      if (moqChanged) {
        promises.push(
          fetch('/api/admin/products/bulk-moq-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [productId],
              moq: edit.moq || null,
              moqUnit: edit.moqUnit || null
            })
          })
        )
      }

      if (promises.length === 0) {
        toast.info('Değişiklik yapılmadı')
        return
      }

      const results = await Promise.all(promises)
      
      let allSuccess = true
      for (const response of results) {
        if (!response.ok) {
          allSuccess = false
          continue
        }
        
        try {
          const data = await response.json()
          if (!data.success) {
            allSuccess = false
          }
        } catch (error) {
          allSuccess = false
        }
      }

      if (allSuccess) {
        toast.success('Ürün güncellendi')
        await loadProducts()
      } else {
        toast.error('Güncelleme başarısız')
      }
    } catch (error) {
      toast.error('Güncelleme sırasında hata oluştu')
      console.error('Update single product error:', error)
    } finally {
      setIsSaving(false)
    }
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
      // Paket yok olan ürünler için 3 adet olarak karşılaştır
      const originalPackageQty = original.packageQuantity || 3
      const editPackageQty = edit.packageQuantity || 3
      
      // Paket yok olan ürünler için birim fiyatı kontrol et
      const isPackageLess = !edit.packageQuantity || edit.packageQuantity === 0 || edit.packageQuantity === 3
      const priceChanged = isPackageLess
        ? original.price !== (edit.unitPrice || original.price)
        : original.price !== (edit.unitPrice && edit.packageQuantity ? edit.unitPrice * edit.packageQuantity : edit.price)
      
      return (
        priceChanged ||
        originalPackageQty !== editPackageQty ||
        (edit.name && original.name !== edit.name)
      )
    })

    if (changedProducts.length === 0) {
      toast.info('Değişiklik yapılmadı')
      return
    }

    try {
      setIsSaving(true)
      
      // Fiyat güncellemeleri - Paket yok olan ürünler için birim fiyatı, paketli ürünler için toplam fiyatı kaydet
      const priceUpdates = changedProducts
        .filter(p => {
          const original = products.find(prod => prod.id === p.id)
          if (!original) return false
          
          // Paket yok olan ürünler için birim fiyatı kontrol et
          const isPackageLess = !p.packageQuantity || p.packageQuantity === 0 || p.packageQuantity === 3
          if (isPackageLess) {
            // Birim fiyat değişmiş mi kontrol et
            return original.price !== (p.unitPrice || original.price)
          } else {
            // Paketli ürün: toplam fiyatı kontrol et
            const editTotalPrice = p.unitPrice && p.packageQuantity ? p.unitPrice * p.packageQuantity : p.price
            return original.price !== editTotalPrice
          }
        })
        .map(p => {
          // Paket yok olan ürünler için birim fiyatı kaydet, paketli ürünler için toplam fiyatı kaydet
          const isPackageLess = !p.packageQuantity || p.packageQuantity === 0 || p.packageQuantity === 3
          const priceToSave = isPackageLess 
            ? (p.unitPrice || p.price) // Paket yok: birim fiyatı kaydet
            : (p.unitPrice && p.packageQuantity ? p.unitPrice * p.packageQuantity : p.price) // Paketli: toplam fiyatı kaydet
          return { id: p.id, price: priceToSave }
        })

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
        // Paket yok olan ürünler için 3 adet olarak karşılaştır
        const originalPackageQty = original?.packageQuantity || 3
        const newPackageQty = p.packageQuantity || 3
        return original && originalPackageQty !== newPackageQty
      })

      // MOQ güncellemeleri
      const moqUpdates = changedProducts.filter(p => {
        const original = products.find(prod => prod.id === p.id)
        if (!original) return false
        return (original.moq || null) !== (p.moq || null) || (original.moqUnit || null) !== (p.moqUnit || null)
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
        // Paket yok olan ürünler için 3 adet olarak kaydet
        const packageQty = update.packageQuantity || 3
        promises.push(
          fetch('/api/admin/products/bulk-package-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [update.id],
              packageQuantity: packageQty === 3 && !products.find(p => p.id === update.id)?.packageQuantity ? null : packageQty,
              packageUnit: 'adet'
            })
          })
        )
      })

      // MOQ güncellemeleri
      moqUpdates.forEach(update => {
        promises.push(
          fetch('/api/admin/products/bulk-moq-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [update.id],
              moq: update.moq || null,
              moqUnit: update.moqUnit || null
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
    // Paket yok olan ürünler için 3 adet olarak karşılaştır
    const originalPackageQty = original.packageQuantity || 3
    const editPackageQty = edit.packageQuantity || 3
    
    // Paket yok olan ürünler için birim fiyatı kontrol et
    const isPackageLess = !edit.packageQuantity || edit.packageQuantity === 0 || edit.packageQuantity === 3
    const priceChanged = isPackageLess
      ? original.price !== (edit.unitPrice || original.price)
      : original.price !== (edit.unitPrice && edit.packageQuantity ? edit.unitPrice * edit.packageQuantity : edit.price)
    
    const moqChanged = (original.moq || null) !== (edit.moq || null) || (original.moqUnit || null) !== (edit.moqUnit || null)
    
    return (
      priceChanged ||
      originalPackageQty !== editPackageQty ||
      (edit.name && original.name !== edit.name) ||
      moqChanged
    )
  })

  // Kategori listesi (unique)
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtreler ve Toplu İşlemler</CardTitle>
              <CardDescription>
                {selectedProducts.size > 0 && (
                  <span className="text-primary font-medium">
                    {selectedProducts.size} ürün seçili
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant={showInactive ? "default" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
              className="ml-auto"
            >
              {showInactive ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Pasif Ürünleri Gizle
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Pasif Ürünleri Göster
                </>
              )}
            </Button>
          </div>
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
          <div className="rounded-md border overflow-x-auto max-w-full">
            <div className="min-w-[1200px]">
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
                  <TableHead className="w-[150px]">Min. Paket</TableHead>
                  <TableHead className="w-[120px] text-center">Durum</TableHead>
                  <TableHead className="w-[120px] text-center">Aktif/Pasif</TableHead>
                  <TableHead className="w-[100px] text-center">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Filtreye uygun ürün bulunamadı
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, index) => {
                    const edit = edits.get(product.id)
                    // Paket yok olan ürünler için 3 adet olarak karşılaştır
                    const originalPackageQty = product.packageQuantity || 3
                    const editPackageQty = edit?.packageQuantity || 3
                    
                    // Paket yok olan ürünler için birim fiyatı kontrol et
                    const isPackageLess = !edit?.packageQuantity || edit.packageQuantity === 0 || edit.packageQuantity === 3
                    const priceChanged = isPackageLess
                      ? product.price !== (edit?.unitPrice || product.price)
                      : product.price !== (edit?.unitPrice && edit?.packageQuantity ? edit.unitPrice * edit.packageQuantity : edit?.price || product.price)
                    
                    const moqChanged = (product.moq || null) !== (edit?.moq || null) || (product.moqUnit || null) !== (edit?.moqUnit || null)
                    
                    const hasChange = 
                      priceChanged || 
                      originalPackageQty !== editPackageQty ||
                      (edit?.name && edit.name !== product.name) ||
                      moqChanged

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
                                  {edit?.packageQuantity && (
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
                            value={edit?.packageQuantity?.toString() || '3'}
                            onValueChange={(value) => 
                              updatePackageQuantity(product.id, parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
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
                              {edit?.unitPrice && edit?.packageQuantity 
                                ? `₺${(edit.unitPrice * edit.packageQuantity).toFixed(2)}` 
                                : edit?.price 
                                ? `₺${edit.price.toFixed(2)}` 
                                : '₺0.00'}
                            </div>
                            {edit?.packageQuantity && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({edit.packageQuantity} paket)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={edit?.hasMoq || false}
                                onCheckedChange={() => toggleHasMoq(product.id)}
                              />
                              <span className="text-xs">Min. Paket Gerekli</span>
                            </div>
                            {edit?.hasMoq && (
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="number"
                                  min="1"
                                  value={edit?.moq || 1}
                                  onChange={(e) => updateMoq(product.id, parseInt(e.target.value) || 1)}
                                  className="w-16 h-7 text-xs"
                                  placeholder="Min"
                                />
                                <Select
                                  value={edit?.moqUnit || 'package'}
                                  onValueChange={(value) => updateMoqUnit(product.id, value as 'piece' | 'package' | 'koli')}
                                >
                                  <SelectTrigger className="w-20 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="package">Paket</SelectItem>
                                    <SelectItem value="piece">Adet</SelectItem>
                                    <SelectItem value="koli">Koli</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasChange ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Değişti
                            </Badge>
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant={product.isActive ? "default" : "outline"}
                            onClick={() => toggleProductStatus(product.id, product.isActive)}
                            disabled={isSaving}
                            className={product.isActive 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }
                          >
                            {product.isActive ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Aktif
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Pasif
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSingleProduct(product.id)}
                            disabled={isSaving || !hasChange}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Güncelle
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            </div>
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



