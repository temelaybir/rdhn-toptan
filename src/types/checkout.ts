export interface Address {
  id?: string
  fullName: string
  phone: string
  email: string
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  postalCode: string
  isDefault?: boolean
}

export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'debit_card' | 'bank_transfer'
  label: string
  icon?: string
}

export interface CardDetails {
  cardNumber: string
  cardHolder: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  saveCard?: boolean
}

export interface CheckoutStep {
  id: number
  label: string
  completed: boolean
  active: boolean
}

export interface OrderSummary {
  items: Array<{
    productId: number
    productName: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

export interface BankTransferSettings {
  id: string
  is_active: boolean
  bank_name: string
  account_holder: string
  account_number: string
  iban: string
  swift_code?: string
  branch_name?: string
  branch_code?: string
  alternative_accounts: AlternativeAccount[]
  customer_message: string
  payment_note: string
  payment_deadline_hours: number
  email_subject: string
  email_message: string
  created_at: string
  updated_at: string
}

export interface AlternativeAccount {
  id: string
  bank_name: string
  account_holder: string
  iban: string
  account_number: string
}

export interface CheckoutFormData {
  customerType: 'individual' | 'corporate' // Müşteri tipi
  identityNumber?: string // TC Kimlik No (bireysel için opsiyonel)
  companyName?: string // Şirket adı (kurumsal için zorunlu)
  taxNumber?: string // Vergi numarası (kurumsal için zorunlu)
  taxOffice?: string // Vergi dairesi (kurumsal için zorunlu)
  deliveryAddress: Address
  billingAddress: Address
  sameAsDelivery: boolean
  paymentMethod: PaymentMethod['type']
  cardDetails?: CardDetails
  acceptTerms: boolean
  notes?: string
} 