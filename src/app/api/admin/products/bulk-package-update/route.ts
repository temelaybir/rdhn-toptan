import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Toplu paket bilgisi güncelleme endpoint'i
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Admin kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productIds, packageQuantity, packageUnit } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ürün seçimi gerekli' },
        { status: 400 }
      )
    }

    if (!packageQuantity) {
      return NextResponse.json(
        { success: false, error: 'Paket adedi gerekli' },
        { status: 400 }
      )
    }

    // Toplu güncelleme
    const { data, error } = await supabase
      .from('products')
      .update({
        package_quantity: packageQuantity,
        package_unit: packageUnit || 'adet',
        is_wholesale: true,
        moq_unit: 'package',
        updated_at: new Date().toISOString()
      })
      .in('id', productIds)
      .select()

    if (error) {
      console.error('Toplu paket güncelleme hatası:', error)
      return NextResponse.json(
        { success: false, error: 'Güncelleme sırasında hata oluştu' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${productIds.length} ürünün paket bilgisi güncellendi`,
      data: {
        updatedCount: data?.length || 0,
        packageQuantity,
        packageUnit: packageUnit || 'adet'
      }
    })

  } catch (error) {
    console.error('Bulk package update error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

