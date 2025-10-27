const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const CreditCard = require('../models/CreditCard');

class TransactionController {
  // Get all transactions for the authenticated user
  static async getAllTransactions(req, res) {
    try {
      const userId = req.user.id;
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
      } = req.query;

      const transactions = await Transaction.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        type,
        category,
        accountId,
        creditCardId,
        search
      });

      // Get total count for pagination (simplified)
      const totalQuery = await Transaction.findByUserId(userId, {
        page: 1,
        limit: 1000, // Get a large number to count
        startDate,
        endDate,
        type,
        category,
        accountId,
        creditCardId,
        search
      });

      res.json({
        success: true,
        data: {
          transactions: transactions.map(transaction => transaction.toJSON()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalQuery.length,
            totalPages: Math.ceil(totalQuery.length / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'İşlemler alınırken hata oluştu'
      });
    }
  }

  // Get a specific transaction
  static async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findById(id, userId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'İşlem bulunamadı'
        });
      }

      res.json({
        success: true,
        data: {
          transaction: transaction.toJSON()
        }
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem bilgileri alınırken hata oluştu'
      });
    }
  }

  // Create a new transaction
  static async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionData = req.body;

      // Validate account or credit card ownership
      if (transactionData.accountId) {
        const account = await Account.findById(transactionData.accountId, userId);
        if (!account) {
          return res.status(404).json({
            success: false,
            message: 'Hesap bulunamadı'
          });
        }
      }

      if (transactionData.creditCardId) {
        const creditCard = await CreditCard.findById(transactionData.creditCardId, userId);
        if (!creditCard) {
          return res.status(404).json({
            success: false,
            message: 'Kredi kartı bulunamadı'
          });
        }
      }

      const transaction = await Transaction.create(userId, transactionData);

      res.status(201).json({
        success: true,
        message: 'İşlem başarıyla oluşturuldu',
        data: {
          transaction: transaction.toJSON()
        }
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'İşlem oluşturulurken hata oluştu'
      });
    }
  }

  // Update a transaction
  static async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const transaction = await Transaction.findById(id, userId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'İşlem bulunamadı'
        });
      }

      await transaction.update(updateData);

      res.json({
        success: true,
        message: 'İşlem başarıyla güncellendi',
        data: {
          transaction: transaction.toJSON()
        }
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'İşlem güncellenirken hata oluştu'
      });
    }
  }

  // Delete a transaction
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findById(id, userId);
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'İşlem bulunamadı'
        });
      }

      await transaction.delete();

      res.json({
        success: true,
        message: 'İşlem başarıyla silindi'
      });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem silinirken hata oluştu'
      });
    }
  }

  // Get transaction categories
  static async getCategories(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      const categories = await Transaction.getCategories(userId, type);

      res.json({
        success: true,
        data: {
          categories: categories.map(cat => ({
            name: cat.category,
            usageCount: parseInt(cat.usage_count)
          }))
        }
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriler alınırken hata oluştu'
      });
    }
  }

  // Get monthly summary
  static async getMonthlySummary(req, res) {
    try {
      const userId = req.user.id;
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

      const summary = await Transaction.getMonthlySummary(
        userId, 
        parseInt(year), 
        parseInt(month)
      );

      res.json({
        success: true,
        data: {
          year: parseInt(year),
          month: parseInt(month),
          summary
        }
      });
    } catch (error) {
      console.error('Get monthly summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Aylık özet alınırken hata oluştu'
      });
    }
  }

  // Get category breakdown
  static async getCategoryBreakdown(req, res) {
    try {
      const userId = req.user.id;
      const { 
        startDate, 
        endDate, 
        type = 'expense',
        limit = 10 
      } = req.query;

      const breakdown = await Transaction.getCategoryBreakdown(userId, {
        startDate,
        endDate,
        type,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          breakdown,
          type,
          period: { startDate, endDate }
        }
      });
    } catch (error) {
      console.error('Get category breakdown error:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori analizi alınırken hata oluştu'
      });
    }
  }

  // Get spending trends
  static async getSpendingTrends(req, res) {
    try {
      const userId = req.user.id;
      const { months = 12 } = req.query;

      const trends = await Transaction.getSpendingTrends(userId, parseInt(months));

      res.json({
        success: true,
        data: {
          trends,
          period: `${months} months`
        }
      });
    } catch (error) {
      console.error('Get spending trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Harcama trendleri alınırken hata oluştu'
      });
    }
  }

  // Get recent transactions
  static async getRecentTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;

      const transactions = await Transaction.findByUserId(userId, {
        page: 1,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          transactions: transactions.map(transaction => transaction.toJSON()),
          count: transactions.length
        }
      });
    } catch (error) {
      console.error('Get recent transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Son işlemler alınırken hata oluştu'
      });
    }
  }

  // Search transactions
  static async searchTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { 
        query: searchQuery, 
        page = 1, 
        limit = 20,
        type,
        startDate,
        endDate
      } = req.query;

      if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Arama terimi en az 2 karakter olmalıdır'
        });
      }

      const transactions = await Transaction.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        search: searchQuery.trim(),
        type,
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: {
          transactions: transactions.map(transaction => transaction.toJSON()),
          searchQuery: searchQuery.trim(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length
          }
        }
      });
    } catch (error) {
      console.error('Search transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem arama sırasında hata oluştu'
      });
    }
  }

  // Get transaction statistics
  static async getTransactionStatistics(req, res) {
    try {
      const userId = req.user.id;
      const { months = 12 } = req.query;

      // Get various statistics
      const [
        trends,
        expenseBreakdown,
        incomeBreakdown,
        recentTransactions
      ] = await Promise.all([
        Transaction.getSpendingTrends(userId, parseInt(months)),
        Transaction.getCategoryBreakdown(userId, { type: 'expense', limit: 5 }),
        Transaction.getCategoryBreakdown(userId, { type: 'income', limit: 5 }),
        Transaction.findByUserId(userId, { limit: 5 })
      ]);

      // Calculate totals
      const totalExpense = trends.reduce((sum, trend) => sum + trend.expense, 0);
      const totalIncome = trends.reduce((sum, trend) => sum + trend.income, 0);
      const netIncome = totalIncome - totalExpense;

      // Calculate averages
      const avgMonthlyExpense = trends.length > 0 ? totalExpense / trends.length : 0;
      const avgMonthlyIncome = trends.length > 0 ? totalIncome / trends.length : 0;

      res.json({
        success: true,
        data: {
          period: `${months} months`,
          totals: {
            income: Math.round(totalIncome * 100) / 100,
            expense: Math.round(totalExpense * 100) / 100,
            netIncome: Math.round(netIncome * 100) / 100
          },
          averages: {
            monthlyIncome: Math.round(avgMonthlyIncome * 100) / 100,
            monthlyExpense: Math.round(avgMonthlyExpense * 100) / 100
          },
          trends,
          topExpenseCategories: expenseBreakdown,
          topIncomeCategories: incomeBreakdown,
          recentTransactions: recentTransactions.map(t => t.toJSON())
        }
      });
    } catch (error) {
      console.error('Get transaction statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'İşlem istatistikleri alınırken hata oluştu'
      });
    }
  }

  // Bulk delete transactions
  static async bulkDeleteTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { transactionIds } = req.body;

      if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'İşlem ID\'leri gereklidir'
        });
      }

      let deletedCount = 0;
      const errors = [];

      for (const id of transactionIds) {
        try {
          const transaction = await Transaction.findById(id, userId);
          if (transaction) {
            await transaction.delete();
            deletedCount++;
          } else {
            errors.push(`İşlem bulunamadı: ${id}`);
          }
        } catch (error) {
          errors.push(`İşlem silinemedi (${id}): ${error.message}`);
        }
      }

      res.json({
        success: true,
        message: `${deletedCount} işlem başarıyla silindi`,
        data: {
          deletedCount,
          totalRequested: transactionIds.length,
          errors: errors.length > 0 ? errors : null
        }
      });
    } catch (error) {
      console.error('Bulk delete transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Toplu silme işlemi sırasında hata oluştu'
      });
    }
  }
}

module.exports = TransactionController;