import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CategoryPageClient from './category-page-client'

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = await createClient()
  const resolvedParams = await params

  try {
    // Kategori bilgisini al
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', resolvedParams.slug)
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      console.error('Kategori bulunamadı:', categoryError)
      notFound()
    }

    // Alt kategorileri al
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('parent_id', category.id)
      .eq('is_active', true)
      .order('name')

    if (subcategoriesError) {
      console.error('Alt kategoriler alınamadı:', subcategoriesError)
    }

    // Ürünleri al - hem ana kategoriden hem de alt kategorilerinden
    let allProducts: any[] = []

    // Ana kategorideki doğrudan ürünleri al
    const { data: directProducts, error: directProductsError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (directProductsError) {
      console.error('Doğrudan ürünler alınamadı:', directProductsError)
    } else {
      allProducts = directProducts || []
    }

    // Alt kategorilerdeki ürünleri al (sadece ana kategori ise)
    if (subcategories && subcategories.length > 0) {
      const subcategoryIds = subcategories.map(sub => sub.id)
      const { data: subcategoryProducts, error: subcategoryProductsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .in('category_id', subcategoryIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (subcategoryProductsError) {
        console.error('Alt kategori ürünleri alınamadı:', subcategoryProductsError)
      } else {
        allProducts = [...allProducts, ...(subcategoryProducts || [])]
      }
    }

    // Tüm kategorileri al (breadcrumb için)
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('is_active', true)
      .order('name')

    if (categoriesError) {
      console.error('Kategoriler alınamadı:', categoriesError)
    }

    return (
      <CategoryPageClient 
        category={category}
        products={allProducts}
        subcategories={subcategories || []}
      />
    )
  } catch (error) {
    console.error('Kategori sayfası hatası:', error)
    notFound()
  }
} 