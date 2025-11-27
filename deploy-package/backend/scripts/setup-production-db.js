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
    // Execute main initialization script
    const initSqlPath = path.join(__dirname, '../database/init/mysql-init.sql');
    console.log('📄 Executing main initialization script...');
    
    const sql = fs.readFileSync(initSqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Ignore duplicate key errors and table exists errors
          if (!error.message.includes('Duplicate entry') && 
              !error.message.includes('already exists')) {
            console.warn('⚠️ Statement warning:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Main initialization completed');

    // Execute additional migration files if they exist
    const migrationsDir = path.join(__dirname, '../database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        console.log(`📄 Executing migration: ${file}`);
        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        const migrationStatements = migrationSql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of migrationStatements) {
          if (statement.trim()) {
            try {
              await connection.execute(statement);
            } catch (error) {
              console.warn(`⚠️ Migration ${file} warning:`, error.message);
            }
          }
        }
        
        console.log(`✅ Migration ${file} completed`);
      }
    }

    // Verify tables were created
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Created tables:', tables.map(t => Object.values(t)[0]));

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