const User = require('../models/User');
const DatabaseUtils = require('../utils/database');

class AdminController {
  // Get dashboard statistics
  static async getDashboardStats(req, res) {
    try {
      const queries = [
        // Total users
        'SELECT COUNT(*) as total_users FROM users',
        // Active users
        'SELECT COUNT(*) as active_users FROM users WHERE is_active = true',
        // Total accounts
        'SELECT COUNT(*) as total_accounts FROM accounts',
        // Total credit cards
        'SELECT COUNT(*) as total_credit_cards FROM credit_cards',
        // Total transactions
        'SELECT COUNT(*) as total_transactions FROM transactions',
        // Total balance across all accounts
        'SELECT COALESCE(SUM(balance), 0) as total_balance FROM accounts WHERE is_active = true',
        // Total credit card debt
        'SELECT COALESCE(SUM(current_balance), 0) as total_debt FROM credit_cards WHERE is_active = true',
        // Recent registrations (last 30 days)
        'SELECT COUNT(*) as recent_registrations FROM users WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'',
        // Monthly transaction volume (last 30 days)
        'SELECT COUNT(*) as monthly_transactions FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\'',
      ];

      const results = await Promise.all(
        queries.map(query => DatabaseUtils.query(query))
      );

      const stats = {
        users: {
          total: parseInt(results[0].rows[0].total_users),
          active: parseInt(results[1].rows[0].active_users),
          recentRegistrations: parseInt(results[7].rows[0].recent_registrations)
        },
        accounts: {
          total: parseInt(results[2].rows[0].total_accounts),
          totalBalance: parseFloat(results[5].rows[0].total_balance)
        },
        creditCards: {
          total: parseInt(results[3].rows[0].total_credit_cards),
          totalDebt: parseFloat(results[6].rows[0].total_debt)
        },
        transactions: {
          total: parseInt(results[4].rows[0].total_transactions),
          monthly: parseInt(results[8].rows[0].monthly_transactions)
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınırken hata oluştu'
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, role, isActive } = req.query;

      const filters = {
        search,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      const [users, totalCount] = await Promise.all([
        User.findAll({
          page: parseInt(page),
          limit: parseInt(limit),
          ...filters
        }),
        User.getCount(filters)
      ]);

      res.json({
        success: true,
        data: {
          users: users.map(user => user.toJSON()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcılar alınırken hata oluştu'
      });
    }
  }

  // Get user details
  static async getUserDetails(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Get user statistics
      const stats = await user.getStatistics();

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          statistics: stats
        }
      });
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı detayları alınırken hata oluştu'
      });
    }
  }

  // Update user status
  static async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      await user.updateStatus(isActive);

      res.json({
        success: true,
        message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} hale getirildi`,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı durumu güncellenirken hata oluştu'
      });
    }
  }

  // Update user role
  static async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      await user.updateRole(role);

      res.json({
        success: true,
        message: `Kullanıcı rolü ${role} olarak güncellendi`,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı rolü güncellenirken hata oluştu'
      });
    }
  }

  // Get system activity logs
  static async getActivityLogs(req, res) {
    try {
      const { page = 1, limit = 50, userId, type } = req.query;

      let query = `
        SELECT 
          t.id,
          t.type,
          t.amount,
          t.description,
          t.transaction_date,
          t.created_at,
          u.first_name,
          u.last_name,
          u.email,
          CASE 
            WHEN t.account_id IS NOT NULL THEN 'account'
            WHEN t.credit_card_id IS NOT NULL THEN 'credit_card'
            ELSE 'unknown'
          END as source_type
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;

      let params = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND t.user_id = $${paramIndex++}`;
        params.push(userId);
      }

      if (type) {
        query += ` AND t.type = $${paramIndex++}`;
        params.push(type);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(parseInt(limit), offset);

      const result = await DatabaseUtils.query(query, params);

      res.json({
        success: true,
        data: {
          activities: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.rows.length
          }
        }
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Aktivite logları alınırken hata oluştu'
      });
    }
  }

  // Get financial overview
  static async getFinancialOverview(req, res) {
    try {
      const queries = [
        // Monthly transaction trends
        `
          SELECT 
            DATE_TRUNC('month', transaction_date) as month,
            type,
            COUNT(*) as count,
            SUM(amount) as total
          FROM transactions
          WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', transaction_date), type
          ORDER BY month DESC
        `,
        // Top categories
        `
          SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
          FROM transactions
          WHERE category IS NOT NULL
          AND transaction_date >= CURRENT_DATE - INTERVAL '3 months'
          GROUP BY category
          ORDER BY total_amount DESC
          LIMIT 10
        `,
        // User distribution by balance
        `
          SELECT 
            CASE 
              WHEN total_balance < 0 THEN 'negative'
              WHEN total_balance = 0 THEN 'zero'
              WHEN total_balance <= 1000 THEN 'low'
              WHEN total_balance <= 10000 THEN 'medium'
              ELSE 'high'
            END as balance_range,
            COUNT(*) as user_count
          FROM (
            SELECT 
              u.id,
              COALESCE(SUM(a.balance), 0) as total_balance
            FROM users u
            LEFT JOIN accounts a ON u.id = a.user_id AND a.is_active = true
            WHERE u.is_active = true
            GROUP BY u.id
          ) user_balances
          GROUP BY balance_range
        `
      ];

      const results = await Promise.all(
        queries.map(query => DatabaseUtils.query(query))
      );

      res.json({
        success: true,
        data: {
          monthlyTrends: results[0].rows,
          topCategories: results[1].rows,
          userDistribution: results[2].rows
        }
      });
    } catch (error) {
      console.error('Get financial overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Finansal genel bakış alınırken hata oluştu'
      });
    }
  }

  // Reset user password
  static async resetUserPassword(req, res) {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre en az 6 karakter olmalıdır'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      await user.resetPassword(newPassword);

      res.json({
        success: true,
        message: 'Kullanıcı şifresi başarıyla sıfırlandı',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Reset user password error:', error);
      res.status(500).json({
        success: false,
        message: 'Şifre sıfırlanırken hata oluştu'
      });
    }
  }

  // Generate random password
  static generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    // Ensure at least one lowercase, one uppercase, and one number
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    
    // Fill the rest randomly
    for (let i = 3; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate and reset user password
  static async generateUserPassword(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const newPassword = AdminController.generateRandomPassword();
      await user.resetPassword(newPassword);

      res.json({
        success: true,
        message: 'Yeni şifre oluşturuldu',
        data: {
          user: user.toJSON(),
          newPassword: newPassword
        }
      });
    } catch (error) {
      console.error('Generate user password error:', error);
      res.status(500).json({
        success: false,
        message: 'Şifre oluşturulurken hata oluştu'
      });
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Prevent deleting yourself
      if (req.user && req.user.id === userId) {
        return res.status(400).json({
          success: false,
          message: 'Kendi hesabınızı silemezsiniz'
        });
      }

      await user.delete();

      res.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı silinirken hata oluştu'
      });
    }
  }

  // Create admin user
  static async createAdmin(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if admin already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi zaten kullanılıyor'
        });
      }

      // Create user with admin role
      const user = await User.create({
        email,
        password,
        firstName,
        lastName
      });

      // Update role to admin
      await user.updateRole('admin');

      res.status(201).json({
        success: true,
        message: 'Admin kullanıcı başarıyla oluşturuldu',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Admin oluşturulurken hata oluştu'
      });
    }
  }
}

module.exports = AdminController;