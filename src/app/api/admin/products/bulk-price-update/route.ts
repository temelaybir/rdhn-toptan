import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Toplu fiyat güncelleme endpoint'i
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
    const { updates } = body // [{ id: 1, price: 100 }, { id: 2, price: 200 }]

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Güncelleme verisi gerekli' },
        { status: 400 }
      )
    }

    // Her bir ürünü ayrı ayrı güncelle
    const updatePromises = updates.map(async (update) => {
      const { id, price } = update
      
      if (!id || price === undefined || price === null) {
        return { success: false, id, error: 'Eksik veri' }
      }

      const { error } = await supabase
        .from('products')
        .update({
          price: parseFloat(price.toString()),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      return { success: !error, id, error: error?.message }
    })

    const results = await Promise.all(updatePromises)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `${successCount} ürün güncellendi${failCount > 0 ? `, ${failCount} hata` : ''}`,
      data: {
        successCount,
        failCount,
        results
      }
    })

  } catch (error) {
    console.error('Bulk price update error:', error)
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}



