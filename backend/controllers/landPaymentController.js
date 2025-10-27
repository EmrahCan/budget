const LandPayment = require('../models/LandPayment');
const { validationResult } = require('express-validator');

class LandPaymentController {
  // Get all land payments for the authenticated user
  static async getLandPayments(req, res) {
    try {
      const userId = req.user.id;
      const includeInactive = req.query.include_inactive === 'true';
      
      const landPayments = await LandPayment.findByUserId(userId, includeInactive);
      
      res.json({
        success: true,
        data: landPayments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching land payments:', error);
      res.status(500).json({
        success: false,
        message: 'Arsa ödemeleri alınırken hata oluştu'
      });
    }
  }

  // Get a specific land payment
  static async getLandPayment(req, res) {
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
      
      const landPayment = await LandPayment.findById(id, userId);
      
      if (!landPayment) {
        return res.status(404).json({
          success: false,
          message: 'Arsa ödemesi bulunamadı'
        });
      }
      
      res.json({
        success: true,
        data: landPayment.toJSON()
      });
    } catch (error) {
      console.error('Error fetching land payment:', error);
      res.status(500).json({
        success: false,
        message: 'Arsa ödemesi alınırken hata oluştu'
      });
    }
  }

  // Create a new land payment
  static async createLandPayment(req, res) {
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
      const landData = req.body;
      
      const landPayment = await LandPayment.create(userId, landData);
      
      res.status(201).json({
        success: true,
        message: 'Arsa ödemesi başarıyla oluşturuldu',
        data: landPayment.toJSON()
      });
    } catch (error) {
      console.error('Error creating land payment:', error);
      res.status(500).json({
        success: false,
        message: 'Arsa ödemesi oluşturulurken hata oluştu'
      });
    }
  }

  // Update a land payment
  static async updateLandPayment(req, res) {
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
      
      const landPayment = await LandPayment.update(id, userId, updateData);
      
      if (!landPayment) {
        return res.status(404).json({
          success: false,
          message: 'Arsa ödemesi bulunamadı'
        });
      }
      
      res.json({
        success: true,
        message: 'Arsa ödemesi başarıyla güncellendi',
        data: landPayment.toJSON()
      });
    } catch (error) {
      console.error('Error updating land payment:', error);
      res.status(500).json({
        success: false,
        message: 'Arsa ödemesi güncellenirken hata oluştu'
      });
    }
  }

  // Delete a land payment (soft delete)
  static async deleteLandPayment(req, res) {
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
      
      const deleted = await LandPayment.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Arsa ödemesi bulunamadı'
        });
      }
      
      res.json({
        success: true,
        message: 'Arsa ödemesi başarıyla silindi'
      });
    } catch (error) {
      console.error('Error deleting land payment:', error);
      res.status(500).json({
        success: false,
        message: 'Arsa ödemesi silinirken hata oluştu'
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
      
      const result = await LandPayment.recordPayment(id, userId, paymentData);
      
      res.json({
        success: true,
        message: 'Ödeme başarıyla kaydedildi',
        data: {
          landPayment: result.landPayment.toJSON(),
          transaction: result.transaction
        }
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Ödeme kaydedilirken hata oluştu'
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
      
      const history = await LandPayment.getPaymentHistory(id, userId);
      
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
      
      const upcomingPayments = await LandPayment.getUpcomingPayments(userId, daysAhead);
      
      res.json({
        success: true,
        data: upcomingPayments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      res.status(500).json({
        success: false,
        message: 'Yaklaşan ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get overdue payments
  static async getOverduePayments(req, res) {
    try {
      const userId = req.user.id;
      
      const overduePayments = await LandPayment.getOverduePayments(userId);
      
      res.json({
        success: true,
        data: overduePayments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      res.status(500).json({
        success: false,
        message: 'Geciken ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get summary statistics
  static async getSummary(req, res) {
    try {
      const userId = req.user.id;
      
      const summary = await LandPayment.getSummary(userId);
      
      res.json({
        success: true,
        data: {
          totalLands: parseInt(summary.total_lands),
          activeLands: parseInt(summary.active_lands),
          totalInvestment: parseFloat(summary.total_investment),
          totalPaid: parseFloat(summary.total_paid),
          totalRemaining: parseFloat(summary.total_remaining),
          monthlyTotal: parseFloat(summary.monthly_total),
          completionPercentage: summary.total_investment > 0 
            ? Math.round((summary.total_paid / summary.total_investment) * 100) 
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
}

module.exports = LandPaymentController;