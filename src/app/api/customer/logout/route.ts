import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // ✅ Cookie'yi temizle
    const response = NextResponse.json({
      success: true,
      message: 'Çıkış başarılı'
    })

    response.cookies.set('customer_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // ✅ Immediately expire
      path: '/'
    })

    return response

  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      error: 'Çıkış sırasında bir hata oluştu'
    }, { status: 500 })
  }
}

