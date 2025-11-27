const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetPassword(email, newPassword) {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'budget_app',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connected to database');
    
    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found!');
      console.log('\n📋 Available users:');
      
      const [allUsers] = await connection.execute(
        'SELECT id, email, first_name, last_name FROM users ORDER BY created_at'
      );
      
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
      });
      
      return;
    }
    
    const user = users[0];
    console.log(`\n✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await connection.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );
    
    console.log('\n🎉 Password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New password:', newPassword);
    console.log('\n💡 You can now login with these credentials.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection refused. Check if MySQL is running.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Access denied. Check your database credentials in .env file.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node reset-password-mysql.js <email> <new-password>');
  console.log('Example: node reset-password-mysql.js emrahcan@hotmail.com yeniSifre123');
  process.exit(1);
}

const [email, newPassword] = args;
resetPassword(email, newPassword).then(() => process.exit(0));
