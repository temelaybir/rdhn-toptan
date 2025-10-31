import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/services/admin/admin-auth-service'
import { bulkUpdateProductStatus } from '@/app/actions/admin/product-actions'

// Ürün durumu güncelleme endpoint'i
export async function POST(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    try {
      const body = await request.json()
      const { productIds, isActive } = body

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('Ürün seçimi gerekli')
      }

      if (typeof isActive !== 'boolean') {
        throw new Error('Geçersiz durum değeri')
      }

      // Action'ı kullanarak güncelleme yap
      const actionResult = await bulkUpdateProductStatus(
        productIds.map(id => typeof id === 'string' ? parseInt(id) : id),
        isActive
      )

      if (!actionResult.success) {
        throw new Error(actionResult.error || 'Durum güncellenemedi')
      }

      return {
        success: true,
        message: actionResult.message || `${productIds.length} ürünün durumu güncellendi`,
        data: {
          updatedCount: productIds.length,
          isActive
        }
      }

    } catch (error) {
      console.error('Product status update error:', error)
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

