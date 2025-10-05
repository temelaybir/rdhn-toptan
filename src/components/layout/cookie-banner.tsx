'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

const COOKIE_CONSENT_KEY = 'rdhn-commerce-cookie-consent'

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Sadece client-side'da çalışır
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (consent !== 'true') {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-t">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Sitemizde daha iyi bir alışveriş deneyimi sunmak için çerezleri kullanıyoruz.
              Detaylı bilgi için{' '}
              <Link href="/gizlilik-politikasi" className="underline hover:text-primary">
                Gizlilik Politikamızı
              </Link>{' '}
              inceleyebilirsiniz.
            </p>
          </div>
          <Button onClick={handleAccept} size="sm" className="flex-shrink-0">
            Anladım ve Kabul Ediyorum
          </Button>
        </div>
      </div>
    </div>
  )
}
