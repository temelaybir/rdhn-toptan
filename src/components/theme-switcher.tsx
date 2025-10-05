'use client'

import * as React from 'react'
import { Moon, Sun, Palette, Sparkles, TreePine, Waves, Layout, Square, Smile, Zap, Type, BookOpen, Briefcase, Code, Heart, Bold, Disc } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useThemeConfig, type ColorTheme, type DesignStyle, type FontStyle } from '@/context/theme-context'
import { cn } from '@/lib/utils'

const colorThemes = [
  { name: 'Açık', value: 'light', icon: Sun },
  { name: 'Koyu', value: 'dark', icon: Moon },
  { name: 'Okyanus', value: 'ocean', icon: Waves },
  { name: 'Orman', value: 'forest', icon: TreePine },
]

const designStyles = [
  { name: 'Varsayılan', value: 'default', icon: Layout, description: 'Dengeli ve modern' },
  { name: 'Minimal', value: 'minimal', icon: Square, description: 'Sade ve keskin' },
  { name: 'Modern', value: 'modern', icon: Sparkles, description: 'Yumuşak ve zarif' },
  { name: 'Playful', value: 'playful', icon: Smile, description: 'Eğlenceli ve yuvarlak' },
  { name: 'Brutal', value: 'brutal', icon: Zap, description: 'Cesur ve gösterişli' },
]

const fontStyles = [
  { name: 'Modern Sans', value: 'modern-sans', icon: Type, description: 'Temiz ve minimal' },
  { name: 'Zarif Serif', value: 'elegant-serif', icon: BookOpen, description: 'Sofistike ve klasik' },
  { name: 'Eğlenceli Mix', value: 'playful-mix', icon: Smile, description: 'Dinamik ve canlı' },
  { name: 'Profesyonel', value: 'professional', icon: Briefcase, description: 'İş dünyası için' },
  { name: 'Tech Modern', value: 'tech-modern', icon: Code, description: 'Teknoloji odaklı' },
  { name: 'Sıcak Okuma', value: 'warm-reading', icon: Heart, description: 'Rahat okuma deneyimi' },
  { name: 'Güçlü İfade', value: 'bold-statement', icon: Bold, description: 'Etkileyici başlıklar' },
  { name: 'Retro Tarz', value: 'retro-vibes', icon: Disc, description: 'Nostaljik görünüm' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { theme: themeConfig, setColorTheme, setDesignStyle, setFontStyle } = useThemeConfig()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Event handler'ları useCallback ile optimize et
  const handleColorThemeChange = React.useCallback((value: string) => {
    const newColorTheme = value as ColorTheme
    if (newColorTheme === 'light' || newColorTheme === 'dark') {
      setTheme(newColorTheme)
    } else {
      // Diğer temalar için data-theme attribute kullan
      setTheme('light') // next-themes için light olarak ayarla
      document.documentElement.setAttribute('data-theme', newColorTheme)
    }
    setColorTheme(newColorTheme)
  }, [setTheme, setColorTheme])

  const handleDesignStyleChange = React.useCallback((value: DesignStyle) => {
    setDesignStyle(value)
  }, [setDesignStyle])

  const handleFontStyleChange = React.useCallback((value: FontStyle) => {
    setFontStyle(value)
  }, [setFontStyle])

  if (!mounted) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Tema Değiştir</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Tema Ayarları</DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Renk Teması
        </DropdownMenuLabel>
        {colorThemes.map((colorTheme) => {
          const Icon = colorTheme.icon
          const isActive = colorTheme.value === theme || 
            (document.documentElement.getAttribute('data-theme') === colorTheme.value)
          
          return (
            <DropdownMenuItem
              key={colorTheme.value}
              onClick={() => handleColorThemeChange(colorTheme.value)}
              className={cn(
                'flex items-center gap-2',
                isActive && 'bg-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              {colorTheme.name}
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Tasarım Stili
        </DropdownMenuLabel>
        {designStyles.map((style) => {
          const Icon = style.icon
          const isActive = style.value === themeConfig.designStyle
          
          return (
            <DropdownMenuItem
              key={style.value}
              onClick={() => handleDesignStyleChange(style.value as DesignStyle)}
              className={cn(
                'flex items-start gap-2',
                isActive && 'bg-accent'
              )}
            >
              <Icon className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">{style.name}</div>
                <div className="text-xs text-muted-foreground">
                  {style.description}
                </div>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              )}
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Yazı Tipi Kombinasyonu
        </DropdownMenuLabel>
        {fontStyles.map((style) => {
          const Icon = style.icon
          const isActive = style.value === themeConfig.fontStyle
          
          return (
            <DropdownMenuItem
              key={style.value}
              onClick={() => handleFontStyleChange(style.value as FontStyle)}
              className={cn(
                'flex items-start gap-2',
                isActive && 'bg-accent'
              )}
            >
              <Icon className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">{style.name}</div>
                <div className="text-xs text-muted-foreground">
                  {style.description}
                </div>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
              )}
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <div className="flex gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span>Aktif</span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Component display name
ThemeSwitcher.displayName = 'ThemeSwitcher' 