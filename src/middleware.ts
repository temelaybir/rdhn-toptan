import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// SEO URL Mappings Cache (Edge Runtime uyumlu)
let SEO_URL_MAPPINGS: Record<string, string> = {}
let mappingsCacheTimestamp = 0
const MAPPINGS_CACHE_DURATION = 5 * 60 * 1000 // 5 dakika

// Cache'i güncelle (async ama await etme, performans için)
async function refreshMappingsCache(request: NextRequest) {
  const currentTime = Date.now()
  
  // Cache hala geçerli
  if (currentTime - mappingsCacheTimestamp < MAPPINGS_CACHE_DURATION && Object.keys(SEO_URL_MAPPINGS).length > 0) {
    return
  }

  try {
    console.log('🔄 SEO mappings cache güncelleniyor...')
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    // Build proper URL for internal API call
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : new URL(request.url).origin
    
    const response = await fetch(new URL('/api/seo/mappings-cache', baseUrl), {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        SEO_URL_MAPPINGS = result.data
        mappingsCacheTimestamp = currentTime
        console.log(`✅ ${Object.keys(SEO_URL_MAPPINGS).length} mapping cache'lendi`)
      }
    } else {
      console.warn(`⚠️ SEO cache API returned ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⏰ SEO mappings cache timeout - using existing cache')
    } else {
      console.error('Mappings cache refresh error:', error)
    }
    // Cache güncellemesi başarısız olursa mevcut cache'i kullan
  }
}

// Category fallback mappings (GÜVENLİ YÖNLENDIRMELER)
const CATEGORY_FALLBACKS: Record<string, string> = {
  'cakmak': '/urunler?kategori=cakmak',
  'bebek': '/urunler?kategori=oyuncak', 
  'oyuncak': '/urunler?kategori=oyuncak',
  'uzaktan-kumandali': '/urunler?kategori=oyuncak',
  'robot': '/urunler?kategori=oyuncak',
  'araba': '/urunler?kategori=oyuncak',
  'elektronik': '/urunler?kategori=elektronik',
  'spor': '/urunler?kategori=spor',
  'default': '/urunler'
}

// Admin rotaları
const ADMIN_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/urunler',
  '/admin/kategoriler',
  '/admin/siparisler',
  '/admin/musteriler',
  '/admin/raporlar',
  '/admin/ayarlar',
  '/admin/tema',
  '/admin/icerik',
  '/admin/bildirimler',
  '/admin/guvenlik',
  '/admin/site-ayarlari',
  '/admin/header-footer',
  '/admin/hero-slider',
  '/admin/kargo',
  '/admin/iyzico',
  '/admin/para-birimi',
  '/admin/trendyol'
]

// Production'da da çalışacak admin rotalar
const ADMIN_API_ROUTES = [
  '/api/admin/'
]

// Public admin rotaları (login sayfası gibi)
const PUBLIC_ADMIN_ROUTES = [
  '/admin/login',
  '/admin/change-password'
]

// Debug için public API routes
const PUBLIC_API_ROUTES = [
  '/api/admin/debug'
]

// Edge Runtime uyumlu session validation
async function validateAdminSession(sessionToken: string) {
  try {
    // Supabase client oluştur
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
    
    // Session'ı doğrula
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_users (
          id,
          username,
          email,
          full_name,
          role,
          is_active,
          force_password_change
        )
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error || !session || !session.admin_users) {
      return null
    }

    const user = session.admin_users as any

    // Kullanıcı aktif mi?
    if (!user.is_active) {
      return null
    }

    return user
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

// SEO URL Redirect fonksiyonu
function handleSeoRedirect(pathname: string, request: NextRequest): NextResponse | null {
  // Cache'i güncelle (async, await etme)
  refreshMappingsCache(request).catch(() => {})

  // 1. Exact match kontrolü
  if (SEO_URL_MAPPINGS[pathname]) {
    console.log(`🎯 SEO Redirect: ${pathname} → ${SEO_URL_MAPPINGS[pathname]}`)
    
    // Hit count'u artır (async, await etme)
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : new URL(request.url).origin
      
    fetch(new URL('/api/seo/mappings-cache', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_url: pathname }),
      signal: AbortSignal.timeout(3000) // 3 second timeout for hit count
    }).catch(() => {})
    
    return NextResponse.redirect(new URL(SEO_URL_MAPPINGS[pathname], request.url), 301)
  }

  // 2. Eski URL pattern'i kontrol et (.html ile bitenler)
  if (pathname.endsWith('.html')) {
    // Ürün adını çıkar
    const match = pathname.match(/\/([^\/]+)_([A-Za-z0-9\-]+)\.html$/)
    if (match) {
      const productSlug = match[1]
      const barcode = match[2]
      
      console.log(`🔍 Old URL detected: ${productSlug} (${barcode})`)

      // Kategori bazlı fallback
      let fallbackUrl = CATEGORY_FALLBACKS.default
      
      for (const [keyword, categoryUrl] of Object.entries(CATEGORY_FALLBACKS)) {
        if (keyword !== 'default' && productSlug.includes(keyword)) {
          fallbackUrl = categoryUrl
          break
        }
      }

      console.log(`📂 SEO Fallback: ${pathname} → ${fallbackUrl}`)
      return NextResponse.redirect(new URL(fallbackUrl, request.url), 301)
    }
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`🔍 Middleware: ${pathname}`)

  // SEO URL Redirects (En önce kontrol et)
  const seoRedirect = handleSeoRedirect(pathname, request)
  if (seoRedirect) {
    return seoRedirect
  }

  // Public API routes (debug) için auth bypass
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    console.log(`🔓 Public API route, bypassing auth: ${pathname}`)
    return NextResponse.next()
  }

  // Admin rotalarını kontrol et
  if (pathname.startsWith('/admin')) {
    // Public admin sayfaları için auth kontrolü yapmama
    if (PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Session token'ı al
    const sessionToken = request.cookies.get('admin_session_token')?.value ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

    console.log(`🔑 Session Token: ${sessionToken ? 'Found' : 'Not found'}`)
    // Debug: Cookie listesi
    const cookieNames = Array.from(request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`))
    console.log(`🍪 Cookies:`, cookieNames)

    if (!sessionToken) {
      console.log('❌ No session token, redirecting to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Session'ı doğrula
      const user = await validateAdminSession(sessionToken)
      
      if (!user) {
        console.log('❌ Invalid session, redirecting to login')
        // Invalid session, redirect to login and clear cookie
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.set('admin_session_token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 0,
          path: '/admin'
        })
        return response
      }

      console.log(`✅ Valid session for user: ${user.username} (${user.role})`)

      // Password change zorunlu mu?
      if (user.force_password_change && pathname !== '/admin/change-password') {
        console.log('🔒 Password change required, redirecting')
        return NextResponse.redirect(new URL('/admin/change-password', request.url))
      }

      // API route'lar için session token'ı request header'ına ekle
      if (pathname.startsWith('/admin/api/') || pathname.startsWith('/api/admin/')) {
        console.log(`🔗 Middleware setting session header for ${pathname}:`, sessionToken ? 'Token Set' : 'No Token')
        
        // Request headers'a user bilgisini ve session token'ı ekle
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-admin-session-token', sessionToken)
        requestHeaders.set('x-admin-user-id', user.id)
        requestHeaders.set('x-admin-user-role', user.role)
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          }
        })
      }
      
      // Normal sayfa rotaları için sadece response header'ı ekle
      const response = NextResponse.next()
      response.headers.set('x-admin-user-id', user.id)
      response.headers.set('x-admin-user-role', user.role)
      
      return response

    } catch (error) {
      console.error('Middleware error:', error)
      
      // Hata durumunda login'e yönlendir
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.set('admin_session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/admin'
      })
      return response
    }
  }

  // Diğer rotalar için normal davranış
  return NextResponse.next()
}

// Middleware'i hangi rotalar için çalıştıracağımızı belirt
export const config = {
  matcher: [
    /*
     * Match all admin routes and admin API routes + SEO redirects
     * Exclude: static files, images, favicon, public files, non-admin APIs
     */
    '/admin/:path*',
    '/api/admin/:path*',
    // SEO URL patterns (.html ile bitenler)
    '/:path*.html'
    // Not: Genel pattern'i kaldırdık çünkü SEO redirect'ler için sadece .html pattern'i yeterli
  ],
} 