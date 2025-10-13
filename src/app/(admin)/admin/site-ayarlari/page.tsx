'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Globe, Mail, Phone, Camera, Tag, Settings, Share2, Upload, X, Loader2, Bell, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { SafeImage } from '@/components/ui/safe-image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { uploadSiteLogo, deleteSiteLogo } from '@/app/actions/admin/upload-actions'

interface SiteSettings {
  id: string
  site_name: string
  site_description: string
  site_slogan: string | null
  site_logo_url: string
  site_logo_dark_url: string | null
  logo_display_mode: 'logo_only' | 'logo_with_text'
  logo_size: 'small' | 'medium' | 'large'
  favicon_url: string
  social_image_url: string
  meta_keywords: string
  meta_author: string
  meta_robots: string
  contact_email: string | null
  contact_phone: string | null
  whatsapp_number: string | null
  address: string | null
  google_maps_embed_url: string | null
  show_google_maps: boolean
  google_maps_width: string
  google_maps_height: string
  facebook_url: string | null
  instagram_url: string | null
  whatsapp_url: string | null
  twitter_url: string | null
  youtube_url: string | null
  linkedin_url: string | null
  currency_code: string
  currency_symbol: string
  tax_rate: number
  free_shipping_threshold: number
  google_analytics_id: string | null
  google_tag_manager_id: string | null
  facebook_pixel_id: string | null
  show_social_widget: boolean
  social_widget_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  social_widget_style: 'floating' | 'minimal' | 'compact'
  is_active: boolean
  // E-mail bildirim ayarları
  order_notification_emails: string | null
  enable_order_notifications: boolean
  order_email_subject: string | null
  order_email_template: string | null
  // SMTP ayarları
  smtp_host: string | null
  smtp_port: number
  smtp_username: string | null
  smtp_password: string | null
  smtp_from_email: string | null
  smtp_from_name: string | null
  smtp_secure: boolean
  smtp_enabled: boolean
  // Toptan satış ayarları
  minimum_order_value: number | null
  minimum_order_quantity: number | null
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({
    logo: false,
    logoDark: false,
    favicon: false,
    social: false
  })

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const logoDarkInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const socialInputRef = useRef<HTMLInputElement>(null)

  // Ayarları getir
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Site ayarları yükleme hatası:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error(`Site ayarları yüklenemedi: ${error.message}`)
        return
      }

      setSettings(data)
    } catch (error) {
      console.error('FetchSettings exception:', {
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Ayarları kaydet
  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const supabase = createClient()
      const updateData = {
        site_name: settings.site_name.trim(),
        site_description: settings.site_description.trim(),
        site_slogan: settings.site_slogan?.trim() || null,
        site_logo_url: settings.site_logo_url.trim(),
        site_logo_dark_url: settings.site_logo_dark_url?.trim() || null,
        logo_display_mode: settings.logo_display_mode,
        logo_size: settings.logo_size,
        favicon_url: settings.favicon_url.trim(),
        social_image_url: settings.social_image_url.trim(),
        meta_keywords: settings.meta_keywords.trim(),
        meta_author: settings.meta_author.trim(),
        meta_robots: settings.meta_robots.trim(),
        contact_email: settings.contact_email?.trim() || null,
        contact_phone: settings.contact_phone?.trim() || null,
        whatsapp_number: settings.whatsapp_number?.trim() || null,
        address: settings.address?.trim() || null,
        google_maps_embed_url: settings.google_maps_embed_url?.trim() || null,
        show_google_maps: settings.show_google_maps ?? false,
        google_maps_width: settings.google_maps_width || '100%',
        google_maps_height: settings.google_maps_height || '300',
        facebook_url: settings.facebook_url?.trim() || null,
        instagram_url: settings.instagram_url?.trim() || null,
        whatsapp_url: settings.whatsapp_url?.trim() || null,
        twitter_url: settings.twitter_url?.trim() || null,
        youtube_url: settings.youtube_url?.trim() || null,
        linkedin_url: settings.linkedin_url?.trim() || null,
        show_social_widget: settings.show_social_widget ?? true,
        social_widget_position: settings.social_widget_position || 'bottom-right',
        social_widget_style: settings.social_widget_style || 'floating',
        currency_code: settings.currency_code.trim(),
        currency_symbol: settings.currency_symbol.trim(),
        tax_rate: settings.tax_rate,
        free_shipping_threshold: settings.free_shipping_threshold,
        google_analytics_id: settings.google_analytics_id?.trim() || null,
        google_tag_manager_id: settings.google_tag_manager_id?.trim() || null,
        facebook_pixel_id: settings.facebook_pixel_id?.trim() || null,
        // E-mail bildirim ayarları
        order_notification_emails: settings.order_notification_emails?.trim() || null,
        enable_order_notifications: settings.enable_order_notifications ?? true,
        order_email_subject: settings.order_email_subject?.trim() || null,
        order_email_template: settings.order_email_template?.trim() || null,
        // SMTP ayarları
        smtp_host: settings.smtp_host?.trim() || null,
        smtp_port: settings.smtp_port || 587,
        smtp_username: settings.smtp_username?.trim() || null,
        smtp_password: settings.smtp_password?.trim() || null,
        smtp_from_email: settings.smtp_from_email?.trim() || null,
        smtp_from_name: settings.smtp_from_name?.trim() || null,
        smtp_secure: settings.smtp_secure ?? true,
        smtp_enabled: settings.smtp_enabled ?? false,
        // Toptan satış ayarları
        minimum_order_value: settings.minimum_order_value || null,
        minimum_order_quantity: settings.minimum_order_quantity || 10,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', settings.id)
        .select()

      if (error) {
        console.error('Supabase kaydetme hatası:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error(`Kaydetme hatası: ${error.message}`)
        return
      }

      toast.success('Site ayarları başarıyla kaydedildi')
      
      // Güncellenmiş veriyi state'e yükle
      if (data && data[0]) {
        setSettings(data[0])
      }
    } catch (error) {
      console.error('Kaydetme işlemi hatası:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error('Kaydetme sırasında hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Logo yükleme fonksiyonu
  const handleLogoUpload = async (file: File, logoType: 'logo' | 'logo-dark' | 'favicon' | 'social') => {
    const uploadKey = logoType === 'logo-dark' ? 'logoDark' : logoType
    
    setUploading(prev => ({ ...prev, [uploadKey]: true }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('logoType', logoType)

      const result = await uploadSiteLogo(formData)

      if (result.success && result.result) {
        // URL'i ilgili alana kaydet
        const urlField = logoType === 'logo' ? 'site_logo_url' : 
                        logoType === 'logo-dark' ? 'site_logo_dark_url' :
                        logoType === 'favicon' ? 'favicon_url' : 'social_image_url'
        
        updateSetting(urlField as keyof SiteSettings, result.result.url)
        
        const successMessage = logoType === 'logo' ? 'Logo' : 
                              logoType === 'logo-dark' ? 'Koyu tema logosu' : 
                              logoType === 'favicon' ? 'Favicon' : 'Sosyal medya görseli'
        
        toast.success(`${successMessage} başarıyla yüklendi`)
      } else {
        console.error('Upload başarısız:', result)
        toast.error(result.error || 'Yükleme başarısız')
      }
    } catch (error) {
      console.error('Logo upload exception:', error)
      toast.error(`Yükleme sırasında hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }))
    }
  }

  // Dosya seçme handler'ı
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, logoType: 'logo' | 'logo-dark' | 'favicon' | 'social') => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    // Dosya doğrulama
    if (!file.type.startsWith('image/')) {
      console.error('Geçersiz dosya tipi:', file.type)
      toast.error('Lütfen bir görsel dosyası seçin')
      return
    }

    // Boyut kontrolleri
    const maxSize = logoType === 'favicon' ? 1024 * 1024 : 5 * 1024 * 1024 // 1MB for favicon, 5MB for others
    if (file.size > maxSize) {
      console.error('Dosya çok büyük:', { fileSize: file.size, maxSize })
      toast.error(`Dosya boyutu ${logoType === 'favicon' ? '1MB' : '5MB'}'dan büyük olamaz`)
      return
    }

    handleLogoUpload(file, logoType)
    
    // Input'u temizle
    e.target.value = ''
  }

  // Input değiştirme fonksiyonu
  const updateSetting = (field: keyof SiteSettings, value: any) => {
    if (!settings) {
      console.warn('Settings null, güncelleme atlanıyor')
      return
    }
    
    setSettings(prev => {
      if (!prev) return null
      const updated = { ...prev, [field]: value }
      return updated
    })
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Site ayarları yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Site ayarları bulunamadı</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Site Ayarları</h1>
          <p className="text-muted-foreground">Sitenizin genel ayarlarını yönetin</p>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Marka
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            İletişim
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            E-mail Bildirimleri
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            SMTP Ayarları
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Sosyal Medya
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Gelişmiş
          </TabsTrigger>
        </TabsList>

        {/* Genel Ayarlar */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Site Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="site_name">Site Adı *</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    placeholder="RDHN Commerce"
                  />
                </div>
                
                <div>
                  <Label htmlFor="site_slogan">Site Sloganı</Label>
                  <Input
                    id="site_slogan"
                    value={settings.site_slogan || ''}
                    onChange={(e) => updateSetting('site_slogan', e.target.value)}
                    placeholder="Kaçırılmayacak fırsatlar"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="site_description">Site Açıklaması *</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  placeholder="Sitenizin kısa açıklaması"
                  rows={3}
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="meta_keywords">SEO Anahtar Kelimeler</Label>
                <Textarea
                  id="meta_keywords"
                  value={settings.meta_keywords}
                  onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                  placeholder="anahtar, kelime, virgül, ile, ayrın"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Anahtar kelimeleri virgül ile ayırın
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="meta_author">Meta Author</Label>
                  <Input
                    id="meta_author"
                    value={settings.meta_author}
                    onChange={(e) => updateSetting('meta_author', e.target.value)}
                    placeholder="RDHN Commerce"
                  />
                </div>
                
                <div>
                  <Label htmlFor="meta_robots">Meta Robots</Label>
                  <Input
                    id="meta_robots"
                    value={settings.meta_robots}
                    onChange={(e) => updateSetting('meta_robots', e.target.value)}
                    placeholder="index, follow"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Toptan Satış Ayarları */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Toptan Satış Ayarları
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Minimum sipariş tutarı ve adedi ayarlarını yapın
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="minimum_order_value">Minimum Sipariş Tutarı (TL)</Label>
                  <Input
                    id="minimum_order_value"
                    type="number"
                    value={settings.minimum_order_value || ''}
                    onChange={(e) => updateSetting('minimum_order_value', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Örn: 5000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sepet toplamının en az bu kadar olması gerekir (Boş bırakılabilir)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="minimum_order_quantity">Minimum Sipariş Adedi *</Label>
                  <Input
                    id="minimum_order_quantity"
                    type="number"
                    value={settings.minimum_order_quantity || 10}
                    onChange={(e) => updateSetting('minimum_order_quantity', e.target.value ? parseInt(e.target.value) : 10)}
                    placeholder="Örn: 10"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sepette toplam en az bu kadar ürün olması gerekir
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Toptan Satış Sistemi</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tüm ürünler toptan satış için yapılandırılmıştır</li>
                  <li>• Her ürün için kademeli fiyatlandırma tanımlayabilirsiniz</li>
                  <li>• Müşteriler minimum sipariş adedinin altında sipariş veremez</li>
                  <li>• Minimum tutarı aşmayan siparişler ödeme sayfasına geçemez</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marka Ayarları */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Logo ve Görsel Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site Logosu */}
              <div className="space-y-4">
                <Label htmlFor="site_logo_url">Site Logosu *</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      id="site_logo_url"
                      value={settings.site_logo_url}
                      onChange={(e) => updateSetting('site_logo_url', e.target.value)}
                      placeholder="/logo.svg"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading.logo}
                      className="w-full"
                    >
                      {uploading.logo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Logo Yükle
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG - Max 5MB
                    </p>
                  </div>
                  
                  {settings.site_logo_url && (
                    <div className="space-y-2">
                      <Label>Önizleme</Label>
                      <div className="relative border rounded-lg p-4 bg-white">
                        <SafeImage
                          src={settings.site_logo_url}
                          alt="Site Logosu"
                          width={200}
                          height={60}
                          className="object-contain max-w-full max-h-16"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Görünüm Seçenekleri */}
              <div className="space-y-4">
                <Label>Logo Görünüm Modu</Label>
                <RadioGroup
                  value={settings.logo_display_mode}
                  onValueChange={(value: 'logo_only' | 'logo_with_text') => updateSetting('logo_display_mode', value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="logo_only" id="logo_only" />
                    <div className="flex-1">
                      <Label htmlFor="logo_only" className="font-medium cursor-pointer">
                        Sadece Logo
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Header'da sadece logo gösterilir
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="logo_with_text" id="logo_with_text" />
                    <div className="flex-1">
                      <Label htmlFor="logo_with_text" className="font-medium cursor-pointer">
                        Logo + Site Adı
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Logo'nun yanında site adı da gösterilir
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Logo Boyut Seçenekleri */}
              <div className="space-y-4">
                <Label htmlFor="logo_size">Logo Boyutu</Label>
                <Select 
                  value={settings.logo_size}
                  onValueChange={(value: 'small' | 'medium' | 'large') => updateSetting('logo_size', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Logo boyutunu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-xs text-white">S</div>
                        <span>Küçük (100px)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-sm text-white">M</div>
                        <span>Orta (120px)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="large">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-base text-white">L</div>
                        <span>Büyük (140px)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Header'da gösterilecek logo boyutunu seçin
                </p>
              </div>

              <Separator />

              {/* Koyu Tema Logosu */}
              <div className="space-y-4">
                <Label htmlFor="site_logo_dark_url">Koyu Tema Logosu (İsteğe Bağlı)</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      id="site_logo_dark_url"
                      value={settings.site_logo_dark_url || ''}
                      onChange={(e) => updateSetting('site_logo_dark_url', e.target.value)}
                      placeholder="/logo-dark.svg"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => logoDarkInputRef.current?.click()}
                      disabled={uploading.logoDark}
                      className="w-full"
                    >
                      {uploading.logoDark ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Koyu Logo Yükle
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Koyu tema için ayrı logo (isteğe bağlı)
                    </p>
                  </div>
                  
                  {settings.site_logo_dark_url && (
                    <div className="space-y-2">
                      <Label>Önizleme</Label>
                      <div className="relative border rounded-lg p-4 bg-gray-800">
                        <SafeImage
                          src={settings.site_logo_dark_url}
                          alt="Koyu Tema Logosu"
                          width={200}
                          height={60}
                          className="object-contain max-w-full max-h-16"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Diğer Görseller */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Favicon */}
                <div className="space-y-4">
                  <Label htmlFor="favicon_url">Favicon</Label>
                  <div className="space-y-2">
                    <Input
                      id="favicon_url"
                      value={settings.favicon_url}
                      onChange={(e) => updateSetting('favicon_url', e.target.value)}
                      placeholder="/favicon.ico"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploading.favicon}
                      className="w-full"
                    >
                      {uploading.favicon ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Favicon Yükle
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      ICO, PNG - 32x32px önerilen, Max 1MB
                    </p>
                  </div>
                  {settings.favicon_url && (
                    <div className="border rounded-lg p-2 bg-white flex items-center gap-2">
                      <SafeImage
                        src={settings.favicon_url}
                        alt="Favicon"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span className="text-sm text-muted-foreground">Favicon Önizleme</span>
                    </div>
                  )}
                </div>
                
                {/* Sosyal Medya Görseli */}
                <div className="space-y-4">
                  <Label htmlFor="social_image_url">Sosyal Medya Görseli</Label>
                  <div className="space-y-2">
                    <Input
                      id="social_image_url"
                      value={settings.social_image_url}
                      onChange={(e) => updateSetting('social_image_url', e.target.value)}
                      placeholder="/social-preview.jpg"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => socialInputRef.current?.click()}
                      disabled={uploading.social}
                      className="w-full"
                    >
                      {uploading.social ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Sosyal Görsel Yükle
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Facebook, Twitter paylaşımları için - 1200x630px önerilen
                    </p>
                  </div>
                  {settings.social_image_url && (
                    <div className="border rounded-lg p-2 bg-white">
                      <SafeImage
                        src={settings.social_image_url}
                        alt="Sosyal Medya Görseli"
                        width={120}
                        height={63}
                        className="object-cover rounded w-full max-h-16"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* İletişim Ayarları */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contact_email">E-posta Adresi</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => updateSetting('contact_email', e.target.value)}
                    placeholder="info@ardahanticaret.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_phone">Telefon Numarası</Label>
                  <Input
                    id="contact_phone"
                    value={settings.contact_phone || ''}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                    placeholder="+90 (555) 123 45 67"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsapp_number">WhatsApp Numarası</Label>
                <Input
                  id="whatsapp_number"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => updateSetting('whatsapp_number', e.target.value)}
                  placeholder="+905551234567"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ülke kodu ile birlikte, boşluk olmadan (örn: +905551234567)
                </p>
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => updateSetting('address', e.target.value)}
                  placeholder="Tam adres bilgilerinizi girin"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Google Maps Ayarları */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Google Maps Harita
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show_google_maps">Haritayı Göster</Label>
                      <p className="text-xs text-muted-foreground">
                        Footer'da Google Maps haritasını göster/gizle
                      </p>
                    </div>
                    <Switch
                      id="show_google_maps"
                      checked={settings.show_google_maps}
                      onCheckedChange={(checked) => updateSetting('show_google_maps', checked)}
                    />
                  </div>

                  {settings.show_google_maps && (
                    <>
                      <div>
                        <Label htmlFor="google_maps_embed_url">Google Maps Embed Kodu</Label>
                        <Textarea
                          id="google_maps_embed_url"
                          value={settings.google_maps_embed_url || ''}
                          onChange={(e) => updateSetting('google_maps_embed_url', e.target.value)}
                          placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450"></iframe>'
                          rows={4}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Google Maps'ten "Paylaş" → "Harita Yerleştir" seçeneğinden embed kodunu alın
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="google_maps_width">Harita Genişliği</Label>
                          <Input
                            id="google_maps_width"
                            value={settings.google_maps_width || '100%'}
                            onChange={(e) => updateSetting('google_maps_width', e.target.value)}
                            placeholder="100%"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Örn: 100%, 600px, 80%
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="google_maps_height">Harita Yüksekliği</Label>
                          <Input
                            id="google_maps_height"
                            value={settings.google_maps_height || '300'}
                            onChange={(e) => updateSetting('google_maps_height', e.target.value)}
                            placeholder="300"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Piksel cinsinden (örn: 300, 400, 500)
                          </p>
                        </div>
                      </div>

                      {/* Önizleme */}
                      {settings.google_maps_embed_url && (
                        <div>
                          <Label className="mb-2 block">Harita Önizleme</Label>
                          <div 
                            className="rounded-lg overflow-hidden border bg-muted"
                            dangerouslySetInnerHTML={{ 
                              __html: settings.google_maps_embed_url
                                .replace(/width="[^"]*"/, `width="${settings.google_maps_width}"`)
                                .replace(/height="[^"]*"/, `height="${settings.google_maps_height}"`)
                                .replace(/<iframe/, '<iframe style="border:0; display:block; width:100%;"')
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">E-ticaret Ayarları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="currency_code">Para Birimi Kodu</Label>
                    <Input
                      id="currency_code"
                      value={settings.currency_code}
                      onChange={(e) => updateSetting('currency_code', e.target.value)}
                      placeholder="TRY"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency_symbol">Para Birimi Sembolü</Label>
                    <Input
                      id="currency_symbol"
                      value={settings.currency_symbol}
                      onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                      placeholder="₺"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax_rate">KDV Oranı (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      value={settings.tax_rate}
                      onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) || 0)}
                      placeholder="18.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="free_shipping_threshold">Ücretsiz Kargo Sınırı</Label>
                    <Input
                      id="free_shipping_threshold"
                      type="number"
                      step="0.01"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => updateSetting('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                      placeholder="150.00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMTP Ayarları */}
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>SMTP E-mail Sunucu Ayarları</CardTitle>
              <p className="text-sm text-gray-600">
                E-mail gönderimi için SMTP sunucu bilgilerini yapılandırın
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="smtp_enabled"
                  checked={settings.smtp_enabled}
                  onCheckedChange={(checked) => updateSetting('smtp_enabled', checked)}
                />
                <Label htmlFor="smtp_enabled">SMTP E-mail Gönderimi Aktif</Label>
              </div>

              {settings.smtp_enabled && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_host">SMTP Sunucu (Host)</Label>
                      <Input
                        id="smtp_host"
                        value={settings.smtp_host || ''}
                        onChange={(e) => updateSetting('smtp_host', e.target.value)}
                        placeholder="mail.ardahanticaret.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={settings.smtp_port || 587}
                        onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value) || 587)}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_username">Kullanıcı Adı</Label>
                      <Input
                        id="smtp_username"
                        value={settings.smtp_username || ''}
                        onChange={(e) => updateSetting('smtp_username', e.target.value)}
                        placeholder="siparis@ardahanticaret.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_password">Şifre</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        value={settings.smtp_password || ''}
                        onChange={(e) => updateSetting('smtp_password', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_from_email">Gönderen E-mail</Label>
                      <Input
                        id="smtp_from_email"
                        type="email"
                        value={settings.smtp_from_email || ''}
                        onChange={(e) => updateSetting('smtp_from_email', e.target.value)}
                        placeholder="siparis@ardahanticaret.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_from_name">Gönderen İsim</Label>
                      <Input
                        id="smtp_from_name"
                        value={settings.smtp_from_name || ''}
                        onChange={(e) => updateSetting('smtp_from_name', e.target.value)}
                        placeholder="Ardahan Ticaret"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="smtp_secure"
                      checked={settings.smtp_secure}
                      onCheckedChange={(checked) => updateSetting('smtp_secure', checked)}
                    />
                    <Label htmlFor="smtp_secure">SSL/TLS Güvenlik (Önerilen: Açık)</Label>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📧 Yaygın SMTP Ayarları:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div><strong>Gmail:</strong> smtp.gmail.com:587 (TLS)</div>
                      <div><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</div>
                      <div><strong>Yandex:</strong> smtp.yandex.com:465 (SSL)</div>
                      <div><strong>cPanel/Hosting:</strong> mail.yourdomain.com:587 (TLS)</div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Önemli Notlar:</h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <div>• Gmail için "App Password" oluşturmanız gerekebilir</div>
                      <div>• Hosting sağlayıcınızdan SMTP bilgilerini alabilirsiniz</div>
                      <div>• Test e-mail göndererek ayarları doğrulayın</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sosyal Medya */}}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Sosyal Medya Hesapları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    value={settings.facebook_url || ''}
                    onChange={(e) => updateSetting('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/catkapinda"
                  />
                </div>
                
                <div>
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    value={settings.instagram_url || ''}
                    onChange={(e) => updateSetting('instagram_url', e.target.value)}
                    placeholder="https://instagram.com/catkapinda"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp_url">WhatsApp URL</Label>
                  <Input
                    id="whatsapp_url"
                    value={settings.whatsapp_url || ''}
                    onChange={(e) => updateSetting('whatsapp_url', e.target.value)}
                    placeholder="https://wa.me/905551234567"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    WhatsApp Business Link veya wa.me linki
                  </p>
                </div>

                <div>
                  <Label htmlFor="twitter_url">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    value={settings.twitter_url || ''}
                    onChange={(e) => updateSetting('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/catkapinda"
                  />
                </div>
                
                <div>
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input
                    id="youtube_url"
                    value={settings.youtube_url || ''}
                    onChange={(e) => updateSetting('youtube_url', e.target.value)}
                    placeholder="https://youtube.com/@catkapinda"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={settings.linkedin_url || ''}
                    onChange={(e) => updateSetting('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/catkapinda"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Sosyal Medya Widget Ayarları</h3>
                <div className="space-y-6">
                  {/* Widget Gösterim Durumu */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="show_social_widget" className="text-base font-medium">
                        Sosyal Medya Widget'ını Göster
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Sayfanın köşesinde sticky sosyal medya butonlarını gösterir
                      </p>
                    </div>
                    <Switch
                      id="show_social_widget"
                      checked={settings.show_social_widget || false}
                      onCheckedChange={(checked) => updateSetting('show_social_widget', checked)}
                    />
                  </div>

                  {/* Widget Pozisyonu */}
                  {settings.show_social_widget && (
                    <div className="space-y-4">
                      <Label>Widget Pozisyonu</Label>
                      <RadioGroup
                        value={settings.social_widget_position || 'bottom-right'}
                        onValueChange={(value: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => 
                          updateSetting('social_widget_position', value)
                        }
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="bottom-right" id="bottom-right" />
                          <div className="flex-1">
                            <Label htmlFor="bottom-right" className="font-medium cursor-pointer">
                              Sağ Alt
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Sayfanın sağ alt köşesi
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="bottom-left" id="bottom-left" />
                          <div className="flex-1">
                            <Label htmlFor="bottom-left" className="font-medium cursor-pointer">
                              Sol Alt
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Sayfanın sol alt köşesi
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="top-right" id="top-right" />
                          <div className="flex-1">
                            <Label htmlFor="top-right" className="font-medium cursor-pointer">
                              Sağ Üst
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Sayfanın sağ üst köşesi
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="top-left" id="top-left" />
                          <div className="flex-1">
                            <Label htmlFor="top-left" className="font-medium cursor-pointer">
                              Sol Üst
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Sayfanın sol üst köşesi
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Widget Stili */}
                  {settings.show_social_widget && (
                    <div className="space-y-4">
                      <Label>Widget Stili</Label>
                      <RadioGroup
                        value={settings.social_widget_style || 'floating'}
                        onValueChange={(value: 'floating' | 'minimal' | 'compact') => 
                          updateSetting('social_widget_style', value)
                        }
                        className="grid grid-cols-1 gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="floating" id="floating" />
                          <div className="flex-1">
                            <Label htmlFor="floating" className="font-medium cursor-pointer">
                              Floating (Büyük)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Büyük butonlar, belirgin gölgeler - standart boyut
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="compact" id="compact" />
                          <div className="flex-1">
                            <Label htmlFor="compact" className="font-medium cursor-pointer">
                              Compact (Orta)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Orta boyutlu butonlar, dengeli görünüm
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 border rounded-lg p-4">
                          <RadioGroupItem value="minimal" id="minimal" />
                          <div className="flex-1">
                            <Label htmlFor="minimal" className="font-medium cursor-pointer">
                              Minimal (Küçük)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Küçük butonlar, sade görünüm, az yer kaplar
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* E-mail Bildirimleri */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>E-mail Bildirim Ayarları</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sipariş bildirimlerinin gönderileceği e-mail adreslerini ayarlayın
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable_order_notifications"
                  checked={settings.enable_order_notifications ?? true}
                  onCheckedChange={(checked) => updateSetting('enable_order_notifications', checked)}
                />
                <Label htmlFor="enable_order_notifications">Sipariş e-mail bildirimleri aktif</Label>
              </div>

              {settings.enable_order_notifications !== false && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="order_notification_emails">Bildirim E-mail Adresleri</Label>
                    <Textarea
                      id="order_notification_emails"
                      value={settings.order_notification_emails || ''}
                      onChange={(e) => updateSetting('order_notification_emails', e.target.value)}
                      placeholder="admin@ardahanticaret.com&#10;satis@ardahanticaret.com&#10;depo@ardahanticaret.com"
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Her satıra bir e-mail adresi yazın. Yeni siparişler bu adreslere bildirilecek.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="order_email_subject">E-mail Konusu</Label>
                    <Input
                      id="order_email_subject"
                      value={settings.order_email_subject || 'Yeni Sipariş - #{ORDER_NUMBER}'}
                      onChange={(e) => updateSetting('order_email_subject', e.target.value)}
                      placeholder="Yeni Sipariş - #{ORDER_NUMBER}"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {"{ORDER_NUMBER}"}, {"{CUSTOMER_NAME}"}, {"{TOTAL_AMOUNT}"} değişkenlerini kullanabilirsiniz.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="order_email_template">E-mail Şablonu</Label>
                    <Textarea
                      id="order_email_template"
                      value={settings.order_email_template || `Merhaba,

Yeni bir sipariş alındı:

Sipariş No: {ORDER_NUMBER}
Müşteri: {CUSTOMER_NAME}
E-mail: {CUSTOMER_EMAIL}
Telefon: {CUSTOMER_PHONE}
Toplam Tutar: {TOTAL_AMOUNT} TL

Sipariş Detayları:
{ORDER_ITEMS}

Teslimat Adresi:
{SHIPPING_ADDRESS}

Admin panelde detayları görüntüleyebilirsiniz.

Saygılarımızla,
Ardahan Ticaret`}
                      onChange={(e) => updateSetting('order_email_template', e.target.value)}
                      rows={15}
                      className="mt-2 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Kullanılabilir değişkenler: {"{ORDER_NUMBER}"}, {"{CUSTOMER_NAME}"}, {"{CUSTOMER_EMAIL}"}, {"{CUSTOMER_PHONE}"}, {"{TOTAL_AMOUNT}"}, {"{ORDER_ITEMS}"}, {"{SHIPPING_ADDRESS}"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gelişmiş Ayarlar */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Analitik ve Takip Kodları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input
                  id="google_analytics_id"
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                <Input
                  id="google_tag_manager_id"
                  value={settings.google_tag_manager_id || ''}
                  onChange={(e) => updateSetting('google_tag_manager_id', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input
                  id="facebook_pixel_id"
                  value={settings.facebook_pixel_id || ''}
                  onChange={(e) => updateSetting('facebook_pixel_id', e.target.value)}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'logo')}
        className="hidden"
      />
      <input
        ref={logoDarkInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'logo-dark')}
        className="hidden"
      />
      <input
        ref={faviconInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'favicon')}
        className="hidden"
      />
      <input
        ref={socialInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'social')}
        className="hidden"
      />
    </div>
  )
} 