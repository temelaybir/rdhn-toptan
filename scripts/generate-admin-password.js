// Admin password hash generation script
// Uses same bcrypt library as backend

const bcrypt = require('bcryptjs')

async function generatePasswordHash() {
  const password = 'admin123'
  const saltRounds = 10
  
  console.log('Generating password hash...\n')
  console.log('Password:', password)
  console.log('Salt Rounds:', saltRounds)
  console.log('\nCreating hash...\n')
  
  try {
    // Sync hash
    const hashSync = bcrypt.hashSync(password, saltRounds)
    console.log('✅ Hash (Sync):', hashSync)
    console.log('   Length:', hashSync.length)
    console.log('   Prefix:', hashSync.substring(0, 7))
    
    // Async hash
    const hashAsync = await bcrypt.hash(password, saltRounds)
    console.log('\n✅ Hash (Async):', hashAsync)
    console.log('   Length:', hashAsync.length)
    console.log('   Prefix:', hashAsync.substring(0, 7))
    
    // Test verification
    const isValidSync = bcrypt.compareSync(password, hashSync)
    const isValidAsync = await bcrypt.compare(password, hashAsync)
    
    console.log('\nVerification Test:')
    console.log('   Sync hash valid:', isValidSync ? 'YES' : 'NO')
    console.log('   Async hash valid:', isValidAsync ? 'YES' : 'NO')
    
    // SQL query
    console.log('\nSupabase SQL Query:')
    console.log('```sql')
    console.log(`UPDATE admin_users 
SET password_hash = '${hashSync}',
    updated_at = NOW()
WHERE username = 'admin';`)
    console.log('```')
    
    console.log('\nDone!')
    console.log('\nNote: Each run generates different hash (due to salt)')
    console.log('      But all verify the same password.')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

generatePasswordHash()

