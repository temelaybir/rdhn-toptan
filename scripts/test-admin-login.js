// Admin Login Test Script
// Browser console'da bu script'i çalıştırabilirsiniz

async function testAdminLogin() {
  const loginData = {
    username: 'admin',
    password: 'admin123',
    remember_me: false
  }

  console.log('🔐 Admin login test başlatılıyor...')
  console.log('Test verileri:', loginData)

  try {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(loginData),
    })

    console.log('📡 Response Status:', response.status)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))

    const result = await response.json()
    console.log('📦 Response Data:', result)

    if (result.success) {
      console.log('✅ Login başarılı!')
      console.log('👤 User:', result.user)
      console.log('🎫 Session Token:', result.session_token)
      console.log('⏰ Expires At:', result.expires_at)
      
      // Cookie kontrolü
      console.log('🍪 Cookies:', document.cookie)
      
      // LocalStorage kontrolü
      const sessionToken = localStorage.getItem('admin_session_token')
      const user = localStorage.getItem('admin_user')
      console.log('💾 LocalStorage Session Token:', sessionToken)
      console.log('💾 LocalStorage User:', user)
    } else {
      console.error('❌ Login başarısız:', result.error)
    }

    return result

  } catch (error) {
    console.error('💥 Hata:', error)
    return { success: false, error: error.message }
  }
}

// Test'i çalıştır
testAdminLogin()

