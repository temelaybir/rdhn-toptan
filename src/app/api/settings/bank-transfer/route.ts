import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET - Banka havalesi ayarlarını getirir
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Banka havalesi ayarlarını getir
    const { data: bankSettings, error: bankError } = await supabase
      .from('bank_transfer_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (bankError && bankError.code !== 'PGRST116') {
      console.error('Error fetching bank transfer settings:', bankError)
      return NextResponse.json({
        success: false,
        error: 'Banka havalesi ayarları alınamadı'
      }, { status: 500 })
    }

    // Ödeme yöntemlerini getir
    const { data: paymentMethods, error: methodsError } = await supabase
      .from('payment_method_settings')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (methodsError) {
      console.error('Error fetching payment methods:', methodsError)
      return NextResponse.json({
        success: false,
        error: 'Ödeme yöntemleri alınamadı'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        bankTransferSettings: bankSettings,
        paymentMethods: paymentMethods || []
      }
    })

  } catch (error: any) {
    console.error('Unexpected error in bank transfer settings API:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
}

/**
 * POST - Banka havalesi ayarlarını günceller (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createSupabaseServerClient()

    // TODO: Admin authentication kontrolü eklenebilir
    
    const { error } = await supabase
      .from('bank_transfer_settings')
      .upsert([{
        ...body,
        updated_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error updating bank transfer settings:', error)
      return NextResponse.json({
        success: false,
        error: 'Ayarlar güncellenirken hata oluştu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Ayarlar başarıyla güncellendi'
    })

  } catch (error: any) {
    console.error('Unexpected error in bank transfer settings update:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
} 