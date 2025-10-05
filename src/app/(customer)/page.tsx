import { HeroCarousel } from '@/components/home/hero-carousel'
import { ProductCarousel } from '@/components/home/product-carousel'
import { CampaignBanners } from '@/components/home/campaign-banners'
import { CategoryShowcase } from '@/components/home/category-showcase'
import { ProductShowcase } from '@/components/home/product-showcase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Truck, Shield, Headphones, CreditCard } from 'lucide-react'

// Homepage service'lerini import edelim
import { 
  getHeroSlides, 
  getCampaignBanners, 
  getFeaturedBrands, 
  getFeaturedProducts,
  getSuperDeals,
  getBestSellers,
  getNewProducts
} from '@/services/homepage'

export const dynamic = 'force-dynamic'

const features = [
  {
    icon: Truck,
    title: 'Hızlı & Ücretsiz Kargo',
    description: '150 TL üzeri alışverişlerde'
  },
  {
    icon: Shield,
    title: 'Güvenli Alışveriş',
    description: '256-bit SSL güvenlik sertifikası'
  },
  {
    icon: CreditCard,
    title: 'Güvenli Ödeme',
    description: 'Tüm kartlara 12 taksit imkanı'
  },
  {
    icon: Headphones,
    title: '7/24 Müşteri Desteği',
    description: 'Size yardımcı olmak için buradayız'
  }
]

export default async function HomePage() {
  // Homepage service'lerinden verileri çek
  const [
    heroSlides, 
    campaignBanners, 
    featuredBrands, 
    featuredProducts,
    superDeals,
    bestSellers,
    newProducts
  ] = await Promise.all([
    getHeroSlides(),
    getCampaignBanners(), 
    getFeaturedBrands(),
    getFeaturedProducts(),
    getSuperDeals(),
    getBestSellers(),
    getNewProducts()
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="mb-6 md:mb-8 lg:mb-12 mt-4 md:mt-6">
        <div className="container mx-auto px-4 md:px-6">
          <HeroCarousel slides={heroSlides} />
        </div>
      </section>

      {/* Campaign Banners */}
      {campaignBanners.length > 0 && (
        <section className="mb-6 md:mb-8 lg:mb-12">
          <div className="container mx-auto px-4 md:px-6">
            <CampaignBanners banners={campaignBanners} />
          </div>
        </section>
      )}

      {/* Category Showcase */}
      <section className="mb-8 md:mb-10 lg:mb-12">
        <div className="container mx-auto px-4 md:px-6">
          <CategoryShowcase />
        </div>
      </section>

      {/* Featured Products Showcase */}
      {featuredProducts.length > 0 && (
        <section className="mb-8 md:mb-10 lg:mb-12">
          <div className="container mx-auto px-4 md:px-6">
            <ProductShowcase products={featuredProducts} />
          </div>
        </section>
      )}

      {/* Super Deals Section */}
      {superDeals.length > 0 && (
        <section className="mb-8 md:mb-10 lg:mb-12">
          <div className="container mx-auto px-4 md:px-6">
            <ProductCarousel
              title="⚡ Süper Fırsatlar" 
              subtitle="Sınırlı süre için özel indirimler"
              products={superDeals}
              viewAllLink="/urunler?filter=deals"
              showTimer={true}
              timerEndDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // 24 saat
            />
          </div>
        </section>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="mb-8 md:mb-10 lg:mb-12">
          <div className="container mx-auto px-4 md:px-6">
            <ProductCarousel
              title="🔥 Çok Satanlar" 
              subtitle="En popüler ürünler"
              products={bestSellers}
              viewAllLink="/urunler?filter=bestsellers"
            />
          </div>
        </section>
      )}

      {/* New Products Section */}
      {newProducts.length > 0 && (
        <section className="mb-8 md:mb-10 lg:mb-12">
          <div className="container mx-auto px-4 md:px-6">
            <ProductCarousel
              title="✨ Yeni Gelenler" 
              subtitle="En yeni ürünler ve trendler"
              products={newProducts}
              viewAllLink="/urunler?filter=new"
            />
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-muted/30 py-8 md:py-12 mt-8 md:mt-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 md:gap-4 p-4 md:p-6 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Fırsatları Kaçırmayın!</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Özel kampanyalar, yeni ürünler ve size özel fırsatlardan ilk siz haberdar olun.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="E-posta adresiniz"
                className="flex-1"
                required
              />
              <Button type="submit" size="lg" className="px-6 md:px-8">
                Abone Ol
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Abone olarak gizlilik politikamızı kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}