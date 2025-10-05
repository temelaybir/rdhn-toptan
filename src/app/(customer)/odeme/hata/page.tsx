'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CreditCard, RefreshCw, Home, ShoppingCart, Phone, Info, AlertTriangle } from 'lucide-react'

interface ErrorDetails {
  errorCode?: string
  errorMessage?: string
  orderNumber?: string
  paymentId?: string
  amount?: number
  currency?: string
  timestamp?: string
  suggestedAction?: string
  contactSupport?: boolean
}

// İyzico error codes ve özel mesajlar
const errorCodeMessages: { [key: string]: { title: string, message: string, action: string, icon: 'error' | 'warning' | 'info' } } = {
  '1001': {
    title: 'API Bilgileri Bulunamadı',
    message: 'Ödeme sisteminde geçici bir sorun var. Lütfen birkaç dakika sonra tekrar deneyin.',
    action: 'Tekrar deneyin veya farklı bir ödeme yöntemi seçin.',
    icon: 'error'
  },
  '1000': {
    title: 'Güvenlik Doğrulaması Başarısız',
    message: 'Ödeme güvenlik kontrolünden geçemedi. Kart bilgilerinizi kontrol edin.',
    action: 'Kart bilgilerinizi kontrol edip tekrar deneyin.',
    icon: 'warning'
  },
  '5001': {
    title: 'Kart Bilgileri Hatalı',
    message: 'Girdiğiniz kart bilgileri geçersiz. Kart numarası, son kullanma tarihi ve CVV kodunu kontrol edin.',
    action: 'Kart bilgilerinizi kontrol edip tekrar girin.',
    icon: 'warning'
  },
  '5006': {
    title: 'Yetersiz Bakiye',
    message: 'Kartınızda yeterli bakiye bulunmuyor. Lütfen başka bir kart deneyin.',
    action: 'Farklı bir kart kullanın veya bakiyenizi kontrol edin.',
    icon: 'info'
  },
  '5012': {
    title: 'Kart Kabul Edilmiyor',
    message: 'Bu kart bu işlem için kabul edilmiyor. Lütfen farklı bir kart deneyin.',
    action: 'Başka bir kart ile ödeme yapın.',
    icon: 'warning'
  },
  '5015': {
    title: 'Genel Kart Hatası',
    message: 'Kartınızla ilgili bir sorun var. Bankanızla iletişime geçin.',
    action: 'Bankanızı arayın veya farklı bir kart deneyin.',
    icon: 'error'
  },
  '5017': {
    title: 'Kartın Son Kullanma Tarihi Geçmiş',
    message: 'Kartınızın son kullanma tarihi geçmiş. Lütfen geçerli bir kart kullanın.',
    action: 'Geçerli bir kart ile ödeme yapın.',
    icon: 'warning'
  },
  '5051': {
    title: 'CVV Kodu Hatalı',
    message: 'Girdiğiniz güvenlik kodu (CVV) hatalı. Kartın arkasındaki 3 haneli kodu girin.',
    action: 'CVV kodunu kontrol edip tekrar girin.',
    icon: 'warning'
  },
  'timeout': {
    title: 'İşlem Zaman Aşımına Uğradı',
    message: 'Ödeme işlemi çok uzun sürdü ve zaman aşımına uğradı.',
    action: 'Lütfen tekrar deneyin.',
    icon: 'warning'
  },
  'network_error': {
    title: 'Bağlantı Sorunu',
    message: 'İnternet bağlantınızda bir sorun var veya sunucularımıza ulaşılamıyor.',
    action: 'İnternet bağlantınızı kontrol edip tekrar deneyin.',
    icon: 'error'
  },
  'transaction_not_found': {
    title: 'İşlem Bulunamadı',
    message: 'Ödeme işlemi kayıtlarımızda bulunamadı.',
    action: 'Yeni bir ödeme işlemi başlatın.',
    icon: 'info'
  }
}

function PaymentErrorContent() {
  const searchParams = useSearchParams()
  const [errorDetails, setErrorDetails] = useState<ErrorDetails>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // URL parametrelerinden hata bilgilerini al
    const details: ErrorDetails = {
      errorCode: searchParams.get('errorCode') || searchParams.get('error') || '9999',
      errorMessage: searchParams.get('errorMessage') || searchParams.get('message') || 'Bilinmeyen hata',
      orderNumber: searchParams.get('orderNumber') || undefined,
      paymentId: searchParams.get('paymentId') || undefined,
      amount: searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : undefined,
      currency: searchParams.get('currency') || 'TRY',
      timestamp: new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    setErrorDetails(details)
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Hata bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  const errorInfo = errorCodeMessages[errorDetails.errorCode || '9999'] || errorCodeMessages['9999'] || {
    title: 'Bilinmeyen Hata',
    message: errorDetails.errorMessage || 'Beklenmeyen bir hata oluştu.',
    action: 'Lütfen tekrar deneyin veya destek ile iletişime geçin.',
    icon: 'error' as const
  }

  const getIconColor = (icon: string) => {
    switch (icon) {
      case 'error': return 'text-red-500 bg-red-100'
      case 'warning': return 'text-orange-500 bg-orange-100'
      case 'info': return 'text-blue-500 bg-blue-100'
      default: return 'text-red-500 bg-red-100'
    }
  }

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'warning': return AlertTriangle
      case 'info': return Info
      default: return AlertCircle
    }
  }

  const IconComponent = getIcon(errorInfo.icon)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Error Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className={`w-24 h-24 ${getIconColor(errorInfo.icon)} rounded-full flex items-center justify-center shadow-lg`}>
              <IconComponent className="w-14 h-14" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ❌ {errorInfo.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {errorInfo.message}
          </p>

          <div className="bg-white bg-opacity-70 rounded-lg p-4 inline-block">
            <p className="font-semibold text-gray-800">
              💡 Önerilen Çözüm: {errorInfo.action}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Error Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
            Hata Detayları
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-gray-600 font-medium">Hata Kodu:</span>
              <span className="font-bold text-red-600 text-lg">#{errorDetails.errorCode}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Hata Mesajı:</span>
              <span className="font-semibold text-gray-900 text-sm">{errorDetails.errorMessage}</span>
            </div>
            
            {errorDetails.orderNumber && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Sipariş No:</span>
                <span className="font-semibold text-gray-900">#{errorDetails.orderNumber}</span>
              </div>
            )}
            
            {errorDetails.paymentId && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Ödeme ID:</span>
                <span className="font-semibold text-gray-900 text-sm">{errorDetails.paymentId}</span>
              </div>
            )}
            
            {errorDetails.amount && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Tutar:</span>
                <span className="font-semibold text-gray-900">
                  {errorDetails.amount.toFixed(2)} {errorDetails.currency === 'TRY' ? '₺' : errorDetails.currency}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Zaman:</span>
              <span className="font-semibold text-gray-900">{errorDetails.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Solutions & Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <RefreshCw className="w-6 h-6 mr-2 text-blue-500" />
            Çözüm Önerileri
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <div>
                <h3 className="font-semibold text-gray-900">Kart Bilgilerini Kontrol Edin</h3>
                <p className="text-gray-600 text-sm">Kart numarası, son kullanma tarihi ve CVV kodunu doğru girdiğinizden emin olun.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <div>
                <h3 className="font-semibold text-gray-900">Farklı Kart Deneyin</h3>
                <p className="text-gray-600 text-sm">Başka bir kredi kartı veya banka kartı ile ödeme yapmayı deneyin.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <div>
                <h3 className="font-semibold text-gray-900">Bankanızla İletişime Geçin</h3>
                <p className="text-gray-600 text-sm">Kartınız bloke olmuş veya limit problemi olabilir.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Link 
              href="/odeme"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Tekrar Dene
            </Link>
            
            <Link 
              href="/sepet"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Sepete Dön
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Alternatif Seçenekler</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href="/urunler"
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-center"
          >
            <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
            Alışverişe Devam
          </Link>
          
          <Link 
            href="/odeme"
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-center"
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2" />
            Farklı Kart Dene
          </Link>
          
          <Link 
            href="/"
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-center"
          >
            <Home className="w-6 h-6 mx-auto mb-2" />
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>

      {/* Support Info */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Yardıma mı ihtiyacınız var?</h3>
        <p className="text-gray-600 mb-4">
          Sorun devam ediyorsa, müşteri hizmetlerimizle iletişime geçebilirsiniz.
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="tel:+902121234567" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
          >
            <Phone className="w-4 h-4 mr-2" />
            (0212) 123 45 67
          </a>
          <a 
            href="mailto:destek@rdhncommerce.com" 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            ✉️ E-posta Gönder
          </a>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Hata kodu <strong>#{errorDetails.errorCode}</strong> ile birlikte iletişime geçerseniz size daha hızlı yardımcı olabiliriz.</p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  )
} 