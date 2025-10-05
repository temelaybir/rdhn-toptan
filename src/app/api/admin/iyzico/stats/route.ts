import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

// Node.js runtime gerekli (admin işlemleri için)
export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('🔍 İyzico stats request started')
    const supabase = await createAdminSupabaseClient()

    // İyzico istatistiklerini getir
    const [transactionsResult, refundsResult, settingsResult] = await Promise.all([
      // Ödeme işlemleri istatistikleri
      supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // İade işlemleri istatistikleri  
      supabase
        .from('payment_refunds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
        
      // İyzico ayarları
      supabase
        .from('iyzico_settings')
        .select('*')
        .single()
    ])

    // İstatistikleri hesapla
    const transactions = transactionsResult.data || []
    const refunds = refundsResult.data || []
    const settings = settingsResult.data

    console.log('📊 Stats calculated:', {
      transactions: transactions.length,
      refunds: refunds.length,
      hasSettings: !!settings
    })

    const stats = {
      // Genel istatistikler
      total_transactions: transactions.length,
      successful_transactions: transactions.filter(t => t.status === 'SUCCESS').length,
      failed_transactions: transactions.filter(t => t.status === 'FAILURE').length,
      pending_transactions: transactions.filter(t => t.status === 'PENDING').length,
      
      // Toplam tutarlar
      total_amount: transactions
        .filter(t => t.status === 'SUCCESS')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
      
      total_refunded: refunds
        .filter(r => r.status === 'SUCCESS')
        .reduce((sum, r) => sum + parseFloat(r.refund_amount || '0'), 0),
      
      // İade istatistikleri
      total_refunds: refunds.length,
      successful_refunds: refunds.filter(r => r.status === 'SUCCESS').length,
      pending_refunds: refunds.filter(r => r.status === 'PENDING').length,
      
      // Sistem durumu
      iyzico_active: settings?.is_active || false,
      test_mode: settings?.test_mode || true,
      
      // Son işlemler
      recent_transactions: transactions.slice(0, 10),
      recent_refunds: refunds.slice(0, 5)
    }

    console.log('✅ İyzico stats fetched successfully')
    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error: any) {
    console.error('İyzico stats error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'İstatistik verileri alınırken hata oluştu'
    }, { status: 500 })
  }
} 