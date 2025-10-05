'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileX, CheckCircle, AlertCircle, Database, Settings, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface ImportStats {
  total: number
  imported: number
  errors: number
  current?: string
}

interface ImportProduct {
  category_name: string
  parent_category?: string
  name: string
  description: string
  price: number
  stock_quantity: number
  images: string[]
}

interface ColumnMapping {
  [key: string]: string // XML column -> database field
}

interface ParsedXMLData {
  headers: string[]
  rows: string[][]
}

type DatabaseField = 
  | 'category_name' 
  | 'parent_category'
  | 'name' 
  | 'description' 
  | 'price' 
  | 'stock_quantity' 
  | 'image' 
  | 'ignore'

const databaseFields: { value: DatabaseField; label: string; required?: boolean }[] = [
  { value: 'category_name', label: 'Kategori İsmi', required: true },
  { value: 'parent_category', label: 'Üst Kategori (İsteğe Bağlı)' },
  { value: 'name', label: 'Ürün Adı', required: true },
  { value: 'description', label: 'Ürün Açıklaması' },
  { value: 'price', label: 'Fiyat', required: true },
  { value: 'stock_quantity', label: 'Stok Adedi' },
  { value: 'image', label: 'Görsel URL' },
  { value: 'ignore', label: 'Göz Ardı Et' }
]

export default function XmlImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [stats, setStats] = useState<ImportStats>({ total: 0, imported: 0, errors: 0 })
  const [errors, setErrors] = useState<string[]>([])
  
  // Column mapping states
  const [xmlData, setXmlData] = useState<ParsedXMLData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [showMapping, setShowMapping] = useState(false)
  const [previewData, setPreviewData] = useState<ImportProduct[]>([])
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xml')) {
        setFile(selectedFile)
        setErrors([])
        setStats({ total: 0, imported: 0, errors: 0 })
        setShowMapping(false)
        setXmlData(null)
        setColumnMapping({})
        setPreviewData([])
      } else {
        toast.error('Lütfen XML dosyası seçin')
      }
    }
  }

  const parseXmlStructure = async (xmlContent: string): Promise<ParsedXMLData> => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')
    
    const rows = xmlDoc.getElementsByTagName('Row')
    const headers: string[] = []
    const dataRows: string[][] = []
    
    // İlk satırdan başlıkları al
    if (rows.length > 0) {
      const headerRow = rows[0]
      const headerCells = headerRow.getElementsByTagName('Cell')
      
      for (let i = 0; i < headerCells.length; i++) {
        const cellValue = getCellValue(headerCells[i])
        headers.push(cellValue || `Sütun ${i + 1}`)
      }
    }
    
    // İlk 5 veri satırını al (önizleme için)
    for (let i = 1; i < Math.min(rows.length, 6); i++) {
      const row = rows[i]
      const cells = row.getElementsByTagName('Cell')
      const rowData: string[] = []
      
      for (let j = 0; j < headers.length; j++) {
        const cellValue = j < cells.length ? getCellValue(cells[j]) : ''
        rowData.push(cellValue)
      }
      
      dataRows.push(rowData)
    }
    
    return { headers, rows: dataRows }
  }

  const parseXmlProducts = async (xmlContent: string, mapping: ColumnMapping): Promise<ImportProduct[]> => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')
    
    const rows = xmlDoc.getElementsByTagName('Row')
    const products: ImportProduct[] = []
    
    // Header satırını atla
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.getElementsByTagName('Cell')
      
      const product: any = {
        images: []
      }
      
      // Mapping'e göre değerleri çıkar
      Object.entries(mapping).forEach(([columnIndex, fieldName]) => {
        const cellIndex = parseInt(columnIndex)
        const cellValue = cellIndex < cells.length ? getCellValue(cells[cellIndex])?.trim() : ''
        
        if (fieldName === 'image' && cellValue) {
          product.images.push(cellValue)
        } else if (fieldName !== 'ignore' && fieldName !== 'image') {
          product[fieldName] = cellValue
        }
      })
      
      // Zorunlu alanları kontrol et
      if (!product.category_name || !product.name) {
        console.warn(`Satır ${i + 1} atlandı: Eksik zorunlu alanlar`)
        continue
      }

      const price = parseFloat(product.price)
      if (isNaN(price) || price < 0) {
        console.warn(`Satır ${i + 1} atlandı: Geçersiz fiyat`)
        continue
      }

      product.price = price
      product.stock_quantity = parseInt(product.stock_quantity) || 0
      product.description = product.description || ''
      
      products.push(product as ImportProduct)
    }
    
    return products
  }

  const getCellValue = (cell: Element): string => {
    const dataElement = cell.getElementsByTagName('Data')[0]
    return dataElement?.textContent || ''
  }

  const analyzeFile = async () => {
    if (!file) return

    try {
      const xmlContent = await file.text()
      const parsedData = await parseXmlStructure(xmlContent)
      setXmlData(parsedData)
      setShowMapping(true)
      
      // Akıllı otomatik eşleştirme
      const autoMapping: ColumnMapping = {}
      parsedData.headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase()
        
        if (lowerHeader.includes('kategori') && lowerHeader.includes('ismi')) {
          autoMapping[index.toString()] = 'category_name'
        } else if (lowerHeader.includes('üst') && lowerHeader.includes('kategori')) {
          autoMapping[index.toString()] = 'parent_category'
        } else if (lowerHeader.includes('ürün') && lowerHeader.includes('adı')) {
          autoMapping[index.toString()] = 'name'
        } else if (lowerHeader.includes('açıklama')) {
          autoMapping[index.toString()] = 'description'
        } else if (lowerHeader.includes('fiyat')) {
          autoMapping[index.toString()] = 'price'
        } else if (lowerHeader.includes('stok')) {
          autoMapping[index.toString()] = 'stock_quantity'
        } else if (lowerHeader.includes('görsel') || lowerHeader.includes('resim') || lowerHeader.includes('image')) {
          autoMapping[index.toString()] = 'image'
        } else {
          autoMapping[index.toString()] = 'ignore'
        }
      })
      
      setColumnMapping(autoMapping)
      toast.success('Dosya analiz edildi. Sütun eşleştirmelerini kontrol edin.')
      
    } catch (error) {
      console.error('XML analiz hatası:', error)
      toast.error('XML dosyası analiz edilemedi')
    }
  }

  const updateColumnMapping = (columnIndex: string, fieldName: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [columnIndex]: fieldName
    }))
  }

  const generatePreview = async () => {
    if (!file || !xmlData) return

    try {
      const xmlContent = await file.text()
      const products = await parseXmlProducts(xmlContent, columnMapping)
      setPreviewData(products.slice(0, 5)) // İlk 5 ürün
      toast.success(`${products.length} ürün hazır. Önizlemeyi kontrol edin.`)
    } catch (error) {
      console.error('Önizleme hatası:', error)
      toast.error('Önizleme oluşturulamadı')
    }
  }

  const importProducts = async () => {
    if (!file) return

    setImporting(true)
    setStats({ total: 0, imported: 0, errors: 0 })
    setErrors([])

    try {
      const xmlContent = await file.text()
      const products = await parseXmlProducts(xmlContent, columnMapping)
      
      if (products.length === 0) {
        toast.error('Eşleştirmelere göre geçerli ürün bulunamadı')
        setImporting(false)
        return
      }

      setStats(prev => ({ ...prev, total: products.length }))

      // Batch olarak import et (10'lu gruplar halinde)
      const batchSize = 10
      let imported = 0
      let errorCount = 0
      const errorList: string[] = []

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        
        try {
          const response = await fetch('/api/admin/import-products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ products: batch }),
          })

          const result = await response.json()
          
          if (result.success) {
            imported += result.imported
            if (result.errors?.length) {
              errorCount += result.errors.length
              errorList.push(...result.errors)
            }
          } else {
            errorCount += batch.length
            errorList.push(`Batch ${Math.floor(i / batchSize) + 1}: ${result.error}`)
          }
        } catch (error) {
          errorCount += batch.length
          errorList.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`)
        }

        setStats({
          total: products.length,
          imported,
          errors: errorCount,
          current: `${Math.min(i + batchSize, products.length)} / ${products.length}`
        })

        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setErrors(errorList)
      
      if (imported > 0) {
        toast.success(`${imported} ürün başarıyla import edildi`)
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} ürün import edilemedi`)
      }

    } catch (error) {
      console.error('Import hatası:', error)
      toast.error('Import işlemi başarısız')
      setErrors([`Import hatası: ${error}`])
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setFile(null)
    setStats({ total: 0, imported: 0, errors: 0 })
    setErrors([])
    setShowMapping(false)
    setXmlData(null)
    setColumnMapping({})
    setPreviewData([])
  }

  const hasRequiredMappings = () => {
    const mappedFields = Object.values(columnMapping)
    return mappedFields.includes('category_name') && 
           mappedFields.includes('name') && 
           mappedFields.includes('price')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gelişmiş XML Ürün Import</h1>
        <Button onClick={resetImport} variant="outline">
          <FileX className="h-4 w-4 mr-2" />
          Temizle
        </Button>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            XML Dosyası Yükle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">XML dosyasını seçin</p>
            <p className="text-sm text-gray-500 mb-4">
              Excel XML formatındaki ürün verilerini esnek sütun eşleştirme ile import eder
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileSelect}
              className="hidden"
              id="xml-file"
            />
            <Button 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              Dosya Seç
            </Button>
          </div>

          {file && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{file.name}</strong> seçildi ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}

          {file && !showMapping && (
            <Button onClick={analyzeFile} className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Dosyayı Analiz Et ve Sütun Eşleştirme
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Column Mapping */}
      {showMapping && xmlData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sütun Eşleştirme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Her XML sütununu veritabanı alanıyla eşleştirin. Aynı alan için birden fazla sütun seçebilirsiniz (özellikle görseller için).
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* XML Columns */}
              <div>
                <h3 className="font-semibold mb-4">XML Sütunları</h3>
                <div className="space-y-3">
                  {xmlData.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{header}</Label>
                        <div className="text-xs text-gray-500 mt-1">
                          Örnek: {xmlData.rows[0]?.[index] || 'Veri yok'}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <Select
                          value={columnMapping[index.toString()] || 'ignore'}
                          onValueChange={(value) => updateColumnMapping(index.toString(), value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {databaseFields.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label} {field.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Summary */}
              <div>
                <h3 className="font-semibold mb-4">Alan Özeti</h3>
                <div className="space-y-2">
                  {databaseFields.filter(f => f.value !== 'ignore').map((field) => {
                    const mappedColumns = Object.entries(columnMapping)
                      .filter(([_, fieldName]) => fieldName === field.value)
                      .map(([columnIndex, _]) => xmlData.headers[parseInt(columnIndex)])
                    
                    return (
                      <div key={field.value} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </span>
                        <span className="text-xs text-gray-600">
                          {mappedColumns.length > 0 ? mappedColumns.join(', ') : 'Eşleştirilmedi'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Zorunlu alanlar:</span>
                    <span className={hasRequiredMappings() ? 'text-green-600' : 'text-red-600'}>
                      {hasRequiredMappings() ? '✓ Tamamlandı' : '✗ Eksik'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={generatePreview} 
                disabled={!hasRequiredMappings()}
                variant="outline"
              >
                Önizleme Oluştur
              </Button>
              
              <Button 
                onClick={importProducts} 
                disabled={importing || !hasRequiredMappings()}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Import Ediliyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Ürünleri Import Et
                  </>
                )}
              </Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>İlerleme</span>
                  <span>{stats.current}</span>
                </div>
                <Progress 
                  value={stats.total > 0 ? (stats.imported + stats.errors) / stats.total * 100 : 0} 
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Önizleme (İlk 5 Ürün)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previewData.map((product, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Kategori:</strong> {product.category_name}</p>
                      {product.parent_category && (
                        <p><strong>Üst Kategori:</strong> {product.parent_category}</p>
                      )}
                      <p><strong>Ürün:</strong> {product.name}</p>
                      <p><strong>Fiyat:</strong> ₺{product.price}</p>
                      <p><strong>Stok:</strong> {product.stock_quantity}</p>
                    </div>
                    <div>
                      <p><strong>Açıklama:</strong> {product.description.substring(0, 100)}...</p>
                      <p><strong>Görseller:</strong> {product.images.length} adet</p>
                      {product.images.slice(0, 2).map((img, imgIndex) => (
                        <p key={imgIndex} className="text-xs text-blue-600 truncate">
                          {img}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {(stats.total > 0 || stats.imported > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Başarılı</p>
                  <p className="text-2xl font-bold text-green-600">{stats.imported}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hata</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Hatalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 