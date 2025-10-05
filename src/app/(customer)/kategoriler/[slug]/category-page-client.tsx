'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Filter, 
  SortAsc, 
  ChevronRight,
  ArrowLeft,
  Grid,
  List,
  Package,
  X
} from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { SafeImage } from '@/components/ui/safe-image'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  compare_price: number | null
  stock_quantity: number
  sku: string | null
  images: string[]
  tags: string[]
  is_active: boolean
  is_featured: boolean
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  is_active: boolean
  sort_order: number
  breadcrumb?: {
    name: string
    slug: string
  }[]
}

interface CategoryPageClientProps {
  category: Category
  products: Product[]
  subcategories: Category[]
}

export default function CategoryPageClient({ category, products, subcategories }: CategoryPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState('all')
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => product.is_active)

    // Stock filter
    if (showOnlyInStock) {
      filtered = filtered.filter(product => product.stock_quantity > 0)
    }

    // Discount filter
    if (showOnlyDiscounted) {
      filtered = filtered.filter(product => 
        product.compare_price && product.compare_price > product.price
      )
    }

    // Price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max
        }
        return product.price >= min
      })
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
        break
      case 'featured':
      default:
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
        break
    }

    return filtered
  }, [products, sortBy, priceRange, showOnlyInStock, showOnlyDiscounted])

  // Convert product to match ProductCard interface
  const convertProduct = (product: Product) => ({
    ...product,
    images: (product.images || []).map((url, index) => ({
      url: url || '/placeholder-product.svg',
      alt: product.name,
      is_main: index === 0
    }))
  })

  // Clear all filters
  const clearFilters = () => {
    setPriceRange('all')
    setShowOnlyInStock(false)
    setShowOnlyDiscounted(false)
  }

  // Check if any filter is active
  const hasActiveFilters = priceRange !== 'all' || showOnlyInStock || showOnlyDiscounted

  // Filter component for reuse
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Alt Kategoriler</h4>
          <div className="space-y-2">
            {subcategories.slice(0, 5).map((subcat) => (
              <Link
                key={subcat.id}
                href={`/kategoriler/${subcat.slug}`}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1 touch-manipulation"
                onClick={() => setIsFilterOpen(false)}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                {subcat.name}
              </Link>
            ))}
            {subcategories.length > 5 && (
              <p className="text-xs text-muted-foreground">+{subcategories.length - 5} daha fazla</p>
            )}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Fiyat Aralığı</h4>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tüm fiyatlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Fiyatlar</SelectItem>
            <SelectItem value="0-100">0 - 100 ₺</SelectItem>
            <SelectItem value="100-500">100 - 500 ₺</SelectItem>
            <SelectItem value="500-1000">500 - 1.000 ₺</SelectItem>
            <SelectItem value="1000-5000">1.000 - 5.000 ₺</SelectItem>
            <SelectItem value="5000-999999">5.000 ₺ ve üzeri</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Hızlı Filtreler</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyInStock}
              onChange={(e) => setShowOnlyInStock(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">Stokta olanlar</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyDiscounted}
              onChange={(e) => setShowOnlyDiscounted(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">İndirimli ürünler</span>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Filtreleri Temizle
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-friendly Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 max-sm:py-2">
          <nav className="flex items-center space-x-2 text-sm max-sm:text-xs overflow-x-auto scrollbar-none max-sm:pb-1">
            <div className="flex items-center space-x-2 max-sm:whitespace-nowrap max-sm:min-w-max">
              <Link 
                href="/" 
                className="text-muted-foreground hover:text-primary whitespace-nowrap touch-manipulation"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                Ana Sayfa
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 max-sm:h-3 max-sm:w-3" />
              <Link 
                href="/kategoriler" 
                className="text-muted-foreground hover:text-primary whitespace-nowrap max-sm:hidden touch-manipulation"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                Kategoriler
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 max-sm:h-3 max-sm:w-3 max-sm:hidden" />
              <span className="font-medium whitespace-nowrap max-w-[200px] max-sm:max-w-[150px] truncate">{category.name}</span>
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-sm:py-4">
        {/* Category Header - Compact */}
        <div className="mb-6 max-sm:mb-4">
          <div className="flex items-center justify-between mb-4 max-sm:mb-2">
            <div className="flex items-center gap-4">
              {/* Kategori Görseli */}
              {category.image_url && (
                <div className="relative w-16 h-16 max-sm:w-12 max-sm:h-12 rounded-lg overflow-hidden border shadow-sm flex-shrink-0">
                  <SafeImage
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold mb-1 max-sm:text-xl">{category.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedProducts.length} ürün bulundu
                </p>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild className="max-sm:h-8 max-sm:w-8">
              <Link href="/kategoriler">
                <ArrowLeft className="h-4 w-4 max-sm:h-3 max-sm:w-3" />
              </Link>
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
            <div className="flex items-center gap-3 max-sm:order-2">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                    {hasActiveFilters && (
                      <span className="ml-1 bg-primary text-primary-foreground rounded-full w-2 h-2"></span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Filtreler</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Filter Toggle - Compact */}
              <div className="hidden md:flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Temizle
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 max-sm:order-1">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] max-sm:w-full">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Öne Çıkanlar</SelectItem>
                  <SelectItem value="price-asc">Fiyat (Düşük → Yüksek)</SelectItem>
                  <SelectItem value="price-desc">Fiyat (Yüksek → Düşük)</SelectItem>
                  <SelectItem value="name">İsim (A → Z)</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode - Desktop Only */}
              <div className="hidden md:flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none h-9 w-9"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-9 w-9"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Desktop Sidebar - Compact */}
          <aside className="lg:col-span-1 hidden md:block">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filtreler
              </h3>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-4">
            {/* Products */}
            {filteredAndSortedProducts.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-sm:gap-3' 
                : 'space-y-4'
              }>
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={convertProduct(product)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center max-sm:p-6">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 max-sm:h-8 max-sm:w-8" />
                <h3 className="text-lg font-semibold mb-2 max-sm:text-base">Ürün bulunamadı</h3>
                <p className="text-muted-foreground mb-4 max-sm:text-sm">
                  {hasActiveFilters 
                    ? 'Seçtiğiniz filtrelere uygun ürün bulunamadı.' 
                    : 'Bu kategoride henüz ürün bulunmuyor.'
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Filtreleri Temizle
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
} 