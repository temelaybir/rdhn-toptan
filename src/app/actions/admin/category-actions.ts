'use server'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { revalidatePath } from 'next/cache'
import { Tables } from '@/types/supabase'
import { parseId, parseIdOrNull } from '@/lib/utils/id-parser'
import type { ActionResponse } from '@/types/admin/product'

type CategoryRow = Tables<'categories'>

export interface Category extends CategoryRow {
  parent?: CategoryRow | null
  children?: Category[]
  product_count?: number
}

export interface CategoryFormData {
  name: string
  slug: string
  description?: string
  parent_id?: string | number | null
  is_active: boolean
  display_order: number
  image_url?: string
  seo_title?: string
  seo_description?: string
}

// Form validation schema
const CategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı zorunludur'),
  slug: z.string().min(1, 'URL slug zorunludur'),
  description: z.string().optional(),
  parent_id: z.union([z.string(), z.number()]).transform(val => parseIdOrNull(val)).nullable().optional(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0),
  image_url: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional()
})

// Kategorileri getir
export async function getCategories(): Promise<ActionResponse<Category[]>> {
  try {
    console.log('🔍 [CATEGORIES] getCategories başladı')
    const supabase = await createAdminSupabaseClient()
    console.log('✅ [CATEGORIES] Supabase client oluşturuldu')
    
    // Simple query without complex chaining
    console.log('🔄 [CATEGORIES] Query execute ediliyor...')
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
      
    console.log('📋 [CATEGORIES] Raw kategori data:', { 
      count: data?.length, 
      hasError: !!error,
      errorMsg: error?.message,
      sampleIds: data?.slice(0, 3).map(c => ({ id: c.id, name: c.name }))
    })

    if (error) {
      console.error('❌ [CATEGORIES] Kategori sorgu hatası:', error)
      throw error
    }

    // Kategorileri hiyerarşik yapıya dönüştür
    console.log('🔄 [CATEGORIES] buildCategoryTree başlıyor...')
    const categories = buildCategoryTree(data || [])
    console.log('✅ [CATEGORIES] buildCategoryTree tamamlandı:', {
      count: categories.length,
      sampleIds: categories.slice(0, 3).map(c => ({ id: c.id, name: c.name }))
    })
    
    return { 
      success: true, 
      data: categories,
      message: 'Kategoriler başarıyla yüklendi'
    }
  } catch (error) {
    console.error('💥 Admin kategoriler getirilirken hata:', error)
    return { 
      success: false, 
      error: 'Kategoriler yüklenirken bir hata oluştu' 
    }
  }
}

// Tek kategori getir
export async function getCategory(id: string): Promise<ActionResponse<Category>> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:parent_id(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return { success: false, error: 'Kategori bulunamadı' }

    return { 
      success: true, 
      data: data as Category,
      message: 'Kategori başarıyla yüklendi'
    }
  } catch (error) {
    console.error('Kategori getirilirken hata:', error)
    return { 
      success: false, 
      error: 'Kategori yüklenirken bir hata oluştu' 
    }
  }
}

// Kategori oluştur
export async function createCategory(formData: CategoryFormData): Promise<ActionResponse<Category>> {
  try {
    const validatedFields = CategorySchema.safeParse(formData)
    
    if (!validatedFields.success) {
      return { 
        success: false, 
        error: 'Geçersiz form verisi', 
        errors: validatedFields.error.flatten().fieldErrors 
      }
    }

    const supabase = await createAdminSupabaseClient()
    
    console.log('🖼️ Kategori oluşturma data:', validatedFields.data)
    console.log('🖼️ Image URL:', validatedFields.data.image_url)
    
    const { data, error } = await supabase
      .from('categories')
      .insert(validatedFields.data)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/kategoriler')
    revalidatePath('/kategoriler')
    
    return { 
      success: true, 
      data: data as Category,
      message: 'Kategori başarıyla oluşturuldu'
    }
  } catch (error) {
    console.error('Kategori oluşturulurken hata:', error)
    return { 
      success: false, 
      error: 'Kategori oluşturulurken bir hata oluştu' 
    }
  }
}

// Kategori güncelle
export async function updateCategory(id: string | number, formData: Partial<CategoryFormData>): Promise<ActionResponse<Category>> {
  try {
    console.log('🔄 Kategori güncelleniyor:', { id, formData })
    console.log('🖼️ Güncelleme - Image URL:', formData.image_url)
    const supabase = await createAdminSupabaseClient()
    
    // ID'yi parse et (UUID veya integer)
    const parsedId = parseId(id)
    
    const { data, error } = await supabase
      .from('categories')
      .update(formData)
      .eq('id', parsedId)
      .select()
      .single()

    if (error) {
      console.error('❌ Kategori güncelleme hatası:', error)
      throw error
    }

    console.log('✅ Kategori başarıyla güncellendi')
    revalidatePath('/admin/kategoriler')
    revalidatePath('/kategoriler')
    revalidatePath(`/kategoriler/${formData.slug || id}`)
    
    return { 
      success: true, 
      data: data as Category,
      message: 'Kategori başarıyla güncellendi' 
    }
  } catch (error) {
    console.error('Kategori güncellenirken hata:', error)
    return { 
      success: false, 
      error: 'Kategori güncellenirken bir hata oluştu' 
    }
  }
}

// Kategori sil
export async function deleteCategory(id: string | number): Promise<ActionResponse<null>> {
  try {
    console.log('🗑️ Kategori siliniyor:', id)
    const supabase = await createAdminSupabaseClient()
    const parsedId = parseId(id)
    console.log('🆔 Parsed ID:', parsedId)
    
    // Alt kategorileri kontrol et
    const { data: children, error: childrenError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', parsedId)

    if (childrenError) {
      console.error('❌ Alt kategoriler kontrol hatası:', childrenError)
      throw childrenError
    }

    if (children && children.length > 0) {
      console.log('⚠️ Alt kategoriler var:', children.length)
      return { 
        success: false, 
        error: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.' 
      }
    }

    // Ürünleri kontrol et
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', parsedId)

    if (productsError) {
      console.error('❌ Ürünler kontrol hatası:', productsError)
      throw productsError
    }

    if (products && products.length > 0) {
      console.log('⚠️ Kategoride ürünler var:', products.length)
      return { 
        success: false, 
        error: 'Bu kategoride ürünler var. Önce ürünleri başka bir kategoriye taşıyın.' 
      }
    }

    console.log('✅ Kategori silinebilir, siliniyor...')
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', parsedId)

    if (error) {
      console.error('❌ Kategori silme hatası:', error)
      throw error
    }

    console.log('✅ Kategori başarıyla silindi')
    revalidatePath('/admin/kategoriler')
    revalidatePath('/kategoriler')
    
    return { 
      success: true, 
      data: null,
      message: 'Kategori başarıyla silindi' 
    }
  } catch (error) {
    console.error('❌ Kategori silinirken hata:', error)
    const errorMessage = error instanceof Error ? error.message : 'Kategori silinirken bir hata oluştu'
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

// Slug oluştur
export async function generateSlug(name: string, excludeId?: string | number): Promise<ActionResponse<string>> {
  try {
    const supabase = await createAdminSupabaseClient()
    const baseSlug = createSlug(name)
    let slug = baseSlug
    let counter = 1

    while (true) {
      let query = supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
      
      // Exclude current category if editing
      if (excludeId) {
        const parsedExcludeId = parseId(excludeId)
        query = query.neq('id', parsedExcludeId)
      }
      
      const { data } = await query

      if (!data || data.length === 0) {
        return { 
          success: true, 
          data: slug,
          message: 'Slug başarıyla oluşturuldu'
        }
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  } catch (error) {
    console.error('Slug oluşturulurken hata:', error)
    return { 
      success: false, 
      error: 'Slug oluşturulurken bir hata oluştu',
      data: createSlug(name)
    }
  }
}

// Kategori istatistikleri
export async function getCategoryStats(categoryId: string | number): Promise<ActionResponse<{
  productCount: number
  activeProductCount: number
  subCategoryCount: number
}>> {
  try {
    const supabase = await createAdminSupabaseClient()
    const parsedId = parseId(categoryId)
    
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', parsedId)

    const activeProductResult = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', parsedId)
      .eq('is_active', true)
    
    const { count: activeProductCount } = activeProductResult

    const { data: subCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', parsedId)

    return {
      success: true,
      data: {
        productCount: productCount || 0,
        activeProductCount: activeProductCount || 0,
        subCategoryCount: subCategories?.length || 0
      },
      message: 'İstatistikler başarıyla yüklendi'
    }
  } catch (error) {
    console.error('Kategori istatistikleri alınırken hata:', error)
    return { 
      success: false, 
      error: 'İstatistikler yüklenirken bir hata oluştu' 
    }
  }
}

// Helper functions
function buildCategoryTree(categories: CategoryRow[]): Category[] {
  // Early return for empty array
  if (!categories || categories.length === 0) {
    return []
  }

  // Create map and root array explicitly
  const categoryMap: Map<string, Category> = new Map()
  const rootCategories: Category[] = []

  // First pass: Create all category objects
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    const categoryWithChildren: Category = {
      ...cat,
      children: []
    }
    categoryMap.set(cat.id, categoryWithChildren)
  }

  // Second pass: Build parent-child relationships
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    const category = categoryMap.get(cat.id)
    
    if (!category) continue
    
    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(category)
      } else {
        // Parent not found, treat as root
        rootCategories.push(category)
      }
    } else {
      rootCategories.push(category)
    }
  }

  return rootCategories
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