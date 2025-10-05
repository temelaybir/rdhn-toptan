'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SafeImage } from '@/components/ui/safe-image'

import { HeroSlide } from '@/services/homepage'

interface HeroCarouselProps {
  slides: HeroSlide[]
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Mount kontrolü - hydration sorunlarını önler
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Mobile detection
  useEffect(() => {
    if (!isMounted) return
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [isMounted])

  // Auto-play functionality
  useEffect(() => {
    if (!isMounted || !isAutoPlaying || slides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length, isMounted])

  // Keyboard navigation
  useEffect(() => {
    if (!isMounted) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setTimeout(() => setIsTransitioning(false), 300)
  }, [slides.length, isTransitioning])

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setTimeout(() => setIsTransitioning(false), 300)
  }, [slides.length, isTransitioning])

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return
    setIsTransitioning(true)
    setCurrentSlide(index)
    setTimeout(() => setIsTransitioning(false), 300)
  }, [currentSlide, isTransitioning])

  // Pause auto-play on hover
  const handleMouseEnter = useCallback(() => {
    if (isMounted) setIsAutoPlaying(false)
  }, [isMounted])
  
  const handleMouseLeave = useCallback(() => {
    if (isMounted) setIsAutoPlaying(true)
  }, [isMounted])

  // Eğer henüz mount olmadıysa veya slide yoksa loading state göster
  if (!isMounted || !slides || slides.length === 0) {
    return (
      <div className="relative w-full h-[300px] md:h-[500px] lg:h-[600px] bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl overflow-hidden animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-lg">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div 
      className="relative w-full h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px] xl:h-[480px] 2xl:h-[520px] overflow-hidden rounded-xl group shadow-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <SafeImage
          src={currentSlideData.mobile_image_url && isMobile 
            ? currentSlideData.mobile_image_url 
            : currentSlideData.image_url
          }
          alt={currentSlideData.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
          quality={95}
          sizes="100vw"
        />
        {/* Gradient Overlay - Ham görsel modunda overlay yok */}
        {!currentSlideData.is_raw_image && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        )}
      </div>

      {/* Content - Ham görsel modunda content gösterilmiyor */}
      {!currentSlideData.is_raw_image && (
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl">
              {/* Badge */}
              {currentSlideData.badge_text && (
                <Badge 
                  variant="secondary" 
                  className="mb-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {currentSlideData.badge_text}
                </Badge>
              )}
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
                {currentSlideData.title}
              </h1>
              
              {/* Subtitle */}
              {currentSlideData.subtitle && (
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed max-w-xl">
                  {currentSlideData.subtitle}
                </p>
              )}
              
              {/* CTA Button */}
              {currentSlideData.button_text && currentSlideData.link_url && (
                <Link href={currentSlideData.link_url}>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {currentSlideData.button_text}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            onClick={goToPrevious}
            disabled={isTransitioning}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            onClick={goToNext}
            disabled={isTransitioning}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? "bg-white scale-110" 
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}