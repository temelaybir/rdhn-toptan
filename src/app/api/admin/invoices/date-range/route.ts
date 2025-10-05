import { NextRequest, NextResponse } from 'next/server'
import { getBizimHesapInvoiceService } from '@/services/invoice/bizimhesap-invoice-service'
import { InvoiceType } from '@catkapinda/bizimhesap-integration'

// POST: Tarih aralığındaki siparişler için fatura oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      startDate, 
      endDate, 
      invoiceType, 
      createRecord = true, 
      sendNotification = true 
    } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Başlangıç ve bitiş tarihi gerekli' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'Başlangıç tarihi bitiş tarihinden küçük olmalı' },
        { status: 400 }
      )
    }

    // Maksimum 30 günlük süre kontrolü
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 30) {
      return NextResponse.json(
        { error: 'Maksimum 30 günlük süre seçilebilir' },
        { status: 400 }
      )
    }

    const invoiceService = getBizimHesapInvoiceService()

    const results = await invoiceService.createInvoicesForDateRange(start, end, {
      invoiceType: invoiceType || InvoiceType.SALES,
      createInvoiceRecord: createRecord,
      sendNotification
    })

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: diffDays
      },
      total: results.length,
      successCount,
      failureCount,
      results
    })

  } catch (error: any) {
    console.error('Tarih aralığı fatura oluşturma API hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Tarih aralığı fatura oluşturma hatası' },
      { status: 500 }
    )
  }
} 