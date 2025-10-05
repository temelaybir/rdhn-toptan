import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { iyzicoLogger } from '@/services/payment/iyzico-logger'

/**
 * GET - İyzico 3DS sessions
 */
export async function GET(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    console.log('🔒 Fetching İyzico 3DS sessions...')

    const sessions = await iyzicoLogger.getActiveSessions()

    return {
      success: true,
      data: sessions,
      count: sessions.length
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