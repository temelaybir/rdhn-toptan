// Trendyol API ve Entegrasyon Type Tanımları

export interface TrendyolSettings {
  id: string
  supplier_id: string
  api_key: string
  api_secret: string
  ftp_host?: string
  ftp_user?: string
  ftp_password?: string
  ftp_base_path: string
  is_active: boolean
  mock_mode: boolean
  test_mode: boolean
  last_category_sync?: string
  last_stock_sync?: string
  created_at: string
  updated_at: string
}

export interface TrendyolStockSyncConfig {
  id: string
  is_enabled: boolean
  sync_hour_1: number
  sync_hour_2: number
  last_sync_1?: string
  last_sync_2?: string
  created_at: string
  updated_at: string
}

export interface TrendyolCategory {  id: string
  trendyol_category_id: number
  category_name: string
  parent_category_id?: number
  local_category_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrendyolAttribute {
  id: string
  trendyol_category_id: number
  attribute_name: string
  attribute_type: 'text' | 'number' | 'select' | 'multiselect'
  is_required: boolean
  allowed_values?: string[]
  created_at: string
}

export interface TrendyolProduct {
  id: string
  product_id: string
  trendyol_product_id?: string
  barcode: string
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason?: string
  is_active: boolean
  last_sync_at?: string
  sync_status: 'PENDING' | 'SUCCESS' | 'ERROR'
  sync_error?: string
  created_at: string
  updated_at: string}

export interface FtpImage {
  id: string
  product_id: string
  original_url: string
  ftp_url?: string
  webp_url?: string
  file_name?: string
  file_size?: number
  upload_status: 'PENDING' | 'UPLOADING' | 'SUCCESS' | 'ERROR'
  upload_error?: string
  created_at: string
  updated_at: string
}

export interface SyncQueue {
  id: string
  operation_type: 'CREATE_PRODUCT' | 'UPDATE_STOCK' | 'UPDATE_PRICE' | 'UPLOAD_IMAGE'
  payload: Record<string, any>
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  retry_count: number
  max_retries: number
  scheduled_at: string
  processed_at?: string
  error_message?: string
  created_at: string
}

export interface TrendyolSyncLog {
  id: string
  operation_type: string
  product_id?: string
  trendyol_product_id?: string
  status: 'SUCCESS' | 'ERROR' | 'WARNING'
  details?: Record<string, any>
  error_code?: string
  error_message?: string
  sync_duration?: number
  created_at: string
}

// Trendyol API Request/Response Types
export interface TrendyolApiCredentials {
  supplierId: string
  apiKey: string
  apiSecret: string
}

export interface TrendyolApiProduct {
  barcode: string
  title: string
  description: string
  categoryId: number
  brandId?: number
  quantity: number
  listPrice: number
  salePrice: number
  images: Array<{
    url: string
  }>
  attributes: Array<{
    attributeId: number
    attributeValueId: number
    customAttributeValue?: string
  }>
  variant?: TrendyolApiVariant
}

export interface TrendyolApiVariant {  groupId: string
  barcode: string
  quantity: number
  listPrice: number
  salePrice: number
  attributes: Array<{
    attributeId: number
    attributeValueId: number
  }>
}

export interface TrendyolApiResponse<T = any> {
  batchRequestId?: string
  items?: T[]
  totalElements?: number
  totalPages?: number
  page?: number
  size?: number
}

export interface TrendyolApiError {
  code: string
  message: string
  field?: string
}

export interface TrendyolApiCategoryResponse {
  id: number
  name: string
  parentId?: number
  subCategories?: TrendyolApiCategoryResponse[]
}

export interface TrendyolApiAttributeResponse {
  attribute: {
    id: number
    name: string
    required: boolean
    allowCustom: boolean
    attributeValues: Array<{
      id: number
      name: string
    }>
  }
}

// Sync Engine Types
export interface SyncResult {
  success: boolean
  message?: string
  data?: any
  error?: string
}

export interface BatchSyncResult {
  total: number
  successful: number
  failed: number
  errors: Array<{
    barcode: string
    error: string
  }>
}

// Image Processing Types
export interface ImageProcessingOptions {
  quality: number
  maxWidth: number
  maxHeight: number
  format: 'webp' | 'jpeg' | 'png'
}

export interface FtpConfig {
  host: string
  user: string
  password: string
  basePath: string
  secure?: boolean
  port?: number
}

// Admin Panel Types
export interface TrendyolDashboardStats {
  totalProducts: number
  approvedProducts: number
  pendingProducts: number
  rejectedProducts: number
  lastSyncTime?: string
  syncStatus: 'idle' | 'running' | 'error'
  queueSize: number
}

export interface ProductMapping {
  localProduct: {
    id: string
    name: string
    sku?: string
    category: string
  }
  trendyolProduct?: TrendyolProduct
  mappingStatus: 'mapped' | 'unmapped' | 'error'
  errors?: string[]
}

// Utility Types
export type TrendyolOperationType = SyncQueue['operation_type']
export type TrendyolSyncStatus = TrendyolProduct['sync_status']
export type TrendyolApprovalStatus = TrendyolProduct['approval_status']