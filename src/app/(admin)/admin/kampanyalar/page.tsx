'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Tag,
  TrendingDown,
  Users,
  Calendar,
  Percent,
  DollarSign,
  Package,
  Loader2
} from 'lucide-react'
import type { PromoCode, PromoCodeFormData } from '@/types/promo-code'
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeStats
} from '@/app/actions/admin/promo-code-actions'

export default function CampaignsPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    expiredCodes: 0,
    totalUsage: 0,
    totalDiscount: 0
  })

  // Form state
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    usageType: 'multiple',
    maxUses: null,
    startDate: '',
    endDate: '',
    minOrderAmount: 0,
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [promoResult, statsResult] = await Promise.all([
        getPromoCodes(),
        getPromoCodeStats()
      ])

      if (promoResult.success && promoResult.data) {
        setPromoCodes(promoResult.data.promoCodes)
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
      toast.error('Veriler yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClick = () => {
    setSelectedPromoCode(null)
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      usageType: 'multiple',
      maxUses: null,
      startDate: '',
      endDate: '',
      minOrderAmount: 0,
      isActive: true
    })
    setIsFormDialogOpen(true)
  }

  const handleEditClick = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode)
    setFormData({
      code: promoCode.code,
      description: promoCode.description || '',
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      usageType: promoCode.usageType,
      maxUses: promoCode.maxUses,
      startDate: promoCode.startDate?.split('T')[0] || '',
      endDate: promoCode.endDate?.split('T')[0] || '',
      minOrderAmount: promoCode.minOrderAmount,
      isActive: promoCode.isActive
    })
    setIsFormDialogOpen(true)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Promosyon kodu kopyalandı!')
  }

  const handleSubmit = async () => {
    try {
      if (!formData.code.trim()) {
        toast.error('Promosyon kodu gereklidir')
        return
      }

      if (formData.discountValue <= 0) {
        toast.error('İndirim değeri 0\'dan büyük olmalıdır')
        return
      }

      if (formData.discountType === 'percentage' && formData.discountValue > 100) {
        toast.error('Yüzde indirimi 100\'den büyük olamaz')
        return
      }

      const result = selectedPromoCode
        ? await updatePromoCode(selectedPromoCode.id, formData)
        : await createPromoCode(formData)

      if (result.success) {
        toast.success(selectedPromoCode ? 'Promosyon kodu güncellendi' : 'Promosyon kodu oluşturuldu')
        setIsFormDialogOpen(false)
        loadData()
      } else {
        toast.error(result.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Kayıt hatası:', error)
      toast.error('Bir hata oluştu')
    }
  }

  const handleDelete = async () => {
    if (!selectedPromoCode) return

    try {
      const result = await deletePromoCode(selectedPromoCode.id)

      if (result.success) {
        toast.success('Promosyon kodu silindi')
        setIsDeleteDialogOpen(false)
        loadData()
      } else {
        toast.error(result.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      toast.error('Bir hata oluştu')
    }
  }

  const getStatusBadge = (promoCode: PromoCode) => {
    const now = new Date()
    const startDate = promoCode.startDate ? new Date(promoCode.startDate) : null
    const endDate = promoCode.endDate ? new Date(promoCode.endDate) : null

    if (!promoCode.isActive) {
      return <Badge variant="secondary">Pasif</Badge>
    }

    if (startDate && now < startDate) {
      return <Badge className="bg-blue-100 text-blue-800">Yakında</Badge>
    }

    if (endDate && now > endDate) {
      return <Badge className="bg-red-100 text-red-800">Süresi Dolmuş</Badge>
    }

    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return <Badge className="bg-orange-100 text-orange-800">Tükendi</Badge>
    }

    return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
  }

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `%${value}` : `${value} ₺`
  }

  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kampanyalar & Promosyon Kodları</h1>
          <p className="text-muted-foreground">
            İndirim kampanyalarını yönetin
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Promosyon Kodu
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kod</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kodlar</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolan</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiredCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanım</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam İndirim</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalDiscount.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promosyon Kodları Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Promosyon Kodları</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Arama */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Promosyon kodu veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tablo */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>İndirim</TableHead>
                    <TableHead>Kullanım</TableHead>
                    <TableHead>Geçerlilik</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromoCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Arama kriterlerine uygun kod bulunamadı' : 'Henüz promosyon kodu eklenmemiş'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromoCodes.map((promo, index) => (
                      <TableRow key={`${promo.id}-${index}`}>
                        <TableCell className="font-mono font-medium">
                          <div className="flex items-center gap-2">
                            {promo.code}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(promo.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {promo.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {promo.discountType === 'percentage' ? (
                              <Percent className="h-4 w-4" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            <span className="font-medium">{formatDiscount(promo.discountType, promo.discountValue)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {promo.usageType === 'single' ? (
                              <Badge variant="outline">Tek Kullanım</Badge>
                            ) : promo.maxUses ? (
                              <span>{promo.currentUses} / {promo.maxUses}</span>
                            ) : (
                              <span>{promo.currentUses} kez</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {promo.startDate && (
                            <div>{new Date(promo.startDate).toLocaleDateString('tr-TR')}</div>
                          )}
                          {promo.endDate && (
                            <div className="text-muted-foreground">
                              - {new Date(promo.endDate).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                          {!promo.startDate && !promo.endDate && (
                            <span className="text-muted-foreground">Süresiz</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(promo)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(promo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPromoCode(promo)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPromoCode ? 'Promosyon Kodunu Düzenle' : 'Yeni Promosyon Kodu'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Kod */}
            <div>
              <Label htmlFor="code">Promosyon Kodu *</Label>
              <Input
                id="code"
                placeholder="YENI2025"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Büyük harflerle, boşluksuz yazın
              </p>
            </div>

            {/* Açıklama */}
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Yılbaşı kampanyası..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* İndirim Tipi ve Değeri */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">İndirim Tipi *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discountType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                    <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">İndirim Değeri *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                  value={formData.discountValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Kullanım Tipi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageType">Kullanım Tipi *</Label>
                <Select
                  value={formData.usageType}
                  onValueChange={(value: 'single' | 'multiple') => setFormData(prev => ({ ...prev, usageType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Tek Kullanımlık</SelectItem>
                    <SelectItem value="multiple">Çoklu Kullanım</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxUses">Maksimum Kullanım</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Sınırsız"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value ? parseInt(e.target.value) : null }))}
                  disabled={formData.usageType === 'single'}
                />
              </div>
            </div>

            {/* Tarih Aralığı */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Minimum Sepet Tutarı */}
            <div>
              <Label htmlFor="minOrderAmount">Minimum Sepet Tutarı (₺)</Label>
              <Input
                id="minOrderAmount"
                type="number"
                placeholder="0"
                value={formData.minOrderAmount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            {/* Aktif/Pasif */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Aktif</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSubmit}>
              {selectedPromoCode ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promosyon Kodunu Sil</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              <strong>{selectedPromoCode?.code}</strong> kodunu silmek istediğinizden emin misiniz?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Bu işlem geri alınamaz.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
