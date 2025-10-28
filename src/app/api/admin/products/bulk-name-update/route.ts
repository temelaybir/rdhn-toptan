import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/services/admin/admin-auth-service'

// Toplu ürün adı güncelleme endpoint'i
export async function POST(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    try {
      const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-client')
      const supabase = await createAdminSupabaseClient()

      const body = await request.json()
      const { updates } = body

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        throw new Error('Güncellenecek ürün bilgisi gerekli')
      }

      // Her ürün için ayrı güncelleme
      const promises = updates.map(async (update: { id: string; name: string }) => {
        const { data, error } = await supabase
          .from('products')
          .update({
            name: update.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
          .select()

        if (error) {
          console.error('Ürün adı güncelleme hatası:', error)
          throw error
        }

        return data
      })

      const results = await Promise.all(promises)

      return {
        success: true,
        message: `${updates.length} ürünün adı güncellendi`,
        data: {
          updatedCount: results.length
        }
      }

    } catch (error) {
      console.error('Bulk name update error:', error)
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

