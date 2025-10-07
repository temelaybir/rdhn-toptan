'use server'

import { createClient } from '@/lib/supabase/server'
import type { PromoCode, PromoCodeFormData, PromoCodeFilters, PromoCodeValidation } from '@/types/promo-code'

// Veritabanı snake_case -> TypeScript camelCase dönüşümü
function transformPromoCode(data: any): PromoCode {
  return {
    id: data.id,
    code: data.code,
    description: data.description,
    discountType: data.discount_type,
    discountValue: parseFloat(data.discount_value),
    usageType: data.usage_type,
    maxUses: data.max_uses,
    currentUses: data.current_uses || 0,
    startDate: data.start_date,
    endDate: data.end_date,
    minOrderAmount: parseFloat(data.min_order_amount || 0),
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by
  }
}

/**
 * Promosyon kodlarını listele
 */
export async function getPromoCodes(filters?: PromoCodeFilters) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('promo_codes')
      .select('*', { count: 'exact' })
    
    // Arama
    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    
    // İndirim tipi filtresi
    if (filters?.discountType && filters.discountType !== 'all') {
      query = query.eq('discount_type', filters.discountType)
    }
    
    // Kullanım tipi filtresi
    if (filters?.usageType && filters.usageType !== 'all') {
      query = query.eq('usage_type', filters.usageType)
    }
    
    // Durum filtresi
    if (filters?.status) {
      const now = new Date().toISOString()
      
      switch (filters.status) {
        case 'active':
          query = query
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
          break
        case 'inactive':
          query = query.eq('is_active', false)
          break
        case 'expired':
          query = query
            .eq('is_active', true)
            .not('end_date', 'is', null)
            .lt('end_date', now)
          break
        case 'exhausted':
          query = query
            .eq('is_active', true)
            .not('max_uses', 'is', null)
            .gte('current_uses', 'max_uses')
          break
      }
    }
    
    // Sıralama
    const sortBy = filters?.sortBy || 'createdAt'
    const sortOrder = filters?.sortOrder === 'asc'
    const sortByMapping: Record<string, string> = {
      'createdAt': 'created_at',
      'code': 'code',
      'discountValue': 'discount_value',
      'currentUses': 'current_uses'
    }
    query = query.order(sortByMapping[sortBy], { ascending: sortOrder })
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    const promoCodes = (data || []).map(transformPromoCode)
    
    return {
      success: true,
      data: {
        promoCodes,
        total: count || 0
      }
    }
  } catch (error) {
    console.error('Promosyon kodları getirilirken hata:', error)
    return {
      success: false,
      error: 'Promosyon kodları yüklenirken bir hata oluştu'
    }
  }
}

/**
 * Tek bir promosyon kodunu getir
 */
export async function getPromoCodeById(id: number) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    if (!data) throw new Error('Promosyon kodu bulunamadı')
    
    return {
      success: true,
      data: transformPromoCode(data)
    }
  } catch (error: any) {
    console.error('Promosyon kodu getirilirken hata:', error)
    return {
      success: false,
      error: error.message || 'Promosyon kodu yüklenirken bir hata oluştu'
    }
  }
}

/**
 * Promosyon kodu oluştur
 */
export async function createPromoCode(formData: PromoCodeFormData) {
  try {
    const supabase = await createClient()
    
    // Kod benzersizliği kontrolü
    const { data: existing } = await supabase
      .from('promo_codes')
      .select('id')
      .eq('code', formData.code.toUpperCase())
      .single()
    
    if (existing) {
      return {
        success: false,
        error: 'Bu promosyon kodu zaten mevcut'
      }
    }
    
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discountType,
        discount_value: formData.discountValue,
        usage_type: formData.usageType,
        max_uses: formData.maxUses,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        min_order_amount: formData.minOrderAmount,
        is_active: formData.isActive
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: transformPromoCode(data)
    }
  } catch (error: any) {
    console.error('Promosyon kodu oluşturulurken hata:', error)
    return {
      success: false,
      error: error.message || 'Promosyon kodu oluşturulurken bir hata oluştu'
    }
  }
}

/**
 * Promosyon kodunu güncelle
 */
export async function updatePromoCode(id: number, formData: Partial<PromoCodeFormData>) {
  try {
    const supabase = await createClient()
    
    // Kod değişiyorsa benzersizlik kontrolü
    if (formData.code) {
      const { data: existing } = await supabase
        .from('promo_codes')
        .select('id')
        .eq('code', formData.code.toUpperCase())
        .neq('id', id)
        .single()
      
      if (existing) {
        return {
          success: false,
          error: 'Bu promosyon kodu başka bir kayıtta kullanılıyor'
        }
      }
    }
    
    const updateData: any = {}
    if (formData.code !== undefined) updateData.code = formData.code.toUpperCase()
    if (formData.description !== undefined) updateData.description = formData.description
    if (formData.discountType !== undefined) updateData.discount_type = formData.discountType
    if (formData.discountValue !== undefined) updateData.discount_value = formData.discountValue
    if (formData.usageType !== undefined) updateData.usage_type = formData.usageType
    if (formData.maxUses !== undefined) updateData.max_uses = formData.maxUses
    if (formData.startDate !== undefined) updateData.start_date = formData.startDate || null
    if (formData.endDate !== undefined) updateData.end_date = formData.endDate || null
    if (formData.minOrderAmount !== undefined) updateData.min_order_amount = formData.minOrderAmount
    if (formData.isActive !== undefined) updateData.is_active = formData.isActive
    
    const { data, error } = await supabase
      .from('promo_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      success: true,
      data: transformPromoCode(data)
    }
  } catch (error: any) {
    console.error('Promosyon kodu güncellenirken hata:', error)
    return {
      success: false,
      error: error.message || 'Promosyon kodu güncellenirken bir hata oluştu'
    }
  }
}

/**
 * Promosyon kodunu sil
 */
export async function deletePromoCode(id: number) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return {
      success: true
    }
  } catch (error: any) {
    console.error('Promosyon kodu silinirken hata:', error)
    return {
      success: false,
      error: error.message || 'Promosyon kodu silinirken bir hata oluştu'
    }
  }
}

/**
 * Promosyon kodunu doğrula (Sepet için)
 */
export async function validatePromoCode(
  code: string,
  orderAmount: number,
  userId?: number
): Promise<{ success: boolean; data?: PromoCodeValidation; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Veritabanı fonksiyonunu çağır
    const { data, error } = await supabase
      .rpc('validate_promo_code', {
        p_code: code.toUpperCase(),
        p_order_amount: orderAmount,
        p_user_id: userId || null
      })
    
    if (error) throw error
    
    const result = data?.[0]
    
    if (!result) {
      return {
        success: false,
        error: 'Promosyon kodu doğrulanamadı'
      }
    }
    
    return {
      success: true,
      data: {
        valid: result.valid,
        discountType: result.discount_type,
        discountValue: result.discount_value,
        discountAmount: result.discount_amount,
        errorMessage: result.error_message
      }
    }
  } catch (error: any) {
    console.error('Promosyon kodu doğrulanırken hata:', error)
    return {
      success: false,
      error: error.message || 'Promosyon kodu doğrulanırken bir hata oluştu'
    }
  }
}

/**
 * Promosyon kodunu kullan (Sipariş tamamlandığında)
 */
export async function usePromoCode(
  promoCodeId: number,
  orderId: string,
  discountAmount: number,
  userId?: number
) {
  try {
    const supabase = await createClient()
    
    // Kullanım kaydı oluştur
    const { error: usageError } = await supabase
      .from('promo_code_usage')
      .insert({
        promo_code_id: promoCodeId,
        order_id: orderId,
        user_id: userId || null,
        discount_amount: discountAmount
      })
    
    if (usageError) throw usageError
    
    // current_uses'ı artır
    const { error: updateError } = await supabase
      .rpc('increment_promo_code_usage', { promo_id: promoCodeId })
    
    if (updateError) {
      // Fallback: Manuel artırma
      const { data: current } = await supabase
        .from('promo_codes')
        .select('current_uses')
        .eq('id', promoCodeId)
        .single()
      
      if (current) {
        await supabase
          .from('promo_codes')
          .update({ current_uses: (current.current_uses || 0) + 1 })
          .eq('id', promoCodeId)
      }
    }
    
    return {
      success: true
    }
  } catch (error: any) {
    console.error('Promosyon kodu kullanılırken hata:', error)
    return {
      success: false,
      error: error.message || 'Promosyon kodu kullanılırken bir hata oluştu'
    }
  }
}

/**
 * Promosyon kodu istatistikleri
 */
export async function getPromoCodeStats() {
  try {
    const supabase = await createClient()
    
    const now = new Date().toISOString()
    
    // Toplam kod sayısı
    const { count: totalCodes } = await supabase
      .from('promo_codes')
      .select('*', { count: 'exact', head: true })
    
    // Aktif kodlar
    const { count: activeCodes } = await supabase
      .from('promo_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
    
    // Süresi dolan kodlar
    const { count: expiredCodes } = await supabase
      .from('promo_codes')
      .select('*', { count: 'exact', head: true })
      .not('end_date', 'is', null)
      .lt('end_date', now)
    
    // Toplam kullanım
    const { count: totalUsage } = await supabase
      .from('promo_code_usage')
      .select('*', { count: 'exact', head: true })
    
    // Toplam indirim miktarı
    const { data: discountData } = await supabase
      .from('promo_code_usage')
      .select('discount_amount')
    
    const totalDiscount = discountData?.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0) || 0
    
    return {
      success: true,
      data: {
        totalCodes: totalCodes || 0,
        activeCodes: activeCodes || 0,
        expiredCodes: expiredCodes || 0,
        totalUsage: totalUsage || 0,
        totalDiscount
      }
    }
  } catch (error: any) {
    console.error('İstatistikler getirilirken hata:', error)
    return {
      success: false,
      error: error.message || 'İstatistikler yüklenirken bir hata oluştu'
    }
  }
}
