import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SyncEngine } from '@ardahanticaret/trendyol-integration'
import { z } from 'zod'

const stockSyncConfigSchema = z.object({
  is_enabled: z.boolean(),
  sync_hour_1: z.number().min(0).max(23),
  sync_hour_2: z.number().min(0).max(23)
})

// GET - Stok sync konfigürasyonu
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: config, error } = await supabase
      .from('trendyol_stock_sync_config')
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Stok sync konfigürasyonu alınamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Stok sync konfigürasyonu alındı',
      data: config
    })

  } catch (error) {
    console.error('Stok sync config GET hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// POST - Manual stok senkronizasyonu
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'sync'

    switch (action) {
      case 'sync':
        return await handleManualStockSync()
      
      case 'config':
        const body = await request.json()
        return await handleConfigUpdate(body)
      
      default:
        return NextResponse.json(
          { error: 'Geçersiz action parametresi' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Stok sync POST hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// Manual stok senkronizasyonu
async function handleManualStockSync() {
  try {
    const syncEngine = new SyncEngine()
    const result = await syncEngine.performStockSync()

    return NextResponse.json({
      message: 'Manuel stok senkronizasyonu tamamlandı',
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

// Stok sync konfigürasyonu güncelleme
async function handleConfigUpdate(body: any) {
  try {
    const validationResult = stockSyncConfigSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Geçersiz veri',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { is_enabled, sync_hour_1, sync_hour_2 } = validationResult.data

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('trendyol_stock_sync_config')
      .update({
        is_enabled,
        sync_hour_1,
        sync_hour_2,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Konfigürasyon güncellenemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Stok sync konfigürasyonu güncellendi',
      data
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Config güncelleme hatası' 
      },
      { status: 500 }
    )
  }
} 