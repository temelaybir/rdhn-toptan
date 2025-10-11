/**
 * BizimHesap Integration Package
 * 
 * E-commerce siparişlerini BizimHesap sistemi ile entegre ederek 
 * otomatik faturalandırma sağlar.
 */

export { BizimHesapService, createBizimHesapService } from './bizimhesap-service'

export type {
  BizimHesapConfig,
  BizimHesapInvoiceRequest,
  BizimHesapInvoiceResult,
  BizimHesapApiResponse,
  ECommerceOrder,
  OrderItem,
  OrderCustomer,
  InvoiceGenerationOptions,
  InvoiceDates,
  Customer,
  InvoiceDetail,
  InvoiceAmounts
} from './types'

export { InvoiceType, Currency } from './types'

export { 
  convertSupabaseOrderToBizimHesap,
  formatInvoiceNumber,
  validateInvoiceData,
  calculateInvoiceTotals 
} from './utils' 