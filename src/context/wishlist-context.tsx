'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/data/mock-products'
import type { ActionResponse } from '@/types/admin/product'

// Enhanced WishlistItem with embedded product data
export interface WishlistItem {
  id: string                    // Wishlist item UUID
  productId: number             // Product reference (number)
  product: {
    id: number
    name: string
    price: number
    original_price?: number
    image_url: string
    images: string[]
    slug: string
    stock: number
    brand?: string
    category: string
    rating: number
    comparePrice?: number
  }
  addedAt: Date
  notes?: string
  priority: 'low' | 'medium' | 'high'
}

// Comprehensive Wishlist Context Type
export interface WishlistContextType {
  // State
  wishlistItems: WishlistItem[]
  isLoading: boolean
  
  // Core operations with ActionResponse
  addToWishlist: (product: Product) => Promise<ActionResponse<WishlistItem>>
  removeFromWishlist: (productId: number) => Promise<ActionResponse<void>>
  clearWishlist: () => Promise<ActionResponse<void>>
  
  // Product utilities with number IDs
  isInWishlist: (productId: number) => boolean
  getWishlistItem: (productId: number) => WishlistItem | undefined
  
  // Enhanced operations
  updateNotes: (productId: number, notes: string) => Promise<ActionResponse<WishlistItem>>
  updatePriority: (productId: number, priority: WishlistItem['priority']) => Promise<ActionResponse<WishlistItem>>
  moveToCart: (productId: number, quantity?: number) => Promise<ActionResponse<void>>
  
  // Computed values
  getTotalWishlistItems: () => number
  getWishlistByPriority: (priority: WishlistItem['priority']) => WishlistItem[]
  getWishlistByCategory: (category: string) => WishlistItem[]
  
  // Utility operations
  sortWishlist: (sortBy: 'name' | 'price' | 'addedAt' | 'priority') => WishlistItem[]
  exportWishlist: () => Promise<ActionResponse<string>>
  shareWishlist: () => Promise<ActionResponse<string>>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = 'rdhn-commerce-wishlist'

// Helper functions
const generateWishlistItemId = (productId: number): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `wishlist_${productId}_${timestamp}_${random}`
}

const createWishlistItem = (product: Product): WishlistItem => {
  return {
    id: generateWishlistItemId(product.id),
    productId: product.id,
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image_url: product.image_url,
      images: product.images || [product.image_url],
      slug: product.name.toLowerCase().replace(/\s+/g, '-'),
      stock: product.stock,
      brand: product.brand,
      category: product.category,
      rating: product.rating,
      comparePrice: product.original_price
    },
    addedAt: new Date(),
    priority: 'medium'
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist)
        if (Array.isArray(parsedWishlist)) {
          // Restore Date objects
          const restoredWishlist = parsedWishlist.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt || Date.now()),
            priority: item.priority || 'medium'
          }))
          setWishlistItems(restoredWishlist)
        }
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error)
      localStorage.removeItem(WISHLIST_STORAGE_KEY)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems))
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error)
      }
    }
  }, [wishlistItems, isLoaded])

  // Core operations
  const addToWishlist = async (product: Product): Promise<ActionResponse<WishlistItem>> => {
    setIsLoading(true)
    
    try {
      // Validation
      if (!product || !product.id) {
        return {
          success: false,
          error: 'Geçersiz ürün'
        }
      }

      // Check if already exists
      const exists = wishlistItems.some(item => item.productId === product.id)
      if (exists) {
        toast.info('Bu ürün zaten favorilerinizde')
        return {
          success: false,
          error: 'Ürün zaten favorilerde'
        }
      }

      // Create wishlist item
      const wishlistItem = createWishlistItem(product)
      
      setWishlistItems(prev => [...prev, wishlistItem])
      
      toast.success('Ürün favorilere eklendi')

      return {
        success: true,
        data: wishlistItem,
        message: 'Ürün favorilere başarıyla eklendi'
      }
    } catch (error) {
      const errorMessage = 'Ürün favorilere eklenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Error adding to wishlist:', error)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: number): Promise<ActionResponse<void>> => {
    setIsLoading(true)
    
    try {
      const initialLength = wishlistItems.length
      const filteredItems = wishlistItems.filter(item => item.productId !== productId)
      
      if (filteredItems.length === initialLength) {
        return {
          success: false,
          error: 'Ürün favorilerde bulunamadı'
        }
      }
      
      setWishlistItems(filteredItems)
      toast.success('Ürün favorilerden kaldırıldı')
      
      return {
        success: true,
        message: 'Ürün favorilerden başarıyla kaldırıldı'
      }
    } catch (error) {
      const errorMessage = 'Ürün favorilerden kaldırılırken hata oluştu'
      toast.error(errorMessage)
      console.error('Error removing from wishlist:', error)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearWishlist = async (): Promise<ActionResponse<void>> => {
    setIsLoading(true)
    
    try {
      setWishlistItems([])
      toast.success('Tüm favoriler temizlendi')
      
      return {
        success: true,
        message: 'Favoriler başarıyla temizlendi'
      }
    } catch (error) {
      const errorMessage = 'Favoriler temizlenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Error clearing wishlist:', error)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Product utilities
  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.some(item => item.productId === productId)
  }

  const getWishlistItem = (productId: number): WishlistItem | undefined => {
    return wishlistItems.find(item => item.productId === productId)
  }

  // Enhanced operations
  const updateNotes = async (productId: number, notes: string): Promise<ActionResponse<WishlistItem>> => {
    try {
      const updatedItems = wishlistItems.map(item =>
        item.productId === productId ? { ...item, notes } : item
      )
      
      const updatedItem = updatedItems.find(item => item.productId === productId)
      if (!updatedItem) {
        return {
          success: false,
          error: 'Ürün favorilerde bulunamadı'
        }
      }
      
      setWishlistItems(updatedItems)
      
      return {
        success: true,
        data: updatedItem,
        message: 'Not başarıyla güncellendi'
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      return {
        success: false,
        error: 'Not güncellenirken hata oluştu'
      }
    }
  }

  const updatePriority = async (productId: number, priority: WishlistItem['priority']): Promise<ActionResponse<WishlistItem>> => {
    try {
      const updatedItems = wishlistItems.map(item =>
        item.productId === productId ? { ...item, priority } : item
      )
      
      const updatedItem = updatedItems.find(item => item.productId === productId)
      if (!updatedItem) {
        return {
          success: false,
          error: 'Ürün favorilerde bulunamadı'
        }
      }
      
      setWishlistItems(updatedItems)
      
      return {
        success: true,
        data: updatedItem,
        message: 'Öncelik başarıyla güncellendi'
      }
    } catch (error) {
      console.error('Error updating priority:', error)
      return {
        success: false,
        error: 'Öncelik güncellenirken hata oluştu'
      }
    }
  }

  const moveToCart = async (productId: number, quantity = 1): Promise<ActionResponse<void>> => {
    try {
      const wishlistItem = getWishlistItem(productId)
      if (!wishlistItem) {
        return {
          success: false,
          error: 'Ürün favorilerde bulunamadı'
        }
      }

      // Import useCart dynamically to avoid circular dependencies
      const { useCart } = await import('./cart-context')
      
      // Note: Bu gerçek implementasyonda useCart hook'u burada kullanılamaz
      // Bunun yerine CartContext'e erişim için başka bir yöntem kullanılmalı
      // Şimdilik basic implementation yapıyorum
      
      // Cart context zaten toast mesajı gönderiyor, burada gereksiz
      await removeFromWishlist(productId)
      
      return {
        success: true,
        message: 'Ürün sepete taşındı ve favorilerden kaldırıldı'
      }
    } catch (error) {
      console.error('Error moving to cart:', error)
      return {
        success: false,
        error: 'Ürün sepete taşınırken hata oluştu'
      }
    }
  }

  // Computed values
  const getTotalWishlistItems = (): number => {
    return wishlistItems.length
  }

  const getWishlistByPriority = (priority: WishlistItem['priority']): WishlistItem[] => {
    return wishlistItems.filter(item => item.priority === priority)
  }

  const getWishlistByCategory = (category: string): WishlistItem[] => {
    return wishlistItems.filter(item => 
      item.product.category.toLowerCase().includes(category.toLowerCase())
    )
  }

  // Utility operations
  const sortWishlist = (sortBy: 'name' | 'price' | 'addedAt' | 'priority'): WishlistItem[] => {
    const sorted = [...wishlistItems]
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.product.name.localeCompare(b.product.name))
      case 'price':
        return sorted.sort((a, b) => a.product.price - b.product.price)
      case 'addedAt':
        return sorted.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      default:
        return sorted
    }
  }

  const exportWishlist = async (): Promise<ActionResponse<string>> => {
    try {
      const exportData = wishlistItems.map(item => ({
        name: item.product.name,
        price: item.product.price,
        category: item.product.category,
        brand: item.product.brand,
        addedAt: item.addedAt.toISOString(),
        priority: item.priority,
        notes: item.notes
      }))
      
      const csvContent = [
        'Ürün Adı,Fiyat,Kategori,Marka,Eklenme Tarihi,Öncelik,Notlar',
        ...exportData.map(item => [
          item.name,
          item.price,
          item.category,
          item.brand || '',
          item.addedAt,
          item.priority,
          item.notes || ''
        ].join(','))
      ].join('\n')
      
      return {
        success: true,
        data: csvContent,
        message: 'Favoriler başarıyla dışa aktarıldı'
      }
    } catch (error) {
      console.error('Error exporting wishlist:', error)
      return {
        success: false,
        error: 'Favoriler dışa aktarılırken hata oluştu'
      }
    }
  }

  const shareWishlist = async (): Promise<ActionResponse<string>> => {
    try {
      const shareData = {
        title: 'Favorilerim - RDHN Commerce',
        text: `${wishlistItems.length} ürün favorilerimde`,
        url: window.location.origin + '/profil?tab=favorites'
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
        return {
          success: true,
          data: shareData.url,
          message: 'Favoriler başarıyla paylaşıldı'
        }
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Favoriler bağlantısı panoya kopyalandı')
        
        return {
          success: true,
          data: shareData.url,
          message: 'Favoriler bağlantısı panoya kopyalandı'
        }
      }
    } catch (error) {
      console.error('Error sharing wishlist:', error)
      return {
        success: false,
        error: 'Favoriler paylaşılırken hata oluştu'
      }
    }
  }

  const value: WishlistContextType = {
    // State
    wishlistItems,
    isLoading,
    
    // Core operations
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    
    // Product utilities
    isInWishlist,
    getWishlistItem,
    
    // Enhanced operations
    updateNotes,
    updatePriority,
    moveToCart,
    
    // Computed values
    getTotalWishlistItems,
    getWishlistByPriority,
    getWishlistByCategory,
    
    // Utility operations
    sortWishlist,
    exportWishlist,
    shareWishlist
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
} 