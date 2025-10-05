import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { sendOrderNotification, sendOrderConfirmationToCustomer } from '@/services/email-notification-service'
import { findCustomerByEmail, createCustomer } from '@/services/customer-auth-service'
import { getBizimHesapInvoiceService, InvoiceType } from '@/services/invoice/bizimhesap-invoice-service'

/**
 * BizimHesap otomatik fatura oluşturma
 */
async function createBizimHesapInvoice(orderNumber: string): Promise<void> {
  try {
    console.log('📄 BizimHesap otomatik fatura oluşturuluyor:', orderNumber)
    
    const invoiceService = getBizimHesapInvoiceService()
    
    const result = await invoiceService.createInvoiceFromOrderId(orderNumber, {
      invoiceType: InvoiceType.SALES,
      createInvoiceRecord: true,
      sendNotification: true
    })
    
    if (result.success) {
      console.log('✅ BizimHesap fatura başarıyla oluşturuldu:', result.invoiceId)
    } else {
      console.error('❌ BizimHesap fatura hatası:', result.error)
    }
  } catch (error) {
    console.error('❌ BizimHesap fatura exception:', error)
  }
}

/**
 * GET - Kullanıcının siparişlerini listeler
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createSupabaseServerClient()

    if (orderNumber) {
      // Belirli bir siparişi getir (eğer duplicate varsa en son oluşturulanı al)
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              images,
              slug
            )
          )
        `)
        .eq('order_number', orderNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Order fetch error:', error)
        return NextResponse.json({
          success: false,
          error: 'Sipariş bulunamadı'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: order
      })
    }

    // Kullanıcı siparişlerini listele
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            images,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Siparişler alınırken hata oluştu'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: orders || []
    })

  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 })
  }
}

/**
 * POST - Yeni sipariş oluşturur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      email,
      phone,
      totalAmount,
      subtotalAmount,
      taxAmount = 0,
      shippingAmount = 0,
      discountAmount = 0,
      currency = 'TRY',
      billingAddress,
      shippingAddress,
      notes,
      paymentMethod,
      paymentStatus = 'pending',
      items,
      userId
    } = body

    const supabase = await createSupabaseServerClient()

    // Duplicate check: Sipariş zaten var mı?
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('order_number', orderNumber)
      .single()

    if (existingOrder) {
      console.log(`[DUPLICATE_SKIP] Order already exists: ${orderNumber}`)
      return NextResponse.json({
        success: true,
        order: existingOrder,
        message: 'Order already exists'
      })
    }

    // Müşteri oluştur veya bul (magic link sistemi için)
    let customerId = null
    let isNewCustomer = false
    try {
      let customer = await findCustomerByEmail(email)
      
      if (!customer) {
        // Yeni müşteri oluştur
        const customerData = {
          email,
          first_name: billingAddress?.contactName?.split(' ')[0] || shippingAddress?.contactName?.split(' ')[0] || '',
          last_name: billingAddress?.contactName?.split(' ').slice(1).join(' ') || shippingAddress?.contactName?.split(' ').slice(1).join(' ') || '',
          phone,
          billing_address: billingAddress,
          shipping_address: shippingAddress,
          accepts_marketing: false // Varsayılan olarak false
        }
        
        customer = await createCustomer(customerData)
        console.log('✅ New customer created:', customer?.id)
        isNewCustomer = true
      } else {
        console.log('✅ Existing customer found:', customer.id)
      }
      
      customerId = customer?.id || null
    } catch (error) {
      console.error('Customer creation/lookup error:', error)
      // Müşteri oluşturulamasa bile sipariş devam etsin
    }

    // Sipariş oluştur
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        // id: Auto-generated UUID by database
        order_number: orderNumber, // Human-readable order number (SIP-XXXXX)
        user_id: userId || null,
        customer_id: customerId, // Yeni customer_id alanı
        email,
        phone,
        status: paymentMethod === 'bank_transfer' ? 'awaiting_payment' : 'pending',
        payment_status: paymentStatus,
        fulfillment_status: 'unfulfilled',
        total_amount: totalAmount,
        subtotal_amount: subtotalAmount,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        currency,
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        notes
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({
        success: false,
        error: 'Sipariş oluşturulurken hata oluştu'
      }, { status: 500 })
    }

    // Sipariş ürünlerini ekle
    if (items && items.length > 0) {
      const orderItems = []
      
      // Product ID lookup: legacy_id (number) → UUID conversion
      for (const item of items) {
        let productUUID = null
        
        if (typeof item.productId === 'number' || !isNaN(Number(item.productId))) {
          // Legacy ID ise, database'den UUID al
          const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('legacy_id', Number(item.productId))
            .single()
          
          if (product) {
            productUUID = product.id
          }
        } else {
          // Zaten UUID ise direkt kullan
          productUUID = item.productId
        }
        
        if (!productUUID) {
          console.error(`[ORDER_ITEMS] Product not found for ID: ${item.productId}`)
          continue // Skip this item, don't fail entire order
        }
        
        orderItems.push({
          order_id: order.id,
          product_id: productUUID, // Artık doğru UUID
          variant_id: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
          product_snapshot: {
            name: item.productName,
            sku: item.sku,
            image: item.image
          }
        })
      }

      if (orderItems.length === 0) {
        throw new Error('Hiçbir geçerli ürün bulunamadı')
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        console.error('Failed items details:', { orderItems, itemsError })
        // Sipariş silinebilir veya rollback yapılabilir
        await supabase.from('orders').delete().eq('id', order.id)
        return NextResponse.json({
          success: false,
          error: 'Sipariş ürünleri eklenirken hata oluştu'
        }, { status: 500 })
      }
    }

    console.log('✅ Order created successfully:', order.id)
    
    // E-mail bildirimleri gönder (async, sipariş oluşturma sürecini yavaşlatmayacak)
    const emailData = {
      orderNumber: orderNumber,
      customerName: billingAddress?.contactName || shippingAddress?.contactName || 'Müşteri',
      customerEmail: email,
      customerPhone: phone,
      totalAmount: totalAmount,
      currency: currency,
      orderItems: items?.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price
      })) || [],
      shippingAddress: {
        fullName: shippingAddress?.contactName || 'Müşteri',
        address: shippingAddress?.address || '',
        city: shippingAddress?.city || '',
        district: shippingAddress?.district || '',
        phone: phone
      }
    }
    
    // Admin'lere bildirim gönder (background'da)
    sendOrderNotification(emailData).catch(error => {
      console.error('Admin e-mail bildirimi gönderilemedi:', error)
    })
    
    // Müşteriye onay e-maili gönder (background'da)
    sendOrderConfirmationToCustomer(emailData).catch(error => {
      console.error('Müşteri onay e-maili gönderilemedi:', error)
    })

    // BizimHesap otomatik fatura oluştur (background'da)
    if (paymentStatus === 'paid') {
      createBizimHesapInvoice(orderNumber).catch(error => {
        console.error('BizimHesap fatura oluşturulamadı:', error)
      })
    }

    // Yeni müşteri oluşturuldu - magic login linki gönderilmez
    // Magic link sadece mevcut üyelere ve sipariş vermiş olanlara gönderilir
    if (isNewCustomer && customerId) {
      console.log('✅ Yeni müşteri kaydı oluşturuldu:', email)
      console.log('ℹ️ Magic login linki sadece mevcut üyelere gönderilir')
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Sipariş başarıyla oluşturuldu'
    })

  } catch (error: any) {
    console.error('Order creation API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sipariş oluşturulurken beklenmeyen hata oluştu'
    }, { status: 500 })
  }
} 