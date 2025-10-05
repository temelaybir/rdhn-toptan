// Order interface with cargo fields
export interface Order {
  id: string
  order_number: string
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address: string
  billing_address?: string
  total_amount: number
  tax_amount?: number
  shipping_amount?: number
  discount_amount?: number
  payment_method: string
  payment_status: PaymentStatus
  order_status: OrderStatus
  notes?: string
  
  // New cargo-related fields from migration
  kargo_sonuc?: string | null
  kargo_barcode?: string | null
  kargo_firma?: string
  kargo_tarih?: string | null
  kargo_talepno?: string | null
  kargo_takipno?: string | null
  kargo_url?: string | null
  kargo_paketadet?: number
  
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
export type CargoStatus = 'Hazırlanıyor' | 'Kargoya Verildi' | 'Dağıtım Merkezinde' | 'Kurye ile Dağıtımda' | 'Teslim Edildi' | 'Teslim Edilemedi' | 'İade' | 'Beklemede'

// For barcode generation
export interface BarcodeData {
  orderId: string
  orderNumber: string
  barcode: string
  recipientName: string
  recipientAddress: string
  weight?: number
  desi?: number
  generatedAt: string
}

// For cargo tracking integration
export interface CargoTracking {
  trackingNumber: string
  status: CargoStatus
  lastUpdate: string
  movements: CargoMovement[]
  estimatedDelivery?: string
}

export interface CargoMovement {
  date: string
  location: string
  status: string
  description: string
}

// For cron job processing
export interface PendingCargoOrder {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  kargo_barcode: string
  kargo_firma?: string
  kargo_sonuc?: string | null
  kargo_takipno?: string | null
  kargo_url?: string | null
  total_amount?: number
  created_at: string
  updated_at?: string
}

// For cargo status updates
export interface CargoStatusUpdate {
  status: string
  trackingNumber?: string
  trackingUrl?: string
  lastUpdate: string
}

export interface CargoOperation {
  type: 'create' | 'update' | 'track' | 'cancel'
  orderId: string
  barcode?: string
  trackingNumber?: string
  status?: string
  timestamp: string
  success: boolean
  error?: string
}

// For print barcode requests
export interface PrintBarcodeRequest {
  orderIds: string[]
  format: 'pdf' | 'thermal' | 'zebra'
  copies: number
}

// For cargo sync results
export interface CargoSyncResult {
  processedOrders: number
  updatedOrders: number
  errors: string[]
  duration: number
  timestamp: string
} 