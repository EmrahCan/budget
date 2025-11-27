const db = require('../config/database');
const logger = require('../utils/logger');
const overduePaymentDetector = require('./overduePaymentDetector');

/**
 * NotificationManager - Handles CRUD operations for notifications
 * This service manages notification state, retrieval, and user interactions
 */
class NotificationManager {
  /**
   * Get all active notifications for a user
   * @param {string} userId - User ID (UUID)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of notifications
   */
  async getNotifications(userId, options = {}) {
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
          action_taken,
          related_entity_id,
          related_entity_type,
          scheduled_for,
          sent_at,
          read_at,
          created_at
        FROM smart_notifications
        WHERE user_id = $1 AND is_dismissed = false
      `;

      const params = [userId];

      if (unreadOnly) {
        query += ' AND is_read = false';
      }

      // Priority-based sorting: high > medium > low, then by scheduled_for
      query += `
        ORDER BY 
          CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          scheduled_for ASC,
          created_at DESC
        LIMIT $2
      `;

      params.push(limit);

      const result = await db.query(query, params);

      logger.debug('Notifications retrieved', {
        userId,
        count: result.rows.length,
        unreadOnly,
      });

      return result.rows;
    } catch (error) {
      logger.error('Error getting notifications', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notification by ID
   * @param {string} notificationId - Notification ID (UUID)
   * @param {string} userId - User ID (UUID) for authorization
   * @returns {Promise<Object|null>} Notification object or null
   */
  async getNotificationById(notificationId, userId) {
    try {
      const query = `
        SELECT * FROM smart_notifications
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [notificationId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting notification by ID', {
        notificationId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID (UUID)
   * @param {string} userId - User ID (UUID) for authorization
   * @returns {Promise<boolean>} Success status
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

      const success = result.rows.length > 0;

      if (success) {
        logger.debug('Notification marked as read', {
          notificationId,
          userId,
        });
      } else {
        logger.warn('Notification not found or unauthorized', {
          notificationId,
          userId,
        });
      }

      return success;
    } catch (error) {
      logger.error('Error marking notification as read', {
        notificationId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE smart_notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_read = false AND is_dismissed = false
        RETURNING id
      `;

      const result = await db.query(query, [userId]);

      logger.info('All notifications marked as read', {
        userId,
        count: result.rows.length,
      });

      return result.rows.length;
    } catch (error) {
      logger.error('Error marking all notifications as read', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Dismiss notification
   * @param {string} notificationId - Notification ID (UUID)
   * @param {string} userId - User ID (UUID) for authorization
   * @returns {Promise<boolean>} Success status
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

      const success = result.rows.length > 0;

      if (success) {
        logger.debug('Notification dismissed', {
          notificationId,
          userId,
        });
      } else {
        logger.warn('Notification not found or unauthorized', {
          notificationId,
          userId,
        });
      }

      return success;
    } catch (error) {
      logger.error('Error dismissing notification', {
        notificationId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Auto-dismiss notifications when related payment is completed
   * @param {string} paymentId - Payment ID (UUID)
   * @param {string} paymentType - Payment type ('fixed_payment' or 'credit_card')
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<number>} Number of notifications dismissed
   */
  async autoDismissPaymentNotifications(paymentId, paymentType, userId) {
    try {
      const query = `
        UPDATE smart_notifications
        SET is_dismissed = true, action_taken = true
        WHERE user_id = $1 
          AND related_entity_id = $2 
          AND related_entity_type = $3 
          AND is_dismissed = false
        RETURNING id
      `;

      const result = await db.query(query, [userId, paymentId, paymentType]);

      logger.info('Payment notifications auto-dismissed', {
        userId,
        paymentId,
        paymentType,
        count: result.rows.length,
      });

      return result.rows.length;
    } catch (error) {
      logger.error('Error auto-dismissing payment notifications', {
        userId,
        paymentId,
        paymentType,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_read = false) as unread,
          COUNT(*) FILTER (WHERE is_dismissed = false) as active,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical,
          COUNT(*) FILTER (WHERE priority = 'high') as high,
          COUNT(*) FILTER (WHERE priority = 'medium') as medium,
          COUNT(*) FILTER (WHERE priority = 'low') as low
        FROM smart_notifications
        WHERE user_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const result = await db.query(query, [userId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting notification stats', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID (UUID)
   * @returns {Promise<number>} Unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM smart_notifications
        WHERE user_id = $1 
          AND is_read = false 
          AND is_dismissed = false
      `;

      const result = await db.query(query, [userId]);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting unread count', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get overdue payment notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of overdue notifications
   */
  async getOverdueNotifications(userId) {
    try {
      const query = `
        SELECT 
          id,
          notification_type,
          title,
          message,
          priority,
          data,
          is_read,
          is_dismissed,
          action_taken,
          related_entity_id,
          related_entity_type,
          scheduled_for,
          sent_at,
          read_at,
          created_at
        FROM smart_notifications
        WHERE user_id = $1 
          AND is_dismissed = false
          AND notification_type IN ('fixed_payment_overdue', 'credit_card_overdue', 'installment_overdue')
        ORDER BY 
          CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
      `;

      const result = await db.query(query, [userId]);

      logger.debug('Overdue notifications retrieved', {
        userId,
        count: result.rows.length,
      });

      return result.rows;
    } catch (error) {
      logger.error('Error getting overdue notifications', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get overdue payment summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Summary with count and total amount
   */
  async getOverdueSummary(userId) {
    try {
      const summary = await overduePaymentDetector.getOverdueSummary(userId);

      logger.debug('Overdue summary retrieved', {
        userId,
        totalCount: summary.totalCount,
        totalAmount: summary.totalAmount,
      });

      return summary;
    } catch (error) {
      logger.error('Error getting overdue summary', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update existing overdue notification instead of creating duplicate
   * @param {string} userId - User ID
   * @param {string} relatedEntityId - Payment ID
   * @param {Object} updateData - New notification data
   * @returns {Promise<boolean>} Success status
   */
  async updateOverdueNotification(userId, relatedEntityId, updateData) {
    try {
      const { title, message, priority, data, notificationType } = updateData;

      const query = `
        UPDATE smart_notifications
        SET title = $1, message = $2, priority = $3, data = $4, sent_at = NOW()
        WHERE user_id = $5 
          AND related_entity_id = $6 
          AND notification_type = $7
          AND is_dismissed = false
        RETURNING id
      `;

      const result = await db.query(query, [
        title,
        message,
        priority,
        JSON.stringify(data),
        userId,
        relatedEntityId,
        notificationType,
      ]);

      const success = result.rows.length > 0;

      if (success) {
        logger.debug('Overdue notification updated', {
          notificationId: result.rows[0].id,
          userId,
          relatedEntityId,
        });
      } else {
        logger.warn('Overdue notification not found for update', {
          userId,
          relatedEntityId,
          notificationType,
        });
      }

      return success;
    } catch (error) {
      logger.error('Error updating overdue notification', {
        userId,
        relatedEntityId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete old dismissed notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of notifications deleted
   */
  async cleanupOldNotifications(daysOld = 90) {
    try {
      const query = `
        DELETE FROM smart_notifications
        WHERE is_dismissed = true
          AND created_at < CURRENT_DATE - INTERVAL '${daysOld} days'
        RETURNING id
      `;

      const result = await db.query(query);

      logger.info('Old notifications cleaned up', {
        count: result.rows.length,
        daysOld,
      });

      return result.rows.length;
    } catch (error) {
      logger.error('Error cleaning up old notifications', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NotificationManager();
