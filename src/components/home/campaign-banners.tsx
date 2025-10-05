'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import imageLoader from '@/lib/image-loader'

import { CampaignBanner } from '@/services/homepage'

interface CampaignBannersProps {
  banners: CampaignBanner[]
}

export function CampaignBanners({ banners }: CampaignBannersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.link_url}
          className={cn(
            "relative group overflow-hidden rounded-lg",
            banner.size === 'large' ? 'lg:col-span-2 lg:row-span-2 h-[300px] md:h-[400px]' : 'h-[200px]'
          )}
        >
          {/* Background Image with Mobile/Desktop Support */}
          <picture>
            {/* Mobil görsel varsa mobilde kullan */}
            {banner.mobile_image_url && (
              <source 
                media="(max-width: 768px)" 
                srcSet={banner.mobile_image_url}
              />
            )}
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              loader={imageLoader}
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes={
                banner.size === 'large' 
                  ? "(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw"
                  : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              }
              quality={90}
              priority={banner.size === 'large'}
            />
          </picture>
          
          {/* Gradient Overlay - Ham görsel modunda overlay yok */}
          {!banner.is_raw_image && (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-90 transition-opacity",
              banner.color_theme || "from-gray-900 to-gray-700"
            )} />
          )}
          
          {/* Content - Ham görsel modunda content gösterilmiyor */}
          {!banner.is_raw_image && (
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className={cn(
                "font-bold text-white mb-2",
                banner.size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl'
              )}>
                {banner.title}
              </h3>
              <p className={cn(
                "text-white/90 mb-4",
                banner.size === 'large' ? 'text-base md:text-lg' : 'text-sm'
              )}>
                {banner.subtitle}
              </p>
              <div className="flex items-center text-white group-hover:translate-x-2 transition-transform">
                <span className="text-sm font-medium">Keşfet</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}