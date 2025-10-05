import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const mappingSchema = z.object({
  local_category_id: z.string().min(1, 'Local category ID gerekli'),
  trendyol_category_id: z.number().min(1, 'Trendyol category ID gerekli'),
  local_category_name: z.string().min(1, 'Local category name gerekli'),
  trendyol_category_name: z.string().min(1, 'Trendyol category name gerekli')
})

// GET - Mevcut eşleşmeleri getir
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: mappings, error } = await supabase
      .from('trendyol_categories')
      .select(`
        local_category_id,
        trendyol_category_id,
        category_name,
        local_category_id,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Category mappings fetch error:', error)
      return NextResponse.json(
        { error: 'Kategori eşleşmeleri getirilemedi' },
        { status: 500 }
      )
    }

    // Get product counts for each mapping
    const mappingsWithCounts = await Promise.all(
      (mappings || []).map(async (mapping) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', mapping.local_category_id)

        return {
          local_category_id: mapping.local_category_id,
          trendyol_category_id: mapping.trendyol_category_id,
          local_category_name: mapping.local_category_id, // This should be resolved from categories table
          trendyol_category_name: mapping.category_name,
          product_count: count || 0,
          is_active: mapping.is_active,
          created_at: mapping.created_at
        }
      })
    )

    return NextResponse.json({
      mappings: mappingsWithCounts
    })

  } catch (error) {
    console.error('Category mappings API error:', error)
    return NextResponse.json(
      { error: 'Kategori eşleşmeleri getirilemedi' },
      { status: 500 }
    )
  }
}

// POST - Yeni eşleşme oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = mappingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Geçersiz veri',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const supabase = await createClient()

    // Check if mapping already exists
    const { data: existingMapping } = await supabase
      .from('trendyol_categories')
      .select('id')
      .eq('local_category_id', validatedData.local_category_id)
      .eq('is_active', true)
      .single()

    if (existingMapping) {
      return NextResponse.json(
        { error: 'Bu kategori zaten eşleştirilmiş' },
        { status: 400 }
      )
    }

    // Create new mapping
    const { data: newMapping, error } = await supabase
      .from('trendyol_categories')
      .insert({
        trendyol_category_id: validatedData.trendyol_category_id,
        category_name: validatedData.trendyol_category_name,
        local_category_id: validatedData.local_category_id,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Category mapping creation error:', error)
      return NextResponse.json(
        { error: 'Kategori eşleşmesi oluşturulamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mapping: newMapping,
      message: 'Kategori eşleşmesi başarıyla oluşturuldu'
    })

  } catch (error) {
    console.error('Category mapping creation API error:', error)
    return NextResponse.json(
      { error: 'Kategori eşleşmesi oluşturulamadı' },
      { status: 500 }
    )
  }
} 