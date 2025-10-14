'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cart-context'
import { useCurrency } from '@/context/currency-context'
import { SafeImage } from '@/components/ui/safe-image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ChevronRight,
  Tag,
  Truck,
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

export default function CartPage() {
  const router = useRouter()
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getShippingInfo,
    getTaxInfo,
    getFinalTotal
  } = useCart()
  const { formatPrice } = useCurrency()

  const items = cart.items
  
  const [promoCode, setPromoCode] = useState('')
  const [isPromoApplied, setIsPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoCodeId, setPromoCodeId] = useState<number | null>(null)
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      toast.info('Ürün sepetten çıkarıldı')
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = (itemId: string, productName: string) => {
    removeFromCart(itemId)
    toast.success(`${productName} sepetten çıkarıldı`)
  }

  const handleClearCart = () => {
    clearCart()
    toast.success('Sepet temizlendi')
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Lütfen bir promosyon kodu girin')
      return
    }

    setIsValidatingPromo(true)
    
    try {
      const { validatePromoCode } = await import('@/app/actions/admin/promo-code-actions')
      const result = await validatePromoCode(promoCode, cart.subtotal)

      if (result.success && result.data) {
        if (result.data.valid && result.data.discountAmount) {
          setIsPromoApplied(true)
          setPromoDiscount(result.data.discountAmount)
          
          // Promosyon kodu ID'sini almak için kod ile sorgula
          const { getPromoCodes } = await import('@/app/actions/admin/promo-code-actions')
          const codesResult = await getPromoCodes({ search: promoCode })
          if (codesResult.success && codesResult.data?.promoCodes.length > 0) {
            setPromoCodeId(codesResult.data.promoCodes[0].id)
          }
          
          const discountText = result.data.discountType === 'percentage' 
            ? `%${result.data.discountValue}` 
            : `${result.data.discountValue} ₺`
          toast.success(`Promosyon kodu uygulandı! ${discountText} indirim`)
        } else {
          toast.error(result.data.errorMessage || 'Geçersiz promosyon kodu')
        }
      } else {
        toast.error(result.error || 'Promosyon kodu doğrulanamadı')
      }
    } catch (error) {
      console.error('Promosyon kodu hatası:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setIsValidatingPromo(false)
    }
  }
  
  const handleRemovePromo = () => {
    setIsPromoApplied(false)
    setPromoDiscount(0)
    setPromoCode('')
    setPromoCodeId(null)
    toast.info('Promosyon kodu kaldırıldı')
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Sepetinizde ürün bulunmuyor')
      return
    }
    
    // Minimum sipariş kontrolü kaldırıldı - Toptan satışta yok
    router.push('/odeme')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-8 md:py-12">
            <ShoppingCart className="h-16 w-16 md:h-24 md:w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl md:text-2xl font-bold mb-2">Sepetiniz Boş</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6 px-4">
              Henüz sepetinizde ürün bulunmuyor. Alışverişe başlamak için ürünlerimizi inceleyin.
            </p>
            <Button asChild className="h-10 md:h-11">
              <Link href="/urunler">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Alışverişe Devam Et
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-2 md:py-8">
      <div className="container mx-auto px-2 md:px-4 max-w-6xl">
        {/* Breadcrumb - Desktop only */}
        <nav className="hidden md:flex items-center space-x-2 text-sm mb-8">
          <Link href="/" className="text-muted-foreground hover:text-foreground">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">Sepet</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8">
          {/* Sol Taraf - Sepet Ürünleri */}
          <div className="lg:col-span-2 space-y-2 md:space-y-4">
            <div className="flex items-center justify-between mb-3 md:mb-6 px-1">
              <h1 className="text-lg md:text-2xl font-bold">
                Sepetim ({cart.totalItems})
              </h1>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearCart}
                className="text-destructive hover:text-destructive h-8 px-2 md:px-4"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Sepeti Temizle</span>
              </Button>
            </div>

            {/* Ürün Listesi */}
            <div className="space-y-2 md:space-y-4">
              {items.map((item) => {
                // Paket bazlı hesaplamalar
                const packageQty = item.product.packageQuantity || 1
                const totalPieces = item.quantity * packageQty // Toplam adet
                const itemTotal = item.product.price * item.quantity // Fiyat × paket sayısı
                const itemDiscount = 0 // İndirim sistemi henüz eklenmedi
                
                return (
                  <Card key={item.id} className="shadow-sm">
                    <CardContent className="p-2 md:p-4">
                      {/* Mobile Layout */}
                      <div className="md:hidden">
                        <div className="flex gap-2">
                          {/* Ürün Resmi */}
                          <div className="w-16 h-16 flex-shrink-0">
                            <div className="aspect-square bg-muted rounded overflow-hidden">
                              <SafeImage
                                src={item.product.images?.[0] || '/placeholder-product.svg'}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Ürün Bilgileri */}
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/urunler/${item.product.slug || item.productId}`}
                              className="text-sm font-semibold line-clamp-2 hover:text-primary"
                            >
                              {item.product.name}
                            </Link>
                            {/* Paket Bilgisi */}
                            {item.product.isWholesale && item.product.packageQuantity && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Package className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-700 font-medium">
                                  {packageQty} adet/{item.product.packageUnit || 'paket'}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold">
                                  {formatPrice(item.product.price)}
                                  {item.product.isWholesale && <span className="text-xs text-gray-600">/paket</span>}
                                </span>
                                {item.product.isWholesale && item.product.packageQuantity && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    {item.quantity} paket = {totalPieces} adet
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 border rounded">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="px-1 text-center">
                                  <div className="text-xs font-bold">{item.quantity}</div>
                                  <div className="text-[9px] text-blue-600">paket</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Toplam ve Sil */}
                          <div className="flex flex-col items-end justify-between">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id, item.product.name)}
                              className="h-6 w-6 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-bold">
                              {formatPrice(itemTotal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:grid grid-cols-5 gap-4">
                        {/* Ürün Resmi */}
                        <div className="col-span-1">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <SafeImage
                              src={item.product.images?.[0] || '/placeholder-product.svg'}
                              alt={item.product.name}
                              width={120}
                              height={120}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="col-span-2 space-y-2">
                          <Link 
                            href={`/urunler/${item.product.slug || item.productId}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          
                          {/* Paket Bilgisi */}
                          {item.product.isWholesale && item.product.packageQuantity && (
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-sm text-blue-700 font-medium">
                                {packageQty} adet/{item.product.packageUnit || 'paket'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {formatPrice(item.product.price)}
                              {item.product.isWholesale && <span className="text-sm text-gray-600">/paket</span>}
                            </span>
                          </div>
                          
                          {/* Toplam Adet Bilgisi */}
                          {item.product.isWholesale && item.product.packageQuantity && (
                            <div className="text-sm text-blue-600 font-medium">
                              {item.quantity} paket = {totalPieces} adet
                            </div>
                          )}
                        </div>

                        {/* Miktar Kontrolü */}
                        <div className="col-span-1 flex flex-col items-center justify-center space-y-2">
                          {item.product.stockQuantity !== undefined && (
                            <span className={`text-sm font-medium ${
                              item.product.stockQuantity > 10 
                                ? 'text-green-600' 
                                : item.product.stockQuantity > 0 
                                ? 'text-orange-600' 
                                : 'text-red-600'
                            }`}>
                              Stok: {item.product.stockQuantity}
                            </span>
                          )}
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="px-3 py-1 min-w-[3rem] text-center">
                              <div className="font-semibold">{item.quantity}</div>
                              {item.product.isWholesale && <div className="text-xs text-blue-600">paket</div>}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id, item.product.name)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Kaldır
                          </Button>
                        </div>

                        {/* Toplam Fiyat */}
                        <div className="col-span-1 flex flex-col items-end justify-center">
                          <span className="text-lg font-bold">
                            {formatPrice(itemTotal)}
                          </span>
                          {itemDiscount > 0 && (
                            <span className="text-sm text-green-600">
                              {formatPrice(itemDiscount)} tasarruf
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Sağ Taraf - Sipariş Özeti */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-base md:text-lg">Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
                {/* Promosyon Kodu */}
                <div className="space-y-2">
                  <Label htmlFor="promo" className="text-xs md:text-sm">Promosyon Kodu</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promo"
                      placeholder="Kodu giriniz"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={isPromoApplied}
                      className="h-9 text-sm"
                    />
                    <Button 
                      variant="outline" 
                      onClick={isPromoApplied ? handleRemovePromo : handleApplyPromo}
                      disabled={isValidatingPromo || (!isPromoApplied && !promoCode)}
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                    >
                      {isValidatingPromo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isPromoApplied ? (
                        <Trash2 className="h-3.5 w-3.5" />
                      ) : (
                        <Tag className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  {isPromoApplied && (
                    <div className="flex items-center gap-2 text-green-600 text-xs md:text-sm">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Promosyon kodu uygulandı (-{formatPrice(promoDiscount)})
                    </div>
                  )}
                </div>

                <Separator />

                {/* Fiyat Detayları */}
                <div className="space-y-2 md:space-y-3">
                  {(() => {
                    const taxInfo = getTaxInfo()
                    const shippingInfo = getShippingInfo()
                    const finalTotal = getFinalTotal()
                    
                    return (
                      <>
                        {/* Ara Toplam (KDV Hariç) */}
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">Ara Toplam (KDV Hariç)</span>
                          <span className="font-medium">{formatPrice(taxInfo.priceBeforeTax)}</span>
                        </div>
                        
                        {/* KDV */}
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-muted-foreground">KDV (%{taxInfo.taxRate})</span>
                          <span className="font-medium">{formatPrice(taxInfo.taxAmount)}</span>
                        </div>
                        
                        {/* KDV Dahil Fiyat */}
                        <div className="flex justify-between text-xs md:text-sm font-medium">
                          <span>Ara Toplam (KDV Dahil)</span>
                          <span>{formatPrice(taxInfo.totalWithTax)}</span>
                        </div>
                        
                        <Separator />
                        
                        {/* Kargo Bilgisi */}
                        <div className="flex justify-between items-center text-xs md:text-sm">
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-green-600" />
                            <span>Kargo</span>
                            <Badge variant="secondary" className="text-[10px] md:text-xs bg-green-100 text-green-700 px-1.5 py-0">
                              ÜCRETSİZ
                            </Badge>
                          </div>
                          <span className="text-green-600 font-medium">
                            Ücretsiz
                          </span>
                        </div>
                        
                        {isPromoApplied && promoDiscount > 0 && (
                          <div className="flex justify-between text-green-600 text-xs md:text-sm font-medium">
                            <span>Promosyon İndirimi</span>
                            <span>-{formatPrice(promoDiscount)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        {/* Son Toplam */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm md:text-base font-semibold">Toplam</span>
                          <div className="text-right">
                            <div className="text-base md:text-lg font-bold">
                              {formatPrice(Math.max(0, finalTotal - promoDiscount))}
                            </div>
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              KDV ve kargo dahil
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Minimum Sipariş Kontrolü Kaldırıldı - Toptan Satış */}

                <Separator />

                {/* Güven Göstergeleri - Desktop only */}
                <div className="hidden md:flex flex-col space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <Truck className="h-4 w-4" />
                    <span>Tüm siparişlerde ücretsiz kargo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Güvenli ödeme</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button 
                  className="w-full h-10 md:h-11 text-sm md:text-base" 
                  onClick={handleCheckout}
                >
                  Ödemeye Geç
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>

                <Button variant="outline" className="w-full h-9 md:h-10 text-sm" asChild>
                  <Link href="/urunler">
                    <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                    Alışverişe Devam Et
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 