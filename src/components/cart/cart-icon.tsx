'use client'

import React, { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCart } from '@/context/cart-context'

interface CartIconProps {
  onClick?: () => void
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function CartIcon({ 
  onClick, 
  variant = 'ghost', 
  size = 'icon',
  className 
}: CartIconProps) {
  const { cart } = useCart()
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevTotalItems, setPrevTotalItems] = useState(cart.totalItems)

  // Sepet değiştiğinde animasyon tetikle
  useEffect(() => {
    if (cart.totalItems > prevTotalItems) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevTotalItems(cart.totalItems)
  }, [cart.totalItems, prevTotalItems])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(
        "relative transition-all duration-200",
        isAnimating && "scale-105",
        className
      )}
      aria-label={`Sepet - ${cart.totalItems || 0} ürün`}
      title={`Sepet - ${cart.totalItems || 0} ürün`}
    >
      <div className="relative">
        <ShoppingBag 
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            isAnimating && "scale-110"
          )} 
        />
        
        {/* Item Count Badge */}
        {cart.totalItems > 0 && (
          <Badge
            variant="destructive"
            className={cn(
              "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold",
              "animate-in fade-in zoom-in duration-200",
              isAnimating && "animate-bounce"
            )}
          >
            {cart.totalItems > 99 ? '99+' : cart.totalItems}
          </Badge>
        )}
      </div>
      
      {/* Ripple effect on click */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-md border-2 border-primary animate-ping opacity-75" />
      )}
    </Button>
  )
}

// Export default
export default CartIcon