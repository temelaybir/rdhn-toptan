import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()

    // Validate input
    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş ID' },
        { status: 400 }
      )
    }

    const {
      kargo_barcode,
      kargo_firma = 'aras',
      kargo_tarih,
      kargo_sonuc = 'Hazırlanıyor',
      kargo_paketadet = 1
    } = body

    if (!kargo_barcode) {
      return NextResponse.json(
        { error: 'Barkod bilgisi gerekli' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = await createClient()

    // Check if order exists
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, kargo_barcode')
      .eq('id', parseInt(orderId))
      .single()

    if (orderError || !existingOrder) {
      console.error('Order not found:', orderError)
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }

    // Check if barcode already exists (unless updating same order)
    const { data: barcodeCheck } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('kargo_barcode', kargo_barcode)
      .neq('id', parseInt(orderId))
      .single()

    if (barcodeCheck) {
      return NextResponse.json(
        { 
          error: 'Bu barkod başka bir siparişte kullanılıyor',
          conflictOrder: barcodeCheck.order_number
        },
        { status: 409 }
      )
    }

    // Update order with barcode information
    const { data, error } = await supabase
      .from('orders')
      .update({
        kargo_barcode,
        kargo_firma,
        kargo_tarih: kargo_tarih || new Date().toISOString(),
        kargo_sonuc,
        kargo_paketadet,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(orderId))
      .select('id, order_number, kargo_barcode, kargo_sonuc')
      .single()

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json(
        { error: 'Barkod kaydedilirken hata oluştu' },
        { status: 500 }
      )
    }

    console.log(`✅ Barcode saved for order ${orderId}:`, {
      orderId: data.id,
      orderNumber: data.order_number,
      barcode: data.kargo_barcode,
      status: data.kargo_sonuc
    })

    return NextResponse.json({
      success: true,
      message: 'Barkod başarıyla kaydedildi',
      data: {
        orderId: data.id,
        orderNumber: data.order_number,
        barcode: data.kargo_barcode,
        status: data.kargo_sonuc
      }
    })

  } catch (error) {
    console.error('Barcode save error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// Get barcode information for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    if (!orderId || isNaN(parseInt(orderId))) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        kargo_barcode,
        kargo_firma,
        kargo_tarih,
        kargo_sonuc,
        kargo_takipno,
        kargo_url,
        kargo_paketadet
      `)
      .eq('id', parseInt(orderId))
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: data.id,
        orderNumber: data.order_number,
        barcode: data.kargo_barcode,
        company: data.kargo_firma,
        cargoDate: data.kargo_tarih,
        status: data.kargo_sonuc,
        trackingNumber: data.kargo_takipno,
        trackingUrl: data.kargo_url,
        packageCount: data.kargo_paketadet
      }
    })

  } catch (error) {
    console.error('Get barcode error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
} 