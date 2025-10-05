import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createIyzicoService } from '@/services/payment/iyzico-service'
import { iyzicoLogger } from '@/services/payment/iyzico-logger'
import crypto from 'crypto'

/**
 * İyzico webhook status'larını callback status'larına çevir
 */
function mapWebhookStatusToCallback(webhookStatus: string): string {
  const statusMap: Record<string, string> = {
    'SUCCESS': 'success',
    'FAILURE': 'failure', 
    'CALLBACK_THREEDS': 'success', // 3DS başlatma callback'i
    'THREE_DS_AUTH': 'success' // 3DS auth callback'i
  }
  
  return statusMap[webhookStatus] || 'failure'
}

/**
 * İyzico webhook status'larını mdStatus'a çevir
 */
function mapWebhookStatusToMdStatus(webhookStatus: string): string {
  const mdStatusMap: Record<string, string> = {
    'SUCCESS': '1',
    'FAILURE': '0',
    'CALLBACK_THREEDS': '1', // 3DS başlatma için mdStatus=1
    'THREE_DS_AUTH': '1' // 3DS auth için mdStatus=1 (başarılıysa)
  }
  
  return mdStatusMap[webhookStatus] || '0'
}

/**
 * SIMPLIFIED HTML redirect - NO SPAM
 */
function createSimpleHtmlRedirect(path: string, message: string = 'Redirecting...', paymentResult?: {
  success: boolean
  orderNumber?: string
  paymentId?: string
  errorCode?: string
  errorMessage?: string
}) {
  console.log('[SIMPLE_REDIRECT] Creating redirect:', { path, message, paymentResult })
  
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <title>İyzico Callback</title>
        <meta charset="utf-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: ${paymentResult?.success ? '#f0f8ff' : '#fff5f5'};
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            max-width: 500px;
          }
          .icon { 
            font-size: 64px; 
            margin-bottom: 20px; 
          }
          .success { color: #28a745; }
          .error { color: #dc3545; }
          h1 { 
            color: #333; 
            margin-bottom: 15px; 
            font-size: 24px;
          }
          p { 
            color: #666; 
            margin-bottom: 20px; 
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon ${paymentResult?.success ? 'success' : 'error'}">
            ${paymentResult?.success ? '✓' : '✗'}
          </div>
          <h1>${paymentResult?.success ? 'Ödeme Başarılı!' : 'Ödeme Başarısız'}</h1>
          <p>${message}</p>
        </div>
        
        <script>
          console.log('[🔄 SIMPLE] Simple callback redirect script');
          
          // SINGLE message to parent - NO SPAM
          function sendSingleMessage() {
            try {
              const paymentData = {
                type: 'IYZICO_PAYMENT_RESULT',
                success: ${paymentResult?.success || false},
                orderNumber: '${paymentResult?.orderNumber || ''}',
                paymentId: '${paymentResult?.paymentId || ''}',
                errorCode: '${paymentResult?.errorCode || ''}',
                errorMessage: '${paymentResult?.errorMessage || ''}',
                timestamp: Date.now(),
                source: 'callback_simple'
              };
              
              // Send ONE message to parent
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(paymentData, '*');
                console.log('[✅ SENT] Single message sent to parent');
              }
              
            } catch (e) {
              console.error('[❌ ERROR] Message send failed:', e);
            }
          }
          
          // Send once immediately
          sendSingleMessage();
          
          // Redirect after 3 seconds
          setTimeout(() => {
            window.location.href = "${path}";
          }, 3000);
          
        </script>
      </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * İyzico callback signature doğrulaması
 */
function verifyCallbackSignature(
  params: { conversationData?: string, conversationId: string, mdStatus: string, paymentId: string, status: string },
  signature: string,
  secretKey: string
): boolean {
  try {
    const dataToEncrypt = [
      params.conversationData || '',
      params.conversationId,
      params.mdStatus,
      params.paymentId,
      params.status
    ].join(':')

    const hmac = crypto.createHmac('sha256', secretKey)
    hmac.update(dataToEncrypt, 'utf-8')
    const expectedSignature = hmac.digest('hex')

    console.log('🔐 Signature verification:', {
      dataToEncrypt,
      expectedSignature,
      receivedSignature: signature,
      isValid: expectedSignature === signature
    })

    return expectedSignature === signature
  } catch (error) {
    console.error('[SIGNATURE] Signature verification error:', error)
    return false
  }
}

/**
 * POST - İyzico 3D Secure callback handler
 */
export async function POST(request: NextRequest) {
  return handleCallback(request)
}

/**
 * GET - İyzico 3D Secure callback handler 
 */
export async function GET(request: NextRequest) {
  return handleCallback(request)
}

/**
 * SIMPLIFIED İyzico 3DS Callback Handler - NO SPAM
 */
async function handleCallback(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // İyzico settings'leri al
    const { data: settings } = await supabase
      .from('iyzico_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!settings) {
      console.error('[CALLBACK] İyzico settings not found')
      return createSimpleHtmlRedirect(
        '/odeme/hata?error=service_unavailable', 
        'Payment service unavailable. Redirecting...',
        {
          success: false,
          errorCode: 'SERVICE_UNAVAILABLE',
          errorMessage: 'Ödeme servisi kullanılamıyor'
        }
      )
    }

    // İyzico service oluştur
    const iyzicoService = createIyzicoService(settings)
    
    // Callback parametrelerini al
    let callbackParams: Record<string, string> = {}

    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || ''
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        for (const [key, value] of formData.entries()) {
          callbackParams[key] = value as string
        }
      } else {
        const body = await request.text()
        
        // JSON webhook formatını kontrol et
        try {
          const jsonData = JSON.parse(body)
          console.log('[WEBHOOK] Webhook JSON format detected:', jsonData)
          
          // İyzico webhook formatından form data formatına çevir
          if (jsonData.iyziEventType && jsonData.merchantId) {
            console.log('[WEBHOOK] Processing İyzico webhook format')
            
            callbackParams = {
              paymentConversationId: jsonData.paymentConversationId || '',
              paymentId: (jsonData.paymentId || jsonData.iyziPaymentId || '').toString(),
              conversationId: jsonData.paymentConversationId || '',
              status: mapWebhookStatusToCallback(jsonData.status),
              mdStatus: mapWebhookStatusToMdStatus(jsonData.status),
              iyziEventType: jsonData.iyziEventType,
              iyziReferenceCode: jsonData.iyziReferenceCode
            }
            
            console.log('[WEBHOOK] Converted webhook to callback params:', callbackParams)
          }
        } catch (e) {
          // JSON değilse URL encoded data olarak parse et
          const params = new URLSearchParams(body)
          for (const [key, value] of params.entries()) {
            callbackParams[key] = value
          }
        }
      }
    } else {
      // GET request - URL parametrelerini al
      const url = new URL(request.url)
      for (const [key, value] of url.searchParams.entries()) {
        callbackParams[key] = value
      }
    }

    console.log('[CALLBACK] Callback parametreleri:', callbackParams)

    // Zorunlu parametreleri kontrol et
    const { status, paymentId, conversationData, conversationId, mdStatus } = callbackParams
    
    if (!paymentId || !conversationId || !mdStatus) {
      console.error('[CALLBACK] Eksik callback parametreleri:', {
        hasPaymentId: !!paymentId,
        hasConversationId: !!conversationId,
        hasMdStatus: !!mdStatus
      })
      
      return createSimpleHtmlRedirect(
        '/odeme/hata?error=missing_parameters', 
        'Missing callback parameters. Redirecting...',
        {
          success: false,
          errorCode: 'MISSING_PARAMETERS',
          errorMessage: 'Callback parametreleri eksik'
        }
      )
    }

    // Callback'i logla
    await iyzicoLogger.logCallback(conversationId, {
      status,
      mdStatus,
      paymentId,
      conversationData,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      allParams: callbackParams
    })

    // mdStatus kontrolü
    if (mdStatus === '1' && status === 'success') {
      // [SUCCESS] 3DS doğrulama başarılı - şimdi ödemeyi tamamla
      console.log('[SUCCESS] 3DS doğrulama başarılı, ödeme tamamlanıyor:', {
        conversationId,
        paymentId,
        mdStatus
      })
        
      try {
        // 3DS tamamlama isteği yap
        const threeDSCompleteResult = await iyzicoService.complete3DSecurePayment(paymentId)
        
        console.log('[SUCCESS] 3DS Complete result:', threeDSCompleteResult)

        if (threeDSCompleteResult.status === 'success') {
          // [SUCCESS] Ödeme başarıyla tamamlandı
          console.log('[SUCCESS] Ödeme başarıyla tamamlandı:', {
            conversationId,
            paymentId,
            authCode: threeDSCompleteResult.paymentData?.authCode
          })

          // Transaction'ı başarılı olarak güncelle
          const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('conversation_id', conversationId)
            .single()
          
          if (transaction) {
            await supabase
              .from('payment_transactions')
              .update({
                status: 'SUCCESS',
                payment_id: paymentId,
                iyzico_payment_id: paymentId,
                completed_at: new Date().toISOString(),
                iyzico_response: threeDSCompleteResult.paymentData
              })
              .eq('id', transaction.id)
            
            // Orders tablosunu da güncelle
            await supabase
              .from('orders')
              .update({
                status: 'processing',
                payment_status: 'paid',
                updated_at: new Date().toISOString()
              })
              .eq('order_number', transaction.order_number)
            
            console.log('[SUCCESS] Order updated successfully:', transaction.order_number)
            
            return createSimpleHtmlRedirect(
              `/siparis-basarili?orderNumber=${transaction.order_number}`, 
              'Payment successful! Redirecting...',
              {
                success: true,
                orderNumber: transaction.order_number,
                paymentId: paymentId
              }
            )
          } else {
            console.error('[ERROR] Transaction not found for conversationId:', conversationId)
            return createSimpleHtmlRedirect(
              '/odeme/hata?error=transaction_not_found', 
              'Transaction not found. Redirecting...',
              {
                success: false,
                errorCode: 'TRANSACTION_NOT_FOUND',
                errorMessage: 'İşlem kaydı bulunamadı'
              }
            )
          }
        } else {
          // [ERROR] 3DS complete başarısız
          console.error('[ERROR] 3DS complete failed:', {
            conversationId,
            paymentId,
            error: threeDSCompleteResult.errorMessage
          })

          await handleFailedPayment(supabase, conversationId, 
            threeDSCompleteResult.errorCode || 'THREEDS_COMPLETE_FAILED',
            threeDSCompleteResult.errorMessage || '3DS tamamlama başarısız')
          
          return createSimpleHtmlRedirect(
            `/odeme/hata?error=${encodeURIComponent(threeDSCompleteResult.errorCode || 'THREEDS_COMPLETE_FAILED')}&message=${encodeURIComponent(threeDSCompleteResult.errorMessage || '3DS tamamlama başarısız')}`,
            'Payment failed. Redirecting...',
            {
              success: false,
              errorCode: threeDSCompleteResult.errorCode || 'THREEDS_COMPLETE_FAILED',
              errorMessage: threeDSCompleteResult.errorMessage || '3DS tamamlama başarısız'
            }
          )
        }
      } catch (error: any) {
        console.error('[ERROR] 3DS complete error:', error)
        
        await handleFailedPayment(supabase, conversationId, 
          'THREEDS_COMPLETE_ERROR', '3DS tamamlama işlemi başarısız')
        
        return createSimpleHtmlRedirect(
          '/odeme/hata?error=threeds_complete_error', 
          '3DS complete error. Redirecting...',
          {
            success: false,
            errorCode: 'THREEDS_COMPLETE_ERROR',
            errorMessage: '3DS tamamlama işlemi başarısız'
          }
        )
      }
    } else {
      // [ERROR] 3DS doğrulama başarısız
      const mdStatusMessages: Record<string, string> = {
        '0': '3D Secure imzası geçersiz veya doğrulama başarısız',
        '-1': '3D Secure imzası geçersiz (QNB Finansbank)',
        '2': 'Kart sahibi veya bankası sisteme kayıtlı değil',
        '3': 'Kartın bankası sisteme kayıtlı değil',
        '4': 'Doğrulama denemesi, kart sahibi sisteme daha sonra kayıt olmayı seçmiş',
        '5': 'Doğrulama yapılamıyor',
        '6': '3D Secure hatası',
        '7': 'Sistem hatası',
        '8': 'Bilinmeyen kart no'
      }

      const errorMessage = mdStatusMessages[mdStatus] || `3DS doğrulama başarısız (mdStatus: ${mdStatus})`
      
      console.error('[ERROR] 3DS doğrulama başarısız:', {
        conversationId,
        paymentId,
        mdStatus,
        status,
        errorMessage
      })

      await handleFailedPayment(supabase, conversationId, 
        `THREEDS_FAILED_${mdStatus}`, errorMessage)

      return createSimpleHtmlRedirect(
        `/odeme/hata?error=threeds_failed&mdStatus=${mdStatus}&message=${encodeURIComponent(errorMessage)}`,
        'Payment failed. Redirecting...',
        {
          success: false,
          errorCode: `THREEDS_FAILED_${mdStatus}`,
          errorMessage: errorMessage
        }
      )
    }

  } catch (error: any) {
    console.error('[ERROR] Callback handler error:', error)
    
    return createSimpleHtmlRedirect(
      '/odeme/hata?error=system_error', 
      'System error. Redirecting...',
      {
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: 'Sistem hatası oluştu'
      }
    )
  }
}

/**
 * Failed payment işlemlerini handle eder
 */
async function handleFailedPayment(
  supabase: any,
  conversationId: string,
  errorCode: string,
  errorMessage: string
) {
  try {
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    if (transaction) {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'FAILURE',
          error_code: errorCode,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', transaction.id)
      
      // Orders tablosunu da güncelle
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', transaction.order_number)

      console.log('[UPDATE] Failed transaction updated:', transaction.order_number)
    }
  } catch (error) {
    console.error('[ERROR] Error updating failed transaction:', error)
  }
} 