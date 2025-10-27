const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.seedsPath = path.join(__dirname, 'seeds');
  }

  async runSchema() {
    try {
      console.log('Running database schema...');
      const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await pool.query(schemaSQL);
      console.log('✅ Database schema created successfully');
    } catch (error) {
      console.error('❌ Error running schema:', error.message);
      throw error;
    }
  }

  async runSeeds() {
    try {
      console.log('Running database seeds...');
      const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      
      // Check if we have any users first
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count) === 0) {
        console.log('No users found, skipping seed data (create users first)');
        return;
      }

      await pool.query(seedSQL);
      console.log('✅ Database seeds completed successfully');
    } catch (error) {
      console.error('❌ Error running seeds:', error.message);
      throw error;
    }
  }

  async checkConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connection successful:', result.rows[0].now);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async createTables() {
    try {
      await this.checkConnection();
      await this.runSchema();
      console.log('✅ All tables created successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  async reset() {
    try {
      console.log('🔄 Resetting database...');
      
      // Drop all tables in correct order (reverse of creation)
      const dropQueries = [
        'DROP TABLE IF EXISTS notifications CASCADE;',
        'DROP TABLE IF EXISTS budgets CASCADE;',
        'DROP TABLE IF EXISTS fixed_payments CASCADE;',
        'DROP TABLE IF EXISTS transactions CASCADE;',
        'DROP TABLE IF EXISTS credit_cards CASCADE;',
        'DROP TABLE IF EXISTS accounts CASCADE;',
        'DROP TABLE IF EXISTS users CASCADE;',
        'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;'
      ];

      for (const query of dropQueries) {
        await pool.query(query);
      }

      console.log('✅ Database reset completed');
      
      // Recreate tables
      await this.createTables();
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2];

  switch (command) {
    case 'create':
      migrator.createTables();
      break;
    case 'seed':
      migrator.runSeeds();
      break;
    case 'reset':
      migrator.reset();
      break;
    case 'check':
      migrator.checkConnection();
      break;
    default:
      console.log('Usage: node migrate.js [create|seed|reset|check]');
      console.log('  create - Create all tables');
      console.log('  seed   - Insert sample data');
      console.log('  reset  - Drop and recreate all tables');
      console.log('  check  - Test database connection');
  }
}

module.exports = DatabaseMigrator;