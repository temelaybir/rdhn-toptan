import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@catkapinda/bizimhesap-integration', '@catkapinda/trendyol-integration'],
  eslint: {
    // Warning: Build sırasında ESLint hatalarını yoksay
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: Build sırasında TypeScript hatalarını yoksay
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Production stability için
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yujuwpbtziekevbcmrts.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lirxozvlvudcylgtpfjr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ardahan.cdn.akinoncdn.com',
      },
      {
        protocol: 'https',
        hostname: 'ardahanticaret.com',
      },
      {
        protocol: 'https',
        hostname: 'ardahanticaret.com',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: 'ardahanticaret.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'ardahanticaret.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'ardahanticaret.com',
      },
      {
        protocol: 'http',
        hostname: 'ardahanticaret.com',
        pathname: '/image/**',
      },
      // Yeni plante.biz domain'i
      {
        protocol: 'https',
        hostname: 'plante.biz',
      },
      {
        protocol: 'https',
        hostname: 'plante.biz',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: 'plante.biz',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'plante.biz',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'plante.biz',
      },
      {
        protocol: 'http',
        hostname: 'plante.biz',
        pathname: '/image/**',
      },
      // Wikipedia media
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
      // Brand logos and assets
      {
        protocol: 'https',
        hostname: 'logoeps.com',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
      {
        protocol: 'https',
        hostname: 'seeklogo.com',
      },
      {
        protocol: 'https',
        hostname: 'www.seeklogo.com',
      },
      {
        protocol: 'https',
        hostname: 'brandslogos.com',
      },
      {
        protocol: 'https',
        hostname: 'logosvg.com',
      },
      // Professional stock image sources
      {
        protocol: 'https',
        hostname: 'cdn.dummyjson.com',
      },
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
      },
      // E-commerce specific image CDNs
      {
        protocol: 'https',
        hostname: 'store.storeimages.cdn-apple.com',
      },
      {
        protocol: 'https',
        hostname: 'www.apple.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      // Tech product images
      {
        protocol: 'https',
        hostname: 'assets.logitech.com',
      },
      {
        protocol: 'https',
        hostname: 'www.lg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.samsung.com',
      },
      // Fashion & lifestyle
      {
        protocol: 'https',
        hostname: 'static.zara.net',
      },
      {
        protocol: 'https',
        hostname: 'lp2.hm.com',
      },
      // Generic product image services
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'dummyimage.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'ardahanticaret.com',
        'www.ardahanticaret.com',
        'api.iyzipay.com',
        'sandbox-api.iyzipay.com'
      ],
    },
  },
  // Image error logging'i tamamen sustur
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Error handling susturma
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default nextConfig
