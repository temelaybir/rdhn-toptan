// Cargo Notification Service
// Based on PHP teknokargo email system

import { PendingCargoOrder } from '@/types/order'

interface CargoStatusUpdate {
  status: string
  trackingNumber?: string
  trackingUrl?: string
  lastUpdate: string
}

export class CargoNotificationService {
  
  /**
   * Send cargo status update email to customer
   * Based on PHP teknokargo system email logic
   */
  static async sendCargoUpdateEmail(
    order: PendingCargoOrder, 
    cargoStatus: CargoStatusUpdate
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending cargo update email for order ${order.order_number}`)

      // Prepare email data (like PHP system)
      const emailData = this.prepareEmailData(order, cargoStatus)
      
      // Check if we should send email (like PHP system logic)
      if (!this.shouldSendEmail(cargoStatus)) {
        console.log(`⏭️ Skipping email for order ${order.order_number} - status: ${cargoStatus.status}`)
        return false
      }

      // Send email using your preferred service
      const emailSent = await this.sendEmail(emailData)
      
      if (emailSent) {
        console.log(`✅ Cargo update email sent for order ${order.order_number}`)
        return true
      } else {
        console.error(`❌ Failed to send email for order ${order.order_number}`)
        return false
      }

    } catch (error) {
      console.error('Error sending cargo update email:', error)
      return false
    }
  }

  /**
   * Prepare email template data (like PHP system)
   */
  private static prepareEmailData(order: PendingCargoOrder, cargoStatus: CargoStatusUpdate) {
    const emailTemplate = this.getEmailTemplate(cargoStatus.status)
    
    // Replace placeholders (like PHP str_replace)
    const replacements = {
      '{order_number}': order.order_number,
      '{customer_name}': order.customer_name,
      '{kargo_sonuc}': cargoStatus.status,
      '{kargo_takipno}': cargoStatus.trackingNumber || 'Henüz atanmadı',
      '{kargo_url}': cargoStatus.trackingUrl || '',
      '{tarih}': new Date().toLocaleDateString('tr-TR'),
      '{saat}': new Date().toLocaleTimeString('tr-TR')
    }

    let emailContent = emailTemplate.content
    let emailSubject = emailTemplate.subject

    // Replace all placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => {
      emailContent = emailContent.replace(new RegExp(placeholder, 'g'), value)
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value)
    })

    return {
      to: order.customer_email,
      subject: emailSubject,
      html: emailContent,
      text: this.stripHtml(emailContent)
    }
  }

  /**
   * Check if email should be sent (like PHP system logic)
   */
  private static shouldSendEmail(cargoStatus: CargoStatusUpdate): boolean {
    // Similar to PHP system email sending conditions
    const importantStatuses = [
      'Kargoya Verildi',
      'Kurye ile Dağıtımda', 
      'Teslim Edildi',
      'Teslim Edilemedi',
      'İade'
    ]

    return importantStatuses.includes(cargoStatus.status)
  }

  /**
   * Get email template based on cargo status
   */
  private static getEmailTemplate(status: string) {
    const templates = {
      'Kargoya Verildi': {
        subject: 'Siparişiniz Kargoya Verildi - {order_number}',
        content: `
          <h2>Merhaba {customer_name},</h2>
          <p><strong>{order_number}</strong> numaralı siparişiniz kargoya verildi.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Kargo Durumu:</strong> {kargo_sonuc}</p>
            <p><strong>Takip Numarası:</strong> {kargo_takipno}</p>
            <p><strong>Güncelleme Tarihi:</strong> {tarih} {saat}</p>
          </div>
          <p>Kargo takibi için aşağıdaki linke tıklayabilirsiniz:</p>
          <a href="{kargo_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Kargo Takip Et</a>
          <br><br>
          <p>Teşekkürler,<br>Ardahan Ticaret</p>
        `
      },
      'Kurye ile Dağıtımda': {
        subject: 'Siparişiniz Kurye ile Dağıtımda - {order_number}',
        content: `
          <h2>Merhaba {customer_name},</h2>
          <p><strong>{order_number}</strong> numaralı siparişiniz kurye ile dağıtımda.</p>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Kargo Durumu:</strong> {kargo_sonuc}</p>
            <p><strong>Takip Numarası:</strong> {kargo_takipno}</p>
            <p><strong>Tahmini Teslimat:</strong> Bugün</p>
          </div>
          <p>Kargo takibi için aşağıdaki linke tıklayabilirsiniz:</p>
          <a href="{kargo_url}" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Kargo Takip Et</a>
          <br><br>
          <p>Teşekkürler,<br>Ardahan Ticaret</p>
        `
      },
      'Teslim Edildi': {
        subject: 'Siparişiniz Teslim Edildi - {order_number}',
        content: `
          <h2>Merhaba {customer_name},</h2>
          <p><strong>{order_number}</strong> numaralı siparişiniz başarıyla teslim edildi.</p>
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>✅ Teslimat Tamamlandı</strong></p>
            <p><strong>Takip Numarası:</strong> {kargo_takipno}</p>
            <p><strong>Teslimat Tarihi:</strong> {tarih} {saat}</p>
          </div>
          <p>Siparişinizi beğendiyseniz, yorumlarınızı paylaşmayı unutmayın!</p>
          <br>
          <p>Teşekkürler,<br>Ardahan Ticaret</p>
        `
      }
    }

    return templates[status as keyof typeof templates] || {
      subject: 'Kargo Durumu Güncellendi - {order_number}',
      content: `
        <h2>Merhaba {customer_name},</h2>
        <p><strong>{order_number}</strong> numaralı siparişinizin kargo durumu güncellendi.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Kargo Durumu:</strong> {kargo_sonuc}</p>
          <p><strong>Takip Numarası:</strong> {kargo_takipno}</p>
          <p><strong>Güncelleme Tarihi:</strong> {tarih} {saat}</p>
        </div>
        <p>Kargo takibi için aşağıdaki linke tıklayabilirsiniz:</p>
        <a href="{kargo_url}" style="background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Kargo Takip Et</a>
        <br><br>
        <p>Teşekkürler,<br>Ardahan Ticaret</p>
      `
    }
  }

  /**
   * Send email using your email service (Resend, SendGrid, etc.)
   */
  private static async sendEmail(emailData: any): Promise<boolean> {
    try {
      // Example with Resend (you can change to your preferred service)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@ardahanticaret.com',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html
        })
      })

      if (response.ok) {
        console.log('✅ Email sent successfully')
        return true
      } else {
        const errorData = await response.text()
        console.error('❌ Email send failed:', errorData)
        return false
      }

    } catch (error) {
      console.error('❌ Email service error:', error)
      return false
    }
  }

  /**
   * Strip HTML tags for text version
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  /**
   * Test email sending (for debugging)
   */
  static async testEmail(customerEmail: string): Promise<boolean> {
    const testOrder: PendingCargoOrder = {
      id: 999,
      order_number: 'TEST-001',
      customer_name: 'Test Müşteri',
      customer_email: customerEmail,
      kargo_barcode: 'ARD-TEST-001-123456',
      kargo_firma: 'aras',
      kargo_sonuc: 'Hazırlanıyor',
      kargo_takipno: '',
      updated_at: new Date().toISOString()
    }

    const testStatus: CargoStatusUpdate = {
      status: 'Kargoya Verildi',
      trackingNumber: '3513773163316',
      trackingUrl: 'https://kargotakip.araskargo.com.tr/mainpage.aspx?code=3513773163316',
      lastUpdate: new Date().toISOString()
    }

    return await this.sendCargoUpdateEmail(testOrder, testStatus)
  }
} 