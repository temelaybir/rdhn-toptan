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
import { toast } from 'sonner'
import { categoryExportService, CategoryExportOptions } from '@/services/admin/category-export-service'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'

interface CategoryExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryExportDialog({
  open,
  onOpenChange
}: CategoryExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<CategoryExportOptions>({
    format: 'excel',
    includeInactive: false
  })

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await categoryExportService.export(exportOptions)
      toast.success('Kategoriler başarıyla dışa aktarıldı')
      onOpenChange(false)
    } catch (error) {
      toast.error('Dışa aktarma başarısız: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'xml':
        return <FileText className="h-4 w-4" />
      case 'csv':
        return <Table className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'excel':
        return 'Microsoft Excel formatı (önerilen)'
      case 'xml':
        return 'OpenCart uyumlu XML formatı'
      case 'csv':
        return 'Basit CSV formatı'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Kategori Dışa Aktarma
          </DialogTitle>
          <DialogDescription>
            Kategorilerinizi OpenCart uyumlu formatlarda dışa aktarın.
            14 sütun: category_id, parent_id, name(tr-tr), top, columns, sort_order, image_name, description(tr-tr), meta_title(tr-tr), meta_description(tr-tr), meta_keywords(tr-tr), store_ids, layout, status
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
                <RadioGroupItem value="csv" id="csv" />
                <div className="flex items-center gap-2 flex-1">
                  {getFormatIcon('csv')}
                  <div>
                    <Label htmlFor="csv" className="font-medium">CSV</Label>
                    <p className="text-sm text-muted-foreground">{getFormatDescription('csv')}</p>
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
            </RadioGroup>
          </div>

          {/* Seçenekler */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Seçenekler</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInactive"
                  checked={exportOptions.includeInactive}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeInactive: !!checked }))
                  }
                />
                <Label htmlFor="includeInactive" className="text-sm">
                  Pasif kategorileri dahil et
                </Label>
              </div>
            </div>
          </div>

          {/* Bilgi */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Kategori ID Sistemi</h4>
            <p className="text-sm text-blue-700">
              Kategoriler 3 basamaklı sayısal ID&apos;lerle (100, 101, 102...) dışa aktarılır. 
              Bu ID&apos;ler ürün import sırasında kullanılabilir.
            </p>
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