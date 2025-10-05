import { NextRequest, NextResponse } from 'next/server'
import { getBizimHesapInvoiceService } from '@/services/invoice/bizimhesap-invoice-service'
import { InvoiceType } from '@catkapinda/bizimhesap-integration'

// POST: Tek sipariş için fatura oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, invoiceType, createRecord = true, sendNotification = true } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Sipariş ID gerekli' },
        { status: 400 }
      )
    }

    const invoiceService = getBizimHesapInvoiceService()

    const result = await invoiceService.createInvoiceFromOrderId(orderId, {
      invoiceType: invoiceType || InvoiceType.SALES,
      createInvoiceRecord: createRecord,
      sendNotification
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Fatura oluşturma API hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Fatura oluşturma hatası' },
      { status: 500 }
    )
  }
}

// PUT: Toplu fatura oluşturma
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderIds, invoiceType, createRecord = true, sendNotification = true } = body

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Sipariş ID listesi gerekli' },
        { status: 400 }
      )
    }

    const invoiceService = getBizimHesapInvoiceService()

    const results = await invoiceService.createInvoicesForOrders(orderIds, {
      invoiceType: invoiceType || InvoiceType.SALES,
      createInvoiceRecord: createRecord,
      sendNotification
    })

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      total: results.length,
      successCount,
      failureCount,
      results
    })

  } catch (error: any) {
    console.error('Toplu fatura oluşturma API hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Toplu fatura oluşturma hatası' },
      { status: 500 }
    )
  }
}

// GET: Bağlantı testi
export async function GET() {
  try {
    const invoiceService = getBizimHesapInvoiceService()
    const result = await invoiceService.testConnection()

    return NextResponse.json({
      connectionTest: result.success,
      error: result.error,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('BizimHesap bağlantı testi hatası:', error)
    return NextResponse.json(
      { 
        connectionTest: false,
        error: error.message || 'Bağlantı testi hatası',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 