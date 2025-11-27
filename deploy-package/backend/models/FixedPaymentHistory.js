const db = require('../utils/database');

class FixedPaymentHistory {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.fixedPaymentId = data.fixed_payment_id;
    this.paymentMonth = data.payment_month;
    this.paymentYear = data.payment_year;
    this.isPaid = data.is_paid;
    this.paidDate = data.paid_date;
    this.paidAmount = data.paid_amount ? parseFloat(data.paid_amount) : null;
    this.transactionId = data.transaction_id;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Mark a payment as paid
  static async markAsPaid(fixedPaymentId, userId, month, year, paymentData) {
    const { paidDate, paidAmount, transactionId, notes } = paymentData;
    
    const query = `
      INSERT INTO fixed_payment_history (
        user_id, fixed_payment_id, payment_month, payment_year,
        is_paid, paid_date, paid_amount, transaction_id, notes
      )
      VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8)
      ON CONFLICT (fixed_payment_id, payment_month, payment_year)
      DO UPDATE SET
        is_paid = true,
        paid_date = EXCLUDED.paid_date,
        paid_amount = EXCLUDED.paid_amount,
        transaction_id = EXCLUDED.transaction_id,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [
      userId,
      fixedPaymentId,
      month,
      year,
      paidDate || new Date(),
      paidAmount,
      transactionId || null,
      notes || null
    ]);
    
    return new FixedPaymentHistory(result.rows[0]);
  }

  // Mark a payment as unpaid
  static async markAsUnpaid(fixedPaymentId, userId, month, year) {
    const query = `
      INSERT INTO fixed_payment_history (
        user_id, fixed_payment_id, payment_month, payment_year,
        is_paid
      )
      VALUES ($1, $2, $3, $4, false)
      ON CONFLICT (fixed_payment_id, payment_month, payment_year)
      DO UPDATE SET
        is_paid = false,
        paid_date = NULL,
        paid_amount = NULL,
        transaction_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, fixedPaymentId, month, year]);
    return new FixedPaymentHistory(result.rows[0]);
  }

  // Check if a payment is paid for a specific month/year
  static async isPaid(fixedPaymentId, month, year) {
    const query = `
      SELECT is_paid 
      FROM fixed_payment_history 
      WHERE fixed_payment_id = $1 
        AND payment_month = $2 
        AND payment_year = $3
    `;
    
    const result = await db.query(query, [fixedPaymentId, month, year]);
    return result.rows.length > 0 ? result.rows[0].is_paid : false;
  }

  // Get payment history for a specific fixed payment
  static async getPaymentHistory(fixedPaymentId, userId, options = {}) {
    const { limit = 12, offset = 0 } = options;
    
    const query = `
      SELECT * 
      FROM fixed_payment_history 
      WHERE fixed_payment_id = $1 AND user_id = $2
      ORDER BY payment_year DESC, payment_month DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await db.query(query, [fixedPaymentId, userId, limit, offset]);
    return result.rows.map(row => new FixedPaymentHistory(row));
  }

  // Get monthly status for all fixed payments of a user
  static async getMonthlyStatus(userId, month, year) {
    const query = `
      SELECT 
        fp.id,
        fp.name,
        fp.amount,
        fp.category,
        fp.due_day,
        COALESCE(fph.is_paid, false) as is_paid,
        fph.paid_date,
        fph.paid_amount,
        fph.transaction_id,
        fph.notes
      FROM fixed_payments fp
      LEFT JOIN fixed_payment_history fph 
        ON fp.id = fph.fixed_payment_id 
        AND fph.payment_month = $2 
        AND fph.payment_year = $3
      WHERE fp.user_id = $1 
        AND fp.is_active = true
      ORDER BY fp.due_day ASC, fp.name ASC
    `;
    
    const result = await db.query(query, [userId, month, year]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: parseFloat(row.amount),
      category: row.category,
      dueDay: row.due_day,
      isPaid: row.is_paid,
      paidDate: row.paid_date,
      paidAmount: row.paid_amount ? parseFloat(row.paid_amount) : null,
      transactionId: row.transaction_id,
      notes: row.notes
    }));
  }

  // Get unpaid payments for a specific month/year
  static async getUnpaidPayments(userId, month, year) {
    const query = `
      SELECT 
        fp.id,
        fp.name,
        fp.amount,
        fp.category,
        fp.due_day
      FROM fixed_payments fp
      LEFT JOIN fixed_payment_history fph 
        ON fp.id = fph.fixed_payment_id 
        AND fph.payment_month = $2 
        AND fph.payment_year = $3
      WHERE fp.user_id = $1 
        AND fp.is_active = true
        AND (fph.is_paid IS NULL OR fph.is_paid = false)
      ORDER BY fp.due_day ASC, fp.name ASC
    `;
    
    const result = await db.query(query, [userId, month, year]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: parseFloat(row.amount),
      category: row.category,
      dueDay: row.due_day
    }));
  }

  // Get paid payments for a specific month/year
  static async getPaidPayments(userId, month, year) {
    const query = `
      SELECT 
        fp.id,
        fp.name,
        fp.amount,
        fp.category,
        fp.due_day,
        fph.paid_date,
        fph.paid_amount,
        fph.transaction_id
      FROM fixed_payments fp
      INNER JOIN fixed_payment_history fph 
        ON fp.id = fph.fixed_payment_id 
        AND fph.payment_month = $2 
        AND fph.payment_year = $3
      WHERE fp.user_id = $1 
        AND fp.is_active = true
        AND fph.is_paid = true
      ORDER BY fph.paid_date DESC, fp.name ASC
    `;
    
    const result = await db.query(query, [userId, month, year]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: parseFloat(row.amount),
      category: row.category,
      dueDay: row.due_day,
      paidDate: row.paid_date,
      paidAmount: parseFloat(row.paid_amount),
      transactionId: row.transaction_id
    }));
  }

  // Get payment statistics for a user
  static async getPaymentStatistics(userId, month, year) {
    const query = `
      SELECT 
        COUNT(fp.id) as total_payments,
        COUNT(CASE WHEN fph.is_paid = true THEN 1 END) as paid_count,
        COUNT(CASE WHEN fph.is_paid = false OR fph.is_paid IS NULL THEN 1 END) as unpaid_count,
        SUM(fp.amount) as total_amount,
        SUM(CASE WHEN fph.is_paid = true THEN fph.paid_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN fph.is_paid = false OR fph.is_paid IS NULL THEN fp.amount ELSE 0 END) as unpaid_amount
      FROM fixed_payments fp
      LEFT JOIN fixed_payment_history fph 
        ON fp.id = fph.fixed_payment_id 
        AND fph.payment_month = $2 
        AND fph.payment_year = $3
      WHERE fp.user_id = $1 
        AND fp.is_active = true
    `;
    
    const result = await db.query(query, [userId, month, year]);
    const stats = result.rows[0];
    
    return {
      totalPayments: parseInt(stats.total_payments) || 0,
      paidCount: parseInt(stats.paid_count) || 0,
      unpaidCount: parseInt(stats.unpaid_count) || 0,
      totalAmount: parseFloat(stats.total_amount) || 0,
      paidAmount: parseFloat(stats.paid_amount) || 0,
      unpaidAmount: parseFloat(stats.unpaid_amount) || 0,
      completionRate: stats.total_payments > 0 
        ? Math.round((stats.paid_count / stats.total_payments) * 100) 
        : 0
    };
  }

  // Get overdue payments (past due date and not paid)
  static async getOverduePayments(userId, month, year) {
    const currentDay = new Date().getDate();
    
    const query = `
      SELECT 
        fp.id,
        fp.name,
        fp.amount,
        fp.category,
        fp.due_day
      FROM fixed_payments fp
      LEFT JOIN fixed_payment_history fph 
        ON fp.id = fph.fixed_payment_id 
        AND fph.payment_month = $2 
        AND fph.payment_year = $3
      WHERE fp.user_id = $1 
        AND fp.is_active = true
        AND fp.due_day < $4
        AND (fph.is_paid IS NULL OR fph.is_paid = false)
      ORDER BY fp.due_day ASC, fp.name ASC
    `;
    
    const result = await db.query(query, [userId, month, year, currentDay]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      amount: parseFloat(row.amount),
      category: row.category,
      dueDay: row.due_day,
      daysOverdue: currentDay - row.due_day
    }));
  }

  // Auto-create history records for current month (if not exists)
  static async autoCreateMonthlyRecords(userId, month, year) {
    const query = `
      INSERT INTO fixed_payment_history (
        user_id, fixed_payment_id, payment_month, payment_year, is_paid
      )
      SELECT 
        fp.user_id,
        fp.id,
        $2,
        $3,
        false
      FROM fixed_payments fp
      WHERE fp.user_id = $1 
        AND fp.is_active = true
        AND NOT EXISTS (
          SELECT 1 
          FROM fixed_payment_history fph 
          WHERE fph.fixed_payment_id = fp.id 
            AND fph.payment_month = $2 
            AND fph.payment_year = $3
        )
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, month, year]);
    return result.rows.map(row => new FixedPaymentHistory(row));
  }

  // Delete history record
  static async deleteHistory(id, userId) {
    const query = `
      DELETE FROM fixed_payment_history 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length > 0;
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      fixedPaymentId: this.fixedPaymentId,
      paymentMonth: this.paymentMonth,
      paymentYear: this.paymentYear,
      isPaid: this.isPaid,
      paidDate: this.paidDate,
      paidAmount: this.paidAmount,
      transactionId: this.transactionId,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = FixedPaymentHistory;
