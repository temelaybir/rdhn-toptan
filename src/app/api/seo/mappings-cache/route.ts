import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * SEO URL Mappings Cache API
 * Middleware için cache'lenmiş mapping'leri sağlar
 */

// Cache için global değişken (Edge Runtime'da çalışır)
let mappingsCache: Record<string, string> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika

export async function GET(request: NextRequest) {
  try {
    const currentTime = Date.now()
    
    // Cache geçerli mi kontrol et
    if (currentTime - cacheTimestamp < CACHE_DURATION && Object.keys(mappingsCache).length > 0) {
      return NextResponse.json({
        success: true,
        data: mappingsCache,
        cached: true,
        cacheAge: currentTime - cacheTimestamp
      })
    }

    console.log('🔄 SEO mappings cache güncelleniyor...')

    // Supabase client oluştur (anon key ile, RLS policy var)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { }
        }
      }
    )

    // Aktif mapping'leri çek
    const { data: mappings, error } = await supabase
      .from('seo_url_mappings')
      .select('old_url, new_url')
      .eq('is_active', true)
      .order('confidence', { ascending: false }) // Yüksek confidence önce

    if (error) {
      console.error('Mappings fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Mappings alınırken hata: ' + error.message
      }, { status: 500 })
    }

    // Cache'i güncelle
    mappingsCache = {}
    mappings?.forEach(mapping => {
      mappingsCache[mapping.old_url] = mapping.new_url
    })

    cacheTimestamp = currentTime

    console.log(`✅ ${mappings?.length || 0} mapping cache'lendi`)

    return NextResponse.json({
      success: true,
      data: mappingsCache,
      cached: false,
      count: mappings?.length || 0,
      timestamp: cacheTimestamp
    })

  } catch (error: any) {
    console.error('Mappings cache API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Cache API hatası'
    }, { status: 500 })
  }
}

// Hit count güncellemesi için
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { old_url } = body

    if (!old_url) {
      return NextResponse.json({
        success: false,
        error: 'old_url gerekli'
      }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { }
        }
      }
    )

    // Hit count'u artır
    const { error } = await supabase
      .rpc('increment_url_hit_count', {
        old_url_param: old_url
      })

    if (error) {
      console.error('Hit count update error:', error)
      // Hata logla ama response'u başarısız yapma
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Hit count API error:', error)
    return NextResponse.json({ success: true }) // Sessizce devam et
  }
}
