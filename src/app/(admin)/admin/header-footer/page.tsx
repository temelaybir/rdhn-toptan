'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Edit, Trash2, Settings, Menu, Globe, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface HeaderSettings {
  id: string
  site_name: string
  show_logo: boolean
  show_search: boolean
  search_placeholder: string
  show_categories: boolean
  show_all_products_link: boolean
  all_products_text: string
  show_wishlist: boolean
  show_cart: boolean
  show_user_account: boolean
  show_top_bar: boolean
  top_bar_phone: string
  top_bar_email: string
  top_bar_free_shipping_text: string
  show_quick_links: boolean
  custom_css: string | null
  is_active: boolean
}

interface HeaderMenuItem {
  id: string
  title: string
  url: string
  order_position: number
  is_dropdown: boolean
  parent_id: string | null
  icon_name: string | null
  is_external: boolean
  is_active: boolean
}

interface HeaderQuickLink {
  id: string
  title: string
  url: string
  order_position: number
  is_external: boolean
  is_active: boolean
}

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

export default function HeaderFooterPage() {
  // State
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null)
  const [headerMenuItems, setHeaderMenuItems] = useState<HeaderMenuItem[]>([])
  const [headerQuickLinks, setHeaderQuickLinks] = useState<HeaderQuickLink[]>([])
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null)
  const [footerLinkGroups, setFooterLinkGroups] = useState<FooterLinkGroup[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false)
  const [linkGroupDialogOpen, setLinkGroupDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  // Editing states
  const [editingMenuItem, setEditingMenuItem] = useState<HeaderMenuItem | null>(null)
  const [editingLinkGroup, setEditingLinkGroup] = useState<FooterLinkGroup | null>(null)
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null)

  // Form states
  const [menuItemForm, setMenuItemForm] = useState({
    title: '',
    url: '',
    order_position: 0,
    is_dropdown: false,
    parent_id: null as string | null,
    icon_name: '',
    is_external: false,
    is_active: true
  })

  const [linkGroupForm, setLinkGroupForm] = useState({
    title: '',
    order_position: 0,
    is_active: true
  })

  const [linkForm, setLinkForm] = useState({
    group_id: '',
    title: '',
    url: '',
    order_position: 0,
    is_external: false,
    is_active: true
  })

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const [
        headerSettingsResult,
        headerMenuItemsResult,
        headerQuickLinksResult,
        footerSettingsResult,
        footerLinkGroupsResult,
        footerLinksResult
      ] = await Promise.all([
        supabase.from('header_settings').select('*').eq('is_active', true).single(),
        supabase.from('header_menu_items').select('*').eq('is_active', true).order('order_position'),
        supabase.from('header_quick_links').select('*').eq('is_active', true).order('order_position'),
        supabase.from('footer_settings').select('*').eq('is_active', true).single(),
        supabase.from('footer_link_groups').select('*').eq('is_active', true).order('order_position'),
        supabase.from('footer_links').select('*').eq('is_active', true).order('order_position')
      ])

      if (headerSettingsResult.error) throw headerSettingsResult.error
      if (headerMenuItemsResult.error) throw headerMenuItemsResult.error
      if (headerQuickLinksResult.error) throw headerQuickLinksResult.error
      if (footerSettingsResult.error) throw footerSettingsResult.error
      if (footerLinkGroupsResult.error) throw footerLinkGroupsResult.error
      if (footerLinksResult.error) throw footerLinksResult.error

      setHeaderSettings(headerSettingsResult.data)
      setHeaderMenuItems(headerMenuItemsResult.data)
      setHeaderQuickLinks(headerQuickLinksResult.data)
      setFooterSettings(footerSettingsResult.data)
      setFooterLinkGroups(footerLinkGroupsResult.data)
      setFooterLinks(footerLinksResult.data)
    } catch (error) {
      console.error('Header/Footer ayarları yükleme hatası:', error)
      toast.error('Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Save functions
  const handleSaveHeaderSettings = async () => {
    if (!headerSettings) {
      console.warn('Header settings is null')
      return
    }

    console.log('Header kaydetme başlıyor:', headerSettings)
    setSaving(true)
    try {
      const supabase = createClient()
      
      // Auth kontrolü
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth user:', user)
      console.log('Auth error:', authError)
      
      const updateData = {
        site_name: headerSettings.site_name.trim(),
        show_logo: headerSettings.show_logo,
        show_search: headerSettings.show_search,
        search_placeholder: headerSettings.search_placeholder.trim(),
        show_categories: headerSettings.show_categories,
        show_all_products_link: headerSettings.show_all_products_link,
        all_products_text: headerSettings.all_products_text.trim(),
        show_wishlist: headerSettings.show_wishlist,
        show_cart: headerSettings.show_cart,
        show_user_account: headerSettings.show_user_account,
        show_top_bar: headerSettings.show_top_bar,
        top_bar_phone: headerSettings.top_bar_phone.trim(),
        top_bar_email: headerSettings.top_bar_email.trim(),
        top_bar_free_shipping_text: headerSettings.top_bar_free_shipping_text.trim(),
        show_quick_links: headerSettings.show_quick_links,
        custom_css: headerSettings.custom_css?.trim() || null,
        updated_at: new Date().toISOString()
      }
      
      console.log('Update data:', updateData)
      console.log('Header ID:', headerSettings.id)
      
      const { data, error } = await supabase
        .from('header_settings')
        .update(updateData)
        .eq('id', headerSettings.id)
        .select()

      console.log('Update result:', { data, error })

      if (error) throw error
      
      toast.success('Header ayarları kaydedildi')
      
      // Veriyi yenile
      if (data && data[0]) {
        setHeaderSettings(data[0])
      }
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Header kaydetme hatası:', error)
      toast.error(`Header ayarları kaydedilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFooterSettings = async () => {
    if (!footerSettings) {
      console.warn('Footer settings is null')
      return
    }

    console.log('Footer kaydetme başlıyor:', footerSettings)
    setSaving(true)
    try {
      const supabase = createClient()
      
      // Auth kontrolü
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth user:', user)
      console.log('Auth error:', authError)
      
      const updateData = {
        company_name: footerSettings.company_name.trim(),
        company_description: footerSettings.company_description.trim(),
        show_newsletter: footerSettings.show_newsletter,
        newsletter_title: footerSettings.newsletter_title.trim(),
        newsletter_description: footerSettings.newsletter_description.trim(),
        contact_phone: footerSettings.contact_phone?.trim() || null,
        contact_email: footerSettings.contact_email?.trim() || null,
        contact_address: footerSettings.contact_address?.trim() || null,
        show_social_media: footerSettings.show_social_media,
        facebook_url: footerSettings.facebook_url?.trim() || null,
        twitter_url: footerSettings.twitter_url?.trim() || null,
        instagram_url: footerSettings.instagram_url?.trim() || null,
        youtube_url: footerSettings.youtube_url?.trim() || null,
        linkedin_url: footerSettings.linkedin_url?.trim() || null,
        copyright_text: footerSettings.copyright_text.trim(),
        custom_css: footerSettings.custom_css?.trim() || null,
        updated_at: new Date().toISOString()
      }
      
      console.log('Footer update data:', updateData)
      console.log('Footer ID:', footerSettings.id)
      
      const { data, error } = await supabase
        .from('footer_settings')
        .update(updateData)
        .eq('id', footerSettings.id)
        .select()

      console.log('Footer update result:', { data, error })

      if (error) throw error
      
      toast.success('Footer ayarları kaydedildi')
      
      // Veriyi yenile
      if (data && data[0]) {
        setFooterSettings(data[0])
      }
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Footer kaydetme hatası:', error)
      toast.error(`Footer ayarları kaydedilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setSaving(false)
    }
  }

  // Form handlers
  const updateHeaderSetting = (field: keyof HeaderSettings, value: any) => {
    if (!headerSettings) return
    setHeaderSettings(prev => prev ? { ...prev, [field]: value } : null)
  }

  const updateFooterSetting = (field: keyof FooterSettings, value: any) => {
    if (!footerSettings) return
    setFooterSettings(prev => prev ? { ...prev, [field]: value } : null)
  }

  // Footer Link Group handlers
  const handleSaveLinkGroup = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      if (editingLinkGroup) {
        // Update existing
        const { error } = await supabase
          .from('footer_link_groups')
          .update({
            title: linkGroupForm.title.trim(),
            order_position: linkGroupForm.order_position,
            is_active: linkGroupForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLinkGroup.id)

        if (error) throw error
        toast.success('Link grubu güncellendi')
      } else {
        // Create new
        const { error } = await supabase
          .from('footer_link_groups')
          .insert({
            title: linkGroupForm.title.trim(),
            order_position: linkGroupForm.order_position,
            is_active: linkGroupForm.is_active
          })

        if (error) throw error
        toast.success('Link grubu eklendi')
      }
      
      setLinkGroupDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Link grup kaydetme hatası:', error)
      toast.error('Link grubu kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLinkGroup = async (id: string) => {
    if (!confirm('Bu link grubunu silmek istediğinizden emin misiniz?')) return
    
    try {
      const supabase = createClient()
      
      // First delete all links in the group
      const { error: linksError } = await supabase
        .from('footer_links')
        .delete()
        .eq('group_id', id)

      if (linksError) throw linksError

      // Then delete the group
      const { error } = await supabase
        .from('footer_link_groups')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Link grubu silindi')
      await fetchData()
    } catch (error) {
      console.error('Link grup silme hatası:', error)
      toast.error('Link grubu silinemedi')
    }
  }

  // Footer Link handlers
  const handleSaveLink = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      if (editingLink) {
        // Update existing
        const { error } = await supabase
          .from('footer_links')
          .update({
            group_id: linkForm.group_id,
            title: linkForm.title.trim(),
            url: linkForm.url.trim(),
            order_position: linkForm.order_position,
            is_external: linkForm.is_external,
            is_active: linkForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLink.id)

        if (error) throw error
        toast.success('Link güncellendi')
      } else {
        // Create new
        const { error } = await supabase
          .from('footer_links')
          .insert({
            group_id: linkForm.group_id,
            title: linkForm.title.trim(),
            url: linkForm.url.trim(),
            order_position: linkForm.order_position,
            is_external: linkForm.is_external,
            is_active: linkForm.is_active
          })

        if (error) throw error
        toast.success('Link eklendi')
      }
      
      setLinkDialogOpen(false)
      await fetchData()
    } catch (error) {
      console.error('Link kaydetme hatası:', error)
      toast.error('Link kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Bu linki silmek istediğinizden emin misiniz?')) return
    
    try {
      const supabase = createClient()
      
      console.log('Link silme işlemi başlıyor. ID:', id)
      
      // Auth kontrolü
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Auth user:', user)
      console.log('Auth error:', authError)
      
      // Önce linki kontrol et
      const { data: linkData, error: selectError } = await supabase
        .from('footer_links')
        .select('*')
        .eq('id', id)
        .single()
        
      console.log('Silinecek link:', linkData)
      console.log('Select error:', selectError)
      
      if (selectError) {
        console.error('Link bulunamadı:', selectError)
        toast.error('Silinecek link bulunamadı')
        return
      }
      
      // Silme işlemi
      const { data, error, count } = await supabase
        .from('footer_links')
        .delete()
        .eq('id', id)
        .select()

      console.log('Delete result:', { data, error, count })
      console.log('Silinen veri sayısı:', count)

      if (error) {
        console.error('Silme hatası:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn('Hiçbir veri silinmedi, muhtemelen RLS politikası engelliyor')
        toast.error('Link silinemedi - Yetki sorunu olabilir')
        return
      }
      
      console.log('Link başarıyla silindi:', data)
      toast.success('Link silindi')
      await fetchData()
    } catch (error) {
      console.error('Link silme hatası:', error)
      toast.error(`Link silinemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Header & Footer ayarları yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Header & Footer Yönetimi</h1>
          <p className="text-muted-foreground">Site başlığı ve alt bilgi içeriklerini düzenleyin</p>
        </div>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="header" className="flex items-center gap-2">
            <Menu className="w-4 h-4" />
            Header Ayarları
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Footer Ayarları
          </TabsTrigger>
        </TabsList>

        {/* Header Ayarları */}
        <TabsContent value="header">
          {headerSettings && (
            <div className="space-y-6">
              {/* Header Genel Ayarları */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Header Genel Ayarları</CardTitle>
                  <Button onClick={handleSaveHeaderSettings} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="site_name">Site Adı</Label>
                      <Input
                        id="site_name"
                        value={headerSettings.site_name}
                        onChange={(e) => updateHeaderSetting('site_name', e.target.value)}
                        placeholder="RDHN Commerce"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="all_products_text">Tüm Ürünler Metni</Label>
                      <Input
                        id="all_products_text"
                        value={headerSettings.all_products_text}
                        onChange={(e) => updateHeaderSetting('all_products_text', e.target.value)}
                        placeholder="Tüm Ürünler"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="search_placeholder">Arama Placeholder</Label>
                    <Input
                      id="search_placeholder"
                      value={headerSettings.search_placeholder}
                      onChange={(e) => updateHeaderSetting('search_placeholder', e.target.value)}
                      placeholder="Ürün ara..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="custom_css">Özel CSS</Label>
                    <Textarea
                      id="custom_css"
                      value={headerSettings.custom_css || ''}
                      onChange={(e) => updateHeaderSetting('custom_css', e.target.value)}
                      placeholder="/* Header için özel CSS kodları */"
                      rows={4}
                    />
                  </div>

                  <Separator />

                  {/* Top Bar Ayarları */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_top_bar"
                        checked={headerSettings.show_top_bar}
                        onCheckedChange={(checked) => updateHeaderSetting('show_top_bar', checked)}
                      />
                      <Label htmlFor="show_top_bar">Üst Bar Göster</Label>
                    </div>

                    {headerSettings.show_top_bar && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div>
                          <Label htmlFor="top_bar_phone">Telefon Numarası</Label>
                          <Input
                            id="top_bar_phone"
                            value={headerSettings.top_bar_phone}
                            onChange={(e) => updateHeaderSetting('top_bar_phone', e.target.value)}
                            placeholder="+90 (212) 123 45 67"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="top_bar_email">E-posta Adresi</Label>
                          <Input
                            id="top_bar_email"
                            value={headerSettings.top_bar_email}
                            onChange={(e) => updateHeaderSetting('top_bar_email', e.target.value)}
                            placeholder="info@rdhncommerce.com"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="top_bar_free_shipping_text">Ücretsiz Kargo Metni</Label>
                          <Input
                            id="top_bar_free_shipping_text"
                            value={headerSettings.top_bar_free_shipping_text}
                            onChange={(e) => updateHeaderSetting('top_bar_free_shipping_text', e.target.value)}
                            placeholder="Türkiye geneli ücretsiz kargo"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show_quick_links"
                            checked={headerSettings.show_quick_links}
                            onCheckedChange={(checked) => updateHeaderSetting('show_quick_links', checked)}
                          />
                          <Label htmlFor="show_quick_links">Hızlı Linkler Göster</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_logo"
                        checked={headerSettings.show_logo}
                        onCheckedChange={(checked) => updateHeaderSetting('show_logo', checked)}
                      />
                      <Label htmlFor="show_logo">Logo Göster</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_search"
                        checked={headerSettings.show_search}
                        onCheckedChange={(checked) => updateHeaderSetting('show_search', checked)}
                      />
                      <Label htmlFor="show_search">Arama Göster</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_categories"
                        checked={headerSettings.show_categories}
                        onCheckedChange={(checked) => updateHeaderSetting('show_categories', checked)}
                      />
                      <Label htmlFor="show_categories">Kategoriler Göster</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_all_products_link"
                        checked={headerSettings.show_all_products_link}
                        onCheckedChange={(checked) => updateHeaderSetting('show_all_products_link', checked)}
                      />
                      <Label htmlFor="show_all_products_link">Tüm Ürünler Linki</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_wishlist"
                        checked={headerSettings.show_wishlist}
                        onCheckedChange={(checked) => updateHeaderSetting('show_wishlist', checked)}
                      />
                      <Label htmlFor="show_wishlist">Favoriler Göster</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_cart"
                        checked={headerSettings.show_cart}
                        onCheckedChange={(checked) => updateHeaderSetting('show_cart', checked)}
                      />
                      <Label htmlFor="show_cart">Sepet Göster</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_user_account"
                        checked={headerSettings.show_user_account}
                        onCheckedChange={(checked) => updateHeaderSetting('show_user_account', checked)}
                      />
                      <Label htmlFor="show_user_account">Hesap Göster</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Header Menü Öğeleri */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Header Menü Öğeleri</CardTitle>
                  <Button onClick={() => {
                    setEditingMenuItem(null)
                    setMenuItemForm({
                      title: '',
                      url: '',
                      order_position: headerMenuItems.length,
                      is_dropdown: false,
                      parent_id: null,
                      icon_name: '',
                      is_external: false,
                      is_active: true
                    })
                    setMenuItemDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Menü Öğesi Ekle
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {headerMenuItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{item.title}</h3>
                            <Badge variant="outline">Sıra: {item.order_position}</Badge>
                            {item.is_dropdown && <Badge variant="secondary">Dropdown</Badge>}
                            {item.is_external && <Badge variant="destructive">Harici</Badge>}
                            {!item.is_active && <Badge variant="outline">Pasif</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMenuItem(item)
                              setMenuItemForm({
                                title: item.title,
                                url: item.url,
                                order_position: item.order_position,
                                is_dropdown: item.is_dropdown,
                                parent_id: item.parent_id,
                                icon_name: item.icon_name || '',
                                is_external: item.is_external,
                                is_active: item.is_active
                              })
                              setMenuItemDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Header Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı Linkler (Top Bar)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {headerQuickLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{link.title}</h3>
                            <Badge variant="outline">Sıra: {link.order_position}</Badge>
                            {link.is_external && <Badge variant="destructive">Harici</Badge>}
                            {!link.is_active && <Badge variant="outline">Pasif</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{link.url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Quick link düzenleme fonksiyonu burada olacak
                              toast.info('Quick Link düzenleme özelliği yakında eklenecek')
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {headerQuickLinks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Henüz hızlı link eklenmedi</p>
                        <p className="text-sm">Kampanyalar, Çok Satanlar gibi linkler buraya gelecek</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Footer Ayarları */}
        <TabsContent value="footer">
          {footerSettings && (
            <div className="space-y-6">
              {/* Footer Genel Ayarları */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Footer Genel Ayarları</CardTitle>
                  <Button onClick={handleSaveFooterSettings} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company_name">Şirket Adı</Label>
                      <Input
                        id="company_name"
                        value={footerSettings.company_name}
                        onChange={(e) => updateFooterSetting('company_name', e.target.value)}
                        placeholder="RDHN Commerce"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="copyright_text">Telif Hakkı Metni</Label>
                      <Input
                        id="copyright_text"
                        value={footerSettings.copyright_text}
                        onChange={(e) => updateFooterSetting('copyright_text', e.target.value)}
                        placeholder="© 2025 RDHN Commerce. Tüm hakları saklıdır."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company_description">Şirket Açıklaması</Label>
                    <Textarea
                      id="company_description"
                      value={footerSettings.company_description}
                      onChange={(e) => updateFooterSetting('company_description', e.target.value)}
                      placeholder="Şirket hakkında kısa açıklama"
                      rows={3}
                    />
                  </div>

                  <Separator />

                  {/* Newsletter Ayarları */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_newsletter"
                        checked={footerSettings.show_newsletter}
                        onCheckedChange={(checked) => updateFooterSetting('show_newsletter', checked)}
                      />
                      <Label htmlFor="show_newsletter">Newsletter Bölümü Göster</Label>
                    </div>

                    {footerSettings.show_newsletter && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div>
                          <Label htmlFor="newsletter_title">Newsletter Başlığı</Label>
                          <Input
                            id="newsletter_title"
                            value={footerSettings.newsletter_title}
                            onChange={(e) => updateFooterSetting('newsletter_title', e.target.value)}
                            placeholder="Bültenimize Abone Olun"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newsletter_description">Newsletter Açıklaması</Label>
                          <Input
                            id="newsletter_description"
                            value={footerSettings.newsletter_description}
                            onChange={(e) => updateFooterSetting('newsletter_description', e.target.value)}
                            placeholder="En yeni ürünler ve kampanyalardan ilk siz haberdar olun."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* İletişim Bilgileri */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">İletişim Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="contact_phone">Telefon</Label>
                        <Input
                          id="contact_phone"
                          value={footerSettings.contact_phone || ''}
                          onChange={(e) => updateFooterSetting('contact_phone', e.target.value)}
                          placeholder="+90 (212) 123 45 67"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">E-posta</Label>
                        <Input
                          id="contact_email"
                          value={footerSettings.contact_email || ''}
                          onChange={(e) => updateFooterSetting('contact_email', e.target.value)}
                          placeholder="info@rdhncommerce.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_address">Adres</Label>
                        <Input
                          id="contact_address"
                          value={footerSettings.contact_address || ''}
                          onChange={(e) => updateFooterSetting('contact_address', e.target.value)}
                          placeholder="İstanbul, Türkiye"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Sosyal Medya */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_social_media"
                        checked={footerSettings.show_social_media}
                        onCheckedChange={(checked) => updateFooterSetting('show_social_media', checked)}
                      />
                      <Label htmlFor="show_social_media">Sosyal Medya Göster</Label>
                    </div>

                    {footerSettings.show_social_media && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                        <div>
                          <Label htmlFor="facebook_url">Facebook URL</Label>
                          <Input
                            id="facebook_url"
                            value={footerSettings.facebook_url || ''}
                            onChange={(e) => updateFooterSetting('facebook_url', e.target.value)}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="twitter_url">Twitter URL</Label>
                          <Input
                            id="twitter_url"
                            value={footerSettings.twitter_url || ''}
                            onChange={(e) => updateFooterSetting('twitter_url', e.target.value)}
                            placeholder="https://twitter.com/..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="instagram_url">Instagram URL</Label>
                          <Input
                            id="instagram_url"
                            value={footerSettings.instagram_url || ''}
                            onChange={(e) => updateFooterSetting('instagram_url', e.target.value)}
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="youtube_url">YouTube URL</Label>
                          <Input
                            id="youtube_url"
                            value={footerSettings.youtube_url || ''}
                            onChange={(e) => updateFooterSetting('youtube_url', e.target.value)}
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                          <Input
                            id="linkedin_url"
                            value={footerSettings.linkedin_url || ''}
                            onChange={(e) => updateFooterSetting('linkedin_url', e.target.value)}
                            placeholder="https://linkedin.com/..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="footer_custom_css">Özel CSS</Label>
                    <Textarea
                      id="footer_custom_css"
                      value={footerSettings.custom_css || ''}
                      onChange={(e) => updateFooterSetting('custom_css', e.target.value)}
                      placeholder="/* Footer için özel CSS kodları */"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Footer Link Grupları */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Footer Link Grupları</CardTitle>
                  <Button onClick={() => {
                    setEditingLinkGroup(null)
                    setLinkGroupForm({
                      title: '',
                      order_position: footerLinkGroups.length,
                      is_active: true
                    })
                    setLinkGroupDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Grup Ekle
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {footerLinkGroups.map((group) => {
                      const groupLinks = footerLinks.filter(link => link.group_id === group.id)
                      return (
                        <div key={group.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{group.title}</h3>
                              <Badge variant="outline">Sıra: {group.order_position}</Badge>
                              {!group.is_active && <Badge variant="outline">Pasif</Badge>}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Grubu düzenle"
                                onClick={() => {
                                  setEditingLinkGroup(group)
                                  setLinkGroupForm({
                                    title: group.title,
                                    order_position: group.order_position,
                                    is_active: group.is_active
                                  })
                                  setLinkGroupDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Link ekle"
                                onClick={() => {
                                  setEditingLink(null)
                                  setLinkForm({
                                    group_id: group.id,
                                    title: '',
                                    url: '',
                                    order_position: groupLinks.length,
                                    is_external: false,
                                    is_active: true
                                  })
                                  setLinkDialogOpen(true)
                                }}
                              >
                                <Link className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                title="Grubu sil"
                                onClick={() => handleDeleteLinkGroup(group.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {groupLinks.map((link) => (
                              <div key={link.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <span className="font-medium">{link.title}</span>
                                  <span className="text-muted-foreground ml-2">{link.url}</span>
                                  {!link.is_active && <Badge variant="outline" className="ml-2 text-xs">Pasif</Badge>}
                                </div>
                                <div className="flex gap-2 items-center">
                                  <Badge variant="outline" className="text-xs">
                                    {link.order_position}
                                  </Badge>
                                  {link.is_external && (
                                    <Badge variant="secondary" className="text-xs">Harici</Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingLink(link)
                                      setLinkForm({
                                        group_id: link.group_id,
                                        title: link.title,
                                        url: link.url,
                                        order_position: link.order_position,
                                        is_external: link.is_external,
                                        is_active: link.is_active
                                      })
                                      setLinkDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLink(link.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {groupLinks.length === 0 && (
                              <div className="text-sm text-muted-foreground p-2 text-center">
                                Bu grupta henüz link yok
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {footerLinkGroups.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Henüz link grubu eklenmedi</p>
                        <p className="text-sm">Kurumsal, Müşteri Hizmetleri gibi gruplar ekleyebilirsiniz</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Link Group Dialog */}
      <Dialog open={linkGroupDialogOpen} onOpenChange={setLinkGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLinkGroup ? 'Link Grubunu Düzenle' : 'Yeni Link Grubu'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group_title">Grup Başlığı</Label>
              <Input
                id="group_title"
                value={linkGroupForm.title}
                onChange={(e) => setLinkGroupForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Kurumsal, Müşteri Hizmetleri vb."
              />
            </div>
            
            <div>
              <Label htmlFor="group_order">Sıra</Label>
              <Input
                id="group_order"
                type="number"
                value={linkGroupForm.order_position}
                onChange={(e) => setLinkGroupForm(prev => ({ ...prev, order_position: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="group_active"
                checked={linkGroupForm.is_active}
                onCheckedChange={(checked) => setLinkGroupForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="group_active">Aktif</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLinkGroupDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveLinkGroup} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? 'Linki Düzenle' : 'Yeni Link'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link_group">Link Grubu</Label>
              <Select 
                value={linkForm.group_id} 
                onValueChange={(value) => setLinkForm(prev => ({ ...prev, group_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin" />
                </SelectTrigger>
                <SelectContent>
                  {footerLinkGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="link_title">Link Başlığı</Label>
              <Input
                id="link_title"
                value={linkForm.title}
                onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Hakkımızda, İletişim vb."
              />
            </div>
            
            <div>
              <Label htmlFor="link_url">URL</Label>
              <Input
                id="link_url"
                value={linkForm.url}
                onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="/hakkimizda, https://example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="link_order">Sıra</Label>
              <Input
                id="link_order"
                type="number"
                value={linkForm.order_position}
                onChange={(e) => setLinkForm(prev => ({ ...prev, order_position: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="link_external"
                checked={linkForm.is_external}
                onCheckedChange={(checked) => setLinkForm(prev => ({ ...prev, is_external: checked }))}
              />
              <Label htmlFor="link_external">Harici Link (Yeni sekmede açılır)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="link_active"
                checked={linkForm.is_active}
                onCheckedChange={(checked) => setLinkForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="link_active">Aktif</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveLink} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 