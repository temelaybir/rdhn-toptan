'use client'

import { useState, useEffect } from 'react'
import { DetectedColumn, ProductField, PRODUCT_FIELDS } from '@/services/admin/column-analyzer-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertCircle, Info, RotateCcw } from 'lucide-react'

interface FieldMappingProps {
  columns: DetectedColumn[]
  onMappingsChange: (mappings: Record<string, string>) => void
  previewData: any[]
}

export function FieldMapping({ columns, onMappingsChange, previewData }: FieldMappingProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<string[]>([])

  // Otomatik önerileri başlangıçta uygula
  useEffect(() => {
    const autoMappings: Record<string, string> = {}
    
    columns.forEach(column => {
      if (column.suggestedField) {
        autoMappings[column.name] = column.suggestedField
      }
    })
    
    setMappings(autoMappings)
  }, [columns])

  // Mappings değiştiğinde parent'a bildir ve validasyon yap
  useEffect(() => {
    onMappingsChange(mappings)
    validateMappings()
  }, [mappings, onMappingsChange])

  const validateMappings = () => {
    const newErrors: string[] = []
    const requiredFields = PRODUCT_FIELDS.filter(field => field.required)
    const mappedFields = Object.values(mappings).filter(Boolean)

    // Zorunlu alanlar kontrolü
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field.key)) {
        newErrors.push(`"${field.label}" alanı zorunludur ve eşleştirilmelidir`)
      }
    })

    // Tekrar kullanım kontrolü
    const fieldCounts: Record<string, number> = {}
    mappedFields.forEach(field => {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1
    })

    Object.entries(fieldCounts).forEach(([field, count]) => {
      if (count > 1) {
        const fieldInfo = PRODUCT_FIELDS.find(f => f.key === field)
        newErrors.push(`"${fieldInfo?.label || field}" alanı birden fazla sütuna eşleştirilmiş`)
      }
    })

    setErrors(newErrors)
  }

  const handleMappingChange = (columnName: string, fieldKey: string) => {
    setMappings(prev => ({
      ...prev,
      [columnName]: fieldKey === 'none' ? '' : fieldKey
    }))
  }

  const resetMappings = () => {
    setMappings({})
  }

  const applyAutoMappings = () => {
    const autoMappings: Record<string, string> = {}
    
    columns.forEach(column => {
      if (column.suggestedField) {
        autoMappings[column.name] = column.suggestedField
      }
    })
    
    setMappings(autoMappings)
  }

  const getFieldInfo = (fieldKey: string): ProductField | undefined => {
    return PRODUCT_FIELDS.find(field => field.key === fieldKey)
  }

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'number':
        return <Badge variant="secondary" className="text-xs">123</Badge>
      case 'boolean':
        return <Badge variant="secondary" className="text-xs">T/F</Badge>
      case 'mixed':
        return <Badge variant="secondary" className="text-xs">MIX</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">TXT</Badge>
    }
  }

  const getMappedFieldsCount = () => {
    return Object.values(mappings).filter(Boolean).length
  }

  const getRequiredFieldsCount = () => {
    const requiredFields = PRODUCT_FIELDS.filter(field => field.required)
    const mappedRequiredFields = requiredFields.filter(field => 
      Object.values(mappings).includes(field.key)
    )
    return { total: requiredFields.length, mapped: mappedRequiredFields.length }
  }

  const requiredFieldsStats = getRequiredFieldsCount()
  const isValidMapping = errors.length === 0 && requiredFieldsStats.mapped === requiredFieldsStats.total

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Alan Eşleştirme</h3>
        <p className="text-sm text-muted-foreground">
          Excel/CSV sütunlarınızı ürün alanlarıyla eşleştirin
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Toplam Sütun</div>
                <div className="text-lg font-bold">{columns.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Eşleştirilen</div>
                <div className="text-lg font-bold">{getMappedFieldsCount()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className={`h-4 w-4 ${isValidMapping ? 'text-green-500' : 'text-orange-500'}`} />
              <div>
                <div className="text-sm font-medium">Zorunlu Alanlar</div>
                <div className="text-lg font-bold">{requiredFieldsStats.mapped}/{requiredFieldsStats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hata mesajları */}
      {errors.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Kontrol butonları */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={applyAutoMappings}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Otomatik Eşleştir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetMappings}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Sıfırla
        </Button>
      </div>

      <Separator />

      {/* Alan eşleştirme tablosu */}
      <div className="space-y-4">
        <h4 className="font-medium">Sütun Eşleştirmeleri</h4>
        
        <div className="grid gap-4">
          {columns.map((column, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Sütun bilgileri */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{column.name}</Label>
                    {getDataTypeIcon(column.dataType)}
                    {column.suggestedField && (
                      <Badge variant="outline" className="text-xs">
                        Önerilen
                      </Badge>
                    )}
                  </div>
                  
                  {column.sampleValues.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium mb-1">Örnek değerler:</div>
                      <div className="flex flex-wrap gap-1">
                        {column.sampleValues.slice(0, 3).map((value, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {String(value).length > 20 
                              ? String(value).substring(0, 20) + '...' 
                              : String(value)
                            }
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alan seçimi */}
                <div className="space-y-2">
                  <Label className="text-sm">Eşleştirilen Alan</Label>
                  <Select
                    value={mappings[column.name] || 'none'}
                    onValueChange={(value) => handleMappingChange(column.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alan seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Eşleştirme</SelectItem>
                      {PRODUCT_FIELDS.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          <div className="flex items-center gap-2">
                            {field.label}
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Zorunlu
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Alan açıklaması */}
                <div className="space-y-2">
                  {mappings[column.name] && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const fieldInfo = getFieldInfo(mappings[column.name])
                        if (!fieldInfo) return null
                        
                        return (
                          <div className="space-y-1">
                            <div className="font-medium">{fieldInfo.description}</div>
                            {fieldInfo.examples && (
                              <div>
                                <span className="font-medium">Örnekler:</span>{' '}
                                {fieldInfo.examples.slice(0, 2).join(', ')}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Örnek veri önizleme */}
      {previewData.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <h4 className="font-medium">Veri Önizlemesi (İlk 3 Satır)</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg">
              <thead>
                <tr className="bg-muted">
                  {columns.map((column, index) => (
                    <th key={index} className="p-2 text-left border-r border-border text-xs">
                      <div className="space-y-1">
                        <div className="font-medium">{column.name}</div>
                        {mappings[column.name] && (
                          <Badge variant="outline" className="text-xs">
                            {getFieldInfo(mappings[column.name])?.label}
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 3).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-border">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="p-2 border-r border-border text-xs">
                        {String(row[column.name] || '').length > 30
                          ? String(row[column.name] || '').substring(0, 30) + '...'
                          : String(row[column.name] || '')
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Özet */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {isValidMapping ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )}
          <span className="font-medium">
            {isValidMapping ? 'Eşleştirme Tamamlandı' : 'Eksik Eşleştirmeler Var'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {isValidMapping 
            ? 'Tüm zorunlu alanlar eşleştirildi. İçe aktarma işlemine devam edebilirsiniz.'
            : 'Lütfen tüm zorunlu alanları eşleştirin.'
          }
        </div>
      </div>
    </div>
  )
} 