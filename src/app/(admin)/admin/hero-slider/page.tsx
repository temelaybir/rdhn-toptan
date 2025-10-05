'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { SafeImage } from '@/components/ui/safe-image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  link_url: string | null
  button_text: string
  badge_text: string | null
  order_position: number
  is_active: boolean
  is_raw_image: boolean
  created_at: string
  updated_at: string
}

export default function HeroSliderAdminPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '',
    button_text: 'Alışverişe Başla',
    badge_text: '',
    order_position: 0,
    is_active: true,
    is_raw_image: false
  })

  // Slide'ları getir
  const fetchSlides = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('order_position')

      if (error) {
        console.error('Supabase veri çekme hatası:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error(`Veri çekme hatası: ${error.message}`)
        return
      }

      setSlides(data || [])
    } catch (error) {
      console.error('Fetch slides işlemi hatası:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : 'Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  // Form temizle
  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      mobile_image_url: '',
      link_url: '',
      button_text: 'Alışverişe Başla',
      badge_text: '',
      order_position: slides.length,
      is_active: true,
      is_raw_image: false
    })
    setEditingSlide(null)
  }

  // Dialog aç
  const openDialog = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide)
      setFormData({
        title: slide.title,
        subtitle: slide.subtitle || '',
        image_url: slide.image_url,
        mobile_image_url: slide.mobile_image_url || '',
        link_url: slide.link_url || '',
        button_text: slide.button_text,
        badge_text: slide.badge_text || '',
        order_position: slide.order_position,
        is_active: slide.is_active,
        is_raw_image: slide.is_raw_image
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  // Kaydet
  const handleSave = async () => {
    try {
      if (!formData.title.trim() || !formData.image_url.trim()) {
        toast.error('Başlık ve görsel zorunludur')
        return
      }

      const supabase = createClient()
      
      if (editingSlide) {
        // Güncelle
        const { error } = await supabase
          .from('hero_slides')
          .update({
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim() || null,
            image_url: formData.image_url.trim(),
            mobile_image_url: formData.mobile_image_url.trim() || null,
            link_url: formData.link_url.trim() || null,
            button_text: formData.button_text.trim(),
            badge_text: formData.badge_text.trim() || null,
            order_position: formData.order_position,
            is_active: formData.is_active,
            is_raw_image: formData.is_raw_image
          })
          .eq('id', editingSlide.id)

        if (error) {
          console.error('Supabase güncelleme hatası:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(`Güncelleme hatası: ${error.message}`)
        }
        toast.success('Hero slide güncellendi')
      } else {
        // Yeni ekle
        const { error } = await supabase
          .from('hero_slides')
          .insert({
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim() || null,
            image_url: formData.image_url.trim(),
            mobile_image_url: formData.mobile_image_url.trim() || null,
            link_url: formData.link_url.trim() || null,
            button_text: formData.button_text.trim(),
            badge_text: formData.badge_text.trim() || null,
            order_position: formData.order_position,
            is_active: formData.is_active,
            is_raw_image: formData.is_raw_image
          })

        if (error) {
          console.error('Supabase ekleme hatası:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw new Error(`Ekleme hatası: ${error.message}`)
        }
        toast.success('Hero slide eklendi')
      }

      setIsDialogOpen(false)
      resetForm()
      fetchSlides()
    } catch (error) {
      console.error('Kaydetme işlemi hatası:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : 'Kaydetme sırasında hata oluştu')
    }
  }

  // Sil
  const handleDelete = async (slide: HeroSlide) => {
    if (!confirm(`"${slide.title}" adlı slide'ı silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slide.id)

      if (error) {
        console.error('Supabase silme hatası:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Silme hatası: ${error.message}`)
      }
      
      toast.success('Hero slide silindi')
      fetchSlides()
    } catch (error) {
      console.error('Silme işlemi hatası:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : 'Silme sırasında hata oluştu')
    }
  }

  // Aktif/pasif durumu değiştir
  const toggleActive = async (slide: HeroSlide) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !slide.is_active })
        .eq('id', slide.id)

      if (error) {
        console.error('Supabase toggle hatası:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Durum değiştirme hatası: ${error.message}`)
      }
      
      toast.success(`Slide ${!slide.is_active ? 'aktif' : 'pasif'} edildi`)
      fetchSlides()
    } catch (error) {
      console.error('Toggle işlemi hatası:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error(error instanceof Error ? error.message : 'Durum değiştirme sırasında hata oluştu')
    }
  }

  useEffect(() => {
    fetchSlides()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Hero slides yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hero Slider Yönetimi</h1>
          <p className="text-muted-foreground">Ana sayfa hero carousel slide'larını yönetin</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Slide Ekle
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Hero Slide Düzenle' : 'Yeni Hero Slide'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Slide başlığı"
                />
              </div>
              
              <div>
                <Label htmlFor="subtitle">Alt Başlık</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Slide alt başlığı"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Görsel URL *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="/images/hero/hero-01.jpg"
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <SafeImage
                      src={formData.image_url}
                      alt="Önizleme"
                      width={300}
                      height={120}
                      className="rounded-md object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="mobile_image_url">Mobil Görsel URL</Label>
                <Input
                  id="mobile_image_url"
                  value={formData.mobile_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile_image_url: e.target.value }))}
                  placeholder="/images/hero/hero-01-mobile.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="/kategoriler/atesleyici-cakmak"
                />
              </div>
              
              <div>
                <Label htmlFor="button_text">Buton Metni</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Alışverişe Başla"
                />
              </div>
              
              <div>
                <Label htmlFor="badge_text">Badge Metni</Label>
                <Input
                  id="badge_text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="%20'YE VARAN İNDİRİMLER"
                />
              </div>
              
              <div>
                <Label htmlFor="order_position">Sıra</Label>
                <Input
                  id="order_position"
                  type="number"
                  value={formData.order_position}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_position: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_raw_image"
                  checked={formData.is_raw_image}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_raw_image: checked }))}
                />
                <Label htmlFor="is_raw_image">Ham Görsel</Label>
                <span className="text-xs text-muted-foreground ml-2">
                  (Açıksa sadece görsel gösterilir, başlık/buton olmaz)
                </span>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingSlide ? 'Güncelle' : 'Kaydet'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {slides.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz slide eklenmedi</h3>
            <p className="text-muted-foreground text-center mb-4">
              Ana sayfa hero slider'ı için ilk slide'ınızı ekleyin
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Slide'ı Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((slide) => (
            <Card key={slide.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <SafeImage
                      src={slide.image_url}
                      alt={slide.title}
                      width={200}
                      height={80}
                      className="rounded-md object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{slide.title}</h3>
                        {slide.subtitle && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {slide.subtitle}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={slide.is_active ? 'default' : 'secondary'}>
                            {slide.is_active ? 'Aktif' : 'Pasif'}
                          </Badge>
                          <Badge variant="outline">Sıra: {slide.order_position}</Badge>
                          {slide.is_raw_image && (
                            <Badge variant="destructive">Ham Görsel</Badge>
                          )}
                          {slide.badge_text && (
                            <Badge variant="secondary">{slide.badge_text}</Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          Buton: {slide.button_text} | Link: {slide.link_url || 'Yok'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slide.is_active}
                          onCheckedChange={() => toggleActive(slide)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(slide)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(slide)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 