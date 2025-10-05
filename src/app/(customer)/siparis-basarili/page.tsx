'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ShoppingBag, CreditCard, Truck, Clock, Download, Eye, ArrowRight } from 'lucide-react'

interface OrderDetails {
  orderNumber?: string
  paymentId?: string
  conversationId?: string
  totalAmount?: number
  currency?: string
  cardLastFour?: string
  customerName?: string
  customerEmail?: string
  status?: string
  timestamp?: string
  paymentMethod?: string
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderNumber = searchParams.get('orderNumber')
        const paymentMethod = searchParams.get('paymentMethod')
        
        if (!orderNumber) {
          // Fallback to URL parameters if no order number
          const details: OrderDetails = {
            orderNumber: `ORDER_${Date.now()}`,
            paymentId: searchParams.get('paymentId') || undefined,
            conversationId: searchParams.get('conversationId') || undefined,
            totalAmount: searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : 25.50,
            currency: searchParams.get('currency') || 'TRY',
            cardLastFour: searchParams.get('cardLastFour') || '0016',
            customerName: searchParams.get('customerName') || 'Değerli Müşterimiz',
            customerEmail: searchParams.get('customerEmail') || undefined,
            status: searchParams.get('status') || 'success',
            paymentMethod: paymentMethod || 'credit_card',
            timestamp: new Date().toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
          setOrderDetails(details)
          setIsLoading(false)
          return
        }

        // Gerçek sipariş verilerini API'den çek
        const response = await fetch(`/api/orders?orderNumber=${orderNumber}`)
        const result = await response.json()

        if (result.success && result.data) {
          const order = result.data
          const details: OrderDetails = {
            orderNumber: order.id,
            paymentId: searchParams.get('paymentId') || undefined,
            conversationId: searchParams.get('conversationId') || undefined,
            totalAmount: order.total_amount,
            currency: order.currency,
            cardLastFour: searchParams.get('cardLastFour') || 
                         (paymentMethod === 'bank_transfer' ? undefined : '****'),
            customerName: order.shipping_address?.fullName || 
                         order.billing_address?.fullName || 'Değerli Müşterimiz',
            customerEmail: order.email,
            status: order.payment_status === 'paid' ? 'success' : 'pending',
            paymentMethod: paymentMethod || 
                          (order.payment_status === 'awaiting_payment' ? 'bank_transfer' : 'credit_card'),
            timestamp: new Date(order.created_at).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
          setOrderDetails(details)
        } else {
          // Fallback to URL parameters
          const details: OrderDetails = {
            orderNumber: orderNumber,
            paymentId: searchParams.get('paymentId') || undefined,
            totalAmount: searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : 0,
            currency: 'TRY',
            cardLastFour: searchParams.get('cardLastFour'),
            customerName: 'Değerli Müşterimiz',
            status: 'success',
            paymentMethod: paymentMethod || 'credit_card',
            timestamp: new Date().toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
          setOrderDetails(details)
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
        // Fallback
        const details: OrderDetails = {
          orderNumber: searchParams.get('orderNumber') || `ORDER_${Date.now()}`,
          totalAmount: 0,
          currency: 'TRY',
          customerName: 'Değerli Müşterimiz',
          status: 'success',
          paymentMethod: searchParams.get('paymentMethod') || 'credit_card',
          timestamp: new Date().toLocaleDateString('tr-TR')
        }
        setOrderDetails(details)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Siparişiniz Başarıyla Tamamlandı!
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            Sayın {orderDetails.customerName}, ödemeniz başarıyla alındı ve siparişiniz işleme alındı.
          </p>

          <div className="flex justify-center space-x-4">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
              ✅ Ödeme Tamamlandı
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              📦 Sipariş Hazırlanıyor
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-blue-500" />
            Sipariş Detayları
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Sipariş Numarası:</span>
              <span className="font-bold text-gray-900 text-lg">#{orderDetails.orderNumber}</span>
            </div>
            
            {orderDetails.paymentId && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Ödeme ID:</span>
                <span className="font-semibold text-gray-900">{orderDetails.paymentId}</span>
              </div>
            )}
            
            {orderDetails.conversationId && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Transaction ID:</span>
                <span className="font-semibold text-gray-900 text-sm">{orderDetails.conversationId}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-gray-600 font-medium">Toplam Tutar:</span>
              <span className="font-bold text-green-600 text-xl">
                {orderDetails.totalAmount?.toFixed(2)} {orderDetails.currency === 'TRY' ? '₺' : orderDetails.currency}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Ödeme Yöntemi:</span>
              <span className="font-semibold text-gray-900 flex items-center">
                {orderDetails.paymentMethod === 'bank_transfer' ? (
                  <>
                    <CreditCard className="inline w-4 h-4 mr-2 text-green-500" />
                    Banka Havalesi / EFT
                  </>
                ) : (
                  <>
                    <CreditCard className="inline w-4 h-4 mr-2 text-blue-500" />
                    Kredi Kartı {orderDetails.cardLastFour ? `(****${orderDetails.cardLastFour})` : ''}
                  </>
                )}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Tarih & Saat:</span>
              <span className="font-semibold text-gray-900">{orderDetails.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-orange-500" />
            Sonraki Adımlar
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <div>
                <h3 className="font-semibold text-gray-900">Sipariş Onayı</h3>
                <p className="text-gray-600 text-sm">E-posta adresinize sipariş onay maili gönderildi.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <div>
                <h3 className="font-semibold text-gray-900">Hazırlık Süreci</h3>
                <p className="text-gray-600 text-sm">Siparişiniz 1-2 iş günü içerisinde hazırlanacak.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <div>
                <h3 className="font-semibold text-gray-900">Kargo & Teslimat</h3>
                <p className="text-gray-600 text-sm">Kargo bilgileri SMS ve e-posta ile bildirilecek.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Link 
              href={`/siparis-takibi/${orderDetails.orderNumber}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Eye className="w-5 h-5 mr-2" />
              Siparişimi Takip Et
            </Link>
            
            <Link 
              href="/profil"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Fatura İndir
            </Link>
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Diğer İşlemler</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href="/urunler"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-center"
          >
            <ShoppingBag className="w-6 h-6 mx-auto mb-2" />
            Alışverişe Devam Et
          </Link>
          
          <Link 
            href="/profil"
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-center"
          >
            <Clock className="w-6 h-6 mx-auto mb-2" />
            Sipariş Geçmişi
          </Link>
          
          <Link 
            href="/"
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 text-center"
          >
            <ArrowRight className="w-6 h-6 mx-auto mb-2" />
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>

      {/* Support Info */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Yardıma mı ihtiyacınız var?</h3>
        <p className="text-gray-600 mb-4">
          Sipariş ile ilgili sorularınız için müşteri hizmetlerimizle iletişime geçebilirsiniz.
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="tel:+902121234567" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            📞 (0212) 123 45 67
          </a>
          <a 
            href="mailto:destek@rdhncommerce.com" 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            ✉️ E-posta Gönder
          </a>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
} 