import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/services/admin/admin-auth-service'

// Toplu MOQ (Minimum Order Quantity) güncelleme endpoint'i
export async function POST(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    try {
      const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-client')
      const supabase = await createAdminSupabaseClient()

      const body = await request.json()
      const { productIds, moq, moqUnit } = body

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('Ürün seçimi gerekli')
      }

      // Güncelleme objesi oluştur
      const updateData: any = {
        moq: moq,
        moq_unit: moqUnit,
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .in('id', productIds)
        .select()

      if (error) {
        console.error('Toplu MOQ güncelleme hatası:', error)
        throw new Error('Güncelleme sırasında hata oluştu')
      }

      return {
        success: true,
        message: `${productIds.length} ürünün minimum sipariş miktarı güncellendi`,
        data: {
          updatedCount: data?.length || 0,
          moq,
          moqUnit
        }
      }

    } catch (error) {
      console.error('Bulk MOQ update error:', error)
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

