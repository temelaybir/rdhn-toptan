'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Printer, Download, Eye, Package, RefreshCw } from 'lucide-react'
import { Order, BarcodeData, PrintBarcodeRequest } from '@/types/order'
import { BarcodeService, BarcodeFormats, generateBarcodeHTML } from '@/services/admin/barcode-service'
import { useToast } from '@/components/ui/use-toast'

interface BarcodePrinterProps {
  orders: Order[]
  onBarcodeGenerated?: (orderId: number, barcode: string) => void
}

export function BarcodePrinter({ orders, onBarcodeGenerated }: BarcodePrinterProps) {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [printFormat, setPrintFormat] = useState<keyof typeof BarcodeFormats>('pdf')
  const [copies, setCopies] = useState(1)
  const [previewMode, setPreviewMode] = useState(false)
  const [barcodeData, setBarcodeData] = useState<BarcodeData[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Filter orders that don't have barcodes yet or allow regeneration
  const eligibleOrders = orders.filter(order => 
    !order.kargo_barcode || selectedOrders.includes(order.id)
  )

  const generateBarcodes = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen en az bir sipariş seçin",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const orderSubset = orders.filter(order => selectedOrders.includes(order.id))
      const newBarcodeData = BarcodeService.generateBatchBarcodes(orderSubset)
      
      setBarcodeData(newBarcodeData)
      setPreviewMode(true)

      toast({
        title: "Başarılı",
        description: `${newBarcodeData.length} adet barkod oluşturuldu`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Barkod oluşturulurken hata oluştu",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Aras Kargo Barkodları</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
              }
              body { font-family: monospace; }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
            <script>
              // Generate barcodes after page loads
              setTimeout(() => {
                ${barcodeData.map(data => `
                  JsBarcode("#barcode-${data.orderId}", "${data.barcode}", {
                    format: "CODE128",
                    width: 1,
                    height: 30,
                    displayValue: false
                  });
                `).join('')}
                window.print();
              }, 500);
            </script>
          </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  const handleDownloadPDF = () => {
    // PDF generation logic would go here
    toast({
      title: "PDF İndirme",
      description: "PDF indirme özelliği yakında eklenecek",
    })
  }

  const saveBarcodes = async () => {
    try {
      const requests = barcodeData.map(async (data) => {
        const saveData = BarcodeService.prepareBarcodeForSave(data)
        
        // API call to save barcode
        const response = await fetch(`/api/admin/orders/${data.orderId}/barcode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData)
        })

        if (!response.ok) throw new Error(`Order ${data.orderId} kaydedilemedi`)
        
        onBarcodeGenerated?.(data.orderId, data.barcode)
        return data.orderId
      })

      await Promise.all(requests)
      
      toast({
        title: "Başarılı",
        description: `${barcodeData.length} adet barkod kaydedildi`,
      })

      setPreviewMode(false)
      setBarcodeData([])
      setSelectedOrders([])
    } catch (error) {
      toast({
        title: "Hata",
        description: "Barkodlar kaydedilirken hata oluştu",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Barkod Yazdır
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aras Kargo Barkod Yazdırma</DialogTitle>
          <DialogDescription>
            Siparişler için barkod oluşturun ve yazdırın
          </DialogDescription>
        </DialogHeader>

        {!previewMode ? (
          <div className="space-y-6">
            {/* Order Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sipariş Seçimi</CardTitle>
                <CardDescription>
                  Barkod oluşturulacak siparişleri seçin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {eligibleOrders.map(order => (
                    <div key={order.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={`order-${order.id}`}
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOrders([...selectedOrders, order.id])
                          } else {
                            setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                          }
                        }}
                      />
                      <label htmlFor={`order-${order.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">#{order.order_number}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {order.customer_name}
                            </span>
                            {order.kargo_barcode && (
                              <Badge variant="secondary" className="text-xs">
                                Mevcut: {order.kargo_barcode}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Print Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yazdırma Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Barkod Formatı</Label>
                    <Select value={printFormat} onValueChange={(value: keyof typeof BarcodeFormats) => setPrintFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF (A4 - 20 adet/sayfa)</SelectItem>
                        <SelectItem value="thermal">Termal Yazıcı (80mm)</SelectItem>
                        <SelectItem value="zebra">Zebra Etiket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="copies">Kopya Sayısı</Label>
                    <Input
                      id="copies"
                      type="number"
                      min="1"
                      max="10"
                      value={copies}
                      onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedOrders.length} sipariş seçildi
              </div>
              <div className="space-x-2">
                <Button
                  onClick={generateBarcodes}
                  disabled={selectedOrders.length === 0 || isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Oluşturuluyor...' : 'Önizleme'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Barkod Önizleme</CardTitle>
                <CardDescription>
                  {barcodeData.length} adet barkod • {printFormat.toUpperCase()} formatı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={printRef}
                  className="border rounded p-4 bg-white"
                  style={{ 
                    minHeight: '200px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  {barcodeData.map(data => (
                    <div 
                      key={data.orderId}
                      dangerouslySetInnerHTML={{ 
                        __html: generateBarcodeHTML(data, printFormat) 
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
              >
                Geri Dön
              </Button>
              
              <div className="space-x-2">
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF İndir
                </Button>
                
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Yazdır
                </Button>
                
                <Button onClick={saveBarcodes}>
                  <Package className="w-4 h-4 mr-2" />
                  Kaydet & Yazdır
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 