export type DiscountType = 'percentage' | 'fixed'
export type UsageType = 'single' | 'multiple'

export interface PromoCode {
  id: number
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  
  // Kullanım ayarları
  usageType: UsageType
  maxUses: number | null
  currentUses: number
  
  // Tarih ayarları
  startDate: string | null
  endDate: string | null
  
  // Minimum sepet tutarı
  minOrderAmount: number
  
  // Durum
  isActive: boolean
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: number | null
}

export interface PromoCodeUsage {
  id: number
  promoCodeId: number
  orderId: string | null
  userId: number | null
  discountAmount: number
  usedAt: string
}

export interface PromoCodeValidation {
  valid: boolean
  discountType?: DiscountType
  discountValue?: number
  discountAmount?: number
  errorMessage?: string
}

export interface PromoCodeFormData {
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  usageType: UsageType
  maxUses: number | null
  startDate: string
  endDate: string
  minOrderAmount: number
  isActive: boolean
}

export interface PromoCodeFilters {
  search?: string
  discountType?: 'all' | DiscountType
  usageType?: 'all' | UsageType
  status?: 'all' | 'active' | 'inactive' | 'expired' | 'exhausted'
  sortBy?: 'createdAt' | 'code' | 'discountValue' | 'currentUses'
  sortOrder?: 'asc' | 'desc'
}
