import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE - Kategori eşleşmesini sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mappingId = id
    const supabase = await createClient()

    // Soft delete the mapping by setting is_active to false
    const { error } = await supabase
      .from('trendyol_categories')
      .update({ is_active: false })
      .eq('local_category_id', mappingId)

    if (error) {
      console.error('Category mapping deletion error:', error)
      return NextResponse.json(
        { error: 'Kategori eşleşmesi silinemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kategori eşleşmesi başarıyla silindi'
    })

  } catch (error) {
    console.error('Category mapping deletion API error:', error)
    return NextResponse.json(
      { error: 'Kategori eşleşmesi silinemedi' },
      { status: 500 }
    )
  }
} 