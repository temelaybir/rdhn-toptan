'use client'

import { useState, useEffect, useCallback } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X,
  ImagePlus,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { Category } from '@/types/admin/product'
import { getCategories, createCategory, updateCategory, generateSlug as generateSlugAction } from '@/app/actions/admin/category-actions'
import { useActionHandler } from '@/hooks/use-action-handler'

const formSchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır'),
  slug: z.string().min(2, 'URL slug en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
})

interface CategoryFormProps {
  category?: Category
  onSuccess?: (category: Category) => void
  onCancel?: () => void
  onError?: (error: string) => void
}

export function CategoryForm({ category, onSuccess, onCancel, onError }: CategoryFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(category?.image_url || category?.imageUrl || null)
  const { execute: executeCreate } = useActionHandler({
    successMessage: 'Kategori oluşturuldu',
    onSuccess,
    onError
  })
  const { execute: executeUpdate } = useActionHandler({
    successMessage: 'Kategori güncellendi', 
    onSuccess,
    onError
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      parentId: category?.parent_id?.toString() || undefined,
      imageUrl: category?.image_url || '',
      isActive: category?.is_active ?? true,
    },
  })

  // Kategori değiştiğinde form'u güncelle
  useEffect(() => {
    if (category) {
      const imageUrl = category.image_url || category.imageUrl || ''
      setImagePreview(imageUrl || null)
      form.reset({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        parentId: category.parent_id?.toString() || undefined,
        imageUrl: imageUrl,
        isActive: category.is_active ?? true,
      })
    } else {
      setImagePreview(null)
      form.reset({
        name: '',
        slug: '',
        description: '',
        parentId: undefined,
        imageUrl: '',
        isActive: true,
      })
    }
  }, [category, form])

  const filterOutCategoryAndChildren = useCallback((categories: Category[], excludeId: string): Category[] => {
    return categories
      .filter(cat => cat.id !== excludeId)
      .map(cat => ({
        ...cat,
        children: cat.children ? filterOutCategoryAndChildren(cat.children, excludeId) : []
      }))
  }, [])

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategories()
        if (result.success && result.data) {
          // Düzenlenen kategoriyi ve alt kategorilerini filtrele
          if (category) {
            const filteredData = filterOutCategoryAndChildren(result.data, category.id)
            setCategories(filteredData)
          } else {
            setCategories(result.data)
          }
        } else {
          onError?.(result.error || 'Kategoriler yüklenirken hata oluştu')
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Kategoriler yüklenirken hata oluştu')
      }
    }
    loadCategories()
  }, [category, filterOutCategoryAndChildren, onError])

  // Otomatik slug oluştur
  const generateSlug = async (name: string) => {
    if (!name) return
    try {
      const result = await generateSlugAction(name, category?.id)
      if (result.success && result.data) {
        form.setValue('slug', result.data)
      }
    } catch (error) {
      console.error('Slug oluşturma hatası:', error)
      // Fallback: simple slug
      const simpleSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      form.setValue('slug', simpleSlug)
    }
  }

  // Form gönderimi
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      
      // Form validasyonu
      if (!values.name || values.name.trim().length < 2) {
        toast.error('Kategori adı en az 2 karakter olmalıdır')
        return
      }
      
      if (!values.slug || values.slug.trim().length < 2) {
        toast.error('URL slug en az 2 karakter olmalıdır')
        return
      }
      
      // Form values'larını veritabanı field'larına map et
      const categoryData = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description?.trim() || undefined,
        parent_id: values.parentId || null,
        image_url: values.imageUrl?.trim() || undefined,
        is_active: values.isActive,
        display_order: 0, // Default value
      }

      if (category) {
        const result = await executeUpdate(updateCategory(category.id, categoryData))
      } else {
        const result = await executeCreate(createCategory(categoryData))
      }
    } catch (error) {
      console.error('❌ Form submission hatası:', error)
      const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
      console.error('❌ Error message:', errorMessage)
      toast.error(`Form hatası: ${errorMessage}`)
      onError?.(errorMessage)
    }
  }

  // Görsel yükleme
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir görsel dosyası seçin')
      return
    }

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Dosya boyutu 2MB'dan küçük olmalıdır. Şu anki boyut: ${Math.round(file.size / 1024)}KB`)
      return
    }

    // Preview oluştur
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setImagePreview(result)
      form.setValue('imageUrl', result)
      toast.success('Görsel başarıyla eklendi')
    }
    
    reader.onerror = () => {
      toast.error('Dosya okuma hatası')
    }
    
    reader.readAsDataURL(file)
  }

  // Manuel URL girişi için handler
  const handleImageUrlChange = (url: string) => {
    if (url && url.trim() !== '') {
      setImagePreview(url)
      form.setValue('imageUrl', url)
    } else {
      setImagePreview(null)
      form.setValue('imageUrl', '')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="seo">SEO & Görsel</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Adı</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: Elektronik" 
                          {...field}
                          onBlur={(e) => {
                            field.onBlur()
                            if (!form.getValues('slug')) {
                              generateSlug(e.target.value)
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üst Kategori</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} 
                        value={field.value || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ana kategori (opsiyonel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Ana Kategori</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Bu kategoriyi bir üst kategorinin altına yerleştirmek için seçin.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Kategori hakkında kısa bir açıklama..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Bu açıklama kategori sayfasında görüntülenecektir.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Kategori Aktif
                        </FormLabel>
                        <FormDescription>
                          Pasif kategoriler sitede görünmez
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: elektronik" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Kategori URL&apos;inde kullanılacak metin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Görseli</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Görsel URL (Manuel)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://ornek.com/gorsel.jpg"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleImageUrlChange(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Görsel URL'sini doğrudan girebilir veya aşağıdan dosya yükleyebilirsiniz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {imagePreview && (
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <SafeImage
                        src={imagePreview}
                        alt="Kategori görseli"
                        className="w-full h-full object-cover"
                        fill
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null)
                          form.setValue('imageUrl', '')
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {!imagePreview && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Dosya yüklemek için tıklayın
                          </span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                            className="sr-only"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG, GIF, WebP - Maks 2MB (Optimize edilmiş görseller önerilir)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={executeCreate.loading || executeUpdate.loading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={executeCreate.loading || executeUpdate.loading}>
            {(executeCreate.loading || executeUpdate.loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 