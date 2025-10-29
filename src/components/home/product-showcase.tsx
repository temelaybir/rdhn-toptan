'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import { useThemeConfig } from '@/context/theme-context'

// Product type based on the admin product types
interface FeaturedProduct {
  id: number
  name: string
  slug: string
  price: number
  compare_price?: number | null
  images: Array<{ url: string; alt: string | null; is_main: boolean }>
  category?: { name: string; slug: string }
  is_featured: boolean
  stock_quantity: number
  is_active: boolean
  tags: string[] | null
}

interface ProductShowcaseProps {
  products: FeaturedProduct[]
}

export function ProductShowcase({ products }: ProductShowcaseProps) {
  const { isLoading } = useThemeConfig()
  
  // Split products into two rows
  const firstRow = products.slice(0, 4)
  const secondRow = products.slice(4, 8)

  // Ürün yoksa component'i render etme
  if (!products || products.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Seçili Ürünler</h2>
          <Link 
            href="/urunler" 
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Tüm Ürünler
          </Link>
        </div>
        
        {/* Empty state - 2 rows of 4 placeholder cards */}
        <div className="space-y-6">
          {/* First row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div key={`empty-1-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[460px] flex flex-col items-center justify-center text-center">
                <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-3 w-full">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto"></div>
                  <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Second row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div key={`empty-2-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[460px] flex flex-col items-center justify-center text-center">
                <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-3 w-full">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto"></div>
                  <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Seçili Ürünler</h2>
        <Link 
          href="/urunler" 
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Tüm Ürünler
        </Link>
      </div>

      <div className="space-y-6">
        {/* First Row - 4 products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {firstRow.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {/* Fill empty slots in first row with placeholders if needed */}
          {firstRow.length < 4 && Array.from({ length: 4 - firstRow.length }).map((_, index) => (
            <div key={`placeholder-1-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[460px] flex flex-col items-center justify-center text-center">
              <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-3 w-full">
                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto"></div>
                <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Second Row - 4 products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondRow.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {/* Fill empty slots in second row with placeholders if needed */}
          {secondRow.length < 4 && Array.from({ length: 4 - secondRow.length }).map((_, index) => (
            <div key={`placeholder-2-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[460px] flex flex-col items-center justify-center text-center">
              <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-3 w-full">
                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto"></div>
                <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}