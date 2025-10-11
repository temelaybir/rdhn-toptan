'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/cart-context'
import { CartItemVariant } from '@/types/cart'
import { ShoppingCart, Plus, Check, Loader2, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  productId?: string  // New field for string product ID
  product?: {
    id: string | number  // Support both for compatibility
    name: string
    price: number
    image_url?: string
    slug?: string       // SEO-friendly URL slug
    stock?: number      // Keep for backward compatibility
    stock_quantity?: number  // New field
    brand?: string
    images?: string[] | Array<{url: string, alt: string, is_main: boolean}>
  }
  variant?: CartItemVariant
  quantity?: number
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  children?: React.ReactNode
}

export function AddToCartButton({
  productId,
  product,
  variant,
  quantity = 1,
  disabled = false,
  className,
  size = 'default',
  showIcon = true,
  children
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart, loading: cartLoading } = useCart()

  // Early return if no product data
  if (!product && !productId) {
    return null
  }

  // Create product object if only productId provided
  const productData = product || {
    id: productId!,
    name: 'Product',
    price: 0,
    stock_quantity: 999
  }

  const isLoading = cartLoading

  // Handle both stock and stock_quantity fields - MOVED BEFORE useCallback
  const stockQuantity = productData.stock_quantity ?? productData.stock ?? 999
  const isOutOfStock = stockQuantity <= 0

  const handleAddToCart = useCallback(async () => {
    if (disabled || isLoading || isAdding || !productData) return

    setIsAdding(true)
    try {
      // Create Product format for addToCart
      const productForCart = {
        id: typeof productData.id === 'string' ? productData.id : productData.id.toString(),
        name: productData.name,
        price: productData.price,
        image_url: productData.image_url || '/placeholder-product.svg',
        slug: productData.slug || (typeof productData.id === 'string' ? productData.id : productData.id.toString()),
        stock: stockQuantity,
        brand: productData.brand || '',
        images: Array.isArray(productData.images) 
          ? productData.images.map(img => typeof img === 'string' ? img : img.url)
          : [productData.image_url || '/placeholder-product.svg']
      }

      await addToCart(productForCart, quantity, variant)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }, [disabled, isLoading, isAdding, productData, quantity, variant, addToCart, stockQuantity])

  const buttonDisabled = disabled || isLoading || isAdding || isOutOfStock

  if (isOutOfStock) {
    return (
      <Button
        disabled
        className={cn(className)}
        size={size}
      >
        <X className={cn("h-4 w-4", showIcon && children && "mr-2")} />
        Stokta Yok
      </Button>
    )
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={buttonDisabled}
      className={cn(
        "btn-trendyol transition-all duration-200",
        isAdding && "bg-green-600 hover:bg-green-700",
        className
      )}
      size={size}
    >
      {isAdding ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", showIcon && children && "mr-2")} />
      ) : (
        <>
          {showIcon && <ShoppingCart className={cn("h-4 w-4", children && "mr-2")} />}
          {children}
        </>
      )}
      
      {children ? (
        children
      ) : isAdding ? (
        'Ekleniyor...'
      ) : (
        'Sepete Ekle'
      )}
    </Button>
  )
}

// Quick Add to Cart for product lists
interface QuickAddToCartProps {
  productId?: string
  product?: {
    id: string | number
    name: string
    price: number
    image_url?: string
    slug?: string
    stock?: number
    stock_quantity?: number
    brand?: string
    images?: string[] | Array<{url: string, alt: string, is_main: boolean}>
  }
  variant?: CartItemVariant
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function QuickAddToCart({ productId, product, variant, className, size = "sm" }: QuickAddToCartProps) {
  return (
    <AddToCartButton
      productId={productId}
      product={product}
      variant={variant}
      size={size}
      className={cn("w-full", className)}
    >
      <Plus className="h-3 w-3 mr-1" />
      Sepete Ekle
    </AddToCartButton>
  )
}

// Enhanced Add to Cart with quantity controls
interface EnhancedAddToCartProps {
  productId?: string
  product?: {
    id: string | number
    name: string
    price: number
    image_url?: string
    stock?: number
    stock_quantity?: number
    brand?: string
    images?: string[] | Array<{url: string, alt: string, is_main: boolean}>
  }
  variant?: CartItemVariant
  maxQuantity?: number
  className?: string
}

export function EnhancedAddToCart({ 
  productId,
  product, 
  variant, 
  maxQuantity, 
  className 
}: EnhancedAddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  
  // Early return if no product data
  if (!product && !productId) {
    return null
  }

  const productData = product || { id: productId!, name: 'Product', price: 0, stock_quantity: 999 }
  const stockQuantity = productData.stock_quantity ?? productData.stock ?? 999
  const max = maxQuantity || stockQuantity

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, Math.min(max, prev + change)))
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-1)}
          disabled={quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
          {quantity}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(1)}
          disabled={quantity >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <AddToCartButton
        product={productData}
        variant={variant}
        quantity={quantity}
        className="flex-1"
      />
    </div>
  )
}