'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { bulkUpdateProductCategory, bulkUpdateProductStatus, bulkDeleteProducts } from '@/app/actions/admin/product-actions'
import { useActionHandler } from '@/hooks/use-action-handler'
import { Loader2 } from 'lucide-react'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProductIds: number[]
  selectedProductsCount: number
  categories: { id: string; name: string; slug: string }[]
  onSuccess: () => void
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedProductIds,
  selectedProductsCount,
  categories,
  onSuccess
}: BulkEditDialogProps) {
  const [operation, setOperation] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  console.log('📊 Dialog açıldı. Kategoriler:', categories?.length, categories?.map(c => ({ id: c.id, name: c.name })))

  const { execute: executeBulkUpdate, isLoading } = useActionHandler({
    successMessage: 'Toplu işlem başarıyla tamamlandı',
    onSuccess: () => {
      onSuccess()
      handleClose()
    }
  })

  const handleClose = () => {
    setOperation('')
    setCategoryId('')
    setStatus('')
    setConfirmDelete(false)
    onOpenChange(false)
  }

  const handleSave = async () => {
    console.log('🚀 Toplu düzenleme başlatılıyor...')
    console.log('📋 Mevcut state:', { operation, categoryId, status, selectedProductIds })
    
    if (!operation) {
      toast.error('Lütfen bir işlem seçin')
      return
    }

    if (selectedProductIds.length === 0) {
      toast.error('Hiçbir ürün seçilmedi')
      return
    }

    try {
      switch (operation) {
        case 'category':
          if (!categoryId) {
            toast.error('Lütfen bir kategori seçin')
            return
          }
          console.log('📂 Kategori güncelleniyor:', { 
            selectedProductIds, 
            categoryId, 
            parsedCategoryId: categoryId === 'none' ? null : categoryId
          })
          await executeBulkUpdate(bulkUpdateProductCategory(
            selectedProductIds, 
            categoryId === 'none' ? null : categoryId
          ))
          break

        case 'status':
          if (!status) {
            toast.error('Lütfen bir durum seçin')
            return
          }
          console.log('📂 Durum güncelleniyor:', { 
            selectedProductIds, 
            status, 
            isActive: status === 'active'
          })
          await executeBulkUpdate(bulkUpdateProductStatus(
            selectedProductIds, 
            status === 'active'
          ))
          break

        case 'delete':
          if (!confirmDelete) {
            toast.error('Silme işlemini onaylamanız gerekiyor')
            return
          }
          console.log('📂 Ürünler siliniyor:', { selectedProductIds })
          await executeBulkUpdate(bulkDeleteProducts(selectedProductIds))
          break

        default:
          toast.error('Geçersiz işlem')
      }
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Toplu Düzenleme</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {selectedProductsCount} ürün seçili
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* İşlem Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="operation">İşlem Türü</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Yapılacak işlemi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Kategori Değiştir</SelectItem>
                <SelectItem value="status">Durum Değiştir</SelectItem>
                <SelectItem value="delete">Ürünleri Sil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kategori Seçimi */}
          {operation === 'category' && (
            <div className="space-y-2">
              <Label htmlFor="category">Yeni Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kategori Yok</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Durum Seçimi */}
          {operation === 'status' && (
            <div className="space-y-2">
              <Label htmlFor="status">Yeni Durum</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Silme Onayı */}
          {operation === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Dikkat: Bu işlem geri alınamaz!
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {selectedProductsCount} ürün kalıcı olarak silinecek.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-delete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked as boolean)}
                />
                <Label 
                  htmlFor="confirm-delete" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ürünleri silmek istediğimi onaylıyorum
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            İptal
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            variant={operation === 'delete' ? 'destructive' : 'default'}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {operation === 'delete' ? 'Sil' : 'Güncelle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 