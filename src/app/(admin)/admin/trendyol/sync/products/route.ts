import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SyncEngine, QueueManager } from '@catkapinda/trendyol-integration'
import { z } from 'zod'

// Validation schemas
const syncProductSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'En az bir ürün ID gerekli').max(100, 'Maksimum 100 ürün'),
  immediate: z.boolean().default(false)
})

const singleProductSchema = z.object({
  productId: z.string().uuid('Geçersiz ürün ID'),
  immediate: z.boolean().default(false)
})

// POST - Ürün senkronizasyonu başlat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'sync'

    switch (action) {
      case 'sync':
        return await handleProductSync(body)
      
      case 'single':
        return await handleSingleProductSync(body)
      
      case 'stock':
        return await handleStockSync()
      
      case 'queue':
        return await handleQueueProcess()
      
      default:
        return NextResponse.json(
          { error: 'Geçersiz action parametresi' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Product sync API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// GET - Sync durumunu getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'status'

    const supabase = await createClient()

    if (type === 'status') {
      // Sync durumu
      const queueManager = new QueueManager()
      const queueStatus = await queueManager.getQueueStatus()

      // Son sync zamanı
      const { data: lastSync } = await supabase
        .from('trendyol_sync_logs')
        .select('created_at, operation_type, status')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Aktif ürün sayıları
      const { data: productStats } = await supabase
        .from('trendyol_products')
        .select('approval_status, sync_status')

      const stats = {
        total: productStats?.length || 0,
        approved: productStats?.filter(p => p.approval_status === 'APPROVED').length || 0,
        pending: productStats?.filter(p => p.approval_status === 'PENDING').length || 0,
        rejected: productStats?.filter(p => p.approval_status === 'REJECTED').length || 0,
        synced: productStats?.filter(p => p.sync_status === 'SUCCESS').length || 0
      }

      return NextResponse.json({
        queue: queueStatus,
        lastSync: lastSync ? {
          time: lastSync.created_at,
          operation: lastSync.operation_type,
          status: lastSync.status
        } : null,
        productStats: stats
      })

    } else if (type === 'logs') {
      // Log geçmişi
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data: logs, error, count } = await supabase
        .from('trendyol_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        throw error
      }

      return NextResponse.json({
        logs: logs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })

    } else {
      return NextResponse.json(
        { error: 'Geçersiz type parametresi' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Sync status API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// Çoklu ürün senkronizasyonu
async function handleProductSync(body: any) {
  const validationResult = syncProductSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Geçersiz veri',
        details: validationResult.error.format()
      },
      { status: 400 }
    )
  }

  const { productIds, immediate } = validationResult.data

  if (immediate) {
    // Hemen işle
    const syncEngine = new SyncEngine()
    const result = await syncEngine.createMultipleProducts(productIds)

    return NextResponse.json({
      message: 'Ürün senkronizasyonu tamamlandı',
      data: result
    })
  } else {
    // Kuyruğa ekle
    const queueManager = new QueueManager()
    const operations = productIds.map(productId => ({
      operationType: 'CREATE_PRODUCT' as const,
      payload: { productId }
    }))

    const queueResult = await queueManager.addBatchToQueue(operations)

    return NextResponse.json({
      message: 'Ürünler senkronizasyon kuyruğuna eklendi',
      data: queueResult
    })
  }
}

// Tekil ürün senkronizasyonu
async function handleSingleProductSync(body: any) {
  const validationResult = singleProductSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Geçersiz veri',
        details: validationResult.error.format()
      },
      { status: 400 }
    )
  }

  const { productId, immediate } = validationResult.data

  if (immediate) {
    // Hemen işle
    const syncEngine = new SyncEngine()
    const result = await syncEngine.createProduct(productId)

    return NextResponse.json({
      message: result.success ? 'Ürün başarıyla senkronize edildi' : 'Senkronizasyon başarısız',
      data: result
    })
  } else {
    // Kuyruğa ekle
    const queueManager = new QueueManager()
    const queueResult = await queueManager.addToQueue('CREATE_PRODUCT', { productId })

    return NextResponse.json({
      message: 'Ürün senkronizasyon kuyruğuna eklendi',
      data: queueResult
    })
  }
}

// Stok senkronizasyonu (günlük cronjob için)
async function handleStockSync() {
  try {
    const syncEngine = new SyncEngine()
    const result = await syncEngine.performStockSync()

    return NextResponse.json({
      message: 'Stok senkronizasyonu tamamlandı',
      data: result
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Stok sync hatası' 
      },
      { status: 500 }
    )
  }
}

// Kuyruk işleme
async function handleQueueProcess() {
  try {
    const syncEngine = new SyncEngine()
    const result = await syncEngine.processQueue()

    return NextResponse.json({
      message: 'Kuyruk işleme tamamlandı',
      data: result
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Kuyruk işleme hatası' 
      },
      { status: 500 }
    )
  }
} 