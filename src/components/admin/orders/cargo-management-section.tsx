'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Truck, 
  Package, 
  QrCode, 
  Printer, 
  Search, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Scan
} from 'lucide-react'

interface Order {
  id: string
  shippingAddress?: {
    fullName: string
    address: string
    city: string
    district: string
    postalCode: string
  }
  trackingNumber?: string
  cargoCompany?: string
  total: number
  currency?: string
}

interface CargoManagementSectionProps {
  order: Order
  onCargoCreated?: () => void
}

export function CargoManagementSection({ order, onCargoCreated }: CargoManagementSectionProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)
  const [cargoInfo, setCargoInfo] = useState<any>(null)
  const [barcodeInput, setBarcodeInput] = useState('')

  // Sipariş yüklendiğinde veritabanından kargo bilgilerini yükle
  useEffect(() => {
    if (order && (order as any).kargo_barcode) {
      setCargoInfo({
        barcode: (order as any).kargo_barcode,
        integrationCode: (order as any).kargo_talepno, // IntegrationCode kargo_talepno'da saklanıyor
        trackingNumber: (order as any).kargo_takipno,
        status: (order as any).kargo_sonuc || 'Hazırlanıyor'
      })
      // Eğer IntegrationCode varsa, barcode input'a da ekle
      if ((order as any).kargo_talepno) {
        setBarcodeInput((order as any).kargo_talepno)
      }
    }
  }, [order])
  const [shipmentData, setShipmentData] = useState({
    weight: 1,
    desi: 1,
    paymentType: 'sender' as 'sender' | 'receiver',
    description: `Sipariş: ${order.id}`
  })

  const shippingAddress = order.shippingAddress

  const handleCreateArasCargo = async () => {
    if (!shippingAddress) {
      toast.error('Siparişte teslimat adresi bulunamadı')
      return
    }

    // İlçe bilgisi zorunlu - kontrol et
    if (!shippingAddress.district || shippingAddress.district.trim() === '') {
      toast.error('İlçe bilgisi eksik', {
        description: 'Aras Kargo için ilçe bilgisi zorunludur. Lütfen sipariş adresinde ilçe bilgisini kontrol edin.'
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/cargo/aras/create-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          shipmentData: {
            recipientName: shippingAddress.fullName,
            recipientPhone: '', // Siparişten alınabilir
            recipientAddress: shippingAddress.address,
            recipientCity: shippingAddress.city,
            recipientDistrict: shippingAddress.district || '', // İlçe bilgisi
            recipientPostalCode: shippingAddress.postalCode,
            senderName: 'Ardahan Ticaret',
            senderPhone: '',
            senderAddress: '',
            weight: shipmentData.weight,
            desi: shipmentData.desi,
            paymentType: shipmentData.paymentType,
            productPrice: order.total,
            description: shipmentData.description
          }
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('❌ Kargo oluşturma hatası:', {
          status: response.status,
          error: result.error,
          details: result.details,
          resultCode: result.resultCode,
          resultMessage: result.resultMessage,
          missingField: result.missingField,
          availableFields: result.availableFields
        })
        
        // İlçe bilgisi eksikse özel mesaj göster
        if (result.error?.includes('İlçe') || result.missingField === 'recipientDistrict') {
          throw new Error(result.details || result.error || 'İlçe bilgisi eksik. Lütfen sipariş adresinde ilçe bilgisini kontrol edin.')
        }
        
        throw new Error(result.error || result.details || result.resultMessage || 'Kargo oluşturulamadı')
      }

      toast.success('Kargo başarıyla oluşturuldu!', {
        description: `Barkod: ${result.data.barcode} | IntegrationCode: ${result.data.integrationCode || 'N/A'}`
      })

      setCargoInfo({
        barcode: result.data.barcode,
        integrationCode: result.data.integrationCode,
        trackingNumber: result.data.trackingNumber,
        invoiceKey: result.data.invoiceKey,
        status: 'Hazırlanıyor',
        resultCode: result.data.resultCode,
        resultMessage: result.data.resultMessage
      })

      // ℹ️ KARGO_TAKIP_NO'yu cron job otomatik alacak
      // Kargo fiziksel olarak Aras'a teslim edilip sisteme işlenene kadar
      // KARGO_TAKIP_NO alınamaz (genelde günlük 16:00 teslim, akşam/ertesi gün hazır)
      
      onCargoCreated?.()
    } catch (error: any) {
      console.error('Kargo oluşturma hatası:', error)
      toast.error('Kargo oluşturulamadı', {
        description: error.message || 'Bilinmeyen bir hata oluştu'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleQueryCargoInfo = async () => {
    if (!barcodeInput.trim()) {
      toast.error('Lütfen barkod, IntegrationCode veya takip numarası girin')
      return
    }

    setIsQuerying(true)
    try {
      // IntegrationCode veya barcode ile sorgulama yapılabilir
      // Eğer cargoInfo'da integrationCode varsa onu kullan
      const queryKey = cargoInfo?.integrationCode || barcodeInput.trim()
      const isIntegrationCode = !!cargoInfo?.integrationCode || queryKey.length <= 15
      
      // 🚀 Yeni WCF Hybrid API kullan (daha güvenilir)
      const response = await fetch(
        `/api/shipping/track-hybrid?${isIntegrationCode ? 'integrationCode' : 'trackingNumber'}=${queryKey}`,
        {
          credentials: 'include'
        }
      )

      const result = await response.json()

      // ✅ meta içindeki success'i kontrol et
      if (!response.ok || !result.meta?.success) {
        throw new Error(result.error || 'Kargo bilgisi bulunamadı')
      }

      // WCF response'unu parse et
      
      const cargo = result.QueryResult?.Cargo
      if (cargo) {
        setCargoInfo({
          receiverName: cargo.ALICI,
          receiverAddress: `${cargo.VARIS_SUBE}`,
          receiverCity: cargo.VARIS_SUBE,
          senderName: cargo.GONDERICI,
          status: cargo.DURUMU,
          trackingNumber: cargo.KARGO_TAKIP_NO,
          barcode: cargo.KARGO_KODU,
          integrationCode: cargo.MUSTERI_OZEL_KODU
        })
        
        // ✅ KARGO_TAKIP_NO'yu veritabanına kaydet
        if (cargo.KARGO_TAKIP_NO && order?.order_number) {
          try {
            const updateResponse = await fetch('/api/admin/orders/update-tracking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                orderId: order.order_number,
                trackingNumber: cargo.KARGO_TAKIP_NO,
                cargoStatus: cargo.DURUMU,
                cargoData: cargo
              })
            })
            
            const updateResult = await updateResponse.json()
            if (updateResult.success) {
              toast.success('Kargo bilgisi başarıyla alındı ve kaydedildi', {
                description: `Takip No: ${cargo.KARGO_TAKIP_NO} - Durum: ${cargo.DURUMU}`
              })
            } else {
              toast.success('Kargo bilgisi alındı', {
                description: `Durum: ${cargo.DURUMU} (Kayıt hatası: ${updateResult.error})`
              })
            }
          } catch (updateError) {
            console.error('Takip numarası kaydetme hatası:', updateError)
            toast.success('Kargo bilgisi alındı', {
              description: `Durum: ${cargo.DURUMU} (Veritabanı güncellenemedi)`
            })
          }
        } else {
          toast.success('Kargo bilgisi alındı', {
            description: `Durum: ${cargo.DURUMU}`
          })
        }
      } else {
        throw new Error('Kargo bilgisi bulunamadı')
      }
    } catch (error: any) {
      console.error('Kargo bilgisi sorgulama hatası:', error)
      toast.error('Kargo bilgisi alınamadı', {
        description: error.message || 'Bilinmeyen bir hata oluştu'
      })
      setCargoInfo(null)
    } finally {
      setIsQuerying(false)
    }
  }

  const handlePrintBarcode = () => {
    if (!cargoInfo?.barcode) {
      toast.error('Yazdırılacak barkod bulunamadı')
      return
    }

    // Tarih formatla (DD.MM.YYYY)
    const today = new Date()
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`

    // IntegrationCode ve BarcodeNumber - Sadece sayıları kullan (klasik barkod sistemi için)
    // Eğer IntegrationCode yoksa, barcode'dan sonundaki "1"i kaldırarak IntegrationCode'u çıkar
    const rawIntegrationCode = cargoInfo.integrationCode || cargoInfo.barcode?.replace(/1$/, '') || ''
    const rawBarcodeNumber = cargoInfo.barcode || ''
    
    // Sadece sayıları çıkar (harfleri ve özel karakterleri kaldır)
    const extractNumbers = (str: string): string => {
      return str.replace(/\D/g, '') // Sadece sayıları al
    }
    
    const integrationCode = extractNumbers(rawIntegrationCode)
    const barcodeNumber = extractNumbers(rawBarcodeNumber)
    
    // Eğer barcodeNumber boşsa veya IntegrationCode'dan farklıysa, IntegrationCode + "1" kullan
    const finalBarcodeNumber = barcodeNumber || (integrationCode ? `${integrationCode}1` : '')

    // Barkod yazdırma işlemi - Aras Kargo etiket formatı
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aras Kargo Etiket - ${order.id}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              @page { size: A4; margin: 10mm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 15px;
              max-width: 100mm;
              margin: 0 auto;
            }
            .label-container {
              border: 1px solid #ddd;
              padding: 10px;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .sender-label {
              font-weight: bold;
              font-size: 12px;
            }
            .date-label {
              font-size: 12px;
            }
            .section-title {
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 8px;
              margin-top: 15px;
            }
            .info-field {
              font-size: 11px;
              margin: 3px 0;
            }
            .cargo-type {
              font-weight: bold;
              font-size: 13px;
              margin: 15px 0;
            }
            .barcode-section {
              margin: 15px 0;
            }
            .barcode-label {
              font-size: 11px;
              margin-bottom: 5px;
            }
            .barcode-svg {
              margin: 5px 0;
              display: block;
            }
            .package-info {
              text-align: right;
              font-size: 11px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <!-- Header: Gönderici ve Tarih -->
            <div class="header-row">
              <span class="sender-label">Gönderici:</span>
              <span class="date-label">${formattedDate}</span>
            </div>

            <!-- Alıcı Bilgileri -->
            <div class="section-title">Alıcı Bilgileri</div>
            ${order.shippingAddress ? `
              <div class="info-field"><strong>İsim:</strong> ${order.shippingAddress.fullName || ''}</div>
              <div class="info-field"><strong>Telefon:</strong> ${order.phone || ''}</div>
              <div class="info-field"><strong>Adres:</strong> ${order.shippingAddress.address || ''}</div>
              ${order.shippingAddress.city || order.shippingAddress.district ? `
                <div class="info-field"><strong>İl / İlçe:</strong> ${order.shippingAddress.city || ''}${order.shippingAddress.city && order.shippingAddress.district ? ' / ' : ''}${order.shippingAddress.district || ''}</div>
              ` : ''}
            ` : `
              <div class="info-field"><strong>İsim:</strong> </div>
              <div class="info-field"><strong>Telefon:</strong> </div>
              <div class="info-field"><strong>Adres:</strong> </div>
              <div class="info-field"><strong>İl / İlçe:</strong> </div>
            `}

            <!-- Kargo Tipi -->
            <div class="cargo-type">Standart Kargo</div>

            <!-- Entegrasyon No -->
            <div class="barcode-section">
              <div class="barcode-label"><strong>Entegrasyon No :</strong> ${integrationCode}</div>
              <svg id="barcode-integration-${order.id}" class="barcode-svg"></svg>
            </div>

            <!-- Paket Barkod No -->
            <div class="barcode-section">
              <div class="barcode-label"><strong>Paket Barkod No :</strong> ${finalBarcodeNumber}</div>
              <svg id="barcode-package-${order.id}" class="barcode-svg"></svg>
              <div class="package-info">Paket : 1 / 1</div>
            </div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = function() {
              try {
                // Entegrasyon No barkodu
                JsBarcode("#barcode-integration-${order.id}", "${integrationCode}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 50,
                  displayValue: false,
                  margin: 5
                });

                // Paket Barkod No barkodu
                JsBarcode("#barcode-package-${order.id}", "${finalBarcodeNumber}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 50,
                  displayValue: false,
                  margin: 5
                });

                setTimeout(() => {
                  window.print();
                }, 500);
              } catch (error) {
                console.error('Barkod oluşturma hatası:', error);
                alert('Barkod oluşturulamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.');
              }
            }
          </script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="space-y-6">
      {/* Mevcut Kargo Bilgileri */}
      {order.trackingNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Mevcut Kargo Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kargo Şirketi:</span>
                <Badge>{order.cargoCompany || 'Aras Kargo'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Takip Numarası:</span>
                <span className="text-sm font-mono">{order.trackingNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aras Kargo ile Kargo Oluşturma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Aras Kargo ile Kargo Oluştur
          </CardTitle>
          <CardDescription>
            Siparişi Aras Kargo sistemine kaydedin ve barkod oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shippingAddress ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium mb-2">Teslimat Adresi</h4>
                <p className="text-sm">{shippingAddress.fullName}</p>
                <p className="text-sm">{shippingAddress.address}</p>
                <p className="text-sm">{shippingAddress.city}, {shippingAddress.district} - {shippingAddress.postalCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Ağırlık (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={shipmentData.weight}
                    onChange={(e) => setShipmentData({ ...shipmentData, weight: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="desi">Desi</Label>
                  <Input
                    id="desi"
                    type="number"
                    min="1"
                    value={shipmentData.desi}
                    onChange={(e) => setShipmentData({ ...shipmentData, desi: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentType">Ödeme Tipi</Label>
                <Select
                  value={shipmentData.paymentType}
                  onValueChange={(value: 'sender' | 'receiver') => setShipmentData({ ...shipmentData, paymentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sender">Gönderen Öder</SelectItem>
                    <SelectItem value="receiver">Alıcı Öder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreateArasCargo}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Truck className="mr-2 h-4 w-4" />
                    Aras Kargo ile Kargo Oluştur
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Siparişte teslimat adresi bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barkod Okutma - Adres Bilgilerini Çekme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barkod Okut - Adres Bilgilerini Çek
          </CardTitle>
          <CardDescription>
            Aras Kargo barkodunu okutarak kargo adres bilgilerini görüntüleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="barcode">Barkod / Takip Numarası</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="barcode"
                placeholder="Barkod veya takip numarası girin"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleQueryCargoInfo()
                  }
                }}
              />
              <Button
                onClick={handleQueryCargoInfo}
                disabled={isQuerying || !barcodeInput.trim()}
              >
                {isQuerying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {cargoInfo && (
            <div className="mt-4 space-y-4">
              <Separator />
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Kargo Bilgileri</h4>
                </div>
                
                {cargoInfo.receiverName && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Alıcı:</span> {cargoInfo.receiverName}
                    </div>
                    {cargoInfo.receiverAddress && (
                      <div>
                        <span className="font-medium">Adres:</span> {cargoInfo.receiverAddress}
                      </div>
                    )}
                    {cargoInfo.receiverPhone && (
                      <div>
                        <span className="font-medium">Telefon:</span> {cargoInfo.receiverPhone}
                      </div>
                    )}
                    {cargoInfo.receiverCity && (
                      <div>
                        <span className="font-medium">Şehir:</span> {cargoInfo.receiverCity}
                        {cargoInfo.receiverTown && `, ${cargoInfo.receiverTown}`}
                      </div>
                    )}
                    {cargoInfo.status && (
                      <div>
                        <span className="font-medium">Durum:</span> {cargoInfo.status}
                      </div>
                    )}
                    {/* Kargo Oluşturulduktan Sonra Gösterilen Bilgiler */}
                    {cargoInfo.barcode && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-green-300">
                        <div className="bg-white rounded p-3 space-y-2">
                          <div>
                            <span className="font-medium text-xs text-gray-600">Barkod Numarası (BarcodeNumber):</span> 
                            <div className="font-mono text-sm font-bold mt-1">{cargoInfo.barcode}</div>
                            <p className="text-xs text-gray-500 mt-1">Kargo üzerinde yazdırılacak barkod</p>
                          </div>
                          
                          {cargoInfo.integrationCode && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="font-medium text-xs text-gray-600">IntegrationCode (Sorgulama Kodu):</span> 
                              <div className="font-mono text-sm font-bold mt-1 text-blue-600">{cargoInfo.integrationCode}</div>
                              <p className="text-xs text-gray-500 mt-1">Aras sistemine okutulduğunda adres bilgilerini getirir</p>
                            </div>
                          )}
                          
                          {cargoInfo.invoiceKey && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="font-medium text-xs text-gray-600">InvoiceKey (TradingWaybillNumber):</span> 
                              <div className="font-mono text-sm font-bold mt-1 text-purple-600">{cargoInfo.invoiceKey}</div>
                              <p className="text-xs text-gray-500 mt-1">Aras Kargo tarafından atanan irsaliye numarası</p>
                            </div>
                          )}
                          
                          {cargoInfo.trackingNumber && cargoInfo.trackingNumber !== cargoInfo.barcode && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="font-medium text-xs text-gray-600">Takip Numarası:</span> 
                              <div className="font-mono text-sm mt-1">{cargoInfo.trackingNumber}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cargoInfo.barcode && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintBarcode}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Barkod Yazdır
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `https://kargotakip.araskargo.com.tr/?query=${cargoInfo.barcode}`
                        window.open(url, '_blank')
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Kargo Takip
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

