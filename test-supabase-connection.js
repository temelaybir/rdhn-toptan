// Supabase Baglanti Testi
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rfdlhpcvdwhfemgupmof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZGxocGN2ZHdoZmVtZ3VwbW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzU1ODksImV4cCI6MjA3NTg1MTU4OX0.gkeliOUJ8obWDnviM-sCpJ8s1J-gpqotDOB6XorgfZc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Supabase Baglanti Testi Basliyor...\n');
  
  try {
    // Test 1: Products tablosunu oku
    const { data, error } = await supabase
      .from('products')
      .select('name, price, stock_quantity')
      .limit(5);
    
    if (error) {
      console.error('❌ HATA:', error);
      return;
    }
    
    console.log('✅ Baglanti BASARILI!');
    console.log(`✅ ${data.length} urun bulundu\n`);
    
    // Turkce karakterleri kontrol et
    console.log('📋 Ornek Urunler:');
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.price} TL (Stok: ${product.stock_quantity})`);
    });
    
    console.log('\n✅ Turkce karakterler duzgun gorunuyor!');
    
  } catch (err) {
    console.error('❌ Beklenmeyen Hata:', err);
  }
}

testConnection();

