'use client'

import { useState, useEffect } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/context/cart-context'
import { useCurrency } from '@/context/currency-context'
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Package,
  CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function MiniCart() {
  const { cart, isOpen, closeCart, updateQuantity, removeFromCart, clearCart } = useCart()
  const { formatPrice } = useCurrency()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    // NaN kontrolü ve güvenli sayı dönüşümü
    const safeQuantity = Number.isNaN(newQuantity) ? 0 : Math.max(0, Math.floor(newQuantity))
    
    if (safeQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      updateQuantity(itemId, safeQuantity)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeCart}
        />
      )}

      {/* Mini Cart Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                Sepetim ({cart.totalItems || 0})
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCart}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {!cart.items || cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sepetiniz Boş</h3>
                <p className="text-muted-foreground mb-4">
                  Alışverişe başlamak için ürün ekleyin
                </p>
                <Button onClick={closeCart}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Alışverişe Başla
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    <div className="relative w-16 h-16 bg-white rounded-md overflow-hidden flex-shrink-0">
                      <SafeImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-4 mb-1 line-clamp-2">
                        {item.product.name}
                      </h4>
                      
                      {/* Variant Info */}
                      {item.variant && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {Object.entries(item.variant.options).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price */}
                      <div className="text-sm font-semibold text-primary mb-2">
                        {formatPrice(item.product.price || 0)}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 0) - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item.id, (item.quantity || 0) + 1)}
                            disabled={item.maxQuantity ? (item.quantity || 0) >= item.maxQuantity : false}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                {cart.items.length > 0 && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCart}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Sepeti Temizle
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Cart Summary & Actions */}
          {cart.items && cart.items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Cart Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(cart.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Toplam</span>
                  <span>{formatPrice(cart.totalPrice || 0)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button asChild className="w-full" size="lg">
                  <Link href="/sepet" onClick={closeCart}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Sepeti Görüntüle
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/odeme" onClick={closeCart}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Hızlı Ödeme
                  </Link>
                </Button>
              </div>

              {/* Continue Shopping */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={closeCart}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Alışverişe devam et
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Component display name
MiniCart.displayName = 'MiniCart'