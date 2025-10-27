const InstallmentPayment = require('../models/InstallmentPayment');
const { validationResult } = require('express-validator');

class InstallmentPaymentController {
  // Get all installment payments for the authenticated user
  static async getInstallmentPayments(req, res) {
    try {
      const userId = req.user.id;
      const includeInactive = req.query.include_inactive === 'true';
      
      const payments = await InstallmentPayment.findByUserId(userId, includeInactive);
      
      res.json({
        success: true,
        data: payments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching installment payments:', error);
      res.status(500).json({
        success: false,
        message: 'Taksitli ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get a specific installment payment
  static async getInstallmentPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      
      const payment = await InstallmentPayment.findById(id, userId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Taksitli ödeme bulunamadı'
        });
      }
      
      res.json({
        success: true,
        data: payment.toJSON()
      });
    } catch (error) {
      console.error('Error fetching installment payment:', error);
      res.status(500).json({
        success: false,
        message: 'Taksitli ödeme alınırken hata oluştu'
      });
    }
  }

  // Create a new installment payment
  static async createInstallmentPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const paymentData = req.body;
      
      const payment = await InstallmentPayment.create(userId, paymentData);
      
      res.status(201).json({
        success: true,
        message: 'Taksitli ödeme başarıyla oluşturuldu',
        data: payment.toJSON()
      });
    } catch (error) {
      console.error('Error creating installment payment:', error);
      res.status(500).json({
        success: false,
        message: 'Taksitli ödeme oluşturulurken hata oluştu'
      });
    }
  }

  // Update an installment payment
  static async updateInstallmentPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;
      
      const payment = await InstallmentPayment.update(id, userId, updateData);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Taksitli ödeme bulunamadı'
        });
      }
      
      res.json({
        success: true,
        message: 'Taksitli ödeme başarıyla güncellendi',
        data: payment.toJSON()
      });
    } catch (error) {
      console.error('Error updating installment payment:', error);
      res.status(500).json({
        success: false,
        message: 'Taksitli ödeme güncellenirken hata oluştu'
      });
    }
  }

  // Delete an installment payment (soft delete)
  static async deleteInstallmentPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      
      const deleted = await InstallmentPayment.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Taksitli ödeme bulunamadı'
        });
      }
      
      res.json({
        success: true,
        message: 'Taksitli ödeme başarıyla silindi'
      });
    } catch (error) {
      console.error('Error deleting installment payment:', error);
      res.status(500).json({
        success: false,
        message: 'Taksitli ödeme silinirken hata oluştu'
      });
    }
  }

  // Record a payment
  static async recordPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const paymentData = req.body;
      
      const result = await InstallmentPayment.recordPayment(id, userId, paymentData);
      
      res.json({
        success: true,
        message: 'Taksit ödemesi başarıyla kaydedildi',
        data: {
          installmentPayment: result.installmentPayment.toJSON(),
          transaction: result.transaction
        }
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Taksit ödemesi kaydedilirken hata oluştu'
      });
    }
  }

  // Get payment history
  static async getPaymentHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      
      const history = await InstallmentPayment.getPaymentHistory(id, userId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Ödeme geçmişi alınırken hata oluştu'
      });
    }
  }

  // Get upcoming payments
  static async getUpcomingPayments(req, res) {
    try {
      const userId = req.user.id;
      const daysAhead = parseInt(req.query.days_ahead) || 30;
      
      const upcomingPayments = await InstallmentPayment.getUpcomingPayments(userId, daysAhead);
      
      res.json({
        success: true,
        data: upcomingPayments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      res.status(500).json({
        success: false,
        message: 'Yaklaşan taksit ödemeleri alınırken hata oluştu'
      });
    }
  }

  // Get overdue payments
  static async getOverduePayments(req, res) {
    try {
      const userId = req.user.id;
      
      const overduePayments = await InstallmentPayment.getOverduePayments(userId);
      
      res.json({
        success: true,
        data: overduePayments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      res.status(500).json({
        success: false,
        message: 'Geciken taksit ödemeleri alınırken hata oluştu'
      });
    }
  }

  // Get summary statistics
  static async getSummary(req, res) {
    try {
      const userId = req.user.id;
      
      const summary = await InstallmentPayment.getSummary(userId);
      
      res.json({
        success: true,
        data: {
          totalInstallments: parseInt(summary.total_installments),
          activeInstallments: parseInt(summary.active_installments),
          totalDebt: parseFloat(summary.total_debt),
          totalPaid: parseFloat(summary.total_paid),
          totalRemaining: parseFloat(summary.total_remaining),
          monthlyTotal: parseFloat(summary.monthly_total),
          completionPercentage: summary.total_debt > 0 
            ? Math.round((summary.total_paid / summary.total_debt) * 100) 
            : 0
        }
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({
        success: false,
        message: 'Özet bilgiler alınırken hata oluştu'
      });
    }
  }

  // Get payments by category
  static async getPaymentsByCategory(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.params;
      
      const payments = await InstallmentPayment.getByCategory(userId, category);
      
      res.json({
        success: true,
        data: payments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching payments by category:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriye göre taksitli ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get all categories
  static async getCategories(req, res) {
    try {
      const userId = req.user.id;
      
      const categories = await InstallmentPayment.getCategories(userId);
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriler alınırken hata oluştu'
      });
    }
  }
}

module.exports = InstallmentPaymentController;