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

      // packageQuantity null olabilir (paket kaldırma durumu)
      // undefined ise hata ver
      if (packageQuantity === undefined) {
        throw new Error('Paket adedi belirtilmeli (null = paket yok)')
      }

      // Toplu güncelleme
      // Paket adedi varsa (>0) toptan ürün olarak işaretle
      // Paket yok olan ürünler de toptan ürün olabilir (is_wholesale true kalabilir)
      // Sadece paket yok olan toptan ürünler için MOQ'yu 3 adet olarak ayarla
      const isWholesale = packageQuantity && packageQuantity > 0 ? true : undefined // Paket varsa true, yoksa undefined (değiştirme)
      const moq = packageQuantity && packageQuantity > 0 ? null : 3 // Paket varsa null (paket bazlı MOQ), yoksa 3 adet
      const moqUnit = packageQuantity && packageQuantity > 0 ? null : 'piece' // Paket varsa null, yoksa 'piece'
      
      // Güncelleme objesi oluştur
      const updateData: any = {
        package_quantity: packageQuantity,
        package_unit: packageUnit || 'adet',
        moq: moq,
        moq_unit: moqUnit,
        updated_at: new Date().toISOString()
      }
      
      // Sadece paket varsa is_wholesale'i true yap, yoksa mevcut değeri koru
      if (isWholesale !== undefined) {
        updateData.is_wholesale = isWholesale
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
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



