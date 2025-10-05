import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Settings, Truck, FileText } from 'lucide-react'
import { ArasCargoTracking } from '@/components/tracking/aras-cargo-tracking'
import { ArasCargoSettings } from '@/components/admin/cargo/aras-cargo-settings'
import { ArasCargoTestPanel } from '@/components/admin/cargo/aras-cargo-test-panel'

export default function AdminCargoPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="w-8 h-8" />
          Kargo Yönetimi
        </h1>
        <p className="text-muted-foreground mt-2">
          Aras Kargo entegrasyonu ve kargo takip işlemleri
        </p>
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Kargo Takip
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Kargo Ayarları
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Test Paneli
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Aras Kargo Takip</CardTitle>
              <CardDescription>
                Kargo takip numarası veya sipariş numarası ile kargo durumunu kontrol edin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Yükleniyor...</div>}>
                <ArasCargoTracking showIframe={true} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Aras Kargo Ayarları</CardTitle>
              <CardDescription>
                Aras Kargo API ayarlarını ve entegrasyon parametrelerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Yükleniyor...</div>}>
                <ArasCargoSettings />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Aras Kargo Test Paneli</CardTitle>
              <CardDescription>
                SOAP servisleri test edin ve örnek kargo gönderimleri yapın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Yükleniyor...</div>}>
                <ArasCargoTestPanel />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 