'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Menu, Search, User, X, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from '@/components/ui/navigation-menu'
import { useCart } from '@/context/cart-context'
import { useWishlist } from '@/context/wishlist-context'
import { CartIcon } from '@/components/cart/cart-icon'
import { cn } from '@/lib/utils'
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
  custom_css: string | null
  is_active: boolean
}

interface HeaderMenuItem {
  id: string
  title: string
  url: string
  order_position: number
  is_dropdown: boolean
  parent_id: string | null
  icon_name: string | null
  is_external: boolean
  is_active: boolean
}

// Varsayılan kategoriler (fallback)
const fallbackCategories = [
  { name: 'Elektronik', href: '/kategoriler/elektronik' },
  { name: 'Giyim', href: '/kategoriler/giyim' },
  { name: 'Kitap', href: '/kategoriler/kitap' },
  { name: 'Ev & Yaşam', href: '/kategoriler/ev-yasam' },
]

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null)
  const [menuItems, setMenuItems] = useState<HeaderMenuItem[]>([])
  const [categories, setCategories] = useState(fallbackCategories)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const { cart } = useCart()
  const { getTotalWishlistItems } = useWishlist()
  
  const totalItems = cart.totalItems
  const totalWishlistItems = getTotalWishlistItems()

  const [, setCartAnimating] = useState(false)
  const [isWishlistAnimating, setWishlistAnimating] = useState(false)

  const prevTotalItems = useRef(totalItems)
  const prevTotalWishlistItems = useRef(totalWishlistItems)

  // Header verilerini al
  const fetchHeaderData = async () => {
    try {
      console.log('Header verisi yükleniyor...')
      const supabase = createClient()
      
      const [settingsResult, menuItemsResult, categoriesResult] = await Promise.all([
        supabase.from('header_settings').select('*').eq('is_active', true).single(),
        supabase.from('header_menu_items').select('*').eq('is_active', true).order('order_position'),
        supabase.from('categories').select('id, name, slug').eq('is_active', true).order('order_position').limit(10)
      ])

      console.log('Header Settings Result:', settingsResult)
      console.log('Menu Items Result:', menuItemsResult)

      if (settingsResult.data) {
        console.log('Header ayarları güncelleniyor:', settingsResult.data)
        setHeaderSettings(settingsResult.data)
      }

      if (menuItemsResult.data) {
        console.log('Menü öğeleri güncelleniyor:', menuItemsResult.data)
        setMenuItems(menuItemsResult.data)
      }

      // Kategorileri güncelle
      if (categoriesResult.data && categoriesResult.data.length > 0) {
        const dbCategories = categoriesResult.data.map(cat => ({
          name: cat.name,
          href: `/kategoriler/${cat.slug}`
        }))
        setCategories(dbCategories)
        console.log('Kategoriler güncellendi:', dbCategories)
      }
      
      setIsLoaded(true)
      console.log('Header verisi yükleme tamamlandı')
    } catch (error) {
      console.error('Header verisi yükleme hatası:', error)
      setIsLoaded(true)
      // Hata durumunda varsayılan değerleri kullan
    }
  }

  // Event handler'ları useCallback ile optimize et
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  useEffect(() => {
    fetchHeaderData()
  }, [])

  // Debug için state'leri logla
  useEffect(() => {
    if (isLoaded) {
      console.log('Header state güncellendi:', {
        headerSettings,
        menuItems,
        siteName: headerSettings?.site_name,
        showLogo: headerSettings?.show_logo
      })
    }
  }, [headerSettings, menuItems, isLoaded])

  useEffect(() => {
    if (totalItems > prevTotalItems.current) {
      setCartAnimating(true)
      const timer = setTimeout(() => setCartAnimating(false), 500)
      return () => clearTimeout(timer)
    }
    prevTotalItems.current = totalItems
  }, [totalItems])

  useEffect(() => {
    if (totalWishlistItems > prevTotalWishlistItems.current) {
      setWishlistAnimating(true)
      const timer = setTimeout(() => setWishlistAnimating(false), 500)
      return () => clearTimeout(timer)
    }
    prevTotalWishlistItems.current = totalWishlistItems
  }, [totalWishlistItems])

  // Varsayılan değerler
  const siteName = headerSettings?.site_name || 'catkapinda'
  const showLogo = headerSettings?.show_logo !== false
  const showSearch = headerSettings?.show_search !== false
  const searchPlaceholder = headerSettings?.search_placeholder || 'Ürün ara...'
  const showCategories = headerSettings?.show_categories !== false
  const showAllProductsLink = headerSettings?.show_all_products_link !== false
  const allProductsText = headerSettings?.all_products_text || 'Tüm Ürünler'
  const showWishlist = headerSettings?.show_wishlist !== false
  const showCart = headerSettings?.show_cart !== false
  const showUserAccount = headerSettings?.show_user_account !== false

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Özel CSS varsa ekle */}
      {headerSettings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: headerSettings.custom_css }} />
      )}
      
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menüyü aç</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    {showLogo && (
                      <Link href="/" className="text-xl font-bold">
                        {siteName}
                      </Link>
                    )}
                  </div>
                  <nav className="flex-1 p-6">
                    <div className="space-y-4">
                      {/* Dinamik menü öğeleri */}
                      {menuItems.map((item) => (
                        <Link 
                          key={item.id}
                          href={item.url}
                          className="block text-lg font-medium hover:text-primary touch-manipulation"
                          target={item.is_external ? '_blank' : undefined}
                          rel={item.is_external ? 'noopener noreferrer' : undefined}
                          style={{ 
                            WebkitTapHighlightColor: 'transparent',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                          }}
                        >
                          {item.title}
                        </Link>
                      ))}

                      {showAllProductsLink && (
                        <Link 
                          href="/urunler" 
                          className="block text-lg font-medium hover:text-primary touch-manipulation"
                          style={{ 
                            WebkitTapHighlightColor: 'transparent',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none'
                          }}
                        >
                          {allProductsText}
                        </Link>
                      )}

                      {showCategories && (
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Kategoriler
                          </h3>
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <Link
                                key={category.id}
                                href={`/kategoriler/${category.slug}`}
                                className="block text-sm text-muted-foreground hover:text-primary pl-2 touch-manipulation"
                                style={{ 
                                  WebkitTapHighlightColor: 'transparent',
                                  WebkitTouchCallout: 'none',
                                  WebkitUserSelect: 'none',
                                  userSelect: 'none'
                                }}
                              >
                                {category.name}
                              </Link>
                            ))}
                            <Link
                              href="/kategoriler"
                              className="block text-sm text-primary font-medium pl-2 touch-manipulation"
                              style={{ 
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitUserSelect: 'none',
                                userSelect: 'none'
                              }}
                            >
                              Tüm Kategoriler →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            {showLogo && (
              <Link href="/" className="text-xl font-bold">
                {siteName}
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Dinamik menü öğeleri */}
              {menuItems.slice(0, 3).map((item) => (
                <NavigationMenuItem key={item.id}>
                  <NavigationMenuLink 
                    href={item.url} 
                    className="px-4 py-2"
                    target={item.is_external ? '_blank' : undefined}
                    rel={item.is_external ? 'noopener noreferrer' : undefined}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}

              {/* Kategoriler Dropdown */}
              {showCategories && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Kategoriler</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-6">
                      {categories.map((category) => (
                        <NavigationMenuLink
                          key={category.name}
                          href={category.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/20 border border-transparent focus:bg-primary/5 focus:text-primary"
                        >
                          <div className="text-sm font-medium leading-none">
                            {category.name}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {/* Tüm Ürünler */}
              {showAllProductsLink && (
                <NavigationMenuItem>
                  <NavigationMenuLink href="/urunler" className="px-4 py-2">
                    {allProductsText}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            {showSearch && (
              <div className="hidden md:flex relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            )}

            {/* Mobile Search */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleSearch}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Ara</span>
              </Button>
            )}

            {/* Wishlist */}
            {showWishlist && (
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/profil?tab=favorites">
                  <Heart className={cn("h-5 w-5", isWishlistAnimating && "animate-bounce")} />
                  {totalWishlistItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {totalWishlistItems}
                    </Badge>
                  )}
                  <span className="sr-only">Favoriler</span>
                </Link>
              </Button>
            )}

            {/* Cart */}
            {showCart && <CartIcon />}

            {/* User Account */}
            {showUserAccount && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profil">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Hesap</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && showSearch && (
          <div className="border-t py-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={closeSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// Component display name
Header.displayName = 'Header' 