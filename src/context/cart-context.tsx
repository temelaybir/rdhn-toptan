'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { Cart, CartItem, CartContextType, CartItemVariant } from '@/types/cart'
import type { Product } from '@/types/admin/product'

// Cart Actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_NOTES'; payload: { id: string; notes: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'REFRESH_PRICES' }

// Cart State
interface CartState {
  cart: Cart
  isOpen: boolean
  isLoading: boolean
}

const initialState: CartState = {
  cart: {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    subtotal: 0,
    currency: 'TRY',
    lastUpdated: new Date()
  },
  isOpen: false,
  isLoading: false
}

// Helper functions
const calculateCartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.product.price || 0
    const variantPrice = item.variant?.priceModifier || 0
    const itemPrice = basePrice + variantPrice
    return sum + (itemPrice * item.quantity)
  }, 0)
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  
  return {
    subtotal,
    totalItems,
    totalPrice: subtotal, // Shipping ve tax hesapları context dışında yapılacak
  }
}

const generateCartItemId = (productId: string, variantId?: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `cart_${productId}_${variantId || 'default'}_${timestamp}_${random}`
}

// Cart Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload }
    
    case 'SET_CART':
      return { ...state, cart: action.payload }
    
    case 'ADD_ITEM': {
      const newItem = action.payload
      const existingItemIndex = state.cart.items.findIndex(
        item => item.productId === newItem.productId && 
                JSON.stringify(item.variant) === JSON.stringify(newItem.variant)
      )
      
      let updatedItems: CartItem[]
      
      if (existingItemIndex > -1) {
        // Mevcut ürünü güncelle
        const existingItem = state.cart.items[existingItemIndex]
        const newQuantity = Math.min(
          existingItem.quantity + newItem.quantity,
          newItem.maxQuantity || existingItem.product.stock || 999
        )
        
        updatedItems = state.cart.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        // Yeni ürün ekle
        updatedItems = [...state.cart.items, newItem]
      }
      
      const totals = calculateCartTotals(updatedItems)
      
      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          ...totals,
          lastUpdated: new Date()
        }
      }
    }
    
    case 'UPDATE_ITEM': {
      const { id, quantity } = action.payload
      const safeQuantity = Math.max(0, Math.floor(quantity))
      
      const updatedItems = safeQuantity <= 0 
        ? state.cart.items.filter(item => item.id !== id)
        : state.cart.items.map(item => 
            item.id === id ? { ...item, quantity: safeQuantity } : item
          )
      
      const totals = calculateCartTotals(updatedItems)
      
      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          ...totals,
          lastUpdated: new Date()
        }
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.cart.items.filter(item => item.id !== action.payload)
      const totals = calculateCartTotals(updatedItems)
      
      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          ...totals,
          lastUpdated: new Date()
        }
      }
    }
    
    case 'UPDATE_NOTES': {
      const { id, notes } = action.payload
      const updatedItems = state.cart.items.map(item =>
        item.id === id ? { ...item, notes } : item
      )
      
      return {
        ...state,
        cart: {
          ...state.cart,
          items: updatedItems,
          lastUpdated: new Date()
        }
      }
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: {
          ...initialState.cart,
          lastUpdated: new Date()
        }
      }
    
    case 'REFRESH_PRICES': {
      // Fiyatları yenile (API'den güncel fiyatları al)
      const totals = calculateCartTotals(state.cart.items)
      return {
        ...state,
        cart: {
          ...state.cart,
          ...totals,
          lastUpdated: new Date()
        }
      }
    }
    
    default:
      return state
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider Component
interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // LocalStorage'dan sepeti yükle + Migration
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('rdhn-commerce-cart')
      if (savedCart) {
        const cart = JSON.parse(savedCart)
        
        // Migration: Eski number-based product ID'leri kontrol et
        if (cart && typeof cart === 'object' && Array.isArray(cart.items)) {
          const hasOldNumberIds = cart.items.some((item: any) => 
            typeof item.productId === 'number' || 
            (item.product && typeof item.product.id === 'number')
          )
          
          if (hasOldNumberIds) {
            console.log('🔄 Eski sepet formatı tespit edildi (number ID), temizleniyor...')
            localStorage.removeItem('rdhn-commerce-cart')
            toast.info('Sepetiniz güncellendi. Lütfen ürünleri tekrar ekleyin.', {
              duration: 6000,
              description: 'Sistemimiz UUID formatına geçti.'
            })
            return // Eski sepeti yükleme
          }
          
          // Date'leri restore et
          const restoredCart = {
            ...cart,
            lastUpdated: new Date(cart.lastUpdated || Date.now()),
            items: cart.items.map((item: any) => ({
              ...item,
              addedAt: new Date(item.addedAt || Date.now())
            }))
          }
          dispatch({ type: 'SET_CART', payload: restoredCart })
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      localStorage.removeItem('rdhn-commerce-cart')
    }
  }, [])

  // Sepet değişikliklerini localStorage'a kaydet
  useEffect(() => {
    try {
      if (state.cart && Array.isArray(state.cart.items)) {
        localStorage.setItem('rdhn-commerce-cart', JSON.stringify(state.cart))
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [state.cart])

  // Cart visibility controls
  const openCart = () => {
    dispatch({ type: 'SET_CART_OPEN', payload: true })
  }

  const closeCart = () => {
    dispatch({ type: 'SET_CART_OPEN', payload: false })
  }

  const toggleCart = () => {
    dispatch({ type: 'SET_CART_OPEN', payload: !state.isOpen })
  }

  // Core cart operations
  const addToCart = async (product: Product, quantity = 1, variant?: CartItemVariant) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Validation
      if (!product || !product.id) {
        throw new Error('Geçersiz ürün')
      }
      
      const safeQuantity = Math.max(1, Math.floor(quantity))
      const maxQuantity = product.stockQuantity || 999
      
      if (safeQuantity > maxQuantity) {
        toast.error(`En fazla ${maxQuantity} adet ekleyebilirsiniz`)
        return
      }
      
      // Create cart item
      const cartItemId = generateCartItemId(product.id, variant?.id)
      const cartItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images.map(img => typeof img === 'string' ? img : img.url),
          slug: product.slug,
          stockQuantity: product.stockQuantity,
          sku: product.sku,
          tags: product.tags,
          shipping: product.shipping ? { isOversized: product.shipping.isOversized } : undefined
        },
        quantity: safeQuantity,
        addedAt: new Date(),
        variant,
        maxQuantity: maxQuantity
      }
      
      dispatch({ type: 'ADD_ITEM', payload: cartItem })
      
      // Success message
      openCart()
      toast.success(`${product.name} sepete eklendi`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ürün sepete eklenirken hata oluştu')
      console.error('Error adding to cart:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const safeQuantity = Math.max(0, Math.floor(quantity))
      dispatch({ type: 'UPDATE_ITEM', payload: { id: cartItemId, quantity: safeQuantity } })
      
      if (safeQuantity <= 0) {
        toast.success('Ürün sepetten kaldırıldı')
      }
    } catch (error) {
      toast.error('Miktar güncellenirken hata oluştu')
      console.error('Error updating quantity:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const removeFromCart = async (cartItemId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      dispatch({ type: 'REMOVE_ITEM', payload: cartItemId })
      toast.success('Ürün sepetten kaldırıldı')
    } catch (error) {
      toast.error('Ürün kaldırılırken hata oluştu')
      console.error('Error removing from cart:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const clearCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      dispatch({ type: 'CLEAR_CART' })
      toast.success('Sepet temizlendi')
    } catch (error) {
      toast.error('Sepet temizlenirken hata oluştu')
      console.error('Error clearing cart:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Product utilities
  const isInCart = (productId: string): boolean => {
    return state.cart.items.some(item => item.productId === productId)
  }

  const getCartItem = (productId: string): CartItem | undefined => {
    return state.cart.items.find(item => item.productId === productId)
  }

  const canAddToCart = (productId: string, requestedQty: number): boolean => {
    const existingItem = getCartItem(productId)
    const currentQty = existingItem?.quantity || 0
    const maxStock = existingItem?.product.stockQuantity || 999
    
    return (currentQty + requestedQty) <= maxStock
  }

  const getCartItemById = (cartItemId: string): CartItem | undefined => {
    return state.cart.items.find(item => item.id === cartItemId)
  }

  // Computed values
  const getTotalPrice = (): number => {
    return state.cart.totalPrice
  }

  const getTotalItems = (): number => {
    return state.cart.totalItems
  }

  const getSubtotal = (): number => {
    return state.cart.subtotal
  }

  const getShippingCost = (): number => {
    // 🚚 Tüm ürünlerde ücretsiz kargo!
    return 0
  }

  const getTax = (): number => {
    // ⚠️ ÜRÜN FİYATLARI ZATEN KDV DAHİL!
    // KDV tutarı = KDV dahil fiyat - KDV hariç fiyat
    // KDV hariç fiyat = KDV dahil fiyat / 1.2
    const priceWithoutTax = state.cart.subtotal / 1.2
    return state.cart.subtotal - priceWithoutTax
  }

  const getTaxInclusivePrice = (): number => {
    // ⚠️ ÜRÜN FİYATLARI ZATEN KDV DAHİL!
    // Subtotal zaten KDV dahil fiyat
    return state.cart.subtotal
  }

  const getFinalTotal = (): number => {
    // Son toplam (Ürünler zaten KDV dahil + Kargo)
    return getTaxInclusivePrice() + getShippingCost()
  }

  const getShippingInfo = () => {
    return {
      cost: 0,
      isFree: true,
      freeShippingLimit: 0,
      remainingForFreeShipping: 0,
      hasBigProduct: false
    }
  }

  const getTaxInfo = () => {
    const totalWithTax = state.cart.subtotal // Ürün fiyatları zaten KDV dahil
    const taxRate = 0.20 // %20
    const priceBeforeTax = totalWithTax / (1 + taxRate) // KDV hariç fiyat
    const taxAmount = totalWithTax - priceBeforeTax // KDV tutarı
    
    return {
      subtotal: totalWithTax, // KDV dahil toplam (ürünler)
      taxAmount, // KDV tutarı
      taxRate: taxRate * 100, // Yüzde olarak (20)
      totalWithTax, // KDV dahil toplam
      priceBeforeTax // KDV hariç fiyat
    }
  }

  // Utility operations
  const updateNotes = async (cartItemId: string, notes: string) => {
    try {
      dispatch({ type: 'UPDATE_NOTES', payload: { id: cartItemId, notes } })
    } catch (error) {
      toast.error('Not güncellenirken hata oluştu')
      console.error('Error updating notes:', error)
    }
  }

  const validateCart = async (): Promise<boolean> => {
    try {
      // Stok kontrolü ve fiyat doğrulaması
      let hasErrors = false
      
      for (const item of state.cart.items) {
        // Stok kontrolü (gerçek uygulamada API'den kontrol edilir)
        if (item.quantity > (item.product.stock || 0)) {
          toast.error(`${item.product.name} için yeterli stok yok`)
          hasErrors = true
        }
      }
      
      return !hasErrors
    } catch (error) {
      console.error('Error validating cart:', error)
      return false
    }
  }

  const refreshPrices = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Gerçek uygulamada API'den güncel fiyatları al
      dispatch({ type: 'REFRESH_PRICES' })
    } catch (error) {
      toast.error('Fiyatlar güncellenirken hata oluştu')
      console.error('Error refreshing prices:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const contextValue: CartContextType = {
    // State
    cart: state.cart,
    isOpen: state.isOpen,
    isLoading: state.isLoading,
    
    // Cart visibility controls
    openCart,
    closeCart,
    toggleCart,
    
    // Core cart operations
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    
    // Product utilities
    isInCart,
    getCartItem,
    canAddToCart,
    getCartItemById,
    
    // Computed values
    getTotalPrice,
    getTotalItems,
    getSubtotal,
    getShippingCost,
    getTax,
    getTaxInclusivePrice,
    getFinalTotal,
    getShippingInfo,
    getTaxInfo,
    
    // Utility operations
    updateNotes,
    validateCart,
    refreshPrices
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

// Hook
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export { CartContext }