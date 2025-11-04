const DatabaseUtils = require('../utils/database');

class Account {
  constructor(accountData) {
    this.id = accountData.id;
    this.userId = accountData.user_id;
    this.name = accountData.name;
    this.type = accountData.type;
    this.balance = parseFloat(accountData.balance);
    this.overdraftLimit = parseFloat(accountData.overdraft_limit || 0);
    this.overdraftUsed = parseFloat(accountData.overdraft_used || 0);
    this.currency = accountData.currency;
    this.bankId = accountData.bank_id;
    this.bankName = accountData.bank_name;
    this.iban = accountData.iban;
    this.accountNumber = accountData.account_number;
    this.isActive = accountData.is_active;
    this.createdAt = accountData.created_at;
    this.updatedAt = accountData.updated_at;
  }

  // Create a new account
  static async create(userId, accountData) {
    try {
      const {
        name,
        type,
        balance = 0,
        overdraftLimit = 0,
        overdraftUsed = 0,
        currency = 'TRY',
        bankId,
        bankName,
        iban,
        accountNumber
      } = accountData;

      const query = `
        INSERT INTO accounts (user_id, name, type, balance, overdraft_limit, overdraft_used, currency, bank_id, bank_name, iban, account_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      // Esnek hesap için özel kontroller
      if (type === 'overdraft') {
        if (!overdraftLimit || parseFloat(overdraftLimit) <= 0) {
          throw new Error('Esnek hesap için geçerli bir limit belirtmelisiniz');
        }
        // Esnek hesap başlangıç bakiyesi 0 olmalı
        if (parseFloat(balance) !== 0) {
          throw new Error('Esnek hesap başlangıç bakiyesi 0 olmalıdır');
        }
      }

      const result = await DatabaseUtils.query(query, [
        userId,
        name.trim(),
        type,
        parseFloat(balance),
        parseFloat(overdraftLimit || 0),
        parseFloat(overdraftUsed || 0), // Kullanıcının girdiği değer
        currency.toUpperCase(),
        bankId?.trim() || null,
        bankName?.trim() || null,
        iban?.trim() || null,
        accountNumber?.trim() || null
      ]);

      return new Account(result.rows[0]);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Find account by ID
  static async findById(id, userId = null) {
    try {
      let query = 'SELECT * FROM accounts WHERE id = $1';
      let params = [id];

      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await DatabaseUtils.query(query, params);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new Account(result.rows[0]);
    } catch (error) {
      console.error('Error finding account:', error);
      throw error;
    }
  }

  // Get all accounts for a user
  static async findByUserId(userId, options = {}) {
    try {
      const { includeInactive = false, type, page = 1, limit = 50 } = options;
      
      let query = 'SELECT * FROM accounts WHERE user_id = $1';
      let params = [userId];
      let paramIndex = 2;

      if (!includeInactive) {
        query += ' AND is_active = true';
      }

      if (type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(type);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await DatabaseUtils.query(query, params);
      
      return result.rows.map(row => new Account(row));
    } catch (error) {
      console.error('Error finding accounts by user:', error);
      throw error;
    }
  }

  // Update account
  async update(updateData) {
    try {
      const allowedFields = ['name', 'type', 'balance', 'overdraft_limit', 'overdraft_used', 'currency', 'is_active'];
      
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
        UPDATE accounts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('Hesap bulunamadı');
      }

      // Update current instance
      const updatedData = result.rows[0];
      Object.assign(this, new Account(updatedData));

      return this;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Delete account (soft delete)
  async delete() {
    try {
      // Check if account has transactions
      const transactionCount = await DatabaseUtils.query(
        'SELECT COUNT(*) FROM transactions WHERE account_id = $1',
        [this.id]
      );

      if (parseInt(transactionCount.rows[0].count) > 0) {
        // Soft delete if has transactions
        const query = `
          UPDATE accounts 
          SET is_active = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;

        const result = await DatabaseUtils.query(query, [this.id]);
        this.isActive = false;
        return { deleted: false, deactivated: true };
      } else {
        // Hard delete if no transactions
        await this.hardDelete();
        return { deleted: true, deactivated: false };
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Hard delete (permanent)
  async hardDelete() {
    try {
      const query = 'DELETE FROM accounts WHERE id = $1';
      await DatabaseUtils.query(query, [this.id]);
      return true;
    } catch (error) {
      console.error('Error hard deleting account:', error);
      throw error;
    }
  }

  // Update balance
  async updateBalance(amount, operation = 'add') {
    try {
      let newBalance;
      
      if (operation === 'add') {
        newBalance = this.balance + amount;
      } else if (operation === 'subtract') {
        newBalance = this.balance - amount;
      } else if (operation === 'set') {
        newBalance = amount;
      } else {
        throw new Error('Geçersiz işlem türü');
      }

      const query = `
        UPDATE accounts 
        SET balance = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, [newBalance, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Hesap bulunamadı');
      }

      this.balance = parseFloat(result.rows[0].balance);
      this.updatedAt = result.rows[0].updated_at;

      return this;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  }

  // Add income transaction
  async addIncome(amount, description, category = null) {
    try {
      if (amount <= 0) {
        throw new Error('Gelir tutarı pozitif olmalıdır');
      }

      let newBalance = this.balance;
      let newOverdraftUsed = this.overdraftUsed;

      if (this.type === 'overdraft') {
        // Esnek hesap için - borç ödemesi
        const paymentAmount = Math.min(amount, this.overdraftUsed);
        newOverdraftUsed = this.overdraftUsed - paymentAmount;
        newBalance = 0; // Esnek hesap her zaman 0 bakiye
        
        if (amount > this.overdraftUsed) {
          throw new Error(`Maksimum ödeme tutarı: ${this.overdraftUsed}`);
        }
      } else {
        // Normal hesaplar için
        newBalance = this.balance + amount;
      }

      // Start transaction
      const queries = [
        {
          text: `
            UPDATE accounts 
            SET balance = $1, overdraft_used = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
          `,
          params: [newBalance, newOverdraftUsed, this.id]
        },
        {
          text: `
            INSERT INTO transactions (user_id, account_id, type, amount, description, category, transaction_date)
            VALUES ($1, $2, 'income', $3, $4, $5, CURRENT_DATE)
            RETURNING *
          `,
          params: [this.userId, this.id, amount, description, category]
        }
      ];

      const results = await DatabaseUtils.transaction(queries);
      
      // Update current instance
      this.balance = parseFloat(results[0].rows[0].balance);
      this.overdraftUsed = parseFloat(results[0].rows[0].overdraft_used);
      this.updatedAt = results[0].rows[0].updated_at;

      return {
        account: this,
        transaction: results[1].rows[0]
      };
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  }

  // Add expense transaction
  async addExpense(amount, description, category = null, allowOverdraft = true) {
    try {
      if (amount <= 0) {
        throw new Error('Gider tutarı pozitif olmalıdır');
      }

      let newBalance = this.balance;
      let newOverdraftUsed = this.overdraftUsed;

      if (this.type === 'overdraft') {
        // Esnek hesap için
        const availableLimit = this.getRemainingOverdraftLimit();
        if (amount > availableLimit) {
          throw new Error(`Yetersiz limit. Kullanılabilir: ${availableLimit}`);
        }
        newOverdraftUsed = this.overdraftUsed + amount;
        newBalance = 0; // Esnek hesap her zaman 0 bakiye
      } else {
        // Normal hesaplar için
        if (amount > this.balance && !allowOverdraft) {
          throw new Error('Yetersiz bakiye');
        }
        newBalance = this.balance - amount;
      }

      // Start transaction
      const queries = [
        {
          text: `
            UPDATE accounts 
            SET balance = $1, overdraft_used = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
          `,
          params: [newBalance, newOverdraftUsed, this.id]
        },
        {
          text: `
            INSERT INTO transactions (user_id, account_id, type, amount, description, category, transaction_date)
            VALUES ($1, $2, 'expense', $3, $4, $5, CURRENT_DATE)
            RETURNING *
          `,
          params: [this.userId, this.id, amount, description, category]
        }
      ];

      const results = await DatabaseUtils.transaction(queries);
      
      // Update current instance
      this.balance = parseFloat(results[0].rows[0].balance);
      this.overdraftUsed = parseFloat(results[0].rows[0].overdraft_used);
      this.updatedAt = results[0].rows[0].updated_at;

      return {
        account: this,
        transaction: results[1].rows[0]
      };
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Transfer to another account
  async transferTo(targetAccount, amount, description = 'Hesap arası transfer') {
    try {
      if (amount <= 0) {
        throw new Error('Transfer tutarı pozitif olmalıdır');
      }

      if (this.balance < amount) {
        throw new Error('Yetersiz bakiye');
      }

      if (this.id === targetAccount.id) {
        throw new Error('Aynı hesaba transfer yapılamaz');
      }

      // Start transaction
      const queries = [
        // Deduct from source account
        {
          text: `
            UPDATE accounts 
            SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `,
          params: [amount, this.id]
        },
        // Add to target account
        {
          text: `
            UPDATE accounts 
            SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `,
          params: [amount, targetAccount.id]
        },
        // Record outgoing transaction
        {
          text: `
            INSERT INTO transactions (user_id, account_id, type, amount, description, transaction_date)
            VALUES ($1, $2, 'transfer', $3, $4, CURRENT_DATE)
            RETURNING *
          `,
          params: [this.userId, this.id, amount, `${description} (Giden: ${targetAccount.name})`]
        },
        // Record incoming transaction
        {
          text: `
            INSERT INTO transactions (user_id, account_id, type, amount, description, transaction_date)
            VALUES ($1, $2, 'transfer', $3, $4, CURRENT_DATE)
            RETURNING *
          `,
          params: [targetAccount.userId, targetAccount.id, amount, `${description} (Gelen: ${this.name})`]
        }
      ];

      const results = await DatabaseUtils.transaction(queries);
      
      // Update current instances
      this.balance = parseFloat(results[0].rows[0].balance);
      this.updatedAt = results[0].rows[0].updated_at;
      
      targetAccount.balance = parseFloat(results[1].rows[0].balance);
      targetAccount.updatedAt = results[1].rows[0].updated_at;

      return {
        sourceAccount: this,
        targetAccount: targetAccount,
        outgoingTransaction: results[2].rows[0],
        incomingTransaction: results[3].rows[0]
      };
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactions(options = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate, type, category } = options;
      
      let query = `
        SELECT * FROM transactions 
        WHERE account_id = $1
      `;
      let params = [this.id];
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

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await DatabaseUtils.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  // Get account statistics
  async getStatistics(months = 12) {
    try {
      const queries = [
        // Monthly income/expense summary
        `
          SELECT 
            DATE_TRUNC('month', transaction_date) as month,
            type,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
          FROM transactions
          WHERE account_id = $1 
          AND transaction_date >= CURRENT_DATE - INTERVAL '${months} months'
          AND type IN ('income', 'expense')
          GROUP BY DATE_TRUNC('month', transaction_date), type
          ORDER BY month DESC
        `,
        // Category breakdown
        `
          SELECT 
            category,
            type,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
          FROM transactions
          WHERE account_id = $1 
          AND transaction_date >= CURRENT_DATE - INTERVAL '${months} months'
          AND category IS NOT NULL
          GROUP BY category, type
          ORDER BY total_amount DESC
        `,
        // Recent balance changes
        `
          SELECT 
            transaction_date,
            type,
            amount,
            description
          FROM transactions
          WHERE account_id = $1
          ORDER BY transaction_date DESC, created_at DESC
          LIMIT 10
        `
      ];

      const results = await Promise.all(
        queries.map(query => DatabaseUtils.query(query, [this.id]))
      );

      return {
        monthlySummary: results[0].rows,
        categoryBreakdown: results[1].rows,
        recentTransactions: results[2].rows,
        currentBalance: this.balance
      };
    } catch (error) {
      console.error('Error getting account statistics:', error);
      throw error;
    }
  }

  // Get account type display name
  getTypeDisplayName() {
    const typeNames = {
      'checking': 'Vadesiz Hesap',
      'savings': 'Vadeli Hesap',
      'cash': 'Nakit',
      'investment': 'Yatırım Hesabı'
    };
    
    return typeNames[this.type] || this.type;
  }

  // Check if account is low balance
  isLowBalance(threshold = 100) {
    return this.balance < threshold && this.balance >= 0;
  }

  // Check if account is overdrawn
  isOverdrawn() {
    return this.balance < 0;
  }

  // Convert to JSON
  // Esnek hesap için özel hesaplamalar
  getOverdraftUsed() {
    if (this.type === 'overdraft') {
      return this.overdraftUsed || 0;
    }
    return 0;
  }

  getRemainingOverdraftLimit() {
    if (this.type === 'overdraft') {
      return Math.max(0, this.overdraftLimit - this.getOverdraftUsed());
    }
    return 0;
  }

  getOverdraftDebt() {
    if (this.type === 'overdraft') {
      return this.getOverdraftUsed();
    }
    return 0;
  }

  // Normal hesaplar için
  getAvailableBalance() {
    if (this.type === 'overdraft') {
      return this.getRemainingOverdraftLimit();
    }
    return this.balance;
  }

  getDisplayedBalance() {
    if (this.type === 'overdraft') {
      return 0; // Esnek hesap her zaman 0 bakiye gösterir
    }
    return this.balance;
  }

  isUsingOverdraft() {
    return this.type === 'overdraft' && this.getOverdraftUsed() > 0;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      type: this.type,
      typeDisplayName: this.getTypeDisplayName(),
      balance: this.getDisplayedBalance(), // Gösterilen bakiye
      overdraftLimit: this.overdraftLimit || 0, // Esnek hesap limiti
      overdraftUsed: this.getOverdraftUsed(), // Kullanılan esnek hesap
      overdraftDebt: this.getOverdraftDebt(), // Esnek hesap borcu
      availableBalance: this.getAvailableBalance(), // Kullanılabilir miktar
      remainingOverdraftLimit: this.getRemainingOverdraftLimit(), // Kalan limit
      isUsingOverdraft: this.isUsingOverdraft(),
      currency: this.currency,
      bankId: this.bankId,
      bankName: this.bankName,
      iban: this.iban,
      accountNumber: this.accountNumber,
      isActive: this.isActive,
      isLowBalance: this.isLowBalance(),
      isOverdrawn: this.type === 'overdraft' ? this.isUsingOverdraft() : this.balance < 0,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Account;