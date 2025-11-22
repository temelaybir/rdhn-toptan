/**
 * Kargo Otomatik Takip Cron Job
 * 
 * Tüm aktif kargoları kontrol eder ve durumlarını günceller
 * 
 * GET /api/cron/track-shipments
 * 
 * Vercel Cron: Her 4 saatte bir çalışır
 * 
 * @see vercel.json - cron configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import ArasKargoHybridService from '@/lib/aras-kargo-hybrid'

// Cron job güvenlik anahtarı
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    // Cron güvenlik kontrolü
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    console.log('🔄 Kargo otomatik takip başlatıldı:', new Date().toISOString())

    const supabase = await createAdminSupabaseClient()

    // Teslim edilmemiş aktif kargoları getir
    // Öncelik 1: KARGO_TAKIP_NO olmayan (yeni kargolar - 24 saat bekle mantığı)
    // Öncelik 2: KARGO_TAKIP_NO olan ama henüz teslim edilmemiş
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_number, kargo_talepno, kargo_takipno, kargo_sonuc, email, kargo_firma, kargo_tarih, created_at')
      .not('kargo_talepno', 'is', null) // IntegrationCode olan siparişler
      .or('kargo_takipno.is.null,kargo_sonuc.in.(Hazırlanıyor,YOLDA - NORMAL,ŞUBEDE,DAĞITIMDA)') // Takip no yok VEYA teslim edilmemiş
      .limit(50) // Aynı anda maksimum 50 kargo
      .order('kargo_takipno.nullsfirst', { ascending: true }) // Önce takip numarası olmayanları al

    if (error) {
      console.error('❌ Sipariş sorgulama hatası:', error)
      return NextResponse.json({
        success: false,
        error: 'Sipariş sorgulanamadı'
      }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      console.log('ℹ️ Takip edilecek kargo bulunamadı')
      return NextResponse.json({
        success: true,
        message: 'Takip edilecek kargo yok',
        processedCount: 0
      })
    }

    console.log(`📦 ${orders.length} kargo takip edilecek`)

    const arasKargo = new ArasKargoHybridService()
    const results = {
      success: 0,
      failed: 0,
      updated: 0,
      delivered: 0
    }

    // Her kargoyu takip et
    for (const order of orders) {
      try {
        const integrationCode = order.kargo_talepno
        
        // ⏰ 24 saat kontrolü - Eğer KARGO_TAKIP_NO yoksa ve kargo 24 saatten yeniyse bekle
        if (!order.kargo_takipno) {
          const cargoDate = order.kargo_tarih ? new Date(order.kargo_tarih) : new Date(order.created_at)
          const now = new Date()
          const hoursSinceCreation = (now.getTime() - cargoDate.getTime()) / (1000 * 60 * 60)
          
          if (hoursSinceCreation < 24) {
            console.log(`⏳ ${order.order_number}: Henüz 24 saat geçmedi (${Math.round(hoursSinceCreation)} saat). Bekleniyor...`)
            continue // Skip this order
          }
          
          console.log(`✅ ${order.order_number}: 24 saat geçti (${Math.round(hoursSinceCreation)} saat). Takip numarası sorgulanıyor...`)
        }
        
        console.log(`🔍 Takip ediliyor: ${order.order_number} (IntegrationCode: ${integrationCode})`)

        // WCF API'den güncel durumu al
        const trackingData = await arasKargo.getTrackingInfo(integrationCode)

        if (trackingData.QueryResult?.Cargo) {
          const cargo = trackingData.QueryResult.Cargo
          const newStatus = cargo.DURUMU
          const trackingNumber = cargo.KARGO_TAKIP_NO

          // Durum değişti mi veya KARGO_TAKIP_NO yeni mi eklendi kontrol et
          const statusChanged = newStatus !== order.kargo_sonuc
          const trackingNumberNew = !order.kargo_takipno && trackingNumber
          
          if (statusChanged || trackingNumberNew) {
            if (statusChanged) {
              console.log(`📝 Durum güncelleniyor: ${order.kargo_sonuc} → ${newStatus}`)
            }
            if (trackingNumberNew) {
              console.log(`🎉 KARGO_TAKIP_NO alındı: ${trackingNumber}`)
            }

            // Veritabanını güncelle
            const updateData: any = {
              kargo_sonuc: newStatus,
              kargo_takipno: trackingNumber,
              kargo_url: `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}`,
              kargo_tarih: cargo.ISLEM_TARIHI,
              updated_at: new Date().toISOString()
            }

            // Eğer teslim edildiyse sipariş durumunu güncelle
            if (newStatus === 'TESLİM EDİLDİ') {
              updateData.status = 'DELIVERED'
              updateData.fulfillment_status = 'fulfilled'
              results.delivered++
              
              console.log(`✅ Kargo teslim edildi: ${order.order_number}`)
            }

            await supabase
              .from('orders')
              .update(updateData)
              .eq('order_number', order.order_number)

            results.updated++

            // E-posta bildirimi gönder (önemli durum değişiklikleri için, sadece statusChanged ise)
            if (statusChanged && ['TESLİM EDİLDİ', 'DAĞITIMDA', 'TESLİM ALINMADI'].includes(newStatus)) {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/email/cargo-status`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: order.email,
                    orderNumber: order.order_number,
                    trackingNumber: trackingNumber,
                    status: newStatus,
                    cargoData: cargo
                  })
                })
                console.log(`📧 E-posta bildirimi gönderildi: ${order.email}`)
              } catch (emailError) {
                console.error('❌ E-posta gönderme hatası:', emailError)
                // E-posta hatası takip işlemini durdurmasın
              }
            }
          }

          results.success++
        } else {
          console.warn(`⚠️ Kargo bilgisi alınamadı: ${order.order_number}`)
          results.failed++
        }

        // Rate limiting - Her istek arası 1 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (orderError: any) {
        console.error(`❌ Kargo takip hatası (${order.order_number}):`, orderError.message)
        results.failed++
      }
    }

    console.log('✅ Kargo otomatik takip tamamlandı:', results)

    return NextResponse.json({
      success: true,
      message: 'Kargo takip işlemi tamamlandı',
      results: {
        totalOrders: orders.length,
        ...results
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Cron job hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Beklenmeyen hata'
    }, { status: 500 })
  }
}

// POST method for manual trigger (from admin panel)
export async function POST(request: NextRequest) {
  // Admin authentication kontrolü yapılabilir
  return GET(request)
}

