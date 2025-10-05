import { NewHeader } from '@/components/layout/new-header'
import { Footer } from '@/components/layout/footer'
import { MiniCart } from '@/components/cart/mini-cart'
import { SocialMediaWidget } from '@/components/layout/social-media-widget'
import { CartProvider } from '@/context/cart-context'
import { UserProvider } from '@/context/user-context'
import { WishlistProvider } from '@/context/wishlist-context'
import { CurrencyProvider } from '@/context/currency-context'
import { CookieBanner } from '@/components/layout/cookie-banner'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CurrencyProvider>
      <UserProvider>
        <WishlistProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <NewHeader />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <MiniCart />
            <SocialMediaWidget />
            <CookieBanner />
          </CartProvider>
        </WishlistProvider>
      </UserProvider>
    </CurrencyProvider>
  )
}