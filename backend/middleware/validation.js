const { body, validationResult, param, query } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz veri girişi',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Geçerli bir email adresi giriniz'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter olmalıdır')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Ad 2-50 karakter arasında olmalıdır')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .withMessage('Ad sadece harf içerebilir'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Soyad 2-50 karakter arasında olmalıdır')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .withMessage('Soyad sadece harf içerebilir'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Geçerli bir email adresi giriniz'),
    body('password')
      .notEmpty()
      .withMessage('Şifre gereklidir'),
    handleValidationErrors
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Ad 2-50 karakter arasında olmalıdır')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .withMessage('Ad sadece harf içerebilir'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Soyad 2-50 karakter arasında olmalıdır')
      .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .withMessage('Soyad sadece harf içerebilir'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Geçerli bir email adresi giriniz'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Mevcut şifre gereklidir'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Yeni şifre en az 6 karakter olmalıdır')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Yeni şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'),
    handleValidationErrors
  ]
};

// Account validation rules
const accountValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Hesap adı 2-100 karakter arasında olmalıdır'),
    body('type')
      .isIn(['checking', 'savings', 'cash', 'investment', 'overdraft'])
      .withMessage('Geçersiz hesap türü'),
    body('balance')
      .optional()
      .isFloat()
      .withMessage('Geçersiz bakiye tutarı'),
    body('overdraftLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Esnek hesap limiti negatif olamaz'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Para birimi 3 karakter olmalıdır'),
    handleValidationErrors
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Hesap adı 2-100 karakter arasında olmalıdır'),
    body('balance')
      .optional()
      .isFloat()
      .withMessage('Geçersiz bakiye tutarı'),
    body('overdraftLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Esnek hesap limiti negatif olamaz'),
    handleValidationErrors
  ]
};

// Credit card validation rules
const creditCardValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Kart adı 2-100 karakter arasında olmalıdır'),
    body('bankName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Banka adı en fazla 100 karakter olabilir'),
    body('creditLimit')
      .isFloat({ min: 0.01 })
      .withMessage('Kredi limiti pozitif bir sayı olmalıdır'),
    body('currentBalance')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Mevcut bakiye negatif olamaz'),
    body('interestRate')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Faiz oranı 0-100 arasında olmalıdır'),
    body('minimumPaymentRate')
      .optional()
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Minimum ödeme oranı 0.01-100 arasında olmalıdır'),
    body('paymentDueDate')
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage('Ödeme tarihi 1-31 arasında olmalıdır'),
    handleValidationErrors
  ]
};

// Transaction validation rules
const transactionValidation = {
  create: [
    body('type')
      .isIn(['income', 'expense', 'transfer', 'payment'])
      .withMessage('Geçersiz işlem türü'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Tutar pozitif bir sayı olmalıdır'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Açıklama en fazla 500 karakter olabilir'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Kategori en fazla 100 karakter olabilir'),
    body('transactionDate')
      .isISO8601()
      .withMessage('Geçerli bir tarih giriniz'),
    handleValidationErrors
  ]
};

// Common parameter validations
const paramValidation = {
  id: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Geçersiz ID'),
    handleValidationErrors
  ]
};

// Query parameter validations
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sayfa numarası pozitif bir sayı olmalıdır'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit 1-100 arasında olmalıdır'),
    handleValidationErrors
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Geçerli bir başlangıç tarihi giriniz'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Geçerli bir bitiş tarihi giriniz'),
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  accountValidation,
  creditCardValidation,
  transactionValidation,
  paramValidation,
  queryValidation,
  handleValidationErrors
};