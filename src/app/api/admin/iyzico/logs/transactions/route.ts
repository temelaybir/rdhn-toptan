import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { iyzicoLogger } from '@/services/payment/iyzico-logger'

/**
 * GET - İyzico transaction logs
 */
export async function GET(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    console.log('📊 Fetching İyzico transaction logs...')

    const logs = await iyzicoLogger.getTransactionHistory(100)

    return {
      success: true,
      data: logs,
      count: logs.length
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