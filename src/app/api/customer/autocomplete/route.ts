import { NextRequest, NextResponse } from 'next/server'
import { getCustomerForAutocomplete } from '@/services/customer-auth-service'
import { z } from 'zod'

const autocompleteRequestSchema = z.object({
  email: z.string().email('Geçerli bir e-mail adresi girin')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validationResult = autocompleteRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz e-mail adresi'
      }, { status: 400 })
    }

    const { email } = validationResult.data

    // Minimal log - hassas bilgi (email adresi) log'lanmaz
    console.log('🔍 Customer autocomplete sorgusu')

    // Müşteri bilgilerini getir
    const result = await getCustomerForAutocomplete(email)

    if (!result.success || !result.customer) {
      return NextResponse.json({
        success: false,
        message: 'Müşteri bulunamadı'
      })
    }

    // Varsayılan adresi bul
    const defaultAddress = result.addresses?.find(addr => addr.is_default) || result.addresses?.[0]
    const defaultBillingAddress = result.addresses?.find(addr => addr.is_billing) || defaultAddress
    const defaultShippingAddress = result.addresses?.find(addr => addr.is_shipping) || defaultAddress

    return NextResponse.json({
      success: true,
      customer: {
        email: result.customer.email,
        first_name: result.customer.first_name,
        last_name: result.customer.last_name,
        phone: result.customer.phone,
        total_orders: result.customer.total_orders,
        total_spent: result.customer.total_spent
      },
      addresses: {
        billing: defaultBillingAddress ? {
          contactName: defaultBillingAddress.contact_name,
          phone: defaultBillingAddress.phone,
          address: defaultBillingAddress.address,
          city: defaultBillingAddress.city,
          district: defaultBillingAddress.district,
          postalCode: defaultBillingAddress.postal_code,
          country: defaultBillingAddress.country
        } : null,
        shipping: defaultShippingAddress ? {
          contactName: defaultShippingAddress.contact_name,
          phone: defaultShippingAddress.phone,
          address: defaultShippingAddress.address,
          city: defaultShippingAddress.city,
          district: defaultShippingAddress.district,
          postalCode: defaultShippingAddress.postal_code,
          country: defaultShippingAddress.country
        } : null
      }
    })
  } catch (error: any) {
    console.error('Customer autocomplete error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    }, { status: 500 })
  }
} 