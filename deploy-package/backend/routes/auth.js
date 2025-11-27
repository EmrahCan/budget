const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');

const router = express.Router();

// Apply rate limiting to auth routes (relaxed for development)
const loginRateLimit = authRateLimit(15 * 60 * 1000, 50); // 50 attempts per 15 minutes
const registerRateLimit = authRateLimit(60 * 60 * 1000, 30); // 30 attempts per hour

// Public routes
router.post('/register', registerRateLimit, userValidation.register, AuthController.register);
router.post('/login', loginRateLimit, userValidation.login, AuthController.login);

// Protected routes (require authentication)
router.use(authenticateToken);

router.get('/profile', AuthController.getProfile);
router.put('/profile', userValidation.updateProfile, AuthController.updateProfile);
router.post('/change-password', userValidation.changePassword, AuthController.changePassword);
router.post('/logout', AuthController.logout);
router.delete('/account', AuthController.deleteAccount);
router.get('/verify', AuthController.verifyToken);

module.exports = router;