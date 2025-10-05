import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'

/**
 * SEO URL Mappings Management API
 * GET - Mapping'leri listele
 * POST - Yeni mapping ekle veya toplu import yap
 * PUT - Mapping güncelle
 * DELETE - Mapping sil
 */

// GET - URL mappings listesi
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const supabase = await createAdminSupabaseClient()
    const url = new URL(request.url)
    
    // Query parametreleri
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const search = url.searchParams.get('search')
    const matchType = url.searchParams.get('match_type')
    const isActive = url.searchParams.get('is_active')

    let query = supabase
      .from('seo_url_mappings')
      .select(`
        *,
        products(id, name, slug)
      `)
      .order('created_at', { ascending: false })

    // Filters
    if (search) {
      query = query.or(`old_url.ilike.%${search}%,new_url.ilike.%${search}%,old_product_name.ilike.%${search}%`)
    }

    if (matchType) {
      query = query.eq('match_type', matchType)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: mappings, error, count } = await query

    if (error) {
      console.error('URL mappings fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Mapping\'ler alınırken hata oluştu'
      }, { status: 500 })
    }

    // İstatistikler
    const { data: stats } = await supabase
      .from('seo_url_mappings')
      .select('match_type, is_active, hit_count')

    const statistics = {
      total: count || 0,
      active: stats?.filter(s => s.is_active).length || 0,
      inactive: stats?.filter(s => !s.is_active).length || 0,
      byMatchType: stats?.reduce((acc: any, s) => {
        acc[s.match_type] = (acc[s.match_type] || 0) + 1
        return acc
      }, {}),
      totalHits: stats?.reduce((sum, s) => sum + (s.hit_count || 0), 0) || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        mappings: mappings || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        statistics
      }
    })

  } catch (error: any) {
    console.error('URL mappings API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'API hatası'
    }, { status: 500 })
  }
}

// POST - Yeni mapping ekle veya toplu import
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createAdminSupabaseClient()

    // Toplu import için
    if (body.mappings && Array.isArray(body.mappings)) {
      console.log(`📥 Toplu import: ${body.mappings.length} mapping`)

      const { data: result, error } = await supabase
        .rpc('bulk_insert_url_mappings', {
          mappings: body.mappings
        })

      if (error) {
        console.error('Bulk insert error:', error)
        return NextResponse.json({
          success: false,
          error: 'Toplu import hatası: ' + error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${result} URL mapping başarıyla eklendi`,
        data: { insertedCount: result }
      })
    }

    // Tek mapping ekleme
    const {
      old_url,
      new_url,
      redirect_type = 301,
      match_type = 'manual',
      confidence = 1.0,
      old_product_name,
      old_barcode,
      product_id
    } = body

    if (!old_url || !new_url) {
      return NextResponse.json({
        success: false,
        error: 'old_url ve new_url gerekli'
      }, { status: 400 })
    }

    const { data: mapping, error } = await supabase
      .from('seo_url_mappings')
      .insert({
        old_url,
        new_url,
        redirect_type,
        match_type,
        confidence,
        old_product_name,
        old_barcode,
        product_id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          error: 'Bu URL zaten mevcut'
        }, { status: 409 })
      }

      console.error('Mapping insert error:', error)
      return NextResponse.json({
        success: false,
        error: 'Mapping eklenirken hata: ' + error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'URL mapping başarıyla eklendi',
      data: mapping
    })

  } catch (error: any) {
    console.error('URL mapping POST error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'API hatası'
    }, { status: 500 })
  }
}

// PUT - Mapping güncelle
export async function PUT(request: NextRequest) {
  try {
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Mapping ID gerekli'
      }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    const { data: mapping, error } = await supabase
      .from('seo_url_mappings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Mapping update error:', error)
      return NextResponse.json({
        success: false,
        error: 'Mapping güncellenirken hata: ' + error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'URL mapping başarıyla güncellendi',
      data: mapping
    })

  } catch (error: any) {
    console.error('URL mapping PUT error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'API hatası'
    }, { status: 500 })
  }
}

// DELETE - Mapping sil (tek veya toplu)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    // Body'den ids array'i kontrol et (toplu silme için)
    let ids: string[] = []
    
    if (request.method === 'DELETE' && request.body) {
      try {
        const body = await request.json()
        if (body.ids && Array.isArray(body.ids)) {
          ids = body.ids
        }
      } catch (e) {
        // Body parse edilemezse query param kullan
      }
    }

    const supabase = await createAdminSupabaseClient()

    // Toplu silme
    if (ids.length > 0) {
      console.log(`🗑️ Toplu silme: ${ids.length} mapping`)
      
      const { error } = await supabase
        .from('seo_url_mappings')
        .delete()
        .in('id', ids)

      if (error) {
        console.error('Bulk delete error:', error)
        return NextResponse.json({
          success: false,
          error: 'Mappings silinirken hata: ' + error.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${ids.length} URL mapping başarıyla silindi`
      })
    }

    // Tek silme (backward compatibility)
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Mapping ID veya IDs array gerekli'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('seo_url_mappings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Mapping delete error:', error)
      return NextResponse.json({
        success: false,
        error: 'Mapping silinirken hata: ' + error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'URL mapping başarıyla silindi'
    })

  } catch (error: any) {
    console.error('URL mapping DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'API hatası'
    }, { status: 500 })
  }
}
