import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { iyzicoLogger } from '@/services/payment/iyzico-logger'

/**
 * GET - İyzico debug events
 */
export async function GET(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    console.log('🔍 Fetching İyzico debug events...')

    const events = await iyzicoLogger.getDebugEvents(200)

    return {
      success: true,
      data: events,
      count: events.length
    }
  })

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: result.error || 'Unauthorized'
    }, { status: result.status || 401 })
  }

  return NextResponse.json(result.data)
} 