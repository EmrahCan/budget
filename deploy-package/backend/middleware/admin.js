const { authenticateToken } = require('./auth');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulama hatası'
    });
  }
};

// Middleware to check if user is admin or accessing own data
const requireAdminOrOwner = (userIdParam = 'userId') => {
  return async (req, res, next) => {
    try {
      // First authenticate the user
      await new Promise((resolve, reject) => {
        authenticateToken(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const requestedUserId = parseInt(req.params[userIdParam]);
      const currentUserId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Allow if admin or accessing own data
      if (isAdmin || currentUserId === requestedUserId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Bu veriye erişim yetkiniz yok'
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama hatası'
      });
    }
  };
};

module.exports = {
  requireAdmin,
  requireAdminOrOwner
};