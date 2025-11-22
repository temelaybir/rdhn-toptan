// Barcode Service for Aras Kargo Integration
// Based on PHP teknokargo system

import { BarcodeData, Order } from '@/types/order'

export class BarcodeService {
  private static readonly PREFIX = 'ARD'
  private static readonly SEPARATOR = '-'

  /**
   * Generate barcode for order (PHP teknokargo format)
   * Format: ARD-{orderNumber}-{timestamp}
   */
  static generateBarcode(orderNumber: string | number): string {
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits
    return `${this.PREFIX}${this.SEPARATOR}${orderNumber}${this.SEPARATOR}${timestamp}`
  }

  /**
   * Create barcode data object
   */
  static createBarcodeData(order: Order | { id: number; order_number: string }): BarcodeData {
    const barcode = this.generateBarcode(order.order_number)
    
    return {
      orderNumber: order.order_number,
      orderId: order.id,
      timestamp: Date.now(),
      barcode
    }
  }

  /**
   * Validate barcode format
   */
  static validateBarcode(barcode: string): boolean {
    const pattern = new RegExp(`^${this.PREFIX}${this.SEPARATOR}[A-Za-z0-9]+${this.SEPARATOR}\\d{6}$`)
    return pattern.test(barcode)
  }

  /**
   * Extract order number from barcode
   */
  static extractOrderNumber(barcode: string): string | null {
    if (!this.validateBarcode(barcode)) return null
    
    const parts = barcode.split(this.SEPARATOR)
    return parts.length >= 3 ? parts[1] : null
  }

  /**
   * Generate barcode for printing (HTML/PDF)
   */
  static generatePrintableBarcode(barcodeData: BarcodeData) {
    return {
      ...barcodeData,
      printData: {
        text: barcodeData.barcode,
        displayText: barcodeData.barcode,
        orderInfo: `Sipariş: ${barcodeData.orderNumber}`,
        timestamp: new Date(barcodeData.timestamp).toLocaleString('tr-TR'),
        format: 'CODE128' // Standard barcode format
      }
    }
  }

  /**
   * Get barcode SVG (for web display)
   */
  static getBarcodeConfig(barcode: string) {
    return {
      value: barcode,
      format: 'CODE128',
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 14,
      textAlign: 'center',
      textPosition: 'bottom',
      textMargin: 2,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    }
  }

  /**
   * Generate multiple barcodes for batch printing
   */
  static generateBatchBarcodes(orders: Array<{ id: number; order_number: string }>): BarcodeData[] {
    return orders.map(order => this.createBarcodeData(order))
  }

  /**
   * Save barcode to order (for database update)
   */
  static prepareBarcodeForSave(barcodeData: BarcodeData) {
    return {
      kargo_barcode: barcodeData.barcode,
      kargo_firma: 'aras',
      kargo_tarih: new Date().toISOString(),
      kargo_sonuc: 'Hazırlanıyor',
      kargo_paketadet: 1
    }
  }
}

// Helper functions for different print formats
export const BarcodeFormats = {
  /**
   * Thermal printer format (80mm)
   */
  thermal: {
    width: 80,
    height: 60,
    fontSize: 12,
    margin: 2
  },

  /**
   * A4 PDF format (multiple per page)
   */
  pdf: {
    width: 100,
    height: 40,
    fontSize: 10,
    margin: 5,
    perPage: 20 // 4x5 grid
  },

  /**
   * Zebra label printer format
   */
  zebra: {
    width: 100,
    height: 50,
    fontSize: 12,
    margin: 3
  }
}

// Barcode print template generator
export function generateBarcodeHTML(barcodeData: BarcodeData, format: keyof typeof BarcodeFormats = 'pdf'): string {
  const config = BarcodeFormats[format]
  const printData = BarcodeService.generatePrintableBarcode(barcodeData)

  return `
    <div style="
      width: ${config.width}mm;
      height: ${config.height}mm;
      border: 1px solid #ccc;
      padding: ${config.margin}mm;
      text-align: center;
      font-family: monospace;
      font-size: ${config.fontSize}px;
      display: inline-block;
      margin: 2mm;
      page-break-inside: avoid;
    ">
      <div style="font-weight: bold; margin-bottom: 2mm;">
        ARAS KARGO
      </div>
      <div id="barcode-${printData.orderId}" style="margin: 2mm 0;"></div>
      <div style="font-size: ${config.fontSize - 2}px;">
        ${printData.printData.orderInfo}
      </div>
      <div style="font-size: ${config.fontSize - 3}px; color: #666;">
        ${printData.printData.timestamp}
      </div>
    </div>
    <script>
      // JsBarcode will be loaded separately
      if (typeof JsBarcode !== 'undefined') {
        JsBarcode("#barcode-${printData.orderId}", "${printData.barcode}", {
          format: "CODE128",
          width: 1,
          height: 30,
          displayValue: false
        });
      }
    </script>
  `
} 