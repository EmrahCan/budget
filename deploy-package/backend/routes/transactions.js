const express = require('express');
const TransactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { transactionValidation, paramValidation, queryValidation } = require('../middleware/validation');
const { body, query } = require('express-validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Transaction CRUD routes
router.get('/', 
  queryValidation.pagination,
  queryValidation.dateRange,
  TransactionController.getAllTransactions
);

router.get('/recent', TransactionController.getRecentTransactions);
router.get('/search', TransactionController.searchTransactions);
router.get('/categories', TransactionController.getCategories);
router.get('/statistics', TransactionController.getTransactionStatistics);

router.get('/summary/monthly', 
  [
    query('year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Geçerli bir yıl giriniz'),
    query('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Geçerli bir ay giriniz (1-12)')
  ],
  TransactionController.getMonthlySummary
);

router.get('/analysis/category-breakdown', 
  queryValidation.dateRange,
  TransactionController.getCategoryBreakdown
);

router.get('/analysis/spending-trends', 
  [
    query('months')
      .optional()
      .isInt({ min: 1, max: 60 })
      .withMessage('Ay sayısı 1-60 arasında olmalıdır')
  ],
  TransactionController.getSpendingTrends
);

router.get('/:id', paramValidation.id, TransactionController.getTransaction);
router.post('/', transactionValidation.create, TransactionController.createTransaction);
router.put('/:id', paramValidation.id, transactionValidation.create, TransactionController.updateTransaction);
router.delete('/:id', paramValidation.id, TransactionController.deleteTransaction);

// Bulk operations
router.delete('/bulk/delete',
  [
    body('transactionIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('1-100 arasında işlem ID\'si giriniz'),
    body('transactionIds.*')
      .isInt({ min: 1 })
      .withMessage('Geçerli işlem ID\'leri giriniz')
  ],
  TransactionController.bulkDeleteTransactions
);

module.exports = router;