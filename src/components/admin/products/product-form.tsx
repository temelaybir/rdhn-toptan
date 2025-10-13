'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Plus,
  X,
  Package,
} from 'lucide-react'
import { Product, ProductFormData } from '@/types/admin/product'
import { Category, getCategories } from '@/app/actions/admin/category-actions'
import { 
  createProduct, 
  updateProduct, 
  generateSlug as generateSlugAction, 
  checkSKU as checkSKUAction 
} from '@/app/actions/admin/product-actions'
import { useCurrency } from '@/context/currency-context'
import { useProductActions } from '@/hooks/use-action-handler'
import { ImageManager, type ImageItem } from './image-manager'
import { toast } from 'sonner'

// Schema tanımlaması
const formSchema = z.object({
  // Temel Bilgiler
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalıdır'),
  slug: z.string().min(2, 'URL slug en az 2 karakter olmalıdır'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır'),
  shortDescription: z.string().max(160, 'Kısa açıklama maksimum 160 karakter olmalıdır'),
  
  // Fiyat ve Stok
  price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
  comparePrice: z.number().optional(),
  costPrice: z.number().optional(),
  stockQuantity: z.number().int().min(0),
  trackStock: z.boolean(),
  allowBackorders: z.boolean(),
  lowStockThreshold: z.number().int().optional(),
  
  // Toptan Fiyatlandırma
  isWholesale: z.boolean().optional(),
  wholesaleOnly: z.boolean().optional(),
  moq: z.number().int().optional(),
  moqUnit: z.enum(['piece', 'package', 'koli']).optional(),
  packageQuantity: z.number().int().optional(),
  packageUnit: z.string().optional(),
  tierPricing: z.array(z.object({
    minQuantity: z.number().int().min(1),
    maxQuantity: z.number().int().optional(),
    price: z.number().min(0),
    label: z.string()
  })).optional(),
  
  // Ürün Detayları
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.enum(['cm', 'inch'])
  }).optional(),
  
  // Kategori ve Etiketler
  categoryId: z.string().optional(),
  tags: z.array(z.string()),
  
  // Durum
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  
  // Varyantlar
  hasVariants: z.boolean(),
  variantOptions: z.array(z.object({
    name: z.string(),
    values: z.array(z.string())
  })).optional(),
  
  // SEO
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).optional(),
  }).optional(),
  
  // Kargo
  shipping: z.object({
    requiresShipping: z.boolean(),
    weight: z.number().optional(),
    shippingClass: z.enum(['standard', 'fragile', 'oversized']).optional(),
    isOversized: z.boolean().optional(), // Büyük ürün flag'i
  }).optional(),
})

// ImageItem artık image-manager.tsx'te tanımlı

interface ProductFormProps {
  product?: Product
  onSuccess?: (product: Product) => void
  onCancel?: () => void
  onError?: (error: string) => void
}

export function ProductForm({ product, onSuccess, onCancel, onError }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [showVariants, setShowVariants] = useState(false)
  const [showWholesale, setShowWholesale] = useState(product?.isWholesale ?? true) // Default: Toptan bölümü açık
  const { currentCurrency } = useCurrency()
  const { create, update } = useProductActions()
  
  // Tier pricing helpers
  const addTierPrice = () => {
    const tiers = form.getValues('tierPricing') || []
    const lastTier = tiers[tiers.length - 1]
    const newMinQuantity = lastTier ? (lastTier.maxQuantity || 0) + 1 : 1
    
    form.setValue('tierPricing', [
      ...tiers,
      {
        minQuantity: newMinQuantity,
        maxQuantity: undefined,
        price: 0,
        label: `${newMinQuantity}+ adet`
      }
    ])
  }
  
  const removeTierPrice = (index: number) => {
    const tiers = form.getValues('tierPricing') || []
    form.setValue('tierPricing', tiers.filter((_, i) => i !== index))
  }
  
  const updateTierPrice = (index: number, field: string, value: any) => {
    const tiers = form.getValues('tierPricing') || []
    tiers[index] = { ...tiers[index], [field]: value }
    form.setValue('tierPricing', tiers)
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      description: product?.description || '',
      shortDescription: product?.shortDescription || '',
      price: product?.price || 0,
      comparePrice: product?.comparePrice || 0,
      costPrice: product?.costPrice || 0,
      stockQuantity: product?.stockQuantity || 0,
      trackStock: product?.trackStock ?? true,
      allowBackorders: product?.allowBackorders ?? false,
      lowStockThreshold: product?.lowStockThreshold || 0,
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      weight: product?.weight || 0,
      categoryId: product?.categoryId ? product.categoryId.toString() : undefined,
      tags: product?.tags || [],
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      hasVariants: false,
      isWholesale: product?.isWholesale ?? true, // Default: Toptan satış aktif
      wholesaleOnly: product?.wholesaleOnly ?? true, // Default: Sadece toptan
      moq: product?.moq || 10, // Default: 10 adet minimum
      moqUnit: product?.moqUnit || 'piece',
      packageQuantity: product?.packageQuantity || 12, // Default: 12'li koli
      packageUnit: product?.packageUnit || 'koli',
      tierPricing: product?.tierPricing || [
        { minQuantity: 10, maxQuantity: 49, price: 0, label: '10-49 adet' },
        { minQuantity: 50, maxQuantity: 99, price: 0, label: '50-99 adet' },
        { minQuantity: 100, maxQuantity: undefined, price: 0, label: '100+ adet' }
      ], // Default kademeli fiyatlandırma şablonu
      shipping: {
        requiresShipping: true,
        shippingClass: 'standard',
        isOversized: false
      }
    },
  })

  // Helper function to flatten category tree for dropdown
  const flattenCategories = (categories: Category[]): Category[] => {
    const flattened: Category[] = []
    
    const flatten = (cats: Category[], depth = 0) => {
      cats.forEach(cat => {
        // Add prefix for depth indication
        const displayName = depth > 0 ? `${'  '.repeat(depth)}↳ ${cat.name}` : cat.name
        flattened.push({
          ...cat,
          name: displayName
        })
        
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, depth + 1)
        }
      })
    }
    
    flatten(categories)
    return flattened
  }

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategories()
        
        if (result.success && result.data) {
          // Flatten the hierarchical categories for dropdown
          const flatCategories = flattenCategories(result.data)
          setCategories(flatCategories)
        } else {
          toast.error('Kategoriler yüklenirken hata oluştu: ' + result.error)
        }
      } catch (error) {
        console.error('ProductForm kategori yükleme hatası:', error)
        toast.error('Kategoriler yüklenirken hata oluştu')
      }
    }
    loadCategories()
  }, [])

  // Mevcut ürün görsellerini yükle
  useEffect(() => {
    if (product && product.images.length > 0) {
      const productImages: ImageItem[] = product.images.map((img, index) => ({
        id: `existing-${index}`,
        url: img.url,
        alt: img.alt || product.name,
        position: img.position || index,
        isCover: img.isMain || index === 0,
        source: 'upload' as const
      }))
      setImages(productImages)
    }
  }, [product])

  // Otomatik slug oluştur
  const generateSlug = async (name: string) => {
    if (!name) return
    try {
      const slug = await generateSlugAction(name, product?.id)
      form.setValue('slug', slug)
    } catch {
      console.error('Slug oluşturma hatası')
    }
  }

  // SKU kontrol
  const checkSKU = async (sku: string) => {
    if (!sku) return
    try {
      const result = await checkSKUAction(sku, product?.id)
      if (result.success && !result.available) {
        form.setError('sku', {
          type: 'manual',
          message: 'Bu SKU zaten kullanımda'
        })
      }
    } catch {
      console.error('SKU kontrol hatası')
    }
  }

  // Görsel değişikliklerini işle
  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages)
  }

  // Etiket ekleme
  const addTag = useCallback(() => {
    if (!currentTag.trim()) return
    
    const tags = form.getValues('tags')
    if (!tags.includes(currentTag)) {
      form.setValue('tags', [...tags, currentTag])
    }
    setCurrentTag('')
  }, [currentTag, form])

  const removeTag = useCallback((tag: string) => {
    const tags = form.getValues('tags')
    form.setValue('tags', tags.filter(t => t !== tag))
  }, [form])

  // Form gönderimi
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Görsel URL'lerini hazırla
      const imageUrls = images.map(img => ({
        url: img.url,
        alt: img.alt || values.name,
        position: img.position,
        isMain: img.isCover
      }))
      
      const formData: ProductFormData = {
        ...values,
        images: imageUrls,
        variants: [] // Variants sistemi henüz tamamlanmadı
      }

      if (product) {
        const result = await update.execute(updateProduct(product.id, formData))
        if (result.success && result.data) {
          onSuccess?.(result.data)
        } else {
          onError?.(result.error || 'Ürün güncellenemedi')
        }
      } else {
        const result = await create.execute(createProduct(formData))
        if (result.success && result.data) {
          onSuccess?.(result.data)
        } else {
          onError?.(result.error || 'Ürün oluşturulamadı')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
      onError?.(errorMessage)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Genel</TabsTrigger>
            <TabsTrigger value="media">Görseller</TabsTrigger>
            <TabsTrigger value="pricing">Fiyat & Stok</TabsTrigger>
            <TabsTrigger value="variants">Varyantlar</TabsTrigger>
            <TabsTrigger value="seo">SEO & Kargo</TabsTrigger>
          </TabsList>

          {/* Genel Bilgiler Tab */}
          <TabsContent value="general" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
                <CardDescription>
                  Ürünün temel bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün Adı</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: iPhone 15 Pro" 
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
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: iphone-15-pro" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ürün URL&apos;inde kullanılacak metin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kısa Açıklama</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ürün hakkında kısa bir açıklama..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maksimum 160 karakter
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
                      <FormLabel>Detaylı Açıklama</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ürün hakkında detaylı açıklama..."
                          className="resize-none min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Ürün sayfasında görünecek detaylı açıklama
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} 
                          value={field.value ? field.value.toString() : 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategori seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Kategori yok</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etiketler</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Etiket ekle..."
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addTag()
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={addTag}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Ürün Aktif
                          </FormLabel>
                          <FormDescription>
                            Pasif ürünler sitede görünmez
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

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Öne Çıkan
                          </FormLabel>
                          <FormDescription>
                            Ana sayfada göster
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Görseller Tab */}
          <TabsContent value="media" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ürün Görselleri</CardTitle>
                <CardDescription>
                  Ürün için görsel yükleyin, sıralayın ve kapak görseli belirleyin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageManager
                  images={images}
                  onImagesChange={handleImagesChange}
                  maxImages={8}
                  productId={product?.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fiyat & Stok Tab */}
          <TabsContent value="pricing" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Fiyat Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satış Fiyatı</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currentCurrency.symbol}</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comparePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Liste Fiyatı</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currentCurrency.symbol}</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>İndirimli fiyat göstermek için.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maliyet</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currentCurrency.symbol}</span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Kar hesaplaması için.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stok Yönetimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU (Stok Kodu)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Örn: IPH15PRO-128"
                            {...field}
                            onBlur={(e) => {
                              field.onBlur()
                              checkSKU(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barkod</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Örn: 1234567890123"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Miktarı</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trackStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Stok Takibi
                          </FormLabel>
                          <FormDescription>
                            Stok miktarını takip et
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

                  <FormField
                    control={form.control}
                    name="allowBackorders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Ön Sipariş
                          </FormLabel>
                          <FormDescription>
                            Stok bittiğinde sipariş al
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
                </div>

                {form.watch('trackStock') && (
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Düşük Stok Uyarı Limiti</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Bu miktarın altına düştüğünde uyarı ver
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Toptan Fiyatlandırma Card */}
            <Card>
              <CardHeader>
                <CardTitle>Toptan Fiyatlandırma</CardTitle>
                <CardDescription>
                  Kademeli fiyatlandırma ve minimum sipariş adedi ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isWholesale"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Toptan Satış
                        </FormLabel>
                        <FormDescription>
                          Bu ürün toptan satışa uygun
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            setShowWholesale(checked)
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {showWholesale && (
                  <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                    <FormField
                      control={form.control}
                      name="wholesaleOnly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Sadece Toptan
                            </FormLabel>
                            <FormDescription>
                              Sadece toptan müşterilere sat (perakende yok)
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

                    {/* MOQ Settings */}
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="moq"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Sipariş Adedi (MOQ)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Örn: 12"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormDescription>
                              Bu üründen en az kaç adet alınmalı
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="packageQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Koli/Paket Adedi</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Örn: 12"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormDescription>
                              Bir kolideki ürün sayısı
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="packageUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paket Türü</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Örn: koli, paket"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Paket birim adı
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tier Pricing */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Kademeli Fiyatlandırma</h4>
                          <p className="text-sm text-muted-foreground">
                            Adet aralıklarına göre farklı fiyatlar belirleyin
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addTierPrice}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Kademe Ekle
                        </Button>
                      </div>

                      {form.watch('tierPricing')?.map((tier, index) => (
                        <div key={index} className="grid grid-cols-5 gap-2 items-end">
                          <div>
                            <label className="text-sm font-medium">Min Adet</label>
                            <Input
                              type="number"
                              value={tier.minQuantity}
                              onChange={(e) => updateTierPrice(index, 'minQuantity', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Max Adet</label>
                            <Input
                              type="number"
                              placeholder="Sınırsız"
                              value={tier.maxQuantity || ''}
                              onChange={(e) => updateTierPrice(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Fiyat ({currentCurrency.symbol})</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={tier.price}
                              onChange={(e) => updateTierPrice(index, 'price', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Etiket</label>
                            <Input
                              value={tier.label}
                              onChange={(e) => updateTierPrice(index, 'label', e.target.value)}
                              placeholder="10-49 adet"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTierPrice(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {(!form.watch('tierPricing') || form.watch('tierPricing')?.length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Henüz kademe eklenmedi. &quot;Kademe Ekle&quot; butonuna tıklayın.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Örnek: 10-49 adet → 140₺, 50-99 adet → 130₺, 100+ adet → 120₺
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Örnek Görünüm */}
                    {form.watch('tierPricing') && form.watch('tierPricing')!.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Müşterilere Böyle Görünecek:</h5>
                        <div className="space-y-1">
                          {form.watch('tierPricing')!.map((tier, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-blue-700">{tier.label}</span>
                              <span className="font-medium text-blue-900">
                                {tier.price.toFixed(2)} {currentCurrency.symbol}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Varyantlar Tab */}
          <TabsContent value="variants" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ürün Varyantları</CardTitle>
                <CardDescription>
                  Renk, beden gibi farklı seçenekler ekleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Varyant Kullan
                          </FormLabel>
                          <FormDescription>
                            Bu ürünün farklı varyantları var
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              setShowVariants(checked)
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {showVariants && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Varyant yönetimi yakında eklenecek
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO & Kargo Tab */}
          <TabsContent value="seo" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="seo.metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Başlık</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sayfa başlığı"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Arama sonuçlarında görünecek başlık
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seo.metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Açıklama</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Sayfa açıklaması"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Arama sonuçlarında görünecek açıklama
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kargo Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="shipping.requiresShipping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Kargo Gerekli
                        </FormLabel>
                        <FormDescription>
                          Bu ürün fiziksel kargo gerektiriyor
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

                {form.watch('shipping.requiresShipping') && (
                  <>
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ağırlık (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping.shippingClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kargo Sınıfı</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Kargo sınıfı seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standart Kargo</SelectItem>
                              <SelectItem value="fragile">Kırılabilir Ürün</SelectItem>
                              <SelectItem value="oversized">Büyük Boy Ürün</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shipping.isOversized"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Büyük Ürün
                            </FormLabel>
                            <FormDescription>
                              Bu ürün büyük boyutlu olup ek kargo ücreti gerektirir
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Büyük Ürün Uyarısı */}
                    {form.watch('shipping.isOversized') && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <Package className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                              Büyük Ürün Kargo Ücret Bilgisi
                            </h3>
                            <div className="mt-2 text-sm text-amber-700">
                              <ul className="list-disc pl-5 space-y-1">
                                <li>Bu ürün için ek kargo ücreti: <strong>20 ₺</strong></li>
                                <li>Ücretsiz kargo limiti: <strong>300 ₺</strong> (normal ürünler için 150 ₺)</li>
                                <li>Kargo süresi: 2-5 iş günü (normal kargo: 1-3 iş günü)</li>
                                <li>Özel ambalaj ve dikkatli kargo ile gönderilir</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={create.loading || update.loading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={create.loading || update.loading}>
            {(create.loading || update.loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Component display name
ProductForm.displayName = 'ProductForm'