import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLoginEmail } from '@/services/email-notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email adresi gerekli' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçersiz email formatı' },
        { status: 400 }
      )
    }

    // Minimal log - hassas bilgi (email adresi) log'lanmaz
    console.log('📧 Testing SMTP email')

    // Test magic login email
    const testLoginUrl = 'http://localhost:3000/auth/magic-login?token=test-token-123'
    const emailSent = await sendMagicLoginEmail(email, testLoginUrl)

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email başarıyla gönderildi: ${email}`,
        testData: {
          to: email,
          subject: 'Giriş Linkiniz - Ardahan Ticaret',
          loginUrl: testLoginUrl,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Email gönderim hatası',
          details: 'SMTP konfigürasyonu veya bağlantı hatası'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test email error:', error)
    
    return NextResponse.json(
      { 
        error: 'Email test hatası',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    )
  }
}

// Get SMTP configuration status
export async function GET() {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await createSupabaseServerClient()
    
    const { data: settings } = await supabase
      .from('site_settings')
      .select('smtp_enabled, smtp_host, smtp_port, smtp_username, smtp_from_email, smtp_secure')
      .single()
    
    return NextResponse.json({
      configured: settings?.smtp_enabled && settings?.smtp_host && settings?.smtp_username,
      service: 'SMTP',
      host: settings?.smtp_host || 'Not configured',
      port: settings?.smtp_port || 587,
      username: settings?.smtp_username || 'Not configured',
      fromEmail: settings?.smtp_from_email || 'Not configured',
      enabled: settings?.smtp_enabled || false,
      secure: settings?.smtp_secure || true,
      status: settings?.smtp_enabled ? 'ready' : 'disabled'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Configuration check failed' },
      { status: 500 }
    )
  }
}
