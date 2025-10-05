'use client'

import { Category } from '@/types/admin/product'
import { categoryService } from './category-service'
import { OpenCartCategory } from './category-export-service'
import * as XLSX from 'xlsx'

// IMPROVED TYPE DEFINITIONS
export interface RawCategoryData {
  [key: string]: string | number | boolean | null | undefined
}

export interface ParsedCategoryData {
  category_id?: string | number
  name: string
  description?: string
  keyword?: string
  parent_id?: string | number
  status?: string | boolean
  sort_order?: string | number
  meta_title?: string
  meta_description?: string
  meta_keyword?: string
  image?: string
  image_url?: string
  [key: string]: unknown
}

export interface CategoryImportOptions {
  updateExisting: boolean
  dryRun: boolean
}

export interface CategoryImportResult {
  success: boolean
  message: string
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: CategoryImportError[]
  preview?: CategoryPreview[]
  categoryIdMap?: Map<number, string> // OpenCart ID -> Internal ID mapping
}

export interface CategoryImportError {
  row: number
  field?: string
  message: string
  data?: RawCategoryData
}

export interface CategoryPreview {
  rowNumber: number
  action: 'create' | 'update' | 'skip'
  categoryId: string
  name: string
  description: string
  keyword: string
  errors: string[]
  warnings: string[]
}

class CategoryImportService {
  private existingCategories: Category[] = []
  private categoryNameMap = new Map<string, Category>()

  async initialize() {
    try {
      console.log('CategoryImportService initialize başlıyor...')
      this.existingCategories = await categoryService.getCategories(true)
      console.log('Mevcut kategoriler yüklendi:', this.existingCategories.length)
      
      this.categoryNameMap.clear()
      
      // Hem ana kategoriler hem de alt kategoriler için name map oluştur
      const flatCategories = this.flattenCategories(this.existingCategories)
      flatCategories.forEach(category => {
        this.categoryNameMap.set(category.name.toLowerCase(), category)
      })
      
      console.log('Category name map oluşturuldu:', this.categoryNameMap.size, 'kategori')
    } catch (error) {
      console.error('CategoryImportService initialize hatası:', error)
      this.existingCategories = []
    }
  }

  private flattenCategories(categories: Category[]): Category[] {
    const result: Category[] = []
    
    const addCategory = (category: Category) => {
      result.push(category)
      if (category.children) {
        category.children.forEach(child => addCategory(child))
      }
    }
    
    categories.forEach(category => addCategory(category))
    return result
  }

  private findCategoryByName(name: string): Category | null {
    return this.categoryNameMap.get(name.toLowerCase()) || null
  }

  private generateSlug(name: string): string {
    const turkishChars: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    }

    return name
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishChars[char] || char)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private convertFromOpenCartFormat(
    data: OpenCartCategory, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: CategoryImportOptions
  ): { category: Partial<Category>; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Zorunlu alanları kontrol et
    if (!data.name?.trim()) {
      errors.push('Kategori adı zorunludur')
    }

    if (!data.category_id?.trim()) {
      errors.push('Kategori ID zorunludur')
    }

    // Kategori verilerini dönüştür
    const category: Partial<Category> = {
      name: data.name?.trim() || '',
      slug: data.keyword?.trim() || this.generateSlug(data.name || ''),
      description: data.description?.trim() || null,
      isActive: Number(data.status) === 1,
      parentId: null // Parent ID'ler daha sonra çözülecek
    }

    return { category, errors, warnings }
  }

  async parseXMLFile(file: File): Promise<OpenCartCategory[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let xmlText = e.target?.result as string
          console.log('XML dosyası okundu, boyut:', xmlText.length)
          
          if (!xmlText || xmlText.trim().length === 0) {
            reject(new Error('XML dosyası boş'))
            return
          }
          
          // UTF-8 BOM kontrolü ve temizleme
          if (xmlText.charCodeAt(0) === 0xFEFF) {
            xmlText = xmlText.slice(1)
            console.log('UTF-8 BOM tespit edildi ve temizlendi')
          }
          
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
          
          const parseError = xmlDoc.querySelector('parsererror')
          if (parseError) {
            console.error('XML parse hatası:', parseError.textContent)
            reject(new Error('XML dosyası parse edilemedi: ' + parseError.textContent))
            return
          }
          
          // Farklı XML formatlarını deneyelim
          let rows = xmlDoc.querySelectorAll('Row')
          if (rows.length === 0) {
            // OpenCart export formatı
            rows = xmlDoc.querySelectorAll('category')
          }
          if (rows.length === 0) {
            // Genel XML formatı
            rows = xmlDoc.querySelectorAll('item, record')
          }
          
          console.log('Bulunan satır sayısı:', rows.length)
          
          if (rows.length === 0) {
            reject(new Error('XML dosyasında kategori verisi bulunamadı. Desteklenen formatlar: OpenCart export, Excel XML, genel XML'))
            return
          }
          
          const categories: OpenCartCategory[] = []
          let headerRow: string[] = []
          
          rows.forEach((row, index) => {
            const cells = row.querySelectorAll('Cell Data, *')
            const rowData: string[] = []
            
            // XML düğümlerinden veri çıkarma
            if (row.tagName.toLowerCase() === 'category') {
              // OpenCart formatı
              const category: ParsedCategoryData = { name: '' }
              Array.from(row.children).forEach(child => {
                // Türkçe karakterleri koruyarak veri al
                const text = child.textContent || ''
                category[child.tagName] = text.trim()
              })
              
              console.log(`OpenCart kategori ${index + 1}:`, category)
              
              const openCartCategory: OpenCartCategory = {
                category_id: category.category_id || category.id || '',
                name: category.name || category.title || '',
                description: category.description || '',
                meta_title: category.meta_title || category.name || '',
                meta_description: category.meta_description || category.description || '',
                meta_keyword: category.meta_keyword || '',
                keyword: category.keyword || category.slug || '',
                parent_id: category.parent_id || category.parent || '0',
                sort_order: Number(category.sort_order) || 0,
                status: Number(category.status) || 1,
                date_added: category.date_added || '',
                date_modified: category.date_modified || ''
              }
              
              if (openCartCategory.name) {
                categories.push(openCartCategory)
              }
            } else {
              // Excel XML formatı
              cells.forEach(cell => {
                const text = cell.textContent || ''
                rowData.push(text.trim())
              })
              
              if (index === 0) {
                headerRow = rowData
                console.log('Header satırı:', headerRow)
              } else if (rowData.length > 0 && rowData[0]) {
                const category: ParsedCategoryData = { name: '' }
                headerRow.forEach((header, cellIndex) => {
                  const value = rowData[cellIndex] || ''
                  category[header] = value.trim()
                })
                
                console.log(`Excel XML kategori ${index + 1}:`, category)
                
                const openCartCategory: OpenCartCategory = {
                  category_id: category.category_id || category.id || '',
                  name: category.name || category.title || '',
                  description: category.description || '',
                  meta_title: category.meta_title || category.name || '',
                  meta_description: category.meta_description || category.description || '',
                  meta_keyword: category.meta_keyword || '',
                  keyword: category.keyword || category.slug || '',
                  parent_id: category.parent_id || category.parent || '0',
                  sort_order: Number(category.sort_order) || 0,
                  status: Number(category.status) || 1,
                  date_added: category.date_added || '',
                  date_modified: category.date_modified || ''
                }
                
                if (openCartCategory.name) {
                  categories.push(openCartCategory)
                }
              }
            }
          })
          
          console.log('Parse edilen kategori sayısı:', categories.length)
          console.log('İlk kategori örneği:', categories[0])
          resolve(categories)
        } catch (error) {
          console.error('XML parse hatası:', error)
          reject(new Error('XML dosyası işlenirken hata: ' + (error instanceof Error ? error.message : String(error))))
        }
      }
      
      reader.onerror = () => {
        console.error('Dosya okuma hatası')
        reject(new Error('Dosya okunamadı'))
      }
      
      // UTF-8 encoding ile oku
      reader.readAsText(file, 'UTF-8')
    })
  }

  async parseExcelFile(file: File): Promise<OpenCartCategory[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          console.log('Excel dosyası okundu, boyut:', data.byteLength)
          
          if (!data || data.byteLength === 0) {
            reject(new Error('Excel dosyası boş'))
            return
          }
          
          const workbook = XLSX.read(data, { 
            type: 'array',
            // Türkçe karakterler için ek seçenekler
            cellText: true,
            cellDates: true,
            cellNF: false,
            cellStyles: false
          })
          console.log('Excel workbook sheet isimleri:', workbook.SheetNames)
          
          // İlk sheet'i al
          const sheetName = workbook.SheetNames[0]
          if (!sheetName) {
            reject(new Error('Excel dosyasında sayfa bulunamadı'))
            return
          }
          
          const worksheet = workbook.Sheets[sheetName]
          
          // JSON formatına dönüştür
          const jsonData: (string | number | boolean)[][] = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Boş hücreler için default değer
            raw: false, // String olarak al, formatlanmış değil
            dateNF: 'yyyy-mm-dd'
          })
          
          console.log('Excel JSON verisi:', jsonData.length, 'satır')
          
          if (jsonData.length < 2) {
            reject(new Error('Excel dosyası boş veya geçersiz (en az 2 satır olmalı: header + veri)'))
            return
          }
          
          const headers = jsonData[0] as string[]
          console.log('Excel headers:', headers)
          
          if (!headers || headers.length === 0) {
            reject(new Error('Excel dosyasında header satırı bulunamadı'))
            return
          }
          
          const categories: OpenCartCategory[] = []
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as unknown[]
            if (!row || row.length === 0 || !row[0]) {
              console.log(`Satır ${i + 1} boş, atlanıyor`)
              continue
            }
            
            const category: ParsedCategoryData = { name: '' }
            headers.forEach((header, index) => {
              const value = row[index]
              if (value !== undefined && value !== null) {
                // Türkçe karakterleri koruyarak string'e çevir
                const stringValue = String(value).trim()
                category[header] = stringValue
              } else {
                category[header] = ''
              }
            })
            
            console.log(`Satır ${i + 1} verisi:`, category)
            
            const openCartCategory: OpenCartCategory = {
              category_id: category.category_id || category.id || '',
              name: category.name || category.title || '',
              description: category.description || '',
              meta_title: category.meta_title || category.name || '',
              meta_description: category.meta_description || category.description || '',
              meta_keyword: category.meta_keyword || '',
              keyword: category.keyword || category.slug || '',
              parent_id: category.parent_id || category.parent || '0',
              sort_order: Number(category.sort_order) || 0,
              status: Number(category.status) !== 0 ? Number(category.status) : 1,
              date_added: category.date_added || '',
              date_modified: category.date_modified || ''
            }
            
            if (openCartCategory.name) {
              categories.push(openCartCategory)
            } else {
              console.log(`Satır ${i + 1} - kategori adı boş, atlanıyor`)
            }
          }
          
          console.log('Excel parse sonucu:', categories.length, 'kategori')
          console.log('İlk kategori örneği:', categories[0])
          resolve(categories)
        } catch (error) {
          console.error('Excel parse hatası:', error)
          reject(new Error('Excel dosyası işlenirken hata: ' + (error instanceof Error ? error.message : String(error))))
        }
      }
      
      reader.onerror = () => {
        console.error('Excel dosya okuma hatası')
        reject(new Error('Dosya okunamadı'))
      }
      reader.readAsArrayBuffer(file)
    })
  }

  async parseCSVFile(file: File): Promise<OpenCartCategory[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let csvText = e.target?.result as string
          console.log('CSV dosyası okundu, boyut:', csvText.length)
          
          if (!csvText || csvText.trim().length === 0) {
            reject(new Error('CSV dosyası boş'))
            return
          }
          
          // UTF-8 BOM kontrolü ve temizleme
          if (csvText.charCodeAt(0) === 0xFEFF) {
            csvText = csvText.slice(1)
            console.log('UTF-8 BOM tespit edildi ve temizlendi')
          }
          
          // Farklı satır sonları için normalize et
          csvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
          
          const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
          console.log('CSV satır sayısı:', lines.length)
          
          if (lines.length < 2) {
            reject(new Error('CSV dosyası boş veya geçersiz (en az 2 satır olmalı: header + veri)'))
            return
          }
          
          const headers = this.parseCSVLine(lines[0])
          console.log('CSV headers:', headers)
          
          if (!headers || headers.length === 0) {
            reject(new Error('CSV dosyasında header satırı bulunamadı'))
            return
          }
          
          const categories: OpenCartCategory[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line) {
              console.log(`Satır ${i + 1} boş, atlanıyor`)
              continue
            }
            
            const values = this.parseCSVLine(line)
            console.log(`Satır ${i + 1} parse sonucu:`, values)
            
            if (values.length === 0 || !values[0]) {
              console.log(`Satır ${i + 1} - ilk değer boş, atlanıyor`)
              continue
            }
            
            const category: ParsedCategoryData = { name: '' }
            headers.forEach((header, index) => {
              const value = values[index] || ''
              // Türkçe karakterleri koruyarak temizle
              category[header] = value.trim()
            })
            
            console.log(`Satır ${i + 1} kategori verisi:`, category)
            
            const openCartCategory: OpenCartCategory = {
              category_id: category.category_id || category.id || '',
              name: category.name || category.title || '',
              description: category.description || '',
              meta_title: category.meta_title || category.name || '',
              meta_description: category.meta_description || category.description || '',
              meta_keyword: category.meta_keyword || '',
              keyword: category.keyword || category.slug || '',
              parent_id: category.parent_id || category.parent || '0',
              sort_order: Number(category.sort_order) || 0,
              status: Number(category.status) !== 0 ? Number(category.status) : 1,
              date_added: category.date_added || '',
              date_modified: category.date_modified || ''
            }
            
            if (openCartCategory.name) {
              categories.push(openCartCategory)
            } else {
              console.log(`Satır ${i + 1} - kategori adı boş, atlanıyor`)
            }
          }
          
          console.log('CSV parse sonucu:', categories.length, 'kategori')
          console.log('İlk kategori örneği:', categories[0])
          resolve(categories)
        } catch (error) {
          console.error('CSV parse hatası:', error)
          reject(new Error('CSV dosyası işlenirken hata: ' + (error instanceof Error ? error.message : String(error))))
        }
      }
      
      reader.onerror = () => {
        console.error('CSV dosya okuma hatası')
        reject(new Error('Dosya okunamadı'))
      }
      
      // UTF-8 encoding ile oku
      reader.readAsText(file, 'UTF-8')
    })
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    
    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes) {
          // Çift tırnak kontrolü (escaped quote)
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i += 2 // İki karakter atla
            continue
          } else {
            // Tırnak kapandı
            inQuotes = false
          }
        } else {
          // Tırnak açıldı
          inQuotes = true
        }
      } else if (char === ',' && !inQuotes) {
        // Virgül ile ayrım yap (sadece tırnak dışındaysa)
        result.push(current.trim())
        current = ''
      } else {
        // Normal karakter ekle (Türkçe karakterler dahil)
        current += char
      }
      
      i++
    }
    
    // Son field'i ekle
    result.push(current.trim())
    
    // Boş stringleri temizle ama array boyutunu koru
    return result.map(field => field || '')
  }

  async preview(file: File, options: CategoryImportOptions): Promise<CategoryPreview[]> {
    await this.initialize()
    
    console.log('Dosya parse ediliyor...', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    })
    
    let openCartCategories: OpenCartCategory[]
    
    try {
      const fileName = file.name.toLowerCase()
      if (fileName.endsWith('.xml')) {
        console.log('XML dosyası parse ediliyor...')
        openCartCategories = await this.parseXMLFile(file)
      } else if (fileName.endsWith('.csv')) {
        console.log('CSV dosyası parse ediliyor...')
        openCartCategories = await this.parseCSVFile(file)
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        console.log('Excel dosyası parse ediliyor...')
        openCartCategories = await this.parseExcelFile(file)
      } else {
        throw new Error('Desteklenmeyen dosya formatı. XML, CSV, XLS veya XLSX dosyası seçin.')
      }
      
      console.log('Parse edilen kategori sayısı:', openCartCategories.length)
      
      if (openCartCategories.length === 0) {
        throw new Error('Dosyada kategori verisi bulunamadı')
      }
      
    } catch (error) {
      console.error('Dosya parse hatası:', error)
      throw error
    }
    
    const previews: CategoryPreview[] = []
    
    for (let i = 0; i < Math.min(openCartCategories.length, 100); i++) {
      const data = openCartCategories[i]
      console.log(`Kategori ${i + 1} işleniyor:`, data)
      
      const { category, errors, warnings } = this.convertFromOpenCartFormat(data, options)
      
      let action: 'create' | 'update' | 'skip' = 'create'
      
      if (category.name) {
        const existingCategory = this.findCategoryByName(category.name)
        if (existingCategory) {
          action = options.updateExisting ? 'update' : 'skip'
        }
      }
      
      if (errors.length > 0) {
        action = 'skip'
      }
      
      previews.push({
        rowNumber: i + 2,
        action,
        categoryId: data.category_id,
        name: category.name || '',
        description: category.description || '',
        keyword: category.slug || '',
        errors,
        warnings
      })
    }
    
    console.log('Oluşturulan preview sayısı:', previews.length)
    return previews
  }

  async import(file: File, options: CategoryImportOptions): Promise<CategoryImportResult> {
    if (options.dryRun) {
      const preview = await this.preview(file, options)
      return {
        success: true,
        message: 'Önizleme tamamlandı',
        totalProcessed: preview.length,
        successCount: preview.filter(p => p.action !== 'skip').length,
        errorCount: preview.filter(p => p.errors.length > 0).length,
        errors: [],
        preview
      }
    }
    
    await this.initialize()
    
    let openCartCategories: OpenCartCategory[]
    
    try {
      const fileName = file.name.toLowerCase()
      if (fileName.endsWith('.xml')) {
        openCartCategories = await this.parseXMLFile(file)
      } else if (fileName.endsWith('.csv')) {
        openCartCategories = await this.parseCSVFile(file)
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        openCartCategories = await this.parseExcelFile(file)
      } else {
        throw new Error('Desteklenmeyen dosya formatı. XML, CSV, XLS veya XLSX dosyası seçin.')
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Dosya parse edilemedi',
        totalProcessed: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Dosya parse edilemedi' }]
      }
    }
    
    const errors: CategoryImportError[] = []
    const categoryIdMap = new Map<string, string>() // OpenCart ID -> Internal UUID
    let successCount = 0
    
    console.log('Import başlıyor, toplam kategori:', openCartCategories.length)
    
    // Kategorileri parent_id'ye göre sırala - önce ana kategoriler (parent_id = 0)
    const sortedCategories = [...openCartCategories].sort((a, b) => {
      const aParent = a.parent_id || '0'
      const bParent = b.parent_id || '0'
      
      // Ana kategoriler önce (parent_id = 0)
      if (aParent === '0' && bParent !== '0') return -1
      if (aParent !== '0' && bParent === '0') return 1
      
      // İkisi de ana kategori ise category_id'ye göre sırala
      if (aParent === '0' && bParent === '0') {
        return Number(a.category_id) - Number(b.category_id)
      }
      
      // İkisi de alt kategori ise parent_id'ye sonra category_id'ye göre sırala
      const parentDiff = Number(aParent) - Number(bParent)
      if (parentDiff !== 0) return parentDiff
      
      return Number(a.category_id) - Number(b.category_id)
    })
    
    console.log('Sıralanmış kategoriler:', sortedCategories.map(c => ({ 
      id: c.category_id, 
      name: c.name, 
      parent: c.parent_id 
    })))
    
    // Tüm kategorileri sırayla işle
    for (let i = 0; i < sortedCategories.length; i++) {
      const data = sortedCategories[i]
      const rowNumber = openCartCategories.findIndex(oc => oc.category_id === data.category_id) + 2
      
      try {
        console.log(`İşleniyor: ${data.category_id} - ${data.name} (parent: ${data.parent_id})`)
        
        const { category, errors: conversionErrors } = this.convertFromOpenCartFormat(data, options)
        
        if (conversionErrors.length > 0) {
          errors.push({
            row: rowNumber,
            message: conversionErrors.join(', '),
            data
          })
          continue
        }
        
        // Parent ID'yi çözümle (alt kategori ise)
        if (data.parent_id && data.parent_id !== '0') {
          const parentInternalId = categoryIdMap.get(data.parent_id)
          if (parentInternalId) {
            category.parentId = parentInternalId
            console.log(`Parent ID çözümlendi: ${data.parent_id} -> ${parentInternalId}`)
          } else {
            errors.push({
              row: rowNumber,
              message: `Parent kategori bulunamadı: ${data.parent_id}`,
              data
            })
            continue
          }
        } else {
          category.parentId = null // Ana kategori
        }
        
        // Mevcut kategori kontrolü
        const existingCategory = this.findCategoryByName(category.name!)
        
        if (existingCategory) {
          if (options.updateExisting) {
            console.log(`Güncelleniyor: ${category.name}`)
            const updatedCategory = await categoryService.updateCategory(existingCategory.id, category)
            categoryIdMap.set(data.category_id, updatedCategory.id)
            successCount++
          } else {
            categoryIdMap.set(data.category_id, existingCategory.id)
            console.log(`Atlandı (mevcut): ${category.name}`)
          }
        } else {
          console.log(`Oluşturuluyor: ${category.name}`)
          const newCategory = await categoryService.createCategory(category)
          categoryIdMap.set(data.category_id, newCategory.id)
          console.log(`Oluşturuldu: ${data.category_id} -> ${newCategory.id}`)
          successCount++
        }
        
      } catch (error) {
        console.error(`Hata (satır ${rowNumber}):`, error)
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Bilinmeyen hata',
          data
        })
      }
    }
    
    console.log('Import tamamlandı:', { successCount, errorCount: errors.length })
    
    return {
      success: successCount > 0,
      message: `${successCount} kategori başarıyla işlendi, ${errors.length} hata`,
      totalProcessed: openCartCategories.length,
      successCount,
      errorCount: errors.length,
      errors,
      categoryIdMap
    }
  }
}

export const categoryImportService = new CategoryImportService()