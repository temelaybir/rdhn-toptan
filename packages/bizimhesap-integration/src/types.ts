/**
 * BizimHesap API Types
 * Based on: https://apidocs.bizimhesap.com/addinvoice
 */

export interface BizimHesapConfig {
  firmId: string
  apiEndpoint?: string
  timeout?: number
}

export enum InvoiceType {
  SALES = 3, // Satış faturası
  PURCHASE = 5 // Alış faturası
}

export enum Currency {
  TL = 'TL',
  USD = 'USD',
  EUR = 'EUR',
  CHF = 'CHF',
  GBP = 'GBP'
}

export interface InvoiceDates {
  invoiceDate: string // ISO 8601 format
  deliveryDate?: string // ISO 8601 format (opsiyonel)
  dueDate: string // ISO 8601 format
}

export interface Customer {
  customerId: string | number
  title: string
  address: string
  taxOffice?: string
  taxNo?: string
  email?: string
  phone?: string
}

export interface InvoiceDetail {
  productId: string | number
  productName: string
  note?: string
  barcode?: string
  taxRate: number // KDV oranı (decimal)
  quantity: number
  unitPrice: number
  grossPrice: number // miktar x birim fiyat
  discount: string | number // İndirim tutarı
  net: number // Net tutar (indirim sonrası, vergisiz)
  tax: number // Vergi tutarı
  total: number // Toplam (net + vergi)
}

export interface InvoiceAmounts {
  currency: Currency
  gross: number
  discount: number
  net: number
  tax: number
  total: number
}

export interface BizimHesapInvoiceRequest {
  firmId: string
  invoiceNo?: string
  invoiceType: InvoiceType
  note?: string
  dates: InvoiceDates
  customer: Customer
  amounts: InvoiceAmounts
  details: InvoiceDetail[]
}

export interface BizimHesapApiResponse {
  error: string
  guid: string
  url: string
}

export interface BizimHesapInvoiceResult {
  success: boolean
  data?: BizimHesapApiResponse
  error?: string
  guid?: string
  invoiceUrl?: string
}

// E-commerce order types (internal)
export interface OrderItem {
  id: string | number
  name: string
  sku?: string
  barcode?: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount?: number
  note?: string
}

export interface OrderCustomer {
  id: string | number
  name: string
  email?: string
  phone?: string
  taxNumber?: string
  taxOffice?: string
  billingAddress: string
}

export interface ECommerceOrder {
  orderNumber: string
  orderDate: Date
  customer: OrderCustomer
  items: OrderItem[]
  currency?: Currency
  totalAmount: number
  discountAmount?: number
  taxAmount: number
  note?: string
  dueDate?: Date
}

export interface InvoiceGenerationOptions {
  invoiceType?: InvoiceType
  customInvoiceNumber?: string
  autoGenerateCustomer?: boolean
  autoGenerateProducts?: boolean
} 