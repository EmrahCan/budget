const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createDemoUser() {
  try {
    const email = 'demo@budget.com';
    const password = 'demo123';
    const firstName = 'Demo';
    const lastName = 'Kullanıcı';
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('❌ Demo user already exists!');
      console.log('Email:', email);
      process.exit(0);
    }
    
    // Create demo user
    const insertQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role
    `;
    
    const result = await pool.query(insertQuery, [
      email,
      passwordHash,
      firstName,
      lastName,
      'user'
    ]);
    
    console.log('✅ Demo user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', result.rows[0].role);
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoUser();
