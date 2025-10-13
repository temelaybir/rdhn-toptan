// Singleton instance
let adminSupabaseInstance: any = null

export async function createAdminSupabaseClient() {
  // Eğer instance varsa ve geçerliyse onu döndür
  if (adminSupabaseInstance) {
    return adminSupabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sadece hata durumunda log
  if (!supabaseUrl || !key) {
    console.log('🔍 Admin Supabase client check:', {
      hasUrl: !!supabaseUrl,
      hasServiceRole: !!supabaseServiceRoleKey,
      hasAnonKey: !!supabaseAnonKey
    })
  }

  // URL yoksa hata ver
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is missing')
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }

  // URL formatını kontrol et
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl)
    throw new Error('Invalid Supabase URL format')
  }

  // Service role key varsa onu kullan, yoksa anon key kullan (development için)
  const key = supabaseServiceRoleKey || supabaseAnonKey
  const keyType = supabaseServiceRoleKey ? 'service-role' : 'anon'
  
  if (!key) {
    console.error('❌ Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is available')
    throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Key formatını kontrol et
  if (key.length < 100) {
    console.error('❌ Supabase key seems too short:', key.length)
    throw new Error('Invalid Supabase key format')
  }

  try {
    // Dynamic import kullanarak createClient'ı al
    const { createClient } = await import('@supabase/supabase-js')
    
    if (typeof createClient !== 'function') {
      console.error('❌ createClient is not a function:', typeof createClient)
      throw new Error('Failed to import createClient from @supabase/supabase-js')
    }

    adminSupabaseInstance = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'admin-client'
        }
      }
    })

    // Client'ın doğru oluşturulduğunu test et
    if (!adminSupabaseInstance || typeof adminSupabaseInstance.from !== 'function') {
      console.error('❌ Supabase client oluşturulamadı - from methodu bulunamadı')
      console.error('Client type:', typeof adminSupabaseInstance)
      console.error('Client keys:', adminSupabaseInstance ? Object.keys(adminSupabaseInstance) : 'undefined')
      throw new Error('Supabase client initialization failed')
    }

    return adminSupabaseInstance

  } catch (error) {
    console.error('❌ Supabase client creation error:', error)
    // Hata durumunda instance'ı sıfırla
    adminSupabaseInstance = null
    throw new Error(`Supabase client oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
  }
}

// Instance'ı sıfırlama fonksiyonu (test ve debug için)
export function resetAdminClient() {
  adminSupabaseInstance = null
}