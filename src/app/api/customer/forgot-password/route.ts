import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * POST - Şifre sıfırlama linki gönder
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'E-posta adresi gerekli'
      }, { status: 400 })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli bir e-posta adresi girin'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .eq('email', email.toLowerCase())
      .single()

    // Güvenlik: Her zaman başarılı mesajı döndür (email enumeration attack'ları önlemek için)
    // Ama sadece gerçek kullanıcılara email gönder
    if (!customer || customerError) {
      // Yine de başarılı mesajı döndür
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderildi'
      })
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // 1 saat geçerli

    // Save reset token to database
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: resetTokenExpiry.toISOString()
      })
      .eq('id', customer.id)

    if (updateError) {
      console.error('Error saving reset token:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Şifre sıfırlama linki oluşturulurken hata oluştu'
      }, { status: 500 })
    }

    // Send password reset email
    try {
      // ✅ PRODUCTION: catkapinda.com.tr veya custom domain
      // ✅ DEVELOPMENT: localhost:3000
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                      'https://catkapinda.com.tr'
      
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

      // ✅ Gerçek email gönderimi
      const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Değerli Müşterimiz'
      
      const { sendPasswordResetEmail } = await import('@/services/email-notification-service')
      await sendPasswordResetEmail(customer.email, resetUrl, customerName)

    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError)
      // Email hatası kullanıcıya bildirilmez (güvenlik)
    }

    return NextResponse.json({
      success: true,
      message: 'Şifre sıfırlama linki e-posta adresinize gönderildi'
    })

  } catch (error: any) {
    console.error('Forgot password API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Bir hata oluştu, lütfen tekrar deneyin'
    }, { status: 500 })
  }
}

