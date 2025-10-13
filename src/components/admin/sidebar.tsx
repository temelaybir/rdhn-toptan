'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  Palette,
  BarChart,
  FileText,
  Bell,
  Shield,
  FolderOpen,
  Folder,
  Truck,
  DollarSign,
  Monitor,
  Menu,
  Store,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Banknote,
  FileEdit,
  Tag,
  Boxes
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'Hero Slider',
    href: '/admin/hero-slider',
    icon: Monitor
  },
  {
    title: 'Ürünler',
    href: '/admin/urunler',
    icon: Package
  },
  {
    title: 'Toptan Paket Yönetimi',
    href: '/admin/toptan-paket-yonetimi',
    icon: Boxes
  },
  {
    title: 'Kategoriler',
    href: '/admin/kategoriler',
    icon: Folder
  },
  {
    title: 'Siparişler',
    href: '/admin/siparisler',
    icon: ShoppingCart
  },
  {
    title: 'Kampanyalar',
    href: '/admin/kampanyalar',
    icon: Tag
  },
  {
    title: 'Müşteriler',
    href: '/admin/musteriler',
    icon: Users
  },
  {
    title: 'Kargo',
    href: '/admin/kargo',
    icon: Truck
  },
  {
    title: 'İyzico Ödeme',
    href: '/admin/iyzico',
    icon: CreditCard
  },
  {
    title: 'Banka Havalesi',
    href: '/admin/banka-havalesi',
    icon: Banknote
  },
  {
    title: 'Ödeme Yöntemleri',
    href: '/admin/odeme-yontemleri',
    icon: CreditCard
  },
  {
    title: 'İyzico Logları',
    href: '/admin/iyzico-loglar',
    icon: FileText
  },
  {
    title: 'Raporlar',
    href: '/admin/raporlar',
    icon: BarChart
  },
  {
    title: 'İçerik Yönetimi',
    href: '/admin/icerik',
    icon: FileText
  },
  {
    title: 'Tema Ayarları',
    href: '/admin/tema',
    icon: Palette
  },
  {
    title: 'Para Birimi',
    href: '/admin/para-birimi',
    icon: DollarSign
  },
  {
    title: 'Trendyol',
    href: '/admin/trendyol',
    icon: Store
  },
  {
    title: 'Header & Footer',
    href: '/admin/header-footer',
    icon: Menu
  },
  {
    title: 'İç Sayfalar',
    href: '/admin/ic-sayfalar',
    icon: FileEdit
  },
  {
    title: 'Site Ayarları',
    href: '/admin/site-ayarlari',
    icon: Settings
  },
  {
    title: 'Bildirimler',
    href: '/admin/bildirimler',
    icon: Bell
  },
  {
    title: 'Güvenlik',
    href: '/admin/guvenlik',
    icon: Shield
  }
]

const trendyolMenuItems = [
  {
    title: 'Ana Sayfa',
    href: '/admin/trendyol',
    icon: LayoutDashboard
  },
  {
    title: 'Dashboard',
    href: '/admin/trendyol/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Ürünler',
    href: '/admin/trendyol/urunler',
    icon: Package
  },
  {
    title: 'Kategori Eşleştirme',
    href: '/admin/trendyol/kategoriler',
    icon: FolderOpen
  },
  {
    title: 'Sync Logları',
    href: '/admin/trendyol/loglar',
    icon: FileText
  },
  {
    title: 'Ayarlar',
    href: '/admin/trendyol/ayarlar',
    icon: Settings
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isTrendyolOpen, setIsTrendyolOpen] = useState(pathname.startsWith('/admin/trendyol'))

  // Trendyol sayfasındaysa otomatik aç
  const isOnTrendyolPage = pathname.startsWith('/admin/trendyol')
  
  return (
    <div className="w-64 bg-card border-r flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b flex-shrink-0">
        <Link 
          href="/admin" 
          className="flex items-center gap-2 touch-manipulation"
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-lg">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <nav className="p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
              
              {/* Trendyol Collapsible Menu */}
              <li>
                <Collapsible open={isTrendyolOpen || isOnTrendyolPage} onOpenChange={setIsTrendyolOpen}>
                  <CollapsibleTrigger
                    className={cn(
                      'flex items-center justify-between w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                      isOnTrendyolPage
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4" />
                      <span>Trendyol Entegrasyonu</span>
                    </div>
                    {(isTrendyolOpen || isOnTrendyolPage) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <ul className="ml-6 mt-1 space-y-1">
                      {trendyolMenuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors touch-manipulation',
                                isActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              )}
                              style={{ 
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitUserSelect: 'none',
                                userSelect: 'none'
                              }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {item.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            </ul>
          </nav>
        </ScrollArea>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t bg-card">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <span>← Siteye Dön</span>
        </Link>
      </div>
    </div>
  )
} 