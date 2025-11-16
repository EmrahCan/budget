const express = require('express');
const { body, param, query } = require('express-validator');
const FixedPaymentController = require('../controllers/fixedPaymentController');
const { authenticateToken } = require('../middleware/auth');
const { paramValidation: globalParamValidation } = require('../middleware/validation');

const router = express.Router();

// Validation middleware
const paramValidation = {
  id: [
    param('id')
      .custom((value) => {
        // Support both integer and UUID formats
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        
        if (!isInteger && !isUUID) {
          throw new Error('Geçersiz ödeme ID formatı');
        }
        
        return true;
      })
      .withMessage('Geçersiz ödeme ID')
  ],
  category: param('category')
    .isLength({ min: 1, max: 100 })
    .withMessage('Geçersiz kategori')
};

const createValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Ödeme adı 1-100 karakter arası olmalıdır'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Tutar 0\'dan büyük olmalıdır'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olabilir'),
  body('dueDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Ödeme günü 1-31 arası olmalıdır')
];

const updateValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Ödeme adı 1-100 karakter arası olmalıdır'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Tutar 0\'dan büyük olmalıdır'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olabilir'),
  body('dueDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Ödeme günü 1-31 arası olmalıdır'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive boolean değer olmalıdır')
];

const scheduleValidation = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Ay 1-12 arası olmalıdır'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Yıl 2020-2030 arası olmalıdır')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all fixed payments
router.get('/', FixedPaymentController.getFixedPayments);

// Get monthly schedule
router.get('/schedule', scheduleValidation, FixedPaymentController.getMonthlySchedule);

// Get payments due this month
router.get('/due-this-month', FixedPaymentController.getPaymentsDueThisMonth);

// Get overdue payments
router.get('/overdue', FixedPaymentController.getOverduePayments);

// Get total monthly amount
router.get('/total-monthly', FixedPaymentController.getTotalMonthlyAmount);

// Get all categories
router.get('/categories', FixedPaymentController.getCategories);

// Get payments by category
router.get('/category/:category', paramValidation.category, FixedPaymentController.getPaymentsByCategory);

// Get specific fixed payment
router.get('/:id', paramValidation.id, FixedPaymentController.getFixedPayment);

// Create new fixed payment
router.post('/', createValidation, FixedPaymentController.createFixedPayment);

// Update fixed payment
router.put('/:id', paramValidation.id, updateValidation, FixedPaymentController.updateFixedPayment);

// Delete fixed payment
router.delete('/:id', paramValidation.id, FixedPaymentController.deleteFixedPayment);

// ============ PAYMENT HISTORY ROUTES ============

// Validation for payment history
const historyValidation = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Ay 1-12 arası olmalıdır'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Yıl 2020-2030 arası olmalıdır')
];

const markPaidValidation = [
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Ay 1-12 arası olmalıdır'),
  body('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Yıl 2020-2030 arası olmalıdır'),
  body('paidDate')
    .optional()
    .isISO8601()
    .withMessage('Geçerli bir tarih giriniz'),
  body('paidAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Ödenen tutar 0\'dan büyük olmalıdır'),
  body('transactionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçersiz transaction ID'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notlar en fazla 500 karakter olabilir')
];

const markUnpaidValidation = [
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Ay 1-12 arası olmalıdır'),
  body('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Yıl 2020-2030 arası olmalıdır')
];

// Get monthly status with payment history
router.get('/history/monthly-status', historyValidation, FixedPaymentController.getMonthlyStatusWithHistory);

// Get payment statistics
router.get('/history/statistics', historyValidation, FixedPaymentController.getPaymentStatistics);

// Get unpaid payments
router.get('/history/unpaid', historyValidation, FixedPaymentController.getUnpaidPayments);

// Get paid payments
router.get('/history/paid', historyValidation, FixedPaymentController.getPaidPayments);

// Get overdue payments with history
router.get('/history/overdue', historyValidation, FixedPaymentController.getOverduePaymentsWithHistory);

// Get payment history for a specific fixed payment
router.get('/:id/history', paramValidation.id, FixedPaymentController.getPaymentHistory);

// Mark payment as paid
router.post('/:id/mark-paid', paramValidation.id, markPaidValidation, FixedPaymentController.markPaymentAsPaid);

// Mark payment as unpaid
router.post('/:id/mark-unpaid', paramValidation.id, markUnpaidValidation, FixedPaymentController.markPaymentAsUnpaid);

module.exports = router;