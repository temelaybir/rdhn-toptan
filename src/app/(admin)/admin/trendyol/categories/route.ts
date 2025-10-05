import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AttributeMapper } from '@catkapinda/trendyol-integration'
import { z } from 'zod'

// Validation schemas
const mapCategorySchema = z.object({
  localCategoryId: z.string().uuid('Geçersiz kategori ID'),
  trendyolCategoryId: z.number().int().positive('Geçersiz Trendyol kategori ID')
})

// GET - Trendyol kategorilerini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const syncMode = searchParams.get('sync') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const supabase = await createClient()

    if (syncMode) {
      // Check if mock mode is enabled
      const { data: settings } = await supabase
        .from('trendyol_settings')
        .select('mock_mode')
        .single()

      if (settings?.mock_mode) {
        console.log('🎭 Mock Mode: Simulating category sync...')
        // Simulate some delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return NextResponse.json({
          message: 'Kategoriler başarıyla senkronize edildi (Mock Mode)',
          data: { categoriesCount: 147 }
        })
      }

      // Trendyol'dan senkronize et
      const attributeMapper = new AttributeMapper()
      const syncResult = await attributeMapper.syncCategories()

      if (!syncResult.success) {
        return NextResponse.json(
          { error: syncResult.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: syncResult.message,
        data: syncResult.data
      })
    }

    // Veritabanından kategorileri getir
    let query = supabase
      .from('trendyol_categories')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `)

    // Arama filtresi
    if (search) {
      query = query.ilike('category_name', `%${search}%`)
    }

    // Sayfalama
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: categories, error, count } = await query
      .range(from, to)
      .order('category_name', { ascending: true })

    if (error) {
      console.error('Kategoriler getirme hatası:', error)
      return NextResponse.json(
        { error: 'Kategoriler alınamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      categories: categories || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Categories API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// POST - Kategori eşleştirmesi yap
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    const validationResult = mapCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Geçersiz veri',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { localCategoryId, trendyolCategoryId } = validationResult.data

    // Kategori eşleştirmesi yap
    const attributeMapper = new AttributeMapper()
    const mapResult = await attributeMapper.mapLocalCategory(
      localCategoryId, 
      trendyolCategoryId
    )

    if (!mapResult.success) {
      return NextResponse.json(
        { error: mapResult.error },
        { status: 500 }
      )
    }

    // Eşleştirmeden sonra attribute'ları da senkronize et
    const attrResult = await attributeMapper.syncCategoryAttributes(trendyolCategoryId)
    
    return NextResponse.json({
      message: 'Kategori eşleştirmesi başarıyla tamamlandı',
      data: {
        mapping: mapResult,
        attributes: attrResult
      }
    })

  } catch (error) {
    console.error('Kategori eşleştirme API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
} 