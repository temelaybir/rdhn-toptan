'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/products/product-card'
import { useThemeConfig } from '@/context/theme-context'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number
  images?: Array<{url: string, alt: string, is_main: boolean}>
  category?: {name: string, slug: string}
  discountPercentage?: number
  stock_quantity?: number
  tags?: string[]
}

interface ProductCarouselProps {
  title: string
  subtitle?: string
  products: Product[]
  viewAllLink?: string
  showTimer?: boolean
  timerEndDate?: Date
}

export function ProductCarousel({ 
  title, 
  subtitle, 
  products, 
  viewAllLink,
  showTimer,
  timerEndDate
}: ProductCarouselProps) {
  const { isLoading } = useThemeConfig()
  
  // Debug log'ları
  console.log(`🎠 ProductCarousel "${title}" render:`, { 
    productsCount: products?.length || 0, 
    isLoading,
    firstProduct: products?.[0]?.name 
  })
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)

  // Timer effect
  useEffect(() => {
    if (!showTimer || !timerEndDate) return

    const calculateTimeLeft = () => {
      const difference = +timerEndDate - +new Date()
      
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        }
      }
      
      return null
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [showTimer, timerEndDate])

  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll, products])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    
    const scrollAmount = 340 // Width of one card plus gap
    const currentScroll = scrollContainerRef.current.scrollLeft
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount
    
    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }

  // Ürün yoksa hiçbir şey render etme
  if (!products || products.length === 0) {
    console.log(`❌ ProductCarousel "${title}": No products found`)
    return null
  }

  console.log(`✅ ProductCarousel "${title}": Rendering ${products.length} products`)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
            {timeLeft && (
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                <Clock className="w-4 h-4" />
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-10 w-10 rounded-full border-gray-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-10 w-10 rounded-full border-gray-200"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          
          {viewAllLink && (
            <Button variant="ghost" asChild className="ml-2 text-blue-600 hover:text-blue-800">
              <Link href={viewAllLink}>
                Tümünü Gör
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Products */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="flex-none w-[320px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}