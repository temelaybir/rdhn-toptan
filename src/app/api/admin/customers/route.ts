import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

interface CustomerOrder {
  id: string
  orderNumber: string
  date: string
  total: number
  status: string
  items: number
}

interface Customer {
  id: string
  email: string
  name: string
  phone: string
  registrationDate: string
  lastOrder: string
  totalOrders: number
  totalSpent: number
  status: string
  address?: {
    fullName: string
    address: string
    city: string
    district: string
    postalCode: string
  }
  orders?: CustomerOrder[]
}

interface CustomerStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  totalRevenue: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const supabase = await createAdminSupabaseClient()

    // Base query for customers (from orders table)
    let query = supabase
      .from('orders')
      .select(`
        email,
        phone,
        billing_address,
        shipping_address,
        created_at,
        total_amount,
        status,
        order_number
      `)
      .not('email', 'is', null)
      .range(page * limit, (page + 1) * limit - 1)

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply status filter (active = has recent orders, inactive = no recent orders)
    if (status === 'active') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('created_at', thirtyDaysAgo.toISOString())
    } else if (status === 'inactive') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.lt('created_at', thirtyDaysAgo.toISOString())
    }

    const { data: ordersData, error, count } = await query

    if (error) {
      console.error('Customers query error:', error)
      throw error
    }

    // Group orders by customer (email)
    const customerMap = new Map<string, any[]>()
    
    ordersData?.forEach(order => {
      const email = order.email
      if (!customerMap.has(email)) {
        customerMap.set(email, [])
      }
      customerMap.get(email)!.push(order)
    })

    // Transform to customer objects
    const customers: Customer[] = Array.from(customerMap.entries()).map(([email, orders]) => {
      const firstOrder = orders[0]
      const lastOrder = orders[orders.length - 1]
      const totalSpent = orders
        .filter(order => order.status === 'DELIVERED')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0)
      
      const customerName = extractCustomerName(
        firstOrder.billing_address,
        firstOrder.shipping_address,
        email
      )

      const customerOrders: CustomerOrder[] = orders.slice(0, 5).map(order => ({
        id: order.order_number,
        orderNumber: order.order_number,
        date: order.created_at,
        total: parseFloat(order.total_amount || '0'),
        status: mapDatabaseStatusToFrontend(order.status),
        items: 1 // Simplified for now
      }))

      return {
        id: email, // Use email as ID
        email,
        name: customerName,
        phone: firstOrder.phone || '',
        registrationDate: firstOrder.created_at,
        lastOrder: lastOrder.created_at,
        totalOrders: orders.length,
        totalSpent,
        status: orders.some(order => {
          const orderDate = new Date(order.created_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return orderDate >= thirtyDaysAgo
        }) ? 'active' : 'inactive',
        address: firstOrder.shipping_address || firstOrder.billing_address,
        orders: customerOrders
      }
    })

    // Calculate statistics
    const allOrders = await supabase
      .from('orders')
      .select('email, created_at, total_amount, status')
      .not('email', 'is', null)

    const allCustomersMap = new Map<string, any[]>()
    allOrders.data?.forEach(order => {
      const email = order.email
      if (!allCustomersMap.has(email)) {
        allCustomersMap.set(email, [])
      }
      allCustomersMap.get(email)!.push(order)
    })

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const stats: CustomerStats = {
      total: allCustomersMap.size,
      active: 0,
      inactive: 0,
      newThisMonth: 0,
      totalRevenue: 0
    }

    allCustomersMap.forEach((orders, email) => {
      const hasRecentOrders = orders.some(order => {
        const orderDate = new Date(order.created_at)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return orderDate >= thirtyDaysAgo
      })

      if (hasRecentOrders) {
        stats.active++
      } else {
        stats.inactive++
      }

      // Check if customer registered this month
      const firstOrder = orders[0]
      if (new Date(firstOrder.created_at) >= currentMonth) {
        stats.newThisMonth++
      }

      // Calculate total revenue from delivered orders
      const customerRevenue = orders
        .filter(order => order.status === 'DELIVERED')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0)
      stats.totalRevenue += customerRevenue
    })

    return NextResponse.json({
      success: true,
      data: {
        customers,
        stats,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Customers API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Müşteri verileri alınamadı: ' + (error.message || 'Bilinmeyen hata')
    }, { status: 500 })
  }
}

// Helper functions
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