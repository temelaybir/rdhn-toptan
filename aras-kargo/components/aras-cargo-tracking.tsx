'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Package, Search, Truck } from 'lucide-react'
import { getArasTrackingUrls, ArasTrackingUrls } from '../../../packages/aras-cargo-integration/src/aras-cargo-tracking-urls'

interface ArasCargoTrackingProps {
  initialTrackingNumber?: string
  showIframe?: boolean // iframe ile embed etmek için
}

export function ArasCargoTracking({ 
  initialTrackingNumber = '', 
  showIframe = false 
}: ArasCargoTrackingProps) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber)
  const [trackingUrls, setTrackingUrls] = useState<ArasTrackingUrls | null>(null)

  const handleTrack = () => {
    if (!trackingNumber.trim()) return
    
    const urls = getArasTrackingUrls(trackingNumber)
    setTrackingUrls(urls)
  }

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Aras Kargo Takip
          </CardTitle>
          <CardDescription>
            Kargo takip numarası ile kargonuzu takip edin
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Kargo Takip Numarası
              </label>
              <div className="flex gap-2">
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="3513773163316 (13 haneli) veya 20 haneli barkod"
                  className="flex-1"
                />
                <Button onClick={handleTrack} disabled={!trackingNumber.trim()}>
                  <Search className="w-4 h-4 mr-2" />
                  Takip Et
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                13 haneli kargo takip numarası veya 20 haneli barkod kodu girin
              </p>
            </div>
          </div>

          {trackingUrls && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Takip Seçenekleri
              </h3>
              
              <div className="grid gap-3">
                {/* Kargo Takip Numarası ile */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Kargo Takip Numarası ile</h4>
                        <p className="text-sm text-muted-foreground">
                          13 haneli kargo takip numarası ile takip
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openInNewTab(trackingUrls.byTrackingNumber)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Takip Et
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Barkod ile */}
                {trackingUrls.byBarcode && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Barkod ile</h4>
                          <p className="text-sm text-muted-foreground">
                            20 haneli barkod kodu ile takip
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openInNewTab(trackingUrls.byBarcode!)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Takip Et
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Sipariş numarası bilgilendirmesi */}
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <h4 className="font-medium text-muted-foreground">Sipariş Numarası ile Takip</h4>
                      <p className="text-sm text-muted-foreground">
                        Sipariş numarası ile takip için Aras Kargo'dan ayrı hesap kayıt işlemi gereklidir.
                      </p>
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href="http://kargotakip.araskargo.com.tr/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Kargo Takip Kayıt Sayfası
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* iframe ile gösterim */}
              {showIframe && trackingUrls.byTrackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kargo Takip Detayları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <iframe
                      src={trackingUrls.byTrackingNumber}
                      width="100%"
                      height="600"
                      className="border rounded-lg"
                      title="Aras Kargo Takip"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Sadece takip işlemi için basit bileşen
export function SimpleArasTracking({ trackingNumber }: { trackingNumber: string }) {
  const urls = getArasTrackingUrls(trackingNumber)
  
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => window.open(urls.byTrackingNumber, '_blank')}
      >
        <Package className="w-4 h-4 mr-2" />
        Kargo Takip
      </Button>
    </div>
  )
} 