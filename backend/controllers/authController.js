const User = require('../models/User');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi zaten kullanılıyor'
        });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName
      });

      // Generate token
      const token = user.generateToken();

      res.status(201).json({
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Kayıt işlemi sırasında hata oluştu'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email with password hash
      const userData = await User.findByEmailWithPassword(email);
      if (!userData) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, userData.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      // Generate token
      const token = userData.user.generateToken();

      res.json({
        success: true,
        message: 'Giriş başarılı',
        data: {
          user: userData.user.toJSON(),
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Giriş işlemi sırasında hata oluştu'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user;
      const statistics = await user.getStatistics();

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          statistics
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profil bilgileri alınırken hata oluştu'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, email } = req.body;
      const user = req.user;

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Bu email adresi zaten kullanılıyor'
          });
        }
      }

      // Update user
      await user.update({ firstName, lastName, email });

      res.json({
        success: true,
        message: 'Profil başarıyla güncellendi',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Profil güncellenirken hata oluştu'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      await user.changePassword(currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Şifre başarıyla değiştirildi'
      });
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.message === 'Mevcut şifre yanlış') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Şifre değiştirilirken hata oluştu'
      });
    }
  }

  // Logout (client-side token removal, server can implement token blacklisting)
  static async logout(req, res) {
    try {
      // In a more advanced implementation, you might want to blacklist the token
      // For now, we'll just send a success response
      res.json({
        success: true,
        message: 'Çıkış başarılı'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Çıkış işlemi sırasında hata oluştu'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const user = req.user;
      await user.delete();

      res.json({
        success: true,
        message: 'Hesap başarıyla silindi'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap silinirken hata oluştu'
      });
    }
  }

  // Verify token (for client-side token validation)
  static async verifyToken(req, res) {
    try {
      const user = req.user;
      
      res.json({
        success: true,
        message: 'Token geçerli',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token doğrulanırken hata oluştu'
      });
    }
  }
}

module.exports = AuthController;