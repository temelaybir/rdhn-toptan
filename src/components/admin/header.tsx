'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, User, LogOut, Settings, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'super_admin' | 'admin' | 'editor' | 'viewer'
}

export function AdminHeader() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('admin_user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (error) {
      console.error('Error loading admin user:', error)
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_session_token')
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie'leri dahil et
      })

      // API başarılı olsun ya da olmasın, localStorage'ı temizle
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_session_token')

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast.success('Başarıyla çıkış yaptınız')
        } else {
          toast.info('Çıkış yapıldı') // Hata mesajı gösterme, zaten çıkış yapıyoruz
        }
      } else {
        // API hatası olsa bile çıkış yap
        toast.info('Çıkış yapıldı')
      }

      // Her durumda login sayfasına yönlendir
      router.push('/admin/login')

    } catch (error) {
      console.warn('Logout API error (forcing logout anyway):', error)
      
      // API hatası olsa bile force logout
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_session_token')
      toast.info('Çıkış yapıldı')
      router.push('/admin/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Süper Admin'
      case 'admin': return 'Admin'
      case 'editor': return 'Editör'
      case 'viewer': return 'Görüntüleyici'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'editor': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
      {/* Left side - Breadcrumb or Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
      </div>

      {/* Right side - User actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {user ? getUserInitials(user.full_name) : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.full_name || 'Admin User'}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${getRoleColor(user?.role || 'admin')}`}>
                    {getRoleLabel(user?.role || 'admin')}
                  </Badge>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <div className="font-medium">{user?.full_name || 'Admin User'}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
              <User className="h-4 w-4 mr-2" />
              Profil
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push('/admin/ayarlar')}>
              <Settings className="h-4 w-4 mr-2" />
              Ayarlar
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push('/admin/guvenlik')}>
              <Shield className="h-4 w-4 mr-2" />
              Güvenlik
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
} 