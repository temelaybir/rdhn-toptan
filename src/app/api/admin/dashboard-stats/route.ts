import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-api-auth'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  activeProducts: number
  outOfStockProducts: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  monthlyGrowth: {
    revenue: number
    orders: number
    customers: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminSupabaseClient()

    // 1. Toplam gelir (teslim edilen siparişlerden)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'DELIVERED')

    const totalRevenue = revenueData?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || '0'), 0) || 0

    // 2. Toplam sipariş sayısı
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // 3. Toplam müşteri sayısı (unique email'ler)
    const { data: customersData } = await supabase
      .from('orders')
      .select('email')
      .not('email', 'is', null)

    const uniqueCustomers = new Set(customersData?.map(order => order.email) || []).size

    // 4. Aktif ürün sayısı
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // 5. Stokta olmayan ürün sayısı
    const { count: outOfStockProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('stock', 0)

    // 6. Son 5 sipariş
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        total_amount,
        status,
        created_at,
        billing_address,
        shipping_address
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const formattedRecentOrders = recentOrders?.map(order => {
      const customerName = extractCustomerName(
        order.billing_address, 
        order.shipping_address, 
        order.email
      )
      
      return {
        id: order.id,
        orderNumber: order.order_number,
        customerName,
        totalAmount: parseFloat(order.total_amount || '0'),
        status: mapDatabaseStatusToFrontend(order.status),
        createdAt: order.created_at
      }
    }) || []

    // 7. Aylık büyüme hesaplama (basit hesaplama)
    const currentMonth = new Date().getMonth()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    
    const { data: currentMonthOrders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', new Date(new Date().getFullYear(), currentMonth, 1).toISOString())
      .lt('created_at', new Date(new Date().getFullYear(), currentMonth + 1, 1).toISOString())

    const { data: lastMonthOrders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', new Date(new Date().getFullYear(), lastMonth, 1).toISOString())
      .lt('created_at', new Date(new Date().getFullYear(), lastMonth + 1, 1).toISOString())

    const currentMonthRevenue = currentMonthOrders?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || '0'), 0) || 0
    const lastMonthRevenue = lastMonthOrders?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || '0'), 0) || 0

    const monthlyGrowth = {
      revenue: lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
      orders: lastMonthOrders?.length || 0 > 0 ? 
        ((currentMonthOrders?.length || 0) - (lastMonthOrders?.length || 0)) / (lastMonthOrders?.length || 1) * 100 : 0,
      customers: 0 // Basitlik için şimdilik 0
    }

    const stats: DashboardStats = {
      totalRevenue,
      totalOrders: totalOrders || 0,
      totalCustomers: uniqueCustomers,
      activeProducts: activeProducts || 0,
      outOfStockProducts: outOfStockProducts || 0,
      recentOrders: formattedRecentOrders,
      monthlyGrowth
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Dashboard istatistikleri alınamadı: ' + (error.message || 'Bilinmeyen hata')
    }, { status: 500 })
  }
}

// Helper functions from orders API
function mapDatabaseStatusToFrontend(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'PAID': 'paid',
    'CONFIRMED': 'confirmed',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'AWAITING_PAYMENT': 'awaiting_payment'
  }
  return statusMap[dbStatus] || 'pending'
}

function extractCustomerName(billingAddress: any, shippingAddress: any, email: string): string {
  if (billingAddress?.fullName) {
    return billingAddress.fullName
  }
  
  if (shippingAddress?.fullName) {
    return shippingAddress.fullName
  }
  
  if (email) {
    return email.split('@')[0] // Email'den kullanıcı adını al
  }
  
  return 'Misafir Kullanıcı'
} 