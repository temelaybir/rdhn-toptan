import { NextRequest, NextResponse } from 'next/server'
import { createIyzicoService } from '@/services/payment/iyzico-service'
import { IyzicoSettings } from '@/types/iyzico'

/**
 * POST - İyzico API bağlantısını test eder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Form data'dan settings oluştur
    const settings: IyzicoSettings = {
      id: 'test',
      is_active: body.is_active || false,
      test_mode: body.test_mode || true,
      api_key: body.api_key,
      secret_key: body.secret_key,
      sandbox_api_key: body.sandbox_api_key,
      sandbox_secret_key: body.sandbox_secret_key,
      production_base_url: 'https://api.iyzipay.com',
      sandbox_base_url: 'https://sandbox-api.iyzipay.com',
      callback_url: body.callback_url,
      webhook_url: body.webhook_url,
      default_currency: body.default_currency || 'TRY',
      force_3d_secure: body.force_3d_secure || true,
      auto_capture: body.auto_capture || true,
      allow_installments: body.allow_installments || true,
      max_installment_count: body.max_installment_count || 12,
      minimum_installment_amount: body.minimum_installment_amount || 100,
      commission_rate: body.commission_rate || 0.0280,
      installment_commission_rate: body.installment_commission_rate || 0.0320,
      company_name: body.company_name,
      company_phone: body.company_phone,
      company_email: body.company_email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // API anahtarları kontrolü
    if (!settings.api_key || !settings.secret_key) {
      return NextResponse.json({
        success: false,
        error: 'API Key ve Secret Key gerekli'
      }, { status: 400 })
    }

    // İyzico service oluştur ve test et
    const iyzicoService = createIyzicoService(settings)
    const testResult = await iyzicoService.testConnection()

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: testResult.data?.message || 'İyzico API bağlantısı başarılı',
        details: {
          environment: settings.test_mode ? 'Sandbox' : 'Production',
          testMode: settings.test_mode,
          apiStatus: 'connected'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: testResult.error?.message || 'Bağlantı testi başarısız',
        details: {
          environment: settings.test_mode ? 'Sandbox' : 'Production',
          testMode: settings.test_mode,
          errorCode: testResult.error?.code
        }
      })
    }

  } catch (error: any) {
    console.error('İyzico connection test error:', error)
    
    // İyzico spesifik hatalar
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json({
        success: false,
        error: 'İyzico API sunucusuna erişilemiyor. İnternet bağlantınızı kontrol edin.'
      }, { status: 503 })
    }

    if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
      return NextResponse.json({
        success: false,
        error: 'API anahtarları geçersiz. Lütfen anahtarlarınızı kontrol edin.'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Bağlantı testi sırasında beklenmeyen hata oluştu'
    }, { status: 500 })
  }
} 