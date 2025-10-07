import { createSupabaseServerClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  totalAmount: number
  currency: string
  paymentMethod?: string
  orderItems: Array<{
    name: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    fullName: string
    address: string
    city: string
    district: string
    phone: string
  }
}

interface EmailSettings {
  order_notification_emails: string | null
  enable_order_notifications: boolean
  order_email_subject: string | null
  order_email_template: string | null
  // SMTP Settings
  smtp_host: string | null
  smtp_port: number
  smtp_username: string | null
  smtp_password: string | null
  smtp_from_email: string | null
  smtp_from_name: string | null
  smtp_secure: boolean
  smtp_enabled: boolean
}

/**
 * E-mail şablonundaki değişkenleri değerler ile değiştirir
 */
function replaceEmailVariables(template: string, data: OrderEmailData): string {
  const orderItemsText = data.orderItems
    .map(item => `• ${item.quantity}x ${item.name} - ${item.price.toFixed(2)} ${data.currency}`)
    .join('\n')

  const shippingAddressText = `${data.shippingAddress.fullName}
${data.shippingAddress.address}
${data.shippingAddress.district} / ${data.shippingAddress.city}
Tel: ${data.shippingAddress.phone}`

  return template
    .replace(/{ORDER_NUMBER}/g, data.orderNumber)
    .replace(/{CUSTOMER_NAME}/g, data.customerName)
    .replace(/{CUSTOMER_EMAIL}/g, data.customerEmail)
    .replace(/{CUSTOMER_PHONE}/g, data.customerPhone)
    .replace(/{TOTAL_AMOUNT}/g, data.totalAmount.toFixed(2))
    .replace(/{CURRENCY}/g, data.currency)
    .replace(/{ORDER_ITEMS}/g, orderItemsText)
    .replace(/{SHIPPING_ADDRESS}/g, shippingAddressText)
}

/**
 * Site ayarlarından e-mail bildirim ayarlarını getirir
 */
async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('site_settings')
      .select(`
        order_notification_emails, 
        enable_order_notifications, 
        order_email_subject, 
        order_email_template,
        smtp_host,
        smtp_port,
        smtp_username,
        smtp_password,
        smtp_from_email,
        smtp_from_name,
        smtp_secure,
        smtp_enabled
      `)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('E-mail ayarları alınamadı:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('E-mail ayarları getirme hatası:', error)
    return null
  }
}

/**
 * SMTP ile e-mail gönderme fonksiyonu
 */
async function sendEmail(to: string[], subject: string, body: string): Promise<boolean> {
  try {
    // E-mail ayarlarını al
    const emailSettings = await getEmailSettings()
    
    if (!emailSettings || !emailSettings.smtp_enabled) {
      console.log('📧 SMTP devre dışı - E-mail gönderimi simülasyonu:')
      console.log('Alıcılar:', to)
      console.log('Konu:', subject)
      console.log('İçerik:', body.substring(0, 200) + '...')
      return true
    }

    // SMTP ayarları eksikse simülasyon yap
    if (!emailSettings.smtp_host || !emailSettings.smtp_from_email) {
      console.log('📧 SMTP ayarları eksik - Simülasyon:')
      console.log('Alıcılar:', to)
      console.log('Konu:', subject)
      return true
    }

    // SMTP transporter oluştur
    console.log('📧 SMTP Ayarları:', {
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      username: emailSettings.smtp_username,
      hasPassword: !!emailSettings.smtp_password,
      fromEmail: emailSettings.smtp_from_email,
      fromName: emailSettings.smtp_from_name
    })

    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure, // true for 465, false for 587
      auth: emailSettings.smtp_username && emailSettings.smtp_password ? {
        user: emailSettings.smtp_username,
        pass: emailSettings.smtp_password
      } : undefined,
      debug: true, // Debug modu açık
      logger: true // Logger açık
    })

    // E-mail seçenekleri
    const mailOptions = {
      from: `"${emailSettings.smtp_from_name}" <${emailSettings.smtp_from_email}>`,
      to: to.join(', '),
      subject: subject,
      html: body.replace(/\n/g, '<br>'),
      text: body
    }

    // E-mail gönder
    const info = await transporter.sendMail(mailOptions)
    
    console.log('📧 E-mail başarıyla gönderildi:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    })
    
    return true
    
  } catch (error) {
    console.error('📧 E-mail gönderme hatası:', error)
    
    // Hata durumunda simülasyon yap
    console.log('📧 Hata nedeniyle simülasyon:')
    console.log('Alıcılar:', to)
    console.log('Konu:', subject)
    
    return false
  }
}

/**
 * Yeni sipariş bildirimi gönderir
 */
export async function sendOrderNotification(orderData: OrderEmailData): Promise<boolean> {
  try {
    console.log('📧 Sipariş bildirimi gönderiliyor:', orderData.orderNumber)

    // E-mail ayarlarını getir
    const emailSettings = await getEmailSettings()
    
    if (!emailSettings) {
      console.log('❌ E-mail ayarları bulunamadı')
      return false
    }

    if (!emailSettings.enable_order_notifications) {
      console.log('❌ E-mail bildirimleri deaktif')
      return false
    }

    if (!emailSettings.order_notification_emails) {
      console.log('❌ Bildirim e-mail adresleri belirtilmemiş')
      return false
    }

    // E-mail adreslerini parse et
    const emailAddresses = emailSettings.order_notification_emails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))

    if (emailAddresses.length === 0) {
      console.log('❌ Geçerli e-mail adresi bulunamadı')
      return false
    }

    // E-mail konusu ve içeriği hazırla
    const subject = replaceEmailVariables(
      emailSettings.order_email_subject || 'Yeni Sipariş - #{ORDER_NUMBER}',
      orderData
    )

    const defaultTemplate = `Merhaba,

Yeni bir sipariş alındı:

Sipariş No: {ORDER_NUMBER}
Müşteri: {CUSTOMER_NAME}
E-mail: {CUSTOMER_EMAIL}
Telefon: {CUSTOMER_PHONE}
Toplam Tutar: {TOTAL_AMOUNT} {CURRENCY}

Sipariş Detayları:
{ORDER_ITEMS}

Teslimat Adresi:
{SHIPPING_ADDRESS}

Admin panelde detayları görüntüleyebilirsiniz.

Saygılarımızla,
Ardahan Ticaret`

    const body = replaceEmailVariables(
      emailSettings.order_email_template || defaultTemplate,
      orderData
    )

    // E-mail gönder
    const success = await sendEmail(emailAddresses, subject, body)
    
    if (success) {
      console.log('✅ Sipariş bildirimi başarıyla gönderildi')
    } else {
      console.log('❌ Sipariş bildirimi gönderilemedi')
    }

    return success
  } catch (error) {
    console.error('❌ Sipariş bildirimi gönderme hatası:', error)
    return false
  }
}

/**
 * Magic login link e-maili gönderir
 */
export async function sendMagicLoginEmail(email: string, loginUrl: string): Promise<boolean> {
  try {
    console.log('🔑 Magic login e-maili gönderiliyor:', email)

    const subject = 'Giriş Linkiniz - Ardahan Ticaret'
    
    const body = `Merhaba,

Hesabınıza giriş yapmak için aşağıdaki linke tıklayın:

${loginUrl}

Bu link 30 dakika geçerlidir ve tek kullanımlıktır.

Güvenlik için:
- Bu linki kimseyle paylaşmayın
- Link üzerinden başka kimse giriş yapamaz
- Eğer bu isteği siz yapmadıysanız bu e-maili görmezden gelin

Saygılarımızla,
Ardahan Ticaret`

    const success = await sendEmail([email], subject, body)
    
    if (success) {
      console.log('✅ Magic login e-maili gönderildi')
    } else {
      console.log('❌ Magic login e-maili gönderilemedi')
    }

    return success
  } catch (error) {
    console.error('❌ Magic login e-maili gönderme hatası:', error)
    return false
  }
}

/**
 * Müşteriye sipariş onay e-maili gönderir (magic link ile)
 */
export async function sendOrderConfirmationToCustomer(orderData: OrderEmailData): Promise<boolean> {
  try {
    console.log('📧 Müşteriye sipariş onayı gönderiliyor:', orderData.customerEmail)

    // Magic login link oluştur
    const { generateMagicLoginLink } = require('./customer-auth-service')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLinkResult = await generateMagicLoginLink(orderData.customerEmail, baseUrl)

    // Banka havalesi bilgilerini çek (eğer ödeme yöntemi banka havalesi ise)
    let bankTransferSection = ''
    if (orderData.paymentMethod === 'bank_transfer') {
      try {
        const supabase = await createSupabaseServerClient()
        const { data: bankSettings } = await supabase
          .from('bank_transfer_settings')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (bankSettings) {
          bankTransferSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 BANKA HAVALESİ BİLGİLERİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${bankSettings.customer_message || ''}

🏦 Banka Adı: ${bankSettings.bank_name}
👤 Hesap Sahibi: ${bankSettings.account_holder}
${bankSettings.branch_name ? `🏢 Şube: ${bankSettings.branch_name}\n` : ''}💳 Hesap No: ${bankSettings.account_number}

📋 IBAN: ${bankSettings.iban}

⚠️ ÖNEMLİ: ${bankSettings.payment_note || 'Ödeme açıklamasına sipariş numaranızı yazmayı unutmayın!'}

⏰ Ödeme Süresi: ${bankSettings.payment_deadline_hours} saat içinde

💰 Ödenecek Tutar: ${orderData.totalAmount.toFixed(2)} ${orderData.currency}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
        }
      } catch (error) {
        console.error('Banka bilgileri alınamadı:', error)
      }
    }

    const subject = `Sipariş Onayı - ${orderData.orderNumber}`
    
    const body = `Merhaba ${orderData.customerName},

🎉 Siparişiniz başarıyla alınmıştır!

📋 Sipariş Detayları:
Sipariş No: ${orderData.orderNumber}
Toplam Tutar: ${orderData.totalAmount.toFixed(2)} ${orderData.currency}

🛍️ Sipariş İçeriği:
${orderData.orderItems.map(item => `• ${item.quantity}x ${item.name} - ${item.price.toFixed(2)} ${orderData.currency}`).join('\n')}

📍 Teslimat Adresi:
${orderData.shippingAddress.fullName}
${orderData.shippingAddress.address}
${orderData.shippingAddress.district} / ${orderData.shippingAddress.city}
${bankTransferSection}
🔍 Sipariş Takibi:
Siparişinizin durumunu takip etmek için: https://ardahanticaret.com/siparis-takibi/${orderData.orderNumber}

👤 Hesabınıza Giriş:
${magicLinkResult.success && magicLinkResult.loginUrl ? 
`Tüm siparişlerinizi görüntülemek ve hesabınızı yönetmek için:
${magicLinkResult.loginUrl}

Bu giriş linki 30 dakika geçerlidir ve güvenli şekilde hesabınıza giriş yapmanızı sağlar.` : 
'Hesabınıza giriş yapmak için https://ardahanticaret.com/auth/login adresini ziyaret edin.'
}

📞 Sorularınız için bize ulaşabilirsiniz.

Teşekkürler,
Ardahan Ticaret`

    const success = await sendEmail([orderData.customerEmail], subject, body)
    
    if (success) {
      console.log('✅ Müşteri onay e-maili gönderildi (magic link ile)')
    } else {
      console.log('❌ Müşteri onay e-maili gönderilemedi')
    }

    return success
  } catch (error) {
    console.error('❌ Müşteri onay e-maili gönderme hatası:', error)
    return false
  }
}

/**
 * Sipariş durumu değiştiğinde customer'a bildirim gönderir
 */
export async function sendOrderStatusUpdateToCustomer(
  orderData: OrderEmailData, 
  newStatus: string, 
  trackingNumber?: string, 
  cargoCompany?: string
): Promise<boolean> {
  try {
    console.log('📧 Sipariş durum güncelleme e-maili gönderiliyor:', orderData.customerEmail, newStatus)

    // Magic login link oluştur
    const { generateMagicLoginLink } = require('./customer-auth-service')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLinkResult = await generateMagicLoginLink(orderData.customerEmail, baseUrl)

    // Status'a göre e-mail içeriği
    let statusMessage = ''
    let statusEmoji = ''
    let subject = ''

    switch (newStatus?.toLowerCase()) {
      case 'paid':
        statusEmoji = '💳'
        subject = `Ödemeniz Alındı - ${orderData.orderNumber}`
        statusMessage = `Ödemeniz başarıyla alınmıştır. Siparişiniz hazırlanmaya başlanacaktır.`
        break
      case 'confirmed':
        statusEmoji = '✅'
        subject = `Siparişiniz Onaylandı - ${orderData.orderNumber}`
        statusMessage = `Siparişiniz onaylanmıştır ve kargoya hazırlanmaktadır.`
        break
      case 'shipped':
        statusEmoji = '🚚'
        subject = `Siparişiniz Kargoya Verildi - ${orderData.orderNumber}`
        statusMessage = `Siparişiniz kargoya verilmiştir ve yakında size ulaşacaktır.`
        break
      case 'delivered':
        statusEmoji = '🎉'
        subject = `Siparişiniz Teslim Edildi - ${orderData.orderNumber}`
        statusMessage = `Siparişiniz başarıyla teslim edilmiştir. İyi günlerde kullanın!`
        break
      default:
        statusEmoji = '📦'
        subject = `Sipariş Güncelleme - ${orderData.orderNumber}`
        statusMessage = `Siparişinizde güncelleme yapılmıştır.`
    }

    const body = `Merhaba ${orderData.customerName},

${statusEmoji} ${statusMessage}

📋 Sipariş Detayları:
Sipariş No: ${orderData.orderNumber}
Durum: ${getStatusDisplayName(newStatus)}
Toplam Tutar: ${orderData.totalAmount.toFixed(2)} ${orderData.currency}

${trackingNumber && cargoCompany ? `
🚚 Kargo Bilgileri:
Kargo Şirketi: ${getCargoCompanyName(cargoCompany)}
Takip Numarası: ${trackingNumber}
Kargo Takibi: https://kargotakip.com.tr/sorgula/${trackingNumber}
` : ''}

🔍 Sipariş Detayları:
Siparişinizin tüm detaylarını görmek için: https://ardahanticaret.com/siparis-takibi/${orderData.orderNumber}

👤 Hesabınıza Giriş:
${magicLinkResult.success && magicLinkResult.loginUrl ? 
`Tüm siparişlerinizi görüntülemek için:
${magicLinkResult.loginUrl}

Bu giriş linki 30 dakika geçerlidir.` : 
'Hesabınıza giriş yapmak için https://ardahanticaret.com/auth/login adresini ziyaret edin.'
}

Teşekkürler,
Ardahan Ticaret`

    const success = await sendEmail([orderData.customerEmail], subject, body)
    
    if (success) {
      console.log('✅ Status update e-maili gönderildi:', newStatus)
    } else {
      console.log('❌ Status update e-maili gönderilemedi')
    }

    return success
  } catch (error) {
    console.error('❌ Status update e-maili gönderme hatası:', error)
    return false
  }
}

/**
 * Status display name helper
 */
function getStatusDisplayName(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending': return 'Beklemede'
    case 'paid': return 'Ödeme Alındı'
    case 'confirmed': return 'Onaylandı'
    case 'shipped': return 'Kargoda'
    case 'delivered': return 'Teslim Edildi'
    case 'cancelled': return 'İptal Edildi'
    case 'awaiting_payment': return 'Ödeme Bekliyor'
    default: return 'Bilinmiyor'
  }
}

/**
 * Kargo şirketi display name helper
 */
function getCargoCompanyName(company: string): string {
  switch (company?.toLowerCase()) {
    case 'aras': return 'Aras Kargo'
    case 'yurtici': return 'Yurtiçi Kargo'
    case 'mng': return 'MNG Kargo'
    case 'ptt': return 'PTT Kargo'
    case 'surat': return 'Sürat Kargo'
    case 'ups': return 'UPS'
    case 'dhl': return 'DHL'
    case 'fedex': return 'FedEx'
    case 'sendeo': return 'Sendeo'
    case 'hepsijet': return 'HepsiJet'
    case 'trendyol': return 'Trendyol Express'
    default: return company || 'Kargo Şirketi'
  }
} 