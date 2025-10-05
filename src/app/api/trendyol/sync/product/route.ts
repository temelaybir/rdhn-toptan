import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { TrendyolAPIClient } from '@catkapinda/trendyol-integration'

export async function POST(request: NextRequest) {
  try {
    // Admin kimlik doğrulaması
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { barcode } = await request.json()

    if (!barcode) {
      return NextResponse.json({
        success: false,
        error: 'Barkod gerekli'
      }, { status: 400 })
    }

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

    // Trendyol'dan ürün bilgilerini al
    const trendyolResponse = await client.getProductByBarcode(barcode)
    
    if (!trendyolResponse.success || !trendyolResponse.data) {
      return NextResponse.json({
        success: false,
        error: 'Trendyol\'dan ürün bilgileri alınamadı'
      }, { status: 404 })
    }

    const trendyolProduct = trendyolResponse.data

    // Mevcut ürünü kontrol et
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (existingProduct) {
      // Mevcut ürünü güncelle
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          name: trendyolProduct.title,
          description: trendyolProduct.description,
          price: trendyolProduct.salePrice,
          list_price: trendyolProduct.listPrice,
          stock_quantity: trendyolProduct.quantity,
          images: trendyolProduct.images?.map((img: any) => img.url) || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProduct.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Ürün güncellenirken hata: ${updateError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla güncellendi',
        data: updatedProduct
      })
    } else {
      // Yeni ürün oluştur
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert([{
          barcode: barcode,
          name: trendyolProduct.title,
          description: trendyolProduct.description,
          price: trendyolProduct.salePrice,
          list_price: trendyolProduct.listPrice,
          stock_quantity: trendyolProduct.quantity,
          images: trendyolProduct.images?.map((img: any) => img.url) || [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        throw new Error(`Ürün oluşturulurken hata: ${insertError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Ürün başarıyla oluşturuldu',
        data: newProduct
      })
    }

  } catch (error: any) {
    console.error('Ürün senkronizasyon hatası:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Ürün senkronize edilemedi'
    }, { status: 500 })
  }
}
