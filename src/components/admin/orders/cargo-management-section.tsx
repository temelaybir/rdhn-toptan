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
  Scan,
  Link as LinkIcon
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const [showManualLinkDialog, setShowManualLinkDialog] = useState(false)
  const [manualLinkOrderNumber, setManualLinkOrderNumber] = useState('')
  const [isManualQuery, setIsManualQuery] = useState(false) // Manuel sorgulama flag'i

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
    const trimmedInput = barcodeInput.trim()
    if (!trimmedInput) {
      toast.error('Lütfen barkod, IntegrationCode veya takip numarası girin')
      return
    }

    setIsQuerying(true)
    setIsManualQuery(true) // Manuel sorgulama yapılıyor
    try {
      // IntegrationCode veya barcode ile sorgulama yapılabilir
      // Manuel sorgulamada her zaman barcodeInput kullanılır
      const queryKey = trimmedInput
      
      console.log('🔍 Manuel sorgulama başlatılıyor:', {
        input: queryKey,
        length: queryKey.length,
        isNumeric: /^\d+$/.test(queryKey)
      })
      
      // IntegrationCode genellikle 13-16 karakter, TrackingNumber 13 karakter
      // 17 karakter veya daha uzunsa TrackingNumber olabilir
      // Ancak bazı kodlar IntegrationCode olabilir (örn: 17629405745371)
      // Önce IntegrationCode ile dene, başarısız olursa TrackingNumber ile dene
      const isIntegrationCode = queryKey.length <= 16
      
      console.log('🔍 Sorgulama parametresi:', {
        queryKey,
        length: queryKey.length,
        willUseIntegrationCode: isIntegrationCode,
        willUseTrackingNumber: !isIntegrationCode
      })
      
      // 🚀 Yeni WCF Hybrid API kullan (daha güvenilir)
      // Önce IntegrationCode ile dene (17 karakter olsa bile IntegrationCode olabilir)
      let response = await fetch(
        `/api/shipping/track-hybrid?integrationCode=${queryKey}`,
        {
          credentials: 'include'
        }
      )
      
      let result = await response.json()
      
      // Eğer IntegrationCode ile başarısız olursa ve kod 13 karakter veya daha uzunsa TrackingNumber ile dene
      if (!response.ok && queryKey.length >= 13 && queryKey.length <= 20) {
        console.log('🔄 IntegrationCode ile başarısız, TrackingNumber ile deneniyor...')
        response = await fetch(
          `/api/shipping/track-hybrid?trackingNumber=${queryKey}`,
          {
            credentials: 'include'
          }
        )
        result = await response.json()
      }

      console.log('📦 Track-hybrid response:', {
        ok: response.ok,
        status: response.status,
        hasMeta: !!result.meta,
        metaSuccess: result.meta?.success,
        hasQueryResult: !!result.QueryResult,
        hasCargo: !!result.QueryResult?.Cargo,
        QueryResultKeys: result.QueryResult ? Object.keys(result.QueryResult) : [],
        resultKeys: Object.keys(result),
        fullResult: JSON.stringify(result).substring(0, 500) // İlk 500 karakter
      })

      // ✅ Response kontrolü
      if (!response.ok) {
        throw new Error(result.error || 'Kargo bilgisi sorgulanamadı')
      }

      // QueryResult içindeki tüm alanları kontrol et
      let cargo = null
      
      // 1. Önce QueryResult.Cargo kontrolü
      if (result.QueryResult?.Cargo) {
        cargo = result.QueryResult.Cargo
        console.log('✅ Cargo bulundu: QueryResult.Cargo')
      }
      // 2. QueryResult.QueryResult.Cargo (nested yapı)
      else if (result.QueryResult?.QueryResult?.Cargo) {
        cargo = result.QueryResult.QueryResult.Cargo
        console.log('✅ Cargo bulundu: QueryResult.QueryResult.Cargo')
      }
      // 3. QueryResult içinde direkt cargo bilgileri olabilir
      else if (result.QueryResult && result.QueryResult !== null) {
        const qr = result.QueryResult
        // Eğer QueryResult içinde QueryResult varsa (nested)
        if (qr.QueryResult && qr.QueryResult !== null) {
          const nestedQr = qr.QueryResult
          if (nestedQr.Cargo) {
            cargo = nestedQr.Cargo
            console.log('✅ Cargo bulundu: QueryResult.QueryResult.Cargo (nested)')
          } else if (nestedQr.DURUMU || nestedQr.KARGO_TAKIP_NO || nestedQr.MUSTERI_OZEL_KODU) {
            cargo = nestedQr
            console.log('✅ Cargo bilgileri QueryResult.QueryResult içinde bulundu')
          }
        }
        // Direkt QueryResult içinde alanlar
        else if (qr.DURUMU || qr.KARGO_TAKIP_NO || qr.MUSTERI_OZEL_KODU) {
          cargo = qr
          console.log('✅ Cargo bilgileri QueryResult içinde bulundu')
        }
        // QueryResult null ise
        else if (qr.QueryResult === null) {
          console.warn('⚠️ QueryResult.QueryResult null - Aras API\'den kargo bilgisi dönmedi')
          // Bu durumda kargo bilgisi yok ama hata fırlatma, kullanıcıya bilgi ver
          throw new Error('Bu kod ile Aras Kargo sisteminde kargo bilgisi bulunamadı. Kodun doğru olduğundan emin olun veya farklı bir kod deneyin.')
        }
      }
      // 4. Direkt result içinde Cargo
      else if (result.Cargo) {
        cargo = result.Cargo
        console.log('✅ Cargo bulundu: result.Cargo')
      }
      // 5. Alternatif formatlar
      else if (result.cargo) {
        cargo = result.cargo
        console.log('✅ Cargo bulundu: result.cargo')
      }
      
      if (!cargo) {
        // Detaylı hata mesajı
        console.error('❌ Cargo bulunamadı - Response detayları:', {
          hasQueryResult: !!result.QueryResult,
          QueryResultType: typeof result.QueryResult,
          QueryResultIsNull: result.QueryResult === null,
          QueryResultContent: result.QueryResult ? JSON.stringify(result.QueryResult).substring(0, 300) : 'null',
          resultKeys: Object.keys(result),
          fullResponse: JSON.stringify(result).substring(0, 1000)
        })
        
        // Eğer QueryResult null ise, bu Aras API'den kargo bulunamadığı anlamına gelir
        if (result.QueryResult?.QueryResult === null || result.QueryResult === null) {
          throw new Error('Aras Kargo sisteminde bu kod ile kargo bilgisi bulunamadı. Lütfen kodun doğru olduğundan emin olun.')
        }
        
        throw new Error('Kargo bilgisi bulunamadı - Response formatı beklenmeyen. Lütfen console loglarını kontrol edin.')
      }

      // Cargo formatı (hem normal hem alternatif formatları destekle)
      console.log('📋 Cargo bilgileri parse ediliyor:', {
        hasALICI: !!cargo.ALICI,
        hasDURUMU: !!cargo.DURUMU,
        hasKARGO_TAKIP_NO: !!cargo.KARGO_TAKIP_NO,
        hasMUSTERI_OZEL_KODU: !!cargo.MUSTERI_OZEL_KODU,
        cargoKeys: Object.keys(cargo)
      })
      
      setCargoInfo({
        receiverName: cargo.ALICI || cargo.receiverName || '',
        receiverAddress: `${cargo.VARIS_SUBE || cargo.receiverAddress || ''}`,
        receiverCity: cargo.VARIS_SUBE || cargo.receiverCity || '',
        senderName: cargo.GONDERICI || cargo.senderName || '',
        status: cargo.DURUMU || cargo.status || 'Bilinmiyor',
        trackingNumber: cargo.KARGO_TAKIP_NO || cargo.trackingNumber || '',
        barcode: cargo.KARGO_KODU || cargo.KARGO_LINK_NO || cargo.barcode || '',
        integrationCode: cargo.MUSTERI_OZEL_KODU || cargo.integrationCode || barcodeInput.trim()
      })
      
      console.log('✅ Cargo bilgileri başarıyla parse edildi ve state\'e kaydedildi')
      
      // ✅ Manuel sorgulama yapıldıysa, otomatik eşleştirme YAPMA
      // Kullanıcı hangi siparişle eşleştirmek istediğini seçmeli
      if (isManualQuery) {
        toast.success('Kargo bilgisi başarıyla alındı', {
          description: `Durum: ${cargo.DURUMU || 'Bilinmiyor'} - Bu kargoyu bir siparişle eşleştirmek ister misiniz?`
        })
        
        // Manuel eşleştirme dialogunu göster
        setManualLinkOrderNumber(order?.order_number || '')
        setShowManualLinkDialog(true)
      } else {
        // Otomatik sorgulama (sipariş detay sayfasından geldiğinde)
        // Sadece mevcut siparişle eşleştir
        const shouldAutoLink = order?.order_number && (
          !order.kargo_takipno || // Henüz takip numarası yoksa
          order.kargo_takipno !== cargo.KARGO_TAKIP_NO // Farklı takip numarası varsa
        )
        
        if (cargo.KARGO_TAKIP_NO && shouldAutoLink) {
          try {
            const updateResponse = await fetch('/api/admin/orders/update-tracking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                orderId: order.order_number,
                trackingNumber: cargo.KARGO_TAKIP_NO,
                cargoStatus: cargo.DURUMU,
                cargoData: cargo,
                integrationCode: cargo.MUSTERI_OZEL_KODU || barcodeInput.trim()
              })
            })
            
            const updateResult = await updateResponse.json()
            if (updateResult.success) {
              toast.success('Kargo bilgisi başarıyla alındı ve siparişle eşleştirildi', {
                description: `Takip No: ${cargo.KARGO_TAKIP_NO} - Durum: ${cargo.DURUMU}`
              })
              if (onCargoCreated) {
                onCargoCreated()
              }
            } else {
              toast.warning('Kargo bilgisi alındı ancak otomatik eşleştirilemedi', {
                description: 'Manuel olarak siparişle eşleştirmek ister misiniz?'
              })
              handleManualCargoLink(cargo)
            }
          } catch (updateError) {
            console.error('Takip numarası kaydetme hatası:', updateError)
            toast.warning('Kargo bilgisi alındı ancak kaydedilemedi', {
              description: 'Manuel olarak siparişle eşleştirebilirsiniz'
            })
            handleManualCargoLink(cargo)
          }
        } else {
          toast.success('Kargo bilgisi alındı', {
            description: `Durum: ${cargo.DURUMU || 'Bilinmiyor'}`
          })
        }
      }
    } catch (error: any) {
      console.error('Kargo bilgisi sorgulama hatası:', error)
      toast.error('Kargo bilgisi alınamadı', {
        description: error.message || 'Bilinmeyen bir hata oluştu'
      })
      setCargoInfo(null)
    } finally {
      setIsQuerying(false)
      setIsManualQuery(false) // Reset flag
    }
  }

  // Manuel kargo-sipariş eşleştirme fonksiyonu
  const handleManualCargoLink = async (cargoData: any) => {
    if (!cargoData) {
      toast.error('Kargo bilgisi bulunamadı')
      return
    }

    // Dialog'u aç ve kullanıcının sipariş numarası girmesini bekle
    // Mevcut sipariş numarasını varsayılan olarak göster ama değiştirilebilir
    setManualLinkOrderNumber(order?.order_number || '')
    setShowManualLinkDialog(true)
  }

  // Manuel sipariş numarası ile eşleştirme
  const handleConfirmManualLink = async () => {
    if (!manualLinkOrderNumber.trim()) {
      toast.error('Lütfen sipariş numarası girin')
      return
    }

    if (!cargoInfo) {
      toast.error('Kargo bilgisi bulunamadı')
      return
    }

    try {
      // Sipariş numarasını temizle (SIP- prefix'ini kaldır)
      const cleanOrderNumber = manualLinkOrderNumber.trim().replace(/^SIP-/, '')
      
      const updateResponse = await fetch('/api/admin/orders/update-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: cleanOrderNumber, // Temizlenmiş sipariş numarası
          trackingNumber: cargoInfo.trackingNumber,
          cargoStatus: cargoInfo.status,
          cargoData: cargoInfo,
          integrationCode: cargoInfo.integrationCode || barcodeInput.trim(),
          // Manuel sorgulama ile eşleştirme yapıldığını belirt
          isManualLink: true,
          queriedBarcode: barcodeInput.trim() // Sorgulanan barkod/takip numarası
        })
      })
      
      const updateResult = await updateResponse.json()
      if (updateResult.success) {
        toast.success('Kargo başarıyla siparişle eşleştirildi', {
          description: `Sipariş: ${cleanOrderNumber} - Takip No: ${cargoInfo.trackingNumber || 'N/A'}`
        })
        setShowManualLinkDialog(false)
        setManualLinkOrderNumber('')
        setIsManualQuery(false) // Reset flag
        // Sipariş bilgilerini yenile
        if (onCargoCreated) {
          onCargoCreated()
        }
      } else {
        toast.error('Eşleştirme başarısız', {
          description: updateResult.error || 'Bilinmeyen bir hata oluştu'
        })
      }
    } catch (error: any) {
      console.error('Manuel eşleştirme hatası:', error)
      toast.error('Eşleştirme başarısız', {
        description: error.message || 'Bilinmeyen bir hata oluştu'
      })
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
                placeholder="Barkod veya takip numarası girin (örn: 17629405745371)"
                value={barcodeInput}
                onChange={(e) => {
                  // Sadece sayılar ve boşlukları kabul et (temizleme için)
                  const value = e.target.value.trim()
                  setBarcodeInput(value)
                }}
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

      {/* Manuel Kargo-Sipariş Eşleştirme Dialogu */}
      <Dialog open={showManualLinkDialog} onOpenChange={setShowManualLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Kargoyu Siparişle Eşleştir
            </DialogTitle>
            <DialogDescription>
              {isManualQuery 
                ? 'Manuel olarak sorguladığınız kargo bilgisini bir siparişle eşleştirmek için sipariş numarasını girin.'
                : 'Bu kargo bilgisini bir siparişle eşleştirmek için sipariş numarasını girin.'}
            </DialogDescription>
          </DialogHeader>
          
          {cargoInfo && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium mb-2 text-blue-900">Sorgulanan Kargo Bilgileri</h4>
                <div className="space-y-1 text-sm">
                  {barcodeInput && (
                    <div><strong>Sorgulanan Kod:</strong> <code className="bg-blue-100 px-1 rounded">{barcodeInput}</code></div>
                  )}
                  {cargoInfo.trackingNumber && (
                    <div><strong>Takip No:</strong> {cargoInfo.trackingNumber}</div>
                  )}
                  {cargoInfo.integrationCode && (
                    <div><strong>Integration Code:</strong> {cargoInfo.integrationCode}</div>
                  )}
                  {cargoInfo.status && (
                    <div><strong>Durum:</strong> {cargoInfo.status}</div>
                  )}
                  {cargoInfo.receiverName && (
                    <div><strong>Alıcı:</strong> {cargoInfo.receiverName}</div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="manualOrderNumber">Sipariş Numarası</Label>
                <Input
                  id="manualOrderNumber"
                  placeholder="SIP-1762940574537 veya 1762940574537"
                  value={manualLinkOrderNumber}
                  onChange={(e) => setManualLinkOrderNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmManualLink()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {order?.order_number 
                    ? `Mevcut sipariş: ${order.order_number} (değiştirebilirsiniz)`
                    : 'Herhangi bir sipariş numarası girebilirsiniz'}
                </p>
                {isManualQuery && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Bu kargo bilgisi manuel sorgulama ile alındı. İstediğiniz siparişle eşleştirebilirsiniz.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowManualLinkDialog(false)
                setManualLinkOrderNumber('')
                setIsManualQuery(false)
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirmManualLink}
              disabled={!manualLinkOrderNumber.trim() || !cargoInfo}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Eşleştir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

