import type { Product } from '@/types/admin/product'

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
  productId: string             // Product reference (UUID string)
  product: {                    // Embedded product data (simplified from Product type)
    id: string                  // UUID string
    name: string
    price: number               // 1 paket fiyatı (toptan ürünlerde)
    images: string[]
    slug: string
    stockQuantity: number       // Product type'daki isim
    sku: string | null
    tags?: string[]
    shipping?: {
      isOversized?: boolean
    }
    // Toptan satış bilgileri
    packageQuantity?: number    // Bir pakette kaç adet var
    packageUnit?: string        // Paket birimi (adet, paket, koli)
    isWholesale?: boolean       // Toptan ürün mü?
  }
  quantity: number              // Paket adedi (toptan ürünlerde)
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
  
  // Product utilities with string product IDs (UUID)
  isInCart: (productId: string) => boolean
  getCartItem: (productId: string) => CartItem | undefined
  canAddToCart: (productId: string, requestedQty: number) => boolean
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