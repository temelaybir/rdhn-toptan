'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

// Login sayfalarında layout gösterme
const NO_LAYOUT_PAGES = [
  '/admin/login',
  '/admin/change-password'
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Login ve benzeri sayfalarda full page layout
  if (NO_LAYOUT_PAGES.some(page => pathname.startsWith(page))) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    )
  }

  // Normal admin sayfalarında sidebar + header layout
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 