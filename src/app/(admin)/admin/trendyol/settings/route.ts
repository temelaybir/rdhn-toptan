import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TrendyolSettings } from '@/types/trendyol'
import { getTrendyolClient, updateTrendyolClient, ImageProcessor } from '@ardahanticaret/trendyol-integration'
import { z } from 'zod'

// Validation schema
const settingsSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier ID gerekli'),
  api_key: z.string().min(1, 'API Key gerekli'),
  api_secret: z.string().min(1, 'API Secret gerekli'),
  ftp_host: z.string().optional(),
  ftp_user: z.string().optional(),
  ftp_password: z.string().optional(),
  ftp_base_path: z.string().default('/products'),
  is_active: z.boolean().default(true),
  mock_mode: z.boolean().default(false),
  test_mode: z.boolean().default(false)
})

// GET - Mevcut ayarları getir
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: settings, error } = await supabase
      .from('trendyol_settings')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Ayarlar getirme hatası:', error)
      return NextResponse.json(
        { error: 'Ayarlar alınamadı' },
        { status: 500 }
      )
    }

    // Eğer ayar yoksa default değerler döndür
    if (!settings) {
      const defaultSettings: Partial<TrendyolSettings> = {
        supplier_id: '',
        api_key: '',
        api_secret: '',
        ftp_host: '',
        ftp_user: '',
        ftp_password: '',
        ftp_base_path: '/products',
        sync_interval: 15,
        is_active: false
      }
      
      return NextResponse.json(defaultSettings)
    }

    // Hassas bilgileri gizle (password'ları kısalt) ama test için full secret'i döndür
    const safeSettings = {
      ...settings,
      api_secret: settings.api_secret || '',  // Test için tam secret'i döndür
      ftp_password: settings.ftp_password ? `${settings.ftp_password.substring(0, 2)}***` : ''
    }

    return NextResponse.json(safeSettings)
    
  } catch (error) {
    console.error('Ayarlar API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// PUT - Ayarları güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    const validationResult = settingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Geçersiz veri',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const supabase = await createClient()

    // Mevcut ayarları kontrol et
    const { data: existingSettings } = await supabase
      .from('trendyol_settings')
      .select('id')
      .single()

    let result

    if (existingSettings) {
      // Güncelle
      const { data, error } = await supabase
        .from('trendyol_settings')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) {
        console.error('Ayar güncelleme hatası:', error)
        return NextResponse.json(
          { error: 'Ayarlar güncellenemedi' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Yeni kayıt oluştur
      const { data, error } = await supabase
        .from('trendyol_settings')
        .insert(validatedData)
        .select()
        .single()

      if (error) {
        console.error('Ayar oluşturma hatası:', error)
        return NextResponse.json(
          { error: 'Ayarlar oluşturulamadı' },
          { status: 500 }
        )
      }

      result = data
    }

    // Trendyol client'ı güncelle
    if (validatedData.is_active) {
      try {
        updateTrendyolClient({
          supplierId: validatedData.supplier_id,
          apiKey: validatedData.api_key,
          apiSecret: validatedData.api_secret
        })
      } catch (clientError) {
        console.error('Trendyol client güncelleme hatası:', clientError)
        // Client hatası settings kaydını etkilemez
      }
    }

    return NextResponse.json({
      message: 'Ayarlar başarıyla kaydedildi',
      data: result
    })

  } catch (error) {
    console.error('Ayarlar güncelleme API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}

// POST - Bağlantı testi
export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()

    if (testType === 'api') {
      return await testTrendyolApiConnection()
    } else if (testType === 'ftp') {
      return await testFtpConnection()
    } else {
      return NextResponse.json(
        { error: 'Geçersiz test tipi' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Test API hatası:', error)
    return NextResponse.json(
      { error: 'Test sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

// Trendyol API bağlantı testi
async function testTrendyolApiConnection() {
  try {
    const supabase = await createClient()
    
    const { data: settings, error } = await supabase
      .from('trendyol_settings')
      .select('supplier_id, api_key, api_secret, mock_mode, test_mode')
      .single()

    if (error || !settings) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ayarlar bulunamadı. Önce API bilgilerini kaydedin.' 
        },
        { status: 400 }
      )
    }

    // Trendyol client ile test
    const client = getTrendyolClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)

    const isConnected = await client.testConnection()

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Trendyol API bağlantısı başarılı'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Trendyol API bağlantısı başarısız. API bilgilerini kontrol edin.'
      })
    }

  } catch (error) {
    console.error('Trendyol API test hatası:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'API test hatası'
    })
  }
}

// FTP bağlantı testi
async function testFtpConnection() {
  try {
    const supabase = await createClient()
    
    const { data: settings, error } = await supabase
      .from('trendyol_settings')
      .select('ftp_host, ftp_user, ftp_password, ftp_base_path')
      .single()

    if (error || !settings) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'FTP ayarları bulunamadı' 
        },
        { status: 400 }
      )
    }

    if (!settings.ftp_host || !settings.ftp_user || !settings.ftp_password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'FTP bilgileri eksik' 
        },
        { status: 400 }
      )
    }

    // ImageProcessor ile FTP test
    
    const imageProcessor = new ImageProcessor({
      host: settings.ftp_host,
      user: settings.ftp_user,
      password: settings.ftp_password,
      basePath: settings.ftp_base_path || '/products'
    })

    const testResult = await imageProcessor.testFtpConnection()

    return NextResponse.json(testResult)

  } catch (error) {
    console.error('FTP test hatası:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'FTP test hatası'
    })
  }
} 