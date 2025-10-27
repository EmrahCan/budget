const db = require('../utils/database');

class FixedPayment {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.name = data.name;
    this.amount = parseFloat(data.amount);
    this.category = data.category;
    this.dueDay = data.due_day;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new fixed payment
  static async create(userId, paymentData) {
    const { name, amount, category, dueDay } = paymentData;
    
    const query = `
      INSERT INTO fixed_payments (user_id, name, amount, category, due_day)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, name, amount, category, dueDay]);
    return new FixedPayment(result.rows[0]);
  }

  // Get all fixed payments for a user
  static async findByUserId(userId, includeInactive = false) {
    let query = `
      SELECT * FROM fixed_payments 
      WHERE user_id = $1
    `;
    
    if (!includeInactive) {
      query += ' AND is_active = true';
    }
    
    query += ' ORDER BY due_day ASC, name ASC';
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new FixedPayment(row));
  }

  // Get fixed payment by ID
  static async findById(id, userId) {
    const query = `
      SELECT * FROM fixed_payments 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0 ? new FixedPayment(result.rows[0]) : null;
  }

  // Update fixed payment
  static async update(id, userId, updateData) {
    const { name, amount, category, dueDay, isActive } = updateData;
    
    const query = `
      UPDATE fixed_payments 
      SET name = $3, amount = $4, category = $5, due_day = $6, is_active = $7
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id, userId, name, amount, category, dueDay, isActive]);
    return result.rows.length > 0 ? new FixedPayment(result.rows[0]) : null;
  }

  // Delete fixed payment (soft delete by setting is_active to false)
  static async delete(id, userId) {
    const query = `
      UPDATE fixed_payments 
      SET is_active = false
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0;
  }

  // Hard delete fixed payment
  static async hardDelete(id, userId) {
    const query = `
      DELETE FROM fixed_payments 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0;
  }

  // Get fixed payments due in current month
  static async getPaymentsDueThisMonth(userId) {
    const now = new Date();
    const currentDay = now.getDate();
    
    const query = `
      SELECT * FROM fixed_payments 
      WHERE user_id = $1 AND is_active = true AND due_day >= $2
      ORDER BY due_day ASC
    `;
    
    const result = await db.query(query, [userId, currentDay]);
    return result.rows.map(row => new FixedPayment(row));
  }

  // Get overdue payments (payments that should have been paid this month)
  static async getOverduePayments(userId) {
    const now = new Date();
    const currentDay = now.getDate();
    
    const query = `
      SELECT * FROM fixed_payments 
      WHERE user_id = $1 AND is_active = true AND due_day < $2
      ORDER BY due_day ASC
    `;
    
    const result = await db.query(query, [userId, currentDay]);
    return result.rows.map(row => new FixedPayment(row));
  }

  // Generate monthly payment schedule for a specific month/year
  static async generateMonthlySchedule(userId, month, year) {
    const payments = await this.findByUserId(userId);
    const schedule = [];
    
    for (const payment of payments) {
      // Calculate the actual date for this payment in the given month/year
      const dueDate = new Date(year, month - 1, payment.dueDay);
      
      // If the due day doesn't exist in this month (e.g., Feb 30), use last day of month
      if (dueDate.getMonth() !== month - 1) {
        dueDate.setDate(0); // Set to last day of previous month
      }
      
      schedule.push({
        id: payment.id,
        name: payment.name,
        amount: payment.amount,
        category: payment.category,
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        dueDay: payment.dueDay,
        isPaid: false // This would need to be checked against actual transactions
      });
    }
    
    // Sort by due date
    schedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    return schedule;
  }

  // Calculate total monthly fixed payments
  static async getTotalMonthlyAmount(userId) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM fixed_payments 
      WHERE user_id = $1 AND is_active = true
    `;
    
    const result = await db.query(query, [userId]);
    return parseFloat(result.rows[0].total);
  }

  // Get payments by category
  static async getByCategory(userId, category) {
    const query = `
      SELECT * FROM fixed_payments 
      WHERE user_id = $1 AND category = $2 AND is_active = true
      ORDER BY due_day ASC, name ASC
    `;
    
    const result = await db.query(query, [userId, category]);
    return result.rows.map(row => new FixedPayment(row));
  }

  // Get all categories used by user
  static async getCategories(userId) {
    const query = `
      SELECT DISTINCT category 
      FROM fixed_payments 
      WHERE user_id = $1 AND is_active = true AND category IS NOT NULL
      ORDER BY category ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.category);
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      amount: this.amount,
      category: this.category,
      dueDay: this.dueDay,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = FixedPayment;