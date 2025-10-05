import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { Category } from '@/types/admin/product'
import { parseId, idToString } from '@/lib/utils/id-parser'

export class CategoryService {
  private supabase: any = null

  // Supabase client'ını lazy olarak initialize et
  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createAdminSupabaseClient()
    }
    return this.supabase
  }

  // Tüm kategorileri getir (hiyerarşik yapıda)
  async getCategories(includeInactive = false): Promise<Category[]> {
    try {
      console.log('Kategoriler getirilecek...')
      
      const supabase = await this.getSupabase()
      const query = supabase
        .from('categories')
        .select(`
          *,
          children:categories!parent_id(*)
        `)
        .is('parent_id', null)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (!includeInactive) {
        query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Kategoriler getirilirken hata:', error)
        throw new Error(error.message)
      }
      
      console.log('Kategoriler başarıyla getirildi:', data?.length)
      return this.transformCategories(data || [])
    } catch (error) {
      console.error('Kategoriler getirilirken hata:', error)
      throw error
    }
  }

  // Tek bir kategori getir
  async getCategory(id: number): Promise<Category | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:categories!parent_id(*),
        children:categories!parent_id(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  // Yeni kategori oluştur
  async createCategory(category: Partial<Category>): Promise<Category> {
    console.log('Creating category:', category)
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: category.slug,
        description: category.description,
        image_url: category.imageUrl,
        parent_id: category.parentId,
        is_active: category.isActive ?? true
      })
      .select()
      .single()

    console.log('Supabase response:', { data, error })

    if (error) {
      console.error('Category create error details:', {
        errorObject: error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stringified: JSON.stringify(error, null, 2)
      })
      console.error('Input data was:', {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image_url: category.imageUrl,
        parent_id: category.parentId,
        is_active: category.isActive ?? true
      })
      throw new Error(`Kategori oluşturma hatası: ${error.message || 'Bilinmeyen hata'} (Kod: ${error.code || 'Yok'})`)
    }
    
    console.log('Category created successfully:', data)
    return data
  }

  // Kategori güncelle
  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: updates.name,
        slug: updates.slug,
        description: updates.description,
        image_url: updates.imageUrl,
        parent_id: updates.parentId,
        is_active: updates.isActive
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  // Kategori sil
  async deleteCategory(id: number): Promise<void> {
    // Önce alt kategorileri kontrol et
    const supabase = await this.getSupabase()
    const { data: children } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', id)

    if (children && children.length > 0) {
      throw new Error('Bu kategorinin alt kategorileri var. Önce onları silmelisiniz.')
    }

    // Kategoriye ait ürünleri kontrol et
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)

    if (products && products.length > 0) {
      throw new Error('Bu kategoriye ait ürünler var. Önce ürünleri başka kategoriye taşıyın.')
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  // Kategori sıralamasını güncelle
  async updateCategoryOrder(categories: { id: number; order: number }[]): Promise<void> {
    const supabase = await this.getSupabase()
    const updates = categories.map(cat => ({
      id: cat.id,
      display_order: cat.order
    }))

    const { error } = await supabase
      .from('categories')
      .upsert(updates)

    if (error) throw new Error(error.message)
  }

  // Slug oluştur ve kontrol et
  async generateSlug(name: string, excludeId?: number): Promise<string> {
    const supabase = await this.getSupabase()
    const baseSlug = this.createSlug(name)
    let slug = baseSlug
    let counter = 1

    while (true) {
      const query = supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)

      if (excludeId) {
        query.neq('id', excludeId)
      }

      const { data } = await query

      if (!data || data.length === 0) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  // Kategori istatistikleri
  async getCategoryStats(categoryId: number): Promise<{
    productCount: number
    activeProductCount: number
    totalValue: number
  }> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('products')
      .select('price, stock_quantity, is_active')
      .eq('category_id', categoryId)

    if (error) throw new Error(error.message)

    const stats = {
      productCount: data?.length || 0,
      activeProductCount: data?.filter(p => p.is_active).length || 0,
      totalValue: data?.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0) || 0
    }

    return stats
  }

  // Yardımcı fonksiyonlar
  private transformCategories(data: (Omit<Category, 'children' | 'createdAt' | 'updatedAt'> & { children: (Omit<Category, 'children' | 'createdAt' | 'updatedAt'> & { children: [], created_at: string, updated_at: string })[], created_at: string, updated_at: string })[]): Category[] {
    return data.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.image_url,
      parentId: cat.parent_id,
      children: cat.children ? this.transformCategories(cat.children) : [],
      isActive: cat.is_active,
      createdAt: new Date(cat.created_at),
      updatedAt: new Date(cat.updated_at)
    }))
  }

  private createSlug(text: string): string {
    const turkishChars: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    }

    return text
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishChars[char] || char)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

export const categoryService = new CategoryService() 