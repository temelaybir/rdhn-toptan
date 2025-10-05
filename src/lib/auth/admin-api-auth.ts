import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { headers } from 'next/headers'

export interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  force_password_change: boolean
}

export interface AdminAuthResult {
  success: boolean
  user?: AdminUser
  error?: string
}

// API route'lar için admin auth kontrolü
export async function validateAdminAuth(): Promise<AdminAuthResult> {
  try {
    const headersList = await headers()
    
    // Cookie'den veya header'dan token al
    const sessionToken = headersList.get('x-admin-session-token') || 
                        headersList.get('authorization')?.replace('Bearer ', '') ||
                        headersList.get('cookie')?.split(';')
                          .find(c => c.trim().startsWith('admin_session_token='))
                          ?.split('=')[1]

    if (!sessionToken) {
      return {
        success: false,
        error: 'Session token bulunamadı'
      }
    }

    const supabase = await createAdminSupabaseClient()
    
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
      return {
        success: false,
        error: 'Geçersiz session'
      }
    }

    const user = session.admin_users as any

    // Kullanıcı aktif mi?
    if (!user.is_active) {
      return {
        success: false,
        error: 'Kullanıcı aktif değil'
      }
    }

    return {
      success: true,
      user: user as AdminUser
    }

  } catch (error) {
    console.error('Admin auth validation error:', error)
    return {
      success: false,
      error: 'Auth doğrulama hatası'
    }
  }
}

// Admin API wrapper - auth kontrolü yapar
export async function withAdminAuth<T>(
  handler: (user: AdminUser) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  try {
    const authResult = await validateAdminAuth()
    
    if (!authResult.success || !authResult.user) {
      return {
        success: false,
        error: authResult.error || 'Yetkilendirme başarısız',
        status: 401
      }
    }

    const data = await handler(authResult.user)
    
    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('Admin API handler error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sunucu hatası',
      status: 500
    }
  }
} 