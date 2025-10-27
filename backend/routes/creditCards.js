const express = require('express');
const CreditCardController = require('../controllers/creditCardController');
const { authenticateToken } = require('../middleware/auth');
const { creditCardValidation, paramValidation, queryValidation } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Credit card CRUD routes
router.get('/', queryValidation.pagination, CreditCardController.getAllCreditCards);
router.get('/:id', paramValidation.id, CreditCardController.getCreditCard);
router.post('/', creditCardValidation.create, CreditCardController.createCreditCard);
router.put('/:id', paramValidation.id, creditCardValidation.create, CreditCardController.updateCreditCard);
router.delete('/:id', paramValidation.id, CreditCardController.deleteCreditCard);

// Payment and expense routes
router.post('/:id/payment', 
  paramValidation.id,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Ödeme tutarı pozitif bir sayı olmalıdır'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Açıklama en fazla 500 karakter olabilir')
  ],
  CreditCardController.recordPayment
);

router.post('/:id/expense',
  paramValidation.id,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Harcama tutarı pozitif bir sayı olmalıdır'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Açıklama 1-500 karakter arasında olmalıdır'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Kategori en fazla 100 karakter olabilir')
  ],
  CreditCardController.addExpense
);

// Transaction history
router.get('/:id/transactions', 
  paramValidation.id,
  queryValidation.pagination,
  queryValidation.dateRange,
  CreditCardController.getTransactions
);

// Interest and payment calculations
router.get('/:id/calculate-interest', 
  paramValidation.id,
  CreditCardController.calculateInterest
);

router.get('/:id/payment-schedule',
  paramValidation.id,
  CreditCardController.getPaymentSchedule
);

router.post('/:id/compare-scenarios',
  paramValidation.id,
  [
    body('paymentAmounts')
      .isArray({ min: 1, max: 10 })
      .withMessage('1-10 arasında ödeme tutarı giriniz'),
    body('paymentAmounts.*')
      .isFloat({ min: 0.01 })
      .withMessage('Tüm ödeme tutarları pozitif olmalıdır')
  ],
  CreditCardController.comparePaymentScenarios
);

router.get('/:id/interest-savings',
  paramValidation.id,
  CreditCardController.getInterestSavings
);

// Payment management routes
router.get('/payments/upcoming', CreditCardController.getUpcomingPayments);
router.get('/payments/reminders', CreditCardController.getPaymentReminders);
router.get('/payments/calendar', CreditCardController.getPaymentCalendar);

module.exports = router;