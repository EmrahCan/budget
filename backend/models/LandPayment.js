const db = require('../utils/database');

class LandPayment {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.landName = data.land_name;
    this.location = data.location;
    this.adaNo = data.ada_no;
    this.parselNo = data.parsel_no;
    this.totalPrice = parseFloat(data.total_price);
    this.paidAmount = parseFloat(data.paid_amount);
    this.remainingAmount = parseFloat(data.remaining_amount);
    this.monthlyInstallment = parseFloat(data.monthly_installment);
    this.installmentCount = data.installment_count;
    this.paidInstallments = data.paid_installments;
    this.remainingInstallments = data.remaining_installments;
    this.interestRate = parseFloat(data.interest_rate);
    this.startDate = data.start_date;
    this.nextPaymentDate = data.next_payment_date;
    this.contractNumber = data.contract_number;
    this.notes = data.notes;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new land payment
  static async create(userId, landData) {
    const {
      landName,
      location,
      adaNo,
      parselNo,
      totalPrice,
      monthlyInstallment,
      installmentCount,
      interestRate,
      startDate,
      contractNumber,
      notes
    } = landData;
    
    // Calculate next payment date (first installment)
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    
    const query = `
      INSERT INTO land_payments (
        user_id, land_name, location, ada_no, parsel_no, total_price,
        monthly_installment, installment_count, interest_rate, start_date,
        next_payment_date, contract_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId, landName, location, adaNo, parselNo, totalPrice,
      monthlyInstallment, installmentCount, interestRate, startDate,
      nextPaymentDate, contractNumber, notes
    ]);
    
    return new LandPayment(result.rows[0]);
  }

  // Get all land payments for a user
  static async findByUserId(userId, includeInactive = false) {
    let query = `
      SELECT * FROM land_payments 
      WHERE user_id = $1
    `;
    
    if (!includeInactive) {
      query += ' AND is_active = true';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new LandPayment(row));
  }

  // Get land payment by ID
  static async findById(id, userId) {
    const query = `
      SELECT * FROM land_payments 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0 ? new LandPayment(result.rows[0]) : null;
  }

  // Update land payment
  static async update(id, userId, updateData) {
    const {
      landName,
      location,
      adaNo,
      parselNo,
      totalPrice,
      monthlyInstallment,
      installmentCount,
      interestRate,
      contractNumber,
      notes,
      isActive
    } = updateData;
    
    const query = `
      UPDATE land_payments 
      SET land_name = $3, location = $4, ada_no = $5, parsel_no = $6,
          total_price = $7, monthly_installment = $8, installment_count = $9,
          interest_rate = $10, contract_number = $11, notes = $12, is_active = $13
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [
      id, userId, landName, location, adaNo, parselNo, totalPrice,
      monthlyInstallment, installmentCount, interestRate, contractNumber, notes, isActive
    ]);
    
    return result.rows.length > 0 ? new LandPayment(result.rows[0]) : null;
  }

  // Delete land payment (soft delete)
  static async delete(id, userId) {
    const query = `
      UPDATE land_payments 
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
    
    // Get current land payment
    const landPayment = await this.findById(id, userId);
    if (!landPayment) {
      throw new Error('Arsa ödemesi bulunamadı');
    }
    
    // Calculate installment number
    const installmentNumber = landPayment.paidInstallments + 1;
    
    // Start transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Insert payment transaction
      const transactionQuery = `
        INSERT INTO land_payment_transactions (
          user_id, land_payment_id, amount, payment_date, installment_number, description, receipt_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const transactionResult = await client.query(transactionQuery, [
        userId, id, amount, paymentDate, installmentNumber, description, receiptNumber
      ]);
      
      // Update land payment
      const newPaidAmount = landPayment.paidAmount + parseFloat(amount);
      const newPaidInstallments = landPayment.paidInstallments + 1;
      
      // Calculate next payment date
      let nextPaymentDate = null;
      if (newPaidInstallments < landPayment.installmentCount) {
        nextPaymentDate = new Date(landPayment.nextPaymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      
      const updateQuery = `
        UPDATE land_payments 
        SET paid_amount = $3, paid_installments = $4, next_payment_date = $5
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        id, userId, newPaidAmount, newPaidInstallments, nextPaymentDate
      ]);
      
      await client.query('COMMIT');
      
      return {
        landPayment: new LandPayment(updateResult.rows[0]),
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
      SELECT * FROM land_payment_transactions 
      WHERE land_payment_id = $1 AND user_id = $2
      ORDER BY payment_date DESC, installment_number DESC
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows;
  }

  // Get upcoming payments for all lands
  static async getUpcomingPayments(userId, daysAhead = 30) {
    const query = `
      SELECT * FROM land_payments 
      WHERE user_id = $1 AND is_active = true 
        AND next_payment_date IS NOT NULL
        AND next_payment_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
      ORDER BY next_payment_date ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new LandPayment(row));
  }

  // Get overdue payments
  static async getOverduePayments(userId) {
    const query = `
      SELECT * FROM land_payments 
      WHERE user_id = $1 AND is_active = true 
        AND next_payment_date IS NOT NULL
        AND next_payment_date < CURRENT_DATE
      ORDER BY next_payment_date ASC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows.map(row => new LandPayment(row));
  }

  // Get summary statistics
  static async getSummary(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_lands,
        COUNT(*) FILTER (WHERE is_active = true) as active_lands,
        COALESCE(SUM(total_price) FILTER (WHERE is_active = true), 0) as total_investment,
        COALESCE(SUM(paid_amount) FILTER (WHERE is_active = true), 0) as total_paid,
        COALESCE(SUM(remaining_amount) FILTER (WHERE is_active = true), 0) as total_remaining,
        COALESCE(SUM(monthly_installment) FILTER (WHERE is_active = true), 0) as monthly_total
      FROM land_payments 
      WHERE user_id = $1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  // Calculate completion percentage
  getCompletionPercentage() {
    if (this.totalPrice === 0) return 0;
    return Math.round((this.paidAmount / this.totalPrice) * 100);
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
      landName: this.landName,
      location: this.location,
      adaNo: this.adaNo,
      parselNo: this.parselNo,
      totalPrice: this.totalPrice,
      paidAmount: this.paidAmount,
      remainingAmount: this.remainingAmount,
      monthlyInstallment: this.monthlyInstallment,
      installmentCount: this.installmentCount,
      paidInstallments: this.paidInstallments,
      remainingInstallments: this.remainingInstallments,
      interestRate: this.interestRate,
      startDate: this.startDate,
      nextPaymentDate: this.nextPaymentDate,
      contractNumber: this.contractNumber,
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

module.exports = LandPayment;