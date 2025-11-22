import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { sendOrderStatusUpdateToCustomer } from '@/services/email-notification-service'
import { cookies } from 'next/headers'

// Simple admin check for quick login compatibility  
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // 1. Direct cookie session token check
    const sessionToken = request.cookies.get('admin_session_token')?.value

    console.log('🔍 Auth check - Session token:', sessionToken ? 'Found' : 'Not found')
    
    if (!sessionToken) {
      console.log('❌ No session token found')
      return false
    }

    // 2. Session token'ı Supabase'de validate et
    try {
      const supabase = await createAdminSupabaseClient()
      
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users!inner(
            id,
            username,
            email,
            role,
            is_active
          )
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (!error && session && session.admin_users?.is_active) {
        console.log('✅ Valid admin session found - User:', session.admin_users.username)
        return true
      }
      
      console.log('❌ Invalid session:', error?.message || 'Session not found')
      return false
      
    } catch (sessionError) {
      console.error('❌ Session validation error:', sessionError)
      return false
    }

    console.log('❌ No valid authentication found')
    return false
  } catch (error) {
    console.error('Admin auth check error:', error)
    return false
  }
}

// Map database status to frontend status - Yeni bildirim aşamaları
function mapDatabaseStatusToFrontend(dbStatus: string, paymentStatus?: string): string {
  const statusLower = dbStatus?.toLowerCase()
  
  switch (statusLower) {
    case 'pending':
      // Eğer ödeme bekleniyorsa "awaiting_payment", yoksa "pending"
      return paymentStatus === 'awaiting_payment' ? 'awaiting_payment' : 'pending'
    case 'confirmed':
    case 'success':
    case 'completed':
    case 'processing':
      return 'confirmed' // Başarılı Sipariş - Kargolanacak
    case 'shipped':
      return 'shipped' // Kargoda
    case 'delivered':
      return 'delivered' // Teslim edildi
    case 'cancelled':
    case 'failure':
      return 'cancelled'
    case 'awaiting_payment':
      return 'awaiting_payment'
    default:
      return 'pending'
  }
}

// Safely extract customer name from address data
function extractCustomerName(billingAddress: any, shippingAddress: any, email: string): string {
  // Try billing address first
  if (billingAddress) {
    if (billingAddress.fullName && billingAddress.fullName.trim() !== '') {
      return billingAddress.fullName.trim()
    }
    
    const firstName = billingAddress.firstName?.trim() || ''
    const lastName = billingAddress.lastName?.trim() || ''
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }
  }
  
  // Try shipping address
  if (shippingAddress) {
    if (shippingAddress.fullName && shippingAddress.fullName.trim() !== '') {
      return shippingAddress.fullName.trim()
    }
    
    const firstName = shippingAddress.firstName?.trim() || ''
    const lastName = shippingAddress.lastName?.trim() || ''
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }
  }
  
  // Extract from email as fallback
  if (email) {
    const emailName = email.split('@')[0]
    if (emailName && emailName.length > 0) {
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
  }
  
  return 'Misafir Kullanıcı'
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request)
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Yetkisiz erişim - Admin girişi gerekli'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const orderBy = searchParams.get('orderBy') || 'created_at'
    const orderDir = searchParams.get('orderDir') || 'desc'

    const supabase = await createAdminSupabaseClient()

    // Base query for orders with order items
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        phone,
        status,
        payment_status,
        payment_method,
        fulfillment_status,
        total_amount,
        subtotal_amount,
        tax_amount,
        shipping_amount,
        discount_amount,
        currency,
        billing_address,
        shipping_address,
        notes,
        created_at,
        updated_at,
        kargo_barcode,
        kargo_talepno,
        kargo_takipno,
        kargo_sonuc,
        kargo_firma,
        kargo_tarih,
        order_items (
          id,
          quantity,
          price,
          total,
          product_snapshot,
          products (
            id,
            name,
            slug,
            images
          )
        )
      `)

    // Apply search filter
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply status filter - need to fetch all and filter after mapping
    // because frontend status depends on both status and payment_status columns
    const needsClientFiltering = status !== 'all'

    // Apply ordering
    const validColumns = ['created_at', 'total_amount', 'order_number', 'status']
    const validDirs = ['asc', 'desc']
    
    if (validColumns.includes(orderBy) && validDirs.includes(orderDir)) {
      query = query.order(orderBy, { ascending: orderDir === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Don't apply pagination yet if we need to filter by frontend status
    if (!needsClientFiltering) {
      query = query.range(page * limit, (page + 1) * limit - 1)
    }

    const { data: allFetchedOrders, error } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Siparişler getirilemedi: ' + error.message
      }, { status: 500 })
    }

    // Transform data for frontend
    const allTransformedOrders = allFetchedOrders?.map(order => {
      // Extract customer name safely
      const billingAddress = order.billing_address as any
      const shippingAddress = order.shipping_address as any
      const customerName = extractCustomerName(billingAddress, shippingAddress, order.email)

      // Map status from database to frontend format
      const frontendStatus = mapDatabaseStatusToFrontend(order.status, order.payment_status)

      // Count total items
      const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0

      // ✅ Payment method artık doğrudan database'den geliyor
      const paymentMethod = order.payment_method === 'bank_transfer' 
        ? 'Banka Havalesi / EFT' 
        : order.payment_method === 'credit_card'
        ? 'Kredi Kartı'
        : order.payment_method || 'Kredi Kartı' // fallback

      return {
        id: order.order_number || order.id,
        customer: customerName,
        email: order.email,
        phone: order.phone || 'Belirtilmemiş',
        date: order.created_at, // Keep as ISO string for proper formatting
        total: order.total_amount,
        status: frontendStatus,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        items: totalItems,
        payment: paymentMethod,
        currency: order.currency,
        shippingAddress: shippingAddress ? {
          fullName: shippingAddress.fullName || extractCustomerName(null, shippingAddress, order.email),
          address: shippingAddress.address || shippingAddress.addressLine1 || '',
          city: shippingAddress.city || '',
          district: shippingAddress.district || '',
          postalCode: shippingAddress.postalCode || ''
        } : null,
        billingAddress: billingAddress ? {
          fullName: billingAddress.fullName || extractCustomerName(billingAddress, null, order.email),
          address: billingAddress.address || billingAddress.addressLine1 || '',
          city: billingAddress.city || '',
          district: billingAddress.district || '',
          postalCode: billingAddress.postalCode || ''
        } : null,
        orderItems: order.order_items?.map(item => ({
          id: item.id,
          name: item.product_snapshot?.name || item.products?.name || 'Bilinmeyen Ürün',
          image: item.product_snapshot?.image || item.products?.images?.[0] || '/placeholder-product.svg',
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })) || [],
        notes: order.notes,
        trackingNumber: order.kargo_takipno || null,
        cargoCompany: order.kargo_firma || null,
        // Aras Kargo fields
        kargo_barcode: order.kargo_barcode || null,
        kargo_talepno: order.kargo_talepno || null,
        kargo_takipno: order.kargo_takipno || null,
        kargo_sonuc: order.kargo_sonuc || null,
        kargo_firma: order.kargo_firma || null,
        kargo_tarih: order.kargo_tarih || null
      }
    }) || []

    // Apply frontend status filter if needed
    let filteredOrders = allTransformedOrders
    if (needsClientFiltering) {
      filteredOrders = allTransformedOrders.filter(order => order.status === status)
    }

    // Apply pagination after filtering
    const totalFilteredCount = filteredOrders.length
    const paginatedOrders = filteredOrders.slice(page * limit, (page + 1) * limit)

    // Calculate statistics - yeni bildirim aşamaları
    const statsQuery = await supabase
      .from('orders')
      .select('status, payment_status, total_amount', { count: 'exact', head: false })

    const allOrders = statsQuery.data || []
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'pending').length,
      confirmed: allOrders.filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'confirmed').length, // Başarılı Sipariş - Kargolanacak
      shipped: allOrders.filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'shipped').length, // Kargoda
      delivered: allOrders.filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'delivered').length, // Teslim edildi
      cancelled: allOrders.filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'cancelled').length,
      awaiting_payment: allOrders.filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'awaiting_payment').length,
      total_revenue: allOrders
        .filter(o => mapDatabaseStatusToFrontend(o.status, o.payment_status) === 'delivered') // Teslim edilenlerden gelir hesapla
        .reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: paginatedOrders,
        stats,
        pagination: {
          page,
          limit,
          total: totalFilteredCount,
          totalPages: Math.ceil(totalFilteredCount / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    }, { status: 500 })
  }
}

/**
 * PATCH - Sipariş durumunu günceller
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request)
    
    if (!isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Yetkisiz erişim - Admin girişi gerekli'
      }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, status, paymentStatus, notes, trackingNumber, cargoCompany } = body

    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Sipariş ID ve durum gerekli'
      }, { status: 400 })
    }

    // Map frontend status to database status
    const dbStatus = status.toUpperCase()

    const supabase = await createAdminSupabaseClient()

    // Update order
    const updateData: any = {
      status: dbStatus,
      updated_at: new Date().toISOString()
    }

    // Ödeme durumu güncellemesi (Banka havalesi onayı için)
    if (paymentStatus !== undefined) {
      updateData.payment_status = paymentStatus
      
      // ⚠️ NOT: Banka havalesi onaylandığında status frontend'den gelir
      // Burada otomatik status değişikliği yapmıyoruz
      // Frontend'den gelen status değeri kullanılır (pending → İşleme Alındı)
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Tracking fields will be enabled after migration
    // if (trackingNumber !== undefined) {
    //   updateData.tracking_number = trackingNumber
    // }

    // if (cargoCompany !== undefined) {
    //   updateData.cargo_company = cargoCompany
    // }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_number', orderId)
      .select('*, payment_method') // ✅ payment_method'u da çek
      .single()

    if (error) {
      console.error('Order update error:', error)
      return NextResponse.json({
        success: false,
        error: 'Sipariş güncellenirken hata oluştu: ' + error.message
      }, { status: 500 })
    }

    // Customer'a durum değişikliği e-maili gönder (background)
    if (order && order.email) {
      // Address field isimlerini normalize et (fullName veya contactName olabilir)
      const billingName = order.billing_address?.fullName || order.billing_address?.contactName || 
                          extractCustomerName(order.billing_address, order.shipping_address, order.email)
      const shippingName = order.shipping_address?.fullName || order.shipping_address?.contactName || 
                           extractCustomerName(order.billing_address, order.shipping_address, order.email)
      
      const emailData = {
        orderNumber: order.order_number,
        customerName: billingName,
        customerEmail: order.email,
        customerPhone: order.phone || '',
        totalAmount: parseFloat(order.total_amount) || 0,
        currency: order.currency || 'TRY',
        orderItems: [], // Boş array, detaylar gerekirse ayrı sorgu yapılabilir
        shippingAddress: {
          fullName: shippingName,
          address: order.shipping_address?.address || order.shipping_address?.addressLine1 || '',
          city: order.shipping_address?.city || '',
          district: order.shipping_address?.district || '',
          phone: order.phone || ''
        }
      }
      
      // Status update e-maili gönder (async, background'da)
      sendOrderStatusUpdateToCustomer(
        emailData, 
        status.toLowerCase(),
        trackingNumber,
        cargoCompany
      ).catch(error => {
        console.error('Status update e-maili gönderilemedi:', error)
      })
    }

    // ✅ Sipariş "İşleme Alındı" (PENDING) durumuna getirildiğinde - BizimHesap faturası oluştur
    // NOT: Bu her sipariş türü için geçerlidir (kredi kartı, banka havalesi, vb.)
    if (order && dbStatus === 'PENDING') {
      console.log('🧾 Sipariş "İşleme Alındı" durumuna getirildi, fatura oluşturuluyor:', {
        orderId: order.id,
        orderNumber: order.order_number,
        status: dbStatus,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status
      })
      
      try {
        const { getBizimHesapInvoiceService, InvoiceType } = await import('@/services/invoice/bizimhesap-invoice-service')
        const invoiceService = getBizimHesapInvoiceService()
        
        // Faturayı oluştur ve sonucu bekle
        invoiceService.createInvoiceFromOrderId(order.id, {
          invoiceType: InvoiceType.SALES,
          createInvoiceRecord: true,
          sendNotification: true
        }).then(result => {
          if (result.success) {
            console.log('✅ Sipariş faturası başarıyla oluşturuldu:', {
              orderNumber: order.order_number,
              paymentMethod: order.payment_method,
              invoiceGuid: result.invoiceGuid
            })
          } else {
            console.error('❌ Sipariş faturası oluşturulamadı:', result.error)
          }
        }).catch(error => {
          console.error('❌ Fatura oluşturma hatası:', error)
        })
        
        console.log('🚀 Fatura işlemi başlatıldı (async)')
      } catch (invoiceError) {
        console.error('❌ Fatura servisi yüklenemedi:', invoiceError)
      }
    } else if (order && dbStatus !== 'PENDING') {
      // Debug: Neden fatura oluşturulmadı?
      console.log('ℹ️ Fatura oluşturulmadı - Durum "İşleme Alındı" değil:', {
        orderNumber: order.order_number,
        currentStatus: dbStatus,
        requiredStatus: 'PENDING'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Sipariş durumu güncellendi',
      order
    })

  } catch (error: any) {
    console.error('Order update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası: ' + (error.message || 'Bilinmeyen hata')
    }, { status: 500 })
  }
} 