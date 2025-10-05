// Ürün Yönetimi Type Tanımlamaları

// CORE TYPE DEFINITIONS
export interface ProductSpecifications {
  [key: string]: string | number | boolean
  // Yaygın specification örnekleri:
  // brand?: string
  // model?: string
  // color?: string
  // material?: string
  // warranty?: string
  // power?: string | number
  // capacity?: string | number
}

export interface HomepageItems {
  productIds?: number[]
  categoryIds?: number[]
  bannerUrl?: string
  linkUrl?: string
  imageUrl?: string
  title?: string
  subtitle?: string
  description?: string
  buttonText?: string
  [key: string]: unknown
}

export interface HomepageConfig {
  autoRotate?: boolean
  rotationInterval?: number
  showIndicators?: boolean
  showArrows?: boolean
  slideCount?: number
  itemsPerPage?: number
  backgroundColor?: string
  textColor?: string
  [key: string]: unknown
}

// API RESPONSE TYPES
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
}

export interface ApiSuccess<T = unknown> {
  success: true
  data?: T
  message?: string
}

// SERVER ACTION RESPONSE TYPES
export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]> // Field validation errors
}

export interface ValidationError {
  success: false
  error: string
  errors: Record<string, string[]>
}

export interface ActionSuccess<T = unknown> {
  success: true
  data?: T
  message: string
}

// PAGINATION TYPES
export interface PaginatedResponse<T = unknown> {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: number
  comparePrice: number | null
  costPrice: number | null
  stockQuantity: number
  trackStock: boolean
  allowBackorders: boolean
  lowStockThreshold: number | null
  sku: string | null
  barcode: string | null
  weight: number | null
  dimensions: ProductDimensions | null
  categoryId: string | null
  category?: Category
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  images: ProductImage[]
  variants: ProductVariant[]
  hasVariants: boolean
  variantOptions: VariantOption[]
  seo: ProductSEO | null
  shipping: ProductShipping | null
  taxRate: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: number
  productId: number
  title: string
  price: number
  comparePrice: number | null
  costPrice: number | null
  stockQuantity: number
  sku: string | null
  barcode: string | null
  weight: number | null
  option1: string | null
  option2: string | null
  option3: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: number
  url: string
  alt: string | null
  position: number
  isMain: boolean
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'inch'
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  parent?: Category
  children?: Category[]
  isActive: boolean
  productCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductFormData {
  // Temel Bilgiler
  name: string
  slug: string
  description: string
  shortDescription: string
  
  // Fiyat ve Stok
  price: number
  comparePrice?: number
  costPrice?: number
  stockQuantity: number
  trackStock: boolean
  allowBackorders: boolean
  lowStockThreshold?: number
  
  // Ürün Detayları
  sku?: string
  barcode?: string
  weight?: number
  dimensions?: ProductDimensions
  
  // Kategori ve Etiketler
  categoryId?: string
  tags: string[]
  
  // Durum
  isActive: boolean
  isFeatured: boolean
  
  // Görseller
  images: ProductImageUpload[]
  
  // Varyantlar
  hasVariants: boolean
  variantOptions?: VariantOption[]
  variants?: ProductVariantFormData[]
  
  // SEO
  seo?: ProductSEO
  
  // Kargo
  shipping?: ProductShipping
  
  // Vergi
  taxRate?: number
}

export interface ProductImageUpload {
  file?: File
  url?: string
  alt?: string
  position: number
  isMain: boolean
  preview?: string
}

export interface VariantOption {
  name: string // Örn: "Renk", "Beden"
  values: string[] // Örn: ["Kırmızı", "Mavi"], ["S", "M", "L"]
}

export interface ProductVariantFormData {
  title: string
  price: number
  comparePrice?: number
  costPrice?: number
  stockQuantity: number
  sku?: string
  barcode?: string
  weight?: number
  option1?: string
  option2?: string
  option3?: string
  isActive: boolean
  image?: ProductImageUpload
}

export interface ProductSEO {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  canonicalUrl?: string
}

export interface ProductShipping {
  requiresShipping: boolean
  weight?: number
  dimensions?: ProductDimensions
  shippingClass?: 'standard' | 'fragile' | 'oversized'
  isOversized?: boolean // Büyük ürün flag'i
  originCountry?: string
  hsCode?: string
}

// Filtreleme ve Arama
export interface ProductFilters {
  search?: string
  categoryId?: number
  status?: 'all' | 'active' | 'inactive' | 'outofstock' | 'lowstock'
  featured?: boolean
  priceRange?: {
    min?: number
    max?: number
  }
  tags?: string[]
  sortBy?: 'name' | 'price' | 'stock' | 'stockQuantity' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Toplu İşlemler
export interface BulkOperation {
  type: 'activate' | 'deactivate' | 'delete' | 'updateCategory' | 'updatePrice' | 'updateStock'
  productIds: number[]
  data?: {
    categoryId?: number;
    price?: number;
    stock?: number;
  }
}

// İstatistikler
export interface ProductStats {
  totalProducts: number
  activeProducts: number
  outOfStockProducts: number
  lowStockProducts: number
  totalValue: number
  averagePrice: number
} 