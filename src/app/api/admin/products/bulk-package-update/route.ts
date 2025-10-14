import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/services/admin/admin-auth-service'

// Toplu paket bilgisi güncelleme endpoint'i
export async function POST(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    try {
      const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-client')
      const supabase = await createAdminSupabaseClient()

      const body = await request.json()
      const { productIds, packageQuantity, packageUnit } = body

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('Ürün seçimi gerekli')
      }

      if (!packageQuantity) {
        throw new Error('Paket adedi gerekli')
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
        throw new Error('Güncelleme sırasında hata oluştu')
      }

      return {
        success: true,
        message: `${productIds.length} ürünün paket bilgisi güncellendi`,
        data: {
          updatedCount: data?.length || 0,
          packageQuantity,
          packageUnit: packageUnit || 'adet'
        }
      }

    } catch (error) {
      console.error('Bulk package update error:', error)
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



