const db = require('../utils/database');

class InstallmentPayment {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.itemName = data.item_name;
    this.category = data.category;
    this.totalAmount = parseFloat(data.total_amount);
    this.paidAmount = parseFloat(data.paid_amount);
    this.remainingAmount = parseFloat(data.remaining_amount);
    this.installmentAmount = parseFloat(data.installment_amount);
    this.totalInstallments = data.total_installments;
    this.paidInstallments = data.paid_installments;
    this.remainingInstallments = data.remaining_installments;
    this.interestRate = parseFloat(data.interest_rate);
    this.startDate = data.start_date;
    this.nextPaymentDate = data.next_payment_date;
    this.vendor = data.vendor;
    this.notes = data.notes;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new installment payment
  static async create(userId, paymentData) {
    const {
      itemName,
      category,
      totalAmount,
      installmentAmount,
      totalInstallments,
      interestRate,
      startDate,
      vendor,
      notes
    } = paymentData;
    
    // Calculate next payment date (first installment)
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    
    const query = `
      INSERT INTO installment_payments (
        user_id, item_name, category, total_amount, installment_amount,
        total_installments, interest_rate, start_date, next_payment_date,
        vendor, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId, itemName, category, totalAmount, installmentAmount,
      totalInstallments, interestRate, startDate, nextPaymentDate,
      vendor, notes
    ]);
    
    return new InstallmentPayment(result.rows[0]);
  }

  // Get all installment payments for a user
  static async findByUserId(userId, includeInactive = false) {
    let query = `
      SELECT * FROM installment_payments 
      WHERE user_id = $1
    `;
    
    if (!includeInactive) {
      query += ' AND is_active = true';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new InstallmentPayment(row));
  }

  // Get installment payment by ID
  static async findById(id, userId) {
    const query = `
      SELECT * FROM installment_payments 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0 ? new InstallmentPayment(result.rows[0]) : null;
  }

  // Update installment payment
  static async update(id, userId, updateData) {
    const {
      itemName,
      category,
      totalAmount,
      installmentAmount,
      totalInstallments,
      interestRate,
      startDate,
      vendor,
      notes
    } = updateData;
    
    // Calculate next payment date based on start date and paid installments
    const currentPayment = await this.findById(id, userId);
    if (!currentPayment) {
      return null;
    }
    
    const paidInstallments = currentPayment.paidInstallments || 0;
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + paidInstallments);
    
    const query = `
      UPDATE installment_payments 
      SET item_name = $3, category = $4, total_amount = $5, installment_amount = $6,
          total_installments = $7, interest_rate = $8, start_date = $9, 
          next_payment_date = $10, vendor = $11, notes = $12
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [
      id, userId, itemName, category, totalAmount, installmentAmount,
      totalInstallments, interestRate, startDate, nextPaymentDate.toISOString().split('T')[0],
      vendor, notes
    ]);
    
    return result.rows.length > 0 ? new InstallmentPayment(result.rows[0]) : null;
  }

  // Delete installment payment (soft delete)
  static async delete(id, userId) {
    const query = `
      UPDATE installment_payments 
      SET is_active = false
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0;
  }

  // Record a payment
  static async recordPayment(id, userId, paymentData) {
    const { amount, paymentDate, description, receiptNumber } = paymentData;
    
    // Get current installment payment
    const installmentPayment = await this.findById(id, userId);
    if (!installmentPayment) {
      throw new Error('Taksitli ödeme bulunamadı');
    }
    
    // Calculate installment number
    const installmentNumber = installmentPayment.paidInstallments + 1;
    
    // Start transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Insert payment transaction
      const transactionQuery = `
        INSERT INTO installment_payment_transactions (
          user_id, installment_payment_id, amount, payment_date, installment_number, description, receipt_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const transactionResult = await client.query(transactionQuery, [
        userId, id, amount, paymentDate, installmentNumber, description, receiptNumber
      ]);
      
      // Update installment payment
      const newPaidAmount = installmentPayment.paidAmount + parseFloat(amount);
      const newPaidInstallments = installmentPayment.paidInstallments + 1;
      
      // Calculate next payment date
      let nextPaymentDate = null;
      if (newPaidInstallments < installmentPayment.totalInstallments) {
        nextPaymentDate = new Date(installmentPayment.nextPaymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      
      const updateQuery = `
        UPDATE installment_payments 
        SET paid_amount = $3, paid_installments = $4, next_payment_date = $5
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        id, userId, newPaidAmount, newPaidInstallments, nextPaymentDate
      ]);
      
      await client.query('COMMIT');
      
      return {
        installmentPayment: new InstallmentPayment(updateResult.rows[0]),
        transaction: transactionResult.rows[0]
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get payment history
  static async getPaymentHistory(id, userId) {
    const query = `
      SELECT * FROM installment_payment_transactions 
      WHERE installment_payment_id = $1 AND user_id = $2
      ORDER BY payment_date DESC, installment_number DESC
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows;
  }

  // Get upcoming payments for all installments
  static async getUpcomingPayments(userId, daysAhead = 30) {
    const query = `
      SELECT * FROM installment_payments 
      WHERE user_id = $1 AND is_active = true 
        AND next_payment_date IS NOT NULL
        AND next_payment_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
      ORDER BY next_payment_date ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new InstallmentPayment(row));
  }

  // Get overdue payments
  static async getOverduePayments(userId) {
    const query = `
      SELECT * FROM installment_payments 
      WHERE user_id = $1 AND is_active = true 
        AND next_payment_date IS NOT NULL
        AND next_payment_date < CURRENT_DATE
      ORDER BY next_payment_date ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new InstallmentPayment(row));
  }

  // Get summary statistics
  static async getSummary(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_installments,
        COUNT(*) FILTER (WHERE is_active = true) as active_installments,
        COALESCE(SUM(total_amount) FILTER (WHERE is_active = true), 0) as total_debt,
        COALESCE(SUM(paid_amount) FILTER (WHERE is_active = true), 0) as total_paid,
        COALESCE(SUM(remaining_amount) FILTER (WHERE is_active = true), 0) as total_remaining,
        COALESCE(SUM(installment_amount) FILTER (WHERE is_active = true), 0) as monthly_total
      FROM installment_payments 
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  // Get by category
  static async getByCategory(userId, category) {
    const query = `
      SELECT * FROM installment_payments 
      WHERE user_id = $1 AND category = $2 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userId, category]);
    return result.rows.map(row => new InstallmentPayment(row));
  }

  // Get all categories used by user
  static async getCategories(userId) {
    const query = `
      SELECT DISTINCT category 
      FROM installment_payments 
      WHERE user_id = $1 AND is_active = true AND category IS NOT NULL
      ORDER BY category ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.category);
  }

  // Calculate completion percentage
  getCompletionPercentage() {
    if (this.totalAmount === 0) return 0;
    return Math.round((this.paidAmount / this.totalAmount) * 100);
  }

  // Check if payment is overdue
  isOverdue() {
    if (!this.nextPaymentDate) return false;
    return new Date(this.nextPaymentDate) < new Date();
  }

  // Get days until next payment
  getDaysUntilPayment() {
    if (!this.nextPaymentDate) return null;
    const today = new Date();
    const paymentDate = new Date(this.nextPaymentDate);
    const diffTime = paymentDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      itemName: this.itemName,
      category: this.category,
      totalAmount: this.totalAmount,
      paidAmount: this.paidAmount,
      remainingAmount: this.remainingAmount,
      installmentAmount: this.installmentAmount,
      totalInstallments: this.totalInstallments,
      paidInstallments: this.paidInstallments,
      remainingInstallments: this.remainingInstallments,
      interestRate: this.interestRate,
      startDate: this.startDate,
      nextPaymentDate: this.nextPaymentDate,
      vendor: this.vendor,
      notes: this.notes,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completionPercentage: this.getCompletionPercentage(),
      isOverdue: this.isOverdue(),
      daysUntilPayment: this.getDaysUntilPayment()
    };
  }
}

module.exports = InstallmentPayment;