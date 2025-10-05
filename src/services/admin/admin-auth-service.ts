import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { headers } from 'next/headers'

// Types
export interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'editor' | 'viewer'
  permissions: string[]
  is_active: boolean
  two_factor_enabled: boolean
  force_password_change: boolean
  last_login_at?: string
  created_at: string
}

export interface AdminSession {
  id: string
  admin_user_id: string
  session_token: string
  expires_at: string
  is_active: boolean
  ip_address?: string
  user_agent?: string
}

export interface AdminAuthResult {
  success: boolean
  user?: AdminUser
  error?: string
}

export interface LoginCredentials {
  username: string
  password: string
  remember_me?: boolean
}

export interface LoginResult {
  success: boolean
  user?: AdminUser
  session_token?: string
  expires_at?: string
  error?: string
  requires_password_change?: boolean
  requires_2fa?: boolean
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
  confirm_password: string
}

// JWT Secret
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-super-secret-admin-jwt-key-change-this-in-production'

export class AdminAuthService {
  private static instance: AdminAuthService
  
  public static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService()
    }
    return AdminAuthService.instance
  }

  // Login işlemi
  async login(credentials: LoginCredentials, request?: Request): Promise<LoginResult> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      // Kullanıcıyı username veya email ile bul
      const { data: user, error } = await supabase
        .from('admin_users')
        .select('*')
        .or(`username.eq.${credentials.username},email.eq.${credentials.username}`)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        // Brute force koruması için delay
        await this.delay(1000)
        return { success: false, error: 'Geçersiz kullanıcı adı veya şifre' }
      }

      // Hesap kilitli mi kontrol et
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { 
          success: false, 
          error: `Hesap kilitli. Kilidi açılacak: ${new Date(user.locked_until).toLocaleString('tr-TR')}` 
        }
      }

      // Şifre kontrolü
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
      
      if (!isValidPassword) {
        // Başarısız giriş denemesini kaydet
        await this.recordFailedLogin(user.id)
        await this.delay(1000)
        return { success: false, error: 'Geçersiz kullanıcı adı veya şifre' }
      }

      // 2FA kontrolü
      if (user.two_factor_enabled) {
        // TODO: 2FA implementation
        return { 
          success: false, 
          requires_2fa: true,
          error: '2FA kodu gerekli' 
        }
      }

      // Session oluştur
      const sessionData = await this.createSession(user.id, request)
      
      // Son giriş bilgisini güncelle
      await this.updateLastLogin(user.id, request)
      
      // Başarısız giriş denemelerini sıfırla
      await this.resetFailedLogins(user.id)

      // User permissions'ları al
      const permissions = await this.getUserPermissions(user.role)

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: user.role,
          permissions,
          is_active: user.is_active,
          two_factor_enabled: user.two_factor_enabled,
          force_password_change: user.force_password_change,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        },
        session_token: sessionData.session_token,
        expires_at: sessionData.expires_at,
        requires_password_change: user.force_password_change
      }

    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Giriş yapılırken hata oluştu' }
    }
  }

  // Session oluştur
  private async createSession(adminUserId: string, request?: Request): Promise<{session_token: string, expires_at: string}> {
    const supabase = await createAdminSupabaseClient()
    
    // Session token oluştur
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 8) // 8 saat

    // User agent ve IP bilgisi
    const userAgent = request?.headers.get('user-agent') || ''
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     ''

    // Session'ı kaydet
    const { data, error } = await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUserId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Session oluşturulamadı: ${error.message}`)
    }

    return {
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    }
  }

  // Session doğrula
  async validateSession(sessionToken: string): Promise<AdminUser | null> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      // Session'ı bul
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users (*)
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
        await this.deactivateSession(sessionToken, 'user_deactivated')
        return null
      }

      // Session activity'yi güncelle
      await this.updateSessionActivity(session.id)

      // Permissions'ları al
      const permissions = await this.getUserPermissions(user.role)

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        permissions,
        is_active: user.is_active,
        two_factor_enabled: user.two_factor_enabled,
        force_password_change: user.force_password_change,
        last_login_at: user.last_login_at,
        created_at: user.created_at
      }

    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  // Logout işlemi
  async logout(sessionToken: string): Promise<boolean> {
    try {
      return await this.deactivateSession(sessionToken, 'user_logout')
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  // Şifre değiştir
  async changePassword(userId: string, passwordData: PasswordChangeRequest): Promise<{success: boolean, error?: string}> {
    try {
      const supabase = await createAdminSupabaseClient()

      // Şifre validation
      if (passwordData.new_password !== passwordData.confirm_password) {
        return { success: false, error: 'Şifreler uyuşmuyor' }
      }

      if (passwordData.new_password.length < 8) {
        return { success: false, error: 'Şifre en az 8 karakter olmalı' }
      }

      // Kullanıcıyı bul
      const { data: user, error: userError } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'Kullanıcı bulunamadı' }
      }

      // Mevcut şifreyi kontrol et
      const isValidOldPassword = await bcrypt.compare(passwordData.current_password, user.password_hash)
      if (!isValidOldPassword) {
        return { success: false, error: 'Mevcut şifre hatalı' }
      }

      // Yeni şifreyi hash'le
      const newPasswordHash = await bcrypt.hash(passwordData.new_password, 10)

      // Şifreyi güncelle
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          password_hash: newPasswordHash,
          password_changed_at: new Date().toISOString(),
          force_password_change: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Şifre güncellenemedi' }
      }

      return { success: true }

    } catch (error) {
      console.error('Password change error:', error)
      return { success: false, error: 'Şifre değiştirme sırasında hata oluştu' }
    }
  }

  // Kullanıcı yetkilerini al
  private async getUserPermissions(role: string): Promise<string[]> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      const { data: permissions } = await supabase
        .from('admin_role_permissions')
        .select('permission_name')
        .eq('role', role)

      return permissions?.map((p: { permission_name: string }) => p.permission_name) || []
    } catch {
      return []
    }
  }

  // Yetki kontrolü
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      // Kullanıcının rolünü al
      const { data: user } = await supabase
        .from('admin_users')
        .select('role, permissions')
        .eq('id', userId)
        .single()

      if (!user) return false

      // Super admin her şeyi yapabilir
      if (user.role === 'super_admin') return true

      // Kullanıcının custom permissions'ını kontrol et
      if (user.permissions && user.permissions.includes(permission)) {
        return true
      }

      // Role permissions'ını kontrol et
      const rolePermissions = await this.getUserPermissions(user.role)
      return rolePermissions.includes(permission)

    } catch {
      return false
    }
  }

  // Activity log'u kaydet
  async logActivity(
    adminUserId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    description?: string,
    oldValues?: any,
    newValues?: any,
    sessionId?: string,
    request?: Request
  ): Promise<void> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_user_id: adminUserId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          description,
          old_values: oldValues,
          new_values: newValues,
          session_id: sessionId,
          ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
          user_agent: request?.headers.get('user-agent'),
          status: 'success'
        })
    } catch (error) {
      console.error('Activity log error:', error)
    }
  }

  // Helper functions
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Başarısız giriş kaydet
  private async recordFailedLogin(userId: string): Promise<void> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      // Failed attempts'i artır
      const { data: user } = await supabase
        .from('admin_users')
        .select('failed_login_attempts')
        .eq('id', userId)
        .single()

      const failedAttempts = (user?.failed_login_attempts || 0) + 1
      const lockThreshold = 5

      const updateData: any = {
        failed_login_attempts: failedAttempts,
        updated_at: new Date().toISOString()
      }

      // 5 başarısız denemeden sonra hesabı kilitle
      if (failedAttempts >= lockThreshold) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + 30) // 30 dakika kilitle
        updateData.locked_until = lockUntil.toISOString()
      }

      await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', userId)

    } catch (error) {
      console.error('Failed login record error:', error)
    }
  }

  // Başarısız girişleri sıfırla
  private async resetFailedLogins(userId: string): Promise<void> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      await supabase
        .from('admin_users')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    } catch (error) {
      console.error('Reset failed logins error:', error)
    }
  }

  // Son giriş bilgisini güncelle
  private async updateLastLogin(userId: string, request?: Request): Promise<void> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      const updateData = {
        last_login_at: new Date().toISOString(),
        last_login_ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
        updated_at: new Date().toISOString()
      }

      await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', userId)

    } catch (error) {
      console.error('Update last login error:', error)
    }
  }

  // Session'ı deaktive et
  private async deactivateSession(sessionToken: string, reason: string): Promise<boolean> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      const { error } = await supabase
        .from('admin_sessions')
        .update({
          is_active: false,
          logout_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('session_token', sessionToken)

      return !error
    } catch {
      return false
    }
  }

  // Session activity güncelle
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const supabase = await createAdminSupabaseClient()
      
      await supabase
        .from('admin_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

    } catch (error) {
      console.error('Update session activity error:', error)
    }
  }
}

// Export singleton instance
export const adminAuthService = AdminAuthService.getInstance() 

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