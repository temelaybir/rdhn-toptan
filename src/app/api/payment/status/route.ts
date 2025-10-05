import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route is dynamic and doesn't require static rendering
export const dynamic = 'force-dynamic'

/**
 * GET - Check payment status for polling
 * Used by the waiting page to check if payment is complete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const orderNumber = searchParams.get('orderNumber')

    if (!conversationId && !orderNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing conversation ID or order number'
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get transaction by conversation ID or order number
    let query = supabase
      .from('payment_transactions')
      .select('*')
      .single()

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber)
    }

    const { data: transaction, error } = await query

    if (error || !transaction) {
      console.log('Transaction not found:', { conversationId, orderNumber, error })
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 })
    }

    console.log('Payment status check:', {
      orderNumber: transaction.order_number,
      status: transaction.status,
      conversationId: transaction.conversation_id
    })

    // Check transaction status
    switch (transaction.status) {
      case 'SUCCESS':
      case 'COMPLETED':
        return NextResponse.json({
          success: true,
          data: {
            status: 'SUCCESS',
            orderNumber: transaction.order_number,
            payment_id: transaction.payment_id,
            iyzico_payment_id: transaction.iyzico_payment_id || transaction.payment_id,
            error_code: null,
            error_message: null
          },
          message: 'Payment completed successfully'
        })

      case 'FAILED':
      case 'CANCELLED':
        return NextResponse.json({
          success: true,
          data: {
            status: 'FAILURE',
            orderNumber: transaction.order_number,
            payment_id: transaction.payment_id,
            iyzico_payment_id: transaction.iyzico_payment_id,
            error_code: transaction.error_code || 'PAYMENT_FAILED',
            error_message: transaction.error_message || 'Payment failed'
          },
          message: 'Payment failed'
        })

      case 'PENDING':
        // Check if it's still in 3DS process or waiting for callback
        if (transaction.notes?.includes('3DS başlatıldı')) {
          return NextResponse.json({
            success: true,
            data: {
              status: 'PENDING',
              orderNumber: transaction.order_number,
              payment_id: transaction.payment_id,
              iyzico_payment_id: transaction.iyzico_payment_id,
              error_code: null,
              error_message: null
            },
            message: '3DS verification in progress'
          })
        } else {
          return NextResponse.json({
            success: true,
            data: {
              status: 'PENDING',
              orderNumber: transaction.order_number,
              payment_id: transaction.payment_id,
              iyzico_payment_id: transaction.iyzico_payment_id,
              error_code: null,
              error_message: null
            },
            message: 'Payment processing'
          })
        }

      default:
        return NextResponse.json({
          success: true,
          data: {
            status: 'PENDING',
            orderNumber: transaction.order_number,
            payment_id: transaction.payment_id,
            iyzico_payment_id: transaction.iyzico_payment_id,
            error_code: null,
            error_message: null
          },
          message: 'Payment status unknown, still processing'
        })
    }

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 