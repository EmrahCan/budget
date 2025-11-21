const express = require('express');
const AccountController = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/auth');
const { accountValidation, paramValidation, queryValidation } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Account CRUD routes
router.get('/', queryValidation.pagination, AccountController.getAllAccounts);
router.get('/summary', AccountController.getAccountSummary);
router.get('/debt-summary', AccountController.getDebtSummary);
router.get('/:id', paramValidation.id, AccountController.getAccount);
router.post('/', accountValidation.create, AccountController.createAccount);
router.put('/:id', paramValidation.id, accountValidation.update, AccountController.updateAccount);
router.delete('/:id', paramValidation.id, AccountController.deleteAccount);

// Account transactions
router.get('/:id/transactions', 
  paramValidation.id,
  queryValidation.pagination,
  queryValidation.dateRange,
  AccountController.getAccountTransactions
);

// Account operations
router.post('/:id/income',
  paramValidation.id,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Gelir tutarı pozitif bir sayı olmalıdır'),
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
  AccountController.addIncome
);

router.post('/:id/expense',
  paramValidation.id,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Gider tutarı pozitif bir sayı olmalıdır'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Açıklama 1-500 karakter arasında olmalıdır'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Kategori en fazla 100 karakter olabilir'),
    body('allowNegative')
      .optional()
      .isBoolean()
      .withMessage('allowNegative boolean değer olmalıdır')
  ],
  AccountController.addExpense
);

router.post('/transfer',
  [
    body('sourceAccountId')
      .isInt({ min: 1 })
      .withMessage('Geçerli kaynak hesap ID gereklidir'),
    body('targetAccountId')
      .isInt({ min: 1 })
      .withMessage('Geçerli hedef hesap ID gereklidir'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Transfer tutarı pozitif bir sayı olmalıdır'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Açıklama en fazla 500 karakter olabilir')
  ],
  AccountController.transferFunds
);

router.put('/:id/balance',
  paramValidation.id,
  [
    body('balance')
      .isFloat()
      .withMessage('Geçerli bir bakiye tutarı giriniz'),
    body('operation')
      .optional()
      .isIn(['add', 'subtract', 'set'])
      .withMessage('Geçersiz işlem türü')
  ],
  AccountController.updateBalance
);

module.exports = router;