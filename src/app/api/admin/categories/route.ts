import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    const supabase = await createAdminSupabaseClient()

    // Get categories with product counts
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Categories fetch error:', error)
      throw new Error('Kategoriler getirilemedi')
    }

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)

        return {
          ...category,
          product_count: count || 0
        }
      })
    )

    return {
      categories: categoriesWithCounts
    }
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 500 }
    )
  }

  return NextResponse.json(result.data)
} 