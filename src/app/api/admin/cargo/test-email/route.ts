import { NextRequest, NextResponse } from 'next/server'
// TEMPORARY FIX: aras-cargo-integration package not available
// import { CargoNotificationService } from '../../../../../../packages/aras-cargo-integration/src/cargo-notification-service'

export async function POST(request: NextRequest) {
  // TEMPORARY: Service disabled until aras-cargo-integration is available
  return NextResponse.json({ 
    success: false, 
    error: 'Cargo notification service temporarily disabled' 
  }, { status: 503 })
}