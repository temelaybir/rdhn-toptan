// ============================================================================
// İyzico Payment Integration Types
// ============================================================================

// Not: İyzipay npm paketi Next.js 15 ile uyumlu değil, custom HTTP implementasyonu kullanıyoruz

// İyzico Locale ve Currency sabitleri (npm paketi yerine)
export const IYZICO_LOCALE = {
  TR: 'tr',
  EN: 'en'
} as const

export const IYZICO_CURRENCY = {
  TRY: 'TRY',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP'
} as const

export const IYZICO_PAYMENT_CHANNEL = {
  WEB: 'WEB',
  MOBILE: 'MOBILE',
  MOBILE_WEB: 'MOBILE_WEB',
  MOBILE_IOS: 'MOBILE_IOS',
  MOBILE_ANDROID: 'MOBILE_ANDROID'
} as const

export const IYZICO_PAYMENT_GROUP = {
  PRODUCT: 'PRODUCT',
  LISTING: 'LISTING',
  SUBSCRIPTION: 'SUBSCRIPTION'
} as const

// Base Types
export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP'
export type Locale = 'tr' | 'en'
export type PaymentChannel = 'WEB' | 'MOBILE' | 'MOBILE_WEB' | 'MOBILE_APP' | 'API'
export type PaymentGroup = 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION' | 'OTHER'
export type CardType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PREPAID_CARD'
export type CardAssociation = 'VISA' | 'MASTER_CARD' | 'AMERICAN_EXPRESS' | 'TROY'

// Payment Status
export type PaymentStatus = 
  | 'PENDING' 
  | 'SUCCESS' 
  | 'FAILURE' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'PARTIAL_REFUND'

// İyzico Settings
export interface IyzicoSettings {
  id: string
  is_active: boolean
  test_mode: boolean
  
  // API Credentials
  api_key: string
  secret_key: string
  sandbox_api_key?: string
  sandbox_secret_key?: string
  
  // URLs
  production_base_url: string
  sandbox_base_url: string
  callback_url?: string
  webhook_url?: string
  
  // Payment Settings
  default_currency: Currency
  force_3d_secure: boolean
  auto_capture: boolean
  
  // Installment Settings
  allow_installments: boolean
  max_installment_count: number
  minimum_installment_amount: number
  
  // Commission Settings
  commission_rate: number
  installment_commission_rate: number
  
  // Company Info
  company_name?: string
  company_phone?: string
  company_email?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

// Address Information
export interface IyzicoAddress {
  contactName: string
  city: string
  country: string
  address: string
  zipCode?: string
}

// Buyer Information
export interface IyzicoBuyer {
  id: string
  name: string
  surname: string
  gsmNumber?: string
  email: string
  identityNumber: string
  lastLoginDate?: string
  registrationDate?: string
  registrationAddress: string
  ip?: string
  city: string
  country: string
  zipCode?: string
}

// Basket Item
export interface IyzicoBasketItem {
  id: string
  name: string
  category1: string
  category2?: string
  itemType: 'PHYSICAL' | 'VIRTUAL'
  price: string // İyzico string bekliyor
  subMerchantKey?: string
  subMerchantPrice?: string
}

// Card Information
export interface IyzicoCard {
  cardHolderName: string
  cardNumber: string
  expireMonth: string
  expireYear: string
  cvc: string
  registerCard?: number // 0 veya 1
  cardAlias?: string
  cardToken?: string
  cardUserKey?: string
}

// Payment Request
export interface IyzicoPaymentRequest {
  locale: Locale
  conversationId: string
  price: string
  paidPrice: string
  currency: Currency
  installment: number
  basketId: string
  paymentChannel: PaymentChannel
  paymentGroup: PaymentGroup
  paymentCard: IyzicoCard
  buyer: IyzicoBuyer
  shippingAddress: IyzicoAddress
  billingAddress: IyzicoAddress
  basketItems: IyzicoBasketItem[]
  callbackUrl?: string
}

// 3D Secure Payment Request
export interface Iyzico3DSecureRequest extends IyzicoPaymentRequest {
  callbackUrl: string
}

// İyzico Response Base
export interface IyzicoResponseBase {
  status: 'success' | 'failure'
  locale: Locale
  systemTime: number
  conversationId: string
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

// Payment Response
export interface IyzicoPaymentResponse extends IyzicoResponseBase {
  paymentId?: string
  price?: string
  paidPrice?: string
  installment?: number
  paymentItems?: Array<{
    itemId: string
    paymentTransactionId: string
    transactionStatus: string
    price: string
    paidPrice: string
    merchantCommissionRate: string
    merchantCommissionRateAmount: string
    iyziCommissionRateAmount: string
    iyziCommissionFee: string
    blockageRate: string
    blockageRateAmountMerchant: string
    blockageRateAmountSubMerchant: string
    blockageResolvedDate: string
    subMerchantKey?: string
    subMerchantPrice?: string
    subMerchantPayoutRate?: string
    subMerchantPayoutAmount?: string
    merchantPayoutAmount?: string
  }>
  currency?: Currency
  basketId?: string
  binNumber?: string
  lastFourDigits?: string
  cardType?: CardType
  cardAssociation?: CardAssociation
  cardFamily?: string
  cardToken?: string
  cardUserKey?: string
  fraudStatus?: number
  merchantCommissionRate?: string
  merchantCommissionRateAmount?: string
  iyziCommissionRateAmount?: string
  iyziCommissionFee?: string
  paymentTransactionId?: string
  mdStatus?: number
  authCode?: string
  hostReference?: string
  phase?: string
}

// 3D Secure Initialize Response
export interface Iyzico3DSecureInitResponse extends IyzicoResponseBase {
  htmlContent?: string
  threeDSHtmlContent?: string
  paymentId?: string
}

// 3D Secure Callback Response
export interface Iyzico3DSecureCallbackResponse extends IyzicoResponseBase {
  paymentId?: string
  paymentStatus?: string
  mdStatus?: number
  mdErrorMessage?: string
}

// Installment Info
export interface IyzicoInstallmentInfo {
  price: string
  installmentPrice: string
  installmentCount: number
  bankName: string
  bankCode?: string
  cardFamily: string
  cardType: CardType
  cardAssociation: CardAssociation
  force3ds?: number
  bankImageUrl?: string
  installmentLabel?: string
}

// Installment Response
export interface IyzicoInstallmentResponse extends IyzicoResponseBase {
  installmentDetails?: Array<{
    binNumber: string
    price: string
    cardType: CardType
    cardAssociation: CardAssociation
    cardFamily: string
    force3ds: number
    bankCode: string
    bankName: string
    installmentPrices: IyzicoInstallmentInfo[]
  }>
}

// Database Types
export interface PaymentTransaction {
  id: string
  order_number: string
  user_id?: string
  
  // İyzico Info
  iyzico_payment_id?: string
  conversation_id: string
  
  // Transaction Details
  amount: number
  currency: Currency
  installment: number
  
  // Payment Channel
  payment_channel?: PaymentChannel
  payment_group?: PaymentGroup
  payment_source?: string
  
  // Card Info (Masked)
  card_family?: string
  card_type?: CardType
  card_association?: CardAssociation
  card_bin?: string
  last_four_digits?: string
  card_holder_name?: string
  
  // Status
  status: PaymentStatus
  
  // 3D Secure
  is_3d_secure: boolean
  auth_code?: string
  host_reference?: string
  
  // Fees
  paid_price?: number
  merchant_commission_rate?: number
  merchant_commission_rate_amount?: number
  iyzi_commission_rate_amount?: number
  
  // Error Info
  error_code?: string
  error_message?: string
  error_group?: string
  
  // JSON Data
  iyzico_response?: any
  billing_address?: any
  shipping_address?: any
  
  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
}

// User Payment Card
export interface UserPaymentCard {
  id: string
  user_id: string
  card_token: string
  card_user_key: string
  card_alias?: string
  card_family?: string
  card_type?: CardType
  card_association?: CardAssociation
  card_bin?: string
  last_four_digits: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  last_used_at?: string
}

// Installment Option
export interface InstallmentOption {
  id: string
  bank_name: string
  bank_code?: string
  card_family: string
  card_type: CardType
  card_association: CardAssociation
  installment_count: number
  installment_rate: number
  min_amount: number
  max_amount?: number
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

// Payment Refund
export interface PaymentRefund {
  id: string
  payment_transaction_id: string
  order_number: string
  iyzico_refund_id?: string
  conversation_id: string
  refund_amount: number
  currency: Currency
  reason?: string
  status: 'PENDING' | 'SUCCESS' | 'FAILURE'
  error_code?: string
  error_message?: string
  iyzico_response?: any
  admin_user_id?: string
  admin_note?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

// Service Request/Response Types
export interface CreatePaymentRequest {
  orderNumber: string
  amount: number
  currency?: Currency
  installment?: number
  userId?: string
  basketItems: {
    id: string
    name: string
    category: string
    price: number
  }[]
  buyer: {
    name: string
    surname: string
    email: string
    phone?: string
    identityNumber: string
    address: string
    city: string
    country?: string
    zipCode?: string
  }
  billingAddress: {
    contactName: string
    address: string
    city: string
    country?: string
    zipCode?: string
  }
  shippingAddress: {
    contactName: string
    address: string
    city: string
    country?: string
    zipCode?: string
  }
  card: {
    cardHolderName: string
    cardNumber: string
    expireMonth: string
    expireYear: string
    cvc: string
    saveCard?: boolean
    cardAlias?: string
  }
  callbackUrl?: string
  userAgent?: string
  ipAddress?: string
}

export interface PaymentInitResponse {
  success: boolean
  paymentId?: string
  htmlContent?: string
  threeDSHtmlContent?: string
  conversationId: string
  errorCode?: string
  errorMessage?: string
  status?: PaymentStatus
}

export interface InstallmentRequest {
  binNumber: string
  price: number
  currency?: Currency
}

export interface InstallmentCalculation {
  bankName: string
  cardFamily: string
  cardType: CardType
  cardAssociation: CardAssociation
  installmentCount: number
  installmentPrice: number
  totalPrice: number
  commissionRate: number
  commissionAmount: number
}

// Webhook Types
export interface IyzicoWebhookPayload {
  iyziEventType: string
  iyziEventTime: number
  iyziReferenceCode: string
  token: string
  paymentConversationId?: string
  status?: string
}

// Form Types (Frontend)
export interface PaymentFormData {
  // Card Info
  cardNumber: string
  cardHolderName: string
  expireMonth: string
  expireYear: string
  cvc: string
  saveCard: boolean
  cardAlias?: string
  
  // Selected Card
  selectedCardToken?: string
  
  // Installment
  installmentCount: number
  
  // Addresses
  billingAddress: {
    contactName: string
    address: string
    city: string
    zipCode?: string
  }
  shippingAddress: {
    contactName: string
    address: string
    city: string
    zipCode?: string
  }
  sameAsBilling: boolean
  
  // Terms
  acceptTerms: boolean
  acceptKvkk: boolean
}

// Error Types
export interface IyzicoError {
  errorCode: string
  errorMessage: string
  errorGroup?: string
  locale?: Locale
}

// Configuration Types
export interface IyzicoConfig {
  apiKey: string
  secretKey: string
  baseUrl: string
  testMode: boolean
}

// API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
} 