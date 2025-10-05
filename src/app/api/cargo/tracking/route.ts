import { NextRequest, NextResponse } from 'next/server'
// TEMPORARY FIX: aras-cargo-integration package not available
// import { ArasCargoService } from '../../../../../packages/aras-cargo-integration/src/aras-cargo-service'
// import { CargoStatus } from '@/types/cargo'

/**
 * POST - Kargo takip bilgilerini getirir
 */
export async function POST(request: NextRequest) {
  // TEMPORARY: Service disabled until aras-cargo-integration is available
  return NextResponse.json({ 
    success: false, 
    error: 'Cargo tracking temporarily disabled' 
  }, { status: 503 })
}