import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { mockApiResponses } from '@/lib/supabase/mock/trendyol-mock-data'

export async function GET(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    const { searchParams } = new URL(request.url)
    const includeTrendyol = searchParams.get('include_trendyol') === 'true'
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const supabase = await createAdminSupabaseClient()

    // Check if mock mode is enabled
    const { data: settings } = await supabase
      .from('trendyol_settings')
      .select('mock_mode')
      .single()

    if (settings?.mock_mode && includeTrendyol) {
      console.log('🎭 Mock Mode: Returning mock products...')
      
      // Filter mock products based on search and status
      let filteredProducts = mockApiResponses.localProducts.products
      
      if (search) {
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      if (status !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.trendyol_status === status)
      }
      
      return {
        products: filteredProducts,
        pagination: {
          page,
          limit,
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limit)
        }
      }
    }

    // Base query for products
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        stock_quantity,
        description,
        images,
        categories!inner(name),
        ${includeTrendyol ? `
          trendyol_products(
            id,
            trendyol_product_id,
            approval_status,
            rejection_reason,
            is_active,
            last_sync_at,
            sync_status,
            sync_error
          )
        ` : ''}
      `)
      .range(page * limit, (page + 1) * limit - 1)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    const { data: products, error, count } = await query

    if (error) {
      console.error('Products fetch error:', error)
      throw new Error('Ürünler getirilemedi')
    }

    // Transform data for frontend
    const transformedProducts = products?.map(product => {
      const trendyolData = includeTrendyol && product.trendyol_products?.[0]
      
      let trendyolStatus = 'not_synced'
      if (trendyolData) {
        if (trendyolData.sync_status === 'ERROR') {
          trendyolStatus = 'error'
        } else if (trendyolData.approval_status === 'APPROVED') {
          trendyolStatus = 'approved'
        } else if (trendyolData.approval_status === 'REJECTED') {
          trendyolStatus = 'rejected'
        } else if (trendyolData.approval_status === 'PENDING') {
          trendyolStatus = 'pending'
        }
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock_quantity,
        description: product.description,
        image: product.images?.[0] || null,
        category: product.categories?.name || 'Kategorisiz',
        trendyol_status: trendyolStatus,
        trendyol_product_id: trendyolData?.trendyol_product_id || null,
        last_sync: trendyolData?.last_sync_at || null,
        sync_error: trendyolData?.sync_error || null
      }
    }) || []

    // Apply Trendyol status filter
    let filteredProducts = transformedProducts
    if (status !== 'all') {
      filteredProducts = transformedProducts.filter(p => p.trendyol_status === status)
    }

    return {
      products: filteredProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
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