'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { productExportService, ExportOptions } from '@/services/admin/product-export-service'
import { Category } from '@/types/admin/product'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'

interface ProductExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
}

export function ProductExportDialog({
  open,
  onOpenChange,
  categories
}: ProductExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeImages: true,
    includeCategories: true,
    includeVariants: true,
    filters: {
      categoryId: '',
      status: 'all',
      searchTerm: ''
    }
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await productExportService.export(exportOptions)
      toast.success('Ürünler başarıyla dışa aktarıldı')
      onOpenChange(false)
    } catch (error) {
      toast.error('Dışa aktarma başarısız: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xml':
        return <FileText className="h-4 w-4" />
      case 'csv':
        return <Table className="h-4 w-4" />
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'xml':
        return 'OpenCart uyumlu XML formatı (önerilen)'
      case 'csv':
        return 'Basit CSV formatı'
      case 'excel':
        return 'Microsoft Excel formatı'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Ürün Dışa Aktarma
          </DialogTitle>
          <DialogDescription>
            Ürünlerinizi farklı formatlarda dışa aktarın. OpenCart XML formatı önceki sisteminizle uyumludur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Seçimi */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Format</Label>
            <RadioGroup
              value={exportOptions.format}
              onValueChange={(value) =>
                setExportOptions(prev => ({ ...prev, format: value as 'xml' | 'csv' | 'excel' }))
              }
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="excel" id="excel" />
                <div className="flex items-center gap-2 flex-1">
                  {getFormatIcon('excel')}
                  <div>
                    <Label htmlFor="excel" className="font-medium">Excel (.xlsx)</Label>
                    <p className="text-sm text-muted-foreground">{getFormatDescription('excel')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="xml" id="xml" />
                <div className="flex items-center gap-2 flex-1">
                  {getFormatIcon('xml')}
                  <div>
                    <Label htmlFor="xml" className="font-medium">OpenCart XML</Label>
                    <p className="text-sm text-muted-foreground">{getFormatDescription('xml')}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="csv" id="csv" />
                <div className="flex items-center gap-2 flex-1">
                  {getFormatIcon('csv')}
                  <div>
                    <Label htmlFor="csv" className="font-medium">CSV</Label>
                    <p className="text-sm text-muted-foreground">{getFormatDescription('csv')}</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Filtreler */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Filtreler</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={exportOptions.filters?.categoryId || 'all'}
                  onValueChange={(value) =>
                    setExportOptions(prev => ({
                      ...prev,
                      filters: { ...prev.filters, categoryId: value === 'all' ? '' : value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm kategoriler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={exportOptions.filters?.status || 'all'}
                  onValueChange={(value) =>
                    setExportOptions(prev => ({
                      ...prev,
                      filters: { ...prev.filters, status: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm durumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                    <SelectItem value="outofstock">Stok Yok</SelectItem>
                    <SelectItem value="lowstock">Düşük Stok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Arama</Label>
              <Input
                id="search"
                placeholder="Ürün adı veya SKU..."
                value={exportOptions.filters?.searchTerm || ''}
                onChange={(e) =>
                  setExportOptions(prev => ({
                    ...prev,
                    filters: { ...prev.filters, searchTerm: e.target.value }
                  }))
                }
              />
            </div>
          </div>

          {/* Seçenekler */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Seçenekler</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeImages"
                  checked={exportOptions.includeImages}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeImages: !!checked }))
                  }
                />
                <Label htmlFor="includeImages" className="text-sm">
                  Görsel bilgilerini dahil et
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCategories"
                  checked={exportOptions.includeCategories}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeCategories: !!checked }))
                  }
                />
                <Label htmlFor="includeCategories" className="text-sm">
                  Kategori bilgilerini dahil et
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeVariants"
                  checked={exportOptions.includeVariants}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeVariants: !!checked }))
                  }
                />
                <Label htmlFor="includeVariants" className="text-sm">
                  Varyant bilgilerini dahil et
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            İptal
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Dışa Aktarılıyor...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Dışa Aktar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}