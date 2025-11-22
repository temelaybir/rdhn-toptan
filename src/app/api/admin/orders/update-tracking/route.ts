/**
 * Sipariş kargo takip bilgilerini günceller
 * 
 * POST /api/admin/orders/update-tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'

export async function POST(request: NextRequest) {
  try {
    // Admin authentication kontrolü
    const authResult = await validateAdminAuth()
    
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Yetkisiz erişim - Admin girişi gerekli'
      }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, trackingNumber, cargoStatus, cargoData, integrationCode, isManualLink, queriedBarcode } = body

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId gerekli'
      }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    // Sipariş numarasını temizle (SIP- prefix'ini kaldır)
    const cleanOrderId = orderId.toString().replace(/^SIP-/, '').trim()

    // Önce siparişin var olup olmadığını kontrol et
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('order_number, id')
      .or(`order_number.eq.${cleanOrderId},order_number.eq.SIP-${cleanOrderId},id.eq.${cleanOrderId}`)
      .limit(1)
      .single()

    if (checkError || !existingOrder) {
      console.error('❌ Sipariş bulunamadı:', cleanOrderId)
      return NextResponse.json({
        success: false,
        error: `Sipariş bulunamadı: ${cleanOrderId}`,
        details: checkError?.message || 'Sipariş numarası geçersiz veya sipariş mevcut değil'
      }, { status: 404 })
    }

    // Güncellenecek veriler
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // IntegrationCode'u kargo_talepno olarak kaydet (manuel sorgulama için önemli)
    if (integrationCode) {
      updateData.kargo_talepno = integrationCode
      console.log('📝 IntegrationCode kaydediliyor:', integrationCode)
    }

    // Manuel sorgulanan barkod/takip numarasını da kaydet
    if (queriedBarcode && isManualLink) {
      console.log('📝 Manuel sorgulanan kod kaydediliyor:', queriedBarcode)
      // Bu bilgiyi not olarak saklayabiliriz veya ayrı bir alana kaydedebiliriz
    }

    // Tracking number güncelle
    if (trackingNumber) {
      updateData.kargo_takipno = trackingNumber
      updateData.tracking_number = trackingNumber // Alternatif kolon
    }

    // Kargo durumu güncelle
    if (cargoStatus) {
      updateData.kargo_sonuc = cargoStatus
    }

    // Tam kargo verisini JSON olarak sakla
    if (cargoData) {
      // Kargo URL'i oluştur - mainpage.aspx formatı
      if (cargoData.KARGO_TAKIP_NO) {
        updateData.kargo_url = `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${cargoData.KARGO_TAKIP_NO}`
      }

      // Kargo tarihini güncelle
      if (cargoData.ISLEM_TARIHI) {
        updateData.kargo_tarih = cargoData.ISLEM_TARIHI
      }

      // Kargo firma
      updateData.kargo_firma = 'aras'
      updateData.cargo_company = 'ARAS' // Alternatif kolon

      // Sipariş durumunu "shipped" yap
      updateData.status = 'SHIPPED'
      updateData.fulfillment_status = 'fulfilled'
    }

    console.log('📦 Sipariş güncelleniyor:', existingOrder.order_number)
    console.log('📋 Güncelleme verileri:', updateData)
    if (isManualLink) {
      console.log('🔗 Manuel eşleştirme yapılıyor')
    }

    // Veritabanı güncellemesi - order_number veya id ile güncelle
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_number', existingOrder.order_number)
      .select()
      .single()

    if (error) {
      console.error('❌ Sipariş güncelleme hatası:', error)
      return NextResponse.json({
        success: false,
        error: 'Sipariş güncellenemedi',
        details: error.message
      }, { status: 500 })
    }

    console.log('✅ Sipariş başarıyla güncellendi')

    return NextResponse.json({
      success: true,
      message: 'Kargo takip bilgileri güncellendi',
      data: {
        orderId: data.order_number,
        trackingNumber: data.kargo_takipno,
        status: data.kargo_sonuc,
        url: data.kargo_url
      }
    })

  } catch (error: any) {
    console.error('❌ Update tracking hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Beklenmeyen hata oluştu'
    }, { status: 500 })
  }
}

