import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductsClient from './products-client'

async function getProducts() {
  const supabase = await createClient()
  
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Ürünler yüklenirken hata:', error)
    return []
  }

  return products || []
}

async function getCategories() {
  const supabase = await createClient()
  
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Kategoriler yüklenirken hata:', error)
    return []
  }

  return categories || []
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Tüm Ürünler</h1>
        <p className="text-muted-foreground">
          {products.length} ürün bulundu
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center items-center min-h-64">Yükleniyor...</div>}>
        <ProductsClient products={products} categories={categories} />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Tüm Ürünler - RDHN Commerce',
  description: 'Geniş ürün yelpazemiz ile ihtiyacınız olan her şeyi bulun. Kaliteli ürünler, uygun fiyatlar.',
} 