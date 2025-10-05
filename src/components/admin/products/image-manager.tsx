'use client'

import { useState, useRef } from 'react'
import { SafeImage } from '@/components/ui/safe-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  Link2,
  X,
  Star,
  MoveUp,
  MoveDown,
  ImageIcon,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadProductImage, deleteProductImage } from '@/app/actions/admin/upload-actions'

export interface ImageItem {
  id: string
  url: string
  path?: string
  alt?: string
  position: number
  isCover: boolean
  source: 'upload' | 'url'
}

interface ImageManagerProps {
  images: ImageItem[]
  onImagesChange: (images: ImageItem[]) => void
  maxImages?: number
  productId?: string
  className?: string
}

export function ImageManager({ 
  images, 
  onImagesChange, 
  maxImages = 8,
  productId,
  className = ''
}: ImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isUrlLoading, setIsUrlLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Görsel sıralama
  const sortedImages = [...images].sort((a, b) => a.position - b.position)

  // Dosya yükleme
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return
    
    const remainingSlots = maxImages - images.length
    if (files.length > remainingSlots) {
      toast.error(`En fazla ${remainingSlots} görsel daha ekleyebilirsiniz`)
      return
    }

    setIsUploading(true)

    try {
      const validFiles = Array.from(files).filter(file => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} bir görsel dosyası değil`)
          return false
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
          toast.error(`${file.name} boyutu 5MB'dan büyük`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      const newImages: ImageItem[] = []

      for (const [index, file] of validFiles.entries()) {
        const formData = new FormData()
        formData.append('file', file)
        if (productId) {
          formData.append('productId', productId)
        }
        
        const result = await uploadProductImage(formData)
        
        if (result.success && result.result) {
          newImages.push({
            id: `upload-${Date.now()}-${index}`,
            url: result.result.url,
            path: result.result.path,
            alt: file.name.split('.')[0],
            position: images.length + index,
            isCover: images.length === 0 && index === 0,
            source: 'upload'
          })
        } else {
          toast.error(result.error || `${file.name} yüklenemedi`)
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
        toast.success(`${newImages.length} görsel başarıyla yüklendi`)
      }
      
    } catch (error) {
      console.error('Görsel yükleme hatası:', error)
      toast.error('Görsel yükleme sırasında hata oluştu')
    } finally {
      setIsUploading(false)
    }
  }

  // URL'den görsel ekleme
  const handleUrlAdd = async () => {
    if (!urlInput.trim()) {
      toast.error('URL boş olamaz')
      return
    }

    if (images.length >= maxImages) {
      toast.error(`En fazla ${maxImages} görsel ekleyebilirsiniz`)
      return
    }

    // URL validasyonu - daha esnek
    const urlPattern = /^https?:\/\/.+/i
    if (!urlPattern.test(urlInput)) {
      toast.error('Geçerli bir URL girin (http veya https ile başlamalı)')
      return
    }

    // Duplicate kontrol
    if (images.some(img => img.url === urlInput)) {
      toast.error('Bu görsel zaten eklenmiş')
      return
    }

    setIsUrlLoading(true)
    
    try {
      // Önce fetch ile HEAD request deneyerek URL'in geçerli olup olmadığını kontrol et
      let isValidUrl = false
      try {
        const response = await fetch(urlInput, { 
          method: 'HEAD',
          mode: 'no-cors' // CORS sorunlarını bypass et
        })
        isValidUrl = true
        console.log('URL HEAD request başarılı:', urlInput)
      } catch (headError) {
        console.warn('HEAD request başarısız, img element ile deneniyor:', headError)
      }

      // Image element ile test et
      const img = document.createElement('img')
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Görsel yükleme zaman aşımı (10 saniye)'))
        }, 10000)

        img.onload = () => {
          clearTimeout(timeout)
          // Görsel boyutlarını kontrol et
          if (img.naturalWidth < 10 || img.naturalHeight < 10) {
            reject(new Error('Görsel çok küçük veya geçersiz'))
            return
          }
          console.log(`Görsel başarıyla yüklendi: ${img.naturalWidth}x${img.naturalHeight}`)
          resolve(img)
        }
        
        img.onerror = (error) => {
          clearTimeout(timeout)
          console.error('Görsel yükleme hatası:', {
            url: urlInput,
            error: error,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          })
          
          // Farklı CORS stratejileri dene
          if (!img.crossOrigin) {
            console.log('CORS stratejisi deneniyor...')
            img.crossOrigin = 'use-credentials'
            img.src = urlInput // Tekrar dene
            return
          }
          
          reject(new Error('Görsel yüklenemedi. Muhtemelen CORS politikası nedeniyle erişim engellenmiş'))
        }
        
        // İlk deneme: crossOrigin olmadan
        img.src = urlInput
      })

      // Başarılı ise image ekle
      const newImage: ImageItem = {
        id: `url-${Date.now()}`,
        url: urlInput,
        alt: 'URL Görseli',
        position: images.length,
        isCover: images.length === 0,
        source: 'url'
      }

      onImagesChange([...images, newImage])
      setUrlInput('')
      toast.success('Görsel URL\'den eklendi')
      
    } catch (error) {
      console.error('URL görsel ekleme hatası:', error)
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      
      // Kullanıcıya daha yararlı hata mesajı ver
      let userMessage = errorMessage
      if (errorMessage.includes('CORS')) {
        userMessage = 'Görsel sunucusu erişim izni vermiyor. Lütfen görseli indirip yükleyin veya başka bir URL deneyin.'
      } else if (errorMessage.includes('zaman aşımı')) {
        userMessage = 'Görsel yükleme çok uzun sürüyor. Internet bağlantınızı kontrol edin.'
      }
      
      toast.error(`Görsel eklenemedi: ${userMessage}`)
      
      // Geliştirici için detaylı log
      console.group('🔍 Görsel URL Debug Bilgileri')
      console.log('URL:', urlInput)
      console.log('Domain:', new URL(urlInput).hostname)
      console.log('Protocol:', new URL(urlInput).protocol)
      console.log('Hata:', errorMessage)
      console.groupEnd()
      
    } finally {
      setIsUrlLoading(false)
    }
  }

  // Görsel silme
  const handleRemoveImage = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id)
    if (!imageToRemove) return
    
    // Eğer Supabase'de yüklenmiş bir görselse sil
    if (imageToRemove.path && imageToRemove.source === 'upload') {
      try {
        const result = await deleteProductImage(imageToRemove.path)
        if (!result.success) {
          toast.error(result.error || 'Görsel silinemedi')
          return
        }
      } catch (error) {
        console.error('Görsel silme hatası:', error)
        toast.error('Görsel silinirken hata oluştu')
        return
      }
    }
    
    const updatedImages = images.filter(img => img.id !== id)
    
    // Pozisyonları yeniden düzenle
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      position: index,
      isCover: index === 0 && updatedImages.length > 0
    }))
    
    onImagesChange(reorderedImages)
    toast.success('Görsel silindi')
  }

  // Kapak görseli ayarla
  const handleSetCover = (id: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isCover: img.id === id
    }))
    onImagesChange(updatedImages)
    toast.success('Kapak görseli güncellendi')
  }

  // Görsel sıralama
  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...sortedImages]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    
    // Pozisyonları güncelle
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      position: index
    }))
    
    onImagesChange(updatedImages)
  }

  const moveUp = (index: number) => {
    if (index > 0) {
      moveImage(index, index - 1)
    }
  }

  const moveDown = (index: number) => {
    if (index < sortedImages.length - 1) {
      moveImage(index, index + 1)
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveImage(draggedIndex, dropIndex)
    }
    handleDragEnd()
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Yükleme Alanları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dosya Yükleme */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <span className="font-medium text-lg">Dosya Yükle</span>
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                  const files = e.dataTransfer.files
                  if (files.length > 0) {
                    handleFileUpload(files)
                  }
                }}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <div className="space-y-2">
                      <span className="text-lg font-medium">Yükleniyor...</span>
                      <span className="text-sm text-gray-500">Lütfen bekleyiniz</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                    <div className="space-y-2">
                      <span className="text-lg font-medium">Tıklayın veya sürükleyin</span>
                      <span className="text-sm text-gray-500 block">
                        PNG, JPG, GIF, WebP - Maksimum 5MB
                      </span>
                      <span className="text-xs text-gray-400 block">
                        Birden fazla dosya seçebilirsiniz
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                disabled={isUploading}
              />
            </div>
          </CardContent>
        </Card>

        {/* URL'den Ekleme */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                <span className="font-medium text-lg">URL'den Ekle</span>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="https://ardahanticaret.com/image/... veya başka bir görsel URL'i"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUrlAdd()
                    }
                  }}
                  disabled={isUrlLoading}
                  className="h-12 text-base"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!urlInput.trim()) {
                      toast.error('URL boş olamaz')
                      return
                    }
                    
                    if (images.length >= maxImages) {
                      toast.error(`En fazla ${maxImages} görsel ekleyebilirsiniz`)
                      return
                    }

                    // URL validasyonu
                    const urlPattern = /^https?:\/\/.+/i
                    if (!urlPattern.test(urlInput)) {
                      toast.error('Geçerli bir URL girin')
                      return
                    }

                    // Duplicate kontrol
                    if (images.some(img => img.url === urlInput)) {
                      toast.error('Bu görsel zaten eklenmiş')
                      return
                    }

                    // Doğrudan ekle (test etmeden)
                    const newImage: ImageItem = {
                      id: `url-${Date.now()}`,
                      url: urlInput,
                      alt: 'URL Görseli',
                      position: images.length,
                      isCover: images.length === 0,
                      source: 'url'
                    }

                    onImagesChange([...images, newImage])
                    setUrlInput('')
                    toast.success('Görsel başarıyla eklendi')
                  }}
                  disabled={!urlInput.trim()}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  <Link2 className="h-5 w-5 mr-2" />
                  Ekle
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                ardahanticaret.com veya diğer güvenilir kaynaklardan görsel URL'i girebilirsiniz
              </p>
              
              {/* Hızlı Erişim Örnekleri */}
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium text-gray-600 mb-1">💡 İpucu:</p>
                <p className="text-xs text-gray-500">
                  Görsel URL'ini yapıştırıp "Ekle" butonuna tıklayın. Görsel otomatik olarak eklenir ve frontend'te gösterilir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bilgi */}
      {images.length > 0 && (
        <Alert className="p-4">
          <ImageIcon className="h-5 w-5" />
          <AlertDescription className="text-base">
            <span className="font-medium">{images.length}/{maxImages}</span> görsel eklendi. 
            <strong className="text-yellow-600 ml-2">⭐ Sarı çerçeveli görsel</strong> ürün kartlarında ana görsel olarak gösterilir.
            <br />
            <span className="text-sm text-gray-600 mt-2 block">
              💡 İpucu: Görselleri sürükleyerek sıralayabilir, ⭐ butonuyla öne çıkan görseli değiştirebilirsiniz.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Görsel Galerisi */}
      {sortedImages.length > 0 && (
        <div className="space-y-6">
          <h4 className="font-medium text-lg">Ürün Görselleri</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {sortedImages.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onDragLeave={handleDragLeave}
                className={`
                  relative group border-2 rounded-lg overflow-hidden cursor-move transition-all
                  ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                  ${dragOverIndex === index ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}
                  ${image.isCover ? 'ring-4 ring-yellow-400 border-yellow-500 bg-yellow-50' : 'hover:border-gray-300'}
                `}
              >
                {/* Görsel */}
                <div className="aspect-square relative bg-gray-50">
                  <SafeImage
                    src={image.url}
                    alt={image.alt || `Ürün görseli ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Overlay - sadece hover'da görünür */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                </div>

                {/* Kapak Badge - Daha Büyük ve Belirgin */}
                {image.isCover && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-yellow-500 text-yellow-50 text-sm font-bold px-3 py-1.5 shadow-lg">
                      <Star className="h-4 w-4 mr-2 fill-current" />
                      ÖNE ÇIKAN
                    </Badge>
                  </div>
                )}

                {/* Pozisyon Badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {index + 1}
                  </Badge>
                </div>

                {/* Source Badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge 
                    variant={image.source === 'upload' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {image.source === 'upload' ? 'Yüklendi' : 'URL'}
                  </Badge>
                </div>

                {/* Kontroller - Sürekli Görünür (daha büyük) */}
                <div className="absolute bottom-2 right-2 flex flex-col gap-1">
                  {/* Kapak Görseli Yap - Daha Büyük Button */}
                  {!image.isCover && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetCover(image.id)}
                      title="Öne çıkan görsel yap"
                      className="h-9 w-9 p-0 bg-white/90 hover:bg-white shadow-md border"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Sil - Daha Büyük Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveImage(image.id)}
                    title="Sil"
                    className="h-9 w-9 p-0 shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sıralama Kontrolleri - Sol tarafta (daha büyük) */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Yukarı Taşı */}
                  {index > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveUp(index)}
                      title="Yukarı taşı"
                      className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-md border"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Aşağı Taşı */}
                  {index < sortedImages.length - 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveDown(index)}
                      title="Aşağı taşı"
                      className="h-8 w-8 p-0 bg-white/95 hover:bg-white shadow-md border"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Öne Çıkan Görsel Overlay */}
                {image.isCover && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg" />
                    <div className="absolute inset-0 bg-yellow-400/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boş Durum */}
      {sortedImages.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/30">
          <ImageIcon className="mx-auto h-20 w-20 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz görsel eklenmedi</h3>
          <p className="text-base text-gray-500">
            Yukarıdaki yöntemlerle görsel ekleyebilirsiniz
          </p>
        </div>
      )}
    </div>
  )
} 