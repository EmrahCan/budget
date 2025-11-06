const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DatabaseUtils = require('../utils/database');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.role = userData.role || 'user';
    this.isActive = userData.is_active;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Create a new user
  static async create({ email, password, firstName, lastName }) {
    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, first_name, last_name, created_at, updated_at
      `;

      const result = await DatabaseUtils.query(query, [
        email.toLowerCase().trim(),
        passwordHash,
        firstName.trim(),
        lastName.trim()
      ]);

      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // Find user by email (with password hash for authentication)
  static async findByEmailWithPassword(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;

    const result = await DatabaseUtils.query(query, [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return {
      passwordHash: result.rows[0].password_hash,
      user: new User(result.rows[0])
    };
  }

  // Find user by email (without password hash)
  static async findByEmail(email) {
    const query = `
      SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;

    const result = await DatabaseUtils.query(query, [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;

    const result = await DatabaseUtils.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate JWT token
  generateToken() {
    return jwt.sign(
      { 
        id: this.id, 
        email: this.email 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );
  }

  // Update user profile
  async update({ firstName, lastName, email }) {
    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, first_name, last_name, created_at, updated_at
    `;

    const result = await DatabaseUtils.query(query, [
      firstName?.trim() || this.firstName,
      lastName?.trim() || this.lastName,
      email?.toLowerCase().trim() || this.email,
      this.id
    ]);

    if (result.rows.length === 0) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Update current instance
    const updatedData = result.rows[0];
    this.email = updatedData.email;
    this.firstName = updatedData.first_name;
    this.lastName = updatedData.last_name;
    this.updatedAt = updatedData.updated_at;

    return this;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    // First get the current password hash
    const query = 'SELECT password_hash FROM users WHERE id = $1';
    const result = await DatabaseUtils.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Verify current password
    const isValidPassword = await User.verifyPassword(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      throw new Error('Mevcut şifre yanlış');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await DatabaseUtils.query(updateQuery, [newPasswordHash, this.id]);
    return true;
  }

  // Delete user account
  async delete() {
    const query = 'DELETE FROM users WHERE id = $1';
    await DatabaseUtils.query(query, [this.id]);
    return true;
  }

  // Reset password (admin only)
  async resetPassword(newPassword) {
    try {
      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at
      `;

      const result = await DatabaseUtils.query(query, [newPasswordHash, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStatistics() {
    const queries = [
      'SELECT COUNT(*) as account_count FROM accounts WHERE user_id = $1',
      'SELECT COUNT(*) as credit_card_count FROM credit_cards WHERE user_id = $1',
      'SELECT COUNT(*) as transaction_count FROM transactions WHERE user_id = $1',
      'SELECT COUNT(*) as fixed_payment_count FROM fixed_payments WHERE user_id = $1'
    ];

    const results = await Promise.all(
      queries.map(query => DatabaseUtils.query(query, [this.id]))
    );

    return {
      accounts: parseInt(results[0].rows[0].account_count),
      creditCards: parseInt(results[1].rows[0].credit_card_count),
      transactions: parseInt(results[2].rows[0].transaction_count),
      fixedPayments: parseInt(results[3].rows[0].fixed_payment_count)
    };
  }

  // Get all users (admin only)
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, search, role, isActive } = options;
      
      let query = `
        SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
        FROM users 
        WHERE 1=1
      `;
      let params = [];
      let paramIndex = 1;

      // Add filters
      if (search) {
        query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (role) {
        query += ` AND role = $${paramIndex++}`;
        params.push(role);
      }

      if (isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(isActive);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await DatabaseUtils.query(query, params);
      
      return result.rows.map(row => new User(row));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  // Get user count (admin only)
  static async getCount(filters = {}) {
    try {
      const { search, role, isActive } = filters;
      
      let query = 'SELECT COUNT(*) FROM users WHERE 1=1';
      let params = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (role) {
        query += ` AND role = $${paramIndex++}`;
        params.push(role);
      }

      if (isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(isActive);
      }

      const result = await DatabaseUtils.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting user count:', error);
      throw error;
    }
  }

  // Update user status (admin only)
  async updateStatus(isActive) {
    try {
      const query = `
        UPDATE users 
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, [isActive, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Kullanıcı bulunamadı');
      }

      this.isActive = result.rows[0].is_active;
      this.updatedAt = result.rows[0].updated_at;

      return this;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Update user role (admin only)
  async updateRole(role) {
    try {
      const query = `
        UPDATE users 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, [role, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Kullanıcı bulunamadı');
      }

      this.role = result.rows[0].role;
      this.updatedAt = result.rows[0].updated_at;

      return this;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: `${this.firstName} ${this.lastName}`,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;