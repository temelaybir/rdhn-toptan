'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  // Scroll pozisyonunu takip et
  useEffect(() => {
    const toggleVisibility = () => {
      // 300px'den fazla scroll yapıldığında butonu göster
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  // Sayfanın başına scroll yap
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed z-40 flex items-center justify-center',
        'w-12 h-12 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 active:scale-95',
        'cursor-pointer',
        // Pozisyon - sosyal medya widget'larının altında (bottom-right konumunda)
        // WhatsApp ve Instagram butonlarının (2 buton x ~56px = ~112px) altında
        'bottom-[168px] right-6',
        // Mobilde de aynı pozisyon
        'md:bottom-[168px]',
        // Görünürlük kontrolü
        isVisible 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-10 pointer-events-none'
      )}
      aria-label="Yukarı çık"
      title="Yukarı çık"
    >
      <ArrowUp className="w-6 h-6" />
    </button>
  )
}
