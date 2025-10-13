export default function imageLoader({ src, width, quality }: { 
  src: string; 
  width?: number; 
  quality?: number 
}) {
  // 🚨 PRODUCTION DEBUG - HOT FIX
  console.log('🖼️ Image Loader Called:', { 
    src, 
    width, 
    quality,
    timestamp: new Date().toISOString()
  })
  
  // Boş veya geçersiz src kontrol
  if (!src || typeof src !== 'string') {
    console.log('❌ Invalid src, using placeholder:', src)
    return '/placeholder-product.svg'
  }
  
  // Local path - doğrudan döndür
  if (src.startsWith('/')) {
    console.log('📁 Local path detected:', src)
    return src
  }
  
  // Data URL - doğrudan döndür
  if (src.startsWith('data:')) {
    console.log('📊 Data URL detected')
    return src
  }
  
  // Production-safe domain kontrolü
  const safeHosts = [
    'ardahan.cdn.akinoncdn.com',
    'ardahanticaret.com', 
    'plante.biz',
    'supabase.co',
    'amazonaws.com'
  ]
  
  const isHostSafe = safeHosts.some(host => src.includes(host))
  console.log('🔒 Host safety check:', { src, isHostSafe, safeHosts })
  
  if (!isHostSafe) {
    console.warn(`🚫 Unsafe image URL blocked in production: ${src}`)
    return '/placeholder-product.svg'
  }
  
  // URL temizleme
  let cleanSrc = src
    .replace(/550x550h\./g, '550x550.') // h suffix düzelt
    .replace(/([^:]\/)\/+/g, '$1') // double slash düzelt
    .replace(/\.(JPG|JPEG|PNG|GIF)/gi, (match) => match.toLowerCase()) // extensions küçük harf
  
  // Cache buster ekle (production debug için)
  const cacheBuster = Date.now()
  if (process.env.NODE_ENV === 'production') {
    cleanSrc = cleanSrc.includes('?') 
      ? `${cleanSrc}&t=${cacheBuster}`
      : `${cleanSrc}?t=${cacheBuster}`
  }
  
  console.log('✅ Final image URL:', cleanSrc)
  return cleanSrc
} 