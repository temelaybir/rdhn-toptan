import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/services/admin/admin-auth-service'

// Toplu fiyat güncelleme endpoint'i
export async function POST(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    try {
      const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-client')
      const supabase = await createAdminSupabaseClient()

      const body = await request.json()
      const { updates } = body // [{ id: 1, price: 100 }, { id: 2, price: 200 }]

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        throw new Error('Güncelleme verisi gerekli')
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

      return {
        success: true,
        message: `${successCount} ürün güncellendi${failCount > 0 ? `, ${failCount} hata` : ''}`,
        data: {
          successCount,
          failCount,
          results
        }
      }

    } catch (error) {
      console.error('Bulk price update error:', error)
      throw error
    }
  })

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status || 500 }
    )
  }

  return NextResponse.json(result.data)
}



