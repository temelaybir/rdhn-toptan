'use client'

import { Category } from '@/types/admin/product'
import { categoryService } from './category-service'
import * as XLSX from 'xlsx'

export interface CategoryExportOptions {
  format: 'csv' | 'xml' | 'excel'
  includeInactive: boolean
}

export interface OpenCartCategory {
  category_id: string
  parent_id: string
  name: string
  top: string
  columns: number
  sort_order: number
  image_name: string
  description: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  store_ids: string
  layout: string
  status: string
}

class CategoryExportService {
  
  private convertToOpenCartFormat(category: Category, categoryIdMap: Map<string, number>): OpenCartCategory {
    // Üç basamaklı sayısal ID oluştur
    const numericId = categoryIdMap.get(category.id) || 0
    const parentNumericId = category.parentId ? (categoryIdMap.get(category.parentId) || 0) : 0
    
    return {
      category_id: numericId.toString(),
      parent_id: parentNumericId > 0 ? parentNumericId.toString() : '0',
      name: category.name,
      top: category.parentId ? 'false' : 'true', // Ana kategori ise true
      columns: 1,
      sort_order: 0,
      image_name: '', // Kategori görseli varsa buraya eklenecek
      description: category.description || '',
      meta_title: category.name,
      meta_description: category.description || '',
      meta_keywords: category.name,
      store_ids: '0',
      layout: '0:',
      status: category.isActive ? 'true' : 'false'
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

  async exportToCSV(options: CategoryExportOptions): Promise<string> {
    const categories = await categoryService.getCategories(options.includeInactive)
    const allCategories = this.flattenCategories(categories)
    const categoryIdMap = this.createCategoryIdMap(categories)
    
    const openCartCategories = allCategories.map(category => 
      this.convertToOpenCartFormat(category, categoryIdMap)
    )
    
    const headers = [
      'category_id',
      'parent_id',
      'name(tr-tr)',
      'top',
      'columns',
      'sort_order',
      'image_name',
      'description(tr-tr)',
      'meta_title(tr-tr)',
      'meta_description(tr-tr)',
      'meta_keywords(tr-tr)',
      'store_ids',
      'layout',
      'status'
    ]
    
    const csvRows = openCartCategories.map(category => {
      return [
        category.category_id,
        category.parent_id,
        `"${category.name.replace(/"/g, '""')}"`,
        category.top,
        category.columns,
        category.sort_order,
        `"${category.image_name.replace(/"/g, '""')}"`,
        `"${category.description.replace(/"/g, '""')}"`,
        `"${category.meta_title.replace(/"/g, '""')}"`,
        `"${category.meta_description.replace(/"/g, '""')}"`,
        `"${category.meta_keywords.replace(/"/g, '""')}"`,
        category.store_ids,
        `"${category.layout.replace(/"/g, '""')}"`,
        category.status
      ].join(',')
    })
    
    return [headers.join(','), ...csvRows].join('\n')
  }

  async exportToExcel(options: CategoryExportOptions): Promise<ArrayBuffer> {
    const categories = await categoryService.getCategories(options.includeInactive)
    const allCategories = this.flattenCategories(categories)
    const categoryIdMap = this.createCategoryIdMap(categories)
    
    const openCartCategories = allCategories.map(category => 
      this.convertToOpenCartFormat(category, categoryIdMap)
    )
    
    // Excel için veri hazırla
    const worksheetData = [
      // Header row
      [
        'category_id',
        'parent_id', 
        'name(tr-tr)',
        'top',
        'columns',
        'sort_order',
        'image_name',
        'description(tr-tr)',
        'meta_title(tr-tr)',
        'meta_description(tr-tr)',
        'meta_keywords(tr-tr)',
        'store_ids',
        'layout',
        'status'
      ],
      // Data rows
      ...openCartCategories.map(category => [
        category.category_id,
        category.parent_id,
        category.name,
        category.top,
        category.columns,
        category.sort_order,
        category.image_name,
        category.description,
        category.meta_title,
        category.meta_description,
        category.meta_keywords,
        category.store_ids,
        category.layout,
        category.status
      ])
    ]
    
    // Workbook oluştur
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Sütun genişliklerini ayarla
    const columnWidths = [
      { wch: 12 }, // category_id
      { wch: 12 }, // parent_id
      { wch: 30 }, // name(tr-tr)
      { wch: 8 },  // top
      { wch: 10 }, // columns
      { wch: 12 }, // sort_order
      { wch: 40 }, // image_name
      { wch: 50 }, // description(tr-tr)
      { wch: 30 }, // meta_title(tr-tr)
      { wch: 40 }, // meta_description(tr-tr)
      { wch: 25 }, // meta_keywords(tr-tr)
      { wch: 10 }, // store_ids
      { wch: 15 }, // layout
      { wch: 8 }   // status
    ]
    worksheet['!cols'] = columnWidths
    
    // Header stilini ayarla
    const headerStyle = {
      fill: { fgColor: { rgb: "F0F0F0" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    }
    
    // Header hücrelerine stil uygula
    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1']
    headerCells.forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = headerStyle
      }
    })
    
    // Worksheet'i workbook'a ekle
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories')
    
    // Excel dosyasını buffer olarak döndür
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  }

  async exportToXML(options: CategoryExportOptions): Promise<string> {
    const categories = await categoryService.getCategories(options.includeInactive)
    const allCategories = this.flattenCategories(categories)
    const categoryIdMap = this.createCategoryIdMap(categories)
    
    const openCartCategories = allCategories.map(category => 
      this.convertToOpenCartFormat(category, categoryIdMap)
    )
    
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
 </Styles>
 <Worksheet ss:Name="Categories">
  <Table ss:ExpandedColumnCount="14" ss:ExpandedRowCount="${openCartCategories.length + 1}" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="66" ss:DefaultRowHeight="15">`

    const xmlHeaderRow = `
   <Row ss:AutoFitHeight="0" ss:Height="30">
    <Cell ss:StyleID="s16"><Data ss:Type="String">category_id</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">parent_id</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">name(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">top</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">columns</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">sort_order</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">image_name</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">description(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">meta_title(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">meta_description(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">meta_keywords(tr-tr)</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">store_ids</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">layout</Data></Cell>
    <Cell ss:StyleID="s16"><Data ss:Type="String">status</Data></Cell>
   </Row>`

    const xmlRows = openCartCategories.map(category => `
   <Row ss:AutoFitHeight="0" ss:Height="25.5">
    <Cell ss:StyleID="s17"><Data ss:Type="String">${category.category_id}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="String">${category.parent_id}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.name)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${category.top}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${category.columns}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="Number">${category.sort_order}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.image_name)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.description)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.meta_title)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.meta_description)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.meta_keywords)}</Data></Cell>
    <Cell ss:StyleID="s17"><Data ss:Type="String">${category.store_ids}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${this.escapeXml(category.layout)}</Data></Cell>
    <Cell ss:StyleID="s18"><Data ss:Type="String">${category.status}</Data></Cell>
   </Row>`).join('')

    const xmlFooter = `
  </Table>
 </Worksheet>
</Workbook>`

    return xmlHeader + xmlHeaderRow + xmlRows + xmlFooter
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

  async export(options: CategoryExportOptions): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0]
    
    try {
      if (options.format === 'xml') {
        const xmlContent = await this.exportToXML(options)
        this.downloadFile(xmlContent, `categories-${timestamp}.xml`, 'application/xml')
      } else if (options.format === 'csv') {
        const csvContent = await this.exportToCSV(options)
        this.downloadFile(csvContent, `categories-${timestamp}.csv`, 'text/csv')
      } else if (options.format === 'excel') {
        const excelContent = await this.exportToExcel(options)
        this.downloadFile(excelContent, `categories-${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      }
    } catch (error) {
      console.error('Category export failed:', error)
      throw new Error('Kategori dışa aktarma başarısız oldu: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  // Kategori ID haritalama bilgisini döndür (import sırasında kullanılacak)
  async getCategoryIdMapping(): Promise<Map<string, number>> {
    const categories = await categoryService.getCategories(true)
    return this.createCategoryIdMap(categories)
  }
}

export const categoryExportService = new CategoryExportService()