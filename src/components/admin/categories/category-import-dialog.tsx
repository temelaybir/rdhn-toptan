'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  categoryImportService, 
  CategoryImportOptions, 
  CategoryImportResult, 
  CategoryPreview 
} from '@/services/admin/category-import-service'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  RefreshCw
} from 'lucide-react'

interface CategoryImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CategoryImportDialog({
  open,
  onOpenChange,
  onSuccess
}: CategoryImportDialogProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<CategoryPreview[]>([])
  const [importResult, setImportResult] = useState<CategoryImportResult | null>(null)
  const [importOptions, setImportOptions] = useState<CategoryImportOptions>({
    updateExisting: false,
    dryRun: false
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validTypes = ['.xml', '.csv', '.xlsx', '.xls']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!validTypes.includes(fileExtension)) {
        toast.error('XML, CSV, XLS ve XLSX dosyaları desteklenmektedir')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handlePreview = async () => {
    if (!selectedFile) return
    
    try {
      setIsProcessing(true)
      console.log('Önizleme başlıyor...', { fileName: selectedFile.name, fileSize: selectedFile.size })
      
      const previewData = await categoryImportService.preview(selectedFile, importOptions)
      console.log('Önizleme verisi alındı:', previewData)
      
      if (!previewData || previewData.length === 0) {
        toast.error('Dosyada geçerli kategori verisi bulunamadı')
        return
      }
      
      setPreview(previewData)
      setCurrentStep('preview')
      toast.success(`${previewData.length} kategori önizlemeye hazırlandı`)
    } catch (error) {
      console.error('Önizleme hatası:', error)
      toast.error('Önizleme başarısız: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return
    
    try {
      setIsProcessing(true)
      const result = await categoryImportService.import(selectedFile, importOptions)
      setImportResult(result)
      setCurrentStep('result')
      
      if (result.success) {
        toast.success(result.message)
        onSuccess?.()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('İçe aktarma başarısız: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setPreview([])
    setImportResult(null)
    onOpenChange(false)
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge className="bg-green-100 text-green-800">Oluştur</Badge>
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800">Güncelle</Badge>
      case 'skip':
        return <Badge variant="secondary">Atla</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const getStepProgress = () => {
    switch (currentStep) {
      case 'upload':
        return 0
      case 'preview':
        return 50
      case 'result':
        return 100
      default:
        return 0
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Kategori İçe Aktarma
          </DialogTitle>
          <DialogDescription>
            OpenCart formatında kategori dosyalarınızı içe aktarın
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>İlerleme</span>
            <span>{getStepProgress()}%</span>
          </div>
          <Progress value={getStepProgress()} className="w-full" />
        </div>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>
              1. Dosya Yükle
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={currentStep === 'upload'}>
              2. Önizleme
            </TabsTrigger>
            <TabsTrigger value="result" disabled={currentStep !== 'result'}>
              3. Sonuç
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dosya Seçimi</CardTitle>
                <CardDescription>
                  5 sütunlu kategori dosyanızı seçin: ID, Ad, Açıklama, Meta Tag, SEO URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {selectedFile ? selectedFile.name : 'Dosya seçin veya sürükleyin'}
                  </p>
                  <p className="text-sm text-gray-500">
                    XML, CSV, XLS ve XLSX formatında dosya desteklenmektedir
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml,.csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {selectedFile && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{selectedFile.name}</strong> dosyası seçildi ({Math.round(selectedFile.size / 1024)} KB)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İçe Aktarma Seçenekleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="updateExisting"
                    checked={importOptions.updateExisting}
                    onCheckedChange={(checked) =>
                      setImportOptions(prev => ({ ...prev, updateExisting: !!checked }))
                    }
                  />
                  <Label htmlFor="updateExisting">
                    Mevcut kategorileri güncelle (isim eşleşmesi ile)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Bilgi */}
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-2">Önemli Notlar</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Kategoriler 3 basamaklı ID&apos;lerle (100, 101, 102...) tanımlanır</li>
                <li>• Ana kategoriler önce, alt kategoriler sonra işlenir</li>
                <li>• Parent-child ilişkiler otomatik olarak kurulur</li>
                <li>• İçe aktarma sonrası ürün import&apos;unda bu ID&apos;ler kullanılabilir</li>
              </ul>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Önizleme</h3>
                <p className="text-sm text-muted-foreground">
                  İçe aktarılacak kategorilerin önizlemesi (ilk 100 kayıt)
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Geri
                </Button>
              </div>
            </div>

            {preview.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">
                          {preview.filter(p => p.action !== 'skip').length}
                        </p>
                        <p className="text-xs text-muted-foreground">İşlenecek</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <XCircle className="h-8 w-8 text-red-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">
                          {preview.filter(p => p.errors.length > 0).length}
                        </p>
                        <p className="text-xs text-muted-foreground">Hatalı</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Eye className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{preview.length}</p>
                        <p className="text-xs text-muted-foreground">Toplam</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Satır</TableHead>
                    <TableHead>İşlem</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Kategori Adı</TableHead>
                    <TableHead>SEO URL</TableHead>
                    <TableHead>Sonuç</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.rowNumber}</TableCell>
                      <TableCell>{getActionBadge(item.action)}</TableCell>
                      <TableCell className="font-mono">{item.categoryId}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.keyword}</TableCell>
                      <TableCell>
                        {item.errors.length > 0 && (
                          <div className="flex items-center text-red-600 text-sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            {item.errors[0]}
                          </div>
                        )}
                        {item.errors.length === 0 && item.warnings.length > 0 && (
                          <div className="flex items-center text-yellow-600 text-sm">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {item.warnings[0]}
                          </div>
                        )}
                        {item.errors.length === 0 && item.warnings.length === 0 && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Hazır
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Result Tab */}
          <TabsContent value="result" className="space-y-6">
            {importResult && (
              <>
                <div className="text-center space-y-4">
                  {importResult.success ? (
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">
                      {importResult.success ? 'İçe Aktarma Tamamlandı' : 'İçe Aktarma Başarısız'}
                    </h3>
                    <p className="text-muted-foreground">{importResult.message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{importResult.totalProcessed}</p>
                      <p className="text-sm text-muted-foreground">Toplam İşlenen</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                      <p className="text-sm text-muted-foreground">Başarılı</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{importResult.errorCount}</p>
                      <p className="text-sm text-muted-foreground">Hatalı</p>
                    </CardContent>
                  </Card>
                </div>

                {importResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Hatalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Satır {error.row}:</strong> {error.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {currentStep === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                İptal
              </Button>
              <Button 
                onClick={handlePreview} 
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Önizleme
                  </>
                )}
              </Button>
            </>
          )}
          
          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Geri
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isProcessing || preview.filter(p => p.action !== 'skip').length === 0}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    İçe Aktarılıyor...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    İçe Aktar ({preview.filter(p => p.action !== 'skip').length} kategori)
                  </>
                )}
              </Button>
            </>
          )}
          
          {currentStep === 'result' && (
            <Button onClick={handleClose}>
              Kapat
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}