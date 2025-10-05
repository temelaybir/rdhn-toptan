import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { z } from 'zod'

// Node.js runtime gerekli (admin işlemleri için)
export const runtime = 'nodejs'

// Validation schema
const settingsSchema = z.object({
  is_active: z.boolean(),
  test_mode: z.boolean(),
  api_key: z.string().min(1),
  secret_key: z.string().min(1),
  sandbox_api_key: z.string().optional(),
  sandbox_secret_key: z.string().optional(),
  callback_url: z.string().url().optional().or(z.literal('')),
  webhook_url: z.string().url().optional().or(z.literal('')),
  default_currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']),
  force_3d_secure: z.boolean(),
  auto_capture: z.boolean(),
  allow_installments: z.boolean(),
  max_installment_count: z.number().min(1).max(12),
  minimum_installment_amount: z.number().min(0),
  commission_rate: z.number().min(0).max(1),
  installment_commission_rate: z.number().min(0).max(1),
  company_name: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email().optional().or(z.literal(''))
})

/**
 * Supabase client güvenli başlatma
 */
async function initializeSupabaseClient() {
  try {
    const client = await createAdminSupabaseClient()
    
    // Client'ın doğru başlatıldığını kontrol et
    if (!client || typeof client.from !== 'function') {
      throw new Error('Supabase client başlatılamadı')
    }
    
    return client
  } catch (error) {
    console.error('Supabase client initialization error:', error)
    throw new Error('Veritabanı bağlantısı kurulamadı')
  }
}

/**
 * GET - İyzico ayarlarını getirir
 */
export async function GET() {
  try {
    console.log('🔍 İyzico settings GET request started')
    
    const supabase = await initializeSupabaseClient()

    // Mevcut ayarları getir
    const { data: settings, error } = await supabase
      .from('iyzico_settings')
      .select('*')
      .single()

    if (error) {
      console.error('İyzico settings fetch error:', error)
      
      // Eğer kayıt yoksa, boş varsayılan ayarları döndür
      if (error.code === 'PGRST116') {
        console.log('📝 No existing settings found, returning defaults')
        return NextResponse.json({
          success: true,
          settings: null
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Ayarlar getirilirken hata oluştu'
      }, { status: 500 })
    }

    console.log('✅ İyzico settings fetched successfully')
    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error: any) {
    console.error('İyzico settings GET error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Sunucu hatası'
    }, { status: 500 })
  }
}

/**
 * POST - İyzico ayarlarını günceller
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 İyzico settings POST request started')
    
    // Request body'yi güvenli şekilde parse et
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Request body parse error:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Geçersiz JSON formatı'
      }, { status: 400 })
    }
    
    console.log('📝 Request body parsed:', Object.keys(body))
    
    // Validation
    const validationResult = settingsSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.errors)
      return NextResponse.json({
        success: false,
        error: 'Geçersiz veri formatı',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const data = validationResult.data
    console.log('✅ Data validation passed')
    
    // Supabase client'ı güvenli şekilde başlat
    const supabase = await initializeSupabaseClient()

    // Boş string'leri null'a çevir
    const cleanedData = {
      ...data,
      callback_url: data.callback_url === '' ? null : data.callback_url,
      webhook_url: data.webhook_url === '' ? null : data.webhook_url,
      sandbox_api_key: data.sandbox_api_key === '' ? null : data.sandbox_api_key,
      sandbox_secret_key: data.sandbox_secret_key === '' ? null : data.sandbox_secret_key,
      company_name: data.company_name === '' ? null : data.company_name,
      company_phone: data.company_phone === '' ? null : data.company_phone,
      company_email: data.company_email === '' ? null : data.company_email,
      updated_at: new Date().toISOString()
    }

    console.log('🔍 Checking for existing settings...')

    // Mevcut ayar var mı kontrol et
    const { data: existingSettings, error: checkError } = await supabase
      .from('iyzico_settings')
      .select('id')
      .maybeSingle()

    if (checkError) {
      console.error('Existing settings check error:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Mevcut ayarlar kontrol edilirken hata oluştu'
      }, { status: 500 })
    }

    let result

    if (existingSettings) {
      console.log('🔄 Updating existing settings...')
      // Güncelle
      result = await supabase
        .from('iyzico_settings')
        .update(cleanedData)
        .eq('id', existingSettings.id)
        .select()
        .single()
    } else {
      console.log('➕ Creating new settings...')
      // Yeni oluştur
      const insertData = {
        ...cleanedData,
        created_at: new Date().toISOString()
      }
      
      result = await supabase
        .from('iyzico_settings')
        .insert(insertData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('İyzico settings save error:', result.error)
      return NextResponse.json({
        success: false,
        error: 'Ayarlar kaydedilirken hata oluştu: ' + result.error.message
      }, { status: 500 })
    }

    console.log('✅ İyzico settings saved successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Ayarlar başarıyla kaydedildi',
      settings: result.data
    })

  } catch (error: any) {
    console.error('İyzico settings POST error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Sunucu hatası'
    }, { status: 500 })
  }
} 