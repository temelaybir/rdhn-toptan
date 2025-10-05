'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Settings, 
  CreditCard, 
  AlertTriangle,
  Banknote,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Info,
  Eye,
  EyeOff
} from 'lucide-react'


// Form validation schema
const paymentMethodSchema = z.object({
  method_type: z.string().min(1, 'Ödeme yöntemi tipi gerekli'),
  is_active: z.boolean(),
  display_name: z.string().min(1, 'Görünen ad gerekli'),
  display_order: z.number().min(0),
  icon: z.string().min(1, 'İkon gerekli'),
  description: z.string().optional()
})

// TypeScript interfaces
interface PaymentMethod {
  id: string
  method_type: string
  is_active: boolean
  display_name: string
  display_order: number
  icon: string
  description?: string
  created_at: string
  updated_at: string
}

interface NewPaymentMethodData {
  method_type: string
  display_name: string
  icon: string
  description?: string
}

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

const iconOptions = [
  { value: 'CreditCard', label: 'Kredi Kartı', icon: CreditCard },
  { value: 'Banknote', label: 'Banka/Para', icon: Banknote },
  { value: 'DollarSign', label: 'Dolar İşareti', icon: Settings },
  { value: 'Wallet', label: 'Cüzdan', icon: Settings }
]

const predefinedMethods = [
  { type: 'credit_card', name: 'Kredi Kartı', icon: 'CreditCard', description: 'Tüm kredi kartları kabul edilir' },
  { type: 'debit_card', name: 'Banka Kartı', icon: 'CreditCard', description: 'Banka kartları ile ödeme' },
  { type: 'bank_transfer', name: 'Havale/EFT', icon: 'Banknote', description: 'Banka havalesi veya EFT ile ödeme' },
  { type: 'cash_on_delivery', name: 'Kapıda Ödeme', icon: 'Banknote', description: 'Kapıda nakit ödeme' },
  { type: 'wallet', name: 'Dijital Cüzdan', icon: 'Wallet', description: 'Dijital cüzdan uygulamaları' }
]

export default function PaymentMethodsAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [editingMethod, setEditingMethod] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<PaymentMethodFormData>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMethodData, setNewMethodData] = useState<NewPaymentMethodData>({
    method_type: '',
    display_name: '',
    icon: 'CreditCard',
    description: ''
  })



  // Load payment methods
  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/payment-methods')
      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Ödeme yöntemleri yüklenirken hata oluştu')
        return
      }

      setPaymentMethods(result.data || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast.error('Ödeme yöntemleri yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...updates })
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Ödeme yöntemi güncellenirken hata oluştu')
        return
      }

      toast.success('Ödeme yöntemi başarıyla güncellendi')
      await loadPaymentMethods()
      
    } catch (error: any) {
      console.error('Error updating payment method:', error)
      toast.error('Ödeme yöntemi güncellenirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const deletePaymentMethod = async (id: string, methodType: string) => {
    if (!confirm(`"${methodType}" ödeme yöntemini silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Ödeme yöntemi silinirken hata oluştu')
        return
      }

      toast.success('Ödeme yöntemi başarıyla silindi')
      await loadPaymentMethods()
      
    } catch (error: any) {
      console.error('Error deleting payment method:', error)
      toast.error('Ödeme yöntemi silinirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const addPaymentMethod = async () => {
    if (!newMethodData.method_type || !newMethodData.display_name) {
      toast.error('Ödeme yöntemi tipi ve görünen ad gerekli')
      return
    }

    try {
      setIsSaving(true)
      
      const response = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMethodData)
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Ödeme yöntemi eklenirken hata oluştu')
        return
      }

      toast.success('Yeni ödeme yöntemi başarıyla eklendi')
      setShowAddForm(false)
      setNewMethodData({
        method_type: '',
        display_name: '',
        icon: 'CreditCard',
        description: ''
      })
      await loadPaymentMethods()
      
    } catch (error: any) {
      console.error('Error adding payment method:', error)
      toast.error('Ödeme yöntemi eklenirken hata oluştu: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const startEditing = (method: PaymentMethod) => {
    setEditingMethod(method.id)
    setEditFormData({
      method_type: method.method_type,
      is_active: method.is_active,
      display_name: method.display_name,
      display_order: method.display_order,
      icon: method.icon,
      description: method.description || ''
    })
  }

  const saveEdit = async () => {
    if (!editingMethod) return
    
    await updatePaymentMethod(editingMethod, editFormData)
    setEditingMethod(null)
    setEditFormData({})
  }

  const cancelEdit = () => {
    setEditingMethod(null)
    setEditFormData({})
  }

  const moveUp = async (method: PaymentMethod) => {
    const currentIndex = paymentMethods.findIndex(m => m.id === method.id)
    if (currentIndex <= 0) return

    const prevMethod = paymentMethods[currentIndex - 1]
    
    // Swap display orders
    await Promise.all([
      updatePaymentMethod(method.id, { display_order: prevMethod.display_order }),
      updatePaymentMethod(prevMethod.id, { display_order: method.display_order })
    ])
  }

  const moveDown = async (method: PaymentMethod) => {
    const currentIndex = paymentMethods.findIndex(m => m.id === method.id)
    if (currentIndex >= paymentMethods.length - 1) return

    const nextMethod = paymentMethods[currentIndex + 1]
    
    // Swap display orders
    await Promise.all([
      updatePaymentMethod(method.id, { display_order: nextMethod.display_order }),
      updatePaymentMethod(nextMethod.id, { display_order: method.display_order })
    ])
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="h-4 w-4" />
      case 'Banknote':
        return <Banknote className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const addPredefinedMethod = async (predefined: typeof predefinedMethods[0]) => {
    setNewMethodData({
      method_type: predefined.type,
      display_name: predefined.name,
      icon: predefined.icon,
      description: predefined.description
    })
    await addPaymentMethod()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Ödeme Yöntemleri
          </h1>
          <p className="text-muted-foreground mt-2">
            Ödeme yöntemlerini yönetin, aktif/pasif yapın ve sıralayın
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {paymentMethods.filter(m => m.is_active).length} / {paymentMethods.length} Aktif
          </Badge>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      {/* Hızlı Ekleme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Hızlı Ekleme
          </CardTitle>
          <CardDescription>
            Önceden tanımlanmış ödeme yöntemlerini hızlıca ekleyebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {predefinedMethods.map((method) => {
              const exists = paymentMethods.some(m => m.method_type === method.type)
              return (
                <Button
                  key={method.type}
                  variant={exists ? "secondary" : "outline"}
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={() => !exists && addPredefinedMethod(method)}
                  disabled={exists || isSaving}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getIconComponent(method.icon)}
                    <span className="font-medium">{method.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    {exists ? 'Zaten mevcut' : method.description}
                  </span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Yeni Ödeme Yöntemi Ekleme Formu */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Yeni Ödeme Yöntemi Ekle
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ödeme Yöntemi Tipi *</Label>
                <Input
                  value={newMethodData.method_type}
                  onChange={(e) => setNewMethodData(prev => ({
                    ...prev,
                    method_type: e.target.value
                  }))}
                  placeholder="bank_transfer, crypto_payment, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Teknik isim (benzersiz olmalı, snake_case kullanın)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Görünen Ad *</Label>
                <Input
                  value={newMethodData.display_name}
                  onChange={(e) => setNewMethodData(prev => ({
                    ...prev,
                    display_name: e.target.value
                  }))}
                  placeholder="Kripto Para Ödeme"
                />
              </div>

              <div className="space-y-2">
                <Label>İkon</Label>
                <Select
                  value={newMethodData.icon}
                  onValueChange={(value) => setNewMethodData(prev => ({
                    ...prev,
                    icon: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  value={newMethodData.description}
                  onChange={(e) => setNewMethodData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Kısa açıklama"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={isSaving}
              >
                İptal
              </Button>
              <Button
                onClick={addPaymentMethod}
                disabled={isSaving || !newMethodData.method_type || !newMethodData.display_name}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Ekle
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ödeme Yöntemleri Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mevcut Ödeme Yöntemleri
          </CardTitle>
          <CardDescription>
            Ödeme yöntemlerini düzenleyin, sıralayın ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz ödeme yöntemi eklenmemiş</p>
              <p className="text-sm">Yukarıdaki butonları kullanarak ödeme yöntemi ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <Card key={method.id} className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Sol taraf - Method bilgileri */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getIconComponent(method.icon)}
                        <Badge variant="outline" className="text-xs">
                          #{method.display_order}
                        </Badge>
                      </div>

                      {editingMethod === method.id ? (
                        // Edit mode
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            value={editFormData.display_name || ''}
                            onChange={(e) => setEditFormData(prev => ({
                              ...prev,
                              display_name: e.target.value
                            }))}
                            placeholder="Görünen ad"
                          />
                          <Input
                            value={editFormData.description || ''}
                            onChange={(e) => setEditFormData(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="Açıklama"
                          />
                          <Select
                            value={editFormData.icon || 'CreditCard'}
                            onValueChange={(value) => setEditFormData(prev => ({
                              ...prev,
                              icon: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <option.icon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{method.display_name}</h3>
                            <Badge variant={method.is_active ? 'default' : 'secondary'}>
                              {method.is_active ? 'Aktif' : 'Pasif'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {method.method_type}
                            </Badge>
                          </div>
                          {method.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {method.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sağ taraf - Kontroller */}
                    <div className="flex items-center gap-2">
                      {editingMethod === method.id ? (
                        // Edit mode controls
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={saveEdit}
                            disabled={isSaving}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        // View mode controls
                        <>
                          {/* Aktif/Pasif Switch */}
                          <Switch
                            checked={method.is_active}
                            onCheckedChange={(checked) => 
                              updatePaymentMethod(method.id, { is_active: checked })
                            }
                          />

                          {/* Sıralama butonları */}
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveUp(method)}
                              disabled={index === 0 || isSaving}
                              className="h-6 px-2"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveDown(method)}
                              disabled={index === paymentMethods.length - 1 || isSaving}
                              className="h-6 px-2"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Düzenle butonu */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(method)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Sil butonu */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePaymentMethod(method.id, method.display_name)}
                            disabled={isSaving}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bilgi */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Önemli:</strong> Ödeme yöntemlerini pasif yaptığınızda, müşteriler o ödeme seçeneğini göremeyecekler. 
          En az bir ödeme yönteminin aktif olması önerilir. Sıralama numarası küçük olan yöntemler önce gösterilir.
        </AlertDescription>
      </Alert>
    </div>
  )
} 