import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      address, 
      city, 
      district, 
      postalCode,
      acceptsMarketing 
    } = body

    // Validation
    if (!email || !firstName || !lastName || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Zorunlu alanlar eksik' },
        { status: 400 }
      )
    }

    const supabase = await createAdminSupabaseClient()

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Bu e-mail adresi ile kayıtlı bir üyelik bulunmaktadır' },
        { status: 409 }
      )
    }

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        default_address: {
          address: address.trim(),
          city: city?.trim() || '',
          district: district?.trim() || '',
          postal_code: postalCode?.trim() || ''
        },
        accepts_marketing: acceptsMarketing || false,
        accepts_sms: acceptsMarketing || false
      })
      .select()
      .single()

    if (customerError) {
      console.error('Customer creation error:', customerError)
      return NextResponse.json(
        { success: false, error: 'Üyelik oluşturulurken hata oluştu' },
        { status: 500 }
      )
    }

    // Create default address
    const { error: addressError } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customer.id,
        title: 'Ev Adresi',
        contact_name: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city?.trim() || '',
        district: district?.trim() || '',
        postal_code: postalCode?.trim() || '',
        country: 'TR',
        is_default: true,
        is_billing: true,
        is_shipping: true
      })

    if (addressError) {
      console.error('Address creation error:', addressError)
      // Continue anyway, customer is created
    }

    console.log('✅ New customer registered:', customer.email)

    // Yeni üyelere giriş linki gönderilmez, sadece kayıt başarılı mesajı
    return NextResponse.json({
      success: true,
      message: 'Üyelik başarıyla oluşturuldu! Artık giriş yapabilirsiniz.',
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name
      }
    })

  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
