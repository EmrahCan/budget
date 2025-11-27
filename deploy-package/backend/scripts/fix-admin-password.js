const bcrypt = require('bcryptjs');
const DatabaseUtils = require('../utils/database');

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin password...');
    
    // Generate correct bcrypt hash for 'admin123'
    const password = 'admin123';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Generated password hash:', passwordHash);
    
    // Test the hash immediately
    const isValid = await bcrypt.compare(password, passwordHash);
    console.log('✅ Hash validation test:', isValid ? 'PASSED' : 'FAILED');
    
    if (!isValid) {
      throw new Error('Generated hash is invalid!');
    }
    
    // Update admin user in database
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING id, email, password_hash
    `;
    
    const result = await DatabaseUtils.query(updateQuery, [passwordHash, 'admin@budgetapp.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found, creating new admin user...');
      
      // Create admin user if not exists
      const createQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, password_hash
      `;
      
      const createResult = await DatabaseUtils.query(createQuery, [
        'admin@budgetapp.com',
        passwordHash,
        'Admin',
        'User',
        'admin',
        true
      ]);
      
      console.log('✅ Admin user created:', createResult.rows[0]);
    } else {
      console.log('✅ Admin user password updated:', result.rows[0]);
    }
    
    // Final verification
    const verifyQuery = 'SELECT id, email, password_hash FROM users WHERE email = $1';
    const verifyResult = await DatabaseUtils.query(verifyQuery, ['admin@budgetapp.com']);
    
    if (verifyResult.rows.length > 0) {
      const storedHash = verifyResult.rows[0].password_hash;
      const finalTest = await bcrypt.compare('admin123', storedHash);
      console.log('✅ Final password verification:', finalTest ? 'SUCCESS' : 'FAILED');
      
      if (finalTest) {
        console.log('🎉 Admin password fix completed successfully!');
      } else {
        console.log('❌ Password verification failed after update');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
    throw error;
  }
}

// Run the fix
fixAdminPassword()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });