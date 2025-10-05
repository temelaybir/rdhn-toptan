import * as XLSX from 'xlsx'

// Ürün alanları tanımları
export interface ProductField {
  key: string
  label: string
  required: boolean
  type: 'text' | 'number' | 'boolean' | 'array' | 'url'
  description: string
  examples?: string[]
}

// Dosyadan çıkarılan sütun bilgisi
export interface DetectedColumn {
  index: number
  name: string
  dataType: 'text' | 'number' | 'boolean' | 'mixed'
  sampleValues: string[]
  hasData: boolean
  suggestedField?: string // Otomatik önerilen alan
}

// Analiz sonucu
export interface FileAnalysisResult {
  columns: DetectedColumn[]
  totalRows: number
  sampleData: any[] // Tüm veri
  previewData: any[] // İlk 5 satır
  fileInfo: {
    name: string
    size: number
    type: string
  }
}

// Ürün tablosu alanları
export const PRODUCT_FIELDS: ProductField[] = [
  {
    key: 'name',
    label: 'Ürün Adı',
    required: true,
    type: 'text',
    description: 'Ürünün görünür adı',
    examples: ['iPhone 14', 'Nike Air Max', 'Samsung TV']
  },
  {
    key: 'price',
    label: 'Fiyat',
    required: true,
    type: 'number',
    description: 'Ürün satış fiyatı (TL)',
    examples: ['1200.50', '899', '2500.99']
  },
  {
    key: 'stock_quantity',
    label: 'Stok Adedi',
    required: true,
    type: 'number',
    description: 'Mevcut stok miktarı',
    examples: ['10', '50', '0']
  },
  {
    key: 'images',
    label: 'Görseller',
    required: true,
    type: 'array',
    description: 'Ürün görsel URL\'leri (virgülle ayrılmış)',
    examples: ['https://example.com/img1.jpg', 'img1.jpg,img2.jpg,img3.jpg']
  },
  {
    key: 'description',
    label: 'Açıklama',
    required: false,
    type: 'text',
    description: 'Detaylı ürün açıklaması'
  },
  {
    key: 'short_description',
    label: 'Kısa Açıklama',
    required: false,
    type: 'text',
    description: 'Özet ürün açıklaması'
  },
  {
    key: 'compare_price',
    label: 'Karşılaştırma Fiyatı',
    required: false,
    type: 'number',
    description: 'Eski/karşılaştırma fiyatı'
  },
  {
    key: 'cost_price',
    label: 'Maliyet Fiyatı',
    required: false,
    type: 'number',
    description: 'Ürün maliyet fiyatı'
  },
  {
    key: 'sku',
    label: 'SKU',
    required: false,
    type: 'text',
    description: 'Stok Kodu (benzersiz olmalı)',
    examples: ['SKU-001', 'IPHONE14-BLK']
  },
  {
    key: 'barcode',
    label: 'Barkod',
    required: false,
    type: 'text',
    description: 'Ürün barkodu'
  },
  {
    key: 'weight',
    label: 'Ağırlık',
    required: false,
    type: 'number',
    description: 'Ürün ağırlığı (kg)'
  },
  {
    key: 'dimensions',
    label: 'Boyutlar',
    required: false,
    type: 'text',
    description: 'Ürün boyutları (ör: 10x20x30 cm)'
  },
  {
    key: 'category',
    label: 'Kategori',
    required: false,
    type: 'text',
    description: 'Ürün kategorisi'
  },
  {
    key: 'is_active',
    label: 'Aktif',
    required: false,
    type: 'boolean',
    description: 'Ürün aktif mi?',
    examples: ['true', 'false', '1', '0', 'evet', 'hayır']
  },
  {
    key: 'is_featured',
    label: 'Öne Çıkan',
    required: false,
    type: 'boolean',
    description: 'Öne çıkan ürün mü?'
  },
  {
    key: 'tags',
    label: 'Etiketler',
    required: false,
    type: 'array',
    description: 'Ürün etiketleri (virgülle ayrılmış)',
    examples: ['elektronik,telefon,apple', 'ayakkabı,spor']
  }
]

export class ColumnAnalyzerService {
  /**
   * Dosyayı analiz eder ve sütun bilgilerini çıkarır
   */
  async analyzeFile(file: File): Promise<FileAnalysisResult> {
    try {
      let data: any[]
      
      if (file.name.endsWith('.csv')) {
        data = await this.parseCSV(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await this.parseExcel(file)
      } else {
        throw new Error('Desteklenmeyen dosya formatı. Sadece CSV, XLS ve XLSX dosyaları desteklenir.')
      }

      if (!data || data.length === 0) {
        throw new Error('Dosyada geçerli veri bulunamadı')
      }

      // Sütunları analiz et
      const columns = this.analyzeColumns(data)
      
      // İlk 5 satırı önizleme için al, ancak tüm veriyi sampleData'da sakla
      const previewData = data.slice(0, 5)

      return {
        columns,
        totalRows: data.length,
        sampleData: data, // Tüm veri
        previewData, // İlk 5 satır
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      }

    } catch (error) {
      console.error('Dosya analiz hatası:', error)
      throw error
    }
  }

  /**
   * CSV dosyasını parse eder
   */
  private async parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const workbook = XLSX.read(text, { type: 'string' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // İlk satırı header olarak kullan
          const headers = data[0] as string[]
          const rows = data.slice(1) as any[][]
          
          const result = rows.map(row => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index] || ''
            })
            return obj
          })
          
          resolve(result)
        } catch (error) {
          reject(new Error('CSV dosyası okunamadı'))
        }
      }
      
      reader.onerror = () => reject(new Error('Dosya okunamadı'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * Excel dosyasını parse eder
   */
  private async parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          resolve(jsonData)
        } catch (error) {
          reject(new Error('Excel dosyası okunamadı'))
        }
      }
      
      reader.onerror = () => reject(new Error('Dosya okunamadı'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Sütunları analiz eder ve veri tiplerini belirler
   */
  private analyzeColumns(data: any[]): DetectedColumn[] {
    if (!data || data.length === 0) return []

    const firstRow = data[0]
    const columnNames = Object.keys(firstRow)
    
    return columnNames.map((columnName, index) => {
      // Sütundaki tüm değerleri topla
      const allValues = data
        .map(row => row[columnName])
        .filter(value => value !== null && value !== undefined && value !== '')
        .map(value => String(value).trim())
      
      // Benzersiz değerleri al ve ilk 5'ini örnek olarak göster
      const uniqueValues = [...new Set(allValues)]
      const sampleValues = uniqueValues.slice(0, 5)
      
      // Veri tipini belirle
      const dataType = this.detectDataType(allValues)
      
      // Otomatik alan önerisi
      const suggestedField = this.suggestField(columnName, sampleValues, dataType)
      
      return {
        index,
        name: columnName,
        dataType,
        sampleValues,
        hasData: allValues.length > 0,
        suggestedField
      }
    })
  }

  /**
   * Veri tipini belirler
   */
  private detectDataType(values: string[]): 'text' | 'number' | 'boolean' | 'mixed' {
    if (values.length === 0) return 'text'
    
    let numberCount = 0
    let booleanCount = 0
    let textCount = 0
    
    values.forEach(value => {
      const trimmed = value.toLowerCase().trim()
      
      // Boolean kontrolü
      if (['true', 'false', '1', '0', 'evet', 'hayır', 'yes', 'no'].includes(trimmed)) {
        booleanCount++
      }
      // Sayı kontrolü
      else if (!isNaN(Number(trimmed)) && trimmed !== '') {
        numberCount++
      }
      // Metin
      else {
        textCount++
      }
    })
    
    const total = values.length
    
    // %80 ve üzeri aynı tipte ise o tip
    if (numberCount / total >= 0.8) return 'number'
    if (booleanCount / total >= 0.8) return 'boolean'
    if (textCount / total >= 0.8) return 'text'
    
    return 'mixed'
  }

  /**
   * Sütun adına ve içeriğine göre alan önerir
   */
  private suggestField(columnName: string, sampleValues: string[], dataType: string): string | undefined {
    const lowerColumnName = columnName.toLowerCase().trim()
    
    // Sütun adı eşleştirmeleri
    const nameMapping: Record<string, string> = {
      // Ürün adı
      'name': 'name',
      'ürün adı': 'name',
      'urun adi': 'name',
      'product name': 'name',
      'title': 'name',
      'başlık': 'name',
      'baslik': 'name',
      
      // Fiyat
      'price': 'price',
      'fiyat': 'price',
      'satış fiyatı': 'price',
      'satis fiyati': 'price',
      'sale price': 'price',
      'amount': 'price',
      
      // Stok
      'stock': 'stock_quantity',
      'stok': 'stock_quantity',
      'stock quantity': 'stock_quantity',
      'quantity': 'stock_quantity',
      'miktar': 'stock_quantity',
      'adet': 'stock_quantity',
      
      // Görseller
      'image': 'images',
      'images': 'images',
      'görsel': 'images',
      'gorsel': 'images',
      'resim': 'images',
      'photo': 'images',
      'picture': 'images',
      'img': 'images',
      'image_url': 'images',
      'image url': 'images',
      
      // Açıklama
      'description': 'description',
      'açıklama': 'description',
      'aciklama': 'description',
      'desc': 'description',
      'details': 'description',
      'detay': 'description',
      
      // SKU
      'sku': 'sku',
      'stock code': 'sku',
      'stok kodu': 'sku',
      'product code': 'sku',
      'ürün kodu': 'sku',
      'urun kodu': 'sku',
      
      // Kategori
      'category': 'category',
      'kategori': 'category',
      'cat': 'category',
      
      // Barkod
      'barcode': 'barcode',
      'barkod': 'barcode',
      
      // Ağırlık
      'weight': 'weight',
      'ağırlık': 'weight',
      'agirlik': 'weight',
      
      // Karşılaştırma fiyatı
      'compare price': 'compare_price',
      'old price': 'compare_price',
      'eski fiyat': 'compare_price',
      'market price': 'compare_price'
    }
    
    // Direkt eşleşme kontrolü
    if (nameMapping[lowerColumnName]) {
      return nameMapping[lowerColumnName]
    }
    
    // Kısmi eşleşme kontrolü
    for (const [key, value] of Object.entries(nameMapping)) {
      if (lowerColumnName.includes(key) || key.includes(lowerColumnName)) {
        return value
      }
    }
    
    // Veri tipine göre öneri
    if (dataType === 'number') {
      // İlk sayısal alan genellikle fiyat olur
      if (sampleValues.some(v => parseFloat(v) > 0)) {
        return 'price'
      }
    }
    
    return undefined
  }

  /**
   * Zorunlu alanların eşleştirilip eşleştirilmediğini kontrol eder
   */
  validateRequiredFields(fieldMappings: Record<string, string>): string[] {
    const errors: string[] = []
    const requiredFields = PRODUCT_FIELDS.filter(field => field.required)
    
    requiredFields.forEach(field => {
      const isMapped = Object.values(fieldMappings).includes(field.key)
      if (!isMapped) {
        errors.push(`"${field.label}" alanı zorunludur ve eşleştirilmelidir`)
      }
    })
    
    return errors
  }
}

export const columnAnalyzerService = new ColumnAnalyzerService() 