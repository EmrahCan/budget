const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createAdminUser() {
  try {
    const email = 'admin@budget.com';
    const password = 'admin123';
    const firstName = 'Admin';
    const lastName = 'User';
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if admin already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', email);
      process.exit(0);
    }
    
    // Create admin user
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
      'admin'
    ]);
    
    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', result.rows[0].role);
    console.log('-----------------------------------');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
