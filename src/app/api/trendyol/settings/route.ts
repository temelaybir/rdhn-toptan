import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'

export async function GET() {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const supabase = await createAdminSupabaseClient()
    
    const { data: settings, error } = await supabase
      .from('trendyol_integration_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      success: true,
      settings: settings || {
        api_key: '',
        api_secret: '',
        supplier_id: '',
        mock_mode: false,
        test_mode: false
      }
    })
  } catch (error: any) {
    console.error('Ayarlar yüklenemedi:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ayarlar yüklenemedi'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const settings = await request.json()
    const supabase = await createAdminSupabaseClient()
    
    // Mevcut ayarları kontrol et
    const { data: existingSettings } = await supabase
      .from('trendyol_integration_settings')
      .select('id')
      .eq('is_active', true)
      .single()

    let result
    if (existingSettings) {
      // Mevcut ayarları güncelle
      result = await supabase
        .from('trendyol_integration_settings')
        .update({
          api_key: settings.api_key,
          api_secret: settings.api_secret,
          supplier_id: settings.supplier_id,
          mock_mode: settings.mock_mode,
          test_mode: settings.test_mode,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
    } else {
      // Yeni ayarlar ekle
      result = await supabase
        .from('trendyol_integration_settings')
        .insert([{
          api_key: settings.api_key,
          api_secret: settings.api_secret,
          supplier_id: settings.supplier_id,
          mock_mode: settings.mock_mode,
          test_mode: settings.test_mode,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
    }

    if (result.error) {
      throw new Error(result.error.message)
    }

    return NextResponse.json({
      success: true,
      message: existingSettings ? 'Ayarlar güncellendi' : 'Ayarlar eklendi',
      settings: result.data[0]
    })
  } catch (error: any) {
    console.error('Ayarlar kaydedilemedi:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ayarlar kaydedilemedi'
    }, { status: 500 })
  }
} 