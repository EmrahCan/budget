const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * NotificationService - Smart notifications and reminders
 * Generates proactive notifications based on user's financial data
 */
class NotificationService {
  constructor() {
    this.notificationTypes = {
      PAYMENT_REMINDER: 'payment_reminder',
      BUDGET_ALERT: 'budget_alert',
      SAVING_OPPORTUNITY: 'saving_opportunity',
      ANOMALY_DETECTED: 'anomaly_detected',
      GOAL_PROGRESS: 'goal_progress',
    };
  }

  /**
   * Generate smart notifications for a user
   */
  async generateSmartNotifications(userId) {
    try {
      logger.info('Generating smart notifications', { userId });

      const notifications = [];

      // Check for upcoming payments
      const paymentReminders = await this.checkUpcomingPayments(userId);
      notifications.push(...paymentReminders);

      // Check budget alerts
      const budgetAlerts = await this.checkBudgetAlerts(userId);
      notifications.push(...budgetAlerts);

      // Find saving opportunities
      const savingOpportunities = await this.findSavingOpportunities(userId);
      notifications.push(...savingOpportunities);

      // Check for anomalies
      const anomalies = await this.checkAnomalies(userId);
      notifications.push(...anomalies);

      // Save notifications to database
      for (const notification of notifications) {
        await this.saveNotification(userId, notification);
      }

      return {
        success: true,
        data: notifications,
        count: notifications.length,
      };

    } catch (error) {
      logger.error('Notification generation error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check for upcoming payments
   */
  async checkUpcomingPayments(userId) {
    const notifications = [];

    // Check fixed payments due in next 7 days
    const query = `
      SELECT 
        fp.name,
        fp.amount,
        fp.due_date,
        fp.category
      FROM fixed_payments fp
      WHERE fp.user_id = $1
        AND fp.is_active = true
        AND fp.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `;

    const result = await db.query(query, [userId]);

    result.rows.forEach(payment => {
      const daysUntil = Math.ceil((new Date(payment.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      
      notifications.push({
        type: this.notificationTypes.PAYMENT_REMINDER,
        title: 'Yaklaşan Ödeme',
        message: `${payment.name} ödemesi ${daysUntil} gün içinde: ${payment.amount} TL`,
        priority: daysUntil <= 2 ? 'high' : 'medium',
        data: {
          paymentName: payment.name,
          amount: payment.amount,
          dueDate: payment.due_date,
          daysUntil,
        },
      });
    });

    return notifications;
  }

  /**
   * Check budget alerts
   */
  async checkBudgetAlerts(userId) {
    const notifications = [];

    // Get current month spending by category
    const query = `
      SELECT 
        t.category,
        SUM(t.amount) as spent
      FROM transactions t
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY t.category
    `;

    const result = await db.query(query, [userId]);

    // Simple budget thresholds (could be user-defined)
    const budgetThresholds = {
      'Yiyecek ve İçecek': 2000,
      'Ulaşım': 1000,
      'Eğlence': 500,
      'Alışveriş': 1500,
    };

    result.rows.forEach(row => {
      const threshold = budgetThresholds[row.category];
      if (threshold) {
        const percentage = (parseFloat(row.spent) / threshold) * 100;
        
        if (percentage >= 90) {
          notifications.push({
            type: this.notificationTypes.BUDGET_ALERT,
            title: 'Bütçe Limiti Aşılıyor',
            message: `${row.category} kategorisinde bütçenizin %${percentage.toFixed(0)}'ini kullandınız`,
            priority: percentage >= 100 ? 'critical' : 'high',
            data: {
              category: row.category,
              spent: row.spent,
              budget: threshold,
              percentage,
            },
          });
        } else if (percentage >= 75) {
          notifications.push({
            type: this.notificationTypes.BUDGET_ALERT,
            title: 'Bütçe Uyarısı',
            message: `${row.category} kategorisinde bütçenizin %${percentage.toFixed(0)}'ini kullandınız`,
            priority: 'medium',
            data: {
              category: row.category,
              spent: row.spent,
              budget: threshold,
              percentage,
            },
          });
        }
      }
    });

    return notifications;
  }

  /**
   * Find saving opportunities
   */
  async findSavingOpportunities(userId) {
    const notifications = [];

    // Check for recurring small expenses that add up
    const query = `
      SELECT 
        t.description,
        COUNT(*) as frequency,
        SUM(t.amount) as total,
        AVG(t.amount) as average
      FROM transactions t
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        AND t.amount < 100
      GROUP BY t.description
      HAVING COUNT(*) >= 5
      ORDER BY SUM(t.amount) DESC
      LIMIT 3
    `;

    const result = await db.query(query, [userId]);

    result.rows.forEach(row => {
      notifications.push({
        type: this.notificationTypes.SAVING_OPPORTUNITY,
        title: 'Tasarruf Fırsatı',
        message: `"${row.description}" için son 30 günde ${row.frequency} kez ${parseFloat(row.total).toFixed(2)} TL harcadınız`,
        priority: 'low',
        data: {
          description: row.description,
          frequency: row.frequency,
          total: row.total,
          average: row.average,
        },
      });
    });

    return notifications;
  }

  /**
   * Check for spending anomalies
   */
  async checkAnomalies(userId) {
    const notifications = [];

    // Get last 7 days spending
    const recentQuery = `
      SELECT SUM(amount) as total
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
    `;

    // Get average weekly spending
    const avgQuery = `
      SELECT AVG(weekly_total) as average
      FROM (
        SELECT 
          DATE_TRUNC('week', transaction_date) as week,
          SUM(amount) as weekly_total
        FROM transactions
        WHERE user_id = $1
          AND type = 'expense'
          AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('week', transaction_date)
      ) weekly_totals
    `;

    const [recentResult, avgResult] = await Promise.all([
      db.query(recentQuery, [userId]),
      db.query(avgQuery, [userId]),
    ]);

    const recentTotal = parseFloat(recentResult.rows[0]?.total || 0);
    const average = parseFloat(avgResult.rows[0]?.average || 0);

    if (average > 0 && recentTotal > average * 1.5) {
      const increase = ((recentTotal - average) / average) * 100;
      
      notifications.push({
        type: this.notificationTypes.ANOMALY_DETECTED,
        title: 'Olağandışı Harcama',
        message: `Bu hafta ortalamanın %${increase.toFixed(0)} üzerinde harcama yaptınız`,
        priority: 'high',
        data: {
          recentTotal,
          average,
          increase,
        },
      });
    }

    return notifications;
  }

  /**
   * Save notification to database
   */
  async saveNotification(userId, notification) {
    try {
      // Check if similar notification already exists (avoid duplicates)
      const existingQuery = `
        SELECT id
        FROM smart_notifications
        WHERE user_id = $1
          AND notification_type = $2
          AND title = $3
          AND created_at >= CURRENT_DATE
          AND is_dismissed = false
        LIMIT 1
      `;

      const existing = await db.query(existingQuery, [
        userId,
        notification.type,
        notification.title,
      ]);

      if (existing.rows.length > 0) {
        // Notification already exists today
        return existing.rows[0].id;
      }

      // Insert new notification
      const insertQuery = `
        INSERT INTO smart_notifications 
        (user_id, notification_type, title, message, priority, data)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const result = await db.query(insertQuery, [
        userId,
        notification.type,
        notification.title,
        notification.message,
        notification.priority,
        JSON.stringify(notification.data),
      ]);

      return result.rows[0].id;

    } catch (error) {
      logger.error('Save notification error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { unreadOnly = false, limit = 50 } = options;

      let query = `
        SELECT 
          id,
          notification_type,
          title,
          message,
          priority,
          data,
          is_read,
          is_dismissed,
          created_at
        FROM smart_notifications
        WHERE user_id = $1
      `;

      if (unreadOnly) {
        query += ` AND is_read = false AND is_dismissed = false`;
      }

      query += ` ORDER BY created_at DESC LIMIT $2`;

      const result = await db.query(query, [userId, limit]);

      return {
        success: true,
        data: result.rows,
        count: result.rows.length,
      };

    } catch (error) {
      logger.error('Get notifications error', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE smart_notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await db.query(query, [notificationId, userId]);

      return {
        success: result.rows.length > 0,
      };

    } catch (error) {
      logger.error('Mark as read error', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId, userId) {
    try {
      const query = `
        UPDATE smart_notifications
        SET is_dismissed = true
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await db.query(query, [notificationId, userId]);

      return {
        success: result.rows.length > 0,
      };

    } catch (error) {
      logger.error('Dismiss notification error', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule notification (for future implementation with cron)
   */
  async scheduleNotification(userId, notification, scheduledFor) {
    try {
      const query = `
        INSERT INTO smart_notifications 
        (user_id, notification_type, title, message, priority, data, scheduled_for)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await db.query(query, [
        userId,
        notification.type,
        notification.title,
        notification.message,
        notification.priority,
        JSON.stringify(notification.data),
        scheduledFor,
      ]);

      return {
        success: true,
        notificationId: result.rows[0].id,
      };

    } catch (error) {
      logger.error('Schedule notification error', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_read = false) as unread,
          COUNT(*) FILTER (WHERE is_dismissed = false) as active,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical,
          COUNT(*) FILTER (WHERE priority = 'high') as high
        FROM smart_notifications
        WHERE user_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const result = await db.query(query, [userId]);

      return {
        success: true,
        data: result.rows[0],
      };

    } catch (error) {
      logger.error('Get notification stats error', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
