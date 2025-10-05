'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Loader2, 
  RefreshCw, 
  Search, 
  Folder,
  FolderOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react'

interface TrendyolCategory {
  id: number
  name: string
  parentId?: number
  subCategories?: TrendyolCategory[]
}

interface CategoryResponse {
  success: boolean
  message: string
  categories?: TrendyolCategory[]
  total?: number
  details?: any
}

export default function KategorilerPage() {
  const [categories, setCategories] = useState<TrendyolCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<TrendyolCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [lastFetch, setLastFetch] = useState<string>('')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [searchTerm, categories])

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      // Kategorileri canlı ortamdan çek
      const response = await fetch('/api/trendyol/test/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: 'production', // Canlı ortam
          mock_mode: false
        })
      })

      const result: CategoryResponse = await response.json()
      
      if (result.success && result.details?.sample_data) {
        const categoryData = Array.isArray(result.details.sample_data) 
          ? result.details.sample_data 
          : []
        
        setCategories(categoryData)
        setLastFetch(new Date().toLocaleString('tr-TR'))
        toast.success(`${categoryData.length} kategori yüklendi`)
      } else {
        // Eğer gerçek API'den veri gelmezse mock data kullan
        const mockCategories = await loadMockCategories()
        setCategories(mockCategories)
        toast.info('Demo kategoriler yüklendi (API\'den veri alınamadı)')
      }
    } catch (error) {
      console.error('Kategori yükleme hatası:', error)
      
      // Hata durumunda mock data kullan
      const mockCategories = await loadMockCategories()
      setCategories(mockCategories)
      toast.error('Kategori yüklenirken hata oluştu, demo veriler gösteriliyor')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMockCategories = async (): Promise<TrendyolCategory[]> => {
    // Trendyol benzeri kategori yapısı
    return [
      {
        id: 1,
        name: 'Elektronik',
        subCategories: [
          { id: 101, name: 'Telefon & Tablet', parentId: 1 },
          { id: 102, name: 'Bilgisayar', parentId: 1 },
          { id: 103, name: 'TV & Ses Sistemleri', parentId: 1 },
          { id: 104, name: 'Kamera & Fotoğraf', parentId: 1 }
        ]
      },
      {
        id: 2,
        name: 'Moda & Giyim',
        subCategories: [
          { id: 201, name: 'Kadın Giyim', parentId: 2 },
          { id: 202, name: 'Erkek Giyim', parentId: 2 },
          { id: 203, name: 'Ayakkabı', parentId: 2 },
          { id: 204, name: 'Çanta & Aksesuar', parentId: 2 }
        ]
      },
      {
        id: 3,
        name: 'Ev & Yaşam',
        subCategories: [
          { id: 301, name: 'Mobilya', parentId: 3 },
          { id: 302, name: 'Dekorasyon', parentId: 3 },
          { id: 303, name: 'Mutfak & Yemek', parentId: 3 },
          { id: 304, name: 'Banyo', parentId: 3 }
        ]
      },
      {
        id: 4,
        name: 'Spor & Outdoor',
        subCategories: [
          { id: 401, name: 'Fitness', parentId: 4 },
          { id: 402, name: 'Koşu & Atletizm', parentId: 4 },
          { id: 403, name: 'Kamp & Outdoor', parentId: 4 },
          { id: 404, name: 'Su Sporları', parentId: 4 }
        ]
      },
      {
        id: 5,
        name: 'Otomotiv & Motosiklet',
        subCategories: [
          { id: 501, name: 'Oto Aksesuar', parentId: 5 },
          { id: 502, name: 'Oto Bakım', parentId: 5 },
          { id: 503, name: 'Motosiklet', parentId: 5 }
        ]
      }
    ]
  }

  const filterCategories = () => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories)
      return
    }

    const filtered = categories.filter(category => {
      const matchesMain = category.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSub = category.subCategories?.some(sub => 
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      return matchesMain || matchesSub
    })

    setFilteredCategories(filtered)
  }

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const getTotalSubCategories = (category: TrendyolCategory): number => {
    return category.subCategories?.length || 0
  }

  const getTotalCategories = (): number => {
    return categories.reduce((total, cat) => total + 1 + getTotalSubCategories(cat), 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trendyol Kategoriler</h1>
          <p className="text-muted-foreground">
            Canlı ortamdan kategori listesi ve hiyerarşisi
          </p>
        </div>
        <Button onClick={loadCategories} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Yenile
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ana Kategoriler</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kategori</p>
                <p className="text-2xl font-bold">{getTotalCategories()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Son Güncelleme</p>
                <p className="text-sm font-medium">{lastFetch || 'Henüz yüklenmedi'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arama */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kategori Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Kategori Hiyerarşisi
          </CardTitle>
          <CardDescription>
            Trendyol platformundaki kategori yapısı
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Kategoriler yükleniyor...</p>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {searchTerm ? 'Arama kriterlerinize uygun kategori bulunamadı.' : 'Henüz kategori bulunamadı.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  {/* Ana Kategori */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {expandedCategories.has(category.id) ? (
                        <FolderOpen className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Folder className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {category.id} • {getTotalSubCategories(category)} alt kategori
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {getTotalSubCategories(category)}
                      </Badge>
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${
                          expandedCategories.has(category.id) ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </div>

                  {/* Alt Kategoriler */}
                  {expandedCategories.has(category.id) && category.subCategories && (
                    <div className="border-t bg-muted/20">
                      {category.subCategories.map((subCategory) => (
                        <div 
                          key={subCategory.id}
                          className="flex items-center space-x-3 p-3 ml-8 border-l-2 border-muted hover:bg-muted/50"
                        >
                          <Package className="h-4 w-4 text-green-500" />
                          <div>
                            <h4 className="text-sm font-medium">{subCategory.name}</h4>
                            <p className="text-xs text-muted-foreground">ID: {subCategory.id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Bilgisi */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Not:</strong> Bu kategoriler Trendyol canlı ortamından çekilmektedir. 
          Gerçek kategori verilerine erişim için API kimlik doğrulaması gereklidir. 
          Şu anda demo veriler gösterilmektedir.
        </AlertDescription>
      </Alert>
    </div>
  )
} 