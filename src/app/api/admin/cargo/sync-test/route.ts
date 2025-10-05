import { NextRequest, NextResponse } from 'next/server'

// Manual test endpoint for cargo sync (admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Manual cargo sync test started')

    // Create a request to our cron endpoint
    const cronRequest = new Request(
      new URL('/api/cron/sync-cargo', request.url).toString(),
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Import and call the cron function
    const { GET: cronHandler } = await import('@/app/api/cron/sync-cargo/route')
    const result = await cronHandler(cronRequest as NextRequest)
    
    const resultData = await result.json()

    console.log('✅ Manual sync completed:', resultData)

    return NextResponse.json({
      success: true,
      message: 'Manual cargo sync completed',
      testMode: true,
      timestamp: new Date().toISOString(),
      result: resultData
    })

  } catch (error) {
    console.error('❌ Manual sync test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Manual sync test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Get sync status
export async function GET(request: NextRequest) {
  try {
    // Return basic status info
    return NextResponse.json({
      status: 'ready',
      message: 'Cargo sync service is available',
      endpoints: {
        manualSync: '/api/admin/cargo/sync-test (POST)',
        cronSync: '/api/cron/sync-cargo (GET with auth)',
      },
      schedule: 'Every 30 minutes (Vercel Cron)',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
} 