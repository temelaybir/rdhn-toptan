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
    const { orderId, trackingNumber, cargoStatus, cargoData } = body

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'orderId gerekli'
      }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    // Güncellenecek veriler
    const updateData: any = {
      updated_at: new Date().toISOString()
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

    console.log('📦 Sipariş güncelleniyor:', orderId)
    console.log('📋 Güncelleme verileri:', updateData)

    // Veritabanı güncellemesi
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_number', orderId)
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

