'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Instagram, Facebook, Youtube, Linkedin, Twitter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialSettings {
  whatsapp_number: string | null
  whatsapp_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  youtube_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  show_social_widget: boolean
  social_widget_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  social_widget_style: 'floating' | 'minimal' | 'compact'
}

interface SocialMediaWidgetProps {
  className?: string
}

export function SocialMediaWidget({ className }: SocialMediaWidgetProps) {
  const [settings, setSettings] = useState<SocialSettings | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result = await response.json()
        
        if (result.success && result.data) {
          setSettings(result.data)
        } else {
          console.log('❌ API hatası, test verisi kullanılıyor')
          // Test verisi - gerçek veri gelmezse
          setSettings({
            whatsapp_number: '+905551234567',
            whatsapp_url: null,
            instagram_url: 'https://instagram.com/test',
            facebook_url: null,
            youtube_url: null,
            linkedin_url: null,
            twitter_url: null,
            show_social_widget: true,
            social_widget_position: 'bottom-right',
            social_widget_style: 'floating'
          })
        }
      } catch (error) {
        console.error('❌ Site ayarları yüklenemedi:', error)
        // API fail olursa test verisi kullan
        setSettings({
          whatsapp_number: '+905551234567',
          whatsapp_url: null,
          instagram_url: 'https://instagram.com/test',
          facebook_url: null,
          youtube_url: null,
          linkedin_url: null,
          twitter_url: null,
          show_social_widget: true,
          social_widget_position: 'bottom-right',
          social_widget_style: 'floating'
        })
      }
    }

    loadSettings()
  }, [])

  if (!settings || !settings.show_social_widget) {
    return null
  }

  // WhatsApp URL'sini hesapla
  const whatsappUrl = settings.whatsapp_url || 
                     (settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}` : null)

  // Aktif sosyal medya hesaplarını topla
  const socialLinks = [
    {
      name: 'WhatsApp',
      url: whatsappUrl,
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      primary: true
    },
    {
      name: 'Instagram',
      url: settings.instagram_url,
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      primary: true
    },
    {
      name: 'Facebook',
      url: settings.facebook_url,
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      primary: false
    },
    {
      name: 'YouTube',
      url: settings.youtube_url,
      icon: Youtube,
      color: 'bg-red-600 hover:bg-red-700',
      primary: false
    },
    {
      name: 'LinkedIn',
      url: settings.linkedin_url,
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      primary: false
    },
    {
      name: 'Twitter',
      url: settings.twitter_url,
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      primary: false
    }
  ].filter(link => link.url) // Sadece URL'si olan linkleri göster

  if (socialLinks.length === 0) return null

  // Primary linkler (WhatsApp ve Instagram) her zaman görünür
  const primaryLinks = socialLinks.filter(link => link.primary)
  const secondaryLinks = socialLinks.filter(link => !link.primary)

  // Pozisyon sınıflarını belirle
  const getPositionClasses = () => {
    switch (settings.social_widget_position) {
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'top-right':
        return 'top-6 right-6'
      case 'top-left':
        return 'top-6 left-6'
      default:
        return 'bottom-6 right-6'
    }
  }

  // Stil sınıflarını belirle
  const getStyleClasses = () => {
    switch (settings.social_widget_style) {
      case 'minimal':
        return {
          primary: 'w-10 h-10',
          secondary: 'w-8 h-8',
          expand: 'w-8 h-8',
          primaryIcon: 'w-5 h-5',
          secondaryIcon: 'w-4 h-4',
          shadow: 'shadow-md'
        }
      case 'compact':
        return {
          primary: 'w-12 h-12',
          secondary: 'w-10 h-10',
          expand: 'w-10 h-10',
          primaryIcon: 'w-6 h-6',
          secondaryIcon: 'w-5 h-5',
          shadow: 'shadow-lg'
        }
      default: // floating
        return {
          primary: 'w-14 h-14',
          secondary: 'w-12 h-12',
          expand: 'w-12 h-12',
          primaryIcon: 'w-7 h-7',
          secondaryIcon: 'w-6 h-6',
          shadow: 'shadow-lg'
        }
    }
  }

  const styleClasses = getStyleClasses()

  return (
    <div className={cn(
      "fixed z-50 flex flex-col items-end gap-3",
      getPositionClasses(),
      className
    )}>
      {/* Secondary links - accordion tarzı */}
      {secondaryLinks.length > 0 && (
        <div className={cn(
          "flex flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          {secondaryLinks.map((link) => {
            const IconComponent = link.icon
            return (
              <a
                key={link.name}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-center text-white rounded-full transition-all duration-200 transform hover:scale-110",
                  styleClasses.secondary,
                  styleClasses.shadow,
                  link.color
                )}
                title={link.name}
              >
                <IconComponent className={styleClasses.secondaryIcon} />
              </a>
            )
          })}
        </div>
      )}

      {/* Primary links - her zaman görünür */}
      <div className="flex flex-col gap-3">
        {primaryLinks.map((link) => {
          const IconComponent = link.icon
          return (
            <a
              key={link.name}
              href={link.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-center text-white rounded-full transition-all duration-200 transform hover:scale-110",
                styleClasses.primary,
                styleClasses.shadow,
                link.color
              )}
              title={link.name}
            >
              <IconComponent className={styleClasses.primaryIcon} />
            </a>
          )
        })}
        
        {/* Expand/Collapse button - sadece secondary linkler varsa göster */}
        {secondaryLinks.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-all duration-200 transform hover:scale-110",
              styleClasses.expand,
              styleClasses.shadow
            )}
            title={isOpen ? "Diğer sosyal medyaları gizle" : "Diğer sosyal medyaları göster"}
          >
            <div className={cn(
              "transition-transform duration-200",
              isOpen ? "rotate-45" : "rotate-0"
            )}>
              {isOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  )
} 