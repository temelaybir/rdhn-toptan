import { NextRequest, NextResponse } from 'next/server'
import { CargoNotificationService } from '../../../../../../packages/aras-cargo-integration/src/cargo-notification-service'

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

    console.log(`📧 Testing email notification to: ${email}`)

    // Use the test email method from CargoNotificationService
    const emailSent = await CargoNotificationService.testEmail(email)

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email başarıyla gönderildi: ${email}`,
        testData: {
          to: email,
          template: 'Kargoya Verildi',
          orderNumber: 'TEST-001',
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Email gönderim hatası',
          details: 'Email servisi yanıt vermedi veya konfigürasyon hatası'
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

// Get email configuration status
export async function GET() {
  try {
    const hasResendKey = !!process.env.RESEND_API_KEY
    const hasFromEmail = !!process.env.FROM_EMAIL
    
    return NextResponse.json({
      configured: hasResendKey && hasFromEmail,
      service: 'Resend',
      fromEmail: process.env.FROM_EMAIL || 'Not configured',
      hasApiKey: hasResendKey,
      status: hasResendKey && hasFromEmail ? 'ready' : 'needs configuration',
      requiredEnvVars: [
        'RESEND_API_KEY',
        'FROM_EMAIL'
      ]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Configuration check failed' },
      { status: 500 }
    )
  }
} 