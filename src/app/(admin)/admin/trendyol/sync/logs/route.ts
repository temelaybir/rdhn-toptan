import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mockSyncLogs } from '@/lib/supabase/mock/trendyol-mock-data'

// GET - Sync loglarını getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operationType = searchParams.get('operation_type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = await createClient()

    // Check if mock mode is enabled
    const { data: settings } = await supabase
      .from('trendyol_settings')
      .select('mock_mode')
      .single()

    if (settings?.mock_mode) {
      console.log('🎭 Mock Mode: Returning mock sync logs...')
      
      // Filter mock logs
      let filteredLogs = [...mockSyncLogs]
      
      if (operationType && operationType !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.operation_type === operationType)
      }
      
      if (status && status !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === status)
      }
      
      if (search) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      // Add more mock logs for better demo
      const additionalMockLogs = [
        {
          id: 4,
          operation_type: "CREATE_PRODUCT",
          product_id: 3,
          status: "SUCCESS",
          message: "Ürün başarıyla Trendyol'a eklendi: Çiçek Desenli Yelpaze",
          response_data: { trendyolProductId: "TY-003" },
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 dk önce
          execution_time_ms: 950,
          product_name: "Çiçek Desenli Yelpaze",
          product_sku: "YLP-4606"
        },
        {
          id: 5,
          operation_type: "UPDATE_PRICE",
          product_id: 1,
          status: "SUCCESS", 
          message: "Ürün fiyatı başarıyla güncellendi",
          response_data: { newPrice: 49.99 },
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 dk önce
          execution_time_ms: 650,
          product_name: "Klasik Çakmak",
          product_sku: "CAK-001"
        },
        {
          id: 6,
          operation_type: "UPLOAD_IMAGE",
          product_id: 2,
          status: "ERROR",
          message: "Görsel yükleme başarısız: Dosya boyutu çok büyük",
          response_data: null,
          error_details: "File size exceeds 5MB limit. Current size: 8.2MB",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
          execution_time_ms: 1200,
          product_name: "Zippo Benzini",
          product_sku: "ZCB-158"
        }
      ]
      
      filteredLogs = [...filteredLogs, ...additionalMockLogs]
      
      // Sort by date (newest first)
      filteredLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      return NextResponse.json({
        logs: filteredLogs,
        pagination: {
          page,
          limit,
          total: filteredLogs.length,
          totalPages: Math.ceil(filteredLogs.length / limit)
        }
      })
    }

    // Build query
    let query = supabase
      .from('trendyol_sync_logs')
      .select(`
        *,
        products(name, sku)
      `)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    // Apply filters
    if (operationType && operationType !== 'all') {
      query = query.eq('operation_type', operationType)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }
    
    if (search) {
      query = query.ilike('message', `%${search}%`)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Sync logs fetch error:', error)
      return NextResponse.json(
        { error: 'Sync logları getirilemedi' },
        { status: 500 }
      )
    }

    // Transform data
    const transformedLogs = (logs || []).map(log => ({
      ...log,
      product_name: log.products?.name || null,
      product_sku: log.products?.sku || null
    }))

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Sync logs API error:', error)
    return NextResponse.json(
      { error: 'Sync logları getirilemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Logları temizle
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if mock mode is enabled
    const { data: settings } = await supabase
      .from('trendyol_settings')
      .select('mock_mode')
      .single()

    if (settings?.mock_mode) {
      console.log('🎭 Mock Mode: Simulating log cleanup...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return NextResponse.json({
        success: true,
        message: 'Loglar başarıyla temizlendi (Mock Mode)'
      })
    }

    // Delete logs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { error } = await supabase
      .from('trendyol_sync_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo)

    if (error) {
      console.error('Log cleanup error:', error)
      return NextResponse.json(
        { error: 'Log temizleme başarısız' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Eski loglar başarıyla temizlendi'
    })

  } catch (error) {
    console.error('Log cleanup API error:', error)
    return NextResponse.json(
      { error: 'Log temizleme başarısız' },
      { status: 500 }
    )
  }
} 