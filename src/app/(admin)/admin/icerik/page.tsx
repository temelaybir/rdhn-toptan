'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, MessageSquare, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SafeImage } from '@/components/ui/safe-image'
import { toast } from 'sonner'
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getSitePages,
  createSitePage,
  updateSitePage,
  deleteSitePage,
  type Banner,
  type Announcement,
  type SitePage
} from '@/services/admin/content-service-client'

export default function ContentManagementPage() {
  // State
  const [banners, setBanners] = useState<Banner[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [pages, setPages] = useState<SitePage[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)
  const [pageDialogOpen, setPageDialogOpen] = useState(false)
  
  // Editing states
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [editingPage, setEditingPage] = useState<SitePage | null>(null)

  // Form states
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '',
    color_theme: '',
    size: 'medium' as 'small' | 'medium' | 'large',
    order_position: 0,
    is_active: true,
    is_raw_image: false,
    start_date: '',
    end_date: ''
  })

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    start_date: '',
    end_date: '',
    is_active: true,
    position: 'site_wide' as 'site_wide' | 'homepage' | 'category' | 'product',
    order_position: 0
  })

  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    show_in_footer: false,
    show_in_header: false,
    order_position: 0
  })

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('İçerik verileri yükleniyor...')
      
      const [bannersData, announcementsData, pagesData] = await Promise.all([
        getBanners(),
        getAnnouncements(),
        getSitePages()
      ])
      
      console.log('Banners data:', bannersData)
      console.log('Announcements data:', announcementsData)
      console.log('Pages data:', pagesData)
      
      setBanners(bannersData)
      setAnnouncements(announcementsData)
      setPages(pagesData)
    } catch (error) {
      console.error('İçerik verisi yükleme hatası:', error)
      toast.error(`Veriler yüklenemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setLoading(false)
    }
  }

  // Form reset functions
  const resetBannerForm = () => {
    setBannerForm({
      title: '',
      subtitle: '',
      image_url: '',
      mobile_image_url: '',
      link_url: '',
      color_theme: '',
      size: 'medium',
      order_position: banners.length,
      is_active: true,
      is_raw_image: false,
      start_date: '',
      end_date: ''
    })
    setEditingBanner(null)
  }

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      content: '',
      type: 'info',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
      position: 'site_wide',
      order_position: announcements.length
    })
    setEditingAnnouncement(null)
  }

  const resetPageForm = () => {
    setPageForm({
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      status: 'draft',
      show_in_footer: false,
      show_in_header: false,
      order_position: pages.length
    })
    setEditingPage(null)
  }

  // Dialog open functions
  const openBannerDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image_url: banner.image_url,
        mobile_image_url: banner.mobile_image_url || '',
        link_url: banner.link_url,
        color_theme: banner.color_theme || '',
        size: banner.size,
        order_position: banner.order_position,
        is_active: banner.is_active,
        is_raw_image: banner.is_raw_image,
        start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
        end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
      })
    } else {
      resetBannerForm()
    }
    setBannerDialogOpen(true)
  }

  const openAnnouncementDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setAnnouncementForm({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
        end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '',
        is_active: announcement.is_active,
        position: announcement.position,
        order_position: announcement.order_position
      })
    } else {
      resetAnnouncementForm()
    }
    setAnnouncementDialogOpen(true)
  }

  const openPageDialog = (page?: SitePage) => {
    if (page) {
      setEditingPage(page)
      setPageForm({
        title: page.title,
        slug: page.slug,
        content: page.content || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        meta_keywords: page.meta_keywords || '',
        status: page.status,
        show_in_footer: page.show_in_footer,
        show_in_header: page.show_in_header,
        order_position: page.order_position
      })
    } else {
      resetPageForm()
    }
    setPageDialogOpen(true)
  }

  // Save functions
  const handleSaveBanner = async () => {
    try {
      if (!bannerForm.title.trim() || !bannerForm.image_url.trim() || !bannerForm.link_url.trim()) {
        toast.error('Başlık, görsel ve link URL zorunludur')
        return
      }

      const bannerData = {
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim() || null,
        image_url: bannerForm.image_url.trim(),
        mobile_image_url: bannerForm.mobile_image_url.trim() || null,
        link_url: bannerForm.link_url.trim(),
        color_theme: bannerForm.color_theme.trim() || null,
        size: bannerForm.size,
        order_position: bannerForm.order_position,
        is_active: bannerForm.is_active,
        is_raw_image: bannerForm.is_raw_image,
        start_date: bannerForm.start_date || null,
        end_date: bannerForm.end_date || null
      }

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData)
        toast.success('Banner güncellendi')
      } else {
        await createBanner(bannerData)
        toast.success('Banner eklendi')
      }

      setBannerDialogOpen(false)
      resetBannerForm()
      fetchData()
    } catch (error) {
      console.error('Banner kaydetme hatası:', error)
      toast.error('Banner kaydedilemedi')
    }
  }

  const handleSaveAnnouncement = async () => {
    try {
      if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
        toast.error('Başlık ve içerik zorunludur')
        return
      }

      const announcementData = {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        type: announcementForm.type,
        start_date: announcementForm.start_date || new Date().toISOString(),
        end_date: announcementForm.end_date || null,
        is_active: announcementForm.is_active,
        position: announcementForm.position,
        order_position: announcementForm.order_position
      }

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, announcementData)
        toast.success('Duyuru güncellendi')
      } else {
        await createAnnouncement(announcementData)
        toast.success('Duyuru eklendi')
      }

      setAnnouncementDialogOpen(false)
      resetAnnouncementForm()
      fetchData()
    } catch (error) {
      console.error('Duyuru kaydetme hatası:', error)
      toast.error('Duyuru kaydedilemedi')
    }
  }

  const handleSavePage = async () => {
    try {
      if (!pageForm.title.trim() || !pageForm.slug.trim()) {
        toast.error('Başlık ve slug zorunludur')
        return
      }

      const pageData = {
        title: pageForm.title.trim(),
        slug: pageForm.slug.trim(),
        content: pageForm.content.trim() || null,
        meta_title: pageForm.meta_title.trim() || null,
        meta_description: pageForm.meta_description.trim() || null,
        meta_keywords: pageForm.meta_keywords.trim() || null,
        status: pageForm.status,
        show_in_footer: pageForm.show_in_footer,
        show_in_header: pageForm.show_in_header,
        order_position: pageForm.order_position
      }

      if (editingPage) {
        await updateSitePage(editingPage.id, pageData)
        toast.success('Sayfa güncellendi')
      } else {
        await createSitePage(pageData)
        toast.success('Sayfa eklendi')
      }

      setPageDialogOpen(false)
      resetPageForm()
      fetchData()
    } catch (error) {
      console.error('Sayfa kaydetme hatası:', error)
      toast.error('Sayfa kaydedilemedi')
    }
  }

  // Delete functions
  const handleDeleteBanner = async (banner: Banner) => {
    if (!confirm(`"${banner.title}" adlı banner'ı silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await deleteBanner(banner.id)
      toast.success('Banner silindi')
      fetchData()
    } catch (error) {
      console.error('Banner silme hatası:', error)
      toast.error('Banner silinemedi')
    }
  }

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!confirm(`"${announcement.title}" adlı duyuru'yu silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await deleteAnnouncement(announcement.id)
      toast.success('Duyuru silindi')
      fetchData()
    } catch (error) {
      console.error('Duyuru silme hatası:', error)
      toast.error('Duyuru silinemedi')
    }
  }

  const handleDeletePage = async (page: SitePage) => {
    if (!confirm(`"${page.title}" adlı sayfa'yı silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      await deleteSitePage(page.id)
      toast.success('Sayfa silindi')
      fetchData()
    } catch (error) {
      console.error('Sayfa silme hatası:', error)
      toast.error('Sayfa silinemedi')
    }
  }

  // Toggle active functions
  const toggleBannerActive = async (banner: Banner) => {
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active })
      toast.success(`Banner ${!banner.is_active ? 'aktif' : 'pasif'} edildi`)
      fetchData()
    } catch (error) {
      console.error('Banner toggle hatası:', error)
      toast.error('Durum değiştirilemedi')
    }
  }

  const toggleAnnouncementActive = async (announcement: Announcement) => {
    try {
      await updateAnnouncement(announcement.id, { is_active: !announcement.is_active })
      toast.success(`Duyuru ${!announcement.is_active ? 'aktif' : 'pasif'} edildi`)
      fetchData()
    } catch (error) {
      console.error('Duyuru toggle hatası:', error)
      toast.error('Durum değiştirilemedi')
    }
  }

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Pasif</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Taslak</Badge>
      case 'archived':
        return <Badge className="bg-red-100 text-red-800">Arşiv</Badge>
      default:
        return <Badge>Bilinmiyor</Badge>
    }
  }

  const getAnnouncementTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Bilgi</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Uyarı</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Başarı</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Hata</Badge>
      default:
        return <Badge>Diğer</Badge>
    }
  }

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
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
            <p>İçerik verisi yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">İçerik Yönetimi</h1>
        <p className="text-muted-foreground">
          Banner, duyuru ve sayfa içeriklerini yönetin
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Banner</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.filter(b => b.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam {banners.length} banner
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Duyuru</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter(a => a.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Site genelinde görünür
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sayfa</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
            <p className="text-xs text-muted-foreground">
              {pages.filter(p => p.status === 'published').length} yayında
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tıklama</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {banners.reduce((sum, b) => sum + (b.click_count || 0), 0).toLocaleString('tr-TR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Banner tıklamaları
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners">Bannerlar</TabsTrigger>
          <TabsTrigger value="announcements">Duyurular</TabsTrigger>
          <TabsTrigger value="pages">Sayfalar</TabsTrigger>
        </TabsList>

        {/* Bannerlar */}
        <TabsContent value="banners" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Banner Yönetimi</CardTitle>
              <Button onClick={() => openBannerDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Banner
              </Button>
            </CardHeader>
            <CardContent>
              {banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz banner eklenmedi</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Ana sayfada gösterilecek kampanya bannerlarını ekleyin
                  </p>
                  <Button onClick={() => openBannerDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Banner'ı Ekle
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {banners.map((banner) => (
                    <Card key={banner.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Banner Önizleme */}
                          <div className="flex-shrink-0">
                            <div className={`w-32 h-20 rounded-lg overflow-hidden border ${
                              banner.color_theme ? `bg-gradient-to-r ${banner.color_theme}` : 'bg-gray-100'
                            }`}>
                              <SafeImage 
                                src={banner.image_url} 
                                alt={banner.title}
                                width={128}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          
                          {/* Banner Bilgileri */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{banner.title}</h3>
                                {banner.subtitle && (
                                  <p className="text-muted-foreground text-sm">{banner.subtitle}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {banner.link_url}
                                  </code>
                                </div>
                              </div>
                              
                              {/* Durum Badge */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={banner.is_active}
                                  onCheckedChange={() => toggleBannerActive(banner)}
                                />
                                {banner.is_active ? (
                                  <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Pasif</Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Banner Özellikleri */}
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="outline">
                                Boyut: {banner.size === 'small' ? 'Küçük' : banner.size === 'medium' ? 'Orta' : 'Büyük'}
                              </Badge>
                              <Badge variant="outline">Sıra: {banner.order_position}</Badge>
                              <Badge variant="outline">Tıklama: {banner.click_count?.toLocaleString('tr-TR') || 0}</Badge>
                              {banner.is_raw_image && (
                                <Badge variant="destructive">Ham Görsel</Badge>
                              )}
                              {banner.color_theme && (
                                <Badge variant="secondary">Tema Rengi</Badge>
                              )}
                            </div>
                            
                            {/* Tarih Bilgileri */}
                            <div className="text-xs text-muted-foreground mt-2">
                              {banner.start_date && (
                                <span>Başlangıç: {new Date(banner.start_date).toLocaleDateString('tr-TR')} </span>
                              )}
                              {banner.end_date && (
                                <span>Bitiş: {new Date(banner.end_date).toLocaleDateString('tr-TR')} </span>
                              )}
                              <span>Güncelleme: {new Date(banner.updated_at).toLocaleString('tr-TR')}</span>
                            </div>
                          </div>
                          
                          {/* Aksiyon Butonları */}
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBannerDialog(banner)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(banner.link_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBanner(banner)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duyurular */}
        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Duyuru Yönetimi</CardTitle>
              <Button onClick={() => openAnnouncementDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Duyuru
              </Button>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz duyuru eklenmedi</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Site geneli, ana sayfa veya özel sayfalarda gösterilecek duyuruları ekleyin
                  </p>
                  <Button onClick={() => openAnnouncementDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Duyuru'yu Ekle
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{announcement.title}</h3>
                                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                                  {announcement.content}
                                </p>
                              </div>
                              
                              {/* Durum Toggle */}
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={announcement.is_active}
                                  onCheckedChange={() => toggleAnnouncementActive(announcement)}
                                />
                                {announcement.is_active ? (
                                  <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Pasif</Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Duyuru Özellikleri */}
                            <div className="flex items-center gap-2 mb-3">
                              {getAnnouncementTypeBadge(announcement.type)}
                              <Badge variant="outline">
                                Pozisyon: {announcement.position === 'site_wide' ? 'Site Geneli' : 
                                         announcement.position === 'homepage' ? 'Ana Sayfa' : 
                                         announcement.position === 'category' ? 'Kategori' : 'Ürün Sayfası'}
                              </Badge>
                              <Badge variant="outline">Sıra: {announcement.order_position}</Badge>
                            </div>
                            
                            {/* Tarih Bilgileri */}
                            <div className="text-xs text-muted-foreground">
                              <span>Başlangıç: {new Date(announcement.start_date).toLocaleDateString('tr-TR')} </span>
                              {announcement.end_date && (
                                <span>Bitiş: {new Date(announcement.end_date).toLocaleDateString('tr-TR')} </span>
                              )}
                              <span>Güncelleme: {new Date(announcement.updated_at).toLocaleString('tr-TR')}</span>
                            </div>
                          </div>
                          
                          {/* Aksiyon Butonları */}
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAnnouncementDialog(announcement)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sayfalar */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sayfa Yönetimi</CardTitle>
              <Button onClick={() => openPageDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Sayfa
              </Button>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz sayfa eklenmedi</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Hakkımızda, İletişim gibi site sayfalarını ekleyin
                  </p>
                  <Button onClick={() => openPageDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Sayfa'yı Ekle
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pages.map((page) => (
                    <Card key={page.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{page.title}</h3>
                            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                              /{page.slug}
                            </code>
                            
                            {page.content && (
                              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                                {page.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-3">
                              {getStatusBadge(page.status)}
                              <Badge variant="outline">Sıra: {page.order_position}</Badge>
                              <Badge variant="outline">Görüntülenme: {page.view_count}</Badge>
                              {page.show_in_footer && (
                                <Badge variant="secondary">Footer'da</Badge>
                              )}
                              {page.show_in_header && (
                                <Badge variant="secondary">Header'da</Badge>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground mt-2">
                              Son güncelleme: {new Date(page.updated_at).toLocaleString('tr-TR')}
                            </div>
                            
                            {(page.meta_title || page.meta_description) && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {page.meta_title && `Meta Başlık: ${page.meta_title}`}
                                {page.meta_title && page.meta_description && ' | '}
                                {page.meta_description && `Meta Açıklama: ${page.meta_description.substring(0, 50)}...`}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPageDialog(page)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/${page.slug}`, '_blank')}
                              disabled={page.status !== 'published'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePage(page)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Banneri Düzenle' : 'Yeni Banner Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-title" className="text-right">
                Başlık
              </Label>
              <Input
                id="banner-title"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-subtitle" className="text-right">
                Alt Başlık
              </Label>
              <Input
                id="banner-subtitle"
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-image" className="text-right">
                Görsel URL (Desktop)
              </Label>
              <Input
                id="banner-image"
                value={bannerForm.image_url}
                onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                className="col-span-3"
                placeholder="/images/banners/desktop-banner.jpg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-mobile-image" className="text-right">
                Mobil Görsel URL
              </Label>
              <Input
                id="banner-mobile-image"
                value={bannerForm.mobile_image_url}
                onChange={(e) => setBannerForm({ ...bannerForm, mobile_image_url: e.target.value })}
                className="col-span-3"
                placeholder="/images/banners/mobile-banner.jpg"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-link" className="text-right">
                Link URL
              </Label>
              <Input
                id="banner-link"
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-color" className="text-right">
                Renk Teması
              </Label>
              <Input
                id="banner-color"
                value={bannerForm.color_theme}
                onChange={(e) => setBannerForm({ ...bannerForm, color_theme: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-size" className="text-right">
                Boyut
              </Label>
              <Select value={bannerForm.size} onValueChange={(value) => setBannerForm({ ...bannerForm, size: value as 'small' | 'medium' | 'large' })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Boyut seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Küçük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="large">Büyük</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-order" className="text-right">
                Sıralama
              </Label>
              <Input
                id="banner-order"
                type="number"
                value={bannerForm.order_position}
                onChange={(e) => setBannerForm({ ...bannerForm, order_position: parseInt(e.target.value, 10) })}
                className="col-span-3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="banner-active"
                checked={bannerForm.is_active}
                onCheckedChange={(checked) => setBannerForm({ ...bannerForm, is_active: checked })}
              />
              <Label htmlFor="banner-active">Aktif</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="banner-raw-image"
                checked={bannerForm.is_raw_image}
                onCheckedChange={(checked) => setBannerForm({ ...bannerForm, is_raw_image: checked })}
              />
              <Label htmlFor="banner-raw-image">Ham Görsel</Label>
              <span className="text-xs text-muted-foreground ml-2">
                (Açıksa sadece görsel gösterilir, başlık/alt başlık olmaz)
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-start-date" className="text-right">
                Başlangıç Tarihi
              </Label>
              <Input
                id="banner-start-date"
                type="date"
                value={bannerForm.start_date}
                onChange={(e) => setBannerForm({ ...bannerForm, start_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banner-end-date" className="text-right">
                Bitiş Tarihi
              </Label>
              <Input
                id="banner-end-date"
                type="date"
                value={bannerForm.end_date}
                onChange={(e) => setBannerForm({ ...bannerForm, end_date: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleSaveBanner}>
            {editingBanner ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-title" className="text-right">
                Başlık
              </Label>
              <Input
                id="announcement-title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-content" className="text-right">
                İçerik
              </Label>
              <Textarea
                id="announcement-content"
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-type" className="text-right">
                Tip
              </Label>
              <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value as 'info' | 'warning' | 'success' | 'error' })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Tip seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Bilgi</SelectItem>
                  <SelectItem value="warning">Uyarı</SelectItem>
                  <SelectItem value="success">Başarı</SelectItem>
                  <SelectItem value="error">Hata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-position" className="text-right">
                Pozisyon
              </Label>
              <Select value={announcementForm.position} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, position: value as 'site_wide' | 'homepage' | 'category' | 'product' })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pozisyon seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site_wide">Site Geneli</SelectItem>
                  <SelectItem value="homepage">Ana Sayfa</SelectItem>
                  <SelectItem value="category">Kategori Sayfası</SelectItem>
                  <SelectItem value="product">Ürün Sayfası</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-order" className="text-right">
                Sıralama
              </Label>
              <Input
                id="announcement-order"
                type="number"
                value={announcementForm.order_position}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, order_position: parseInt(e.target.value, 10) })}
                className="col-span-3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="announcement-active"
                checked={announcementForm.is_active}
                onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, is_active: checked })}
              />
              <Label htmlFor="announcement-active">Aktif</Label>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-start-date" className="text-right">
                Başlangıç Tarihi
              </Label>
              <Input
                id="announcement-start-date"
                type="date"
                value={announcementForm.start_date}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, start_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="announcement-end-date" className="text-right">
                Bitiş Tarihi
              </Label>
              <Input
                id="announcement-end-date"
                type="date"
                value={announcementForm.end_date}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, end_date: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleSaveAnnouncement}>
            {editingAnnouncement ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Sayfayı Düzenle' : 'Yeni Sayfa Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-title" className="text-right">
                Başlık
              </Label>
              <Input
                id="page-title"
                value={pageForm.title}
                onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-slug" className="text-right">
                URL
              </Label>
              <Input
                id="page-slug"
                value={pageForm.slug}
                onChange={(e) => setPageForm({ ...pageForm, slug: generateSlug(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-content" className="text-right">
                İçerik
              </Label>
              <Textarea
                id="page-content"
                value={pageForm.content}
                onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-meta-title" className="text-right">
                Meta Başlık
              </Label>
              <Input
                id="page-meta-title"
                value={pageForm.meta_title}
                onChange={(e) => setPageForm({ ...pageForm, meta_title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-meta-description" className="text-right">
                Meta Açıklama
              </Label>
              <Input
                id="page-meta-description"
                value={pageForm.meta_description}
                onChange={(e) => setPageForm({ ...pageForm, meta_description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-meta-keywords" className="text-right">
                Meta Anahtar Kelimeler
              </Label>
              <Input
                id="page-meta-keywords"
                value={pageForm.meta_keywords}
                onChange={(e) => setPageForm({ ...pageForm, meta_keywords: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-status" className="text-right">
                Durum
              </Label>
              <Select value={pageForm.status} onValueChange={(value) => setPageForm({ ...pageForm, status: value as 'draft' | 'published' | 'archived' })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="published">Yayında</SelectItem>
                  <SelectItem value="archived">Arşiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-show-in-footer" className="text-right">
                Alt Bilgiye Ekle
              </Label>
              <Switch
                id="page-show-in-footer"
                checked={pageForm.show_in_footer}
                onCheckedChange={(checked) => setPageForm({ ...pageForm, show_in_footer: checked })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-show-in-header" className="text-right">
                Üst Bilgiye Ekle
              </Label>
              <Switch
                id="page-show-in-header"
                checked={pageForm.show_in_header}
                onCheckedChange={(checked) => setPageForm({ ...pageForm, show_in_header: checked })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="page-order" className="text-right">
                Sıralama
              </Label>
              <Input
                id="page-order"
                type="number"
                value={pageForm.order_position}
                onChange={(e) => setPageForm({ ...pageForm, order_position: parseInt(e.target.value, 10) })}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleSavePage}>
            {editingPage ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
} 