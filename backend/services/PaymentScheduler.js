const CreditCard = require('../models/CreditCard');
const DatabaseUtils = require('../utils/database');

class PaymentScheduler {
  // Get upcoming payments for all user's credit cards
  static async getUpcomingPayments(userId, daysAhead = 30) {
    try {
      const creditCards = await CreditCard.findByUserId(userId, { includeInactive: false });
      const upcomingPayments = [];
      const today = new Date();

      creditCards.forEach(card => {
        if (card.paymentDueDate && card.currentBalance > 0) {
          const nextDueDate = card.getNextPaymentDueDate();
          const daysUntil = card.getDaysUntilPayment();

          if (nextDueDate && daysUntil <= daysAhead) {
            upcomingPayments.push({
              creditCardId: card.id,
              creditCardName: card.name,
              bankName: card.bankName,
              dueDate: nextDueDate,
              daysUntil: daysUntil,
              minimumPayment: card.getMinimumPayment(),
              currentBalance: card.currentBalance,
              isOverdue: card.isPaymentOverdue(),
              priority: this.calculatePaymentPriority(card, daysUntil)
            });
          }
        }
      });

      // Sort by priority (overdue first, then by days until due)
      upcomingPayments.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysUntil - b.daysUntil;
      });

      return upcomingPayments;
    } catch (error) {
      console.error('Error getting upcoming payments:', error);
      throw error;
    }
  }

  // Calculate payment priority
  static calculatePaymentPriority(card, daysUntil) {
    if (card.isPaymentOverdue()) return 'critical';
    if (daysUntil <= 3) return 'urgent';
    if (daysUntil <= 7) return 'high';
    if (daysUntil <= 14) return 'medium';
    return 'low';
  }

  // Get payment reminders
  static async getPaymentReminders(userId) {
    try {
      const upcomingPayments = await this.getUpcomingPayments(userId, 7);
      const reminders = [];

      upcomingPayments.forEach(payment => {
        let message = '';
        let type = 'info';

        if (payment.isOverdue) {
          message = `${payment.creditCardName} kartınızın ödemesi gecikmiş! Minimum ödeme: ${payment.minimumPayment} TL`;
          type = 'error';
        } else if (payment.daysUntil === 0) {
          message = `${payment.creditCardName} kartınızın ödemesi bugün! Minimum ödeme: ${payment.minimumPayment} TL`;
          type = 'warning';
        } else if (payment.daysUntil <= 3) {
          message = `${payment.creditCardName} kartınızın ödemesi ${payment.daysUntil} gün sonra. Minimum ödeme: ${payment.minimumPayment} TL`;
          type = 'warning';
        } else if (payment.daysUntil <= 7) {
          message = `${payment.creditCardName} kartınızın ödemesi ${payment.daysUntil} gün sonra. Minimum ödeme: ${payment.minimumPayment} TL`;
          type = 'info';
        }

        if (message) {
          reminders.push({
            creditCardId: payment.creditCardId,
            type,
            message,
            dueDate: payment.dueDate,
            daysUntil: payment.daysUntil,
            minimumPayment: payment.minimumPayment
          });
        }
      });

      return reminders;
    } catch (error) {
      console.error('Error getting payment reminders:', error);
      throw error;
    }
  }

  // Create payment notifications
  static async createPaymentNotifications(userId) {
    try {
      const reminders = await this.getPaymentReminders(userId);
      const notifications = [];

      for (const reminder of reminders) {
        // Check if notification already exists for this card and date
        const existingQuery = `
          SELECT id FROM notifications 
          WHERE user_id = $1 AND type = 'payment_due' 
          AND message LIKE $2
          AND created_at >= CURRENT_DATE
        `;
        
        const existing = await DatabaseUtils.query(existingQuery, [
          userId, 
          `%${reminder.creditCardId}%`
        ]);

        if (existing.rows.length === 0) {
          const insertQuery = `
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, 'payment_due')
            RETURNING *
          `;

          const title = reminder.type === 'error' ? 'Geciken Ödeme!' : 
                       reminder.type === 'warning' ? 'Ödeme Hatırlatması' : 
                       'Yaklaşan Ödeme';

          const result = await DatabaseUtils.query(insertQuery, [
            userId,
            title,
            reminder.message
          ]);

          notifications.push(result.rows[0]);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error creating payment notifications:', error);
      throw error;
    }
  }

  // Get monthly payment calendar
  static async getMonthlyPaymentCalendar(userId, year, month) {
    try {
      const creditCards = await CreditCard.findByUserId(userId, { includeInactive: false });
      const calendar = {};

      // Initialize calendar days
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        calendar[day] = [];
      }

      creditCards.forEach(card => {
        if (card.paymentDueDate && card.currentBalance > 0) {
          const dueDay = card.paymentDueDate;
          
          if (dueDay <= daysInMonth) {
            calendar[dueDay].push({
              creditCardId: card.id,
              creditCardName: card.name,
              bankName: card.bankName,
              minimumPayment: card.getMinimumPayment(),
              currentBalance: card.currentBalance,
              interestRate: card.interestRate
            });
          }
        }
      });

      return {
        year,
        month,
        calendar,
        totalMinimumPayments: Object.values(calendar)
          .flat()
          .reduce((sum, payment) => sum + payment.minimumPayment, 0)
      };
    } catch (error) {
      console.error('Error getting monthly payment calendar:', error);
      throw error;
    }
  }

  // Schedule automatic payment reminders (would be called by cron job)
  static async schedulePaymentReminders() {
    try {
      // Get all users with active credit cards
      const query = `
        SELECT DISTINCT u.id, u.email, u.first_name
        FROM users u
        INNER JOIN credit_cards cc ON u.id = cc.user_id
        WHERE cc.is_active = true AND cc.current_balance > 0
      `;

      const result = await DatabaseUtils.query(query);
      const users = result.rows;

      for (const user of users) {
        await this.createPaymentNotifications(user.id);
      }

      console.log(`Payment reminders scheduled for ${users.length} users`);
      return users.length;
    } catch (error) {
      console.error('Error scheduling payment reminders:', error);
      throw error;
    }
  }

  // Get payment statistics for a user
  static async getPaymentStatistics(userId, months = 12) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          COUNT(*) as payment_count,
          SUM(amount) as total_payments,
          AVG(amount) as avg_payment
        FROM transactions
        WHERE user_id = $1 
        AND type = 'payment'
        AND transaction_date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month DESC
      `;

      const result = await DatabaseUtils.query(query, [userId]);
      
      return result.rows.map(row => ({
        month: row.month,
        paymentCount: parseInt(row.payment_count),
        totalPayments: parseFloat(row.total_payments),
        averagePayment: parseFloat(row.avg_payment)
      }));
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      throw error;
    }
  }

  // Suggest optimal payment distribution across multiple cards
  static suggestPaymentDistribution(creditCards, totalAvailableAmount) {
    if (!creditCards || creditCards.length === 0 || totalAvailableAmount <= 0) {
      return { error: 'Geçersiz parametreler' };
    }

    // Calculate minimum payments for all cards
    const minimumPayments = creditCards.map(card => ({
      cardId: card.id,
      cardName: card.name,
      minimumPayment: card.getMinimumPayment(),
      currentBalance: card.currentBalance,
      interestRate: card.interestRate
    }));

    const totalMinimumPayments = minimumPayments.reduce((sum, card) => sum + card.minimumPayment, 0);

    if (totalAvailableAmount < totalMinimumPayments) {
      return {
        error: 'Toplam tutar minimum ödemeler için yeterli değil',
        required: totalMinimumPayments,
        available: totalAvailableAmount,
        shortfall: totalMinimumPayments - totalAvailableAmount
      };
    }

    // Distribute minimum payments first
    const distribution = minimumPayments.map(card => ({
      ...card,
      recommendedPayment: card.minimumPayment,
      extraPayment: 0
    }));

    // Distribute remaining amount using avalanche method (highest interest first)
    let remainingAmount = totalAvailableAmount - totalMinimumPayments;
    const sortedByInterest = [...distribution].sort((a, b) => b.interestRate - a.interestRate);

    for (const card of sortedByInterest) {
      if (remainingAmount <= 0) break;

      const maxExtraPayment = Math.min(remainingAmount, card.currentBalance - card.minimumPayment);
      if (maxExtraPayment > 0) {
        const cardIndex = distribution.findIndex(c => c.cardId === card.cardId);
        distribution[cardIndex].extraPayment = maxExtraPayment;
        distribution[cardIndex].recommendedPayment += maxExtraPayment;
        remainingAmount -= maxExtraPayment;
      }
    }

    return {
      distribution,
      summary: {
        totalAmount: totalAvailableAmount,
        totalMinimumPayments,
        totalExtraPayments: totalAvailableAmount - totalMinimumPayments,
        remainingAmount
      }
    };
  }
}

module.exports = PaymentScheduler;