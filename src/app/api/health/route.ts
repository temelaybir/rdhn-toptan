import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Temel sistem bilgileri
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      node: {
        version: process.version,
        env: process.env.NODE_ENV
      },
      app: {
        name: 'RDHN Commerce',
        version: '1.0.0'
      }
    }

    // Database bağlantısını kontrol et (opsiyonel)
    try {
      // Burada Supabase bağlantısını test edebilirsiniz
      // const { data, error } = await supabase.from('site_settings').select('id').limit(1)
      // if (error) throw error
      healthData.database = { status: 'connected' }
    } catch (error) {
      healthData.database = { 
        status: 'error', 
        message: 'Database connection failed' 
      }
    }

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// HEAD method için de aynı response
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
} 