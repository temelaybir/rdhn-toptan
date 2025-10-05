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
 * HTML redirect helper to avoid CSRF issues with NextResponse.redirect
 * callbackdocs.md'ye göre popup'tan parent window'a mesaj gönderir
 */
function createHtmlRedirect(path: string, message: string = 'Redirecting...', paymentResult?: {
  success: boolean
  orderNumber?: string
  paymentId?: string
  errorCode?: string
  errorMessage?: string
}) {
  console.log('[HTML_REDIRECT] Creating HTML redirect:', { path, message, paymentResult })
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
          .loading { color: #007bff; }
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
          .spinner {
            display: inline-block;
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px 0;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon ${paymentResult?.success ? 'success' : paymentResult?.success === false ? 'error' : 'loading'}">
            ${paymentResult?.success ? '✓' : paymentResult?.success === false ? '✗' : '•'}
          </div>
          <h1>${paymentResult?.success ? 'Ödeme Başarılı!' : paymentResult?.success === false ? 'Ödeme Başarısız' : 'İşlem Devam Ediyor'}</h1>
        <p>${message}</p>
          ${!paymentResult || paymentResult.success === undefined ? '<div class="spinner"></div>' : ''}
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Bu pencere otomatik olarak kapanacak...
          </p>
        </div>
        
        <script>
          console.log('[🚀 CALLBACK] Ultimate multi-channel communication script started!');
          
          // ✨ ULTIMATE MULTI-CHANNEL IFRAME COMMUNICATION SYSTEM ✨
          function sendMessageToParent() {
            try {
              // Decode payment result securely
              const paymentResultB64 = '${Buffer.from(JSON.stringify(paymentResult || {})).toString('base64')}';
              const paymentData = JSON.parse(atob(paymentResultB64));
              
              console.log('[💳 DECODED] Payment result:', paymentData);
              
              // Environment detection
              const isInIframe = window.parent && window.parent !== window;
              const isInModal = !!window.frameElement || window.top !== window;
              
              console.log('[🌐 ENV] Environment detection:', {
                isInIframe,
                isInModal,
                hasParent: !!window.parent,
                frameElement: !!window.frameElement,
                url: window.location.href
              });
              
              // 📨 METHOD 1: Direct postMessage (Primary)
              const sendDirectMessage = () => {
                try {
                  if (isInIframe && window.parent) {
                    let attempts = 0;
                    const maxAttempts = 5;
                    
                    const attemptSend = () => {
                      attempts++;
                      window.parent.postMessage({
                        type: 'IYZICO_PAYMENT_RESULT',
                        success: paymentData.success,
                        orderNumber: paymentData.orderNumber,
                        paymentId: paymentData.paymentId,
                        errorCode: paymentData.errorCode,
                        errorMessage: paymentData.errorMessage,
                        timestamp: Date.now(),
                        source: 'callback_direct',
                        channel: 'postMessage',
                        attempt: attempts
                      }, '*');
                      
                      console.log(\`[✅ DIRECT] PostMessage sent (attempt \${attempts})\`);
                      
                      if (attempts < maxAttempts) {
                        setTimeout(attemptSend, 1000);
                      }
                    };
                    
                    attemptSend();
                    return true;
                  }
                } catch (e) {
                  console.error('[❌ DIRECT] PostMessage failed:', e);
                }
                return false;
              };
              
              // 💾 METHOD 2: localStorage Communication (Fallback 1)
              const sendLocalStorageMessage = () => {
                try {
                  const messageData = {
                    type: 'IYZICO_PAYMENT_RESULT',
                    success: paymentData.success,
                    orderNumber: paymentData.orderNumber,
                    paymentId: paymentData.paymentId,
                    errorCode: paymentData.errorCode,
                    errorMessage: paymentData.errorMessage,
                    timestamp: Date.now(),
                    source: 'callback_localStorage',
                    channel: 'localStorage'
                  };
                  
                  localStorage.setItem('iyzico_payment_result', JSON.stringify(messageData));
                  localStorage.setItem('iyzico_payment_timestamp', Date.now().toString());
                  
                  // Trigger storage event for cross-tab communication
                  window.dispatchEvent(new StorageEvent('storage', {
                    key: 'iyzico_payment_result',
                    newValue: JSON.stringify(messageData),
                    url: window.location.href
                  }));
                  
                  console.log('[✅ STORAGE] LocalStorage message saved');
                  return true;
                } catch (e) {
                  console.error('[❌ STORAGE] LocalStorage failed:', e);
                  return false;
                }
              };
              
              // 📡 METHOD 3: BroadcastChannel (Fallback 2)
              const sendBroadcastMessage = () => {
                try {
                  if (typeof BroadcastChannel !== 'undefined') {
                    const channel = new BroadcastChannel('iyzico_payment');
                    channel.postMessage({
                      type: 'IYZICO_PAYMENT_RESULT',
                      success: paymentData.success,
                      orderNumber: paymentData.orderNumber,
                      paymentId: paymentData.paymentId,
                      errorCode: paymentData.errorCode,
                      errorMessage: paymentData.errorMessage,
                      timestamp: Date.now(),
                      source: 'callback_broadcast',
                      channel: 'BroadcastChannel'
                    });
                    channel.close();
                    console.log('[✅ BROADCAST] BroadcastChannel message sent');
                    return true;
                  }
                } catch (e) {
                  console.error('[❌ BROADCAST] BroadcastChannel failed:', e);
                }
                return false;
              };
              
              // 🏷️ METHOD 4: window.name Communication (Fallback 3)
              const sendWindowNameMessage = () => {
                try {
                  const messageData = JSON.stringify({
                    type: 'IYZICO_PAYMENT_RESULT',
                    success: paymentData.success,
                    orderNumber: paymentData.orderNumber,
                    paymentId: paymentData.paymentId,
                    errorCode: paymentData.errorCode,
                    errorMessage: paymentData.errorMessage,
                    timestamp: Date.now(),
                    source: 'callback_windowName',
                    channel: 'windowName'
                  });
                  
                  if (window.parent && window.parent !== window) {
                    window.parent.name = 'IYZICO_RESULT:' + messageData;
                  } else if (window.opener) {
                    window.opener.name = 'IYZICO_RESULT:' + messageData;
                  } else {
                    window.name = 'IYZICO_RESULT:' + messageData;
                  }
                  
                  console.log('[✅ WINDOW_NAME] Window.name message set');
                  return true;
                } catch (e) {
                  console.error('[❌ WINDOW_NAME] Window.name failed:', e);
                  return false;
                }
              };
              
              // 🚀 Execute all communication methods
              console.log('[🔄 EXECUTE] Running all communication methods...');
              
              const results = {
                direct: sendDirectMessage(),
                localStorage: sendLocalStorageMessage(),
                broadcast: sendBroadcastMessage(),
                windowName: sendWindowNameMessage()
              };
              
              console.log('[📊 RESULTS] Communication results:', results);
              
              // Update UI after 1 second
              setTimeout(() => {
                try {
                  document.body.innerHTML = \`
                    <div style="
                      display: flex; align-items: center; justify-content: center; min-height: 100vh;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                      background: \${paymentData.success ? '#f0f8ff' : '#fff5f5'};
                      margin: 0; padding: 20px;
                    ">
                      <div style="
                        background: white; padding: 40px; border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 500px; text-align: center;
                      ">
                        <div style="font-size: 48px; margin-bottom: 20px;">
                          \${paymentData.success ? '✅' : '❌'}
                        </div>
                        <h2 style="color: \${paymentData.success ? '#28a745' : '#dc3545'}; margin-bottom: 15px;">
                          \${paymentData.success ? '🎉 Ödeme Başarılı!' : '❌ Ödeme Başarısız'}
                        </h2>
                        \${paymentData.success ? \`
                          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                            <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 16px;">📋 Sipariş Detayları</h3>
                            <p style="color: #155724; margin: 5px 0; font-size: 14px;">
                              <strong>Sipariş No:</strong> \${paymentData.orderNumber || 'N/A'}
                            </p>
                            <p style="color: #155724; margin: 5px 0; font-size: 14px;">
                              <strong>Ödeme ID:</strong> \${paymentData.paymentId || 'N/A'}
                            </p>
                            <p style="color: #155724; margin: 15px 0 5px 0; font-size: 14px;">
                              ✅ Ödemeniz başarıyla alındı<br>
                              📦 Siparişiniz hazırlanıyor<br>
                              🚚 Kargo bilgileri SMS ile gönderilecek
                            </p>
                          </div>
                          <p style="color: #666; margin-bottom: 20px; line-height: 1.6; font-weight: bold;">
                            🎯 Modal'ı kapatarak sipariş takibi sayfasına gidin
                          </p>
                        \` : \`
                          <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
                            \${paymentData.errorMessage || 'Ödeme işlemi başarısız oldu.'}
                          </p>
                          \${paymentData.errorCode ? \`
                            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                              Hata Kodu: \${paymentData.errorCode}
                            </p>
                          \` : ''}
                        \`}
                        <div style="
                          width: 30px; height: 30px; border: 3px solid #f3f3f3;
                          border-top: 3px solid #007bff; border-radius: 50%;
                          animation: spin 1s linear infinite; margin: 20px auto;
                        "></div>
                      </div>
                    </div>
                    <style>
                      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                  \`;
                } catch (e) {
                  console.error('[❌ UI] UI update failed:', e);
                }
              }, 1000);
              
              // Legacy popup fallback
              if (window.opener && !window.opener.closed) {
                console.log('[🪟 POPUP] Using legacy popup method as final fallback');
                setTimeout(() => {
                  try {
                    window.opener.postMessage({
                      type: 'IYZICO_PAYMENT_RESULT',
                      success: paymentData.success,
                      orderNumber: paymentData.orderNumber,
                      paymentId: paymentData.paymentId,
                      errorCode: paymentData.errorCode,
                      errorMessage: paymentData.errorMessage,
                      timestamp: Date.now(),
                      source: 'callback_popup',
                      channel: 'popup'
                    }, '*');
                    
                    setTimeout(() => {
                      try { window.close(); } catch (e) { window.location.href = "${path}"; }
                    }, 1000);
                  } catch (e) {
                    console.error('[❌ POPUP] Popup communication failed:', e);
                  }
                }, 2000);
              }
              
            } catch (error) {
              console.error('[💥 FATAL] Script execution failed:', error);
            }
          }
          
          // Execute immediately and on DOM ready
          sendMessageToParent();
          
          document.addEventListener('DOMContentLoaded', sendMessageToParent);
          
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            sendMessageToParent();
          }
          
          // Final fallback redirects
          setTimeout(() => {
            if (!window.closed) {
              console.log('[⏰ TIMEOUT] Auto redirect after 8 seconds');
              window.location.href = "${path}";
            }
          }, 8000);
          
          setTimeout(() => {
            if (!window.closed) {
              console.log('[🔚 FINAL] Force close after 10 seconds');
              try {
                window.close();
              } catch (e) {
                window.location.href = "${path}";
              }
            }
          }, 10000);
        </script>
      </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

/**
 * İyzico callback signature doğrulaması
 * callbackdocs.md'ye göre: conversationData, conversationId, mdStatus, paymentId, status
 */
function verifyCallbackSignature(
  params: { conversationData?: string, conversationId: string, mdStatus: string, paymentId: string, status: string },
  signature: string,
  secretKey: string
): boolean {
  try {
    // callbackdocs.md'ye göre parametre sıralaması
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
 * callbackdocs.md'ye göre implementasyon
 */
export async function POST(request: NextRequest) {
  return handleCallback(request)
}

/**
 * GET - İyzico 3D Secure callback handler 
 * callbackdocs.md'ye göre implementasyon
 */
export async function GET(request: NextRequest) {
  return handleCallback(request)
}

/**
 * İyzico 3DS Callback Handler - callbackdocs.md'ye göre
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
      return createHtmlRedirect(
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
    
    // callbackdocs.md'ye göre callback parametrelerini al
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
            
            // Webhook'ten callback parametrelerine çevir
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

    // callbackdocs.md'ye göre zorunlu parametreleri kontrol et
    const { status, paymentId, conversationData, conversationId, mdStatus } = callbackParams
    
    if (!paymentId || !conversationId || !mdStatus) {
      console.error('[CALLBACK] Eksik callback parametreleri:', {
        hasPaymentId: !!paymentId,
        hasConversationId: !!conversationId,
        hasMdStatus: !!mdStatus
      })
      
      return createHtmlRedirect(
        '/odeme/hata?error=missing_parameters', 
        'Missing callback parameters. Redirecting...',
        {
          success: false,
          errorCode: 'MISSING_PARAMETERS',
          errorMessage: 'Callback parametreleri eksik'
        }
      )
    }

    // Production'da signature doğrulaması
    if (!settings.test_mode && settings.secret_key) {
      const signature = callbackParams['signature']
      if (signature) {
        const isSignatureValid = verifyCallbackSignature(
          { conversationData, conversationId, mdStatus, paymentId, status },
          signature,
          settings.secret_key
        )
        
        if (!isSignatureValid) {
          console.error('[CALLBACK] Signature verification failed')
          
          return createHtmlRedirect(
            '/odeme/hata?error=invalid_signature', 
            'Invalid signature. Redirecting...',
            {
              success: false,
              errorCode: 'INVALID_SIGNATURE',
              errorMessage: 'Güvenlik doğrulaması başarısız'
            }
          )
        }
      }
    }

    // 🔒 DUPLICATE CHECK: Aynı ödeme için tekrar işlem yapılmasını önle
    const { data: existingTransaction } = await supabase
      .from('payment_transactions')
      .select('status, completed_at')
      .eq('conversation_id', conversationId)
      .single()

    if (existingTransaction && existingTransaction.status === 'SUCCESS') {
      console.log('[🔄 DUPLICATE] Payment already completed for conversationId:', conversationId)
      return createHtmlRedirect(
        `/siparis-basarili?orderNumber=${existingTransaction.order_number}`, 
        'Payment already completed. Redirecting...',
        {
          success: true,
          orderNumber: existingTransaction.order_number,
          paymentId: paymentId
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

    // callbackdocs.md'ye göre mdStatus kontrolü
    if (mdStatus === '1' && status === 'success') {
      // [SUCCESS] 3DS doğrulama başarılı - şimdi ödemeyi tamamla
      console.log('[SUCCESS] 3DS doğrulama başarılı, ödeme tamamlanıyor:', {
          conversationId,
          paymentId,
          mdStatus
        })
        
      try {
        // 3DS tamamlama isteği yap - callbackdocs.md'ye göre
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
                  status: 'COMPLETED',
                  payment_status: 'PAID',
                  updated_at: new Date().toISOString()
                })
                .eq('order_number', transaction.order_number)
              
            console.log('[SUCCESS] Order updated successfully:', transaction.order_number)
            
            return createHtmlRedirect(
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
            return createHtmlRedirect(
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
          
          console.log('[DEBUG] About to call createHtmlRedirect for failed payment')
              
          return createHtmlRedirect(
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

        console.log('[DEBUG] About to call createHtmlRedirect for complete error')
        
        return createHtmlRedirect(
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
      // [ERROR] 3DS doğrulama başarısız - callbackdocs.md'ye göre mdStatus değerleri
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

      return createHtmlRedirect(
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
    
    console.log('[DEBUG] About to call createHtmlRedirect for callback error')
    
    return createHtmlRedirect(
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
          status: 'CANCELLED',
          payment_status: 'FAILED',
          updated_at: new Date().toISOString()
        })
        .eq('order_number', transaction.order_number)

      console.log('[UPDATE] Failed transaction updated:', transaction.order_number)
    }
  } catch (error) {
    console.error('[ERROR] Error updating failed transaction:', error)
  }
}