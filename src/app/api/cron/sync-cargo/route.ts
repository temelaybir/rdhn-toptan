import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// TEMPORARY FIX: aras-cargo-integration package not available
// import { CargoNotificationService } from '../../../../../packages/aras-cargo-integration/src/cargo-notification-service'
// import { ArasCargoService } from '../../../../../packages/aras-cargo-integration/src/aras-cargo-service'
import type { PendingCargoOrder, CargoStatusUpdate } from '@/types/order'

// GET: Scheduled cron job (called by Vercel Cron)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('⚠️ Cargo sync cron job temporarily disabled (aras-cargo-integration not available)')

    const duration = Date.now() - startTime
    const result = {
      processedOrders: 0,
      updatedOrders: 0,
      errors: ['Service temporarily disabled'],
      duration,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: false,
      message: 'Cargo sync temporarily disabled',
      result
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('💥 Cargo sync cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST: Manual trigger for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual cargo sync triggered (temporarily disabled)')
    
    return NextResponse.json({
      success: false,
      message: 'Cargo sync temporarily disabled'
    }, { status: 503 })

  } catch (error) {
    console.error('❌ Manual sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}