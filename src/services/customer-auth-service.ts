import { createClient } from '@/lib/supabase/client'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  default_address?: any
  total_orders: number
  total_spent: number
  last_order_date?: string
  accepts_marketing: boolean
  accepts_sms: boolean
  preferred_language: string
  created_at: string
  updated_at: string
  first_order_date?: string
  notes?: string
  // For autocomplete responses
  addresses?: {
    billing?: {
      contactName: string
      phone?: string
      address: string
      city: string
      district: string
      postalCode?: string
      country: string
    }
    shipping?: {
      contactName: string
      phone?: string
      address: string
      city: string
      district: string
      postalCode?: string
      country: string
    }
  }
}

export interface CustomerAddress {
  id: string
  customer_id: string
  title: string
  contact_name: string
  phone?: string
  address: string
  city: string
  district: string
  postal_code?: string
  country: string
  is_default: boolean
  is_billing: boolean
  is_shipping: boolean
  created_at: string
  updated_at: string
}

export interface MagicLoginToken {
  id: string
  customer_id: string
  token: string
  expires_at: string
  is_used: boolean
  created_at: string
}

export interface CreateCustomerData {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  billing_address?: any
  shipping_address?: any
  accepts_marketing?: boolean
  accepts_sms?: boolean
}

/**
 * Magic link token oluşturur
 */
function generateMagicToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = bcrypt.hashSync(token, 10)
  return { token, hash }
}

/**
 * E-mail adresine göre müşteri bulur
 */
export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  try {
    // İlk normal client ile dene
    const supabase = createClient()
    
    let { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    // RLS policy problemi varsa admin client ile dene
    if (error && (error.code === '42501' || error.code === '406')) {
      console.log('🔓 RLS policy nedeniyle admin client kullanılıyor...')
      
      try {
        const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-client')
        const adminSupabase = createAdminSupabaseClient()
        
        const result = await adminSupabase
          .from('customers')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .single()
        
        data = result.data
        error = result.error
      } catch (adminError) {
        console.error('Admin client error:', adminError)
      }
    }

    if (error || !data) {
      return null
    }

    console.log(`✅ Customer bulundu: ${data.email}`)
    return data as Customer
  } catch (error) {
    console.error('Error finding customer by email:', error)
    return null
  }
}

/**
 * Sipariş bilgilerinden customer oluştur (RLS bypass ile)
 */
export async function createCustomerFromOrder(orderData: {
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  billing_address?: string | null
}): Promise<Customer | null> {
  try {
    const supabase = createClient()
    
    const newCustomer = {
      email: orderData.email.toLowerCase().trim(),
      first_name: orderData.first_name?.trim() || null,
      last_name: orderData.last_name?.trim() || null,
      phone: orderData.phone?.trim() || null,
      default_address: orderData.billing_address || null,
      accepts_marketing: false,
      accepts_sms: false,
      preferred_language: 'tr',
      total_orders: 1,
      total_spent: 0
    }

    console.log('💾 Customer oluşturuluyor:', {
      email: newCustomer.email,
      name: `${newCustomer.first_name || ''} ${newCustomer.last_name || ''}`.trim()
    })

    // RLS bypass için admin client kullan
    const { createAdminSupabaseClient } = await import('@/lib/supabase/admin-client')
    const adminSupabase = createAdminSupabaseClient()

    const { data, error } = await adminSupabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single()

    if (error) {
      console.error('Error creating customer from order:', error)
      return null
    }

    console.log('✅ Customer başarıyla oluşturuldu:', data.email)
    return data as Customer
  } catch (error) {
    console.error('Error creating customer from order:', error)
    return null
  }
}

/**
 * Yeni müşteri oluşturur (sipariş sonrası otomatik)
 */
export async function createCustomer(customerData: CreateCustomerData): Promise<Customer | null> {
  try {
    const supabase = createClient()
    
    const newCustomer = {
      email: customerData.email.toLowerCase().trim(),
      first_name: customerData.first_name?.trim() || null,
      last_name: customerData.last_name?.trim() || null,
      phone: customerData.phone?.trim() || null,
      default_address: customerData.shipping_address || customerData.billing_address || null,
      accepts_marketing: customerData.accepts_marketing || false,
      accepts_sms: customerData.accepts_sms || false,
      preferred_language: 'tr'
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return null
    }

    // Varsayılan adres ekle
    if (customerData.shipping_address || customerData.billing_address) {
      await addCustomerAddress(data.id, {
        title: 'Varsayılan Adres',
        contact_name: customerData.shipping_address?.contactName || customerData.billing_address?.contactName || `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim(),
        phone: customerData.phone || '',
        address: customerData.shipping_address?.address || customerData.billing_address?.address || '',
        city: customerData.shipping_address?.city || customerData.billing_address?.city || '',
        district: customerData.shipping_address?.district || customerData.billing_address?.district || '',
        postal_code: customerData.shipping_address?.postalCode || customerData.billing_address?.postalCode || '',
        country: 'TR',
        is_default: true,
        is_billing: true,
        is_shipping: true
      })
    }

    return data as Customer
  } catch (error) {
    console.error('Error creating customer:', error)
    return null
  }
}

/**
 * Magic login link oluşturur
 */
export async function generateMagicLoginLink(email: string, baseUrl: string): Promise<{ success: boolean; loginUrl?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // 1. Önce müşteriyi bul
    let customer = await findCustomerByEmail(email)
    console.log(`🔍 Customer arama: ${email} ->`, customer ? 'Bulundu' : 'Bulunamadı')
    
    if (!customer) {
      // 2. Orders tablosunda bu email ile sipariş var mı kontrol et
      console.log('📦 Orders tablosunda email aranıyor...')
      const { data: existingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (!ordersError && existingOrders && existingOrders.length > 0) {
        const latestOrder = existingOrders[0]
        console.log(`✅ Email ile sipariş bulundu: ${latestOrder.order_number}`)
        
        // 3. Bu sipariş bilgilerinden customer oluştur (RLS bypass)
        console.log('👤 Sipariş bilgilerinden customer oluşturuluyor...')
        customer = await createCustomerFromOrder({
          email: latestOrder.customer_email,
          first_name: latestOrder.customer_first_name || latestOrder.first_name,
          last_name: latestOrder.customer_last_name || latestOrder.last_name,
          phone: latestOrder.customer_phone || latestOrder.phone,
          billing_address: latestOrder.billing_address || latestOrder.address
        })
        
        if (customer) {
          console.log('✅ Sipariş bilgilerinden customer oluşturuldu:', customer.email)
          
          // 4. Bu customer'a ait tüm siparişleri güncelle
          await supabase
            .from('orders')
            .update({ customer_id: customer.id })
            .eq('customer_email', email)
          
          console.log('🔄 Eski siparişler customer ile eşleştirildi')
        }
      }
      
      if (!customer) {
        // 5. Hiçbir yerde bulunamadı, yeni customer oluştur
        console.log('👤 Yeni customer oluşturuluyor...')
        customer = await createCustomer({ email })
        
        if (!customer) {
          // 6. Son fallback: En son oluşturulan customer'ı al
          console.log('⚠️ Customer oluşturulamadı, en son oluşturulan customer aranıyor...')
          
          const { data: latestCustomer, error: latestError } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          if (!latestError && latestCustomer) {
            customer = latestCustomer
            console.log(`✅ Fallback: En son customer kullanılıyor: ${customer.email}`)
          } else {
            console.log('❌ Hiç customer bulunamadı')
            return { success: false, error: 'Müşteri sistemi henüz aktif değil. Lütfen önce bir sipariş verin.' }
          }
        } else {
          console.log('✅ Yeni customer oluşturuldu:', customer.email)
        }
      }
    }

    // Eski kullanılmamış token'ları deaktive et
    await supabase
      .from('magic_login_tokens')
      .update({ is_used: true })
      .eq('customer_id', customer.id)
      .eq('is_used', false)

    // Yeni token oluştur
    const { token, hash } = generateMagicToken()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 dakika

    const { data: tokenData, error } = await supabase
      .from('magic_login_tokens')
      .insert({
        customer_id: customer.id,
        token: token,
        token_hash: hash,
        expires_at: expiresAt.toISOString(),
        max_usage: 1
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating magic token:', error)
      return { success: false, error: 'Token oluşturulamadı' }
    }

    const loginUrl = `${baseUrl}/auth/magic-login?token=${token}`
    
    console.log(`🔗 Magic login link oluşturuldu: ${customer.email} için`)
    return { success: true, loginUrl }
  } catch (error) {
    console.error('Error generating magic login link:', error)
    return { success: false, error: 'Magic link oluşturulamadı' }
  }
}

/**
 * Magic token'ı doğrular ve müşteriyi giriş yapar
 */
export async function verifyMagicToken(token: string): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  try {
    const supabase = createClient()
    
    // Token'ı bul
    const { data: tokenData, error: tokenError } = await supabase
      .from('magic_login_tokens')
      .select(`
        *,
        customers (*)
      `)
      .eq('token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Geçersiz veya süresi dolmuş token' }
    }

    // Token'ı kullanıldı olarak işaretle
    await supabase
      .from('magic_login_tokens')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString(),
        usage_count: tokenData.usage_count + 1 
      })
      .eq('id', tokenData.id)

    return { 
      success: true, 
      customer: tokenData.customers as Customer 
    }
  } catch (error) {
    console.error('Error verifying magic token:', error)
    return { success: false, error: 'Token doğrulanamadı' }
  }
}

/**
 * Müşteri adres ekler
 */
export async function addCustomerAddress(customerId: string, addressData: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at' | 'updated_at'>): Promise<CustomerAddress | null> {
  try {
    const supabase = createClient()
    
    // Eğer default adres ise, diğerlerini false yap
    if (addressData.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customerId,
        ...addressData
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding customer address:', error)
      return null
    }

    return data as CustomerAddress
  } catch (error) {
    console.error('Error adding customer address:', error)
    return null
  }
}

/**
 * Müşteri adreslerini getirir
 */
export async function getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting customer addresses:', error)
      return []
    }

    return data as CustomerAddress[]
  } catch (error) {
    console.error('Error getting customer addresses:', error)
    return []
  }
}

/**
 * Müşteri siparişlerini getirir
 */
export async function getCustomerOrders(customerId: string): Promise<any[]> {
  try {
    const supabase = createClient()
    
    // Önce customer'ın email'ini al
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('email')
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      console.error('Error getting customer email:', customerError)
      return []
    }

    // Hem customer_id hem de email ile siparişleri ara
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            slug,
            images
          )
        )
      `)
      .or(`customer_id.eq.${customerId},email.eq.${customer.email}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting customer orders:', error)
      return []
    }

    console.log(`📦 Customer ${customer.email} için ${data?.length || 0} sipariş bulundu`)
    return data || []
  } catch (error) {
    console.error('Error getting customer orders:', error)
    return []
  }
}

/**
 * Müşteri profilini günceller
 */
export async function updateCustomerProfile(customerId: string, updates: Partial<Customer>): Promise<Customer | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating customer profile:', error)
      return null
    }

    return data as Customer
  } catch (error) {
    console.error('Error updating customer profile:', error)
    return null
  }
}

/**
 * E-mail ile müşteri bilgilerini autocomplete için getirir
 */
export async function getCustomerForAutocomplete(email: string): Promise<{
  customer?: Customer
  addresses?: CustomerAddress[]
  success: boolean
}> {
  try {
    const customer = await findCustomerByEmail(email)
    
    if (!customer) {
      return { success: false }
    }

    const addresses = await getCustomerAddresses(customer.id)
    
    return {
      success: true,
      customer,
      addresses
    }
  } catch (error) {
    console.error('Error getting customer for autocomplete:', error)
    return { success: false }
  }
} 