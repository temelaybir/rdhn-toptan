import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types/admin/product'

export interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  button_text: string
  badge_text: string | null
  order_position: number
  is_raw_image: boolean
}

export interface CampaignBanner {
  id: number
  title: string
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string
  color_theme: string | null
  size: 'small' | 'medium' | 'large'
  order_position: number
  is_raw_image: boolean
}

export interface FeaturedBrand {
  id: number
  name: string
  logo_url: string
  link_url: string
  campaign_text: string | null
  order_position: number
}

export interface ProductCollection {
  id: number
  title: string
  subtitle: string | null
  collection_type: 'super_deals' | 'best_sellers' | 'new_arrivals' | 'featured' | 'custom'
  view_all_link: string | null
  show_timer: boolean
  timer_end_date: string | null
  order_position: number
  products?: Product[] // Product data with proper typing
}

// Hero slides'ları veritabanından çek
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('order_position')

    if (error) {
      console.error('Hero slides getirilemedi:', error)
      // Fallback için boş array döndür
      return []
    }

    return data || []
  } catch (error) {
    console.error('Hero slides servis hatası:', error)
    return []
  }
}

// Mock data for campaign banners
const mockCampaignBanners: CampaignBanner[] = [
  {
    id: 1,
    title: 'Yılbaşı Alışverişi',
    subtitle: 'Hediyeler %60\'a varan indirimlerle',
    image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
    link_url: '/kampanyalar/yilbasi',
    color_theme: 'from-red-600 to-red-800',
    size: 'large',
    order_position: 1,
    is_raw_image: false
  },
  {
    id: 2,
    title: 'Teknoloji Haftası',
    subtitle: 'Laptop ve telefonda süper fiyatlar',
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    link_url: '/kampanyalar/teknoloji',
    color_theme: 'from-blue-600 to-blue-800',
    size: 'medium',
    order_position: 2,
    is_raw_image: false
  },
  {
    id: 3,
    title: 'Moda Festivali',
    subtitle: '3 Al 2 Öde',
    image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
    mobile_image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop',
    link_url: '/kampanyalar/moda',
    color_theme: 'from-purple-600 to-purple-800',
    size: 'medium',
    order_position: 3,
    is_raw_image: false
  }
]

export async function getCampaignBanners() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('campaign_banners')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true })

    if (error) {
      console.error('Error fetching campaign banners:', error)
      return mockCampaignBanners
    }

    return data && data.length > 0 ? data as CampaignBanner[] : mockCampaignBanners
  } catch (error) {
    console.error('Database connection error, using mock data:', error)
    return mockCampaignBanners
  }
}

// Mock data for featured brands
const mockFeaturedBrands: FeaturedBrand[] = [
  {
    id: 1,
    name: 'Nike',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',
    link_url: '/markalar/nike',
    campaign_text: '%30 İndirim',
    order_position: 1
  },
  {
    id: 2,
    name: 'Adidas',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png',
    link_url: '/markalar/adidas',
    campaign_text: null,
    order_position: 2
  },
  {
    id: 3,
    name: 'Apple',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png',
    link_url: '/markalar/apple',
    campaign_text: 'Ücretsiz Kargo',
    order_position: 3
  },
  {
    id: 4,
    name: 'Samsung',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png',
    link_url: '/markalar/samsung',
    campaign_text: null,
    order_position: 4
  },
  {
    id: 5,
    name: 'Sony',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png',
    link_url: '/markalar/sony',
    campaign_text: '2 Al 1 Öde',
    order_position: 5
  },
  {
    id: 6,
    name: 'LG',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/LG_symbol.svg/200px-LG_symbol.svg.png',
    link_url: '/markalar/lg',
    campaign_text: null,
    order_position: 6
  }
]

export async function getFeaturedBrands() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('featured_brands')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true })

    if (error) {
      console.error('Error fetching featured brands:', error)
      return mockFeaturedBrands
    }

    return data && data.length > 0 ? data as FeaturedBrand[] : mockFeaturedBrands
  } catch (error) {
    console.error('Database connection error, using mock data:', error)
    return mockFeaturedBrands
  }
}

export async function getProductCollections() {
  const supabase = await createClient()
  
  // Get collections
  const { data: collections, error: collectionsError } = await supabase
    .from('product_collections')
    .select('*')
    .eq('is_active', true)
    .order('order_position', { ascending: true })

  if (collectionsError) {
    console.error('Error fetching product collections:', collectionsError)
    return []
  }

  // Get products for each collection
  const collectionsWithProducts = await Promise.all(
    (collections || []).map(async (collection) => {
      const { data: items, error: itemsError } = await supabase
        .from('product_collection_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('collection_id', collection.id)
        .order('order_position', { ascending: true })

      if (itemsError) {
        console.error(`Error fetching items for collection ${collection.id}:`, itemsError)
        return { ...collection, products: [] }
      }

      const products = (items || []).map(item => ({
        ...(item as unknown as { product: unknown }).product,
        badge: (item as unknown as { badge_text: string }).badge_text
      }))

      return { ...collection, products }
    })
  )

  return collectionsWithProducts as ProductCollection[]
}

// Helper function to get products by collection type
export async function getProductsByCollectionType(type: string) {
  const supabase = await createClient()
  
  let query = supabase.from('products').select('*')
  
  switch (type) {
    case 'super_deals':
      // Products with significant discounts
      query = query.not('original_price', 'is', null)
        .filter('original_price', 'gt', 'price')
        .order('created_at', { ascending: false })
        .limit(20)
      break
      
    case 'best_sellers':
      // Most sold products (you might want to add a sales_count column)
      query = query.eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(20)
      break
      
    case 'new_arrivals':
      // Recently added products
      query = query.order('created_at', { ascending: false })
        .limit(20)
      break
      
    case 'featured':
      // Featured products
      query = query.eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(20)
      break
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching products by collection type:', error)
    return []
  }

  return data || []
}

// Seçili ürünler için rastgele ürün seçimi
export async function getFeaturedProducts() {
  const supabase = await createClient()
  
  try {
    // Önce öne çıkan ürünleri çekmeyi dene
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        compare_price,
        stock_quantity,
        is_active,
        is_featured,
        tags,
        images,
        category:categories(name, slug)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(12)

    if (featuredError) {
      console.error('⚠️ Featured products error:', featuredError)
    }

    // Öne çıkan ürünleri al (varsa)
    let allProducts = featuredProducts || []
    
    // Eğer yeterli öne çıkan ürün yoksa, rastgele ürünlerle tamamla
    if (allProducts.length < 12) {
      // Mevcut ürünlerin ID'lerini al
      const existingIds = allProducts.map(p => p.id)
      
      // Rastgele ürün seçimi için toplam aktif ürün sayısını öğren
      const { count: totalProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        
      if (totalProducts && totalProducts > 0) {
        // Rastgele offset hesapla
        const maxOffset = Math.max(0, totalProducts - 20) // Son 20 ürünü dahil etmek için
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1))
        
        const { data: randomProducts } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            price,
            compare_price,
            stock_quantity,
            is_active,
            is_featured,
            tags,
            images,
            category:categories(name, slug)
          `)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .not('id', 'in', `(${existingIds.map(id => `"${id}"`).join(',')})`)
          .range(randomOffset, randomOffset + (12 - allProducts.length) - 1)

        if (randomProducts && randomProducts.length > 0) {
          allProducts = [...allProducts, ...randomProducts]
        }
      }
      
      // Hala yeterli ürün yoksa, en son eklenenlerle tamamla
      if (allProducts.length < 12) {
        const { data: recentProducts } = await supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            price,
            compare_price,
            stock_quantity,
            is_active,
            is_featured,
            tags,
            images,
            category:categories(name, slug)
          `)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .not('id', 'in', `(${allProducts.map(p => p.id).map(id => `"${id}"`).join(',')})`)
          .order('created_at', { ascending: false })
          .limit(12 - allProducts.length)

        if (recentProducts) {
          allProducts = [...allProducts, ...recentProducts]
        }
      }
    }

    // Shuffle the products for more randomness
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5)
    
    console.log(`🎯 Featured Products: ${shuffledProducts.length} ürün bulundu`)
    return transformProducts(shuffledProducts.slice(0, 12))
  } catch (error) {
    console.error('💥 getFeaturedProducts error:', error)
    return []
  }
}

// Süper fırsatlar - Compare price'ı olan indirimli ürünler
export async function getSuperDeals() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        compare_price,
        stock_quantity,
        is_active,
        tags,
        images,
        category:categories(name, slug)
      `)
      .eq('is_active', true)
      .not('compare_price', 'is', null)
      .gt('compare_price', 0)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      console.error('⚠️ Super deals error:', error)
      return []
    }

    return transformProducts(data || [])
  } catch (error) {
    console.error('💥 getSuperDeals error:', error)
    return []
  }
}

// Çok satanlar - is_featured olan ürünler
export async function getBestSellers() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        compare_price,
        stock_quantity,
        is_active,
        is_featured,
        tags,
        images,
        category:categories(name, slug)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      console.error('⚠️ Best sellers error:', error)
      return []
    }

    return transformProducts(data || [])
  } catch (error) {
    console.error('💥 getBestSellers error:', error)
    return []
  }
}

// Yeni ürünler - Son eklenenler
export async function getNewProducts() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        price,
        compare_price,
        stock_quantity,
        is_active,
        tags,
        images,
        category:categories(name, slug)
      `)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(12)

    if (error) {
      console.error('⚠️ New products error:', error)
      return []
    }

    console.log(`✨ New Products: ${data?.length || 0} ürün bulundu`)
    return transformProducts(data || [])
  } catch (error) {
    console.error('💥 getNewProducts error:', error)
    return []
  }
}

// Ürün transform helper fonksiyonu
function transformProducts(products: any[]) {
  console.log('🔄 transformProducts called with:', products.length, 'products')
  
  return products.map((product, index) => {
    console.log(`📦 Processing product ${index + 1}:`, {
      id: product.id,
      name: product.name,
      rawImages: product.images,
      imageType: typeof product.images,
      isArray: Array.isArray(product.images)
    })
    
    // images alanını güvenli bir şekilde kontrol et
    // Database'de TEXT[] olarak saklanıyor
    let images = [];
    
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log(`🖼️ Product ${product.name} has images:`, product.images)
      
      // Her bir URL'yi image object'e çevir
      images = product.images
        .filter((url: string) => {
          const isValid = url && url.trim() !== ''
          if (!isValid) {
            console.log('❌ Filtered out invalid URL:', url)
          }
          return isValid
        })
        .map((url: string, index: number) => {
          const imageObj = {
            url: url || '/placeholder-product.svg',
            alt: product.name || 'Ürün',
            is_main: index === 0
          }
          console.log(`✅ Created image object ${index}:`, imageObj)
          return imageObj
        });
    } else {
      console.log(`⚠️ Product ${product.name} has no valid images:`, {
        hasImages: !!product.images,
        isArray: Array.isArray(product.images),
        length: product.images?.length
      })
    }
    
    // Eğer hiç geçerli image yoksa placeholder kullan
    if (images.length === 0) {
      console.log(`🔄 Using placeholder for product: ${product.name}`)
      images = [{
        url: '/placeholder-product.svg',
        alt: product.name || 'Ürün',
        is_main: true
      }];
    }
    
    const transformedProduct = {
      ...product,
      tags: product.tags || [],
      images: images,
      // İndirim yüzdesini hesapla
      discountPercentage: product.compare_price && product.compare_price > product.price 
        ? Math.round((1 - (product.price / product.compare_price)) * 100)
        : 0
    };
    
    console.log(`✨ Final transformed product:`, {
      id: transformedProduct.id,
      name: transformedProduct.name,
      finalImages: transformedProduct.images,
      imageCount: transformedProduct.images.length
    })
    
    return transformedProduct;
  });
}