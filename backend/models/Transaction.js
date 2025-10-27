const DatabaseUtils = require('../utils/database');

class Transaction {
  constructor(transactionData) {
    this.id = transactionData.id;
    this.userId = transactionData.user_id;
    this.accountId = transactionData.account_id;
    this.creditCardId = transactionData.credit_card_id;
    this.type = transactionData.type;
    this.amount = parseFloat(transactionData.amount);
    this.description = transactionData.description;
    this.category = transactionData.category;
    this.transactionDate = transactionData.transaction_date;
    this.createdAt = transactionData.created_at;
    this.updatedAt = transactionData.updated_at;
  }

  // Create a new transaction
  static async create(userId, transactionData) {
    try {
      const {
        accountId,
        creditCardId,
        type,
        amount,
        description,
        category,
        transactionDate = new Date().toISOString().split('T')[0]
      } = transactionData;

      // Validate that either accountId or creditCardId is provided
      if (!accountId && !creditCardId) {
        throw new Error('Hesap ID veya kredi kartı ID gereklidir');
      }

      if (accountId && creditCardId) {
        throw new Error('Hem hesap hem kredi kartı ID verilemez');
      }

      const query = `
        INSERT INTO transactions (
          user_id, account_id, credit_card_id, type, amount, 
          description, category, transaction_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, [
        userId,
        accountId || null,
        creditCardId || null,
        type,
        amount,
        description?.trim() || null,
        category?.trim() || null,
        transactionDate
      ]);

      return new Transaction(result.rows[0]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Find transaction by ID
  static async findById(id, userId = null) {
    try {
      let query = 'SELECT * FROM transactions WHERE id = $1';
      let params = [id];

      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await DatabaseUtils.query(query, params);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Transaction(result.rows[0]);
    } catch (error) {
      console.error('Error finding transaction:', error);
      throw error;
    }
  }

  // Get all transactions for a user
  static async findByUserId(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        startDate, 
        endDate, 
        type, 
        category,
        accountId,
        creditCardId,
        search
      } = options;
      
      let query = 'SELECT * FROM transactions WHERE user_id = $1';
      let params = [userId];
      let paramIndex = 2;

      // Add filters
      if (startDate) {
        query += ` AND transaction_date >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND transaction_date <= $${paramIndex++}`;
        params.push(endDate);
      }

      if (type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(type);
      }

      if (category) {
        query += ` AND category ILIKE $${paramIndex++}`;
        params.push(`%${category}%`);
      }

      if (accountId) {
        query += ` AND account_id = $${paramIndex++}`;
        params.push(accountId);
      }

      if (creditCardId) {
        query += ` AND credit_card_id = $${paramIndex++}`;
        params.push(creditCardId);
      }

      if (search) {
        query += ` AND (description ILIKE $${paramIndex++} OR category ILIKE $${paramIndex})`;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex++;
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await DatabaseUtils.query(query, params);
      
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      console.error('Error finding transactions by user:', error);
      throw error;
    }
  }

  // Update transaction
  async update(updateData) {
    try {
      const allowedFields = [
        'type', 'amount', 'description', 'category', 'transaction_date'
      ];
      
      const updates = [];
      const params = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbField) && value !== undefined) {
          updates.push(`${dbField} = $${paramIndex++}`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error('Güncellenecek alan bulunamadı');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(this.id);

      const query = `
        UPDATE transactions 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('İşlem bulunamadı');
      }

      // Update current instance
      const updatedData = result.rows[0];
      Object.assign(this, new Transaction(updatedData));

      return this;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Delete transaction
  async delete() {
    try {
      const query = 'DELETE FROM transactions WHERE id = $1';
      await DatabaseUtils.query(query, [this.id]);
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Get transaction categories for a user
  static async getCategories(userId, type = null) {
    try {
      let query = `
        SELECT DISTINCT category, COUNT(*) as usage_count
        FROM transactions 
        WHERE user_id = $1 AND category IS NOT NULL
      `;
      let params = [userId];

      if (type) {
        query += ' AND type = $2';
        params.push(type);
      }

      query += ' GROUP BY category ORDER BY usage_count DESC, category ASC';

      const result = await DatabaseUtils.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get monthly summary
  static async getMonthlySummary(userId, year, month) {
    try {
      const query = `
        SELECT 
          type,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM transactions
        WHERE user_id = $1 
        AND EXTRACT(YEAR FROM transaction_date) = $2
        AND EXTRACT(MONTH FROM transaction_date) = $3
        GROUP BY type
      `;

      const result = await DatabaseUtils.query(query, [userId, year, month]);
      
      const summary = {
        income: { count: 0, total: 0, average: 0 },
        expense: { count: 0, total: 0, average: 0 },
        transfer: { count: 0, total: 0, average: 0 },
        payment: { count: 0, total: 0, average: 0 }
      };

      result.rows.forEach(row => {
        summary[row.type] = {
          count: parseInt(row.transaction_count),
          total: parseFloat(row.total_amount),
          average: parseFloat(row.average_amount)
        };
      });

      summary.netIncome = summary.income.total - summary.expense.total;
      summary.totalTransactions = Object.values(summary).reduce((sum, item) => {
        return sum + (item.count || 0);
      }, 0);

      return summary;
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      throw error;
    }
  }

  // Get category breakdown
  static async getCategoryBreakdown(userId, options = {}) {
    try {
      const { 
        startDate, 
        endDate, 
        type = 'expense',
        limit = 10 
      } = options;

      let query = `
        SELECT 
          category,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          (SUM(amount) * 100.0 / (
            SELECT SUM(amount) 
            FROM transactions 
            WHERE user_id = $1 AND type = $2
      `;
      
      let params = [userId, type];
      let paramIndex = 3;

      if (startDate) {
        query += ` AND transaction_date >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND transaction_date <= $${paramIndex++}`;
        params.push(endDate);
      }

      query += `
          )) as percentage
        FROM transactions
        WHERE user_id = $1 AND type = $2 AND category IS NOT NULL
      `;

      if (startDate) {
        query += ` AND transaction_date >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND transaction_date <= $${paramIndex++}`;
        params.push(endDate);
      }

      query += `
        GROUP BY category
        ORDER BY total_amount DESC
        LIMIT $${paramIndex}
      `;
      params.push(limit);

      const result = await DatabaseUtils.query(query, params);
      
      return result.rows.map(row => ({
        category: row.category,
        transactionCount: parseInt(row.transaction_count),
        totalAmount: parseFloat(row.total_amount),
        averageAmount: parseFloat(row.average_amount),
        percentage: parseFloat(row.percentage) || 0
      }));
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      throw error;
    }
  }

  // Get spending trends
  static async getSpendingTrends(userId, months = 12) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
          COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
        FROM transactions
        WHERE user_id = $1 
        AND transaction_date >= CURRENT_DATE - INTERVAL '${months} months'
        AND type IN ('income', 'expense')
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month DESC
      `;

      const result = await DatabaseUtils.query(query, [userId]);
      
      return result.rows.map(row => ({
        month: row.month,
        income: parseFloat(row.income),
        expense: parseFloat(row.expense),
        netIncome: parseFloat(row.income) - parseFloat(row.expense),
        incomeCount: parseInt(row.income_count),
        expenseCount: parseInt(row.expense_count)
      }));
    } catch (error) {
      console.error('Error getting spending trends:', error);
      throw error;
    }
  }

  // Get type display name
  getTypeDisplayName() {
    const typeNames = {
      'income': 'Gelir',
      'expense': 'Gider',
      'transfer': 'Transfer',
      'payment': 'Ödeme'
    };
    
    return typeNames[this.type] || this.type;
  }

  // Check if transaction is recent (within last 7 days)
  isRecent() {
    const transactionDate = new Date(this.transactionDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return transactionDate >= sevenDaysAgo;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      accountId: this.accountId,
      creditCardId: this.creditCardId,
      type: this.type,
      typeDisplayName: this.getTypeDisplayName(),
      amount: this.amount,
      description: this.description,
      category: this.category,
      transactionDate: this.transactionDate,
      isRecent: this.isRecent(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Transaction;