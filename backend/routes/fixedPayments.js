const express = require('express');
const { body, param, query } = require('express-validator');
const FixedPaymentController = require('../controllers/fixedPaymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const paramValidation = {
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz ödeme ID'),
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

module.exports = router;