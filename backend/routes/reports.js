const express = require('express');
const { query } = require('express-validator');
const ReportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const dateValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi giriniz (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir bitiş tarihi giriniz (YYYY-MM-DD)')
];

const monthsValidation = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Ay sayısı 1-60 arası olmalıdır')
];

const exportValidation = [
  query('type')
    .isIn(['transactions', 'installments'])
    .withMessage('Export türü transactions veya installments olmalıdır'),
  ...dateValidation
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get financial overview
router.get('/financial-overview', dateValidation, ReportController.getFinancialOverview);

// Get category breakdown
router.get('/category-breakdown', [
  ...dateValidation,
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Tür income veya expense olmalıdır')
], ReportController.getCategoryBreakdown);

// Get monthly trends
router.get('/monthly-trends', monthsValidation, ReportController.getMonthlyTrends);

// Get installments overview
router.get('/installments-overview', ReportController.getInstallmentsOverview);

// Get net worth history
router.get('/net-worth-history', monthsValidation, ReportController.getNetWorthHistory);

// Export data
router.get('/export', exportValidation, ReportController.exportData);

module.exports = router;