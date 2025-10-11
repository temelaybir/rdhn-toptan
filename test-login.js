// Test login script - Müşteri hesabı oluştur ve test et
require('dotenv').config({ path: '.env.local' })
const bcrypt = require('bcryptjs')

async function createTestCustomer() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials bulunamadı!')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const testEmail = 'test@catkapinda.com'
  const testPassword = '123456'
  
  console.log('🔍 Test müşterisi kontrol ediliyor:', testEmail)
  
  // Önce var mı kontrol et
  const { data: existing, error: checkError } = await supabase
    .from('customers')
    .select('*')
    .eq('email', testEmail)
    .single()
  
  if (existing) {
    console.log('✅ Test müşterisi zaten var:', {
      id: existing.id,
      email: existing.email,
      firstName: existing.first_name,
      lastName: existing.last_name,
      hasPassword: !!existing.password_hash
    })
    
    // Şifre yoksa ekle
    if (!existing.password_hash) {
      console.log('⚠️ Şifre hash yok, ekleniyor...')
      const hashedPassword = await bcrypt.hash(testPassword, 10)
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ password_hash: hashedPassword })
        .eq('id', existing.id)
      
      if (updateError) {
        console.error('❌ Şifre güncellenemedi:', updateError)
      } else {
        console.log('✅ Şifre eklendi!')
      }
    }
    
    console.log('\n📝 Test bilgileri:')
    console.log('E-mail:', testEmail)
    console.log('Şifre:', testPassword)
    console.log('\n🌐 Test URL: http://localhost:3000/auth/login')
    return
  }
  
  console.log('➕ Test müşterisi oluşturuluyor...')
  
  // Yeni müşteri oluştur
  const hashedPassword = await bcrypt.hash(testPassword, 10)
  
  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      email: testEmail,
      first_name: 'Test',
      last_name: 'Kullanıcı',
      phone: '5551234567',
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (createError) {
    console.error('❌ Müşteri oluşturulamadı:', createError)
    return
  }
  
  console.log('✅ Test müşterisi oluşturuldu:', {
    id: newCustomer.id,
    email: newCustomer.email,
    firstName: newCustomer.first_name,
    lastName: newCustomer.last_name
  })
  
  console.log('\n📝 Test bilgileri:')
  console.log('E-mail:', testEmail)
  console.log('Şifre:', testPassword)
  console.log('\n🌐 Test URL: http://localhost:3000/auth/login')
}

createTestCustomer().catch(console.error)

