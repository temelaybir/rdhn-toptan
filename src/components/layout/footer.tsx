'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface FooterSettings {
  id: string
  company_name: string
  company_description: string
  show_newsletter: boolean
  newsletter_title: string
  newsletter_description: string
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  show_social_media: boolean
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  linkedin_url: string | null
  copyright_text: string
  custom_css: string | null
  is_active: boolean
  google_maps_embed_url: string | null
  show_google_maps: boolean
  google_maps_width: string
  google_maps_height: string
}

interface FooterLinkGroup {
  id: string
  title: string
  order_position: number
  is_active: boolean
}

interface FooterLink {
  id: string
  group_id: string
  title: string
  url: string
  order_position: number
  is_external: boolean
  is_active: boolean
}

// Varsayılan footer linkleri (fallback)
const fallbackFooterLinks = {
  company: [
    { name: 'Hakkımızda', href: '/hakkimizda' },
    { name: 'İletişim', href: '/iletisim' },
    { name: 'Kariyer', href: '/kariyer' },
    { name: 'Basın', href: '/basin' },
  ],
  support: [
    { name: 'Yardım Merkezi', href: '/yardim' },
    { name: 'İade & Değişim', href: '/iade-degisim' },
    { name: 'Kargo Takip', href: '/kargo-takip' },
    { name: 'SSS', href: '/sss' },
  ],
  legal: [
    { name: 'Gizlilik Politikası', href: '/gizlilik' },
    { name: 'Kullanım Şartları', href: '/kullanim-sartlari' },
    { name: 'Çerez Politikası', href: '/cerez-politikasi' },
    { name: 'KVKK', href: '/kvkk' },
  ],
  categories: [
    { name: 'Elektronik', href: '/kategoriler/elektronik' },
    { name: 'Giyim', href: '/kategoriler/giyim' },
    { name: 'Kitap', href: '/kategoriler/kitap' },
    { name: 'Ev & Yaşam', href: '/kategoriler/ev-yasam' },
  ],
}

export function Footer() {
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null)
  const [linkGroups, setLinkGroups] = useState<FooterLinkGroup[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  const [organizedLinks, setOrganizedLinks] = useState(fallbackFooterLinks)
  const [isLoaded, setIsLoaded] = useState(false)

  // Footer verilerini al
  const fetchFooterData = async () => {
    try {
      console.log('Footer verisi yükleniyor...')
      const supabase = createClient()
      
      const [settingsResult, groupsResult, linksResult] = await Promise.all([
        supabase.from('footer_settings').select('*').eq('is_active', true).single(),
        supabase.from('footer_link_groups').select('*').eq('is_active', true).order('order_position'),
        supabase.from('footer_links').select('*').eq('is_active', true).order('order_position')
      ])

      console.log('Footer Settings Result:', settingsResult)
      console.log('Footer Groups Result:', groupsResult)
      console.log('Footer Links Result:', linksResult)

      if (settingsResult.data) {
        console.log('Footer ayarları güncelleniyor:', settingsResult.data)
        setFooterSettings(settingsResult.data)
      }

      if (groupsResult.data) {
        console.log('Footer grupları güncelleniyor:', groupsResult.data)
        setLinkGroups(groupsResult.data)
      }

      if (linksResult.data) {
        setFooterLinks(linksResult.data)
        
        // Linkleri gruplara göre organize et
        const organized: any = {}
        groupsResult.data?.forEach(group => {
          const groupLinks = linksResult.data
            .filter(link => link.group_id === group.id)
            .map(link => ({
              name: link.title,
              href: link.url,
              isExternal: link.is_external
            }))
          
          // Grup adını key olarak kullan (normalize edilmiş)
          const groupKey = group.title.toLowerCase()
            .replace('ş', 's')
            .replace('ı', 'i')
            .replace('ğ', 'g')
            .replace('ü', 'u')
            .replace('ö', 'o')
            .replace('ç', 'c')
            .replace(/\s+/g, '')
          
          organized[groupKey] = groupLinks
        })
        
        console.log('Organize edilmiş linkler:', organized)
        setOrganizedLinks({ ...fallbackFooterLinks, ...organized })
      }
      
      setIsLoaded(true)
      console.log('Footer verisi yükleme tamamlandı')
    } catch (error) {
      console.error('Footer verisi yükleme hatası:', error)
      setIsLoaded(true)
      // Hata durumunda varsayılan değerleri kullan
    }
  }

  useEffect(() => {
    fetchFooterData()
  }, [])

  // Debug için state'leri logla
  useEffect(() => {
    if (isLoaded) {
      console.log('Footer state güncellendi:', {
        footerSettings,
        linkGroups,
        companyName: footerSettings?.company_name,
        showNewsletter: footerSettings?.show_newsletter
      })
    }
  }, [footerSettings, linkGroups, isLoaded])

  // Varsayılan değerler
  const companyName = footerSettings?.company_name || 'RDHN Commerce'
  const companyDescription = footerSettings?.company_description || 'Türkiye\'nin en güvenilir online alışveriş platformu.'
  const showNewsletter = footerSettings?.show_newsletter !== false
  const newsletterTitle = footerSettings?.newsletter_title || 'Bültenimize Abone Olun'
  const newsletterDescription = footerSettings?.newsletter_description || 'En yeni ürünler ve kampanyalardan ilk siz haberdar olun.'
  const contactPhone = footerSettings?.contact_phone
  const contactEmail = footerSettings?.contact_email
  const contactAddress = footerSettings?.contact_address
  const showSocialMedia = footerSettings?.show_social_media !== false
  const copyrightText = footerSettings?.copyright_text || '© 2025 RDHN Commerce. Tüm hakları saklıdır.'

  // Sosyal medya linkleri
  const socialLinks = [
    { 
      name: 'Facebook', 
      href: footerSettings?.facebook_url || '#', 
      icon: Facebook,
      show: !!footerSettings?.facebook_url
    },
    { 
      name: 'Twitter', 
      href: footerSettings?.twitter_url || '#', 
      icon: Twitter,
      show: !!footerSettings?.twitter_url
    },
    { 
      name: 'Instagram', 
      href: footerSettings?.instagram_url || '#', 
      icon: Instagram,
      show: !!footerSettings?.instagram_url
    },
    { 
      name: 'YouTube', 
      href: footerSettings?.youtube_url || '#', 
      icon: Youtube,
      show: !!footerSettings?.youtube_url
    },
    { 
      name: 'LinkedIn', 
      href: footerSettings?.linkedin_url || '#', 
      icon: Linkedin,
      show: !!footerSettings?.linkedin_url
    },
  ].filter(link => link.show)

  return (
    <footer className="bg-secondary text-secondary-foreground border-t">
      {/* Özel CSS varsa ekle */}
      {footerSettings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: footerSettings.custom_css }} />
      )}

      {/* Newsletter Section */}
      {showNewsletter && (
        <div className="border-b bg-primary/10">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold mb-2 text-secondary-foreground">{newsletterTitle}</h3>
                <p className="text-secondary-foreground/80">
                  {newsletterDescription}
                </p>
              </div>
              <div className="flex w-full max-w-sm gap-2">
                <Input placeholder="E-posta adresiniz" type="email" />
                <Button className="btn-trendyol">Abone Ol</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${
          linkGroups.length === 0 ? 'lg:grid-cols-2' :
          linkGroups.length === 1 ? 'lg:grid-cols-3' :
          linkGroups.length === 2 ? 'lg:grid-cols-4' :
          linkGroups.length >= 3 ? 'lg:grid-cols-5' : 'lg:grid-cols-5'
        }`}>
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold mb-4 block">
              {companyName}
            </Link>
            <p className="text-secondary-foreground/80 mb-4 text-sm leading-relaxed">
              {companyDescription}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              {contactPhone && (
                <div className="flex items-center gap-2 text-secondary-foreground/80">
                  <Phone className="h-4 w-4" />
                  <span>{contactPhone}</span>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center gap-2 text-secondary-foreground/80">
                  <Mail className="h-4 w-4" />
                  <span>{contactEmail}</span>
                </div>
              )}
              {contactAddress && (
                <div className="flex items-center gap-2 text-secondary-foreground/80">
                  <MapPin className="h-4 w-4" />
                  <span>{contactAddress}</span>
                </div>
              )}
            </div>

            {/* Google Maps */}
            {footerSettings?.show_google_maps && footerSettings?.google_maps_embed_url && (
              <div className="mt-6">
                <div 
                  className="rounded-lg overflow-hidden border border-secondary-foreground/20"
                  dangerouslySetInnerHTML={{ 
                    __html: footerSettings.google_maps_embed_url
                      .replace(/width="[^"]*"/, `width="${footerSettings.google_maps_width}"`)
                      .replace(/height="[^"]*"/, `height="${footerSettings.google_maps_height}"`)
                      .replace(/<iframe/, '<iframe style="border:0; display:block; width:100%;"')
                  }}
                />
              </div>
            )}
          </div>

          {/* Dinamik Link Grupları */}
          {linkGroups.map((group) => {
            const groupKey = group.title.toLowerCase()
              .replace('ş', 's')
              .replace('ı', 'i')
              .replace('ğ', 'g')
              .replace('ü', 'u')
              .replace('ö', 'o')
              .replace('ç', 'c')
              .replace(/\s+/g, '')
            
            const links = organizedLinks[groupKey] || []
            
            return (
              <div key={group.id}>
                <h4 className="font-semibold mb-4 text-secondary-foreground">{group.title}</h4>
                <ul className="space-y-2">
                  {links.map((link: any) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href} 
                        className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors"
                        target={link.isExternal ? '_blank' : undefined}
                        rel={link.isExternal ? 'noopener noreferrer' : undefined}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Social Media */}
        {showSocialMedia && socialLinks.length > 0 && (
          <div className="mt-8 pt-8 border-t border-secondary-foreground/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-secondary-foreground/80">Bizi takip edin:</span>
                <div className="flex gap-2">
                  {socialLinks.map((social) => (
                    <Button
                      key={social.name}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-secondary-foreground/80 hover:text-primary hover:bg-primary/10"
                      asChild
                    >
                      <Link 
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <social.icon className="h-4 w-4" />
                        <span className="sr-only">{social.name}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Legal Links - Mobile */}
              <div className="flex flex-wrap gap-4 md:hidden">
                {organizedLinks.legal?.map((link: any, index: number) => (
                  <span key={link.name} className="flex items-center gap-4">
                    <Link 
                      href={link.href} 
                      className="text-xs text-secondary-foreground/80 hover:text-primary transition-colors"
                      target={link.isExternal ? '_blank' : undefined}
                      rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    >
                      {link.name}
                    </Link>
                    {index < organizedLinks.legal.length - 1 && (
                      <span className="text-secondary-foreground/80">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-foreground/20 bg-secondary/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-secondary-foreground/80">
              {copyrightText}
            </p>
            
            {/* Legal Links - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {organizedLinks.legal?.map((link: any, index: number) => (
                <span key={link.name} className="flex items-center gap-4">
                  <Link 
                    href={link.href} 
                    className="text-xs text-secondary-foreground/80 hover:text-primary transition-colors"
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    {link.name}
                  </Link>
                  {index < organizedLinks.legal.length - 1 && (
                    <span className="text-secondary-foreground/80">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 