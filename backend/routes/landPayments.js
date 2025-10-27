const express = require('express');
const { body, param, query } = require('express-validator');
const LandPaymentController = require('../controllers/landPaymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const paramValidation = {
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz arsa ödeme ID')
};

const createValidation = [
  body('landName')
    .isLength({ min: 1, max: 200 })
    .withMessage('Arsa adı 1-200 karakter arası olmalıdır'),
  body('location')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Konum en fazla 300 karakter olabilir'),
  body('adaNo')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ada no en fazla 50 karakter olabilir'),
  body('parselNo')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Parsel no en fazla 50 karakter olabilir'),
  body('totalPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Toplam fiyat 0\'dan büyük olmalıdır'),
  body('monthlyInstallment')
    .isFloat({ min: 0.01 })
    .withMessage('Aylık taksit 0\'dan büyük olmalıdır'),
  body('installmentCount')
    .isInt({ min: 1 })
    .withMessage('Taksit sayısı 1\'den büyük olmalıdır'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Faiz oranı 0-100 arası olmalıdır'),
  body('startDate')
    .isISO8601()
    .withMessage('Geçerli bir başlangıç tarihi giriniz'),
  body('contractNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Sözleşme no en fazla 100 karakter olabilir'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notlar en fazla 1000 karakter olabilir')
];

const updateValidation = [
  body('landName')
    .isLength({ min: 1, max: 200 })
    .withMessage('Arsa adı 1-200 karakter arası olmalıdır'),
  body('location')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Konum en fazla 300 karakter olabilir'),
  body('adaNo')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ada no en fazla 50 karakter olabilir'),
  body('parselNo')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Parsel no en fazla 50 karakter olabilir'),
  body('totalPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Toplam fiyat 0\'dan büyük olmalıdır'),
  body('monthlyInstallment')
    .isFloat({ min: 0.01 })
    .withMessage('Aylık taksit 0\'dan büyük olmalıdır'),
  body('installmentCount')
    .isInt({ min: 1 })
    .withMessage('Taksit sayısı 1\'den büyük olmalıdır'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Faiz oranı 0-100 arası olmalıdır'),
  body('contractNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Sözleşme no en fazla 100 karakter olabilir'),
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

// Get all land payments
router.get('/', LandPaymentController.getLandPayments);

// Get summary statistics
router.get('/summary', LandPaymentController.getSummary);

// Get upcoming payments
router.get('/upcoming', LandPaymentController.getUpcomingPayments);

// Get overdue payments
router.get('/overdue', LandPaymentController.getOverduePayments);

// Get specific land payment
router.get('/:id', paramValidation.id, LandPaymentController.getLandPayment);

// Get payment history for a land
router.get('/:id/history', paramValidation.id, LandPaymentController.getPaymentHistory);

// Create new land payment
router.post('/', createValidation, LandPaymentController.createLandPayment);

// Record a payment
router.post('/:id/payment', paramValidation.id, paymentValidation, LandPaymentController.recordPayment);

// Update land payment
router.put('/:id', paramValidation.id, updateValidation, LandPaymentController.updateLandPayment);

// Delete land payment
router.delete('/:id', paramValidation.id, LandPaymentController.deleteLandPayment);

module.exports = router;