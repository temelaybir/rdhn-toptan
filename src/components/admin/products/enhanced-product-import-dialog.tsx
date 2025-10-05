'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Download,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { columnAnalyzerService, FileAnalysisResult, DetectedColumn } from '@/services/admin/column-analyzer-service'
import { FieldMapping } from './field-mapping'
import { importProductsEnhanced } from '@/app/actions/admin/import-actions'

interface EnhancedProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ImportOptions {
  updateExisting: boolean
  createCategories: boolean
  skipImages: boolean
}

interface ImportResult {
  success: boolean
  message: string
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: string[]
}

const STEP_TITLES = [
  'Dosya Seçimi',
  'Alan Eşleştirme', 
  'İçe Aktarma'
]

export function EnhancedProductImportDialog({
  open,
  onOpenChange,
  onSuccess
}: EnhancedProductImportDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(null)
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    updateExisting: false,
    createCategories: true,
    skipImages: false
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Dosya tipi kontrolü
    const validTypes = ['.csv', '.xlsx', '.xls']
    const isValidType = validTypes.some(type => selectedFile.name.toLowerCase().endsWith(type))
    
    if (!isValidType) {
      toast.error('Sadece CSV, XLS ve XLSX dosyaları desteklenir')
      return
    }

    // Dosya boyutu kontrolü (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan büyük olamaz')
      return
    }

    setFile(selectedFile)
    setAnalysisResult(null)
    setFieldMappings({})
    setImportResult(null)
    
    // Dosyayı otomatik analiz et
    await analyzeFile(selectedFile)
  }, [])

  const analyzeFile = async (fileToAnalyze: File) => {
    setIsAnalyzing(true)
    
    try {
      const result = await columnAnalyzerService.analyzeFile(fileToAnalyze)
      setAnalysisResult(result)
      
      toast.success(`Dosya analiz edildi: ${result.totalRows} satır, ${result.columns.length} sütun`)
      
      // Otomatik olarak sonraki adıma geç
      setCurrentStep(1)
    } catch (error) {
      console.error('Analiz hatası:', error)
      toast.error(error instanceof Error ? error.message : 'Dosya analiz edilemedi')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFieldMappingsChange = useCallback((mappings: Record<string, string>) => {
    setFieldMappings(mappings)
  }, [])

  const validateMappings = (): boolean => {
    const errors = columnAnalyzerService.validateRequiredFields(fieldMappings)
    if (errors.length > 0) {
      toast.error('Zorunlu alanlar eşleştirilmedi')
      return false
    }
    return true
  }

  const handleImport = async () => {
    if (!file || !analysisResult) {
      toast.error('Dosya seçilmedi')
      return
    }

    if (!validateMappings()) {
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fieldMappings', JSON.stringify(fieldMappings))
      formData.append('importOptions', JSON.stringify(importOptions))
      formData.append('analysisData', JSON.stringify(analysisResult))

      const response = await importProductsEnhanced(formData)
      
      if (response.success && response.result) {
        setImportResult(response.result)
        
        if (response.result.successCount > 0) {
          toast.success(`${response.result.successCount} ürün başarıyla içe aktarıldı`)
          onSuccess?.()
        } else {
          toast.error('Hiçbir ürün içe aktarılamadı')
        }
        
        setCurrentStep(2)
      } else {
        toast.error(response.error || 'İçe aktarma işlemi başarısız')
      }
    } catch (error) {
      console.error('İçe aktarma hatası:', error)
      toast.error(error instanceof Error ? error.message : 'İçe aktarma işlemi başarısız')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    setFile(null)
    setAnalysisResult(null)
    setFieldMappings({})
    setImportResult(null)
    setIsAnalyzing(false)
    setIsImporting(false)
    onOpenChange(false)
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!file) {
        toast.error('Lütfen bir dosya seçin')
        return
      }
      if (!analysisResult) {
        toast.error('Dosya henüz analiz edilmedi')
        return
      }
    } else if (currentStep === 1) {
      if (!validateMappings()) {
        return
      }
    }
    
    if (currentStep < STEP_TITLES.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (stepIndex === currentStep) {
      return <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">{stepIndex + 1}</div>
    } else {
      return <div className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">{stepIndex + 1}</div>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] lg:w-[80vw] sm:max-w-lg lg:max-w-none h-[85vh] sm:h-[82vh] lg:h-[80vh] max-h-none flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Gelişmiş Ürün İçe Aktarma
          </DialogTitle>
          <DialogDescription>
            Excel veya CSV dosyasından ürün verilerinizi alan eşleştirme ile içe aktarın
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          {STEP_TITLES.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className="flex items-center gap-2">
                {getStepIcon(index)}
                <span className={`text-sm font-medium ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {title}
                </span>
              </div>
              {index < STEP_TITLES.length - 1 && (
                <ArrowRight className="h-4 w-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <Separator className="flex-shrink-0" />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1 py-4">
          {/* Step 1: Dosya Seçimi */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Dosya Seçimi</h3>
                <p className="text-sm text-muted-foreground">
                  Ürün verilerinizi içeren Excel (.xlsx, .xls) veya CSV dosyasını seçin
                </p>
              </div>

              {/* Dosya yükleme alanı */}
              <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                <CardContent className="p-8">
                  <div 
                    className="text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="text-lg font-medium mb-2">
                      {file ? 'Dosyayı Değiştir' : 'Dosya Seç veya Sürükle'}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      CSV, XLS, XLSX formatları desteklenir (Maks: 10MB)
                    </p>
                    <Button variant="outline">
                      Dosya Seç
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Seçilen dosya bilgisi */}
              {file && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type || 'Bilinmeyen tip'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFile(null)
                          setAnalysisResult(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analiz durumu */}
              {isAnalyzing && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Progress value={undefined} className="flex-1" />
                      <span className="text-sm text-muted-foreground">Dosya analiz ediliyor...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analiz sonucu */}
              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Dosya Analiz Edildi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Toplam Satır:</span>
                        <span className="ml-2">{analysisResult.totalRows}</span>
                      </div>
                      <div>
                        <span className="font-medium">Sütun Sayısı:</span>
                        <span className="ml-2">{analysisResult.columns.length}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium text-sm mb-2">Tespit Edilen Sütunlar:</div>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.columns.map((column, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {column.name}
                            {column.suggestedField && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Alan Eşleştirme */}
          {currentStep === 1 && analysisResult && (
            <FieldMapping
              columns={analysisResult.columns}
              previewData={analysisResult.previewData}
              onMappingsChange={handleFieldMappingsChange}
            />
          )}

          {/* Step 3: İçe Aktarma */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">İçe Aktarma Seçenekleri</h3>
                <p className="text-sm text-muted-foreground">
                  İçe aktarma işlemi için ek seçeneklerinizi belirleyin
                </p>
              </div>

              {/* İmport seçenekleri */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aktarma Seçenekleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="updateExisting"
                      checked={importOptions.updateExisting}
                      onCheckedChange={(checked) => 
                        setImportOptions(prev => ({ ...prev, updateExisting: checked as boolean }))
                      }
                    />
                    <Label htmlFor="updateExisting" className="text-sm">
                      Mevcut ürünleri güncelle (SKU eşleşmesine göre)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createCategories"
                      checked={importOptions.createCategories}
                      onCheckedChange={(checked) => 
                        setImportOptions(prev => ({ ...prev, createCategories: checked as boolean }))
                      }
                    />
                    <Label htmlFor="createCategories" className="text-sm">
                      Eksik kategorileri otomatik oluştur
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipImages"
                      checked={importOptions.skipImages}
                      onCheckedChange={(checked) => 
                        setImportOptions(prev => ({ ...prev, skipImages: checked as boolean }))
                      }
                    />
                    <Label htmlFor="skipImages" className="text-sm">
                      Görselleri atla (sadece metin verileri aktarılacak)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* İçe aktarma işlemi */}
              {isImporting && (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <Progress value={undefined} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        Ürünler içe aktarılıyor... Bu işlem biraz zaman alabilir.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* İçe aktarma sonucu */}
              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      {importResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      İçe Aktarma Tamamlandı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Özet istatistikler */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                          <div className="text-sm text-green-700">Başarılı</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
                          <div className="text-sm text-red-700">Hatalı</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{importResult.totalProcessed}</div>
                          <div className="text-sm text-blue-700">Toplam</div>
                        </div>
                      </div>

                      {/* Hata detayları */}
                      {importResult.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Hatalar:</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {importResult.errors.slice(0, 10).map((error, index) => (
                              <Alert key={index}>
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                              </Alert>
                            ))}
                            {importResult.errors.length > 10 && (
                              <p className="text-xs text-muted-foreground">
                                ... ve {importResult.errors.length - 10} hata daha
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-between pt-6 border-t flex-shrink-0">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={isAnalyzing || isImporting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isAnalyzing || isImporting}
            >
              {importResult ? 'Kapat' : 'İptal'}
            </Button>

            {currentStep < 2 && (
              <Button
                onClick={handleNextStep}
                disabled={isAnalyzing || (currentStep === 0 && !analysisResult)}
              >
                {currentStep === 1 ? 'İçe Aktar' : 'Devam Et'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === 2 && !isImporting && !importResult && (
              <Button
                onClick={handleImport}
                disabled={!validateMappings()}
              >
                İçe Aktarmayı Başlat
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 