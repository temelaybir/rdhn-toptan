import type { Product } from '@/data/mock-products'

// Cart Item Variant for product customization
export interface CartItemVariant {
  id: string
  title: string
  options: Record<string, string>
  priceModifier?: number // Additional cost for variant
  isBigProduct?: boolean // Büyük ürün flag'i
}

// Enhanced CartItem with embedded product data
export interface CartItem {
  id: string                    // Cart item UUID (string kalacak)
  productId: number             // Product reference (number oldu)
  product: {                    // Embedded product data
    id: number
    name: string
    price: number
    image_url: string
    images: string[]
    slug?: string
    stock: number
    brand?: string
    tags?: string[]
    shipping?: {
      isOversized?: boolean
    }
  }
  quantity: number
  addedAt: Date
  variant?: CartItemVariant
  maxQuantity?: number
  notes?: string
}

// Enhanced Cart with computed values
export interface Cart {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  subtotal: number
  currency: string
  lastUpdated: Date
}

// Comprehensive Cart Context Type
export interface CartContextType {
  // State
  cart: Cart
  isOpen: boolean
  isLoading: boolean
  
  // Cart visibility controls
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  
  // Core cart operations
  addToCart: (product: Product, quantity?: number, variant?: CartItemVariant) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>        // Cart item ID
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  
  // Product utilities with number product IDs
  isInCart: (productId: number) => boolean
  getCartItem: (productId: number) => CartItem | undefined
  canAddToCart: (productId: number, requestedQty: number) => boolean
  getCartItemById: (cartItemId: string) => CartItem | undefined
  
  // Computed values
  getTotalPrice: () => number
  getTotalItems: () => number
  getSubtotal: () => number
  getShippingCost: () => number
  getTax: () => number
  getTaxInclusivePrice: () => number
  getFinalTotal: () => number
  getShippingInfo: () => {
    cost: number
    isFree: boolean
    freeShippingLimit: number
    remainingForFreeShipping: number
    hasBigProduct: boolean
  }
  getTaxInfo: () => {
    subtotal: number
    taxAmount: number
    taxRate: number
    totalWithTax: number
    priceBeforeTax: number
  }
  
  // Utility operations
  updateNotes: (cartItemId: string, notes: string) => Promise<void>
  validateCart: () => Promise<boolean>
  refreshPrices: () => Promise<void>
}