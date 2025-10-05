import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { logger } from '@/lib/logger'

/**
 * İyzico Transaction Logger Service
 * Tüm İyzico işlemlerini database'e loglar
 */

export interface TransactionLogData {
  conversationId: string
  orderNumber?: string
  paymentId?: string
  operationType: 'initialize' | 'callback' | 'webhook' | 'test'
  status: 'pending' | 'success' | 'failure' | 'error'
  requestData?: any
  responseData?: any
  errorData?: any
  iyzicoStatus?: string
  iyzicoErrorCode?: string
  iyzicoErrorMessage?: string
  userAgent?: string
  ipAddress?: string
  sessionInfo?: any
  durationMs?: number
}

export interface DebugEventData {
  eventType: 'api_call' | 'auth_generation' | 'parsing_error' | 'validation_error' | '3ds_redirect' | 'callback_processing'
  severity: 'info' | 'warning' | 'error' | 'critical'
  conversationId?: string
  operationContext?: string
  eventData?: any
  errorStack?: string
  environment?: string
  userSessionId?: string
}

export interface ThreeDSSessionData {
  conversationId: string
  orderNumber: string
  status: 'initialized' | 'redirected' | 'completed' | 'failed'
  paymentId?: string
  threeDSHtmlContent?: string
  paymentPageUrl?: string
  customerEmail?: string
  customerPhone?: string
  amount?: number
  currency?: string
  sessionData?: any
  callbackData?: any
}

export class IyzicoLogger {
  private async getSupabase() {
    return await createAdminSupabaseClient()
  }

  /**
   * Transaction log kaydeder
   */
  async logTransaction(data: TransactionLogData): Promise<void> {
    try {
      // Hassas verileri maskele
      let maskedRequestData = data.requestData
      if (maskedRequestData && typeof maskedRequestData === 'object') {
        // Derin kopya oluşturarak orijinal veriyi koru
        maskedRequestData = JSON.parse(JSON.stringify(maskedRequestData))
        if (maskedRequestData.paymentCard) {
          maskedRequestData.paymentCard.cardNumber = '**** **** **** ' + (maskedRequestData.paymentCard.cardNumber?.slice(-4) || '****')
          maskedRequestData.paymentCard.cvc = '***'
        }
      }

      const supabase = await this.getSupabase()
      const { error } = await supabase
        .from('iyzico_transaction_logs')
        .insert({
          conversation_id: data.conversationId,
          order_number: data.orderNumber,
          payment_id: data.paymentId,
          operation_type: data.operationType,
          status: data.status,
          request_data: maskedRequestData, // Maskelenmiş veriyi kaydet
          response_data: data.responseData,
          error_data: data.errorData,
          iyzico_status: data.iyzicoStatus,
          iyzico_error_code: data.iyzicoErrorCode,
          iyzico_error_message: data.iyzicoErrorMessage,
          user_agent: data.userAgent,
          ip_address: data.ipAddress,
          session_info: data.sessionInfo,
          duration_ms: data.durationMs
        })

      if (error) {
        logger.error('❌ Transaction log kaydetme hatası:', { error })
      } else {
        logger.info('✅ Transaction log kaydedildi:', { conversationId: data.conversationId })
      }
    } catch (error: any) {
      logger.error('💥 Transaction log service error:', { error, message: error.message })
    }
  }

  /**
   * Debug event kaydeder
   */
  async logDebugEvent(data: DebugEventData): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      const { error } = await supabase
        .from('iyzico_debug_events')
        .insert({
          event_type: data.eventType,
          severity: data.severity,
          conversation_id: data.conversationId,
          operation_context: data.operationContext,
          event_data: data.eventData,
          error_stack: data.errorStack,
          environment: process.env.NODE_ENV || 'development',
          user_session_id: data.userSessionId
        })

      if (error) {
        logger.error('❌ Debug event kaydetme hatası:', { error })
      } else {
        logger.info(`🔍 Debug event kaydedildi [${data.severity}]:`, { eventType: data.eventType })
      }
    } catch (error: any) {
      logger.error('💥 Debug event service error:', { error, message: error.message })
    }
  }

  /**
   * 3D Secure session kaydeder veya günceller
   */
  async upsert3DSSession(data: ThreeDSSessionData): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      const updateData: any = {
        conversation_id: data.conversationId,
        order_number: data.orderNumber,
        status: data.status,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        amount: data.amount,
        currency: data.currency,
        session_data: data.sessionData
      }

      // Status'e göre timestamp'leri güncelle
      if (data.status === 'redirected') {
        updateData.redirected_at = new Date().toISOString()
      } else if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      // İyzico response data varsa ekle
      if (data.paymentId) updateData.payment_id = data.paymentId
      if (data.threeDSHtmlContent) updateData.three_ds_html_content = data.threeDSHtmlContent
      if (data.paymentPageUrl) updateData.payment_page_url = data.paymentPageUrl
      if (data.callbackData) updateData.callback_data = data.callbackData

      const { error } = await supabase
        .from('iyzico_3ds_sessions')
        .upsert(updateData, {
          onConflict: 'conversation_id'
        })

      if (error) {
        logger.error('❌ 3DS session kaydetme hatası:', { error })
      } else {
        logger.info(`✅ 3DS session kaydedildi [${data.status}]:`, { conversationId: data.conversationId })
      }
    } catch (error: any) {
      logger.error('💥 3DS session service error:', { error, message: error.message })
    }
  }

  /**
   * Callback işlemini loglar
   */
  async logCallback(conversationId: string, callbackData: any): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      // 3DS session'ı güncelle
      await supabase
        .from('iyzico_3ds_sessions')
        .update({
          last_callback_at: new Date().toISOString(),
          callback_data: callbackData,
          status: callbackData.status === 'success' ? 'completed' : 'failed'
        })
        .eq('conversation_id', conversationId)

      // Transaction log ekle
      await this.logTransaction({
        conversationId,
        operationType: 'callback',
        status: callbackData.status === 'success' ? 'success' : 'failure',
        responseData: callbackData,
        iyzicoStatus: callbackData.status,
        iyzicoErrorCode: callbackData.errorCode,
        iyzicoErrorMessage: callbackData.errorMessage
      })

      logger.info('✅ Callback logged:', { conversationId })
    } catch (error: any) {
      logger.error('💥 Callback logging error:', { error, message: error.message })
    }
  }

  /**
   * Webhook işlemini loglar - callbackdocs.md'ye göre
   */
  async logWebhook(conversationId: string, webhookData: any): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      // Webhook log tablosu yoksa transaction log kullan
      await this.logTransaction({
        conversationId,
        operationType: 'webhook',
        status: webhookData.status === 'SUCCESS' ? 'success' : 'failure',
        responseData: webhookData,
        iyzicoStatus: webhookData.status,
        sessionInfo: {
          eventType: webhookData.eventType,
          eventTime: webhookData.eventTime,
          referenceCode: webhookData.referenceCode,
          paymentId: webhookData.paymentId
        }
      })

      logger.info('✅ Webhook logged:', { 
        conversationId, 
        eventType: webhookData.eventType,
        paymentId: webhookData.paymentId 
      })
    } catch (error: any) {
      logger.error('💥 Webhook logging error:', { error, message: error.message })
    }
  }

  /**
   * Transaction geçmişini getirir
   */
  async getTransactionHistory(limit: number = 50): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('iyzico_transaction_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('❌ Transaction history fetch error:', { error })
        return []
      }

      return data || []
    } catch (error: any) {
      logger.error('💥 Transaction history service error:', { error, message: error.message })
      return []
    }
  }

  /**
   * Debug events getirir
   */
  async getDebugEvents(limit: number = 100): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('iyzico_debug_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('❌ Debug events fetch error:', { error })
        return []
      }

      return data || []
    } catch (error: any) {
      logger.error('💥 Debug events service error:', { error, message: error.message })
      return []
    }
  }

  /**
   * Aktif 3DS sessions getirir
   */
  async getActiveSessions(): Promise<any[]> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('iyzico_3ds_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        logger.error('❌ Active sessions fetch error:', { error })
        return []
      }

      return data || []
    } catch (error: any) {
      logger.error('💥 Active sessions service error:', { error, message: error.message })
      return []
    }
  }

  /**
   * Conversation ID ile session getirir
   */
  async getSessionByConversationId(conversationId: string): Promise<any | null> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await supabase
        .from('iyzico_3ds_sessions')
        .select('*')
        .eq('conversation_id', conversationId)
        .single()

      if (error) {
        logger.error('❌ Session fetch error:', { error })
        return null
      }

      return data
    } catch (error: any) {
      logger.error('💥 Session fetch service error:', { error, message: error.message })
      return null
    }
  }
}

// Singleton instance
export const iyzicoLogger = new IyzicoLogger() 