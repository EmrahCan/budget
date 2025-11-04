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

async function resetUserPassword(email, newPassword) {
  try {
    console.log(`Resetting password for user: ${email}`);
    
    // Check if user exists
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    const updateQuery = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2';
    await pool.query(updateQuery, [hashedPassword, user.id]);
    
    console.log('✅ Password reset successfully!');
    console.log('New password:', newPassword);
    console.log('Please ask the user to change this password after login.');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node reset-password.js <email> <new-password>');
  console.log('Example: node reset-password.js emrahcan@hotmail.com newpassword123');
  process.exit(1);
}

const [email, newPassword] = args;
resetUserPassword(email, newPassword);