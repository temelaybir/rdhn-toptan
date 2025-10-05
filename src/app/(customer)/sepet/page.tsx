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
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

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

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'yeni10') {
      setIsPromoApplied(true)
      toast.success('Promosyon kodu uygulandı! %10 indirim')
    } else if (promoCode.toLowerCase() === 'hosgeldin') {
      setIsPromoApplied(true)
      toast.success('Hoş geldin kodu uygulandı! %5 indirim')
    } else {
      toast.error('Geçersiz promosyon kodu')
    }
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Sepetinizde ürün bulunmuyor')
      return
    }
    router.push('/odeme')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-12">
            <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sepetiniz Boş</h1>
            <p className="text-muted-foreground mb-6">
              Henüz sepetinizde ürün bulunmuyor. Alışverişe başlamak için ürünlerimizi inceleyin.
            </p>
            <Button asChild>
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
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm mb-8">
          <Link href="/" className="text-muted-foreground hover:text-foreground">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">Sepet</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Taraf - Sepet Ürünleri */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">
                Sepetim ({cart.totalItems} Ürün)
              </h1>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sepeti Temizle
              </Button>
            </div>

            {/* Ürün Listesi */}
            <div className="space-y-4">
              {items.map((item) => {
                const itemTotal = item.product.price * item.quantity
                const itemDiscount = 0 // İndirim sistemi henüz eklenmedi
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Ürün Resmi */}
                        <div className="md:col-span-1">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <SafeImage
                              src={item.product.image_url}
                              alt={item.product.name}
                              width={120}
                              height={120}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="md:col-span-2 space-y-2">
                          <Link 
                            href={`/urunler/${item.productId}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">
                              {item.variant.title}
                            </p>
                          )}
                          {item.product.brand && (
                            <p className="text-sm text-muted-foreground">
                              Marka: {item.product.brand}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {formatPrice(item.product.price)}
                            </span>
                          </div>
                        </div>

                        {/* Miktar Kontrolü */}
                        <div className="md:col-span-1 flex flex-col items-center justify-center space-y-2">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
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
                        <div className="md:col-span-1 flex flex-col items-end justify-center">
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
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Promosyon Kodu */}
                <div className="space-y-2">
                  <Label htmlFor="promo">Promosyon Kodu</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promo"
                      placeholder="Kodu giriniz"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={isPromoApplied}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyPromo}
                      disabled={isPromoApplied || !promoCode}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  {isPromoApplied && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Promosyon kodu uygulandı
                    </div>
                  )}
                </div>

                <Separator />

                {/* Fiyat Detayları */}
                <div className="space-y-3">
                  {(() => {
                    const taxInfo = getTaxInfo()
                    const shippingInfo = getShippingInfo()
                    const finalTotal = getFinalTotal()
                    
                    // Debug: KDV hesaplamalarını kontrol et
                    console.log('🧮 Sepet KDV Hesaplamaları:', {
                      priceBeforeTax: taxInfo.priceBeforeTax,
                      taxAmount: taxInfo.taxAmount,
                      totalWithTax: taxInfo.totalWithTax,
                      finalTotal: finalTotal
                    })
                    
                    return (
                      <>
                        {/* Ara Toplam (KDV Hariç) */}
                        <div className="flex justify-between text-sm">
                          <span>Ara Toplam (KDV Hariç)</span>
                          <span>{formatPrice(taxInfo.priceBeforeTax)}</span>
                        </div>
                        
                        {/* KDV */}
                        <div className="flex justify-between text-sm">
                          <span>KDV (%{taxInfo.taxRate})</span>
                          <span>{formatPrice(taxInfo.taxAmount)}</span>
                        </div>
                        
                        {/* KDV Dahil Fiyat */}
                        <div className="flex justify-between text-sm font-medium">
                          <span>Ara Toplam (KDV Dahil)</span>
                          <span>{formatPrice(taxInfo.totalWithTax)}</span>
                        </div>
                        
                        <Separator />
                        
                        {/* Kargo Bilgisi */}
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-green-600" />
                            <span>Kargo</span>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              ÜCRETSİZ
                            </Badge>
                          </div>
                          <span className="text-green-600 font-medium">
                            Ücretsiz
                          </span>
                        </div>
                        
                        {isPromoApplied && (
                          <div className="flex justify-between text-green-600 text-sm">
                            <span>Promosyon İndirimi</span>
                            <span>-{formatPrice(finalTotal * 0.1)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        {/* Son Toplam */}
                        <div className="flex justify-between text-lg font-bold">
                          <span>Toplam</span>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatPrice(isPromoApplied ? finalTotal * 0.9 : finalTotal)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              KDV ve kargo dahil
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>

                <Separator />

                {/* Güven Göstergeleri */}
                <div className="space-y-2">
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
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  Ödemeye Geç
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/urunler">
                    <ArrowLeft className="h-4 w-4 mr-2" />
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