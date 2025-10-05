'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SafeImage } from '@/components/ui/safe-image'
import { Menu, Search, User, Heart, Phone, Mail, MapPin, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useCart } from '@/context/cart-context'
import { useWishlist } from '@/context/wishlist-context'
import { Customer } from '@/services/customer-auth-service'
import { EnhancedSearch } from './enhanced-search'
import { MegaMenu } from './mega-menu'
import { CartButton, EnhancedCartIcon } from '../cart/enhanced-cart-icon'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface HeaderSettings {
  id: string
  site_name: string
  show_logo: boolean
  show_search: boolean
  search_placeholder: string
  show_categories: boolean
  show_all_products_link: boolean
  all_products_text: string
  show_wishlist: boolean
  show_cart: boolean
  show_user_account: boolean
  show_top_bar: boolean
  top_bar_phone: string
  top_bar_email: string
  top_bar_free_shipping_text: string
  show_quick_links: boolean
  custom_css: string | null
  is_active: boolean
}

interface HeaderQuickLink {
  id: string
  title: string
  url: string
  order_position: number
  is_external: boolean
  is_active: boolean
}

interface SiteInfo {
  site_name: string
  site_logo_url: string
  site_logo_dark_url: string | null
  logo_display_mode: 'logo_only' | 'text_only' | 'logo_with_text'
  logo_size: 'small' | 'medium' | 'large'
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

// quickLinks artık veritabanından çekiliyor

const defaultCategories = [
  { id: '1', name: 'Teknoloji', slug: 'teknoloji', icon: '📱' },
  { id: '2', name: 'Moda & Giyim', slug: 'moda-giyim', icon: '👔' },
  { id: '3', name: 'Ev & Yaşam', slug: 'ev-yasam', icon: '🏠' },
  { id: '4', name: 'Spor & Outdoor', slug: 'spor-outdoor', icon: '⚽' },
  { id: '5', name: 'Kozmetik', slug: 'kozmetik', icon: '💄' },
  { id: '6', name: 'Kitap & Kırtasiye', slug: 'kitap-kirtasiye', icon: '📚' },
  { id: '7', name: 'Oyuncak', slug: 'oyuncak', icon: '🧸' },
  { id: '8', name: 'Anne & Bebek', slug: 'anne-bebek', icon: '👶' },
]

export function NewHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null)
  const [quickLinks, setQuickLinks] = useState<HeaderQuickLink[]>([])
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    site_name: 'RDHN Commerce',
    site_logo_url: '/logo.svg',
    site_logo_dark_url: null,
    logo_display_mode: 'logo_with_text',
    logo_size: 'medium'
  })
  
  const {} = useCart()
  const { getTotalWishlistItems } = useWishlist()
  
  // Customer magic link sistemi
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const totalWishlistItems = getTotalWishlistItems()

  // Customer authentication check
  useEffect(() => {
    const customerData = sessionStorage.getItem('customer')
    if (customerData) {
      try {
        const parsedCustomer = JSON.parse(customerData) as Customer
        setCustomer(parsedCustomer)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Invalid customer data:', error)
        sessionStorage.removeItem('customer')
      }
    }
  }, [])

  // Site bilgilerini getir
  useEffect(() => {
    async function fetchSiteInfo() {
      try {
        const supabase = createClient()
        
        const [headerResult, quickLinksResult, siteResult, categoriesResult] = await Promise.all([
          supabase
            .from('header_settings')
            .select('*')
            .eq('is_active', true)
            .single(),
          supabase
            .from('header_quick_links')
            .select('*')
            .eq('is_active', true)
            .order('order_position'),
          supabase
            .from('site_settings')
            .select('site_name, site_logo_url, site_logo_dark_url, logo_display_mode, logo_size')
            .eq('is_active', true)
            .single(),
          supabase
            .from('categories')
            .select('id, name, slug')
            .eq('is_active', true)
            .order('sort_order')
            .limit(8)
        ])

        if (!headerResult.error && headerResult.data) {
          setHeaderSettings(headerResult.data as HeaderSettings)
        }

        if (!quickLinksResult.error && quickLinksResult.data) {
          setQuickLinks(quickLinksResult.data as HeaderQuickLink[])
        }

        if (!siteResult.error && siteResult.data) {
          setSiteInfo(siteResult.data as SiteInfo)
        }

        if (!categoriesResult.error && categoriesResult.data && categoriesResult.data.length > 0) {
          // Kategorilere varsayılan ikonlar ekle
          const categoriesWithIcons = categoriesResult.data.map((cat, index) => ({
            ...cat,
            icon: defaultCategories[index % defaultCategories.length]?.icon || '📦'
          }))
          setCategories(categoriesWithIcons)
        }
      } catch (error) {
        console.error('Site bilgileri yüklenemedi:', error)
      }
    }

    fetchSiteInfo()
  }, [])

  const handleLogin = () => {
    // Magic link login sayfasına yönlendir
    window.location.href = '/auth/login'
  }

  const handleLogout = () => {
    // Customer session'ını temizle
    sessionStorage.removeItem('customer')
    setCustomer(null)
    setIsLoggedIn(false)
    toast.success('Başarıyla çıkış yapıldı')
    
    // Ana sayfaya yönlendir
    if (window.location.pathname.includes('/profil')) {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Özel CSS varsa ekle */}
      {headerSettings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: headerSettings.custom_css }} />
      )}
      {/* Top Bar */}
      {(headerSettings?.show_top_bar !== false) && (
        <div className="border-b bg-secondary text-secondary-foreground hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-12 text-sm">
              <div className="hidden md:flex items-center gap-6">
                {headerSettings?.top_bar_phone && (
                  <div className="flex items-center gap-2 text-secondary-foreground/80">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{headerSettings.top_bar_phone}</span>
                  </div>
                )}
                {headerSettings?.top_bar_email && (
                  <div className="flex items-center gap-2 text-secondary-foreground/80">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">{headerSettings.top_bar_email}</span>
                  </div>
                )}
              </div>
              
              {(headerSettings?.show_quick_links !== false) && quickLinks.length > 0 && (
                <div className="flex items-center gap-6">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.url}
                      target={link.is_external ? '_blank' : undefined}
                      rel={link.is_external ? 'noopener noreferrer' : undefined}
                      className="text-secondary-foreground/80 hover:text-primary transition-colors font-semibold text-sm uppercase tracking-wide"
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
              )}
              
              {headerSettings?.top_bar_free_shipping_text && (
                <div className="hidden md:flex items-center gap-2 text-secondary-foreground/80">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{headerSettings.top_bar_free_shipping_text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className={cn(
        "transition-all duration-200",
        isScrolled && "shadow-sm border-b"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24 py-3">
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-8 border-b">
                      <Link href="/" className="text-3xl font-bold text-primary">
                        {headerSettings?.site_name || 'RDHN Commerce'}
                      </Link>
                    </div>
                    
                    <nav className="flex-1 overflow-y-auto">
                      <div className="p-8 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-6">Kategoriler</h3>
                          <div className="space-y-4">
                            {categories.map((category) => (
                              <Link
                                key={category.id}
                                href={`/kategoriler/${category.slug}`}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <span className="text-2xl">{category.icon}</span>
                                <span className="font-medium">{category.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                        
                        {(headerSettings?.show_quick_links !== false) && quickLinks.length > 0 && (
                          <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Hızlı Erişim</h3>
                            <div className="space-y-3">
                              {quickLinks.map((link) => (
                                <Link
                                  key={link.id}
                                  href={link.url}
                                  target={link.is_external ? '_blank' : undefined}
                                  rel={link.is_external ? 'noopener noreferrer' : undefined}
                                  className="block p-3 rounded-lg hover:bg-accent transition-colors font-medium"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {link.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        

                      </div>
                    </nav>
                    
                    <div className="border-t p-6">
                      {isLoggedIn && customer ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">
                              {customer.first_name || customer.email.split('@')[0]}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <Link href="/profil" onClick={() => setIsMobileMenuOpen(false)}>
                                <User className="h-4 w-4 mr-2" />
                                Profil
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                handleLogout()
                                setIsMobileMenuOpen(false)
                              }}
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Hesabım
                            </span>
                          </div>
                          <Button 
                            className="w-full" 
                            size="sm" 
                            onClick={() => {
                              handleLogin()
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Giriş Yap
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              {(headerSettings?.show_logo !== false) && (
                <div className="flex items-center">
                  <Link href="/" className="flex items-center gap-4">
                    {siteInfo.site_logo_url.endsWith('.svg') || siteInfo.site_logo_url.includes('svg') ? (
                      <div className={cn(
                        "bg-primary text-primary-foreground rounded-lg flex items-center justify-center",
                        siteInfo.logo_size === 'small' && "w-[200px] h-16 p-3",
                        siteInfo.logo_size === 'medium' && "w-[220px] h-20 p-4", 
                        siteInfo.logo_size === 'large' && "w-[240px] h-24 p-5"
                      )}>
                        <span className={cn(
                          "font-bold",
                          siteInfo.logo_size === 'small' && "text-2xl",
                          siteInfo.logo_size === 'medium' && "text-3xl",
                          siteInfo.logo_size === 'large' && "text-4xl"
                        )}>
                          {(headerSettings?.site_name || siteInfo.site_name).charAt(0)}
                        </span>
                      </div>
                    ) : (
                      <SafeImage
                        src={siteInfo.site_logo_url}
                        alt={headerSettings?.site_name || siteInfo.site_name}
                        width={
                          siteInfo.logo_size === 'small' ? 200 :
                          siteInfo.logo_size === 'medium' ? 220 : 240
                        }
                        height={
                          siteInfo.logo_size === 'small' ? 80 :
                          siteInfo.logo_size === 'medium' ? 90 : 100
                        }
                        className="rounded-lg object-contain"
                      />
                    )}
                    
                    {siteInfo.logo_display_mode === 'logo_with_text' && (
                      <span className={cn(
                        "font-bold text-primary hidden sm:block",
                        siteInfo.logo_size === 'small' && "text-2xl",
                        siteInfo.logo_size === 'medium' && "text-3xl",
                        siteInfo.logo_size === 'large' && "text-4xl"
                      )}>
                        {headerSettings?.site_name || siteInfo.site_name}
                      </span>
                    )}
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {(headerSettings?.show_all_products_link !== false) && (
                <Link 
                  href="/urunler" 
                  className="text-lg font-semibold uppercase hover:text-primary transition-colors tracking-wide"
                >
                  {headerSettings?.all_products_text || 'Tüm Ürünler'}
                </Link>
              )}
              {(headerSettings?.show_categories !== false) && (
                <MegaMenu />
              )}

            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              {/* Desktop Search */}
              {(headerSettings?.show_search !== false) && (
                <div className="hidden md:block">
                  <EnhancedSearch 
                    className="w-96" 
                    placeholder={headerSettings?.search_placeholder || "Ürün ara..."}
                  />
                </div>
              )}

              {/* Mobile Search */}
              {(headerSettings?.show_search !== false) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10"
                  asChild
                >
                  <Link href="/arama">
                    <Search className="h-6 w-6" />
                    <span className="sr-only">Ara</span>
                  </Link>
                </Button>
              )}

              {/* Wishlist */}
              {(headerSettings?.show_wishlist !== false) && (
                isLoggedIn ? (
                  <Button variant="ghost" size="icon" className="relative h-10 w-10" asChild>
                    <Link href="/profil?tab=favorites">
                      <Heart className="h-6 w-6" />
                      {totalWishlistItems > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                          {totalWishlistItems}
                        </Badge>
                      )}
                      <span className="sr-only">Favoriler</span>
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative h-10 w-10" 
                    onClick={() => toast.info('Favorileri görmek için giriş yapın')}
                  >
                    <Heart className="h-6 w-6" />
                    <span className="sr-only">Favoriler</span>
                  </Button>
                )
              )}

              {/* Cart - Mobile */}
              {(headerSettings?.show_cart !== false) && (
                <div className="md:hidden">
                  <EnhancedCartIcon variant="icon" />
                </div>
              )}

              {/* Cart - Desktop */}
              {(headerSettings?.show_cart !== false) && (
                <div className="hidden md:block">
                  <CartButton />
                </div>
              )}

              {/* User Account */}
              {(headerSettings?.show_user_account !== false) && (
                isLoggedIn && customer ? (
                  <div className="hidden md:flex items-center gap-2">
                    {/* User Info */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {customer.first_name || customer.email.split('@')[0]}
                      </span>
                    </div>
                    
                    {/* Profile Button */}
                    <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
                      <Link href="/profil">
                        <User className="h-6 w-6" />
                        <span className="sr-only">Profil</span>
                      </Link>
                    </Button>
                    
                    {/* Logout Button */}
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleLogout}>
                      <LogOut className="h-6 w-6" />
                      <span className="sr-only">Çıkış</span>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden md:flex items-center gap-2" 
                    onClick={handleLogin}
                  >
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {(headerSettings?.show_search !== false) && (
        <div className="md:hidden border-t hidden">
          <div className="container mx-auto px-4 py-4">
            <EnhancedSearch placeholder={headerSettings?.search_placeholder || "Ürün, kategori, marka ara..."} />
          </div>
        </div>
      )}
    </header>
  )
}