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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { importProducts, ImportResult } from '@/app/actions/admin/import-actions'
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onSuccess
}: ProductImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [createCategories, setCreateCategories] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('updateExisting', updateExisting.toString())
      formData.append('createCategories', createCategories.toString())

      const response = await importProducts(formData)
      
      if (response.success && response.result) {
        setResult(response.result)
        toast.success(response.result.message)
        if (response.result.successCount > 0) {
          onSuccess?.()
        }
      } else {
        toast.error(response.error || 'Import işlemi başarısız')
      }
    } catch (error) {
      console.error('Import hatası:', error)
      toast.error(error instanceof Error ? error.message : 'Import işlemi başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setIsLoading(false)
    setUpdateExisting(false)
    setCreateCategories(true)
    onOpenChange(false)
  }

  const isValidFile = file && (
    file.name.endsWith('.xlsx') || 
    file.name.endsWith('.xls') || 
    file.name.endsWith('.csv')
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ürün İçe Aktar
          </DialogTitle>
          <DialogDescription>
            Excel veya CSV dosyasından ürünleri toplu olarak içe aktarın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Dosya Seç</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                {file ? file.name : 'Dosya Seçin'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Desteklenen formatlar: Excel (.xlsx, .xls) ve CSV (.csv)
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateExisting"
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
              />
              <Label htmlFor="updateExisting" className="text-sm">
                Mevcut ürünleri güncelle
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createCategories"
                checked={createCategories}
                onCheckedChange={(checked) => setCreateCategories(checked as boolean)}
              />
              <Label htmlFor="createCategories" className="text-sm">
                Eksik kategorileri oluştur
              </Label>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                İçe aktarma işlemi devam ediyor...
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert className={result.success ? "border-green-200" : "border-red-200"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>{result.message}</p>
                      <div className="text-xs text-muted-foreground">
                        Toplam: {result.totalProcessed}, Başarılı: {result.successCount}, Hatalı: {result.errorCount}
                      </div>
                      {result.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium">Hatalar:</p>
                          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                            {result.errors.slice(0, 5).map((error, index) => (
                              <div key={index} className="text-red-600">• {error}</div>
                            ))}
                            {result.errors.length > 5 && (
                              <div className="text-muted-foreground">
                                ... ve {result.errors.length - 5} hata daha
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Help */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <p className="font-medium mb-1">Dosya formatı:</p>
              <p>Excel/CSV dosyanızda şu sütunlar bulunmalıdır:</p>
              <ul className="mt-1 space-y-0.5 ml-4">
                <li>• <strong>name</strong>: Ürün adı (zorunlu)</li>
                <li>• <strong>price</strong>: Fiyat (zorunlu)</li>
                <li>• <strong>sku</strong>: Stok kodu (opsiyonel)</li>
                <li>• <strong>description</strong>: Açıklama (opsiyonel)</li>
                <li>• <strong>category</strong>: Kategori (opsiyonel)</li>
                <li>• <strong>stock_quantity</strong>: Stok miktarı (opsiyonel)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Kapat' : 'İptal'}
          </Button>
          {!result && (
            <Button 
              onClick={handleImport} 
              disabled={!isValidFile || isLoading}
            >
              {isLoading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 