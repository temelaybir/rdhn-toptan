'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Edit, Plus, Eye, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface InternalPage {
  id: string
  slug: string
  title: string
  content: string
  meta_description: string
  meta_keywords: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PageForm {
  slug: string
  title: string
  content: string
  meta_description: string
  meta_keywords: string
  is_active: boolean
}

export default function InternalPagesManagement() {
  const [pages, setPages] = useState<InternalPage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<InternalPage | null>(null)
  const [pageForm, setPageForm] = useState<PageForm>({
    slug: '',
    title: '',
    content: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true
  })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('internal_pages')
        .select('*')
        .order('title')

      if (error) throw error
      setPages(data || [])
    } catch (error) {
      console.error('Sayfa verilerini getirme hatası:', error)
      toast.error('Sayfa verileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPageForm({
      slug: '',
      title: '',
      content: '',
      meta_description: '',
      meta_keywords: '',
      is_active: true
    })
    setEditingPage(null)
  }

  const openDialog = (page?: InternalPage) => {
    if (page) {
      setEditingPage(page)
      setPageForm({
        slug: page.slug,
        title: page.title,
        content: page.content,
        meta_description: page.meta_description || '',
        meta_keywords: page.meta_keywords || '',
        is_active: page.is_active
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleSavePage = async () => {
    if (!pageForm.slug.trim() || !pageForm.title.trim() || !pageForm.content.trim()) {
      toast.error('Lütfen tüm zorunlu alanları doldurun')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      if (editingPage) {
        // Mevcut sayfayı güncelle
        const { error } = await supabase
          .from('internal_pages')
          .update({
            slug: pageForm.slug.trim(),
            title: pageForm.title.trim(),
            content: pageForm.content.trim(),
            meta_description: pageForm.meta_description.trim(),
            meta_keywords: pageForm.meta_keywords.trim(),
            is_active: pageForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPage.id)

        if (error) throw error
        toast.success('Sayfa güncellendi')
      } else {
        // Yeni sayfa oluştur
        const { error } = await supabase
          .from('internal_pages')
          .insert({
            slug: pageForm.slug.trim(),
            title: pageForm.title.trim(),
            content: pageForm.content.trim(),
            meta_description: pageForm.meta_description.trim(),
            meta_keywords: pageForm.meta_keywords.trim(),
            is_active: pageForm.is_active
          })

        if (error) throw error
        toast.success('Sayfa oluşturuldu')
      }
      
      setDialogOpen(false)
      await fetchPages()
    } catch (error) {
      console.error('Sayfa kaydetme hatası:', error)
      toast.error('Sayfa kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePage = async (id: string) => {
    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('internal_pages')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Sayfa silindi')
      await fetchPages()
    } catch (error) {
      console.error('Sayfa silme hatası:', error)
      toast.error('Sayfa silinemedi')
    }
  }

  const handleToggleActive = async (page: InternalPage) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('internal_pages')
        .update({
          is_active: !page.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id)

      if (error) throw error
      
      toast.success(`Sayfa ${!page.is_active ? 'aktif' : 'pasif'} hale getirildi`)
      await fetchPages()
    } catch (error) {
      console.error('Sayfa durumu güncelleme hatası:', error)
      toast.error('Sayfa durumu güncellenemedi')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">İç Sayfalar Yönetimi</h1>
          <p className="text-muted-foreground mt-2">
            Web sitesindeki iç sayfaların içeriklerini düzenleyin
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Sayfa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Oluştur'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    placeholder="ornek-sayfa"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    URL'de kullanılacak kısa isim (örn: /hakkimizda)
                  </p>
                </div>
                <div>
                  <Label htmlFor="title">Sayfa Başlığı *</Label>
                  <Input
                    id="title"
                    value={pageForm.title}
                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                    placeholder="Sayfa Başlığı"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="content">İçerik *</Label>
                <RichTextEditor
                  value={pageForm.content}
                  onChange={(value) => setPageForm({ ...pageForm, content: value })}
                  placeholder="Sayfa içeriğini buraya yazın..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Zengin metin editörü ile içeriğinizi kolayca düzenleyebilirsiniz
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Açıklama</Label>
                <Textarea
                  id="meta_description"
                  value={pageForm.meta_description}
                  onChange={(e) => setPageForm({ ...pageForm, meta_description: e.target.value })}
                  placeholder="Sayfa için meta açıklama..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="meta_keywords">Meta Anahtar Kelimeler</Label>
                <Input
                  id="meta_keywords"
                  value={pageForm.meta_keywords}
                  onChange={(e) => setPageForm({ ...pageForm, meta_keywords: e.target.value })}
                  placeholder="anahtar, kelimeler, virgülle, ayrılmış"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={pageForm.is_active}
                  onCheckedChange={(checked) => setPageForm({ ...pageForm, is_active: checked })}
                />
                <Label htmlFor="is_active">Sayfa Aktif</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </Button>
                <Button onClick={handleSavePage} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{page.title}</CardTitle>
                    <Badge variant={page.is_active ? 'default' : 'secondary'}>
                      {page.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>URL:</strong> /{page.slug}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Son Güncelleme:</strong> {formatDate(page.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(page)}
                  >
                    {page.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/${page.slug}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(page)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Meta Açıklama:</h4>
                <p className="text-sm text-muted-foreground">
                  {page.meta_description || 'Meta açıklama belirtilmemiş'}
                </p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Meta Anahtar Kelimeler:</h4>
                <p className="text-sm text-muted-foreground">
                  {page.meta_keywords || 'Meta anahtar kelimeler belirtilmemiş'}
                </p>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="font-semibold mb-2">İçerik Önizleme:</h4>
                <div 
                  className="text-sm text-muted-foreground max-h-32 overflow-hidden"
                  dangerouslySetInnerHTML={{ 
                    __html: page.content.length > 300 
                      ? page.content.substring(0, 300) + '...' 
                      : page.content 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {pages.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Henüz hiç sayfa oluşturulmamış</p>
                <Button onClick={() => openDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  İlk Sayfayı Oluştur
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
