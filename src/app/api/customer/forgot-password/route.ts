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
      console.log('Customer not found for password reset:', email)
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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
      
      console.log('🔐 Password reset link:', resetUrl)
      console.log('👤 Customer:', customer.email)

      // TODO: Email service entegrasyonu
      // Şimdilik console'a yazdır, daha sonra gerçek email service eklenecek
      console.log(`
        =============================================
        ŞİFRE SIFIRLAMA EMAİLİ
        =============================================
        Alıcı: ${customer.email}
        İsim: ${customer.first_name} ${customer.last_name}
        
        Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
        ${resetUrl}
        
        Bu link 1 saat geçerlidir.
        
        Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.
        =============================================
      `)

      // Gerçek email gönderimi için email-notification-service'i kullanabilirsiniz:
      // const { sendPasswordResetEmail } = await import('@/services/email-notification-service')
      // await sendPasswordResetEmail(customer.email, resetUrl, `${customer.first_name} ${customer.last_name}`)

    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
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

