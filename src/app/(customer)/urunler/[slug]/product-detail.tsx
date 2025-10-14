'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SafeImage } from '@/components/ui/safe-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  ShieldCheck, 
  RefreshCcw,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Package,
  AlertTriangle,
  TrendingDown,
  CheckCircle
} from 'lucide-react'
import { useCart } from '@/context/cart-context'
import { useWishlist } from '@/context/wishlist-context'
import { useCurrency } from '@/context/currency-context'
import { toast } from 'sonner'

interface TierPrice {
  minQuantity: number
  maxQuantity?: number
  price: number
  label: string
}

interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  compare_price: number | null
  stock_quantity: number
  sku: string | null
  barcode: string | null
  images: string[]
  tags: string[]
  is_active: boolean
  is_featured: boolean
  category: {
    id: number
    name: string
    slug: string
  } | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  // Toptan Fiyatlandırma
  is_wholesale?: boolean
  wholesale_only?: boolean
  moq?: number
  moq_unit?: 'piece' | 'package' | 'koli'
  package_quantity?: number
  package_unit?: string
  tier_pricing?: TierPrice[]
}

interface ProductDetailProps {
  product: Product
}

// HTML içeriğini güvenli hale getiren fonksiyon
function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // Zararlı script taglarını kaldır
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Zararlı event handlerları kaldır
  cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // iframe, object, embed taglarını kaldır
  cleaned = cleaned.replace(/<(iframe|object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
  
  // Sadece güvenli HTML taglarına izin ver
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'a', 'img']
  
  // Link taglarını güvenli hale getir
  cleaned = cleaned.replace(/<a\b[^>]*>/gi, (match) => {
    // Sadece href attribute'unu bırak, target="_blank" ve rel="noopener noreferrer" ekle
    const hrefMatch = match.match(/href\s*=\s*["']([^"']*)["']/i)
    if (hrefMatch) {
      const href = hrefMatch[1]
      // Sadece güvenli URL'lere izin ver
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/') || href.startsWith('#')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">`
      }
    }
    return '<a>'
  })
  
  // Img taglarını güvenli hale getir
  cleaned = cleaned.replace(/<img\b[^>]*>/gi, (match) => {
    const srcMatch = match.match(/src\s*=\s*["']([^"']*)["']/i)
    const altMatch = match.match(/alt\s*=\s*["']([^"']*)["']/i)
    if (srcMatch) {
      const src = srcMatch[1]
      const alt = altMatch ? altMatch[1] : ''
      return `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-md" loading="lazy" />`
    }
    return ''
  })
  
  return cleaned
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { formatPrice } = useCurrency()
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Paket bazlı miktar yönetimi
  const packageQty = product.package_quantity || 1 // Bir pakette kaç adet var
  const minPackageCount = product.is_wholesale && product.moq ? product.moq : 1 // Minimum paket adedi
  const [packageCount, setPackageCount] = useState(minPackageCount) // Paket adedi
  const quantity = packageCount * packageQty // Gerçek ürün adedi (paket x adet)
  const [isAddedToCart, setIsAddedToCart] = useState(false)

  const discountPercentage = product.compare_price 
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&q=80']

  // HTML açıklamalarını sanitize et
  const sanitizedDescription = sanitizeHtml(product.description || '')
  const sanitizedShortDescription = sanitizeHtml(product.short_description || '')

  // Kademeli fiyatlandırma varsa miktara göre fiyat hesapla
  const calculatePrice = (qty: number): number => {
    if (!product.tier_pricing || product.tier_pricing.length === 0) {
      return product.price
    }

    // Tier pricing'de uygun kademeli fiyatı bul
    for (const tier of product.tier_pricing) {
      if (qty >= tier.minQuantity) {
        if (!tier.maxQuantity || qty <= tier.maxQuantity) {
          return tier.price
        }
      }
    }

    return product.price
  }

  const currentPrice = calculatePrice(quantity)

  const handleAddToCart = () => {
    // MOQ kontrolü (paket bazlı)
    if (product.is_wholesale && product.moq && packageCount < product.moq) {
      toast.error(`Minimum sipariş adedi: ${product.moq} ${product.moq_unit === 'package' ? product.package_unit || 'paket' : product.moq_unit === 'koli' ? 'koli' : 'adet'}`)
      return
    }

    // Product objesini direkt kullan, sadece fiyatı güncelle
    const cartProduct = {
      ...product,
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice, // 1 paket fiyatı
      stockQuantity: product.stock_quantity,
      images: images.map((url, idx) => ({
        id: idx,
        url: url,
        alt: product.name,
        position: idx,
        isMain: idx === 0
      })),
      sku: product.sku || null,
      tags: product.tags || [],
      shipping: {
        requiresShipping: true,
        isOversized: false
      },
      // Toptan satış bilgileri
      packageQuantity: product.package_quantity,
      packageUnit: product.package_unit,
      isWholesale: product.is_wholesale
    } as any
    
    // Debug: Paket bilgilerini kontrol et
    console.log('🛒 Sepete ekleniyor:', {
      isWholesale: product.is_wholesale,
      packageQuantity: product.package_quantity,
      packageUnit: product.package_unit,
      packageCount,
      totalPieces: packageCount * (product.package_quantity || 1)
    })
    
    // Sepete paket sayısını gönder (quantity değil packageCount)
    addToCart(cartProduct, packageCount)
    setIsAddedToCart(true)
    // Toast message is handled by cart context
    setTimeout(() => setIsAddedToCart(false), 2000)
  }

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    // Paket bazlı artış/azalış
    if (action === 'increase' && quantity + packageQty <= product.stock_quantity) {
      setPackageCount(packageCount + 1)
    } else if (action === 'decrease' && packageCount > minPackageCount) {
      setPackageCount(packageCount - 1)
    }
  }

  const handleWishlist = () => {
    const wishlistProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      slug: product.slug
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      // Wishlist context zaten toast mesajı gönderiyor
    } else {
      addToWishlist(wishlistProduct)
      // Wishlist context zaten toast mesajı gönderiyor
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-sm:py-3 max-sm:px-3 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 max-sm:text-xs max-sm:mb-3 max-sm:overflow-x-auto max-sm:scrollbar-none max-sm:pb-1">
        <div className="flex items-center gap-2 max-sm:whitespace-nowrap max-sm:min-w-max">
          <Link 
            href="/" 
            className="hover:text-primary max-sm:text-xs whitespace-nowrap touch-manipulation"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            Ana Sayfa
          </Link>
          <ChevronRight className="h-4 w-4 max-sm:h-3 max-sm:w-3 flex-shrink-0" />
          <Link 
            href="/urunler" 
            className="hover:text-primary max-sm:text-xs whitespace-nowrap touch-manipulation"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            Ürünler
          </Link>
          <ChevronRight className="h-4 w-4 max-sm:h-3 max-sm:w-3 flex-shrink-0" />
          {product.category && (
            <>
              <Link 
                href={`/kategoriler/${product.category.slug}`} 
                className="hover:text-primary max-sm:text-xs whitespace-nowrap max-sm:hidden touch-manipulation"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-4 w-4 max-sm:h-3 max-sm:w-3 flex-shrink-0 max-sm:hidden" />
            </>
          )}
          <span className="text-foreground max-sm:text-xs whitespace-nowrap max-sm:max-w-[120px] max-sm:truncate" title={product.name}>
            {product.name}
          </span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] md:grid-cols-2 gap-4 max-sm:gap-2 max-sm:grid-cols-1">
        {/* Sol Taraf - Resim Galerisi - Ultra Kompakt */}
        <div className="space-y-2 max-sm:space-y-1.5">
          {/* Ana Resim - %55 Boyut */}
          <div className="relative max-w-[55%] mx-auto md:max-w-[65%] lg:max-w-[60%]">
            <div className="aspect-square bg-muted rounded-xl overflow-hidden shadow-sm max-sm:aspect-[4/3] max-sm:h-[220px] max-sm:max-w-full">
              <SafeImage
                src={images[selectedImage] || images[0]}
                alt={product.name}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            {/* Toptan Satış Badge */}
            <Badge className="absolute top-2 left-2 max-sm:top-1.5 max-sm:left-1.5 text-xs px-3 py-1.5 shadow-md bg-blue-600 text-white border-0 font-semibold">
              <Package className="h-3 w-3 mr-1" />
              TOPTAN
            </Badge>
            
            {discountPercentage > 0 && (
              <Badge className="absolute top-12 right-2 max-sm:top-10 max-sm:right-1.5 text-[10px] px-2 py-1 shadow-sm" variant="destructive">
                %{discountPercentage}
              </Badge>
            )}
          </div>

          {/* Ultra Kompakt Thumbnail Galerisi - Sadece Desktop */}
          {images.length > 1 && (
            <div className="hidden md:block max-w-[65%] mx-auto lg:max-w-[60%]">
              <div className="grid grid-cols-5 gap-1.5">
                {images.slice(0, 5).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-muted rounded-md overflow-hidden transition-all duration-200 border-2 ${
                      selectedImage === index 
                        ? 'border-primary ring-1 ring-primary/30 scale-105' 
                        : 'border-transparent hover:border-primary/50 hover:scale-102'
                    }`}
                  >
                    <SafeImage
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      width={60}
                      height={60}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {images.length > 5 && (
                  <div className="aspect-square bg-muted rounded-md flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-dashed">
                    +{images.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobil için Görsel Slider İpuçları */}
          {images.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-2 max-sm:mt-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-2 h-2 rounded-full transition-all max-sm:w-1.5 max-sm:h-1.5 ${
                    selectedImage === index ? 'bg-primary scale-125' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sağ Taraf - Ürün Bilgileri - Ultra Kompakt */}
        <div className="space-y-3 max-sm:space-y-2 lg:pl-3">
          {/* Toptan Satış Bilgilendirme */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 max-sm:p-3 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold max-sm:text-sm">TOPTAN SATIŞ</p>
                <p className="text-xs opacity-90 max-sm:text-[10px]">Paket bazlı toptan fiyat</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs max-sm:text-[10px] bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                1 {product.package_unit || 'paket'} = <strong>{packageQty} adet</strong> ürün
              </span>
            </div>
          </div>

          {/* Başlık - Kompakt */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-bold leading-tight max-sm:text-lg max-sm:leading-tight flex-1">{product.name}</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs px-2 py-0.5 flex-shrink-0">
                Toptan
              </Badge>
            </div>
            {product.sku && (
              <p className="text-sm text-muted-foreground max-sm:text-xs">SKU: {product.sku}</p>
            )}
          </div>

          {/* Fiyat - Kompakt */}
          <div className="bg-gray-50 rounded-lg p-3 max-sm:p-2.5 border">
            <div className="flex items-baseline gap-2 max-sm:gap-1.5">
              <span className="text-xl font-bold text-primary max-sm:text-lg">{formatPrice(currentPrice)}</span>
              {product.compare_price && product.compare_price > currentPrice ? (
                <span className="text-base text-muted-foreground line-through max-sm:text-sm">
                  {formatPrice(product.compare_price)}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-green-600 mt-0.5 max-sm:text-xs">KDV Dahil</p>
            {product.tier_pricing && product.tier_pricing.length > 0 && currentPrice !== product.price && (
              <p className="text-xs text-blue-600 mt-1 max-sm:text-[10px]">
                {quantity} adet için özel fiyat uygulandı
              </p>
            )}
          </div>

          {/* Toptan Fiyatlandırma Tablosu */}
          {product.is_wholesale && product.tier_pricing && product.tier_pricing.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4 max-sm:p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-600 rounded-full p-2">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-base max-sm:text-sm">Toptan Fiyat Listesi</h3>
                  <p className="text-xs text-blue-700">Paket adedine göre birim fiyatlar</p>
                </div>
              </div>
              
              {product.moq && (
                <div className="mb-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-blue-900 max-sm:text-[10px]">
                        Minimum: {product.moq} {product.moq_unit === 'package' ? product.package_unit || 'paket' : product.moq_unit === 'koli' ? 'koli' : 'adet'}
                      </p>
                      {product.package_quantity && product.moq_unit === 'package' && (
                        <p className="text-[10px] text-blue-600">
                          ({product.moq * product.package_quantity} adet)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {product.tier_pricing.map((tier, index) => {
                  const isCurrentTier = quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)
                  return (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                        isCurrentTier 
                          ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700' 
                          : 'bg-white hover:bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrentTier && <CheckCircle className="h-4 w-4" />}
                        <span className={`text-sm font-semibold max-sm:text-xs ${isCurrentTier ? 'text-white' : 'text-gray-700'}`}>
                          {tier.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold max-sm:text-base ${isCurrentTier ? 'text-white' : 'text-blue-900'}`}>
                          {formatPrice(tier.price)}
                        </span>
                        <p className={`text-[10px] ${isCurrentTier ? 'text-white/90' : 'text-gray-600'}`}>
                          / adet
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sipariş Özeti */}
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-900">Sipariş Özeti</p>
                </div>
                <p className="text-sm text-gray-700">
                  {packageCount} paket × {formatPrice(currentPrice)} = <span className="font-bold text-blue-900">{formatPrice(currentPrice * packageCount)}</span>
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Toplam {quantity} adet ürün
                </p>
              </div>

              {/* Toptan Satış Avantajları */}
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold text-blue-900 mb-1">Toptan Satış Avantajları:</p>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span>Paket bazlı toptan fiyat</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span>Ücretsiz kargo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
                  <span>Hızlı teslimat (1-3 iş günü)</span>
                </div>
              </div>
            </div>
          )}

          {/* Kompakt Ürün Açıklaması - Yukarıda */}
          {(sanitizedShortDescription || sanitizedDescription) && (
            <div className="bg-white rounded-lg p-3 max-sm:p-2.5 border">
              <h3 className="font-medium mb-2 text-sm max-sm:text-xs">Ürün Açıklaması</h3>
              <div 
                className="text-muted-foreground text-sm leading-relaxed prose prose-sm max-w-none max-sm:line-clamp-3 max-sm:text-xs"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizedShortDescription || sanitizedDescription 
                }}
              />
            </div>
          )}

          {/* Kompakt Etiketler */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-sm:gap-0.5">
              {product.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0.5 max-sm:text-[9px]">{tag}</Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 max-sm:text-[9px]">+{product.tags.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Ultra Kompakt Satın Alma Alanı */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-3 max-sm:p-2.5 border-2 border-blue-200 space-y-2.5 shadow-md">
            {/* Miktar ve Stok */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">Paket Adedi</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] px-1.5 py-0.5">
                  Toptan Fiyat
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center border-2 border-blue-300 rounded-lg bg-white shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange('decrease')}
                    disabled={packageCount <= minPackageCount}
                    className="h-8 w-8 max-sm:h-7 max-sm:w-7 hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4 max-sm:h-3 max-sm:w-3" />
                  </Button>
                  <div className="w-16 text-center max-sm:w-14">
                    <div className="text-base font-bold text-blue-900 max-sm:text-sm">{packageCount}</div>
                    <div className="text-[10px] text-blue-600 max-sm:text-[9px]">({quantity} adet)</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange('increase')}
                    disabled={quantity + packageQty > product.stock_quantity}
                    className="h-8 w-8 max-sm:h-7 max-sm:w-7 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 max-sm:h-3 max-sm:w-3" />
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <Package className="h-4 w-4 text-green-600 max-sm:h-3 max-sm:w-3" />
                  <span className="text-sm text-muted-foreground max-sm:text-xs">
                    Stok: <span className="font-bold text-green-600">{product.stock_quantity}</span>
                  </span>
                  {quantity >= 50 && (
                    <CheckCircle className="h-4 w-4 text-green-600 animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            {/* Ultra Kompakt Butonlar */}
            <div className="space-y-2">
              {/* Toptan Satış Avantajı Bildirimi */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 font-medium">
                  <strong>Toptan avantajı:</strong> {packageCount} paket = {quantity} adet ürün
                </p>
              </div>
              <Button 
                className="w-full h-11 text-base font-bold rounded-lg shadow-lg max-sm:h-10 max-sm:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
              >
                {isAddedToCart ? (
                  <>
                    <Check className="mr-2 h-5 w-5 max-sm:mr-1.5 max-sm:h-4 max-sm:w-4" />
                    Sepete Eklendi!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5 max-sm:mr-1.5 max-sm:h-4 max-sm:w-4" />
                    Toptan Sipariş Ver ({formatPrice(currentPrice * packageCount)})
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  onClick={handleWishlist}
                  className="h-8 text-xs max-sm:h-7"
                >
                  <Heart className={`h-3 w-3 mr-1 max-sm:h-2.5 max-sm:w-2.5 ${isInWishlist(product.id) ? 'fill-current text-red-500' : ''}`} />
                  Favorile
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        text: product.short_description || product.description || '',
                        url: window.location.href
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Ürün linki kopyalandı')
                    }
                  }}
                  className="h-8 text-xs max-sm:h-7"
                >
                  <Share2 className="h-3 w-3 mr-1 max-sm:h-2.5 max-sm:w-2.5" />
                  Paylaş
                </Button>
              </div>
            </div>

            {product.stock_quantity === 0 && (
              <p className="text-destructive font-medium max-sm:text-sm max-sm:text-center">Bu ürün şu anda stokta bulunmamaktadır.</p>
            )}
          </div>
        </div>
      </div>

      {/* Kompakt Kargo Bilgileri */}
      <div className="grid grid-cols-3 gap-3 mt-6 p-3 bg-muted/20 rounded-lg max-sm:mt-3 max-sm:p-2 max-sm:gap-2">
        <div className="flex flex-col items-center text-center gap-1.5 max-sm:gap-1">
          <Truck className="h-5 w-5 text-primary max-sm:h-4 max-sm:w-4" />
          <div>
            <p className="text-[11px] font-medium max-sm:text-[9px]">Ücretsiz Kargo</p>
            <p className="text-[10px] text-muted-foreground max-sm:text-[8px]">2-3 gün</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5 max-sm:gap-1">
          <ShieldCheck className="h-5 w-5 text-primary max-sm:h-4 max-sm:w-4" />
          <div>
            <p className="text-[11px] font-medium max-sm:text-[9px]">Güvenli Ödeme</p>
            <p className="text-[10px] text-muted-foreground max-sm:text-[8px]">256 Bit SSL</p>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-1.5 max-sm:gap-1">
          <RefreshCcw className="h-5 w-5 text-primary max-sm:h-4 max-sm:w-4" />
          <div>
            <p className="text-[11px] font-medium max-sm:text-[9px]">Kolay İade</p>
            <p className="text-[10px] text-muted-foreground max-sm:text-[8px]">14 Gün</p>
          </div>
        </div>
      </div>

      {/* Detaylı açıklama - sadece desktop'ta göster */}
      {(sanitizedDescription || sanitizedShortDescription) && (
        <div className="mt-8 max-sm:hidden">
          <h3 className="font-semibold mb-4 text-xl">Ürün Açıklaması</h3>
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: sanitizedShortDescription || sanitizedDescription 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 