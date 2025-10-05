import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'
import { TrendyolAPIClient } from '@catkapinda/trendyol-integration'

export async function POST(request: NextRequest) {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { api_key, api_secret, supplier_id } = await request.json()

    if (!api_key || !api_secret || !supplier_id) {
      return NextResponse.json({
        success: false,
        error: 'API anahtarları ve supplier ID gerekli'
      }, { status: 400 })
    }

    // Trendyol API client'ı oluştur
    const client = new TrendyolAPIClient({
      supplierId: supplier_id,
      apiKey: api_key,
      apiSecret: api_secret
    })

    // Kategorileri test et
    const categories = await client.getCategories()

    return NextResponse.json({
      success: true,
      message: 'Kategori testi başarılı',
      data: {
        totalCategories: categories.length,
        categories: categories.slice(0, 10) // İlk 10 kategoriyi döndür
      }
    })

  } catch (error: any) {
    console.error('Kategori testi başarısız:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Kategori testi başarısız'
    }, { status: 500 })
  }
}
