import { NextRequest, NextResponse } from 'next/server'
import { getThemeSettings, updateThemeSettings } from '@/services/site-settings'
import type { ThemeSettings } from '@/services/site-settings'

// GET - Tema ayarlarını getir
export async function GET() {
  try {
    const themeSettings = await getThemeSettings()
    
    return NextResponse.json({
      success: true,
      data: themeSettings
    })
  } catch (error) {
    console.error('Tema ayarları API hatası:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Tema ayarları getirilemedi' 
      },
      { status: 500 }
    )
  }
}

// PUT - Tema ayarlarını güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation
    const validThemeKeys = ['theme_color_scheme', 'theme_design_style', 'theme_font_style', 'theme_product_card_style']
    const themeData: Partial<ThemeSettings> = {}
    
    for (const key of validThemeKeys) {
      if (body[key] !== undefined) {
        themeData[key as keyof ThemeSettings] = body[key]
      }
    }
    
    // En az bir tema ayarı gönderilmiş olmalı
    if (Object.keys(themeData).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Geçerli tema ayarı bulunamadı' 
        },
        { status: 400 }
      )
    }
    
    // Tema ayarlarını güncelle
    const success = await updateThemeSettings(themeData)
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tema ayarları güncellenemedi' 
        },
        { status: 500 }
      )
    }
    
    // Güncellenmiş ayarları getir
    const updatedSettings = await getThemeSettings()
    
    return NextResponse.json({
      success: true,
      message: 'Tema ayarları başarıyla güncellendi',
      data: updatedSettings
    })
    
  } catch (error) {
    console.error('Tema ayarları güncelleme hatası:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Tema ayarları güncellenirken hata oluştu' 
      },
      { status: 500 }
    )
  }
} 