'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import type { Address } from '@/types/checkout'
import type { ActionResponse } from '@/types/admin/product'

// Enhanced User Preferences
export interface UserPreferences {
  language: 'tr' | 'en'
  currency: 'TRY' | 'USD' | 'EUR'
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    marketing: boolean
  }
  privacy: {
    showProfile: boolean
    showOrders: boolean
    allowTracking: boolean
  }
}

// Enhanced Address with proper types
export interface EnhancedAddress extends Address {
  id: string
  userId: string
  type: 'billing' | 'shipping' | 'both'
  fullName: string
  phone: string
  email?: string
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Registration Data
export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  acceptTerms: boolean
  acceptMarketing?: boolean
}

// Enhanced Order with proper types
export interface Order {
  id: string
  orderNumber: string
  date: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  total: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  items: Array<{
    productId: number
    productName: string
    quantity: number
    price: number
    variant?: string
  }>
  deliveryAddress: EnhancedAddress
  billingAddress?: EnhancedAddress
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
}

// Enhanced User with stats and preferences
export interface User {
  id: string                    // Auth UUID (string kalacak)
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  emailVerified: boolean
  phoneVerified: boolean
  memberSince: string
  addresses: EnhancedAddress[]
  orders: Order[]
  preferences: UserPreferences
  stats: {
    orderCount: number
    totalSpent: number
    loyaltyPoints: number
    wishlistItems: number
    reviewsCount: number
    averageRating: number
  }
  subscription?: {
    type: 'basic' | 'premium' | 'vip'
    startDate: string
    endDate: string
    benefits: string[]
  }
}

// Comprehensive User Context Type
export interface UserContextType {
  // State
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  
  // Auth methods with ActionResponse
  login: (email: string, password: string) => Promise<ActionResponse<User>>
  register: (data: RegisterData) => Promise<ActionResponse<User>>
  logout: () => Promise<ActionResponse<void>>
  forgotPassword: (email: string) => Promise<ActionResponse<void>>
  resetPassword: (token: string, password: string) => Promise<ActionResponse<void>>
  verifyEmail: (token: string) => Promise<ActionResponse<void>>
  verifyPhone: (code: string) => Promise<ActionResponse<void>>
  
  // Profile methods
  updateProfile: (updates: Partial<User>) => Promise<ActionResponse<User>>
  uploadAvatar: (file: File) => Promise<ActionResponse<string>>
  deleteAvatar: () => Promise<ActionResponse<void>>
  changePassword: (currentPassword: string, newPassword: string) => Promise<ActionResponse<void>>
  
  // Address methods
  addAddress: (address: Omit<EnhancedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<ActionResponse<EnhancedAddress>>
  updateAddress: (id: string, updates: Partial<EnhancedAddress>) => Promise<ActionResponse<EnhancedAddress>>
  deleteAddress: (id: string) => Promise<ActionResponse<void>>
  setDefaultAddress: (id: string, type?: EnhancedAddress['type']) => Promise<ActionResponse<void>>
  
  // Preferences methods
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<ActionResponse<UserPreferences>>
  
  // Order methods
  getOrderHistory: (limit?: number, offset?: number) => Promise<ActionResponse<Order[]>>
  getOrder: (orderId: string) => Promise<ActionResponse<Order>>
  cancelOrder: (orderId: string, reason?: string) => Promise<ActionResponse<void>>
  
  // Utilities
  getDefaultAddress: (type?: EnhancedAddress['type']) => EnhancedAddress | undefined
  hasCompleteProfile: () => boolean
  canPlaceOrder: () => boolean
  getTotalSpent: () => number
  getLoyaltyLevel: () => 'bronze' | 'silver' | 'gold' | 'platinum'
  
  // Data management
  exportUserData: () => Promise<ActionResponse<string>>
  deleteAccount: (password: string) => Promise<ActionResponse<void>>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Default preferences
const defaultPreferences: UserPreferences = {
  language: 'tr',
  currency: 'TRY',
  theme: 'system',
  notifications: {
    email: true,
    sms: false,
    push: true,
    marketing: false
  },
  privacy: {
    showProfile: false,
    showOrders: false,
    allowTracking: false
  }
}

// Mock user data (enhanced)
const mockUser: User = {
  id: 'user_123456789',
  email: 'ahmet@example.com',
  firstName: 'Ahmet',
  lastName: 'Yılmaz',
  phone: '0555 123 45 67',
  avatar: undefined,
  emailVerified: true,
  phoneVerified: false,
  memberSince: '2023-01-15',
  addresses: [
    {
      id: 'addr_1',
      userId: 'user_123456789',
      type: 'both',
      fullName: 'Ahmet Yılmaz',
      phone: '0555 123 45 67',
      email: 'ahmet@example.com',
      addressLine1: 'Atatürk Mah. Cumhuriyet Cad. No: 123',
      addressLine2: 'Daire: 5',
      city: 'İstanbul',
      district: 'Kadıköy',
      postalCode: '34000',
      country: 'Türkiye',
      isDefault: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15')
    }
  ],
  orders: [],
  preferences: defaultPreferences,
  stats: {
    orderCount: 5,
    totalSpent: 2350.50,
    loyaltyPoints: 1175,
    wishlistItems: 12,
    reviewsCount: 3,
    averageRating: 4.7
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null) // Başlangıçta null
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('rdhn-commerce-user')
      const isUserLoggedIn = localStorage.getItem('rdhn-commerce-auth') === 'true'
      
      if (savedUser && isUserLoggedIn) {
        const userData = JSON.parse(savedUser)
        // Restore Date objects
        const restoredUser = {
          ...userData,
          addresses: userData.addresses?.map((addr: any) => ({
            ...addr,
            createdAt: new Date(addr.createdAt || Date.now()),
            updatedAt: new Date(addr.updatedAt || Date.now())
          })) || []
        }
        setUser(restoredUser)
        setIsLoggedIn(true)
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
      localStorage.removeItem('rdhn-commerce-user')
      localStorage.removeItem('rdhn-commerce-auth')
    }
  }, [])

  // Save user to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user && isLoggedIn) {
        localStorage.setItem('rdhn-commerce-user', JSON.stringify(user))
        localStorage.setItem('rdhn-commerce-auth', 'true')
      } else {
        localStorage.removeItem('rdhn-commerce-user')
        localStorage.removeItem('rdhn-commerce-auth')
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
    }
  }, [user, isLoggedIn])

  // Auth methods
  const login = async (email: string, password: string): Promise<ActionResponse<User>> => {
    setIsLoading(true)
    
    try {
      // Mock login validation
      if (email === 'ahmet@example.com' && password === '123456') {
        setUser(mockUser)
        setIsLoggedIn(true)
        toast.success('Başarıyla giriş yaptınız')
        
        return {
          success: true,
          data: mockUser,
          message: 'Giriş başarılı'
        }
      } else {
        return {
          success: false,
          error: 'Geçersiz email veya şifre'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Giriş yapılırken hata oluştu'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<ActionResponse<User>> => {
    setIsLoading(true)
    
    try {
      // Mock registration
      if (!data.acceptTerms) {
        return {
          success: false,
          error: 'Kullanım şartlarını kabul etmelisiniz'
        }
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        emailVerified: false,
        phoneVerified: false,
        memberSince: new Date().toISOString(),
        addresses: [],
        orders: [],
        preferences: defaultPreferences,
        stats: {
          orderCount: 0,
          totalSpent: 0,
          loyaltyPoints: 0,
          wishlistItems: 0,
          reviewsCount: 0,
          averageRating: 0
        }
      }

      setUser(newUser)
      setIsLoggedIn(true)
      toast.success('Hesabınız başarıyla oluşturuldu')

      return {
        success: true,
        data: newUser,
        message: 'Kayıt başarılı'
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Kayıt olunurken hata oluştu'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<ActionResponse<void>> => {
    try {
      setUser(null)
      setIsLoggedIn(false)
      toast.success('Başarıyla çıkış yaptınız')
      
      return {
        success: true,
        message: 'Çıkış başarılı'
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: 'Çıkış yapılırken hata oluştu'
      }
    }
  }

  const forgotPassword = async (email: string): Promise<ActionResponse<void>> => {
    try {
      // Mock forgot password
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Şifre sıfırlama bağlantısı email adresinize gönderildi')
      
      return {
        success: true,
        message: 'Şifre sıfırlama bağlantısı gönderildi'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Şifre sıfırlama bağlantısı gönderilirken hata oluştu'
      }
    }
  }

  const resetPassword = async (token: string, password: string): Promise<ActionResponse<void>> => {
    try {
      // Mock password reset
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Şifreniz başarıyla güncellendi')
      
      return {
        success: true,
        message: 'Şifre başarıyla güncellendi'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Şifre güncellenirken hata oluştu'
      }
    }
  }

  const verifyEmail = async (token: string): Promise<ActionResponse<void>> => {
    try {
      if (user) {
        setUser({ ...user, emailVerified: true })
        toast.success('Email adresiniz doğrulandı')
        
        return {
          success: true,
          message: 'Email doğrulama başarılı'
        }
      }
      
      return {
        success: false,
        error: 'Kullanıcı bulunamadı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Email doğrulanırken hata oluştu'
      }
    }
  }

  const verifyPhone = async (code: string): Promise<ActionResponse<void>> => {
    try {
      if (user) {
        setUser({ ...user, phoneVerified: true })
        toast.success('Telefon numaranız doğrulandı')
        
        return {
          success: true,
          message: 'Telefon doğrulama başarılı'
        }
      }
      
      return {
        success: false,
        error: 'Kullanıcı bulunamadı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Telefon doğrulanırken hata oluştu'
      }
    }
  }

  // Profile methods
  const updateProfile = async (updates: Partial<User>): Promise<ActionResponse<User>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      toast.success('Profil başarıyla güncellendi')

      return {
        success: true,
        data: updatedUser,
        message: 'Profil güncelleme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Profil güncellenirken hata oluştu'
      }
    }
  }

  const uploadAvatar = async (file: File): Promise<ActionResponse<string>> => {
    try {
      // Mock avatar upload
      const avatarUrl = URL.createObjectURL(file)
      
      if (user) {
        setUser({ ...user, avatar: avatarUrl })
        toast.success('Profil fotoğrafı güncellendi')
      }

      return {
        success: true,
        data: avatarUrl,
        message: 'Avatar yükleme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Avatar yüklenirken hata oluştu'
      }
    }
  }

  const deleteAvatar = async (): Promise<ActionResponse<void>> => {
    try {
      if (user) {
        setUser({ ...user, avatar: undefined })
        toast.success('Profil fotoğrafı kaldırıldı')
      }

      return {
        success: true,
        message: 'Avatar silme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Avatar silinirken hata oluştu'
      }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<ActionResponse<void>> => {
    try {
      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Şifreniz başarıyla değiştirildi')

      return {
        success: true,
        message: 'Şifre değiştirme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Şifre değiştirilirken hata oluştu'
      }
    }
  }

  // Address methods
  const addAddress = async (address: Omit<EnhancedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ActionResponse<EnhancedAddress>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const newAddress: EnhancedAddress = {
        ...address,
        id: `addr_${Date.now()}`,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedUser = {
        ...user,
        addresses: [...user.addresses, newAddress]
      }

      setUser(updatedUser)
      toast.success('Adres başarıyla eklendi')

      return {
        success: true,
        data: newAddress,
        message: 'Adres ekleme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Adres eklenirken hata oluştu'
      }
    }
  }

  const updateAddress = async (id: string, updates: Partial<EnhancedAddress>): Promise<ActionResponse<EnhancedAddress>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const addressIndex = user.addresses.findIndex(addr => addr.id === id)
      if (addressIndex === -1) {
        return {
          success: false,
          error: 'Adres bulunamadı'
        }
      }

      const updatedAddress = {
        ...user.addresses[addressIndex],
        ...updates,
        updatedAt: new Date()
      }

      const updatedAddresses = [...user.addresses]
      updatedAddresses[addressIndex] = updatedAddress

      setUser({
        ...user,
        addresses: updatedAddresses
      })

      toast.success('Adres başarıyla güncellendi')

      return {
        success: true,
        data: updatedAddress,
        message: 'Adres güncelleme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Adres güncellenirken hata oluştu'
      }
    }
  }

  const deleteAddress = async (id: string): Promise<ActionResponse<void>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const filteredAddresses = user.addresses.filter(addr => addr.id !== id)
      
      setUser({
        ...user,
        addresses: filteredAddresses
      })

      toast.success('Adres başarıyla silindi')

      return {
        success: true,
        message: 'Adres silme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Adres silinirken hata oluştu'
      }
    }
  }

  const setDefaultAddress = async (id: string, type?: EnhancedAddress['type']): Promise<ActionResponse<void>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const updatedAddresses = user.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
        ...(type && addr.id === id ? { type } : {})
      }))

      setUser({
        ...user,
        addresses: updatedAddresses
      })

      toast.success('Varsayılan adres güncellendi')

      return {
        success: true,
        message: 'Varsayılan adres ayarlama başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Varsayılan adres ayarlanırken hata oluştu'
      }
    }
  }

  // Preferences methods
  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<ActionResponse<UserPreferences>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const updatedPreferences = {
        ...user.preferences,
        ...updates
      }

      setUser({
        ...user,
        preferences: updatedPreferences
      })

      toast.success('Tercihler güncellendi')

      return {
        success: true,
        data: updatedPreferences,
        message: 'Tercih güncelleme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Tercihler güncellenirken hata oluştu'
      }
    }
  }

  // Order methods (mock implementations)
  const getOrderHistory = async (limit = 10, offset = 0): Promise<ActionResponse<Order[]>> => {
    try {
      // Mock order history
      const orders = user?.orders || []
      return {
        success: true,
        data: orders.slice(offset, offset + limit),
        message: 'Sipariş geçmişi alındı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Sipariş geçmişi alınırken hata oluştu'
      }
    }
  }

  const getOrder = async (orderId: string): Promise<ActionResponse<Order>> => {
    try {
      const order = user?.orders.find(o => o.id === orderId)
      if (!order) {
        return {
          success: false,
          error: 'Sipariş bulunamadı'
        }
      }

      return {
        success: true,
        data: order,
        message: 'Sipariş detayı alındı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Sipariş detayı alınırken hata oluştu'
      }
    }
  }

  const cancelOrder = async (orderId: string, reason?: string): Promise<ActionResponse<void>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const updatedOrders = user.orders.map(order =>
        order.id === orderId ? { ...order, status: 'cancelled' as const } : order
      )

      setUser({
        ...user,
        orders: updatedOrders
      })

      toast.success('Sipariş iptal edildi')

      return {
        success: true,
        message: 'Sipariş iptal başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Sipariş iptal edilirken hata oluştu'
      }
    }
  }

  // Utilities
  const getDefaultAddress = (type?: EnhancedAddress['type']): EnhancedAddress | undefined => {
    if (!user) return undefined
    
    return user.addresses.find(addr => 
      addr.isDefault && (!type || addr.type === type || addr.type === 'both')
    )
  }

  const hasCompleteProfile = (): boolean => {
    if (!user) return false
    
    return !!(
      user.firstName &&
      user.lastName &&
      user.email &&
      user.emailVerified &&
      user.phone &&
      user.addresses.length > 0
    )
  }

  const canPlaceOrder = (): boolean => {
    return hasCompleteProfile() && user?.addresses.some(addr => addr.isDefault) || false
  }

  const getTotalSpent = (): number => {
    return user?.stats.totalSpent || 0
  }

  const getLoyaltyLevel = (): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    const points = user?.stats.loyaltyPoints || 0
    
    if (points >= 5000) return 'platinum'
    if (points >= 2000) return 'gold'
    if (points >= 500) return 'silver'
    return 'bronze'
  }

  // Data management
  const exportUserData = async (): Promise<ActionResponse<string>> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'Kullanıcı bulunamadı'
        }
      }

      const exportData = JSON.stringify(user, null, 2)
      
      return {
        success: true,
        data: exportData,
        message: 'Kullanıcı verisi dışa aktarıldı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Veri dışa aktarılırken hata oluştu'
      }
    }
  }

  const deleteAccount = async (password: string): Promise<ActionResponse<void>> => {
    try {
      // Mock account deletion
      if (password !== '123456') {
        return {
          success: false,
          error: 'Geçersiz şifre'
        }
      }

      setUser(null)
      setIsLoggedIn(false)
      toast.success('Hesabınız başarıyla silindi')

      return {
        success: true,
        message: 'Hesap silme başarılı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Hesap silinirken hata oluştu'
      }
    }
  }

  const value: UserContextType = {
    // State
    user,
    isLoggedIn,
    isLoading,
    
    // Auth methods
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    verifyPhone,
    
    // Profile methods
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    changePassword,
    
    // Address methods
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    
    // Preferences methods
    updatePreferences,
    
    // Order methods
    getOrderHistory,
    getOrder,
    cancelOrder,
    
    // Utilities
    getDefaultAddress,
    hasCompleteProfile,
    canPlaceOrder,
    getTotalSpent,
    getLoyaltyLevel,
    
    // Data management
    exportUserData,
    deleteAccount
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
} 