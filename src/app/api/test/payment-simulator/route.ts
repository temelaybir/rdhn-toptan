import { NextRequest, NextResponse } from 'next/server'

// Test kartlarına göre simülasyon sonuçları
const PAYMENT_SIMULATOR = {
  success: [
    '5890040000000016', // Akbank Master Card (Debit)
    '5526080000000006', // Akbank Master Card (Credit)
    '4766620000000001', // Denizbank Visa (Debit)
    '4603450000000000'  // Denizbank Visa (Credit)
  ],
  errors: {
    '4111111111111129': { code: '9999', message: 'Yetersiz bakiye' },
    '4129111111111111': { code: '9998', message: 'İşleme izin verilmiyor' },
    '4128111111111112': { code: '9997', message: 'Geçersiz işlem' },
    '4127111111111113': { code: '9996', message: 'Kayıp kart' },
    '4126111111111114': { code: '9995', message: 'Çalıntı kart' },
    '4125111111111115': { code: '9994', message: 'Kart süresi dolmuş' },
    '4124111111111116': { code: '9993', message: 'Geçersiz güvenlik kodu' }
  }
}

/**
 * POST - Payment Simulator - Gerçek İyzico olmadan ödeme akışı testi
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎮 Payment Simulator: Demo ödeme akışı başlatılıyor...')

    const body = await request.json()
    const { cardNumber, amount = 25.50, orderNumber, testType } = body

    if (!cardNumber) {
      return NextResponse.json({
        success: false,
        error: 'Card number required',
        message: 'Kart numarası gerekli'
      }, { status: 400 })
    }

    const isSuccessCard = PAYMENT_SIMULATOR.success.includes(cardNumber)
    const errorConfig = PAYMENT_SIMULATOR.errors[cardNumber as keyof typeof PAYMENT_SIMULATOR.errors]

    console.log('🃏 Simulator test kartı:', {
      cardNumber: cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1****$2'),
      isSuccessCard,
      hasErrorConfig: !!errorConfig,
      amount
    })

    // Simüle edilmiş 3D Secure başlatma
    await new Promise(resolve => setTimeout(resolve, 1000)) // API delay simülasyonu

    if (isSuccessCard) {
      // ✅ Başarılı ödeme simülasyonu
      const paymentId = `sim_${Date.now()}`
      const conversationId = `conv_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const threeDSHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>İyzico 3D Secure Simülatör</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
        .logo { color: #1a73e8; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .amount { font-size: 32px; font-weight: bold; color: #333; margin: 20px 0; }
        .card { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .btn { background: #1a73e8; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 10px; }
        .btn:hover { background: #1557b0; }
        .btn.cancel { background: #dc3545; }
        .btn.cancel:hover { background: #c82333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💳 İyzico 3D Secure</div>
        <div class="amount">${amount.toFixed(2)} ₺</div>
        <div class="card">
            <div><strong>Kart:</strong> **** **** **** ${cardNumber.slice(-4)}</div>
            <div><strong>Sipariş:</strong> ${orderNumber || 'N/A'}</div>
        </div>
        <p>Ödemenizi onaylamak için güvenlik kodunuzu girin:</p>
        <input type="password" placeholder="SMS/Token Kodu" style="padding: 10px; margin: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        <br>
        <button class="btn" onclick="simulateSuccess()">✅ Öde</button>
        <button class="btn cancel" onclick="simulateCancel()">❌ İptal</button>
    </div>
    
    <script>
        function simulateSuccess() {
            // Başarılı ödeme callback
            window.location.href = '/api/payment/iyzico/callback?paymentId=${paymentId}&status=success&conversationId=${conversationId}';
        }
        
        function simulateCancel() {
            // İptal callback
            window.location.href = '/api/payment/iyzico/callback?paymentId=${paymentId}&status=failure&conversationId=${conversationId}&errorCode=USER_CANCELLED';
        }
    </script>
</body>
</html>`

      return NextResponse.json({
        success: true,
        message: 'Payment Simulator: 3D Secure başlatıldı! 🎮',
        data: {
          paymentResult: {
            success: true,
            paymentId,
            conversationId,
            threeDSHtmlContent: threeDSHtml,
            htmlContent: threeDSHtml
          },
          simulatorInfo: {
            mode: 'SUCCESS_SIMULATION',
            cardType: 'Test Success Card',
            expectedResult: 'Başarılı ödeme',
            nextStep: '3D Secure sayfasında "Öde" butonuna tıklayın'
          },
          instructions: {
            step1: 'threeDSHtmlContent\'i bir HTML sayfasında render edin',
            step2: '3D Secure simülatöründe "Öde" butonuna tıklayın',
            step3: 'Callback URL\'e yönlendirileceksiniz',
            step4: 'Başarılı ödeme ekranını göreceksiniz'
          }
        }
      })

    } else if (errorConfig) {
      // ❌ Hata simülasyonu
      const conversationId = `conv_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return NextResponse.json({
        success: false,
        error: 'Payment Simulator: Beklenen hata',
        message: errorConfig.message,
        data: {
          paymentResult: {
            success: false,
            conversationId,
            errorCode: errorConfig.code,
            errorMessage: errorConfig.message
          },
          simulatorInfo: {
            mode: 'ERROR_SIMULATION',
            cardType: 'Test Error Card',
            expectedResult: errorConfig.message,
            nextStep: 'Hata ekranı gösterilecek'
          },
          troubleshooting: `Bu kart "${errorConfig.message}" hatası vermesi beklenen test kartıdır`
        }
      })

    } else {
      // ❓ Bilinmeyen kart
      return NextResponse.json({
        success: false,
        error: 'Payment Simulator: Bilinmeyen kart',
        message: 'Bu kart numarası test kartları listesinde bulunamadı',
        data: {
          simulatorInfo: {
            mode: 'UNKNOWN_CARD',
            availableCards: {
              success: PAYMENT_SIMULATOR.success,
              errors: Object.keys(PAYMENT_SIMULATOR.errors)
            }
          },
          recommendation: 'Test kartları listesinden birini kullanın'
        }
      })
    }

  } catch (error: any) {
    console.error('💥 Payment Simulator Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Simulator failed',
      message: error.message || 'Payment simulator hatası',
      details: {
        stack: error.stack?.split('\n').slice(0, 5),
        name: error.name
      }
    }, { status: 500 })
  }
}

/**
 * GET - Simulator bilgileri ve test kartları
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'İyzico Payment Simulator',
    data: {
      description: 'Gerçek İyzico hesabı olmadan ödeme akışını test etmek için simülatör',
      usage: 'POST ile test kartı gönderin',
      testCards: {
        success: PAYMENT_SIMULATOR.success.map(card => ({
          number: card,
          description: 'Başarılı ödeme'
        })),
        errors: Object.entries(PAYMENT_SIMULATOR.errors).map(([card, config]) => ({
          number: card,
          description: config.message,
          errorCode: config.code
        }))
      },
      exampleRequest: {
        method: 'POST',
        body: {
          cardNumber: '5890040000000016',
          amount: 25.50,
          orderNumber: 'sim_test_001'
        }
      },
      features: [
        'Gerçek 3D Secure flow simülasyonu',
        'Başarı/hata durumları',
        'Callback URL integration',
        'HTML 3D Secure sayfası',
        'Test kartları desteği'
      ]
    }
  })
} 