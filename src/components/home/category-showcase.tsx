'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SafeImage } from '@/components/ui/safe-image'
import { getCategoryImage } from '@/lib/utils/category-images'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  image: string
  link: string
  productCount: number
  isPopular?: boolean
}

export function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Kategorileri Supabase'den çek
  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient()
        
        const { data: mainCategories, error } = await supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('name')
          .limit(8) // İlk 8 kategoriyi al

        if (error) {
          console.error('❌ Ana sayfa kategoriler alınamadı:', error)
          return
        }

        // Her ana kategori için ürün sayılarını hesapla (ana kategori + alt kategorilerdeki ürünler)
        const categoriesWithCounts = await Promise.all(
          mainCategories.map(async (cat, index) => {
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
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              image: cat.image_url || getCategoryImage(cat.slug),
              link: `/kategoriler/${cat.slug}`,
              productCount: totalProductCount,
              isPopular: index < 3 // İlk 3 kategoriyi popüler olarak işaretle
            }
          })
        )

        setCategories(categoriesWithCounts)
      } catch (error) {
        console.error('💥 Kategori yükleme hatası:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-64 mx-auto"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Package2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          Kategoriler
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Aradığınız ürünleri kolayca bulun
        </p>
      </div>

      {/* Categories Grid - Mobil Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            href={category.link}
            className="group touch-manipulation cursor-pointer"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] md:group-hover:scale-105 bg-gradient-to-br from-background to-muted/30 rounded-2xl touch-manipulation">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  {/* Category Image */}
                  <SafeImage
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110 rounded-2xl"
                  />
                  
                  {/* Gradient Overlay - Mobilde daha soft */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent rounded-2xl pointer-events-none" />
                  
                  {/* Popular Badge - Mobilde küçük */}
                  {category.isPopular && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full pointer-events-none"
                    >
                      <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                      Popüler
                    </Badge>
                  )}
                  
                  {/* Category Info - Mobilde optimize edilmiş */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 pointer-events-none">
                    <h3 className="text-white font-bold text-sm md:text-lg lg:text-xl mb-1 md:mb-2 group-hover:text-primary-foreground transition-colors drop-shadow-lg leading-tight">
                      {category.name}
                    </h3>
                    {category.productCount > 0 && (
                      <p className="text-white/90 text-xs md:text-sm font-medium drop-shadow-md">
                        {category.productCount} ürün
                      </p>
                    )}
                  </div>
                  
                  {/* Hover Arrow - Mobilde gizli */}
                  <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Mobil Touch Indicator */}
                  <div className="md:hidden absolute bottom-2 right-2 opacity-70 pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                      <ArrowRight className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* View All Categories Button */}
      <div className="text-center pt-4">
        <Button 
          variant="outline" 
          size="lg" 
          asChild
          className="bg-background hover:bg-muted border-2 px-8"
        >
          <Link href="/kategoriler">
            Tüm Kategorileri Gör
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}