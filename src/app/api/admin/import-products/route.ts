import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

interface ImportProduct {
  category_name: string
  parent_category?: string
  name: string
  description: string
  price: number
  stock_quantity: number
  images: string[]
}

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function POST(request: NextRequest) {
  const result = await withAdminAuth(async (user) => {
    const body = await request.json()
    const { products } = body as { products: ImportProduct[] }

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz ürün verisi' },
        { status: 400 }
      )
    }

    const supabase = await createAdminSupabaseClient()
    
    let imported = 0
    const errors: string[] = []

    // Önce mevcut kategorileri al
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')

    const categoryMap = new Map<string, { id: string; parent_id: string | null }>()
    existingCategories?.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), { id: cat.id, parent_id: cat.parent_id })
    })

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      
      try {
        let categoryId: string | null = null
        let parentCategoryId: string | null = null

        // Üst kategori varsa işle
        if (product.parent_category?.trim()) {
          const parentCategoryNameLower = product.parent_category.toLowerCase()
          
          if (categoryMap.has(parentCategoryNameLower)) {
            parentCategoryId = categoryMap.get(parentCategoryNameLower)!.id
          } else {
            // Yeni üst kategori oluştur
            const parentCategorySlug = createSlug(product.parent_category)
            const { data: newParentCategory, error: parentCategoryError } = await supabase
              .from('categories')
              .insert({
                name: product.parent_category,
                slug: parentCategorySlug,
                is_active: true,
                parent_id: null
              })
              .select('id')
              .single()

            if (parentCategoryError) {
              // Slug çakışması varsa mevcut kategoriyi bul
              const { data: existingParentCat } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', parentCategorySlug)
                .single()
              
              if (existingParentCat) {
                parentCategoryId = existingParentCat.id
              } else {
                errors.push(`Üst kategori oluşturulamadı: ${product.parent_category} - ${parentCategoryError.message}`)
                continue
              }
            } else {
              parentCategoryId = newParentCategory.id
              categoryMap.set(parentCategoryNameLower, { id: parentCategoryId, parent_id: null })
            }
          }
        }

        // Alt kategori işle
        const categoryNameLower = product.category_name.toLowerCase()
        
        if (categoryMap.has(categoryNameLower)) {
          const existingCategory = categoryMap.get(categoryNameLower)!
          categoryId = existingCategory.id
          
          // Eğer üst kategori belirtilmişse ve mevcut kategorinin üst kategorisi farklıysa güncelle
          if (parentCategoryId && existingCategory.parent_id !== parentCategoryId) {
            await supabase
              .from('categories')
              .update({ parent_id: parentCategoryId })
              .eq('id', categoryId)
          }
        } else {
          // Yeni kategori oluştur
          const categorySlug = createSlug(product.category_name)
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              name: product.category_name,
              slug: categorySlug,
              is_active: true,
              parent_id: parentCategoryId
            })
            .select('id')
            .single()

          if (categoryError) {
            // Slug çakışması varsa mevcut kategoriyi bul
            const { data: existingCat } = await supabase
              .from('categories')
              .select('id')
              .eq('slug', categorySlug)
              .single()
            
            if (existingCat) {
              categoryId = existingCat.id
            } else {
              errors.push(`Kategori oluşturulamadı: ${product.category_name} - ${categoryError.message}`)
              continue
            }
          } else {
            categoryId = newCategory.id
            categoryMap.set(categoryNameLower, { id: categoryId, parent_id: parentCategoryId })
          }
        }

        // Görsel array'ini filtrele (boş değerleri çıkar)
        const images = product.images
          .filter(img => img && img.trim())
          .map(img => img.trim())

        // Eğer hiç görsel yoksa varsayılan görsel ekle
        if (images.length === 0) {
          images.push('https://catkapinda.com.tr/placeholder-product.svg')
        }

        // Ürün slug'ı oluştur
        const productSlug = createSlug(product.name)
        
        // Unique slug oluştur
        let finalSlug = productSlug
        let counter = 1
        while (true) {
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('slug', finalSlug)
            .single()
          
          if (!existingProduct) break
          
          finalSlug = `${productSlug}-${counter}`
          counter++
        }

        // Ürünü ekle
        const { error: productError } = await supabase
          .from('products')
          .insert({
            name: product.name,
            slug: finalSlug,
            description: product.description || '',
            price: product.price,
            stock_quantity: product.stock_quantity,
            category_id: categoryId,
            images: images,
            is_active: true,
            is_featured: false
          })

        if (productError) {
          errors.push(`Ürün eklenemedi: ${product.name} - ${productError.message}`)
        } else {
          imported++
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
        errors.push(`Ürün işlenemedi: ${product.name} - ${errorMessage}`)
      }
    }

    const result: ImportResult = {
      success: true,
      imported,
      errors
    }

    return NextResponse.json(result)
  })

  // Eğer withAdminAuth result döndürmediyse (auth başarısız), varsayılan response döndür
  if (!result) {
    return NextResponse.json(
      { success: false, error: 'Yetkisiz erişim' },
      { status: 401 }
    )
  }

  return result
} 