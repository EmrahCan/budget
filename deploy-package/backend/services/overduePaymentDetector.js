const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * OverduePaymentDetector - Detects overdue payments across all payment types
 * This service identifies payments that are past their due date and have not been paid
 */
class OverduePaymentDetector {
  /**
   * Detect all overdue payments for a user
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<Object>} Overdue payments by type
   */
  async detectOverduePayments(userId) {
    try {
      logger.info('Detecting overdue payments', { userId });

      const [fixedPayments, creditCards, installments] = await Promise.all([
        this.detectOverdueFixedPayments(userId),
        this.detectOverdueCreditCards(userId),
        this.detectOverdueInstallments(userId),
      ]);

      const result = {
        fixedPayments,
        creditCards,
        installments,
        totalCount: fixedPayments.length + creditCards.length + installments.length,
        totalAmount: this.calculateTotalAmount(fixedPayments, creditCards, installments),
      };

      logger.info('Overdue payments detected', {
        userId,
        totalCount: result.totalCount,
        totalAmount: result.totalAmount,
      });

      return result;
    } catch (error) {
      logger.error('Error detecting overdue payments', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Detect overdue fixed payments
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of overdue fixed payments with days overdue
   */
  async detectOverdueFixedPayments(userId) {
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Get all active fixed payments
      const paymentsResult = await db.query(
        'SELECT * FROM fixed_payments WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const overduePayments = [];

      for (const payment of paymentsResult.rows) {
        // Calculate the due date for this month
        let dueDate = new Date(currentYear, currentMonth - 1, payment.due_day);

        // If the due day doesn't exist in this month (e.g., Feb 30), use last day of month
        if (dueDate.getMonth() !== currentMonth - 1) {
          dueDate = new Date(currentYear, currentMonth, 0);
        }

        // Check if payment is overdue (due date is in the past)
        if (dueDate < today) {
          // Check if payment has been made this month
          const paymentHistoryResult = await db.query(
            `SELECT * FROM fixed_payment_history 
             WHERE fixed_payment_id = $1 
               AND payment_month = $2 
               AND payment_year = $3
               AND is_paid = true
             ORDER BY paid_date DESC
             LIMIT 1`,
            [payment.id, currentMonth, currentYear]
          );

          // If no payment found for this month, it's overdue
          if (paymentHistoryResult.rows.length === 0) {
            const daysOverdue = this.calculateDaysOverdue(dueDate);
            const priority = this.determinePriority(daysOverdue);

            overduePayments.push({
              id: payment.id,
              name: payment.name,
              amount: parseFloat(payment.amount),
              category: payment.category,
              dueDay: payment.due_day,
              dueDate: dueDate.toISOString().split('T')[0],
              daysOverdue,
              priority,
              type: 'fixed_payment',
            });
          }
        }
      }

      logger.debug('Overdue fixed payments detected', {
        userId,
        count: overduePayments.length,
      });

      return overduePayments;
    } catch (error) {
      logger.error('Error detecting overdue fixed payments', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Detect overdue credit card payments
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of overdue credit cards with days overdue
   */
  async detectOverdueCreditCards(userId) {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Get all active credit cards with balance
      const cardsResult = await db.query(
        `SELECT * FROM credit_cards 
         WHERE user_id = $1 
           AND is_active = true 
           AND current_balance > 0 
           AND payment_due_date IS NOT NULL`,
        [userId]
      );

      const overdueCards = [];

      for (const card of cardsResult.rows) {
        // Calculate the due date for this month
        let dueDate = new Date(currentYear, currentMonth - 1, card.payment_due_date);

        // If the due day doesn't exist in this month, use last day of month
        if (dueDate.getMonth() !== currentMonth - 1) {
          dueDate = new Date(currentYear, currentMonth, 0);
        }

        // Check if payment is overdue
        if (dueDate < today) {
          const daysOverdue = this.calculateDaysOverdue(dueDate);
          const priority = this.determinePriority(daysOverdue);
          const currentBalance = parseFloat(card.current_balance);
          const minimumPayment = (currentBalance * parseFloat(card.minimum_payment_rate)) / 100;

          overdueCards.push({
            id: card.id,
            name: card.name,
            currentBalance,
            minimumPayment,
            paymentDueDate: card.payment_due_date,
            dueDate: dueDate.toISOString().split('T')[0],
            daysOverdue,
            priority,
            type: 'credit_card',
          });
        }
      }

      logger.debug('Overdue credit cards detected', {
        userId,
        count: overdueCards.length,
      });

      return overdueCards;
    } catch (error) {
      logger.error('Error detecting overdue credit cards', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Detect overdue installment payments
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of overdue installments with days overdue
   */
  async detectOverdueInstallments(userId) {
    try {
      const today = new Date();

      // Get all active installments with next payment date in the past
      const installmentsResult = await db.query(
        `SELECT * FROM installment_payments 
         WHERE user_id = $1 
           AND is_active = true 
           AND next_payment_date IS NOT NULL 
           AND next_payment_date < CURRENT_DATE`,
        [userId]
      );

      const overdueInstallments = [];

      for (const installment of installmentsResult.rows) {
        const dueDate = new Date(installment.next_payment_date);
        const daysOverdue = this.calculateDaysOverdue(dueDate);
        const priority = this.determinePriority(daysOverdue);

        overdueInstallments.push({
          id: installment.id,
          itemName: installment.item_name,
          category: installment.category,
          installmentAmount: parseFloat(installment.installment_amount),
          totalAmount: parseFloat(installment.total_amount),
          paidAmount: parseFloat(installment.paid_amount),
          remainingAmount: parseFloat(installment.remaining_amount),
          paidInstallments: installment.paid_installments,
          totalInstallments: installment.total_installments,
          nextPaymentDate: installment.next_payment_date,
          dueDate: dueDate.toISOString().split('T')[0],
          daysOverdue,
          priority,
          type: 'installment_payment',
        });
      }

      logger.debug('Overdue installments detected', {
        userId,
        count: overdueInstallments.length,
      });

      return overdueInstallments;
    } catch (error) {
      logger.error('Error detecting overdue installments', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate days overdue for a payment
   * @param {Date} dueDate - Due date
   * @returns {number} Days overdue (positive number)
   */
  calculateDaysOverdue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Determine priority based on days overdue
   * @param {number} daysOverdue - Days overdue
   * @returns {string} Priority level (high, critical)
   */
  determinePriority(daysOverdue) {
    if (daysOverdue >= 7) {
      return 'critical';
    } else if (daysOverdue >= 3) {
      return 'high';
    } else {
      return 'high'; // All overdue payments are at least high priority
    }
  }

  /**
   * Calculate total amount of overdue payments
   * @param {Array} fixedPayments - Overdue fixed payments
   * @param {Array} creditCards - Overdue credit cards
   * @param {Array} installments - Overdue installments
   * @returns {number} Total amount
   */
  calculateTotalAmount(fixedPayments, creditCards, installments) {
    let total = 0;

    // Add fixed payments
    fixedPayments.forEach(payment => {
      total += payment.amount;
    });

    // Add credit card minimum payments
    creditCards.forEach(card => {
      total += card.minimumPayment;
    });

    // Add installment amounts
    installments.forEach(installment => {
      total += installment.installmentAmount;
    });

    return parseFloat(total.toFixed(2));
  }

  /**
   * Get overdue payment summary for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Summary with counts and amounts by type
   */
  async getOverdueSummary(userId) {
    try {
      const overduePayments = await this.detectOverduePayments(userId);

      return {
        totalCount: overduePayments.totalCount,
        totalAmount: overduePayments.totalAmount,
        byType: {
          fixedPayments: {
            count: overduePayments.fixedPayments.length,
            amount: overduePayments.fixedPayments.reduce((sum, p) => sum + p.amount, 0),
            items: overduePayments.fixedPayments,
          },
          creditCards: {
            count: overduePayments.creditCards.length,
            amount: overduePayments.creditCards.reduce((sum, c) => sum + c.minimumPayment, 0),
            items: overduePayments.creditCards,
          },
          installments: {
            count: overduePayments.installments.length,
            amount: overduePayments.installments.reduce((sum, i) => sum + i.installmentAmount, 0),
            items: overduePayments.installments,
          },
        },
        mostOverdue: this.findMostOverdue(overduePayments),
      };
    } catch (error) {
      logger.error('Error getting overdue summary', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find the most overdue payment
   * @param {Object} overduePayments - All overdue payments
   * @returns {Object|null} Most overdue payment
   */
  findMostOverdue(overduePayments) {
    const allPayments = [
      ...overduePayments.fixedPayments.map(p => ({
        name: p.name,
        daysOverdue: p.daysOverdue,
        amount: p.amount,
        type: 'fixed_payment',
      })),
      ...overduePayments.creditCards.map(c => ({
        name: c.name,
        daysOverdue: c.daysOverdue,
        amount: c.currentBalance,
        type: 'credit_card',
      })),
      ...overduePayments.installments.map(i => ({
        name: i.itemName,
        daysOverdue: i.daysOverdue,
        amount: i.installmentAmount,
        type: 'installment_payment',
      })),
    ];

    if (allPayments.length === 0) {
      return null;
    }

    // Sort by days overdue (descending)
    allPayments.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return allPayments[0];
  }
}

// Export singleton instance
module.exports = new OverduePaymentDetector();
