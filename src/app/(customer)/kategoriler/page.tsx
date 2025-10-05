'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ShoppingBag, 
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { getCategoryImage } from '@/lib/utils/category-images'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string | null
  image_url?: string
  productCount?: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('name')

        if (error) {
          console.error('❌ Kategoriler alınamadı:', error)
          return
        }

        // Her kategori için ürün sayısını hesapla (ana kategori + alt kategorilerdeki ürünler)
        const categoriesWithStats = await Promise.all(
          data.map(async (cat) => {
            // Ana kategorideki doğrudan ürünleri say
            const { count: directCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', cat.id)
              .eq('is_active', true)

            // Alt kategorileri al
            const { data: subCategories } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', cat.id)
              .eq('is_active', true)

            // Alt kategorilerdeki ürünleri say
            let subCategoryCount = 0
            if (subCategories && subCategories.length > 0) {
              const subCategoryIds = subCategories.map(sub => sub.id)
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .in('category_id', subCategoryIds)
                .eq('is_active', true)
              
              subCategoryCount = count || 0
            }

            const totalProductCount = (directCount || 0) + subCategoryCount

            return {
              ...cat,
              productCount: totalProductCount,
              description: `${cat.name} kategorisinde ${totalProductCount} ürün`
            }
          })
        )

        setCategories(categoriesWithStats)
      } catch (error) {
        console.error('💥 Kategoriler yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Kategoriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Kategoriler</span>
        </nav>
        
        <h1 className="text-3xl font-bold mb-2">Tüm Kategoriler</h1>
        <p className="text-muted-foreground">
          {categories.length} kategori bulundu
        </p>
      </div>

      {/* Kategoriler Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Henüz kategori yok</h3>
          <p className="text-muted-foreground mb-4">
            Kategoriler eklendikçe burada görünecek.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/kategoriler/${category.slug}`}
              className="group touch-manipulation cursor-pointer"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] touch-manipulation">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={category.image_url || getCategoryImage(category.slug)}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2 pointer-events-none">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Alt Bilgi */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aradığınız kategoriyi bulamadınız mı?{' '}
          <Link href="/arama" className="text-primary hover:underline">
            Arama yapın
          </Link>{' '}
          veya{' '}
          <Link href="/iletisim" className="text-primary hover:underline">
            bizimle iletişime geçin
          </Link>
        </p>
      </div>
    </div>
  )
} 