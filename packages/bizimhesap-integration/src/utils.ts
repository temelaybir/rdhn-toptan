import { 
  ECommerceOrder,
  OrderItem,
  OrderCustomer,
  BizimHesapInvoiceRequest,
  InvoiceDetail,
  InvoiceAmounts,
  Currency
} from './types'

/**
 * Supabase order formatını BizimHesap formatına dönüştür
 */
export function convertSupabaseOrderToBizimHesap(supabaseOrder: any): ECommerceOrder {
  console.log('🔄 Order dönüştürülüyor:', {
    hasCustomer: !!supabaseOrder.customer,
    hasOrderItems: !!supabaseOrder.order_items,
    orderNumber: supabaseOrder.order_number,
    totalAmount: supabaseOrder.total_amount
  })

  // Customer bilgilerini doğru yerden al
  const customerData = supabaseOrder.customer || {}
  const directCustomer = {
    first_name: supabaseOrder.customer_first_name || supabaseOrder.first_name,
    last_name: supabaseOrder.customer_last_name || supabaseOrder.last_name,
    email: supabaseOrder.customer_email || supabaseOrder.email,
    phone: supabaseOrder.customer_phone || supabaseOrder.phone
  }

  // Billing address'i string'e dönüştür ve fullName'i çıkar
  let billingAddressString = 'Adres bilgisi eksik'
  let billingFullName = ''
  
  if (supabaseOrder.billing_address) {
    if (typeof supabaseOrder.billing_address === 'string') {
      billingAddressString = supabaseOrder.billing_address
    } else if (typeof supabaseOrder.billing_address === 'object') {
      // Object ise, adres parçalarını birleştir
      const addr = supabaseOrder.billing_address
      billingFullName = addr.fullName || '' // fullName'i kaydet
      const parts = [
        addr.addressLine1,
        addr.addressLine2,
        addr.district,
        addr.city,
        addr.postalCode
      ].filter(Boolean)
      billingAddressString = parts.join(', ') || 'Adres bilgisi eksik'
    }
  } else {
    // Fallback: Diğer alanlardan oluştur
    const fallbackAddr = `${supabaseOrder.address || ''} ${supabaseOrder.city || ''} ${supabaseOrder.postal_code || ''}`.trim()
    if (fallbackAddr) {
      billingAddressString = fallbackAddr
    }
  }

  // Müşteri adını belirle (öncelik sırasına göre)
  let customerName = 'Müşteri' // Default fallback
  
  if (customerData.first_name && customerData.last_name) {
    customerName = `${customerData.first_name} ${customerData.last_name}`.trim()
  } else if (directCustomer.first_name && directCustomer.last_name) {
    customerName = `${directCustomer.first_name} ${directCustomer.last_name}`.trim()
  } else if (billingFullName) {
    customerName = billingFullName.trim()
  } else if (supabaseOrder.customer_name) {
    customerName = supabaseOrder.customer_name
  } else if (supabaseOrder.company_name) {
    // Kurumsal müşteri ise şirket adını kullan
    customerName = supabaseOrder.company_name
  }

  const customer: OrderCustomer = {
    id: supabaseOrder.customer_id || supabaseOrder.id,
    name: customerName,
    email: customerData.email || directCustomer.email || supabaseOrder.customer_email,
    phone: customerData.phone || directCustomer.phone || supabaseOrder.customer_phone,
    taxNumber: supabaseOrder.tax_number,
    taxOffice: supabaseOrder.tax_office,
    billingAddress: billingAddressString
  }

  console.log('👤 Customer processed:', {
    name: customer.name,
    email: customer.email,
    hasAddress: !!customer.billingAddress
  })

  // Order items debug
  const rawOrderItems = supabaseOrder.order_items || supabaseOrder.items || []
  console.log('🔍 Raw order_items:', {
    hasOrderItems: !!supabaseOrder.order_items,
    hasItems: !!supabaseOrder.items,
    length: rawOrderItems.length,
    firstItem: rawOrderItems.length > 0 ? {
      product_id: rawOrderItems[0].product_id,
      quantity: rawOrderItems[0].quantity,
      unit_price: rawOrderItems[0].unit_price
    } : null
  })

  const items: OrderItem[] = rawOrderItems.map((item: any) => {
    // Product bilgilerini join'den al
    const product = item.product || {}
    
    const processedItem = {
      id: item.product_id || item.id,
      name: item.product_name || product.name || item.name || 'Ürün',
      sku: item.sku || product.sku,
      barcode: item.barcode || product.barcode,
      quantity: parseFloat(item.quantity) || 1,
      unitPrice: parseFloat(item.unit_price || item.price) || 0,
      taxRate: parseFloat(item.tax_rate) || 18, // Varsayılan KDV %18
      discount: parseFloat(item.discount_amount) || 0,
      note: item.note
    }
    
    console.log('📦 Item processed:', {
      name: processedItem.name,
      quantity: processedItem.quantity,
      unitPrice: processedItem.unitPrice,
      total: processedItem.quantity * processedItem.unitPrice
    })
    
    return processedItem
  })

  console.log('🧮 Items summary:', {
    itemCount: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  })

  // Tutarları hesapla
  const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const finalTotalAmount = parseFloat(supabaseOrder.total_amount || supabaseOrder.total) || calculatedTotal

  const finalOrder = {
    orderNumber: supabaseOrder.order_number || supabaseOrder.id,
    orderDate: new Date(supabaseOrder.created_at || supabaseOrder.order_date),
    customer,
    items,
    currency: supabaseOrder.currency as Currency || Currency.TL,
    totalAmount: finalTotalAmount,
    discountAmount: parseFloat(supabaseOrder.discount_amount) || 0,
    taxAmount: parseFloat(supabaseOrder.tax_amount) || 0,
    note: supabaseOrder.note || supabaseOrder.notes,
    dueDate: supabaseOrder.due_date ? new Date(supabaseOrder.due_date) : undefined
  }

  console.log('✅ Final order converted:', {
    orderNumber: finalOrder.orderNumber,
    customerName: finalOrder.customer.name,
    itemCount: finalOrder.items.length,
    totalAmount: finalOrder.totalAmount,
    currency: finalOrder.currency
  })

  return finalOrder
}

/**
 * Fatura numarası formatla
 */
export function formatInvoiceNumber(orderNumber: string, prefix: string = 'INV'): string {
  const timestamp = new Date().getFullYear()
  const paddedOrderNumber = orderNumber.toString().padStart(6, '0')
  return `${prefix}-${timestamp}-${paddedOrderNumber}`
}

/**
 * Fatura verilerini doğrula
 */
export function validateInvoiceData(invoiceData: BizimHesapInvoiceRequest): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Zorunlu alanları kontrol et
  if (!invoiceData.firmId) {
    errors.push('FirmId gerekli')
  }

  if (!invoiceData.customer.title) {
    errors.push('Müşteri adı gerekli')
  }

  if (!invoiceData.customer.address) {
    errors.push('Müşteri adresi gerekli')
  }

  if (!invoiceData.details || invoiceData.details.length === 0) {
    errors.push('En az bir ürün detayı gerekli')
  }

  // Ürün detaylarını kontrol et
  invoiceData.details.forEach((item, index) => {
    if (!item.productName) {
      errors.push(`Ürün ${index + 1}: Ürün adı gerekli`)
    }

    if (item.quantity <= 0) {
      errors.push(`Ürün ${index + 1}: Miktar 0'dan büyük olmalı`)
    }

    if (item.unitPrice < 0) {
      errors.push(`Ürün ${index + 1}: Birim fiyat negatif olamaz`)
    }

    if (item.taxRate < 0 || item.taxRate > 100) {
      errors.push(`Ürün ${index + 1}: KDV oranı 0-100 arasında olmalı`)
    }
  })

  // Tutar hesaplamalarını kontrol et
  if (invoiceData.amounts.total <= 0) {
    errors.push('Toplam tutar 0\'dan büyük olmalı')
  }

  // Tarih formatlarını kontrol et
  try {
    new Date(invoiceData.dates.invoiceDate)
  } catch {
    errors.push('Geçersiz fatura tarihi')
  }

  try {
    new Date(invoiceData.dates.dueDate)
  } catch {
    errors.push('Geçersiz vade tarihi')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Fatura toplamlarını hesapla
 */
export function calculateInvoiceTotals(items: InvoiceDetail[]): InvoiceAmounts {
  const gross = items.reduce((sum, item) => sum + item.grossPrice, 0)
  const discount = items.reduce((sum, item) => sum + parseFloat(item.discount.toString()), 0)
  const net = items.reduce((sum, item) => sum + item.net, 0)
  const tax = items.reduce((sum, item) => sum + item.tax, 0)
  const total = net + tax

  return {
    currency: Currency.TL,
    gross: Math.round(gross * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    net: Math.round(net * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

/**
 * KDV tutarını hesapla
 */
export function calculateVAT(amount: number, taxRate: number): number {
  return Math.round(amount * (taxRate / 100) * 100) / 100
}

/**
 * Net tutarı hesapla (indirim sonrası, KDV hariç)
 */
export function calculateNetAmount(grossAmount: number, discountAmount: number): number {
  return Math.round((grossAmount - discountAmount) * 100) / 100
}

/**
 * Para birimi formatla
 */
export function formatCurrency(amount: number, currency: Currency = Currency.TL): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency === Currency.TL ? 'TRY' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Fatura numarası generate et
 */
export function generateInvoiceNumber(orderNumber?: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const timestamp = now.getTime().toString().slice(-6)
  
  if (orderNumber) {
    return `INV-${year}${month}-${orderNumber}`
  }
  
  return `INV-${year}${month}-${timestamp}`
}

/**
 * Tarih formatını BizimHesap API formatına dönüştür
 */
export function formatDateForBizimHesap(date: Date): string {
  // ISO 8601 format: 2017-07-08T18:45:52.516+03:00
  return date.toISOString()
}

/**
 * Türkiye saat diliminde tarih formatla
 */
export function formatDateTurkeyTimezone(date: Date): string {
  const turkeyOffset = 3 * 60 // UTC+3 dakika cinsinden
  const turkeyTime = new Date(date.getTime() + turkeyOffset * 60 * 1000)
  
  // ISO formatında döndür ama Türkiye saat dilimi offseti ile
  return turkeyTime.toISOString().slice(0, -1) + '+03:00'
} 