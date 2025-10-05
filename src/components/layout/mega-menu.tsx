'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, Package, Star, Tag } from 'lucide-react'
import { SafeImage } from '@/components/ui/safe-image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getCategoryImage } from '@/lib/utils/category-images'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  slug: string
  image: string
  productCount: number
  subCategories: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  slug: string
  productCount: number
}

interface MegaMenuColumn {
  title: string
  categories: Category[]
}

interface MegaMenuProps {
  className?: string
}

export function MegaMenu({ className }: MegaMenuProps) {
  // ✅ TÜM HOOK'LAR EN ÜSTTE TANIMLANMALI
  const [categories, setCategories] = useState<MegaMenuColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [activeColumn, setActiveColumn] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Kategorileri Supabase'den çek
  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient()
        
        // Ana kategorileri çek
        const { data: mainCategories, error: mainError } = await supabase
          .from('categories')
          .select('id, name, slug, image_url')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('name')

        if (mainError) {
          console.error('Ana kategoriler alınamadı:', mainError)
          return
        }

        // Her ana kategori için alt kategorileri çek
        const categoriesWithSubs = await Promise.all(
          mainCategories.map(async (mainCat) => {
            const { data: subCategories } = await supabase
              .from('categories')
              .select('id, name, slug, image_url')
              .eq('parent_id', mainCat.id)
              .eq('is_active', true)
              .order('name')

            // Alt kategoriler için ürün sayılarını al
            const subCategoriesWithCount = await Promise.all(
              (subCategories || []).map(async (sub) => {
                const { count } = await supabase
                  .from('products')
                  .select('*', { count: 'exact', head: true })
                  .eq('category_id', sub.id)
                  .eq('is_active', true)

                return {
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  productCount: count || 0
                }
              })
            )

            // Ana kategori için doğrudan ürün sayısını al
            const { count: directCount } = await supabase
              .from('products') 
              .select('*', { count: 'exact', head: true })
              .eq('category_id', mainCat.id)
              .eq('is_active', true)

            // Alt kategorilerdeki toplam ürün sayısını hesapla
            const subCategoryTotalCount = subCategoriesWithCount.reduce((total, sub) => total + sub.productCount, 0)
            
            // Ana kategori toplam ürün sayısı = doğrudan ürünler + alt kategorilerdeki ürünler
            const totalProductCount = (directCount || 0) + subCategoryTotalCount

            return {
              id: mainCat.id,
              name: mainCat.name,
              slug: mainCat.slug,
              image: mainCat.image_url || getCategoryImage(mainCat.slug),
              productCount: totalProductCount,
              subCategories: subCategoriesWithCount
            }
          })
        )

        // Kategorileri gruplara böl - aktif kategorilere göre dinamik
        const megaMenuData: MegaMenuColumn[] = [
          {
            title: 'Elektronik & Teknoloji',
            categories: categoriesWithSubs.filter(cat => 
              cat.slug.includes('elektronik') || 
              cat.slug.includes('teknoloji') ||
              cat.slug.includes('bilgisayar') ||
              cat.slug.includes('telefon')
            )
          },
          {
            title: 'Ateşleyici & Çakmak',
            categories: categoriesWithSubs.filter(cat => 
              cat.slug.includes('atesleyici') || 
              cat.slug.includes('cakmak') ||
              cat.slug.includes('lighter')
            )
          },
          {
            title: 'Spor & Outdoor',
            categories: categoriesWithSubs.filter(cat => 
              cat.slug.includes('spor') || 
              cat.slug.includes('outdoor') ||
              cat.slug.includes('kamp') ||
              cat.slug.includes('fitness')
            )
          },
          {
            title: 'Diğer Kategoriler',
            categories: categoriesWithSubs.filter(cat => 
              !cat.slug.includes('elektronik') && 
              !cat.slug.includes('teknoloji') &&
              !cat.slug.includes('bilgisayar') &&
              !cat.slug.includes('telefon') &&
              !cat.slug.includes('atesleyici') && 
              !cat.slug.includes('cakmak') &&
              !cat.slug.includes('lighter') &&
              !cat.slug.includes('spor') && 
              !cat.slug.includes('outdoor') &&
              !cat.slug.includes('kamp') &&
              !cat.slug.includes('fitness')
            )
          }
        ].filter(column => column.categories.length > 0) // Boş kolonları kaldır

        setCategories(megaMenuData)
      } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveColumn(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = () => {
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    setIsOpen(false)
    setActiveColumn(null)
  }

  // Loading state'i burada kontrol ediyoruz, hook'lardan sonra
  if (loading) {
    return (
      <div className="w-full bg-white border-t shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Kategoriler yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={menuRef}
      className={cn("relative", className)}
    >
      {/* Hover Area - Trigger + Dropdown'ı kapsayan alan */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {/* Trigger Button */}
        <button
          className="flex items-center gap-2 h-10 px-4 py-2 text-base font-semibold uppercase transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          Kategoriler
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Mega Menu Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 w-screen max-w-6xl bg-background border rounded-lg shadow-lg z-50">
            <div className="flex">
              {/* Category Columns */}
              <div className={cn(
                "flex-1 grid gap-0",
                categories.length === 1 && "grid-cols-1",
                categories.length === 2 && "grid-cols-2", 
                categories.length === 3 && "grid-cols-3",
                categories.length >= 4 && "grid-cols-4"
              )}>
                {categories.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    className={cn(
                      "p-6 border-r last:border-r-0 min-h-[400px]",
                      columnIndex % 2 === 0 ? "bg-muted/20" : "bg-background"
                    )}
                    onMouseEnter={() => setActiveColumn(columnIndex)}
                  >
                    <h3 className="font-semibold text-sm mb-4 text-primary sticky top-0 bg-inherit pb-2 border-b border-border/50">
                      {column.title}
                      {column.categories.reduce((total, cat) => total + cat.productCount, 0) > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {column.categories.reduce((total, cat) => total + cat.productCount, 0)} ürün
                        </Badge>
                      )}
                    </h3>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto">
                      {column.categories.length > 0 ? (
                        column.categories.map((category) => (
                          <div key={category.id} className="group">
                            <Link
                              href={`/kategoriler/${category.slug}`}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                            >
                              {category.image && (
                                <SafeImage
                                  src={category.image}
                                  alt={category.name}
                                  width={40}
                                  height={40}
                                  className="rounded-md object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                                    {category.name}
                                  </span>
                                  {category.productCount > 0 && (
                                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                                      {category.productCount}
                                    </Badge>
                                  )}
                                </div>
                                {category.subCategories && category.subCategories.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {category.subCategories.slice(0, 2).map(sub => sub.name).join(', ')}
                                    {category.subCategories.length > 2 && '...'}
                                  </div>
                                )}
                              </div>
                              <Package className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </Link>
                            
                            {/* Subcategories */}
                            {category.subCategories && category.subCategories.length > 0 && (
                              <div className="ml-12 mt-2 space-y-1">
                                {category.subCategories.slice(0, 4).map((subCategory) => (
                                  <Link
                                    key={subCategory.id}
                                    href={`/kategoriler/${subCategory.slug}`}
                                    className="flex items-center justify-between text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                                  >
                                    <span className="truncate">{subCategory.name}</span>
                                    {subCategory.productCount > 0 && (
                                      <span className="text-xs flex-shrink-0 ml-2">
                                        ({subCategory.productCount})
                                      </span>
                                    )}
                                  </Link>
                                ))}
                                {category.subCategories.length > 4 && (
                                  <Link
                                    href={`/kategoriler/${category.slug}`}
                                    className="text-xs text-primary hover:underline py-1 block"
                                  >
                                    +{category.subCategories.length - 4} kategori daha
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Bu grupta kategori bulunmuyor</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <Link
                  href="/kategoriler"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Tüm Kategorileri Görüntüle
                </Link>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{categories.reduce((total, col) => total + col.categories.reduce((catTotal, cat) => catTotal + cat.productCount, 0), 0)}+ Ürün</span>
                  <span>•</span>
                  <span>Hızlı Teslimat</span>
                  <span>•</span>
                  <span>Güvenli Alışveriş</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}