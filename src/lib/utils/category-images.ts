// Category-based stock images mapping
export const categoryImages = {
  // Elektronik
  'elektronik': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=400&fit=crop',
  'telefon-aksesuar': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
  'bilgisayar': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
  'tv-ses-sistemi': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
  
  // Giyim
  'giyim': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
  'kadin-giyim': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop',
  'erkek-giyim': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop',
  'ayakkabi': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
  
  // Ev & Yaşam
  'ev-yasam': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
  'mobilya': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
  'ev-aletleri': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
  'dekorasyon': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=400&fit=crop',
  
  // Diğer Kategoriler
  'kozmetik': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
  'aksesuar': 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop',
  'kitap': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  'spor': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
  'fitness': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=400&fit=crop',
  'outdoor': 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400&h=400&fit=crop',
  'supermarket': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
  'oyuncak': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop',
  
  // Default fallback
  'default': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop'
}

// Product-specific images by category
export const productImagesByCategory = {
  'elektronik': [
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=400&fit=crop', // MacBook
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop', // iPhone
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // Headphones
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', // Watch
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop', // Tech devices
  ],
  'giyim': [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop', // Clothes on rack
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop', // Jacket
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop', // Shirts
    'https://images.unsplash.com/photo-1603344797033-f0f4f587ab60?w=400&h=400&fit=crop', // Dress
  ],
  'ayakkabi': [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', // Nike shoes
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop', // Shoe collection
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop', // Sports shoes
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop', // Boots
  ],
  'ev-yasam': [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop', // Living room
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop', // Sofa
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop', // Kitchen
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', // Bedroom
  ],
  'kozmetik': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop', // Makeup
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', // Skincare
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop', // Perfume
    'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=400&h=400&fit=crop', // Beauty products
  ],
  'default': [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop',
  ]
}

// Helper function to get a random product image for a category
export function getProductImageByCategory(category: string): string {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-')
  const images = productImagesByCategory[normalizedCategory] || productImagesByCategory['default']
  return images[Math.floor(Math.random() * images.length)]
}

// Helper function to get category image
export function getCategoryImage(category: string): string {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-')
  return categoryImages[normalizedCategory] || categoryImages['default']
}

// Search result images
export const searchResultImages = [
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=400&fit=crop', // Laptop
  'https://images.unsplash.com/photo-1600087626120-062700394a01?w=400&h=400&fit=crop', // iPhone 12
  'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&h=400&fit=crop', // Headphones
]

// Fallback images for different contexts
export const fallbackImages = {
  product: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
  category: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
  user: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  order: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop'
}

// Helper function to get fallback image
export function getFallbackImage(type: keyof typeof fallbackImages = 'product'): string {
  return fallbackImages[type] || fallbackImages.product
}

// Helper function to get image with fallback
export function getImageWithFallback(src: string | null | undefined, fallbackType: keyof typeof fallbackImages = 'product'): string {
  return src || getFallbackImage(fallbackType)
}

// Helper function to validate image URL
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

// Helper function to get optimized image URL - OPTİMİZASYON DEVRE DIŞI
export function getOptimizedImageUrl(src: string, width: number = 400, height: number = 400): string {
  if (!isValidImageUrl(src)) {
    return getFallbackImage('product')
  }
  
  // OPTİMİZASYON TAMAMEN KAPALI - SRC'YI OLDUĞU GİBİ DÖNDÜR
  return src
}