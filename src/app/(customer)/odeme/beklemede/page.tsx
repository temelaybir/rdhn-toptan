'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Dynamic import to avoid SSR issues
export const dynamic = 'force-dynamic'

function PaymentWaitingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string>('processing')
  const [message, setMessage] = useState<string>('3DS doğrulama işlemi devam ediyor...')
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 60 // 5 dakika (5 saniyede bir kontrol)

  useEffect(() => {
    console.log('Payment waiting page loaded')
    
    // URL parametrelerinden conversation ID'yi al
    const conversationId = searchParams.get('conversationId')
    const orderNumber = searchParams.get('orderNumber')
    
    if (!conversationId && !orderNumber) {
      console.log('No conversation ID or order number found, redirecting to cart')
      router.push('/sepet')
      return
    }

    // Payment status polling
    const pollPaymentStatus = async () => {
      try {
        setAttempts(prev => prev + 1)
        
        if (attempts >= maxAttempts) {
          setStatus('timeout')
          setMessage('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.')
          setTimeout(() => {
            router.push('/sepet')
          }, 3000)
          return
        }

        // Check payment status API endpoint
        const response = await fetch('/api/payment/status?' + new URLSearchParams({
          ...(conversationId && { conversationId }),
          ...(orderNumber && { orderNumber })
        }))
        
        const result = await response.json()
        
        console.log('Payment status check result:', result)
        
        if (result.status === 'success') {
          setStatus('success')
          setMessage('Ödemeniz başarıyla tamamlandı! Yönlendiriliyorsunuz...')
          setTimeout(() => {
            router.push(`/siparis-basarili?orderNumber=${result.orderNumber}`)
          }, 2000)
        } else if (result.status === 'failed') {
          setStatus('failed')
          setMessage('Ödeme işlemi başarısız oldu.')
          setTimeout(() => {
            router.push(`/odeme/hata?error=${result.errorCode}&message=${encodeURIComponent(result.errorMessage || 'Ödeme başarısız')}`)
          }, 3000)
        } else {
          // Still processing, continue polling
          setMessage(`İşlem devam ediyor... (${attempts + 1}/${maxAttempts})`)
          setTimeout(pollPaymentStatus, 5000) // 5 saniye bekle
        }
      } catch (error) {
        console.error('Payment status check error:', error)
        setTimeout(pollPaymentStatus, 5000) // Hata durumunda da devam et
      }
    }

    // İlk kontrol 2 saniye sonra başla
    const timer = setTimeout(pollPaymentStatus, 2000)
    
    return () => clearTimeout(timer)
  }, [router, searchParams, attempts, maxAttempts])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {status === 'processing' && (
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              )}
              {status === 'success' && (
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {status === 'failed' && (
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {status === 'timeout' && (
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.083 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {status === 'processing' && 'Ödeme İşleminiz Devam Ediyor'}
              {status === 'success' && 'Ödeme Başarılı!'}
              {status === 'failed' && 'Ödeme Başarısız'}
              {status === 'timeout' && 'İşlem Zaman Aşımı'}
            </h2>
            
            <p className="text-gray-600">
              {message}
            </p>
            
            {status === 'processing' && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(attempts / maxAttempts) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lütfen sayfayı kapatmayın...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentWaitingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Yükleniyor...
              </h2>
              <p className="text-gray-600">
                Ödeme durumu kontrol ediliyor...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentWaitingContent />
    </Suspense>
  )
} 