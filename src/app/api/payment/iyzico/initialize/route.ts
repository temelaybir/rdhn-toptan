import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createIyzicoService, getIyzicoSettingsFromEnv } from '@/services/payment/iyzico-service'
import { CreatePaymentRequest } from '@/types/iyzico'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Validation schema
const paymentRequestSchema = z.object({
  orderNumber: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']).default('TRY'),
  installment: z.number().min(1).max(12).default(1),
  userId: z.string().optional(),
  basketItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number().positive()
  })).min(1),
  buyer: z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    identityNumber: z.string().min(11).max(11),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default('Turkey'),
    zipCode: z.string().optional()
  }),
  billingAddress: z.object({
    contactName: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default('Turkey'),
    zipCode: z.string().optional()
  }),
  shippingAddress: z.object({
    contactName: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default('Turkey'),
    zipCode: z.string().optional()
  }),
  card: z.object({
    cardHolderName: z.string().min(1),
    cardNumber: z.string().min(16).max(19),
    expireMonth: z.string().length(2),
    expireYear: z.string().length(4),
    cvc: z.string().min(3).max(4),
    saveCard: z.boolean().default(false),
    cardAlias: z.string().optional()
  })
})

/**
 * Parse cart item ID to extract product ID
 * Cart ID format: cart_${productId}_${variantId}_${timestamp}_${random}
 */
function parseCartItemId(cartItemId: string): string | number | null {
  try {
    // UUID pattern check (ÖNCE UUID kontrol et!)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    // If it's a valid UUID, return it directly
    if (uuidPattern.test(cartItemId)) {
      return cartItemId
    }
    
    // Check if it's a cart ID format
    if (cartItemId.startsWith('cart_')) {
      const parts = cartItemId.split('_')
      if (parts.length >= 2) {
        const productIdPart = parts[1]
        
        // Check if the product part is a UUID
        if (uuidPattern.test(productIdPart)) {
          return productIdPart
        }
        
        // Try to parse as number (legacy ID) - only if it's ONLY digits
        if (/^\d+$/.test(productIdPart)) {
          const legacyId = parseInt(productIdPart, 10)
          if (!isNaN(legacyId) && legacyId > 0) {
            return legacyId
          }
        }
        
        // Otherwise return as string
        return productIdPart
      }
    }
    
    // If not cart ID format, check if it's ONLY digits (legacy integer ID)
    if (/^\d+$/.test(cartItemId)) {
      const numericId = parseInt(cartItemId, 10)
      if (!isNaN(numericId) && numericId > 0) {
        return numericId
      }
    }
    
    // Return null if nothing matched
    return null
  } catch (error) {
    logger.error('Error parsing cart item ID:', { cartItemId, error })
    return null
  }
}

/**
 * 🔒 SECURITY: Validate basket item prices against database
 */
async function validateBasketPrices(
  supabase: any, 
  basketItems: Array<{id: string, name: string, category: string, price: number}>
): Promise<{isValid: boolean, message?: string, validatedItems?: any[], calculatedTotal?: number}> {
  try {
    logger.info('🔒 [SECURITY] Starting price validation for basket items', { 
      itemCount: basketItems.length,
      items: basketItems.map(item => ({ id: item.id, clientPrice: item.price }))
    })

    const validatedItems = []
    let calculatedTotal = 0

    for (const item of basketItems) {
      // Parse cart item ID to get actual product ID
      const actualProductId = parseCartItemId(item.id)
      
      if (!actualProductId) {
        logger.error('🚨 [SECURITY_BREACH] Invalid cart item ID format!', {
          cartItemId: item.id,
          itemName: item.name,
          clientPrice: item.price
        })
        return {
          isValid: false,
          message: `Geçersiz ürün ID formatı: ${item.id}`
        }
      }

      logger.info('🔍 [SECURITY] Parsed product ID from cart item', {
        cartItemId: item.id,
        actualProductId: actualProductId,
        productIdType: typeof actualProductId
      })

      // Find product by the actual product ID
      let product = null
      
      if (typeof actualProductId === 'number') {
        // Legacy integer ID - Kullanıcı eski cart data'sı kullanıyor
        logger.warn('⚠️ Legacy integer product ID detected - user needs to clear cart', {
          actualProductId,
          cartItemId: item.id
        })
        
        // Try to find by ID directly (some DBs might have integer IDs)
        const { data: legacyProduct, error: legacyError } = await supabase
          .from('products')
          .select('id, name, price')
          .eq('id', actualProductId.toString()) // Try as string UUID conversion
          .maybeSingle()
        
        if (legacyError) {
          logger.error('❌ Legacy ID query error:', legacyError)
        }
        
        product = legacyProduct
        
        // If not found, user has old cart data with invalid IDs
        if (!product) {
          return {
            isValid: false,
            message: `❌ ESKI SEPET VERİSİ HATASI\n\nSepetinizde eski ürün bilgileri var. Lütfen:\n1. Sepeti temizleyin\n2. Ürünleri yeniden ekleyin\n3. Tekrar deneyin\n\n(Hata: Ürün ID ${actualProductId} veritabanında bulunamadı)`
          }
        }
      } else {
        // UUID lookup
        const { data: uuidProduct, error: uuidError } = await supabase
          .from('products')
          .select('id, name, price')
          .eq('id', actualProductId)
          .maybeSingle()
        
        if (uuidError) {
          logger.error('❌ UUID query error:', uuidError)
        }
        
        product = uuidProduct
      }

      if (!product) {
        logger.error('🚨 [SECURITY_BREACH] Product not found in database!', {
          cartItemId: item.id,
          actualProductId: actualProductId,
          itemName: item.name,
          clientPrice: item.price
        })
        return {
          isValid: false,
          message: `❌ ÜRÜN BULUNAMADI\n\nSepetinizdeki "${item.name}" ürünü veritabanında bulunamadı.\n\nLütfen:\n1. Sepeti temizleyin\n2. Ürünü yeniden ekleyin\n3. Tekrar deneyin`
        }
      }

      // 🔒 CRITICAL: Price validation
      const dbPrice = parseFloat(product.price)
      const clientPrice = parseFloat(item.price)
      const priceDifference = Math.abs(dbPrice - clientPrice)
      const tolerancePercentage = 0.01 // 1% tolerance for floating point errors

      if (priceDifference > (dbPrice * tolerancePercentage)) {
        logger.error('🚨 [SECURITY_BREACH] Price manipulation detected!', {
          productId: product.id,
          productName: product.name,
          dbPrice: dbPrice,
          clientPrice: clientPrice,
          difference: priceDifference,
          toleranceThreshold: dbPrice * tolerancePercentage
        })
        return {
          isValid: false,
          message: `Fiyat manipülasyonu tespit edildi! Ürün: ${product.name}. Gerçek fiyat: ${dbPrice} TL, Gönderilen: ${clientPrice} TL`
        }
      }

      // Use database price, not client price!
      validatedItems.push({
        id: product.id,
        name: product.name,
        category: item.category,
        price: dbPrice // 🔒 Use REAL price from database
      })
      
      calculatedTotal += dbPrice

      logger.info('✅ [SECURITY] Item price validated', {
        productId: product.id,
        productName: product.name,
        validatedPrice: dbPrice
      })
    }

    logger.info('✅ [SECURITY] All basket items validated successfully', {
      itemCount: validatedItems.length,
      calculatedTotal: calculatedTotal
    })

    return {
      isValid: true,
      validatedItems: validatedItems,
      calculatedTotal: calculatedTotal
    }

  } catch (error) {
    logger.error('💥 [SECURITY] Price validation error:', error)
    return {
      isValid: false,
      message: 'Fiyat doğrulama sırasında hata oluştu'
    }
  }
}

/**
 * POST - İyzico 3D Secure ödeme başlatır
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.info('🚀 API /payment/iyzico/initialize çağrısı başladı')

  try {
    const body = await request.json()
    logger.info('📦 Request body alındı', { body: Object.keys(body) })
    
    // Validation
    const validationResult = paymentRequestSchema.safeParse(body)
    if (!validationResult.success) {
      logger.error('❌ Payment request validation error:', {
        errors: validationResult.error.errors,
        receivedData: body
      })
      return NextResponse.json({
        success: false,
        error: 'Geçersiz veri formatı',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const paymentRequest: CreatePaymentRequest = validationResult.data
    logger.info('✅ Request verisi doğrulandı', { orderNumber: paymentRequest.orderNumber })

    const supabase = await createSupabaseServerClient()
    logger.info('🔧 Supabase client oluşturuldu')

    // 🔒 SECURITY: Validate basket item prices against database
    const priceValidation = await validateBasketPrices(supabase, paymentRequest.basketItems)
    
    if (!priceValidation.isValid) {
      logger.error('🚨 [SECURITY_BREACH] Price validation failed!', {
        error: priceValidation.message,
        orderNumber: paymentRequest.orderNumber,
        clientBasket: paymentRequest.basketItems
      })
      return NextResponse.json({
        success: false,
        error: 'Güvenlik kontrolü başarısız: ' + priceValidation.message
      }, { status: 400 })
    }

    // 🔒 SECURITY: Use validated prices and calculated total
    paymentRequest.basketItems = priceValidation.validatedItems!
    const validatedTotal = priceValidation.calculatedTotal!
    
    // 🔒 SECURITY: Check if client sent correct total
    const clientTotal = paymentRequest.amount
    const totalDifference = Math.abs(validatedTotal - clientTotal)
    
    if (totalDifference > 0.01) { // 1 kuruş tolerance
      logger.error('🚨 [SECURITY_BREACH] Total amount manipulation detected!', {
        validatedTotal: validatedTotal,
        clientTotal: clientTotal,
        difference: totalDifference,
        orderNumber: paymentRequest.orderNumber
      })
      return NextResponse.json({
        success: false,
        error: `Toplam tutar manipülasyonu tespit edildi! Gerçek tutar: ${validatedTotal.toFixed(2)} TL, Gönderilen: ${clientTotal.toFixed(2)} TL`
      }, { status: 400 })
    }

    // 🔒 Force use validated total
    paymentRequest.amount = validatedTotal
    
    logger.info('✅ [SECURITY] Price validation passed', {
      validatedTotal: validatedTotal,
      itemCount: paymentRequest.basketItems.length
    })

    // İyzico ayarlarını getir
    const settings = getIyzicoSettingsFromEnv()

    if (!settings) {
      logger.error('❌ İyzico ayarları bulunamadı (getIyzicoSettingsFromEnv)')
      return NextResponse.json({
        success: false,
        error: 'İyzico ödeme sistemi aktif değil'
      }, { status: 503 })
    }
    logger.info('✅ İyzico ayarları başarıyla yüklendi')

    // Callback URL'i ve ek bilgileri ayarla
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    paymentRequest.callbackUrl = `${baseUrl}/api/payment/iyzico/callback`
    paymentRequest.ipAddress = request.ip || '127.0.0.1'
    paymentRequest.userAgent = request.headers.get('user-agent') || 'Unknown'
    logger.info('🔧 Callback URL ve ek bilgiler ayarlandı', {
      callbackUrl: paymentRequest.callbackUrl,
      ipAddress: paymentRequest.ipAddress
    })

    // İyzico service oluştur
    const iyzicoService = createIyzicoService(settings)
    logger.info('🔧 IyzicoService instance oluşturuldu')

    // Ödeme işlemini başlat
    logger.info('⏳ Ödeme işlemi başlatılıyor...', { orderNumber: paymentRequest.orderNumber })
    const paymentResult = await iyzicoService.initiate3DSecurePayment(paymentRequest)
    logger.info('🏁 Ödeme işlemi tamamlandı', {
      success: paymentResult.success,
      conversationId: paymentResult.conversationId
    })

    // Database'e transaction kaydı oluştur
    if (paymentResult.success) {
      try {
                 // Payment transactions tablosuna asıl transaction kaydını oluştur
         const { error: transactionError } = await supabase
           .from('payment_transactions')
           .insert({
             order_number: paymentRequest.orderNumber,
             conversation_id: paymentResult.conversationId,
             status: 'PENDING',
             amount: paymentRequest.amount,
             paid_price: paymentRequest.amount,
             currency: paymentRequest.currency || 'TRY',
             installment: paymentRequest.installment || 1,
             payment_channel: 'WEB',
             payment_group: 'PRODUCT',
             payment_source: 'IYZICO_3DS',
             is_3d_secure: true,
             iyzico_payment_id: paymentResult.paymentId
           })

        if (transactionError) {
          logger.error('❌ Payment transaction kaydetme hatası:', { 
            error: transactionError,
            orderNumber: paymentRequest.orderNumber,
            conversationId: paymentResult.conversationId
          })
        } else {
          logger.info('✅ Payment transaction kaydedildi:', { 
            orderNumber: paymentRequest.orderNumber,
            conversationId: paymentResult.conversationId,
            status: 'PENDING'
          })
        }

        // ⚠️ NOT: Order zaten /api/orders route'unda oluşturuldu
        // Burada sadece payment transaction kaydediyoruz, order kaydı oluşturmuyoruz
        // Aksi halde duplicate order kayıtları oluşur!
        
        logger.info('ℹ️ Order zaten oluşturuldu, sadece payment transaction kaydedildi:', { 
          orderNumber: paymentRequest.orderNumber,
          conversationId: paymentResult.conversationId
        })
      } catch (transactionError) {
        logger.error('💥 Payment transaction create error:', { 
          error: transactionError, 
          orderNumber: paymentRequest.orderNumber 
        })
      }
    }

    if (paymentResult.success) {
      logger.info('✅ Ödeme başlatma başarılı, 3DS HTML gönderiliyor', {
        paymentId: paymentResult.paymentId,
        conversationId: paymentResult.conversationId,
      })
      return NextResponse.json({
        success: true,
        data: {
          paymentId: paymentResult.paymentId,
          conversationId: paymentResult.conversationId,
          htmlContent: paymentResult.htmlContent,
          threeDSHtmlContent: paymentResult.threeDSHtmlContent
        }
      })
    } else {
      logger.error('❌ Ödeme başlatma başarısız', {
        error: paymentResult.errorMessage,
        errorCode: paymentResult.errorCode,
        conversationId: paymentResult.conversationId
      })
      return NextResponse.json({
        success: false,
        error: paymentResult.errorMessage || 'Ödeme başlatılamadı',
        errorCode: paymentResult.errorCode
      }, { status: 400 })
    }

  } catch (error: any) {
    logger.error('💥 API /payment/iyzico/initialize içinde beklenmedik hata', {
      message: error.message,
      stack: error.stack,
      error
    })

    return NextResponse.json({
      success: false,
      error: 'Sunucu tarafında beklenmeyen bir hata oluştu.'
    }, { status: 500 })
  } finally {
    const duration = Date.now() - startTime
    logger.info(`🔚 API /payment/iyzico/initialize çağrısı tamamlandı. Süre: ${duration}ms`)
  }
} 