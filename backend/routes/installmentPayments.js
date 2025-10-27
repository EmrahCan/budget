const express = require('express');
const { body, param, query } = require('express-validator');
const InstallmentPaymentController = require('../controllers/installmentPaymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const paramValidation = {
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz taksitli ödeme ID'),
  category: param('category')
    .isLength({ min: 1, max: 100 })
    .withMessage('Geçersiz kategori')
};

const createValidation = [
  body('itemName')
    .isLength({ min: 1, max: 200 })
    .withMessage('Ürün/hizmet adı 1-200 karakter arası olmalıdır'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olabilir'),
  body('totalAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Toplam tutar 0\'dan büyük olmalıdır'),
  body('installmentAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Taksit tutarı 0\'dan büyük olmalıdır'),
  body('totalInstallments')
    .isInt({ min: 1 })
    .withMessage('Taksit sayısı 1\'den büyük olmalıdır'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Faiz oranı 0-100 arası olmalıdır'),
  body('startDate')
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi giriniz'),
  body('vendor')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Satıcı adı en fazla 200 karakter olabilir'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notlar en fazla 1000 karakter olabilir')
];

const updateValidation = [
  body('itemName')
    .isLength({ min: 1, max: 200 })
    .withMessage('Ürün/hizmet adı 1-200 karakter arası olmalıdır'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Kategori en fazla 100 karakter olabilir'),
  body('totalAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Toplam tutar 0\'dan büyük olmalıdır'),
  body('installmentAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Taksit tutarı 0\'dan büyük olmalıdır'),
  body('totalInstallments')
    .isInt({ min: 1 })
    .withMessage('Taksit sayısı 1\'den büyük olmalıdır'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Faiz oranı 0-100 arası olmalıdır'),
  body('vendor')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Satıcı adı en fazla 200 karakter olabilir'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notlar en fazla 1000 karakter olabilir'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive boolean değer olmalıdır')
];

const paymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Ödeme tutarı 0\'dan büyük olmalıdır'),
  body('paymentDate')
    .isISO8601()
    .withMessage('Geçerli bir ödeme tarihi giriniz'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir'),
  body('receiptNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Makbuz no en fazla 100 karakter olabilir')
];

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all installment payments
router.get('/', InstallmentPaymentController.getInstallmentPayments);

// Get summary statistics
router.get('/summary', InstallmentPaymentController.getSummary);

// Get upcoming payments
router.get('/upcoming', InstallmentPaymentController.getUpcomingPayments);

// Get overdue payments
router.get('/overdue', InstallmentPaymentController.getOverduePayments);

// Get all categories
router.get('/categories', InstallmentPaymentController.getCategories);

// Get payments by category
router.get('/category/:category', paramValidation.category, InstallmentPaymentController.getPaymentsByCategory);

// Get specific installment payment
router.get('/:id', paramValidation.id, InstallmentPaymentController.getInstallmentPayment);

// Get payment history for an installment
router.get('/:id/history', paramValidation.id, InstallmentPaymentController.getPaymentHistory);

// Create new installment payment
router.post('/', createValidation, InstallmentPaymentController.createInstallmentPayment);

// Record a payment
router.post('/:id/payment', paramValidation.id, paymentValidation, InstallmentPaymentController.recordPayment);

// Update installment payment
router.put('/:id', paramValidation.id, updateValidation, InstallmentPaymentController.updateInstallmentPayment);

// Delete installment payment
router.delete('/:id', paramValidation.id, InstallmentPaymentController.deleteInstallmentPayment);

module.exports = router;