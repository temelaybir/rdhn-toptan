import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'E-mail ve şifre gereklidir'
      }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    // Find customer by email
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !customer) {
      return NextResponse.json({
        success: false,
        error: 'E-mail veya şifre hatalı'
      }, { status: 401 })
    }

    // Check if customer has password set
    if (!customer.password_hash) {
      return NextResponse.json({
        success: false,
        error: 'Bu hesap için şifre belirlenmemiş. Lütfen şifre oluşturun.'
      }, { status: 401 })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, customer.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        error: 'E-mail veya şifre hatalı'
      }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('customers')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', customer.id)

    // Create JWT token
    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
        type: 'customer'
      },
      JWT_SECRET,
      {
        expiresIn: '30d'
      }
    )

    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        first_name: customer.first_name, // ✅ Profil sayfası için
        last_name: customer.last_name,   // ✅ Profil sayfası için
        created_at: customer.created_at,
        total_orders: customer.total_orders || 0,
        total_spent: customer.total_spent || 0
      }
    })

    response.cookies.set('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Giriş sırasında bir hata oluştu'
    }, { status: 500 })
  }
}

