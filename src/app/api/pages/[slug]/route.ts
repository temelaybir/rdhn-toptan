import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: page, error } = await supabase
      .from('internal_pages')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()

    if (error || !page) {
      return NextResponse.json(
        { error: 'Sayfa bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Sayfa getirme hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
