'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'

// Next.js 15 dynamic rendering fix
export const dynamic = 'force-dynamic'

import { useSearchParams } from 'next/navigation'
import { Search, X, Grid, List, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SafeImage } from '@/components/ui/safe-image'
import { QuickAddToCart } from '@/components/products/add-to-cart-button'
import { useCurrency } from '@/context/currency-context'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating?: number
  reviews?: number
  category?: string
  brand?: string
  slug: string
  stockQuantity: number
  description?: string
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const { formatPrice } = useCurrency()
  
  const [query, setQuery] = useState(searchQuery)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [priceRange, setPriceRange] = useState('all')

  // Ürün arama fonksiyonu
  const searchProducts = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts([])
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          compare_price,
          images,
          stock_quantity,
          description,
          category:categories(name)
        `)
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .limit(50)

      if (error) {
        console.error('Arama hatası:', error)
        return
      }

      const searchResults: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.compare_price || undefined,
        image: item.images?.[0] || '/placeholder-product.svg',
        rating: 4.5,
        reviews: Math.floor(Math.random() * 100),
        category: item.category?.name || 'Genel',
        brand: 'Marka',
        slug: item.id,
        stockQuantity: item.stock_quantity,
        description: item.description || ''
      }))

      setProducts(searchResults)
    } catch (error) {
      console.error('Arama işlemi başarısız:', error)
    } finally {
      setLoading(false)
    }
  }

  // İlk arama
  useEffect(() => {
    if (searchQuery) {
      searchProducts(searchQuery)
    }
  }, [searchQuery])

  // Arama sonuçlarını filtrele
  const searchResults = useMemo(() => {
    if (!query.trim()) return []

    let results = products.filter(product => {
      const query = query.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      )
    })

    // Kategori filtresi
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-500':
          results = results.filter(p => p.price < 500)
          break
        case '500-5000':
          results = results.filter(p => p.price >= 500 && p.price < 5000)
          break
        case '5000-50000':
          results = results.filter(p => p.price >= 5000 && p.price < 50000)
          break
        case 'over-50000':
          results = results.filter(p => p.price >= 50000)
          break
      }
    }

    // Sıralama
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        results.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        results.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        break
      default: // relevance
        // Basit relevance sıralaması - daha gelişmiş algoritma eklenebilir
        results.sort((a, b) => {
          const aScore = a.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1
          const bScore = b.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1
          return bScore - aScore
        })
    }

    return results
  }, [query, priceRange, sortBy, products])

  // Kategori listesi
  const categories = useMemo(() => {
    const categorySet = new Set(products.map(p => p.category))
    return Array.from(categorySet)
  }, [products])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Arama Sonuçları</h1>
        {query && (
          <p className="text-muted-foreground">
            &quot;{query}&quot; için {searchResults.length} sonuç bulundu
          </p>
        )}
      </div>

      {/* Filtreler */}
      <div className="mb-8 space-y-4">
        {/* Arama Çubuğu */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ürün, kategori veya marka ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              onClick={() => setQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtre Seçenekleri */}
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fiyat Aralığı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Fiyatlar</SelectItem>
              <SelectItem value="under-500">500 TL altı</SelectItem>
              <SelectItem value="500-5000">500 - 5,000 TL</SelectItem>
              <SelectItem value="5000-50000">5,000 - 50,000 TL</SelectItem>
              <SelectItem value="over-50000">50,000 TL üzeri</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">İlgili</SelectItem>
              <SelectItem value="price-low">Fiyat (Düşük)</SelectItem>
              <SelectItem value="price-high">Fiyat (Yüksek)</SelectItem>
              <SelectItem value="rating">Puan</SelectItem>
              <SelectItem value="newest">En Yeni</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sonuçlar */}
      {loading ? (
        <div className="text-center py-12">
          <p>Arama sonuçları yükleniyor...</p>
        </div>
      ) : !query ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Arama yapmak için yukarıdaki kutucuğu kullanın</h3>
          <p className="text-muted-foreground">
            Ürün, kategori veya marka adı ile arama yapabilirsiniz
          </p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Arama sonucu bulunamadı</h3>
          <p className="text-muted-foreground mb-4">
            &quot;{query}&quot; için sonuç bulunamadı. Farklı anahtar kelimeler deneyebilirsiniz.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery('')
              setPriceRange('all')
              setSortBy('relevance')
            }}
          >
            Filtreleri Temizle
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }>
          {searchResults.map(product => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <Link href={`/urunler/${product.slug}`}>
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <SafeImage
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="300px"
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Badge className="absolute top-2 right-2" variant="destructive">
                      %{Math.round((1 - product.price / product.originalPrice) * 100)}
                    </Badge>
                  )}
                </div>
              </Link>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    <Link href={`/urunler/${product.slug}`}>
                      {product.name}
                    </Link>
                  </h3>
                  
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  <QuickAddToCart 
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      stockQuantity: product.stockQuantity
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-8">Arama sayfası yükleniyor...</div>}>
      <SearchPageContent />
    </Suspense>
  )
} 