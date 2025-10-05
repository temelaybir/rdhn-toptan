'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  DollarSign, 
  Euro, 
  PoundSterling,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Check,
  Clock
} from 'lucide-react'
import { CurrencyCode, CURRENCIES } from '@/types/currency'
import { toast } from 'sonner'

export default function CurrencySettingsPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('TRY')
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = () => {
    toast.success('Para birimi ayarları kaydedildi')
    setHasChanges(false)
  }

  const mockRates = {
    'USD': 1.00,
    'EUR': 0.85,
    'GBP': 0.73,
    'TRY': 31.50
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Para Birimi Ayarları</h1>
          <p className="text-muted-foreground">
            Mağaza para birimi ve döviz kurları ayarlarını yönetin
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Aktif: {CURRENCIES[selectedCurrency].name}
        </Badge>
      </div>

      {/* Ana Para Birimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ana Para Birimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency-select">Para Birimi</Label>
              <Select value={selectedCurrency} onValueChange={(value: CurrencyCode) => {
                setSelectedCurrency(value)
                setHasChanges(true)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, currency]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span>{currency.symbol}</span>
                        <span>{currency.name}</span>
                        <span className="text-muted-foreground">({code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-update"
                checked={autoUpdate}
                onCheckedChange={(checked) => {
                  setAutoUpdate(checked)
                  setHasChanges(true)
                }}
              />
              <Label htmlFor="auto-update">Otomatik kur güncellemesi</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Döviz Kurları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Döviz Kurları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mockRates).map(([code, rate]) => (
              <Card key={code}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {code === 'USD' && <DollarSign className="w-4 h-4" />}
                        {code === 'EUR' && <Euro className="w-4 h-4" />}
                        {code === 'GBP' && <PoundSterling className="w-4 h-4" />}
                        {code === 'TRY' && <span className="text-xs font-bold">₺</span>}
                      </div>
                      <span className="font-medium">{code}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Aktif
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {rate.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Son güncelleme: 15 dk önce
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kaydet */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Son güncelleme: Bugün 14:30
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" disabled={!hasChanges}>
            Sıfırla
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Check className="w-4 h-4 mr-2" />
            Değişiklikleri Kaydet
          </Button>
        </div>
      </div>
    </div>
  )
}