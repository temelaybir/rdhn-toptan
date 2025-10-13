import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { TrendyolAPIClient } from '@ardahanticaret/trendyol-integration'

export async function GET(request: NextRequest) {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '50')
    const status = searchParams.get('status') || 'all'
    const barcode = searchParams.get('barcode') || ''
    const stockCode = searchParams.get('stockCode') || ''
    const productMainId = searchParams.get('productMainId') || ''
    const brandIds = searchParams.get('brandIds') || ''
    
    // Trendyol ayarlarını al
    const supabase = await createAdminSupabaseClient()
    const { data: settings } = await supabase
      .from('trendyol_integration_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Trendyol ayarları bulunamadı'
      }, { status: 400 })
    }

    // Trendyol API client'ı oluştur
    const client = new TrendyolAPIClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)

    // API dokümantasyonuna göre filtreleri hazırla
    const params: any = { 
      page, 
      size,
      supplierId: settings.supplier_id
    }
    
    // Status filtreleri
    switch (status) {
      case 'approved':
        params.approved = true
        break
      case 'pending':
        params.approved = false
        break
      case 'archived':
        params.archived = true
        break
      case 'active':
        params.onSale = true
        break
      case 'inactive':
        params.onSale = false
        break
      case 'rejected':
        params.rejected = true
        break
      case 'blacklisted':
        params.blacklisted = true
        break
    }

    // Diğer filtreler
    if (barcode) params.barcode = barcode
    if (stockCode) params.stockCode = stockCode
    if (productMainId) params.productMainId = productMainId
    if (brandIds) params.brandIds = brandIds

    // Trendyol API'den ürünleri al
    const response = await client.getProducts(page, size, params)
    
    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error: any) {
    console.error('Trendyol ürün çekme hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ürünler alınamadı',
      details: error.response?.data || error
    }, { status: 500 })
  }
}
