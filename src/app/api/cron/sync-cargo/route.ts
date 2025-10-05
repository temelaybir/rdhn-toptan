import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CargoNotificationService } from '../../../../../packages/aras-cargo-integration/src/cargo-notification-service'
import { ArasCargoService } from '../../../../../packages/aras-cargo-integration/src/aras-cargo-service'
import type { PendingCargoOrder, CargoStatusUpdate } from '@/types/order'

// GET: Scheduled cron job (called by Vercel Cron)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron job attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Starting cargo sync cron job...')

         // Get pending cargo orders
     const supabase = await createClient()
         const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        billing_address,
        shipping_address,
        kargo_barcode,
        kargo_firma,
        kargo_sonuc,
        kargo_takipno,
        kargo_url,
        total_amount,
        created_at,
        updated_at
      `)
       .not('kargo_barcode', 'is', null)
       .neq('kargo_sonuc', 'Teslim Edildi')
       .order('created_at', { ascending: false })
       .limit(50) // Limit for safety

    if (error) {
      console.error('❌ Failed to fetch pending orders:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`📦 Found ${orders.length} pending orders`)

    let processedOrders = 0
    let updatedOrders = 0
    const errors: string[] = []

         // Process each order
     for (const order of orders as PendingCargoOrder[]) {
      try {
        processedOrders++
        console.log(`🔍 Processing order ${order.order_number} with barcode: ${order.kargo_barcode}`)

        // Query Aras Kargo for status
        const cargoStatus = await queryArasCargoStatus(order.kargo_barcode!)

        if (cargoStatus && cargoStatus.status) {
          // Check if status has changed
          if (cargoStatus.status !== order.kargo_sonuc) {
            console.log(`📈 Status change for ${order.order_number}: ${order.kargo_sonuc} → ${cargoStatus.status}`)

            // Update database
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                kargo_sonuc: cargoStatus.status,
                kargo_takipno: cargoStatus.trackingNumber || order.kargo_takipno,
                kargo_url: cargoStatus.trackingUrl || order.kargo_url
              })
              .eq('id', order.id)

            if (updateError) {
              errors.push(`Failed to update order ${order.order_number}: ${updateError.message}`)
              continue
            }

            updatedOrders++

            // Send email notification if tracking info is available
            if (cargoStatus.trackingUrl) {
              console.log(`📧 Sending notification for order ${order.order_number}`)
              
              // Extract customer name from billing_address or use email
              const billingAddress = order.billing_address as any
              const customerName = billingAddress?.fullName || 
                                 billingAddress?.firstName + ' ' + billingAddress?.lastName ||
                                 order.email?.split('@')[0] || 'Müşteri'
              
              // Prepare order data for notification service
              const orderForNotification = {
                ...order,
                customer_name: customerName,
                customer_email: order.email
              }
              
              const emailStatus = {
                ...cargoStatus,
                trackingNumber: cargoStatus.trackingNumber || undefined,
                trackingUrl: cargoStatus.trackingUrl || undefined
              }
              
              await CargoNotificationService.sendCargoUpdateEmail(orderForNotification, emailStatus)
            }

            // If delivered, log completion
            if (isDeliveredStatus(cargoStatus.status)) {
              console.log(`✅ Order ${order.order_number} has been delivered`)
            }
          } else {
            console.log(`🔄 No status change for ${order.order_number}`)
          }
        } else {
          console.log(`⚠️ No cargo status found for ${order.order_number}`)
        }

        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        const errorMsg = `Error processing order ${order.order_number}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('❌', errorMsg)
        errors.push(errorMsg)
      }
    }

    const duration = Date.now() - startTime
    const result = {
      processedOrders,
      updatedOrders,
      errors,
      duration,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Cargo sync completed:', result)

    return NextResponse.json({
      success: true,
      message: `Cargo sync completed. Processed: ${processedOrders}, Updated: ${updatedOrders}`,
      result
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('💥 Cargo sync cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST: Manual trigger for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual cargo sync triggered')
    
    // Create a Request object with the proper authorization header
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    const cronRequest = new Request(request.url, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${cronSecret}`
      }
    })

    // Call the GET handler directly
    return await GET(cronRequest as NextRequest)

  } catch (error) {
    console.error('❌ Manual sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Updated function to use new ArasCargoService
async function queryArasCargoStatus(barcode: string): Promise<CargoStatusUpdate | null> {
  try {
    const serviceUrl = process.env.ARAS_CARGO_SERVICE_URL
    const username = process.env.ARAS_CARGO_USERNAME
    const password = process.env.ARAS_CARGO_PASSWORD
    const customerCode = process.env.ARAS_CARGO_CUSTOMER_CODE

    if (!serviceUrl || !username || !password || !customerCode) {
      console.error('❌ Missing Aras Kargo configuration')
      return null
    }

    const arasService = new ArasCargoService({
      serviceUrl,
      username,
      password,
      customerCode
    })

    // Use the new GetCargoInfo method
    const response = await arasService.queryCargoStatus(barcode)

    if (!response.success || !response.data) {
      console.log(`⚠️ No cargo info found for barcode: ${barcode}`)
      return null
    }

    // Parse the GetCargoInfo response
    const cargoInfo = parseGetCargoInfoResponse(response.data, barcode)

    if (cargoInfo) {
      // Generate tracking URLs
      const trackingUrls = arasService.generateTrackingUrls(
        cargoInfo.trackingNumber || barcode,
        barcode
      )

      return {
        status: cargoInfo.status,
        trackingNumber: cargoInfo.trackingNumber,
        trackingUrl: trackingUrls.byTrackingNumber,
        lastUpdate: new Date().toISOString()
      }
    }

    return null

  } catch (error) {
    console.error(`❌ Error querying cargo status for ${barcode}:`, error)
    return null
  }
}

// Updated parser for GetCargoInfo response
function parseGetCargoInfoResponse(responseText: string, barcode: string): { status: string; trackingNumber?: string } | null {
  try {
    console.log(`🔍 Parsing GetCargoInfo response for barcode: ${barcode}`)

    // Look for GetCargoInfoResult
    const resultMatch = responseText.match(/<GetCargoInfoResult>([\s\S]*?)<\/GetCargoInfoResult>/)
    if (!resultMatch) {
      console.log('❌ No GetCargoInfoResult found in response')
      return null
    }

    const resultContent = resultMatch[1]

    // Extract status information
    const statusMatch = resultContent.match(/<Status>(.*?)<\/Status>/) || 
                       resultContent.match(/<CargoStatus>(.*?)<\/CargoStatus>/) ||
                       resultContent.match(/<Durum>(.*?)<\/Durum>/)

    const trackingMatch = resultContent.match(/<TrackingNumber>(.*?)<\/TrackingNumber>/) ||
                         resultContent.match(/<TakipNo>(.*?)<\/TakipNo>/) ||
                         resultContent.match(/<WaybillNumber>(.*?)<\/WaybillNumber>/)

    if (statusMatch) {
      return {
        status: statusMatch[1],
        trackingNumber: trackingMatch?.[1]
      }
    }

    console.log('❌ No status information found in GetCargoInfo response')
    return null

  } catch (error) {
    console.error('❌ Error parsing GetCargoInfo response:', error)
    return null
  }
}

// Helper function to check if status indicates delivery
function isDeliveredStatus(status: string): boolean {
  const deliveredStatuses = [
    'Teslim Edildi',
    'Delivered',
    'Teslim',
    'Teslim Alındı'
  ]
  
  return deliveredStatuses.some(deliveredStatus => 
    status.toLowerCase().includes(deliveredStatus.toLowerCase())
  )
} 