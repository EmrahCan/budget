const db = require('../utils/database');
const { validationResult } = require('express-validator');

class ReportController {
  // Get financial overview for a specific period
  static async getFinancialOverview(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      // Default to current month if no dates provided
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      // Get transactions summary
      const transactionsQuery = `
        SELECT 
          type,
          category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3
        GROUP BY type, category
        ORDER BY type, total_amount DESC
      `;
      
      const transactions = await db.query(transactionsQuery, [userId, start, end]);

      // Get accounts summary
      const accountsQuery = `
        SELECT 
          type,
          SUM(balance) as total_balance,
          COUNT(*) as account_count
        FROM accounts 
        WHERE user_id = $1 AND is_active = true
        GROUP BY type
      `;
      
      const accounts = await db.query(accountsQuery, [userId]);

      // Get credit cards summary
      const creditCardsQuery = `
        SELECT 
          SUM(current_balance) as total_debt,
          SUM(credit_limit) as total_limit,
          COUNT(*) as card_count,
          AVG(interest_rate) as avg_interest_rate
        FROM credit_cards 
        WHERE user_id = $1 AND is_active = true
      `;
      
      const creditCards = await db.query(creditCardsQuery, [userId]);

      // Calculate totals
      const income = transactions.rows
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
      
      const expenses = transactions.rows
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);

      const totalBalance = accounts.rows
        .reduce((sum, a) => sum + parseFloat(a.total_balance), 0);

      const creditCardDebt = parseFloat(creditCards.rows[0]?.total_debt || 0);
      const netWorth = totalBalance - creditCardDebt;

      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          summary: {
            income,
            expenses,
            netIncome: income - expenses,
            totalBalance,
            creditCardDebt,
            netWorth
          },
          transactions: transactions.rows,
          accounts: accounts.rows,
          creditCards: creditCards.rows[0] || {}
        }
      });
    } catch (error) {
      console.error('Error generating financial overview:', error);
      res.status(500).json({
        success: false,
        message: 'Finansal özet oluşturulurken hata oluştu'
      });
    }
  }

  // Get category breakdown for expenses
  static async getCategoryBreakdown(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate, type = 'expense' } = req.query;
      
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const query = `
        SELECT 
          COALESCE(category, 'Kategori Yok') as category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM transactions 
        WHERE user_id = $1 AND type = $2 AND transaction_date BETWEEN $3 AND $4
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      const result = await db.query(query, [userId, type, start, end]);
      
      const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
      
      const categoryData = result.rows.map(row => ({
        category: row.category,
        amount: parseFloat(row.total_amount),
        percentage: totalAmount > 0 ? (parseFloat(row.total_amount) / totalAmount * 100).toFixed(1) : 0,
        transactionCount: parseInt(row.transaction_count),
        avgAmount: parseFloat(row.avg_amount),
        minAmount: parseFloat(row.min_amount),
        maxAmount: parseFloat(row.max_amount)
      }));

      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          type,
          totalAmount,
          categories: categoryData
        }
      });
    } catch (error) {
      console.error('Error generating category breakdown:', error);
      res.status(500).json({
        success: false,
        message: 'Kategori analizi oluşturulurken hata oluştu'
      });
    }
  }

  // Get monthly trends
  static async getMonthlyTrends(req, res) {
    try {
      const userId = req.user.id;
      const { months = 12 } = req.query;
      
      const query = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          type,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
        GROUP BY DATE_TRUNC('month', transaction_date), type
        ORDER BY month DESC, type
      `;
      
      const result = await db.query(query, [userId]);
      
      // Group by month
      const monthlyData = {};
      result.rows.forEach(row => {
        const month = row.month.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expense: 0, netIncome: 0 };
        }
        monthlyData[month][row.type] = parseFloat(row.total_amount);
      });
      
      // Calculate net income and sort
      const trends = Object.values(monthlyData).map(data => ({
        ...data,
        netIncome: data.income - data.expense
      })).sort((a, b) => a.month.localeCompare(b.month));

      res.json({
        success: true,
        data: {
          months: parseInt(months),
          trends
        }
      });
    } catch (error) {
      console.error('Error generating monthly trends:', error);
      res.status(500).json({
        success: false,
        message: 'Aylık trendler oluşturulurken hata oluştu'
      });
    }
  }

  // Get installments overview
  static async getInstallmentsOverview(req, res) {
    try {
      const userId = req.user.id;
      
      // Get all installment types
      const queries = await Promise.all([
        // Credit cards
        db.query(`
          SELECT 
            'credit_card' as type,
            name as item_name,
            current_balance as remaining_amount,
            minimum_payment as monthly_payment,
            next_payment_date,
            interest_rate
          FROM credit_cards 
          WHERE user_id = $1 AND is_active = true AND current_balance > 0
        `, [userId]),
        
        // Land payments
        db.query(`
          SELECT 
            'land_payment' as type,
            land_name as item_name,
            remaining_amount,
            monthly_installment as monthly_payment,
            next_payment_date,
            interest_rate
          FROM land_payments 
          WHERE user_id = $1 AND is_active = true AND remaining_amount > 0
        `, [userId]),
        
        // Installment payments
        db.query(`
          SELECT 
            'installment_payment' as type,
            item_name,
            remaining_amount,
            installment_amount as monthly_payment,
            next_payment_date,
            interest_rate
          FROM installment_payments 
          WHERE user_id = $1 AND is_active = true AND remaining_amount > 0
        `, [userId])
      ]);

      const allInstallments = [
        ...queries[0].rows,
        ...queries[1].rows,
        ...queries[2].rows
      ];

      const summary = {
        totalDebt: allInstallments.reduce((sum, item) => sum + parseFloat(item.remaining_amount), 0),
        monthlyPayments: allInstallments.reduce((sum, item) => sum + parseFloat(item.monthly_payment), 0),
        totalItems: allInstallments.length,
        avgInterestRate: allInstallments.length > 0 
          ? allInstallments.reduce((sum, item) => sum + parseFloat(item.interest_rate || 0), 0) / allInstallments.length 
          : 0
      };

      // Group by type
      const byType = {
        credit_card: allInstallments.filter(item => item.type === 'credit_card'),
        land_payment: allInstallments.filter(item => item.type === 'land_payment'),
        installment_payment: allInstallments.filter(item => item.type === 'installment_payment')
      };

      res.json({
        success: true,
        data: {
          summary,
          byType,
          allInstallments: allInstallments.sort((a, b) => 
            new Date(a.next_payment_date || '9999-12-31') - new Date(b.next_payment_date || '9999-12-31')
          )
        }
      });
    } catch (error) {
      console.error('Error generating installments overview:', error);
      res.status(500).json({
        success: false,
        message: 'Taksit özeti oluşturulurken hata oluştu'
      });
    }
  }

  // Get net worth history
  static async getNetWorthHistory(req, res) {
    try {
      const userId = req.user.id;
      const { months = 12 } = req.query;
      
      // This is a simplified version - in a real app, you'd store historical snapshots
      // For now, we'll calculate based on transaction history
      const query = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_change
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month
      `;
      
      const result = await db.query(query, [userId]);
      
      // Get current balances
      const currentBalanceQuery = `
        SELECT SUM(balance) as total_balance FROM accounts WHERE user_id = $1 AND is_active = true
      `;
      const currentDebtQuery = `
        SELECT SUM(current_balance) as total_debt FROM credit_cards WHERE user_id = $1 AND is_active = true
      `;
      
      const [balanceResult, debtResult] = await Promise.all([
        db.query(currentBalanceQuery, [userId]),
        db.query(currentDebtQuery, [userId])
      ]);
      
      const currentBalance = parseFloat(balanceResult.rows[0]?.total_balance || 0);
      const currentDebt = parseFloat(debtResult.rows[0]?.total_debt || 0);
      const currentNetWorth = currentBalance - currentDebt;
      
      // Calculate historical net worth (simplified)
      let runningNetWorth = currentNetWorth;
      const history = result.rows.reverse().map(row => {
        const month = row.month.toISOString().split('T')[0].substring(0, 7);
        const netChange = parseFloat(row.net_change);
        const netWorth = runningNetWorth;
        runningNetWorth -= netChange; // Go backwards in time
        
        return {
          month,
          netWorth,
          netChange,
          balance: netWorth + currentDebt, // Approximate
          debt: currentDebt // Simplified - assumes debt is constant
        };
      }).reverse();

      res.json({
        success: true,
        data: {
          months: parseInt(months),
          currentNetWorth,
          history
        }
      });
    } catch (error) {
      console.error('Error generating net worth history:', error);
      res.status(500).json({
        success: false,
        message: 'Net değer geçmişi oluşturulurken hata oluştu'
      });
    }
  }

  // Export data to CSV format
  static async exportData(req, res) {
    try {
      const userId = req.user.id;
      const { type, startDate, endDate } = req.query;
      
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      let query, filename;
      
      switch (type) {
        case 'transactions':
          query = `
            SELECT 
              transaction_date as "Tarih",
              type as "Tür",
              amount as "Tutar",
              description as "Açıklama",
              category as "Kategori"
            FROM transactions 
            WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3
            ORDER BY transaction_date DESC
          `;
          filename = `transactions_${start}_${end}.csv`;
          break;
          
        case 'installments':
          query = `
            SELECT 
              item_name as "Ürün",
              category as "Kategori",
              total_amount as "Toplam Tutar",
              paid_amount as "Ödenen",
              remaining_amount as "Kalan",
              installment_amount as "Aylık Taksit",
              total_installments as "Toplam Taksit",
              paid_installments as "Ödenen Taksit"
            FROM installment_payments 
            WHERE user_id = $1 AND is_active = true
            ORDER BY created_at DESC
          `;
          filename = `installments_${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Geçersiz export türü'
          });
      }
      
      const result = await db.query(query, type === 'installments' ? [userId] : [userId, start, end]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Export edilecek veri bulunamadı'
        });
      }
      
      // Convert to CSV
      const headers = Object.keys(result.rows[0]);
      const csvContent = [
        headers.join(','),
        ...result.rows.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csvContent); // Add BOM for proper UTF-8 encoding
      
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Veri export edilirken hata oluştu'
      });
    }
  }
}

module.exports = ReportController;