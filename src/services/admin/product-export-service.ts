'use client'

import { Product, Category } from '@/types/admin/product'
import { productService } from './product-service'
import { categoryService } from './category-service'
import * as XLSX from 'xlsx'

export interface ExportOptions {
  format: 'xml' | 'csv' | 'excel'
  includeImages: boolean
  includeCategories: boolean
  includeVariants: boolean
  filters?: {
    categoryId?: string
    status?: string
    searchTerm?: string
  }
}

export interface OpenCartProduct {
  product_id: string
  name: string
  categories: string
  sku: string
  upc: string
  ean: string
  jan: string
  isbn: string
  mpn: string
  location: string
  quantity: number
  model: string
  manufacturer: string
  image_name: string
  shipping: string
  price: number
  points: number
  date_added: string
  date_modified: string
  date_available: string
  weight: number
  weight_unit: string
  length: number
  width: number
  height: number
  length_unit: string
  status: number
  tax_class_id: number
  description: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  stock_status_id: number
  store_ids: string
  layout: string
  related_ids: string
  tags: string
  sort_order: number
  subtract: number
  minimum: number
}

class ProductExportService {
  private categories: Category[] = []
  private categoryIdMap = new Map<string, number>() // Internal UUID -> OpenCart numeric ID

  async initialize() {
    try {
      this.categories = await categoryService.getCategories()
      this.categoryIdMap = this.createCategoryIdMap(this.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
      this.categories = []
    }
  }

  private createCategoryIdMap(categories: Category[]): Map<string, number> {
    const idMap = new Map<string, number>()
    let counter = 100 // 100'den başlayarak üç basamaklı sayılar
    
    // Önce ana kategoriler, sonra alt kategoriler
    const flatCategories = this.flattenCategories(categories)
    
    flatCategories.forEach(category => {
      idMap.set(category.id, counter)
      counter++
    })
    
    return idMap
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

  private getCategoryName(categoryId: string | null): string {
    if (!categoryId) return ''
    const category = this.categories.find(c => c.id === categoryId)
    return category?.name || ''
  }

  private getCategoryNumericId(categoryId: string | null): string {
    if (!categoryId) return ''
    const numericId = this.categoryIdMap.get(categoryId)
    return numericId ? numericId.toString().padStart(3, '0') : ''
  }

  private convertToOpenCartFormat(product: Product): OpenCartProduct {
    return {
      product_id: product.id,
      name: product.name,
      categories: this.getCategoryNumericId(product.categoryId),
      sku: product.sku || '',
      upc: '',
      ean: '',
      jan: '',
      isbn: '',
      mpn: product.sku || '',
      location: '',
      quantity: product.stockQuantity,
      model: product.sku || product.name,
      manufacturer: '',
      image_name: product.images.length > 0 ? product.images[0].url : '',
      shipping: '1',
      price: product.price,
      points: 0,
      date_added: product.createdAt.toISOString().split('T')[0],
      date_modified: product.updatedAt.toISOString().split('T')[0],
      date_available: product.createdAt.toISOString().split('T')[0],
      weight: product.weight || 0,
      weight_unit: 'kg',
      length: product.dimensions?.length || 0,
      width: product.dimensions?.width || 0,
      height: product.dimensions?.height || 0,
      length_unit: product.dimensions?.unit || 'cm',
      status: product.isActive ? 1 : 0,
      tax_class_id: 0,
      description: product.description || '',
      meta_title: product.name,
      meta_description: product.shortDescription || '',
      meta_keywords: product.tags.join(', '),
      stock_status_id: product.stockQuantity > 0 ? 7 : 5, // 7: In Stock, 5: Out of Stock
      store_ids: '0',
      layout: '',
      related_ids: '',
      tags: product.tags.join(', '),
      sort_order: 0,
      subtract: 1,
      minimum: 1
    }
  }

  async exportToXML(options: ExportOptions): Promise<string> {
    await this.initialize()
    
    const products = await productService.getProducts({
      search: options.filters?.searchTerm,
      categoryId: options.filters?.categoryId,
      status: options.filters?.status
    })
    
    const openCartProducts = products.products.map(product => this.convertToOpenCartFormat(product))
    
    const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>RDHN Commerce</Author>
  <Created>${new Date().toISOString()}</Created>
  <Version>16.00</Version>
 </DocumentProperties>
 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
  <WindowHeight>11025</WindowHeight>
  <WindowWidth>28800</WindowWidth>
  <ProtectStructure>False</ProtectStructure>
  <ProtectWindows>False</ProtectWindows>
 </ExcelWorkbook>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Arial" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="s16">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F0F0F0"/>
   </Borders>
   <Font ss:FontName="Arial" ss:Color="#000000"/>
   <Interior ss:Color="#F0F0F0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s17">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="s18">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Color="#000000"/>
   <NumberFormat ss:Format="@"/>
  </Style>
  <Style ss:ID="s19">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Color="#000000"/>
   <NumberFormat ss:Format="######0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Products">
  <Table ss:ExpandedColumnCount="40" ss:ExpandedRowCount="${openCartProducts.length + 1}" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="66" ss:DefaultRowHeight="15">`

    const xmlRows = openCartProducts.map(product => `
   <Row ss:AutoFitHeight="0" ss:Height="25.5">
    <Cell ss:StyleID="s17"><Data ss:Type="String">${product.product_id}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.name)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.categories)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.sku)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.upc)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.ean)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.jan)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.isbn)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.mpn)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.location)}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.quantity}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.model)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.manufacturer)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.image_name)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.shipping}</Data></Cell>
    <Cell ss:StyleID="s19"><Data ss:Type="Number">${product.price}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.points}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.date_added}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.date_modified}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.date_available}</Data></Cell>
    <Cell ss:StyleID="s19"><Data ss:Type="Number">${product.weight}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.weight_unit}</Data></Cell>
    <Cell ss:StyleID="s19"><Data ss:Type="Number">${product.length}</Data></Cell>
    <Cell ss:StyleID="s19"><Data ss:Type="Number">${product.width}</Data></Cell>
    <Cell ss:StyleID="s19"><Data ss:Type="Number">${product.height}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.length_unit}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.status}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.tax_class_id}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.description)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.meta_title)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.meta_description)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.meta_keywords)}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.stock_status_id}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${product.store_ids}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.layout)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.related_ids)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(product.tags)}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.sort_order}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.subtract}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${product.minimum}</Data></Cell>
   </Row>`).join('')

    const xmlHeader2 = `
   <Row ss:AutoFitHeight="0" ss:Height="30">
    <Cell ss:StyleID="s16"><Data ss:Type="String">product_id</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">name(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">categories</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">sku+</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">upc</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">ean</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">jan</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">isbn</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">mpn</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">location</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">quantity</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">model</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">manufacturer</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">image_name</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">shipping</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">price</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">points</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">date_added</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">date_modified</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">date_available</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">weight</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">weight_unit</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">length</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">width</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">height</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">length_unit</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">status</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">tax_class_id</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">description(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">meta_title(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">meta_description(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">meta_keywords(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">stock_status_id</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">store_ids</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">layout</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">related_ids</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">tags(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">sort_order</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">subtract</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">minimum</Data></Cell>
   </Row>`

    const xmlFooter = `
  </Table>
 </Worksheet>
</Workbook>`

    return xmlHeader + xmlHeader2 + xmlRows + xmlFooter
  }

  async exportToExcel(options: ExportOptions): Promise<ArrayBuffer> {
    await this.initialize()
    
    const products = await productService.getProducts({
      search: options.filters?.searchTerm,
      categoryId: options.filters?.categoryId,
      status: options.filters?.status
    })
    
    const openCartProducts = products.products.map(product => this.convertToOpenCartFormat(product))
    
    // Excel için header ve data hazırla
    const headers = [
      'product_id', 'name(tr-tr)', 'categories', 'sku+', 'upc', 'ean', 'jan', 'isbn', 'mpn', 'location',
      'quantity', 'model', 'manufacturer', 'image_name', 'shipping', 'price', 'points',
      'date_added', 'date_modified', 'date_available', 'weight', 'weight_unit', 'length',
      'width', 'height', 'length_unit', 'status', 'tax_class_id', 'description(tr-tr)',
      'meta_title(tr-tr)', 'meta_description(tr-tr)', 'meta_keywords(tr-tr)', 'stock_status_id', 'store_ids',
      'layout', 'related_ids', 'tags(tr-tr)', 'sort_order', 'subtract', 'minimum'
    ]
    
    const worksheetData = [
      // Header row
      headers,
      // Data rows
      ...openCartProducts.map(product => [
        product.product_id,
        product.name,
        product.categories,
        product.sku,
        product.upc,
        product.ean,
        product.jan,
        product.isbn,
        product.mpn,
        product.location,
        product.quantity,
        product.model,
        product.manufacturer,
        product.image_name,
        product.shipping,
        product.price,
        product.points,
        product.date_added,
        product.date_modified,
        product.date_available,
        product.weight,
        product.weight_unit,
        product.length,
        product.width,
        product.height,
        product.length_unit,
        product.status,
        product.tax_class_id,
        product.description,
        product.meta_title,
        product.meta_description,
        product.meta_keywords,
        product.stock_status_id,
        product.store_ids,
        product.layout,
        product.related_ids,
        product.tags,
        product.sort_order,
        product.subtract,
        product.minimum
      ])
    ]
    
    // Workbook oluştur
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Sütun genişliklerini ayarla
    const columnWidths = [
      { wch: 12 }, // product_id
      { wch: 30 }, // name
      { wch: 15 }, // categories
      { wch: 15 }, // sku
      { wch: 12 }, // upc
      { wch: 12 }, // ean
      { wch: 12 }, // jan
      { wch: 12 }, // isbn
      { wch: 12 }, // mpn
      { wch: 15 }, // location
      { wch: 10 }, // quantity
      { wch: 20 }, // model
      { wch: 20 }, // manufacturer
      { wch: 25 }, // image_name
      { wch: 10 }, // shipping
      { wch: 12 }, // price
      { wch: 10 }, // points
      { wch: 12 }, // date_added
      { wch: 12 }, // date_modified
      { wch: 12 }, // date_available
      { wch: 10 }, // weight
      { wch: 10 }, // weight_unit
      { wch: 10 }, // length
      { wch: 10 }, // width
      { wch: 10 }, // height
      { wch: 10 }, // length_unit
      { wch: 8 },  // status
      { wch: 12 }, // tax_class_id
      { wch: 50 }, // description
      { wch: 30 }, // meta_title
      { wch: 40 }, // meta_description
      { wch: 25 }, // meta_keywords
      { wch: 12 }, // stock_status_id
      { wch: 10 }, // store_ids
      { wch: 15 }, // layout
      { wch: 20 }, // related_ids
      { wch: 25 }, // tags
      { wch: 10 }, // sort_order
      { wch: 10 }, // subtract
      { wch: 10 }  // minimum
    ]
    worksheet['!cols'] = columnWidths
    
    // Header stilini ayarla
    const headerStyle = {
      fill: { fgColor: { rgb: "F0F0F0" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    }
    
    // Header hücrelerine stil uygula (A1'den başlayarak)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const getColumnName = (index: number) => {
      if (index < 26) return alphabet[index]
      return alphabet[Math.floor(index / 26) - 1] + alphabet[index % 26]
    }
    
    for (let i = 0; i < headers.length; i++) {
      const cellRef = getColumnName(i) + '1'
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle
      }
    }
    
    // Worksheet'i workbook'a ekle
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
    
    // Excel dosyasını buffer olarak döndür
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  }

  async exportToCSV(options: ExportOptions): Promise<string> {
    await this.initialize()
    
    const products = await productService.getProducts({
      search: options.filters?.searchTerm,
      categoryId: options.filters?.categoryId,
      status: options.filters?.status
    })
    
    const openCartProducts = products.products.map(product => this.convertToOpenCartFormat(product))
    
    const headers = [
      'product_id', 'name', 'categories', 'sku', 'upc', 'ean', 'jan', 'isbn', 'mpn', 'location',
      'quantity', 'model', 'manufacturer', 'image_name', 'shipping', 'price', 'points',
      'date_added', 'date_modified', 'date_available', 'weight', 'weight_unit', 'length',
      'width', 'height', 'length_unit', 'status', 'tax_class_id', 'description',
      'meta_title', 'meta_description', 'meta_keywords', 'stock_status_id', 'store_ids',
      'layout', 'related_ids', 'tags', 'sort_order', 'subtract', 'minimum'
    ]
    
    const csvRows = openCartProducts.map(product => {
      return headers.map(header => {
        const value = product[header as keyof OpenCartProduct]
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })
    
    return [headers.join(','), ...csvRows].join('\n')
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  downloadFile(content: string | ArrayBuffer, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async export(options: ExportOptions): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0]
    
    try {
      if (options.format === 'xml') {
        const xmlContent = await this.exportToXML(options)
        this.downloadFile(xmlContent, `products-${timestamp}.xml`, 'application/xml')
      } else if (options.format === 'csv') {
        const csvContent = await this.exportToCSV(options)
        this.downloadFile(csvContent, `products-${timestamp}.csv`, 'text/csv')
      } else if (options.format === 'excel') {
        const excelContent = await this.exportToExcel(options)
        this.downloadFile(excelContent, `products-${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      }
    } catch (error) {
      console.error('Export failed:', error)
      throw new Error('Dışa aktarma başarısız oldu: ' + (error instanceof Error ? error.message : String(error)))
    }
  }
}

export const productExportService = new ProductExportService()