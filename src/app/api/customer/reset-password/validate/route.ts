import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST - Şifre sıfırlama token'ının geçerliliğini kontrol et
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'Token gerekli'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Find customer with reset token
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, password_reset_expires')
      .eq('password_reset_token', token)
      .single()

    if (!customer || customerError) {
      return NextResponse.json({
        valid: false,
        error: 'Geçersiz token'
      })
    }

    // Check if token is expired
    const expiryDate = new Date(customer.password_reset_expires)
    if (expiryDate < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Token süresi dolmuş'
      })
    }

    return NextResponse.json({
      valid: true,
      message: 'Token geçerli'
    })

  } catch (error: any) {
    console.error('Token validation API error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Bir hata oluştu'
    }, { status: 500 })
  }
}

