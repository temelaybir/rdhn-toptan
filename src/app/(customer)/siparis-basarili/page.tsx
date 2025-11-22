'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ShoppingBag, CreditCard, Truck, Clock, Download, Eye, ArrowRight, Banknote, Copy } from 'lucide-react'
import { toast } from 'sonner'

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

interface BankTransferSettings {
  bank_name: string
  account_holder: string
  account_number: string
  iban: string
  swift_code?: string
  branch_name?: string
  branch_code?: string
  customer_message: string
  payment_note: string
  payment_deadline_hours: number
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({})
  const [isLoading, setIsLoading] = useState(true)
  const [bankTransferSettings, setBankTransferSettings] = useState<BankTransferSettings | null>(null)

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
            orderNumber: order.order_number || orderNumber,
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
        
        // Banka havalesi ise banka bilgilerini çek
        if (paymentMethod === 'bank_transfer') {
          const bankResponse = await fetch('/api/settings/bank-transfer')
          const bankResult = await bankResponse.json()
          if (bankResult.success && bankResult.data?.bankTransferSettings) {
            setBankTransferSettings(bankResult.data.bankTransferSettings)
          }
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6 sm:p-8 mb-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            🎉 Siparişiniz Başarıyla Tamamlandı!
          </h1>
          
          <p className="text-base sm:text-lg text-gray-600 mb-5">
            Sayın {orderDetails.customerName}, {orderDetails.paymentMethod === 'bank_transfer' ? 'siparişiniz alındı' : 'ödemeniz başarıyla alındı ve siparişiniz işleme alındı'}.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {orderDetails.paymentMethod === 'bank_transfer' ? (
              <>
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold text-sm">
                  ⏳ Ödeme Bekleniyor
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm">
                  📦 Sipariş Hazırda
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                  ✅ Ödeme Tamamlandı
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm">
                  📦 Sipariş Hazırlanıyor
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-blue-500" />
            Sipariş Detayları
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Sipariş Numarası:</span>
              <span className="font-bold text-gray-900">#{orderDetails.orderNumber}</span>
            </div>
            
            {orderDetails.paymentId && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Ödeme ID:</span>
                <span className="font-semibold text-gray-900 text-sm">{orderDetails.paymentId}</span>
              </div>
            )}
            
            {orderDetails.conversationId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium text-sm block mb-1">Transaction ID:</span>
                <span className="font-mono text-xs text-gray-900 break-all">{orderDetails.conversationId}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="text-gray-700 font-semibold">Toplam Tutar:</span>
              <span className="font-bold text-green-600 text-2xl">
                {orderDetails.totalAmount?.toFixed(2)} {orderDetails.currency === 'TRY' ? '₺' : orderDetails.currency}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Ödeme Yöntemi:</span>
              <span className="font-semibold text-gray-900 flex items-center">
                {orderDetails.paymentMethod === 'bank_transfer' ? (
                  <>
                    <Banknote className="inline w-4 h-4 mr-2 text-green-500" />
                    Banka Havalesi
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
              <span className="font-semibold text-gray-900 text-sm">{orderDetails.timestamp}</span>
            </div>
          </div>

          {/* Action Buttons - Sipariş detaylarının altında */}
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

        {/* Bank Transfer Info - Yan yana */}
        {orderDetails.paymentMethod === 'bank_transfer' && bankTransferSettings && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Banknote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ödeme Bilgileri</h2>
                <p className="text-xs text-gray-600">Havale/EFT ile ödeme yapın</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 space-y-4">
              {/* Müşteri Mesajı */}
              {bankTransferSettings.customer_message && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <p className="text-xs text-yellow-800 font-medium">
                    {bankTransferSettings.customer_message}
                  </p>
                </div>
              )}

              {/* IBAN - En önemli bilgi üstte */}
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">IBAN Numarası</p>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg relative">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono font-bold text-white text-lg tracking-wider break-all select-all">
                      {bankTransferSettings.iban}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bankTransferSettings.iban)
                        toast.success('IBAN kopyalandı!')
                      }}
                      className="flex-shrink-0 bg-white hover:bg-blue-50 text-blue-600 p-2 rounded-lg transition-colors"
                      title="Kopyala"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Banka Bilgileri - Compact */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500 mb-0.5">Banka</p>
                  <p className="text-sm font-bold text-gray-900">{bankTransferSettings.bank_name}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500 mb-0.5">Hesap Sahibi</p>
                  <p className="text-sm font-bold text-gray-900">{bankTransferSettings.account_holder}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500 mb-0.5">Hesap No</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{bankTransferSettings.account_number}</p>
                </div>
                {bankTransferSettings.branch_name && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-0.5">Şube</p>
                    <p className="text-sm font-semibold text-gray-900">{bankTransferSettings.branch_name}</p>
                  </div>
                )}
              </div>

              {/* Ödenecek Tutar */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Ödenecek Tutar</span>
                  <span className="text-2xl font-bold text-green-600">
                    {orderDetails.totalAmount?.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: orderDetails.currency || 'TRY'
                    })}
                  </span>
                </div>
              </div>

              {/* Ödeme Notu */}
              {bankTransferSettings.payment_note && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3">
                  <p className="text-xs text-red-800 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {bankTransferSettings.payment_note}
                  </p>
                </div>
              )}

              {/* Ödeme Süresi */}
              {bankTransferSettings.payment_deadline_hours && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 p-2 rounded">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>
                    Ödeme süresi: <strong>{bankTransferSettings.payment_deadline_hours} saat</strong>
                  </span>
                </div>
              )}

              {/* Alternatif Hesaplar */}
              {bankTransferSettings.alternative_accounts && 
               bankTransferSettings.alternative_accounts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Alternatif Hesaplar:</h3>
                  <div className="space-y-3">
                    {bankTransferSettings.alternative_accounts.map((account: any, index: number) => (
                      <div key={index} className="bg-white border-2 border-blue-200 rounded-lg p-4">
                        {/* IBAN - En önemli bilgi üstte */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-600 font-semibold mb-2">IBAN Numarası</p>
                          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg relative">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-mono font-bold text-white text-sm tracking-wider break-all select-all">
                                {account.iban}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(account.iban)
                                  toast.success('IBAN kopyalandı!')
                                }}
                                className="flex-shrink-0 bg-white hover:bg-blue-50 text-blue-600 p-1.5 rounded-lg transition-colors"
                                title="Kopyala"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Banka Bilgileri */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-500 mb-0.5">Banka</p>
                            <p className="text-sm font-bold text-gray-900">{account.bank_name}</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-500 mb-0.5">Hesap Sahibi</p>
                            <p className="text-sm font-bold text-gray-900">{account.account_holder}</p>
                          </div>
                          {account.account_number && (
                            <div className="p-2 bg-gray-50 rounded col-span-2">
                              <p className="text-xs text-gray-500 mb-0.5">Hesap No</p>
                              <p className="text-sm font-mono font-semibold text-gray-900">{account.account_number}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sonraki Adımlar - Banka havalesi yoksa sağda göster */}
        {(!orderDetails.paymentMethod || orderDetails.paymentMethod !== 'bank_transfer' || !bankTransferSettings) && (
          <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Sonraki Adımlar
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Sipariş Onayı</h3>
                  <p className="text-gray-600 text-xs mt-0.5">E-posta adresinize sipariş onay maili gönderildi.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Hazırlık Süreci</h3>
                  <p className="text-gray-600 text-xs mt-0.5">Siparişiniz 1-2 iş günü içerisinde hazırlanacak.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Kargo & Teslimat</h3>
                  <p className="text-gray-600 text-xs mt-0.5">Kargo bilgileri SMS ve e-posta ile bildirilecek.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Banka havalesi ise Sonraki Adımlar aşağıda tam genişlikte */}
      {orderDetails.paymentMethod === 'bank_transfer' && bankTransferSettings && (
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Sonraki Adımlar
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Sipariş Onayı</h3>
                <p className="text-gray-600 text-xs mt-1">E-posta adresinize sipariş onay maili gönderildi.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Ödeme Bekleniyor</h3>
                <p className="text-gray-600 text-xs mt-1">Havale/EFT işleminizi gerçekleştirin.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Kargo & Teslimat</h3>
                <p className="text-gray-600 text-xs mt-1">Ödeme sonrası kargoya verilecek.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & Support - Tek satırda */}
      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-blue-500" />
            Hızlı İşlemler
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/urunler"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all text-center text-sm"
            >
              <ShoppingBag className="w-5 h-5 mx-auto mb-1" />
              Alışverişe Devam
            </Link>
            
            <Link 
              href="/profil"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all text-center text-sm"
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              Sipariş Geçmişi
            </Link>
          </div>
          
          <Link 
            href="/"
            className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors text-center text-sm flex items-center justify-center"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Yardıma mı ihtiyacınız var?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Sipariş ile ilgili sorularınız için bize ulaşın.
          </p>
          <div className="space-y-2">
            <a 
              href="tel:+902121234567" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center"
            >
              📞 (0212) 123 45 67
            </a>
            <a 
              href="mailto:destek@rdhncommerce.com" 
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center"
            >
              ✉️ destek@rdhncommerce.com
            </a>
          </div>
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