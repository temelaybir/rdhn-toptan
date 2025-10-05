import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST - Admin Panel Quick Login
 * Geliştirme amaçlı hızlı admin login
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Basit password kontrolü (geliştirme için)
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    if (password === adminPassword) {
      // Cookie set et
      const cookieStore = cookies()
      cookieStore.set('admin_logged_in', 'true', {
        httpOnly: true,
        secure: false, // Development için
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 saat
      })
      
      return NextResponse.json({
        success: true,
        message: 'Admin login başarılı',
        redirectUrl: '/admin/iyzico'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Yanlış şifre'
      }, { status: 401 })
    }
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Login failed',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET - Admin Panel Quick Login Page
 */
export async function GET() {
  const loginPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login</title>
    <style>
        body { font-family: Arial; max-width: 400px; margin: 100px auto; padding: 20px; }
        input, button { width: 100%; padding: 10px; margin: 5px 0; }
        button { background: #007cba; color: white; border: none; cursor: pointer; }
        button:hover { background: #005a87; }
        .error { color: red; margin: 10px 0; }
        .success { color: green; margin: 10px 0; }
    </style>
</head>
<body>
    <h2>🔐 Admin Panel Giriş</h2>
    <form id="loginForm">
        <input type="password" id="password" placeholder="Admin Şifre" required>
        <button type="submit">Giriş Yap</button>
    </form>
    <div id="message"></div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');
            
            try {
                const response = await fetch('/api/admin/quick-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    messageDiv.innerHTML = '<div class="success">✅ Giriş başarılı! Yönlendiriliyor...</div>';
                    setTimeout(() => {
                        window.location.href = data.redirectUrl;
                    }, 1000);
                } else {
                    messageDiv.innerHTML = '<div class="error">❌ ' + data.error + '</div>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">❌ Bağlantı hatası</div>';
            }
        });
    </script>
</body>
</html>`

  return new Response(loginPage, {
    headers: { 'Content-Type': 'text/html' }
  })
} 