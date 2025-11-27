const express = require('express');
const AdminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/admin');
const { userValidation, paramValidation, queryValidation } = require('../middleware/validation');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);

// Dashboard and statistics
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/financial-overview', AdminController.getFinancialOverview);
router.get('/activity-logs', queryValidation.pagination, AdminController.getActivityLogs);

// User management
router.get('/users', 
  queryValidation.pagination,
  AdminController.getAllUsers
);

router.get('/users/:userId', 
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('Kullanıcı ID gereklidir')
      .custom((value) => {
        // Support both integer and UUID formats
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        
        if (!isInteger && !isUUID) {
          throw new Error('Geçersiz kullanıcı ID formatı');
        }
        
        return true;
      })
      .withMessage('Geçersiz kullanıcı ID formatı'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri girişi',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  AdminController.getUserDetails
);

router.put('/users/:userId/status',
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('Kullanıcı ID gereklidir')
      .custom((value) => {
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (!isInteger && !isUUID) throw new Error('Geçersiz kullanıcı ID formatı');
        return true;
      })
      .withMessage('Geçersiz kullanıcı ID formatı'),
    body('isActive')
      .isBoolean()
      .withMessage('isActive boolean değer olmalıdır'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri girişi',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  AdminController.updateUserStatus
);

router.put('/users/:userId/role',
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('Kullanıcı ID gereklidir')
      .custom((value) => {
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (!isInteger && !isUUID) throw new Error('Geçersiz kullanıcı ID formatı');
        return true;
      })
      .withMessage('Geçersiz kullanıcı ID formatı'),
    body('role')
      .isIn(['user', 'admin'])
      .withMessage('Rol user veya admin olmalıdır'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri girişi',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  AdminController.updateUserRole
);

router.put('/users/:userId/reset-password',
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('Kullanıcı ID gereklidir')
      .custom((value) => {
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (!isInteger && !isUUID) throw new Error('Geçersiz kullanıcı ID formatı');
        return true;
      })
      .withMessage('Geçersiz kullanıcı ID formatı'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Yeni şifre en az 6 karakter olmalıdır'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri girişi',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  AdminController.resetUserPassword
);

router.post('/users/:userId/generate-password',
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('Kullanıcı ID gereklidir')
      .custom((value) => {
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (!isInteger && !isUUID) throw new Error('Geçersiz kullanıcı ID formatı');
        return true;
      })
      .withMessage('Geçersiz kullanıcı ID formatı'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri girişi',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  AdminController.generateUserPassword
);

// Delete user
router.delete('/users/:userId',
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('Kullanıcı ID gereklidir')
      .custom((value) => {
        const isInteger = /^\d+$/.test(value);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (!isInteger && !isUUID) throw new Error('Geçersiz kullanıcı ID formatı');
        return true;
      })
      .withMessage('Geçersiz kullanıcı ID formatı'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri girişi',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  AdminController.deleteUser
);

// Admin creation
router.post('/create-admin',
  userValidation.register,
  AdminController.createAdmin
);

module.exports = router;