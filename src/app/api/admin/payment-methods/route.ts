import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET - Tüm ödeme yöntemlerini getirir (Admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: paymentMethods, error } = await supabase
      .from('payment_method_settings')
      .select('*')
      .order('display_order')

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemleri alınamadı'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: paymentMethods || []
    })

  } catch (error: any) {
    console.error('Unexpected error in payment methods API:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
}

/**
 * POST - Yeni ödeme yöntemi ekler (Admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createSupabaseServerClient()

    // TODO: Admin authentication kontrolü eklenebilir

    // Check if method_type already exists
    const { data: existing } = await supabase
      .from('payment_method_settings')
      .select('id')
      .eq('method_type', body.method_type)
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Bu ödeme yöntemi tipi zaten mevcut'
      }, { status: 400 })
    }

    // Get next display order
    const { data: lastMethod } = await supabase
      .from('payment_method_settings')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastMethod?.display_order || 0) + 1

    const { error } = await supabase
      .from('payment_method_settings')
      .insert([{
        ...body,
        is_active: body.is_active ?? true,
        display_order: nextOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error creating payment method:', error)
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemi oluşturulurken hata oluştu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ödeme yöntemi başarıyla oluşturuldu'
    })

  } catch (error: any) {
    console.error('Unexpected error in payment method creation:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
}

/**
 * PUT - Ödeme yöntemi günceller (Admin)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    const supabase = await createSupabaseServerClient()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemi ID gerekli'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('payment_method_settings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating payment method:', error)
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemi güncellenirken hata oluştu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ödeme yöntemi başarıyla güncellendi'
    })

  } catch (error: any) {
    console.error('Unexpected error in payment method update:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
}

/**
 * DELETE - Ödeme yöntemi siler (Admin)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const supabase = await createSupabaseServerClient()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemi ID gerekli'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('payment_method_settings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment method:', error)
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemi silinirken hata oluştu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ödeme yöntemi başarıyla silindi'
    })

  } catch (error: any) {
    console.error('Unexpected error in payment method deletion:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
} 