const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'budget_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function resetEmrahPassword() {
  const email = 'emrahcan@hotmail.com';
  const newPassword = 'emrah123';
  
  try {
    console.log(`🔄 Resetting password for: ${email}`);
    
    // Check if user exists
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      console.log('Available users:');
      
      // Show available users
      const allUsersQuery = 'SELECT id, email, first_name, last_name FROM users ORDER BY created_at';
      const allUsers = await pool.query(allUsersQuery);
      
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
      });
      
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
    await pool.query(updateQuery, [hashedPassword, user.id]);
    
    console.log('🎉 Password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New password:', newPassword);
    console.log('');
    console.log('💡 You can now login with these credentials.');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

resetEmrahPassword();