import { NextRequest, NextResponse } from 'next/server'
import { adminAuthService } from '@/services/admin/admin-auth-service'

// Node.js runtime gerekli (bcryptjs için)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie or header
    const sessionToken = request.cookies.get('admin_session_token')?.value ||
                        request.headers.get('authorization')?.replace('Bearer ', '')

    let success = true // Default to success for logout

    if (sessionToken) {
      // Eğer session token varsa, proper logout yap
      try {
        success = await adminAuthService.logout(sessionToken)
      } catch (error) {
        console.warn('Session logout failed, but clearing cookie anyway:', error)
        // Session logout başarısız olsa bile cookie'yi temizle
        success = true
      }
    } else {
      // Session token yoksa, sadece cookie'yi temizle (zaten logout olmuş sayılır)
      console.log('No session token found for logout, clearing cookie anyway')
    }

    // Clear cookie - her durumda
    const response = NextResponse.json({
      success: true, // Logout her zaman başarılı
      message: 'Başarıyla çıkış yapıldı'
    })

    // Remove session cookie
    response.cookies.set('admin_session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin'
    })

    return response

  } catch (error) {
    console.error('Admin logout API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
}

// Options for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 