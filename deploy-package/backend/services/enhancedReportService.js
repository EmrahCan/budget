const db = require('../utils/database');

class EnhancedReportService {
  // Collect all financial data for a user
  async collectFinancialData(userId) {
    try {
      // Get all accounts
      const accountsQuery = `
        SELECT 
          type,
          name,
          balance,
          currency,
          is_active
        FROM accounts 
        WHERE user_id = $1 AND is_active = true
        ORDER BY type, balance DESC
      `;
      const accounts = await db.query(accountsQuery, [userId]);

      // Get all credit cards
      const creditCardsQuery = `
        SELECT 
          name,
          credit_limit,
          current_balance,
          interest_rate,
          payment_due_date as next_payment_date
        FROM credit_cards 
        WHERE user_id = $1 AND is_active = true
        ORDER BY current_balance DESC
      `;
      const creditCards = await db.query(creditCardsQuery, [userId]);

      // Get all fixed payments
      const fixedPaymentsQuery = `
        SELECT 
          name,
          amount,
          category,
          due_day,
          is_active
        FROM fixed_payments 
        WHERE user_id = $1 AND is_active = true
        ORDER BY amount DESC
      `;
      const fixedPayments = await db.query(fixedPaymentsQuery, [userId]);

      // Get all installment payments
      const installmentsQuery = `
        SELECT 
          item_name,
          category,
          total_amount,
          paid_amount,
          remaining_amount,
          installment_amount,
          total_installments,
          paid_installments,
          remaining_installments,
          interest_rate,
          next_payment_date
        FROM installment_payments 
        WHERE user_id = $1 AND is_active = true
        ORDER BY remaining_amount DESC
      `;
      const installments = await db.query(installmentsQuery, [userId]);

      // Get recent transactions (last 3 months)
      const transactionsQuery = `
        SELECT 
          type,
          amount,
          category,
          description,
          transaction_date
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_date >= CURRENT_DATE - INTERVAL '3 months'
        ORDER BY transaction_date DESC
        LIMIT 100
      `;
      const transactions = await db.query(transactionsQuery, [userId]);

      // Calculate summaries
      const totalAssets = accounts.rows.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const totalCreditCardDebt = creditCards.rows.reduce((sum, cc) => sum + parseFloat(cc.current_balance), 0);
      const totalCreditLimit = creditCards.rows.reduce((sum, cc) => sum + parseFloat(cc.credit_limit), 0);
      const monthlyFixedPayments = fixedPayments.rows.reduce((sum, fp) => sum + parseFloat(fp.amount), 0);
      const monthlyInstallments = installments.rows.reduce((sum, inst) => sum + parseFloat(inst.installment_amount), 0);
      const totalInstallmentDebt = installments.rows.reduce((sum, inst) => sum + parseFloat(inst.remaining_amount), 0);

      // Calculate income and expenses from transactions
      const income = transactions.rows
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = transactions.rows
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate category breakdown
      const categoryBreakdown = {};
      transactions.rows
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const category = t.category || 'Diğer';
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = 0;
          }
          categoryBreakdown[category] += parseFloat(t.amount);
        });

      return {
        summary: {
          totalAssets,
          totalCreditCardDebt,
          totalCreditLimit,
          creditUtilization: totalCreditLimit > 0 ? (totalCreditCardDebt / totalCreditLimit * 100).toFixed(1) : 0,
          monthlyFixedPayments,
          monthlyInstallments,
          totalMonthlyObligations: monthlyFixedPayments + monthlyInstallments,
          totalInstallmentDebt,
          totalDebt: totalCreditCardDebt + totalInstallmentDebt,
          netWorth: totalAssets - (totalCreditCardDebt + totalInstallmentDebt),
          monthlyIncome: income / 3, // Average over 3 months
          monthlyExpenses: expenses / 3,
          monthlySavings: (income - expenses) / 3
        },
        accounts: accounts.rows,
        creditCards: creditCards.rows,
        fixedPayments: fixedPayments.rows,
        installments: installments.rows,
        recentTransactions: transactions.rows.slice(0, 20), // Last 20 transactions
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error collecting financial data:', error);
      throw error;
    }
  }

  // Format financial data for AI analysis
  formatForAI(financialData) {
    const { summary, accounts, creditCards, fixedPayments, installments, categoryBreakdown } = financialData;

    return {
      finansalOzet: {
        toplamVarlik: `${summary.totalAssets.toFixed(2)} TL`,
        toplamBorc: `${summary.totalDebt.toFixed(2)} TL`,
        netDeger: `${summary.netWorth.toFixed(2)} TL`,
        aylikGelir: `${summary.monthlyIncome.toFixed(2)} TL`,
        aylikGider: `${summary.monthlyExpenses.toFixed(2)} TL`,
        aylikTasarruf: `${summary.monthlySavings.toFixed(2)} TL`,
        aylikYukumlulukler: `${summary.totalMonthlyObligations.toFixed(2)} TL`
      },
      krediKartlari: {
        toplamLimit: `${summary.totalCreditLimit.toFixed(2)} TL`,
        kullanilanTutar: `${summary.totalCreditCardDebt.toFixed(2)} TL`,
        kullanimOrani: `%${summary.creditUtilization}`,
        kartSayisi: creditCards.length,
        kartlar: creditCards.map(cc => ({
          isim: cc.name,
          limit: `${parseFloat(cc.credit_limit).toFixed(2)} TL`,
          bakiye: `${parseFloat(cc.current_balance).toFixed(2)} TL`,
          kullanimOrani: `%${(parseFloat(cc.current_balance) / parseFloat(cc.credit_limit) * 100).toFixed(1)}`,
          faizOrani: `%${parseFloat(cc.interest_rate || 0).toFixed(1)}`
        }))
      },
      sabitOdemeler: {
        aylikToplam: `${summary.monthlyFixedPayments.toFixed(2)} TL`,
        odemeSayisi: fixedPayments.length,
        odemeler: fixedPayments.map(fp => ({
          isim: fp.name,
          tutar: `${parseFloat(fp.amount).toFixed(2)} TL`,
          kategori: fp.category,
          odemeGunu: fp.due_day
        }))
      },
      taksitler: {
        aylikToplam: `${summary.monthlyInstallments.toFixed(2)} TL`,
        toplamBorc: `${summary.totalInstallmentDebt.toFixed(2)} TL`,
        taksitSayisi: installments.length,
        taksitler: installments.map(inst => ({
          urun: inst.item_name,
          kalanBorc: `${parseFloat(inst.remaining_amount).toFixed(2)} TL`,
          aylikTaksit: `${parseFloat(inst.installment_amount).toFixed(2)} TL`,
          kalanTaksit: inst.remaining_installments
        }))
      },
      harcamaKategorileri: Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({
          kategori: category,
          tutar: `${amount.toFixed(2)} TL`,
          oran: `%${(amount / summary.monthlyExpenses * 100).toFixed(1)}`
        }))
        .sort((a, b) => parseFloat(b.tutar) - parseFloat(a.tutar))
    };
  }
}

module.exports = new EnhancedReportService();
