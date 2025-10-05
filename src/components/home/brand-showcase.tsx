'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { SafeImage } from '@/components/ui/safe-image'

import { FeaturedBrand } from '@/services/homepage'

interface BrandShowcaseProps {
  brands: FeaturedBrand[]
}

export function BrandShowcase({ brands }: BrandShowcaseProps) {
  // Brands yoksa component'i render etme
  if (!brands || brands.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Öne Çıkan Markalar</h2>
        <Link 
          href="/urunler" 
          className="text-sm font-medium text-primary hover:underline"
        >
          Tüm Ürünler
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {brands.map((brand, index) => (
          <Link
            key={brand.id}
            href={brand.link_url}
            className="group relative block"
          >
            <div className="products-card relative p-6 h-[140px] flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              {brand.campaign_text && (
                <Badge 
                  className="trendyol-discount absolute -top-2 -right-2 z-10" 
                >
                  {brand.campaign_text}
                </Badge>
              )}
              <div className="relative w-full h-full flex items-center justify-center">
                <SafeImage
                  src={brand.logo_url}
                  alt={brand.name}
                  width={90}
                  height={90}
                  className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110 max-w-full max-h-full"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}