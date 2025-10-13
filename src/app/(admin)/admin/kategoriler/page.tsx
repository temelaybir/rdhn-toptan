'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  ChevronRight,
  ChevronDown,
  Edit, 
  Trash2,
  FolderOpen,
  Folder,
  MoreHorizontal,
  Eye,
  Package,
  TrendingUp,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react'
import { Category } from '@/types/admin/product'
import { getCategories, deleteCategory } from '@/app/actions/admin/category-actions'
import { CategoryForm } from '@/components/admin/categories/category-form'
import { CategoryExportDialog } from '@/components/admin/categories/category-export-dialog'
import { CategoryImportDialog } from '@/components/admin/categories/category-import-dialog'
import { useActionHandler } from '@/hooks/use-action-handler'
import { SafeImage } from '@/components/ui/safe-image'

interface CategoryStats {
  productCount: number;
  activeProductCount: number;
  totalValue: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [categoryStats, setCategoryStats] = useState<Map<string, CategoryStats>>(new Map())
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const formatPrice = (price: number) => `₺${price.toFixed(2)}`
  const { execute: executeDelete } = useActionHandler({
    successMessage: 'Kategori başarıyla silindi',
    onSuccess: () => loadCategories()
  })

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
        
        // İlk kategoriyi genişlet
        if (result.data.length > 0) {
          setExpandedCategories(new Set([result.data[0].id.toString()]))
        }

        // İstatistikleri yükle (kategori stats henüz action yok, geçici kapatıldı)
        // for (const category of result.data) {
        //   loadCategoryStats(category.id)
        // }
      } else {
        console.error('Kategoriler yüklenemedi:', result.error)
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const loadCategoryStats = async (categoryId: string) => {
    try {
      // const stats = await categoryService.getCategoryStats(categoryId)
      // setCategoryStats(prev => new Map(prev).set(categoryId, stats))
    } catch {
      console.error('İstatistikler yüklenemedi')
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleCreateCategory = () => {
    setSelectedCategory(null)
    setIsFormDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setIsFormDialogOpen(true)
  }

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    await executeDelete(deleteCategory(categoryToDelete.id))
    setIsDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  const handleFormSuccess = () => {
    // Kategorileri yeniden yükle
    loadCategories()
    
    // Kısa bir gecikme sonra dialog'u kapat ve selectedCategory'yi temizle
    // Bu sayede kullanıcı güncellemenin başarılı olduğunu görebilir
    setTimeout(() => {
      setIsFormDialogOpen(false)
      setSelectedCategory(null)
    }, 1000)
  }

  const handleFormError = (error: string) => {
    console.error('Category form error:', error)
  }

  // Kategori ağacını filtrele
  const filterCategories = (categories: Category[]): Category[] => {
    const result: Category[] = []
    const searchLower = searchTerm.toLowerCase()
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      const matchesSearch = category.name.toLowerCase().includes(searchLower)
      
      // Check if any children match
      let childrenMatch = false
      if (category.children && category.children.length > 0) {
        for (let j = 0; j < category.children.length; j++) {
          if (category.children[j].name.toLowerCase().includes(searchLower)) {
            childrenMatch = true
            break
          }
        }
      }
      
      if (matchesSearch || childrenMatch) {
        result.push({
          ...category,
          children: category.children ? filterCategories(category.children) : []
        })
      }
    }
    
    return result
  }

  const filteredCategories = filterCategories(categories)

  // İstatistikleri hesapla
  let totalCategories = 0
  for (let i = 0; i < categories.length; i++) {
    totalCategories += 1
    if (categories[i].children) {
      totalCategories += categories[i].children!.length
    }
  }

  let totalProducts = 0
  const statsArray = Array.from(categoryStats.values())
  for (let i = 0; i < statsArray.length; i++) {
    if (statsArray[i] && statsArray[i].productCount) {
      totalProducts += statsArray[i].productCount
    }
  }

  // Helper: Render children categories
  const renderChildren = (children: Category[], level: number) => {
    const elements = []
    for (let i = 0; i < children.length; i++) {
      elements.push(renderCategory(children[i], level))
    }
    return elements
  }

  const renderCategory = (category: Category, level = 0) => {
    const isExpanded = expandedCategories.has(category.id.toString())
    const hasChildren = category.children && category.children.length > 0
    const stats = categoryStats.get(category.id.toString())

    return (
      <div key={category.id}>
        <div className={`group hover:bg-accent/50 transition-colors ${level > 0 ? 'ml-8' : ''}`}>
          <div className="flex items-center gap-3 p-4">
            {hasChildren && (
              <button
                onClick={() => toggleCategory(category.id.toString())}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            
            {!hasChildren && <div className="w-6" />}
            
            {/* Kategori Görseli */}
            {category.image_url ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border">
                <SafeImage
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              isExpanded || hasChildren ? (
                <FolderOpen className="h-5 w-5 text-primary" />
              ) : (
                <Folder className="h-5 w-5 text-muted-foreground" />
              )
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{category.name}</h3>
                {!category.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Pasif
                  </Badge>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {stats && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{stats.productCount} ürün</span>
                  </div>
                  {stats.totalValue > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatPrice(stats.totalValue)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    Görüntüle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteCategory(category)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && category.children && (
          <div className="border-l ml-6">
            {renderChildren(category.children, level + 1)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kategoriler</h1>
          <p className="text-muted-foreground">
            Ürün kategorilerini yönetin ve organize edin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Dışa Aktar
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> İçe Aktar
          </Button>
          <Button onClick={handleCreateCategory}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Kategori
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kategori
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              {categories.length} ana, {totalCategories - categories.length} alt kategori
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Ürün
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Tüm kategorilerde
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktif Kategoriler
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                let count = 0
                for (let i = 0; i < categories.length; i++) {
                  if (categories[i].isActive) count++
                }
                return count
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Sitede görünür
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Boş Kategoriler
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                let count = 0
                const values = Array.from(categoryStats.values())
                for (let i = 0; i < values.length; i++) {
                  if (values[i]?.productCount === 0) count++
                }
                return count
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ürün eklenmemiş
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kategori Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Hiyerarşisi</CardTitle>
          <CardDescription>
            Kategorileri düzenleyin ve alt kategoriler oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Arama */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Kategori Ağacı */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kategori eklenmemiş'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateCategory} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> İlk Kategoriyi Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {renderChildren(filteredCategories, 0)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kategori Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-none w-[70vw] h-[85vh] max-h-[85vh] overflow-y-auto p-6 rounded-lg border shadow-2xl min-w-[800px] min-h-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={selectedCategory || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormDialogOpen(false)}
            onError={handleFormError}
          />
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.name} kategorisi silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <CategoryExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />

      {/* Import Dialog */}
      <CategoryImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={loadCategories}
      />
    </div>
  )
}