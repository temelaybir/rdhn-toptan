'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Upload, 
  Link, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Search, 
  Download, 
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  Info,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface URLMapping {
  id: string
  old_url: string
  new_url: string
  redirect_type: number
  match_type: string
  confidence: number
  hit_count: number
  is_active: boolean
  old_product_name?: string
  old_barcode?: string
  created_at: string
  last_used_at?: string
}

interface Statistics {
  total: number
  active: number
  inactive: number
  byMatchType: Record<string, number>
  totalHits: number
}

export default function URLMappingsPage() {
  const { toast } = useToast()
  const [mappings, setMappings] = useState<URLMapping[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [generationLoading, setGenerationLoading] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  
  // Selection
  const [selectedMappings, setSelectedMappings] = useState<string[]>([])
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  
  // Generation
  const [urlFileContent, setUrlFileContent] = useState('')
  const [threshold, setThreshold] = useState(0.6)
  const [dryRun, setDryRun] = useState(true)
  const [generationResults, setGenerationResults] = useState<any>(null)

  // Mapping'leri yükle
  const loadMappings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (matchTypeFilter) params.set('match_type', matchTypeFilter)
      if (activeFilter) params.set('is_active', activeFilter)

      const response = await fetch(`/api/admin/seo/url-mappings?${params}`)
      const result = await response.json()

      if (result.success) {
        setMappings(result.data.mappings)
        setStatistics(result.data.statistics)
        // Selection'ı temizle
        setSelectedMappings([])
      } else {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: result.error
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  // Selection handlers
  const toggleSelectMapping = (id: string) => {
    setSelectedMappings(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedMappings.length === mappings.length) {
      setSelectedMappings([])
    } else {
      setSelectedMappings(mappings.map(m => m.id))
    }
  }

  // Toplu silme
  const bulkDeleteMappings = async () => {
    if (selectedMappings.length === 0) return
    
    if (!confirm(`${selectedMappings.length} URL mapping'ini silmek istediğinize emin misiniz?`)) return

    try {
      setBulkDeleteLoading(true)
      
      const response = await fetch('/api/admin/seo/url-mappings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedMappings })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Başarılı',
          description: result.message
        })
        setSelectedMappings([])
        await loadMappings()
      } else {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: result.error
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message
      })
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  // Mapping generation
  const generateMappings = async () => {
    if (!urlFileContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'URL dosya içeriği gerekli'
      })
      return
    }

    try {
      setGenerationLoading(true)
      const response = await fetch('/api/admin/seo/generate-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlFileContent,
          threshold,
          dryRun
        })
      })

      const result = await response.json()

      if (result.success) {
        setGenerationResults(result.data)
        toast({
          title: 'Başarılı',
          description: result.message
        })

        if (!dryRun) {
          // Mapping'leri yeniden yükle
          await loadMappings()
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: result.error
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message
      })
    } finally {
      setGenerationLoading(false)
    }
  }

  // Mapping toggle
  const toggleMapping = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/seo/url-mappings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive })
      })

      const result = await response.json()

      if (result.success) {
        await loadMappings()
        toast({
          title: 'Başarılı',
          description: 'Mapping güncellendi'
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: result.error
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message
      })
    }
  }

  useEffect(() => {
    loadMappings()
  }, [searchTerm, matchTypeFilter, activeFilter])

  const getMatchTypeBadge = (matchType: string, confidence: number) => {
    switch (matchType) {
      case 'exact':
        return <Badge className="bg-green-100 text-green-800">Tam Eşleşme</Badge>
      case 'similarity':
        return <Badge className="bg-blue-100 text-blue-800">Benzerlik ({Math.round(confidence * 100)}%)</Badge>
      case 'fallback':
        return <Badge className="bg-yellow-100 text-yellow-800">Kategori</Badge>
      case 'manual':
        return <Badge className="bg-purple-100 text-purple-800">Manuel</Badge>
      default:
        return <Badge variant="outline">{matchType}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO URL Mappings</h1>
          <p className="text-muted-foreground">
            Eski URL'leri yeni ürün sayfalarına yönlendirin
          </p>
        </div>
        <Button onClick={loadMappings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* İstatistikler */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">Toplam Mapping</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{statistics.inactive}</div>
              <p className="text-xs text-muted-foreground">Pasif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalHits}</div>
              <p className="text-xs text-muted-foreground">Toplam Tıklama</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.byMatchType.exact || 0}
              </div>
              <p className="text-xs text-muted-foreground">Tam Eşleşme</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="mappings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mappings">Mapping Yönetimi</TabsTrigger>
          <TabsTrigger value="generate">URL Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="mappings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                URL Mappings
              </CardTitle>
              <CardDescription>
                Mevcut URL yönlendirmelerini görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filterler */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="URL, ürün adı veya barkod ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={matchTypeFilter || "all"} onValueChange={(value) => setMatchTypeFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Eşleşme Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="exact">Tam Eşleşme</SelectItem>
                    <SelectItem value="similarity">Benzerlik</SelectItem>
                    <SelectItem value="fallback">Kategori</SelectItem>
                    <SelectItem value="manual">Manuel</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter || "all"} onValueChange={(value) => setActiveFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toplu İşlemler */}
              {mappings.length > 0 && (
                <div className="flex items-center justify-between mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedMappings.length === mappings.length && mappings.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedMappings.length > 0 
                        ? `${selectedMappings.length} seçili`
                        : 'Tümünü seç'
                      }
                    </span>
                  </div>
                  
                  {selectedMappings.length > 0 && (
                    <Button
                      onClick={bulkDeleteMappings}
                      disabled={bulkDeleteLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {bulkDeleteLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Seçili Mapping'leri Sil ({selectedMappings.length})
                    </Button>
                  )}
                </div>
              )}

              {/* Tablo */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Yükleniyor...
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedMappings.length === mappings.length && mappings.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Eski URL</TableHead>
                        <TableHead>Yeni URL</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Tıklama</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMappings.includes(mapping.id)}
                              onCheckedChange={() => toggleSelectMapping(mapping.id)}
                            />
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm font-mono">
                              {mapping.old_url}
                            </div>
                            {mapping.old_product_name && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {mapping.old_product_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm">
                              {mapping.new_url}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getMatchTypeBadge(mapping.match_type, mapping.confidence)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              {mapping.hit_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={mapping.is_active}
                              onCheckedChange={() => toggleMapping(mapping.id, mapping.is_active)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(mapping.old_url, '_blank')}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {mappings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Mapping bulunamadı
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                URL Mapping Generator
              </CardTitle>
              <CardDescription>
                Eski URL listesinden otomatik mapping oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Önce "Dry Run" ile test edin, sonra gerçek import yapın.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL Listesi</label>
                  <Textarea
                    placeholder="Eski URL'leri her satıra bir tane gelecek şekilde yapıştırın..."
                    value={urlFileContent}
                    onChange={(e) => setUrlFileContent(e.target.value)}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Eşleşme Eşik Değeri</label>
                    <Select value={threshold.toString()} onValueChange={(v) => setThreshold(parseFloat(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.6">60% - Gevşek (Önerilen)</SelectItem>
                        <SelectItem value="0.7">70% - Normal</SelectItem>
                        <SelectItem value="0.8">80% - Katı</SelectItem>
                        <SelectItem value="0.9">90% - Çok Katı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dry-run"
                      checked={dryRun}
                      onCheckedChange={setDryRun}
                    />
                    <label htmlFor="dry-run" className="text-sm font-medium">
                      Dry Run (Sadece Test)
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={generateMappings} 
                  disabled={generationLoading || !urlFileContent.trim()}
                  className="w-full"
                >
                  {generationLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {dryRun ? 'Test Et' : 'Mapping Oluştur'}
                </Button>
              </div>

              {/* Sonuçlar */}
              {generationResults && (
                <div className="space-y-4">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Sonuçlar</h3>
                    
                    {/* İstatistikler */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{generationResults.statistics?.total}</div>
                        <div className="text-sm text-muted-foreground">Toplam</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">{generationResults.statistics?.exact}</div>
                        <div className="text-sm text-muted-foreground">Tam Eşleşme</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">{generationResults.statistics?.similar}</div>
                        <div className="text-sm text-muted-foreground">Benzer</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded">
                        <div className="text-2xl font-bold text-yellow-600">{generationResults.statistics?.fallback}</div>
                        <div className="text-sm text-muted-foreground">Kategori</div>
                      </div>
                    </div>

                    {/* Önizleme */}
                    <div className="space-y-4">
                      {generationResults.preview?.exact?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Tam Eşleşmeler</h4>
                          <div className="space-y-2">
                            {generationResults.preview.exact.map((mapping: any, i: number) => (
                              <div key={i} className="flex items-center text-sm bg-green-50 p-2 rounded">
                                <span className="font-mono text-xs flex-1">{mapping.old_url}</span>
                                <ArrowRight className="w-4 h-4 mx-2" />
                                <span className="flex-1">{mapping.new_url}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generationResults.preview?.similar?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2">Benzer Eşleşmeler</h4>
                          <div className="space-y-2">
                            {generationResults.preview.similar.map((mapping: any, i: number) => (
                              <div key={i} className="flex items-center text-sm bg-blue-50 p-2 rounded">
                                <span className="font-mono text-xs flex-1">{mapping.old_url}</span>
                                <ArrowRight className="w-4 h-4 mx-2" />
                                <span className="flex-1">{mapping.new_url}</span>
                                <Badge variant="outline" className="ml-2">
                                  {Math.round(mapping.confidence * 100)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generationResults.preview?.fallback?.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-yellow-600 mb-2">Kategori Yönlendirmeleri</h4>
                          <div className="space-y-2">
                            {generationResults.preview.fallback.map((mapping: any, i: number) => (
                              <div key={i} className="flex items-center text-sm bg-yellow-50 p-2 rounded">
                                <span className="font-mono text-xs flex-1">{mapping.old_url}</span>
                                <ArrowRight className="w-4 h-4 mx-2" />
                                <span className="flex-1">{mapping.new_url}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
