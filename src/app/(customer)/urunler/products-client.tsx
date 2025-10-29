'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, SortAsc, Package } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { Button } from '@/components/ui/button'

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
  package_quantity?: number | null
  package_unit?: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductsClientProps {
  products: Product[]
  categories: Category[]
}

export default function ProductsClient({ products, categories }: ProductsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyPackaged, setShowOnlyPackaged] = useState(false)

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => product.is_active)

    // Packaged products filter
    if (showOnlyPackaged) {
      filtered = filtered.filter(product => 
        product.package_quantity && product.package_quantity > 0
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category?.id === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
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
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'featured':
      default:
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
        break
    }

    return filtered
  }, [products, selectedCategory, sortBy, searchQuery, showOnlyPackaged])

  // Convert product to match ProductCard interface
  const convertProduct = (product: Product) => ({
    ...product,
    images: product.images.map((url, index) => ({
      url,
      alt: product.name,
      is_main: index === 0
    }))
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ürünler</h1>
        <p className="text-muted-foreground">
          {filteredAndSortedProducts.length} ürün bulundu
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Paketli Ürünler Butonu */}
        <Button
          variant={showOnlyPackaged ? "default" : "outline"}
          onClick={() => setShowOnlyPackaged(!showOnlyPackaged)}
          className={`${
            showOnlyPackaged 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'hover:bg-blue-50'
          }`}
        >
          <Package className="h-4 w-4 mr-2" />
          Paketli Ürünler
          {showOnlyPackaged && (
            <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
              {products.filter(p => p.package_quantity && p.package_quantity > 0).length}
            </span>
          )}
        </Button>

        {/* Filters */}
        <div className="flex gap-4">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
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
        </div>
      </div>

      {/* Products Grid */}
      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={convertProduct(product)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Bu kriterlere uygun ürün bulunamadı.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Farklı filtreler deneyebilir veya arama terimini değiştirebilirsiniz.
          </p>
        </div>
      )}
    </div>
  )
} 