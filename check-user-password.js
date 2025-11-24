const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'budget_app',
  user: 'postgres',
  password: 'postgres'
});

async function checkUser() {
  try {
    const result = await pool.query(
      'SELECT email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      ['emrahcan@hotmail.com']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✓ User found:', user.email, user.first_name, user.last_name, user.role);
      console.log('Testing passwords...');
      
      // Test common passwords
      const testPasswords = ['admin123', 'test123', 'password', '123456', 'Eben2010++**++'];
      for (const pwd of testPasswords) {
        const match = await bcrypt.compare(pwd, user.password_hash);
        if (match) {
          console.log('✓✓✓ PASSWORD MATCH:', pwd);
        }
      }
      console.log('Password testing complete');
    } else {
      console.log('✗ User not found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkUser();
