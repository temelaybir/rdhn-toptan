import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { Product, ProductFormData, ProductFilters, Category } from '@/types/admin/product'
import { Tables } from '@/types/supabase'
import { parseId, idToString } from '@/lib/utils/id-parser'

type ProductRow = Tables<'products'> & {
  category: Tables<'categories'> | null
  variants: Tables<'product_variants'>[]
}

export class ProductService {
  private supabase: any = null

  // Supabase client'ınını lazy olarak initialize et
  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createAdminSupabaseClient()
    }
    return this.supabase
  }

  // Ürün listesi getir
  async getProducts(filters: ProductFilters = {}): Promise<{ products: Product[]; total: number }> {
    const supabase = await this.getSupabase()
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
    if (filters.featured !== undefined) {
      query = query.eq('is_featured', filters.featured)
    }
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) query = query.gte('price', filters.priceRange.min)
      if (filters.priceRange.max !== undefined) query = query.lte('price', filters.priceRange.max)
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    // Sıralama
    const sortColumn = filters.sortBy || 'created_at'
    
    // CamelCase'den snake_case'e çevir
    const columnMapping: { [key: string]: string } = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'name': 'name',
      'price': 'price', 
      'stock': 'stock_quantity'
    }
    
    const dbSortColumn = columnMapping[sortColumn] || sortColumn
    const sortOrder = filters.sortOrder || 'desc'
    query = query.order(dbSortColumn, { ascending: sortOrder === 'asc' })

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    return {
      products: this.transformProducts(data || []),
      total: count || 0
    }
  }

  // Tek ürün getir
  async getProduct(id: number): Promise<Product | null> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data ? this.transformProduct(data) : null
  }

  // Yeni ürün oluştur
  async createProduct(formData: ProductFormData): Promise<Product> {
    const supabase = await this.getSupabase()
    const { variants, images, ...productData } = formData

    // Slug boşsa otomatik oluştur
    let slug = productData.slug
    if (!slug || slug.trim() === '') {
      slug = await this.generateSlug(productData.name)
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        slug: slug,
        description: productData.description,
        short_description: productData.shortDescription,
        price: productData.price,
        compare_price: productData.comparePrice,
        cost_price: productData.costPrice,
        stock_quantity: productData.stockQuantity,
        track_stock: productData.trackStock,
        allow_backorders: productData.allowBackorders,
        low_stock_threshold: productData.lowStockThreshold,
        sku: productData.sku,
        barcode: productData.barcode,
        weight: productData.weight,
        dimensions: productData.dimensions ? JSON.stringify(productData.dimensions) : null,
        category_id: productData.categoryId,
        is_active: productData.isActive,
        is_featured: productData.isFeatured,
        tags: productData.tags,
        images: images?.map(img => img.url || '').filter(Boolean) || [],
        requires_shipping: productData.shipping?.requiresShipping,
        shipping_class: productData.shipping?.shippingClass,
      })
      .select()
      .single()

    if (productError) throw new Error(productError.message)

    if (productData.hasVariants && variants && variants.length > 0) {
      const variantData = variants.map(variant => ({
        product_id: product.id,
        ...variant
      }))

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantData)

      if (variantError) throw new Error(variantError.message)
    }

    const newProduct = await this.getProduct(product.id)
    if (!newProduct) throw new Error("Oluşturulan ürün bulunamadı.")
    return newProduct
  }

  // Ürün güncelle
  async updateProduct(id: number, formData: Partial<ProductFormData>): Promise<Product> {
    const supabase = await this.getSupabase()
    const { variants, images, ...productData } = formData

    // Slug kontrolü - eğer slug boşsa ve name varsa otomatik oluştur
    let slug = productData.slug
    if (productData.name && (!slug || slug.trim() === '')) {
      slug = await this.generateSlug(productData.name, id)
    }

    const updateData: Partial<Tables<'products'>> = {
      ...productData,
      slug: slug,
      short_description: productData.shortDescription,
      compare_price: productData.comparePrice,
      cost_price: productData.costPrice,
      stock_quantity: productData.stockQuantity,
      track_stock: productData.trackStock,
      allow_backorders: productData.allowBackorders,
      low_stock_threshold: productData.lowStockThreshold,
      category_id: productData.categoryId,
      is_active: productData.isActive,
      is_featured: productData.isFeatured,
      images: images?.map(img => img.url || '').filter(Boolean) || [],
      requires_shipping: productData.shipping?.requiresShipping,
      shipping_class: productData.shipping?.shippingClass,
    }

    const { error: productError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)

    if (productError) throw new Error(productError.message)

    if (variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', id)
      if (variants.length > 0) {
        const variantData = variants.map(variant => ({
          product_id: id,
          ...variant
        }))
        const { error: variantError } = await supabase.from('product_variants').insert(variantData)
        if (variantError) throw new Error(variantError.message)
      }
    }

    const updatedProduct = await this.getProduct(id)
    if (!updatedProduct) throw new Error("Güncellenen ürün bulunamadı.")
    return updatedProduct
  }

  // Ürün sil
  async deleteProduct(id: number): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  // Slug oluştur
  async generateSlug(name: string, excludeId?: number): Promise<string> {
    const supabase = await this.getSupabase()
    const baseSlug = this.createSlug(name)
    let slug = baseSlug
    let counter = 1
    while (true) {
      const query = supabase.from('products').select('id').eq('slug', slug)
      if (excludeId) query.neq('id', excludeId)
      const { data } = await query
      if (!data || data.length === 0) return slug
      slug = `${baseSlug}-${counter++}`
    }
  }

  // SKU kontrol
  async checkSKU(sku: string, excludeId?: number): Promise<boolean> {
    const supabase = await this.getSupabase()
    const query = supabase.from('products').select('id').eq('sku', sku)
    if (excludeId) query.neq('id', excludeId)
    const { data } = await query
    return !data || data.length === 0
  }

  // Yardımcı fonksiyonlar
  private transformProducts(data: ProductRow[]): Product[] {
    return data.map(item => this.transformProduct(item))
  }

  private transformProduct(data: ProductRow): Product {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.short_description,
      price: data.price,
      comparePrice: data.compare_price,
      costPrice: data.cost_price,
      stockQuantity: data.stock_quantity,
      trackStock: data.track_stock,
      allowBackorders: data.allow_backorders,
      lowStockThreshold: data.low_stock_threshold,
      sku: data.sku,
      barcode: data.barcode,
      weight: data.weight,
      dimensions: data.dimensions,
      categoryId: data.category_id,
      category: data.category as Category,
      isActive: data.is_active,
      isFeatured: data.is_featured,
      tags: data.tags || [],
      images: data.images?.map((url: string, index: number) => ({
        id: index + 1, // Generate sequential number ID for images
        url,
        alt: data.name,
        position: index,
        isMain: index === 0
      })) || [],
      variants: (data.variants || []).map(v => ({ ...v })),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      shipping: {
        requiresShipping: data.requires_shipping ?? true,
        shippingClass: data.shipping_class as 'standard' | 'fragile' | 'oversized' ?? 'standard'
      }
    }
  }

  private createSlug(text: string): string {
    const turkishChars: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    }
    return text.toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishChars[char] || char)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

export const productService = new ProductService() 