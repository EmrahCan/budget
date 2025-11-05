const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupProductionDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔗 Connected to Azure MySQL database');

  try {
    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📄 Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.execute(statement);
        }
      }
      
      console.log(`✅ Migration ${file} completed`);
    }

    // Create admin user if not exists
    const adminEmail = 'admin@budget.com';
    const adminPassword = '$2b$10$rQZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9QZ9Q'; // 'admin123'
    
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingUser.length === 0) {
      await connection.execute(
        'INSERT INTO users (email, password, first_name, last_name, is_admin, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [adminEmail, adminPassword, 'Admin', 'User', true]
      );
      console.log('👤 Admin user created');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.production' });
  setupProductionDatabase().catch(console.error);
}

module.exports = setupProductionDatabase;