'use client'

import React, { useEffect, useState } from 'react'
import { ShoppingCart, Package, CreditCard, Truck, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCart } from '@/context/cart-context'
import { useCurrency } from '@/context/currency-context'
import Link from 'next/link'

interface EnhancedCartIconProps {
  onClick?: () => void
  variant?: 'default' | 'large' | 'minimal' | 'icon'
  showDropdown?: boolean
  className?: string
}

export function EnhancedCartIcon({ 
  onClick, 
  variant = 'default',
  showDropdown = false,
  className 
}: EnhancedCartIconProps) {
  const { cart } = useCart()
  const { formatPrice } = useCurrency()
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevTotalItems, setPrevTotalItems] = useState(cart.totalItems)
  const [showQuickView, setShowQuickView] = useState(false)

  // Sepet değiştiğinde animasyon tetikle
  useEffect(() => {
    if (cart.totalItems > prevTotalItems) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevTotalItems(cart.totalItems)
  }, [cart.totalItems, prevTotalItems])

  // Minimal variant için basit görünüm
  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn("relative", className)}
        aria-label={`Sepet - ${cart.totalItems || 0} ürün`}
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.totalItems > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              "absolute flex items-center justify-center p-0 text-xs font-bold",
              "-top-2 -right-2 h-6 w-6 md:-top-2 md:-right-2", // Desktop position
              "sm:-bottom-1 sm:-right-1 sm:h-4 sm:w-4 sm:text-[10px]" // Mobile position - alt sağ
            )}
          >
            {cart.totalItems > 99 ? '99+' : cart.totalItems}
          </Badge>
        )}
      </Button>
    )
  }

  // Icon only variant
  if (variant === 'icon') {
    const ButtonContent = (
      <div className="relative">
        <ShoppingCart 
          className={cn(
            "transition-transform duration-200",
            variant === 'large' ? 'h-8 w-8' : 'h-6 w-6',
            variant !== 'icon' && 'mr-2',
            isAnimating && 'scale-110'
          )} 
        />
        
        {/* Item Count Badge */}
        {cart.totalItems > 0 && (
          <Badge
            variant={variant === 'large' ? 'secondary' : 'destructive'}
            className={cn(
              "absolute flex items-center justify-center p-0 text-xs font-bold",
              "animate-in fade-in zoom-in duration-200",
              "-top-2 -right-2 h-6 w-6 md:-top-2 md:-right-2", // Desktop position
              "sm:-bottom-1 sm:-right-1 sm:h-4 sm:w-4 sm:text-[10px]", // Mobile position - alt sağ
              variant === 'large' && 'bg-background text-primary border-2 border-primary',
              isAnimating && 'animate-bounce'
            )}
          >
            {cart.totalItems > 99 ? '99+' : cart.totalItems}
          </Badge>
        )}
      </div>
    )

    if (onClick) {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn("relative transition-all duration-200", className)}
          aria-label={`Sepet - ${cart.totalItems || 0} ürün`}
        >
          {ButtonContent}
        </Button>
      )
    }

    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative transition-all duration-200", className)}
        aria-label={`Sepet - ${cart.totalItems || 0} ürün`}
        asChild
      >
        <Link href="/sepet">
          {ButtonContent}
        </Link>
      </Button>
    )
  }

  // Calculate total price for display
  const totalPrice = cart.items.reduce((sum, item) => sum + ((item.product.price || 0) * item.quantity), 0)

  // Large variant ile detaylı görünüm
  if (variant === 'large') {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={onClick}
          onMouseEnter={() => setShowQuickView(true)}
          onMouseLeave={() => setShowQuickView(false)}
          className={cn(
            "relative p-4 h-auto flex-col gap-2 min-w-[120px]",
            isAnimating && "scale-105 shadow-lg",
            className
          )}
        >
          <div className="relative">
            <ShoppingCart className="h-8 w-8 text-primary" />
            {cart.totalItems > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground border-2 border-background"
              >
                {cart.totalItems > 99 ? '99+' : cart.totalItems}
              </Badge>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium">
              {cart.totalItems || 0} Ürün
            </div>
            <div className="text-xs text-muted-foreground">
              {formatPrice(totalPrice)}
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-1 mt-1">
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-100" />
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-200" />
          </div>
        </Button>

        {/* Quick view dropdown */}
        {showDropdown && showQuickView && cart.items.length > 0 && (
          <Card className="absolute top-full right-0 mt-2 w-80 z-50 shadow-xl">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Sepetiniz</h3>
                  <Badge variant="secondary">{cart.totalItems} ürün</Badge>
                </div>
                
                {/* İlk 3 ürünü göster */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                      <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatPrice(item.product.price || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {cart.items.length > 3 && (
                    <div className="text-center text-xs text-muted-foreground py-2">
                      +{cart.items.length - 3} ürün daha
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Toplam:</span>
                    <span className="font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Ödeme
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Truck className="w-3 h-3 mr-1" />
                      Kargo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 transition-all duration-200",
        isAnimating && "scale-105",
        className
      )}
      aria-label={`Sepet - ${cart.totalItems || 0} ürün`}
    >
      <div className="relative">
        <ShoppingCart 
          className={cn(
            "transition-transform duration-200",
            "h-5 w-5",
            isAnimating && 'scale-110'
          )} 
        />
        
        {/* Item Count Badge */}
        {cart.totalItems > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold",
              "animate-in fade-in zoom-in duration-200",
              isAnimating && 'animate-bounce'
            )}
          >
            {cart.totalItems > 99 ? '99+' : cart.totalItems}
          </Badge>
        )}
      </div>
      
      {/* Text content */}
      <div className="hidden sm:flex flex-col items-start">
        <span className="text-xs text-muted-foreground">Sepetim</span>
        <span className="text-sm font-medium">
          {cart.totalItems ? `${cart.totalItems} ürün` : 'Boş'}
        </span>
      </div>
      
      {/* Price display */}
      {totalPrice > 0 && (
        <div className="hidden md:flex items-center gap-1">
          <span className="text-sm font-bold text-primary">
            {formatPrice(totalPrice)}
          </span>
          <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      
      {/* Ripple effect on click */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-md border-2 border-primary animate-ping opacity-75" />
      )}
    </Button>
  )
}

// Enhanced Cart Button with Price Display
export function CartButton() {
  const { cart, toggleCart, isOpen } = useCart()
  const { formatPrice } = useCurrency()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 h-auto">
        <ShoppingCart className="h-5 w-5 mr-2" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">Sepet</span>
          <span className="text-xs opacity-90">{formatPrice(0)}</span>
        </div>
      </Button>
    )
  }

  const totalPrice = cart.items.reduce((sum, item) => sum + ((item.product.price || 0) * item.quantity), 0)

  return (
    <Button
      onClick={toggleCart}
      className={cn(
        "bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 h-auto relative transition-all duration-200",
        "hover:scale-105 active:scale-95",
        isOpen && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="relative mr-3">
        <ShoppingCart className="h-5 w-5" />
        {cart.totalItems > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-background text-primary border-2 border-background"
          >
            {cart.totalItems > 99 ? '99+' : cart.totalItems}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">
          Sepet {cart.totalItems > 0 && `(${cart.totalItems})`}
        </span>
        <span className="text-xs opacity-90">
          {formatPrice(totalPrice)}
        </span>
      </div>
    </Button>
  )
}