'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Adding performance indexes for optimized reporting...');

      // Add indexes for transactions table
      
      // Composite index for date range queries (most common)
      await queryInterface.addIndex('transactions', {
        fields: ['date', 'id'],
        name: 'idx_transactions_date_id',
        transaction
      });
      
      // Index for category filtering
      await queryInterface.addIndex('transactions', {
        fields: ['category_id', 'date'],
        name: 'idx_transactions_category_date',
        transaction
      });
      
      // Index for account filtering
      await queryInterface.addIndex('transactions', {
        fields: ['account_id', 'date'],
        name: 'idx_transactions_account_date',
        transaction
      });
      
      // Index for amount-based queries
      await queryInterface.addIndex('transactions', {
        fields: ['amount', 'date'],
        name: 'idx_transactions_amount_date',
        transaction
      });
      
      // Composite index for user-specific queries
      await queryInterface.addIndex('transactions', {
        fields: ['user_id', 'date', 'category_id'],
        name: 'idx_transactions_user_date_category',
        transaction
      });
      
      // Add indexes for categories table
      await queryInterface.addIndex('categories', {
        fields: ['user_id', 'name'],
        name: 'idx_categories_user_name',
        transaction
      });
      
      await queryInterface.addIndex('categories', {
        fields: ['type', 'user_id'],
        name: 'idx_categories_type_user',
        transaction
      });
      
      // Add indexes for accounts table
      await queryInterface.addIndex('accounts', {
        fields: ['user_id', 'type'],
        name: 'idx_accounts_user_type',
        transaction
      });
      
      await queryInterface.addIndex('accounts', {
        fields: ['is_active', 'user_id'],
        name: 'idx_accounts_active_user',
        transaction
      });
      
      // Add performance-related columns if they don't exist
      
      // Add cached aggregation columns to transactions
      try {
        await queryInterface.addColumn('transactions', 'month_year', {
          type: Sequelize.STRING(7), // Format: YYYY-MM
          allowNull: true,
          comment: 'Cached month-year for aggregation'
        }, { transaction });
      } catch (error) {
        console.log('Column month_year already exists, skipping...');
      }
      
      try {
        await queryInterface.addColumn('transactions', 'year_week', {
          type: Sequelize.STRING(7), // Format: YYYY-WW
          allowNull: true,
          comment: 'Cached year-week for aggregation'
        }, { transaction });
      } catch (error) {
        console.log('Column year_week already exists, skipping...');
      }
      
      // Index for the new aggregation columns
      await queryInterface.addIndex('transactions', {
        fields: ['month_year', 'category_id'],
        name: 'idx_transactions_month_category',
        transaction
      });
      
      await queryInterface.addIndex('transactions', {
        fields: ['year_week', 'category_id'],
        name: 'idx_transactions_week_category',
        transaction
      });
      
      // Create views for common aggregations
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE VIEW v_monthly_summary AS
        SELECT 
          DATE_TRUNC('month', date) as month_date,
          EXTRACT(YEAR FROM date) || '-' || LPAD(EXTRACT(MONTH FROM date)::text, 2, '0') as month_year,
          category_id,
          user_id,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense,
          SUM(amount) as net_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount
        FROM transactions
        GROUP BY DATE_TRUNC('month', date), category_id, user_id
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE VIEW v_category_summary AS
        SELECT 
          t.category_id,
          t.user_id,
          c.name as category_name,
          c.type as category_type,
          SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_expense,
          SUM(t.amount) as net_amount,
          COUNT(*) as transaction_count,
          AVG(t.amount) as avg_amount,
          MIN(t.date) as first_transaction,
          MAX(t.date) as last_transaction
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        GROUP BY t.category_id, t.user_id, c.name, c.type
      `, { transaction });
      
      await transaction.commit();
      console.log('Performance indexes and views created successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating performance indexes:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Removing performance indexes...');
      
      // Drop views first
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_monthly_summary', { transaction });
      await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_category_summary', { transaction });
      
      // Remove added columns
      try {
        await queryInterface.removeColumn('transactions', 'month_year', { transaction });
      } catch (error) {
        console.log('Column month_year not found, skipping...');
      }
      
      try {
        await queryInterface.removeColumn('transactions', 'year_week', { transaction });
      } catch (error) {
        console.log('Column year_week not found, skipping...');
      }
      
      // Remove indexes
      const indexesToRemove = [
        { table: 'transactions', name: 'idx_transactions_date_id' },
        { table: 'transactions', name: 'idx_transactions_category_date' },
        { table: 'transactions', name: 'idx_transactions_account_date' },
        { table: 'transactions', name: 'idx_transactions_amount_date' },
        { table: 'transactions', name: 'idx_transactions_user_date_category' },
        { table: 'transactions', name: 'idx_transactions_month_category' },
        { table: 'transactions', name: 'idx_transactions_week_category' },
        { table: 'categories', name: 'idx_categories_user_name' },
        { table: 'categories', name: 'idx_categories_type_user' },
        { table: 'accounts', name: 'idx_accounts_user_type' },
        { table: 'accounts', name: 'idx_accounts_active_user' }
      ];
      
      for (const { table, name } of indexesToRemove) {
        try {
          await queryInterface.removeIndex(table, name, { transaction });
        } catch (error) {
          console.warn(`Index ${name} not found on table ${table}, skipping...`);
        }
      }
      
      await transaction.commit();
      console.log('Performance indexes and views removed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Error removing performance indexes:', error);
      throw error;
    }
  }
};