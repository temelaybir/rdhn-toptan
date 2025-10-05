'use server'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import { Tables } from '@/types/supabase'
import { Product, ProductFormData, ProductFilters, ActionResponse } from '@/types/admin/product'
import { parseId, parseIdOrNull } from '@/lib/utils/id-parser'

type ProductRow = Tables<'products'> & {
  category: Tables<'categories'> | null
  variants: Tables<'product_variants'>[]
}

// VARIANT VALIDATION SCHEMAS
const VariantOptionSchema = z.object({
  name: z.string().min(1, 'Varyant özellik adı gerekli'),
  values: z.array(z.string().min(1, 'Varyant değeri boş olamaz'))
})

const ProductVariantSchema = z.object({
  title: z.string().min(1, 'Varyant başlığı gerekli'),
  price: z.number().min(0, 'Fiyat 0\'dan büyük olmalı'),
  comparePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().min(0).optional(),
  option1: z.string().optional(),
  option2: z.string().optional(),
  option3: z.string().optional(),
  isActive: z.boolean().default(true)
})

// Form validation schema - sadece temel zorunlu alanlar
const ProductSchema = z.object({
  // Zorunlu temel alanlar
  name: z.string().min(1, 'Ürün adı zorunludur'),
  price: z.number().min(0, 'Fiyat 0\'dan büyük olmalıdır'),
  
  // İsteğe bağlı temel alanlar
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  category_id: z.union([z.string(), z.number()]).transform(val => parseIdOrNull(val)).optional(),
  stock_quantity: z.number().int().min(0).optional().default(0),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
  
  // Fiyat alanları
  cost_price: z.number().min(0).optional(),
  compare_price: z.number().min(0).optional(),
  
  // Stok alanları  
  track_stock: z.boolean().optional().default(true),
  allow_backorders: z.boolean().optional().default(false),
  low_stock_threshold: z.number().int().optional(),
  
  // Diğer alanlar
  weight: z.number().min(0).optional(),
  tags: z.array(z.string()).optional().default([]),
  tax_rate: z.number().min(0).max(100).optional().default(0),
  
  // Varyant alanları - improved typing
  has_variants: z.boolean().optional().default(false),
  variants: z.array(ProductVariantSchema).optional().default([]),
  
  // Form'dan gelen camelCase alanlar (mapping için)
  categoryId: z.string().uuid().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  shortDescription: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  comparePrice: z.number().min(0).optional(),
  trackStock: z.boolean().optional(),
  allowBackorders: z.boolean().optional(),
  lowStockThreshold: z.number().int().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  hasVariants: z.boolean().optional(),
  variantOptions: z.array(VariantOptionSchema).optional(),
  
  // SEO ve Shipping objeleri (isteğe bağlı)
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).optional()
  }).optional(),
  shipping: z.object({
    requiresShipping: z.boolean().optional(),
    shippingClass: z.enum(['standard', 'fragile', 'oversized']).optional()
  }).optional(),
  dimensions: z.record(z.unknown()).optional()
})

// Helper function to map camelCase form fields to snake_case database fields
function mapFormFieldsToDatabase(formData: Record<string, unknown>): Record<string, unknown> {
  const dbData: Record<string, unknown> = { ...formData }
  
  // Complete field mapping: camelCase -> snake_case
  const fieldMappings = {
    // Boolean fields
    allowBackorders: 'allow_backorders',
    trackStock: 'track_stock',
    isActive: 'is_active',
    isFeatured: 'is_featured',
    hasVariants: 'has_variants',
    
    // String/Text fields
    shortDescription: 'short_description',
    
    // Numeric fields
    comparePrice: 'compare_price',
    costPrice: 'cost_price',
    stockQuantity: 'stock_quantity',
    lowStockThreshold: 'low_stock_threshold',
    taxRate: 'tax_rate',
    
    // UUID fields
    categoryId: 'category_id',
    
    // JSON fields
    variantOptions: 'variant_options',
  }
  
  // Apply mappings
  for (const [camelCase, snake_case] of Object.entries(fieldMappings)) {
    if (dbData[camelCase] !== undefined) {
      dbData[snake_case] = dbData[camelCase]
      delete dbData[camelCase]
    }
  }
  
  // UUID alanları için boş string'leri NULL'a çevir
  const uuidFields = ['category_id', 'categoryId']
  for (const field of uuidFields) {
    if (dbData[field] === '') {
      dbData[field] = null
    }
  }
  
  // SEO alanlarını ayrı kolonlara dönüştür
  if (dbData.seo) {
    if (dbData.seo.metaTitle) dbData.meta_title = dbData.seo.metaTitle
    if (dbData.seo.metaDescription) dbData.meta_description = dbData.seo.metaDescription
    if (dbData.seo.metaKeywords && Array.isArray(dbData.seo.metaKeywords)) {
      dbData.meta_keywords = dbData.seo.metaKeywords.join(', ')
    }
    delete dbData.seo
  }
  
  // Shipping alanlarını ayrı kolonlara dönüştür
  if (dbData.shipping) {
    if (dbData.shipping.requiresShipping !== undefined) {
      dbData.requires_shipping = dbData.shipping.requiresShipping
    }
    if (dbData.shipping.shippingClass) {
      dbData.shipping_class = dbData.shipping.shippingClass
    }
    delete dbData.shipping
  }
  
  // Dimensions alanını dimensions_detail'e yönlendir
  if (dbData.dimensions) {
    dbData.dimensions_detail = dbData.dimensions
    delete dbData.dimensions
  }
  
  // Remove form-only fields that shouldn't be sent to database
  delete dbData.variants // handled separately
  delete dbData.images // handled separately
  
  return dbData
}

// Helper function to map snake_case database fields to camelCase form fields
function mapDatabaseFieldsToForm(dbData: Record<string, unknown>): Record<string, unknown> {
  const formData: Record<string, unknown> = { ...dbData }
  
  // Reverse field mapping: snake_case -> camelCase
  const fieldMappings = {
    // Boolean fields
    allow_backorders: 'allowBackorders',
    track_stock: 'trackStock',
    is_active: 'isActive',
    is_featured: 'isFeatured',
    has_variants: 'hasVariants',
    
    // String/Text fields
    short_description: 'shortDescription',
    
    // Numeric fields
    compare_price: 'comparePrice',
    cost_price: 'costPrice',
    stock_quantity: 'stockQuantity',
    low_stock_threshold: 'lowStockThreshold',
    tax_rate: 'taxRate',
    
    // UUID fields
    category_id: 'categoryId',
    
    // JSON fields
    variant_options: 'variantOptions',
  }
  
  // Apply mappings
  for (const [snake_case, camelCase] of Object.entries(fieldMappings)) {
    if (formData[snake_case] !== undefined) {
      formData[camelCase] = formData[snake_case]
      delete formData[snake_case]
    }
  }
  
  return formData
}

// Ürün listesini getir
export async function getProducts(filters: ProductFilters = {}): Promise<ActionResponse<{ products: Product[]; total: number }>> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `, { count: 'exact' })

    // Filtreleme
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters.status) {
      switch (filters.status) {
        case 'active': query = query.eq('is_active', true); break
        case 'inactive': query = query.eq('is_active', false); break
        case 'outofstock': query = query.eq('stock_quantity', 0); break
        case 'lowstock': query = query.gt('stock_quantity', 0).lte('stock_quantity', 10); break
      }
    }

    // Sayfalama - Admin panel için kaldırıldı, tüm ürünleri göster
    // Admin panelde tüm ürünleri görmek istiyoruz
    // const page = filters.page || 1
    // const pageSize = filters.pageSize || 20
    // const from = (page - 1) * pageSize
    // const to = from + pageSize - 1
    // query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    const products = transformProducts(data || [])
    
    return { 
      success: true, 
      data: { products, total: count || 0 }
    }
  } catch (error) {
    console.error('Ürünler getirilirken hata:', error)
    return { 
      success: false, 
      error: 'Ürünler yüklenirken bir hata oluştu' 
    }
  }
}

// Tek ürün getir
export async function getProduct(id: number): Promise<ActionResponse<Product>> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return { success: false, error: 'Ürün bulunamadı' }

    return { 
      success: true, 
      data: transformProduct(data),
      message: 'Ürün başarıyla getirildi'
    }
  } catch (error) {
    console.error('Ürün getirilirken hata:', error)
    return { 
      success: false, 
      error: 'Ürün yüklenirken bir hata oluştu' 
    }
  }
}

// Ürün oluştur
export async function createProduct(formData: ProductFormData): Promise<ActionResponse<Product>> {
  try {
    const validatedFields = ProductSchema.safeParse(formData)
    
    if (!validatedFields.success) {
      return { 
        success: false, 
        error: 'Geçersiz form verisi', 
        errors: validatedFields.error.flatten().fieldErrors 
      }
    }

    const supabase = await createAdminSupabaseClient()
    
    // Slug oluştur
    const slug = await generateSlug(formData.name)
    
    // Field mapping using helper function
    const dbData = mapFormFieldsToDatabase(validatedFields.data)
    
    // Images alanını da ekle
    if (formData.images !== undefined) {
      // Images array'ini text[] formatına çevir (veritabanı formatı)
      dbData.images = formData.images.map(img => img.url)
    }
    
    // Ana ürünü oluştur
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        ...dbData,
        slug
      })
      .select()
      .single()

    if (productError) throw productError

    // Varyantları oluştur
    if (formData.variants && formData.variants.length > 0) {
      const variantInserts = formData.variants.map(variant => ({
        product_id: product.id,
        ...variant
      }))

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantInserts)

      if (variantError) throw variantError
    }

    revalidatePath('/admin/urunler')
    
    return { 
      success: true, 
      message: 'Ürün başarıyla oluşturuldu',
      data: product 
    }
  } catch (error) {
    console.error('Ürün oluşturulurken hata:', error)
    return { 
      success: false, 
      error: 'Ürün oluşturulurken bir hata oluştu' 
    }
  }
}

// Ürün güncelle
export async function updateProduct(id: number, formData: Partial<ProductFormData>): Promise<ActionResponse<Product>> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    // Slug güncelle (eğer isim değiştiyse)
    const updateData: Record<string, unknown> = { ...formData }
    if (formData.name) {
      updateData.slug = await generateSlug(formData.name, id)
    }

    // Field mapping using helper function
    const dbData = mapFormFieldsToDatabase(updateData)
    
    // Images alanını da ekle (artık handle ediliyor!)
    if (formData.images !== undefined) {
      // Images array'ini text[] formatına çevir (veritabanı formatı)
      dbData.images = formData.images.map(img => img.url)
    }
    
    // Ana ürünü güncelle
    const { error: productError } = await supabase
      .from('products')
      .update(dbData)
      .eq('id', id)

    if (productError) throw productError

    // Varyantları güncelle (varsa)
    if (formData.variants !== undefined) {
      // Önce mevcut varyantları sil
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)

      // Yeni varyantları ekle
      if (formData.variants.length > 0) {
        const variantInserts = formData.variants.map(variant => ({
          product_id: id,
          ...variant
        }))

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantInserts)

        if (variantError) throw variantError
      }
    }

    // Güncellenmiş ürünü getir
    const { data: updatedProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single()

    revalidatePath('/admin/urunler')
    revalidatePath(`/urunler/${id}`)
    
    return { 
      success: true, 
      message: 'Ürün başarıyla güncellendi',
      data: updatedProduct ? transformProduct(updatedProduct) : undefined
    }
  } catch (error) {
    console.error('Ürün güncellenirken hata:', error)
    return { 
      success: false, 
      error: 'Ürün güncellenirken bir hata oluştu' 
    }
  }
}

// Ürün sil
export async function deleteProduct(id: number): Promise<ActionResponse<void>> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/urunler')
    
    return { 
      success: true, 
      message: 'Ürün başarıyla silindi' 
    }
  } catch (error) {
    console.error('Ürün silinirken hata:', error)
    return { 
      success: false, 
      error: 'Ürün silinirken bir hata oluştu' 
    }
  }
}

// Toplu kategori güncelleme
export async function bulkUpdateProductCategory(productIds: number[], categoryId: string | null): Promise<ActionResponse<void>> {
  try {
    console.log('🔍 Toplu kategori güncelleme başlatılıyor:', { productIds, categoryId })
    
    if (!productIds || productIds.length === 0) {
      console.log('❌ Hiç ürün seçilmemiş')
      return { 
        success: false, 
        error: 'Güncellenecek ürün seçilmedi' 
      }
    }

    const supabase = await createAdminSupabaseClient()
    
    console.log('🔄 Veritabanında güncelleme yapılıyor...')
    const { error } = await supabase
      .from('products')
      .update({ category_id: categoryId })
      .in('id', productIds)

    if (error) {
      console.log('❌ Veritabanı hatası:', error)
      throw error
    }

    console.log('✅ Güncelleme başarılı')
    revalidatePath('/admin/urunler')
    
    return { 
      success: true, 
      message: `${productIds.length} ürünün kategorisi başarıyla güncellendi` 
    }
  } catch (error) {
    console.error('💥 Toplu kategori güncellenirken hata:', error)
    return { 
      success: false, 
      error: 'Kategoriler güncellenirken bir hata oluştu' 
    }
  }
}

// Toplu ürün silme
export async function bulkDeleteProducts(productIds: number[]): Promise<ActionResponse<void>> {
  try {
    if (!productIds || productIds.length === 0) {
      return { 
        success: false, 
        error: 'Silinecek ürün seçilmedi' 
      }
    }

    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', productIds)

    if (error) throw error

    revalidatePath('/admin/urunler')
    
    return { 
      success: true, 
      message: `${productIds.length} ürün başarıyla silindi` 
    }
  } catch (error) {
    console.error('Toplu silme sırasında hata:', error)
    return { 
      success: false, 
      error: 'Ürünler silinirken bir hata oluştu' 
    }
  }
}

// Toplu durum güncelleme
export async function bulkUpdateProductStatus(productIds: number[], isActive: boolean): Promise<ActionResponse<void>> {
  try {
    if (!productIds || productIds.length === 0) {
      return { 
        success: false, 
        error: 'Güncellenecek ürün seçilmedi' 
      }
    }

    const supabase = await createAdminSupabaseClient()
    
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .in('id', productIds)

    if (error) throw error

    revalidatePath('/admin/urunler')
    
    return { 
      success: true, 
      message: `${productIds.length} ürünün durumu başarıyla güncellendi` 
    }
  } catch (error) {
    console.error('Toplu durum güncellenirken hata:', error)
    return { 
      success: false, 
      error: 'Durum güncellenirken bir hata oluştu' 
    }
  }
}

// Slug oluştur
export async function generateSlug(name: string, excludeId?: number): Promise<string> {
  try {
    const supabase = await createAdminSupabaseClient()
    const baseSlug = createSlug(name)
    let slug = baseSlug
    let counter = 1

    while (true) {
      let query = supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
      
      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query

      if (!data || data.length === 0) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  } catch (error) {
    console.error('Slug oluşturulurken hata:', error)
    return createSlug(name)
  }
}

// SKU kontrolü
export async function checkSKU(sku: string, excludeId?: number) {
  try {
    const supabase = await createAdminSupabaseClient()
    
    let query = supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
    
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query

    return { 
      success: true, 
      available: !data || data.length === 0 
    }
  } catch (error) {
    console.error('SKU kontrol edilirken hata:', error)
    return { 
      success: false, 
      error: 'SKU kontrol edilirken bir hata oluştu' 
    }
  }
}

// Transform functions
function transformProducts(data: ProductRow[]): Product[] {
  return data.map(transformProduct)
}

function transformProduct(data: ProductRow): Product {
  // Use helper function to map database fields to form fields
  const mappedData = mapDatabaseFieldsToForm(data)
  
  // Images'ı object array'e çevir (homepage servisindekiyle aynı logic)
  let transformedImages = [];
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    transformedImages = data.images.map((url: string, index: number) => ({
      url: url || '/placeholder-product.svg',
      alt: data.name || 'Ürün',
      is_main: index === 0
    }));
  } else {
    transformedImages = [{
      url: '/placeholder-product.svg',
      alt: data.name || 'Ürün',
      is_main: true
    }];
  }
  
  return {
    id: mappedData.id,
    name: mappedData.name,
    slug: mappedData.slug,
    sku: mappedData.sku,
    barcode: mappedData.barcode,
    price: mappedData.price,
    description: mappedData.description,
    tags: mappedData.tags || [],
    images: transformedImages, // Transform edilmiş images kullan
    variants: mappedData.variants || [],
    category: mappedData.category,
    created_at: mappedData.created_at,
    updated_at: mappedData.updated_at,
    
    // Mapped fields (now properly converted)
    allowBackorders: mappedData.allowBackorders || false,
    trackStock: mappedData.trackStock !== undefined ? mappedData.trackStock : true,
    lowStockThreshold: mappedData.lowStockThreshold,
    shortDescription: mappedData.shortDescription,
    comparePrice: mappedData.comparePrice,
    costPrice: mappedData.costPrice,
    stockQuantity: mappedData.stockQuantity || 0,
    categoryId: mappedData.categoryId,
    isActive: mappedData.isActive !== undefined ? mappedData.isActive : true,
    isFeatured: mappedData.isFeatured || false,
    taxRate: mappedData.taxRate,
    hasVariants: mappedData.hasVariants || false,
    variantOptions: mappedData.variantOptions || [],
    
    // Tabloda mevcut olan tek JSON alanı
    dimensions: mappedData.dimensions_detail || mappedData.dimensions,
    
    // SEO alanları - tablodaki kolonlardan oluştur
    seo: {
      metaTitle: mappedData.meta_title,
      metaDescription: mappedData.meta_description,
      metaKeywords: mappedData.meta_keywords ? [mappedData.meta_keywords] : [],
    },
    
    // Shipping alanları - tablodaki kolonlardan oluştur  
    shipping: {
      requiresShipping: mappedData.requires_shipping !== undefined ? mappedData.requires_shipping : true,
      shippingClass: mappedData.shipping_class || 'standard',
    },
    
    // Computed fields
    weight: mappedData.weight
  }
}

function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
} 