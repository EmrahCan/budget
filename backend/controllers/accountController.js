const Account = require('../models/Account');

class AccountController {
  // Get all accounts for the authenticated user
  static async getAllAccounts(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 50, includeInactive = false, type } = req.query;

      const accounts = await Account.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        includeInactive: includeInactive === 'true',
        type
      });

      // Calculate total balance
      const totalBalance = accounts
        .filter(account => account.isActive)
        .reduce((sum, account) => sum + account.balance, 0);

      res.json({
        success: true,
        data: {
          accounts: accounts.map(account => account.toJSON()),
          summary: {
            totalAccounts: accounts.length,
            activeAccounts: accounts.filter(a => a.isActive).length,
            totalBalance: Math.round(totalBalance * 100) / 100,
            accountsByType: accounts.reduce((acc, account) => {
              acc[account.type] = (acc[account.type] || 0) + 1;
              return acc;
            }, {})
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: accounts.length
          }
        }
      });
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesaplar alınırken hata oluştu'
      });
    }
  }

  // Get a specific account
  static async getAccount(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      // Get account statistics
      const statistics = await account.getStatistics();

      res.json({
        success: true,
        data: {
          account: account.toJSON(),
          statistics
        }
      });
    } catch (error) {
      console.error('Get account error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap bilgileri alınırken hata oluştu'
      });
    }
  }

  // Create a new account
  static async createAccount(req, res) {
    try {
      const userId = req.user.id;
      const accountData = req.body;

      const account = await Account.create(userId, accountData);

      res.status(201).json({
        success: true,
        message: 'Hesap başarıyla oluşturuldu',
        data: {
          account: account.toJSON()
        }
      });
    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Hesap oluşturulurken hata oluştu'
      });
    }
  }

  // Update an account
  static async updateAccount(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      await account.update(updateData);

      res.json({
        success: true,
        message: 'Hesap başarıyla güncellendi',
        data: {
          account: account.toJSON()
        }
      });
    } catch (error) {
      console.error('Update account error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Hesap güncellenirken hata oluştu'
      });
    }
  }

  // Delete an account
  static async deleteAccount(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      const result = await account.delete();

      const message = result.deleted 
        ? 'Hesap başarıyla silindi'
        : 'Hesap devre dışı bırakıldı (işlem geçmişi nedeniyle)';

      res.json({
        success: true,
        message,
        data: {
          deleted: result.deleted,
          deactivated: result.deactivated
        }
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap silinirken hata oluştu'
      });
    }
  }

  // Add income to account
  static async addIncome(req, res) {
    try {
      const { id } = req.params;
      const { amount, description, category } = req.body;
      const userId = req.user.id;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      const result = await account.addIncome(amount, description, category);

      res.json({
        success: true,
        message: 'Gelir başarıyla eklendi',
        data: {
          account: result.account.toJSON(),
          transaction: result.transaction
        }
      });
    } catch (error) {
      console.error('Add income error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Gelir eklenirken hata oluştu'
      });
    }
  }

  // Add expense to account
  static async addExpense(req, res) {
    try {
      const { id } = req.params;
      const { amount, description, category, allowNegative = false } = req.body;
      const userId = req.user.id;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      const result = await account.addExpense(amount, description, category, allowNegative);

      res.json({
        success: true,
        message: 'Gider başarıyla eklendi',
        data: {
          account: result.account.toJSON(),
          transaction: result.transaction
        }
      });
    } catch (error) {
      console.error('Add expense error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Gider eklenirken hata oluştu'
      });
    }
  }

  // Transfer between accounts
  static async transferFunds(req, res) {
    try {
      const { sourceAccountId, targetAccountId, amount, description } = req.body;
      const userId = req.user.id;

      // Get both accounts
      const sourceAccount = await Account.findById(sourceAccountId, userId);
      if (!sourceAccount) {
        return res.status(404).json({
          success: false,
          message: 'Kaynak hesap bulunamadı'
        });
      }

      const targetAccount = await Account.findById(targetAccountId);
      if (!targetAccount) {
        return res.status(404).json({
          success: false,
          message: 'Hedef hesap bulunamadı'
        });
      }

      const result = await sourceAccount.transferTo(targetAccount, amount, description);

      res.json({
        success: true,
        message: 'Transfer başarıyla tamamlandı',
        data: {
          sourceAccount: result.sourceAccount.toJSON(),
          targetAccount: result.targetAccount.toJSON(),
          outgoingTransaction: result.outgoingTransaction,
          incomingTransaction: result.incomingTransaction
        }
      });
    } catch (error) {
      console.error('Transfer funds error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Transfer işlemi sırasında hata oluştu'
      });
    }
  }

  // Get account transactions
  static async getAccountTransactions(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, startDate, endDate, type, category } = req.query;
      const userId = req.user.id;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      const transactions = await account.getTransactions({
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        type,
        category
      });

      res.json({
        success: true,
        data: {
          transactions,
          account: account.toJSON(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length
          }
        }
      });
    } catch (error) {
      console.error('Get account transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap işlemleri alınırken hata oluştu'
      });
    }
  }

  // Update account balance manually
  static async updateBalance(req, res) {
    try {
      const { id } = req.params;
      const { balance, operation = 'set' } = req.body;
      const userId = req.user.id;

      const account = await Account.findById(id, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Hesap bulunamadı'
        });
      }

      await account.updateBalance(balance, operation);

      res.json({
        success: true,
        message: 'Hesap bakiyesi güncellendi',
        data: {
          account: account.toJSON()
        }
      });
    } catch (error) {
      console.error('Update balance error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Bakiye güncellenirken hata oluştu'
      });
    }
  }

  // Get account summary for dashboard
  static async getAccountSummary(req, res) {
    try {
      const userId = req.user.id;

      const accounts = await Account.findByUserId(userId, { includeInactive: false });
      
      const summary = {
        totalBalance: 0,
        accountsByType: {},
        lowBalanceAccounts: [],
        overdrawnAccounts: [],
        recentActivity: []
      };

      for (const account of accounts) {
        // Calculate totals
        summary.totalBalance += account.balance;
        
        // Group by type
        if (!summary.accountsByType[account.type]) {
          summary.accountsByType[account.type] = {
            count: 0,
            totalBalance: 0,
            accounts: []
          };
        }
        
        summary.accountsByType[account.type].count++;
        summary.accountsByType[account.type].totalBalance += account.balance;
        summary.accountsByType[account.type].accounts.push(account.toJSON());

        // Check for alerts
        if (account.isLowBalance()) {
          summary.lowBalanceAccounts.push(account.toJSON());
        }
        
        if (account.isOverdrawn()) {
          summary.overdrawnAccounts.push(account.toJSON());
        }

        // Get recent transactions (last 5 per account)
        const recentTransactions = await account.getTransactions({ limit: 5 });
        summary.recentActivity.push(...recentTransactions);
      }

      // Sort recent activity by date
      summary.recentActivity.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
      summary.recentActivity = summary.recentActivity.slice(0, 10); // Keep only top 10

      summary.totalBalance = Math.round(summary.totalBalance * 100) / 100;

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get account summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap özeti alınırken hata oluştu'
      });
    }
  }
}

module.exports = AccountController;