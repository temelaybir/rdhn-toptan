import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

/**
 * POST - Şifreyi sıfırla
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({
        success: false,
        error: 'Token ve şifre gerekli'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Find customer with valid reset token
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, password_reset_token, password_reset_expires')
      .eq('password_reset_token', token)
      .single()

    if (!customer || customerError) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş şifre sıfırlama linki'
      }, { status: 400 })
    }

    // Check if token is expired
    const expiryDate = new Date(customer.password_reset_expires)
    if (expiryDate < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Şifre sıfırlama linkinizin süresi dolmuş'
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        password_hash: hashedPassword, // ✅ Doğru field ismi
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Şifre güncellenirken hata oluştu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi'
    })

  } catch (error: any) {
    console.error('Reset password API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Bir hata oluştu, lütfen tekrar deneyin'
    }, { status: 500 })
  }
}

