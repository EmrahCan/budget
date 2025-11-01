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

async function checkUser(email) {
  try {
    console.log(`Checking user: ${email}`);
    
    // Get user information
    const userQuery = `
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        is_active,
        created_at,
        updated_at,
        last_login
      FROM users 
      WHERE email = $1
    `;
    
    const result = await pool.query(userQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = result.rows[0];
    
    console.log('\n📋 User Information:');
    console.log('==================');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.first_name} ${user.last_name}`);
    console.log(`Role: ${user.role || 'user'}`);
    console.log(`Active: ${user.is_active ? 'Yes' : 'No'}`);
    console.log(`Created: ${user.created_at}`);
    console.log(`Updated: ${user.updated_at}`);
    console.log(`Last Login: ${user.last_login || 'Never'}`);
    
    // Get user's accounts count
    const accountsQuery = 'SELECT COUNT(*) as count FROM accounts WHERE user_id = $1';
    const accountsResult = await pool.query(accountsQuery, [user.id]);
    console.log(`Accounts: ${accountsResult.rows[0].count}`);
    
    // Get user's transactions count
    const transactionsQuery = 'SELECT COUNT(*) as count FROM transactions WHERE user_id = $1';
    const transactionsResult = await pool.query(transactionsQuery, [user.id]);
    console.log(`Transactions: ${transactionsResult.rows[0].count}`);
    
    console.log('\n💡 To reset password, run:');
    console.log(`node reset-password.js ${email} newpassword123`);
    
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node check-user.js <email>');
  console.log('Example: node check-user.js emrahcan@hotmail.com');
  process.exit(1);
}

const [email] = args;
checkUser(email);