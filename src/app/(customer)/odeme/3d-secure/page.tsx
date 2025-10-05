'use client'

// Next.js 15 dynamic rendering fix
export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ThreeDSecureContent() {
  const searchParams = useSearchParams()
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = searchParams.get('token')
    const conversationId = searchParams.get('conversationId')
    const paymentId = searchParams.get('paymentId')

    if (!token && !conversationId) {
      setError('3D Secure parametreleri bulunamadı')
      setIsLoading(false)
      return
    }

    // URL'den HTML content alabilir veya token ile API çağrısı yapabilir
    // Bu örnekte demo için simulated HTML content gösteriyoruz
    const simulatedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>İyzico 3D Secure</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                text-align: center; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container { 
                background: white; 
                padding: 40px; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                max-width: 400px; 
                width: 100%;
              }
              .logo { 
                color: #1a73e8; 
                font-size: 28px; 
                font-weight: bold; 
                margin-bottom: 25px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                gap: 10px;
              }
              .amount { 
                font-size: 36px; 
                font-weight: bold; 
                color: #333; 
                margin: 25px 0; 
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
              }
              .card { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 25px 0; 
                border-left: 4px solid #1a73e8;
              }
              .input-group {
                margin: 20px 0;
              }
              .input-group label {
                display: block;
                text-align: left;
                margin-bottom: 8px;
                font-weight: 600;
                color: #555;
              }
              .form-input { 
                padding: 15px; 
                margin: 10px 0; 
                border: 2px solid #e1e5e9; 
                border-radius: 8px; 
                font-size: 16px; 
                width: 100%;
                box-sizing: border-box;
                transition: border-color 0.3s ease;
              }
              .form-input:focus {
                outline: none;
                border-color: #1a73e8;
                box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
              }
              .btn { 
                background: #1a73e8; 
                color: white; 
                padding: 15px 35px; 
                border: none; 
                border-radius: 8px; 
                font-size: 16px; 
                font-weight: 600; 
                cursor: pointer; 
                margin: 10px; 
                transition: all 0.3s ease;
                min-width: 120px;
              }
              .btn:hover { 
                background: #1557b0; 
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(26, 115, 232, 0.3);
              }
              .btn.cancel { 
                background: #dc3545; 
              }
              .btn.cancel:hover { 
                background: #c82333; 
              }
              .security-info {
                background: #e8f4f8;
                border: 1px solid #bee5eb;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: left;
                font-size: 14px;
                color: #0c5460;
              }
              .spinner {
                display: none;
                width: 20px;
                height: 20px;
                border: 2px solid #ffffff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 10px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .loading .spinner {
                display: inline-block;
              }
              .loading {
                opacity: 0.7;
                pointer-events: none;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo">
                  🔐 İyzico 3D Secure
              </div>
              
              <div class="amount">25.50 ₺</div>
              
              <div class="card">
                  <div><strong>Kart:</strong> **** **** **** 0016</div>
                  <div><strong>Banka:</strong> Akbank</div>
                  <div><strong>İşlem:</strong> Sim Success Test</div>
              </div>
              
              <div class="security-info">
                  🛡️ <strong>Güvenlik Doğrulaması</strong><br>
                  Bu işlem 3D Secure teknolojisi ile korunmaktadır. Devam etmek için SMS kodunuzu girin.
              </div>
              
              <div class="input-group">
                  <label for="smsCode">SMS Doğrulama Kodu:</label>
                  <input 
                    type="text" 
                    id="smsCode"
                    class="form-input" 
                    placeholder="6 haneli SMS kodu" 
                    maxlength="6"
                    pattern="[0-9]{6}"
                  >
              </div>
              
              <div style="margin-top: 30px;">
                  <button class="btn" onclick="simulateSuccess()" id="payBtn">
                      <span class="spinner"></span>
                      ✅ Öde
                  </button>
                  <button class="btn cancel" onclick="simulateCancel()">
                      ❌ İptal
                  </button>
              </div>
              
              <div style="margin-top: 25px; font-size: 12px; color: #666; line-height: 1.4;">
                  🔒 Bu sayfa SSL sertifikası ile korunmaktadır<br>
                  ⏰ Güvenlik nedeniyle 5 dakika içinde tamamlayın<br>
                  📞 Sorun yaşıyorsanız: 0850 222 00 00
              </div>
          </div>
          
          <script>
              let processing = false;
              
              function simulateSuccess() {
                  if (processing) return;
                  
                  const smsCode = document.getElementById('smsCode').value;
                  if (!smsCode || smsCode.length !== 6) {
                      alert('Lütfen 6 haneli SMS kodunu girin');
                      return;
                  }
                  
                  processing = true;
                  const btn = document.getElementById('payBtn');
                  btn.classList.add('loading');
                  btn.innerHTML = '<span class="spinner"></span> İşleniyor...';
                  
                  // 2 saniye simulated processing
                  setTimeout(() => {
                      window.location.href = '/api/payment/iyzico/callback?paymentId=sim_${Date.now()}&status=success&conversationId=${conversationId || 'sim_conv_123'}&token=sim_token_success';
                  }, 2000);
              }
              
              function simulateCancel() {
                  if (processing) return;
                  
                  if (confirm('Ödeme işlemini iptal etmek istediğinizden emin misiniz?')) {
                      window.location.href = '/api/payment/iyzico/callback?paymentId=sim_${Date.now()}&status=failure&conversationId=${conversationId || 'sim_conv_123'}&errorCode=USER_CANCELLED';
                  }
              }
              
              // SMS kod input otomatik format
              document.getElementById('smsCode').addEventListener('input', function(e) {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 6) value = value.slice(0, 6);
                  e.target.value = value;
              });
              
              // Enter key ile ödeme
              document.addEventListener('keypress', function(e) {
                  if (e.key === 'Enter') {
                      simulateSuccess();
                  }
              });
          </script>
      </body>
      </html>
    `

    setHtmlContent(simulatedHtml)
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">3D Secure yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">3D Secure Hatası</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/sepet" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sepete Dön
          </a>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}

export default function ThreeDSecurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ThreeDSecureContent />
    </Suspense>
  )
} 