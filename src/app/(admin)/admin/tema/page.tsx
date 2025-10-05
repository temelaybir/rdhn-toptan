'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useThemeConfig } from '@/context/theme-context'
import { 
  Palette, 
  Layout, 
  Type, 
  Save, 
  Eye, 
  RotateCcw,
  ShoppingBag,
  Loader2
} from 'lucide-react'
import type { ColorTheme, DesignStyle, FontStyle, ProductCardStyle } from '@/services/site-settings'

const colorThemes = [
  { name: 'Açık', value: 'light' as ColorTheme, icon: Palette, description: 'Beyaz arka plan, koyu metin' },
  { name: 'Koyu', value: 'dark' as ColorTheme, icon: Palette, description: 'Koyu arka plan, açık metin' },
  { name: 'Okyanus', value: 'ocean' as ColorTheme, icon: Palette, description: 'Sakinleştirici mavi tonları' },
  { name: 'Orman', value: 'forest' as ColorTheme, icon: Palette, description: 'Doğal yeşil tonları' },
]

const designStyles = [
  { name: 'Varsayılan', value: 'default' as DesignStyle, icon: Layout, description: 'Dengeli ve modern görünüm' },
  { name: 'Minimal', value: 'minimal' as DesignStyle, icon: Layout, description: 'Sade ve keskin hatlar' },
  { name: 'Modern', value: 'modern' as DesignStyle, icon: Layout, description: 'Yumuşak köşeler ve zarif' },
  { name: 'Playful', value: 'playful' as DesignStyle, icon: Layout, description: 'Eğlenceli ve yuvarlak' },
  { name: 'Brutal', value: 'brutal' as DesignStyle, icon: Layout, description: 'Cesur ve gösterişli' },
]

const fontPairs = [
  { 
    name: 'Modern Sans', 
    value: 'modern-sans' as FontStyle,
    icon: Type, 
    description: 'Inter & Fira Code - Temiz ve minimal' 
  },
  { 
    name: 'Zarif Serif', 
    value: 'elegant-serif' as FontStyle,
    icon: Type, 
    description: 'Playfair Display & Lora - Sofistike ve klasik' 
  },
  { 
    name: 'Eğlenceli Mix', 
    value: 'playful-mix' as FontStyle,
    icon: Type, 
    description: 'Poppins & Open Sans - Dinamik ve canlı' 
  },
  { 
    name: 'Profesyonel', 
    value: 'professional' as FontStyle,
    icon: Type, 
    description: 'Montserrat & Source Sans Pro - İş dünyası için' 
  },
  { 
    name: 'Tech Modern', 
    value: 'tech-modern' as FontStyle,
    icon: Type, 
    description: 'Space Grotesk & DM Sans - Teknoloji odaklı' 
  },
  { 
    name: 'Sıcak Okuma', 
    value: 'warm-reading' as FontStyle,
    icon: Type, 
    description: 'Merriweather & Crimson Text - Uzun metinler için' 
  },
  { 
    name: 'Güçlü İfade', 
    value: 'bold-statement' as FontStyle,
    icon: Type, 
    description: 'Bebas Neue & Roboto - Etkileyici başlıklar' 
  },
  { 
    name: 'Retro Tarz', 
    value: 'retro-vibes' as FontStyle,
    icon: Type, 
    description: 'Righteous & Quicksand - Nostaljik görünüm' 
  },
]

const productCardStyles = [
  { name: 'Varsayılan', value: 'default' as ProductCardStyle, icon: ShoppingBag, description: 'Standart ürün kartı' },
  { name: 'Minimal', value: 'minimal' as ProductCardStyle, icon: ShoppingBag, description: 'Sade ve temiz tasarım' },
  { name: 'Detaylı', value: 'detailed' as ProductCardStyle, icon: ShoppingBag, description: 'Daha fazla bilgi içeren' },
  { name: 'Kompakt', value: 'compact' as ProductCardStyle, icon: ShoppingBag, description: 'Küçük ve öz tasarım' },
]

export default function ThemeSettingsPage() {
  const { theme: currentTheme, isLoading: themeLoading, refreshTheme } = useThemeConfig()
  
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>(currentTheme.colorTheme)
  const [selectedDesignStyle, setSelectedDesignStyle] = useState<string>(currentTheme.designStyle)
  const [selectedFontPair, setSelectedFontPair] = useState<string>(currentTheme.fontStyle)
  const [selectedProductCardStyle, setSelectedProductCardStyle] = useState<string>(currentTheme.productCardStyle)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Tema ayarları yüklendiğinde formu güncelle
  useEffect(() => {
    if (!themeLoading) {
      setSelectedColorTheme(currentTheme.colorTheme)
      setSelectedDesignStyle(currentTheme.designStyle)
      setSelectedFontPair(currentTheme.fontStyle)
      setSelectedProductCardStyle(currentTheme.productCardStyle)
      setHasChanges(false)
    }
  }, [currentTheme, themeLoading])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Değişiklikler tek tek uygulanacak
      const promises = []
      
      if (selectedColorTheme !== currentTheme.colorTheme) {
        promises.push(fetch('/api/admin/theme-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_color_scheme: selectedColorTheme })
        }))
      }
      
      if (selectedDesignStyle !== currentTheme.designStyle) {
        promises.push(fetch('/api/admin/theme-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_design_style: selectedDesignStyle })
        }))
      }
      
      if (selectedFontPair !== currentTheme.fontStyle) {
        promises.push(fetch('/api/admin/theme-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_font_style: selectedFontPair })
        }))
      }
      
      if (selectedProductCardStyle !== currentTheme.productCardStyle) {
        promises.push(fetch('/api/admin/theme-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme_product_card_style: selectedProductCardStyle })
        }))
      }

      if (promises.length > 0) {
        // Tüm değişiklikleri bir arada gönder
        const requestData = {
          theme_color_scheme: selectedColorTheme,
          theme_design_style: selectedDesignStyle,
          theme_font_style: selectedFontPair,
          theme_product_card_style: selectedProductCardStyle
        }
        
        const response = await fetch('/api/admin/theme-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          throw new Error('Tema ayarları kaydedilemedi')
        }
        
        const responseData = await response.json()

        // Tema context'ini yenile
        await refreshTheme()
        setHasChanges(false)
        toast.success('🎨 Tema ayarları başarıyla kaydedildi! Değişiklikler tüm sitede geçerli.')
      } else {
        toast.info('Değişiklik yapılmadı')
      }
    } catch (error) {
      console.error('Tema kaydetme hatası:', error)
      toast.error('Tema ayarları kaydedilemedi')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSelectedColorTheme(currentTheme.colorTheme)
    setSelectedDesignStyle(currentTheme.designStyle)
    setSelectedFontPair(currentTheme.fontStyle)
    setSelectedProductCardStyle(currentTheme.productCardStyle)
    setHasChanges(false)
    toast.info('Değişiklikler geri alındı')
  }

  const handleColorThemeChange = (value: string) => {
    setSelectedColorTheme(value)
    setHasChanges(true)
  }

  const handleDesignStyleChange = (value: string) => {
    setSelectedDesignStyle(value)
    setHasChanges(true)
  }

  const handleFontPairChange = (value: string) => {
    setSelectedFontPair(value)
    setHasChanges(true)
  }

  const handleProductCardStyleChange = (value: string) => {
    setSelectedProductCardStyle(value)
    setHasChanges(true)
  }

  const handlePreview = () => {
    // Geçici önizleme uygula
    if (selectedColorTheme === 'light' || selectedColorTheme === 'dark') {
      document.documentElement.className = selectedColorTheme
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.className = ''
      document.documentElement.setAttribute('data-theme', selectedColorTheme)
    }
    
    if (selectedDesignStyle === 'default') {
      document.documentElement.removeAttribute('data-design')
    } else {
      document.documentElement.setAttribute('data-design', selectedDesignStyle)
    }
    
    if (selectedFontPair === 'modern-sans') {
      document.documentElement.removeAttribute('data-font')
    } else {
      document.documentElement.setAttribute('data-font', selectedFontPair)
    }

    if (selectedProductCardStyle === 'default') {
      document.documentElement.removeAttribute('data-product-card')
    } else {
      document.documentElement.setAttribute('data-product-card', selectedProductCardStyle)
    }
    
    toast.success('Önizleme uygulandı - Kaydet butonuna basarak kalıcı hale getirin')
  }

  if (themeLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Tema ayarları yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tema Ayarları</h1>
          <p className="text-muted-foreground mt-2">
            Site geneli tema ayarlarını buradan düzenleyebilirsiniz. Değişiklikler tüm kullanıcılar için geçerli olacaktır.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Geri Al
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isSaving}
          >
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Dikkat:</strong> Kaydedilmemiş değişiklikleriniz var. Bu değişiklikler tüm site ziyaretçileri için geçerli olacaktır.
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Color Theme */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 Renk Teması</CardTitle>
            <CardDescription>
              Sitenizin genel renk şemasını seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedColorTheme} onValueChange={handleColorThemeChange}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colorThemes.map((theme) => {
                  const Icon = theme.icon
                  return (
                    <div key={theme.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={theme.value} id={theme.value} />
                      <Label htmlFor={theme.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{theme.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {theme.description}
                        </p>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Design Style */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Tasarım Stili</CardTitle>
            <CardDescription>
              Sitenizin görsel tasarım yaklaşımını belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedDesignStyle} onValueChange={handleDesignStyleChange}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {designStyles.map((style) => {
                  const Icon = style.icon
                  return (
                    <div key={style.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={style.value} id={style.value} />
                      <Label htmlFor={style.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{style.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {style.description}
                        </p>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Font Style */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Yazı Tipi Kombinasyonu</CardTitle>
            <CardDescription>
              Başlık ve gövde metinleri için yazı tipi çiftini seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedFontPair} onValueChange={handleFontPairChange}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fontPairs.map((font) => {
                  const Icon = font.icon
                  return (
                    <div key={font.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={font.value} id={font.value} />
                      <Label htmlFor={font.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{font.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {font.description}
                        </p>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Product Card Style */}
        <Card>
          <CardHeader>
            <CardTitle>🛍️ Ürün Kartı Stili</CardTitle>
            <CardDescription>
              Ürün listelerinde kullanılacak kart tasarımını seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedProductCardStyle} onValueChange={handleProductCardStyleChange}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productCardStyles.map((style) => {
                  const Icon = style.icon
                  return (
                    <div key={style.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={style.value} id={style.value} />
                      <Label htmlFor={style.value} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{style.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {style.description}
                        </p>
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Area */}
      <Card>
        <CardHeader>
          <CardTitle>👀 Canlı Önizleme</CardTitle>
          <CardDescription>
            Seçtiğiniz tema kombinasyonunun nasıl görüneceğinin önizlemesi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border rounded-lg bg-background">
            <h3 className="text-xl font-semibold mb-2">Örnek Başlık</h3>
            <p className="text-muted-foreground mb-4">
              Bu metin seçtiğiniz tema ayarlarına göre görünecektir. Font stili, renkler ve tasarım öğeleri burada test edilebilir.
            </p>
            <div className="flex gap-3">
              <Button>Birincil Buton</Button>
              <Button variant="outline">İkincil Buton</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 