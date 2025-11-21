const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');
const notificationManager = require('../services/notificationManager');

// Test endpoint - no auth required
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Notification routes are working!' 
  });
});

// Get all notifications for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT * FROM smart_notifications
      WHERE user_id = $1 AND is_dismissed = false
      ORDER BY 
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        scheduled_for ASC
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Failed to fetch notifications', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Bildirimler alınırken bir hata oluştu',
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await db.query(`
      UPDATE smart_notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
    });
  } catch (error) {
    logger.error('Failed to mark as read', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Bildirim güncellenirken bir hata oluştu',
    });
  }
});

// Dismiss notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const result = await db.query(`
      UPDATE smart_notifications
      SET is_dismissed = true
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Bildirim kapatıldı',
    });
  } catch (error) {
    logger.error('Failed to dismiss notification', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Bildirim kapatılırken bir hata oluştu',
    });
  }
});

// Get overdue payment summary (MUST be before /overdue route)
router.get('/overdue/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const summary = await notificationManager.getOverdueSummary(userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to fetch overdue summary', { 
      userId: req.user.id,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Gecikmiş ödeme özeti alınırken bir hata oluştu',
    });
  }
});

// Get overdue payment notifications
router.get('/overdue', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notifications = await notificationManager.getOverdueNotifications(userId);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    logger.error('Failed to fetch overdue notifications', { 
      userId: req.user.id,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Gecikmiş ödeme bildirimleri alınırken bir hata oluştu',
    });
  }
});

// Manually trigger notification check (for testing)
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info('Manual notification check triggered', { userId });

    // Import notification generator service
    const notificationGeneratorService = require('../services/notificationGeneratorService');
    
    // Generate notifications for this user
    await notificationGeneratorService.checkFixedPayments(userId);
    await notificationGeneratorService.checkCreditCardDeadlines(userId);
    await notificationGeneratorService.checkBudgetThresholds(userId);
    await notificationGeneratorService.checkOverduePayments(userId);

    res.json({
      success: true,
      message: 'Bildirim kontrolü tamamlandı',
    });
  } catch (error) {
    logger.error('Failed to trigger notification check', { 
      userId: req.user.id,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      message: 'Bildirim kontrolü başlatılırken bir hata oluştu',
    });
  }
});

module.exports = router;
