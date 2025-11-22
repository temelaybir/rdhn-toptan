/**
 * Kargo Durum Değişikliği E-posta Bildirimi
 * 
 * POST /api/email/cargo-status
 */

import { NextRequest, NextResponse } from 'next/server'
import { EmailNotificationService } from '@/services/email-notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, orderNumber, trackingNumber, status, cargoData } = body

    if (!email || !orderNumber || !status) {
      return NextResponse.json({
        success: false,
        error: 'email, orderNumber ve status gerekli'
      }, { status: 400 })
    }

    console.log(`📧 Kargo durum bildirimi gönderiliyor: ${email}`)

    const emailService = new EmailNotificationService()

    // Durum Türkçeleştirme
    const statusMessages: { [key: string]: { title: string, message: string, emoji: string } } = {
      'TESLİM EDİLDİ': {
        title: 'Kargonuz Teslim Edildi! 🎉',
        message: 'Siparişiniz başarıyla teslim edilmiştir.',
        emoji: '✅'
      },
      'DAĞITIMDA': {
        title: 'Kargonuz Dağıtıma Çıktı 🚚',
        message: 'Siparişiniz size ulaşmak üzere yola çıktı.',
        emoji: '🚚'
      },
      'ŞUBEDE': {
        title: 'Kargonuz Şubede 📦',
        message: 'Siparişiniz dağıtım şubesine ulaştı.',
        emoji: '📦'
      },
      'YOLDA - NORMAL': {
        title: 'Kargonuz Yolda 🛣️',
        message: 'Siparişiniz size doğru yola çıktı.',
        emoji: '🛣️'
      },
      'TESLİM ALINMADI': {
        title: 'Kargo Teslim Edilemedi ⚠️',
        message: 'Siparişiniz teslim edilemedi. Lütfen kargo şubesiyle iletişime geçin.',
        emoji: '⚠️'
      }
    }

    const statusInfo = statusMessages[status] || {
      title: 'Kargo Durumu Güncellendi',
      message: `Kargo durumu: ${status}`,
      emoji: '📦'
    }

    // E-posta HTML içeriği
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusInfo.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      background: #f0f0f0;
      border-radius: 20px;
      font-weight: 600;
      color: #667eea;
      margin: 10px 0;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #666;
    }
    .info-value {
      color: #333;
      font-family: monospace;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji">${statusInfo.emoji}</div>
      <h1>${statusInfo.title}</h1>
    </div>
    
    <div class="content">
      <p>Merhaba,</p>
      <p>${statusInfo.message}</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Sipariş Numarası:</span>
          <span class="info-value">${orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kargo Takip No:</span>
          <span class="info-value">${trackingNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Durum:</span>
          <span class="status-badge">${status}</span>
        </div>
        ${cargoData?.ISLEM_TARIHI ? `
        <div class="info-row">
          <span class="info-label">İşlem Tarihi:</span>
          <span class="info-value">${new Date(cargoData.ISLEM_TARIHI).toLocaleString('tr-TR')}</span>
        </div>
        ` : ''}
        ${cargoData?.VARIS_SUBE ? `
        <div class="info-row">
          <span class="info-label">Şube:</span>
          <span class="info-value">${cargoData.VARIS_SUBE}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center;">
        <a href="https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}" class="button">
          Kargo Takip Et
        </a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Siparişlerinizi <a href="${process.env.NEXT_PUBLIC_URL || 'https://catkapinda.com.tr'}/hesabim/siparisler">hesabım</a> sayfasından takip edebilirsiniz.
      </p>
    </div>
    
    <div class="footer">
      <p>Ardahan Ticaret - Toptan Satış</p>
      <p style="font-size: 12px; color: #999;">
        Bu e-posta otomatik olarak gönderilmiştir.
      </p>
    </div>
  </div>
</body>
</html>
    `

    // E-posta gönder
    await emailService.sendEmail({
      to: email,
      subject: statusInfo.title,
      html: emailHtml
    })

    console.log(`✅ E-posta başarıyla gönderildi: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'E-posta bildirimi gönderildi'
    })

  } catch (error: any) {
    console.error('❌ E-posta gönderme hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'E-posta gönderilemedi'
    }, { status: 500 })
  }
}

