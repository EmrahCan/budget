const FixedPayment = require('../models/FixedPayment');
const { validationResult } = require('express-validator');

class FixedPaymentController {
  // Get all fixed payments for the authenticated user
  static async getFixedPayments(req, res) {
    try {
      const userId = req.user.id;
      const includeInactive = req.query.include_inactive === 'true';
      
      const payments = await FixedPayment.findByUserId(userId, includeInactive);
      
      res.json({
        success: true,
        data: payments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching fixed payments:', error);
      res.status(500).json({
        success: false,
        message: 'Sabit ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get a specific fixed payment
  static async getFixedPayment(req, res) {
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
      
      const payment = await FixedPayment.findById(id, userId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Sabit ödeme bulunamadı'
        });
      }
      
      res.json({
        success: true,
        data: payment.toJSON()
      });
    } catch (error) {
      console.error('Error fetching fixed payment:', error);
      res.status(500).json({
        success: false,
        message: 'Sabit ödeme alınırken hata oluştu'
      });
    }
  }

  // Create a new fixed payment
  static async createFixedPayment(req, res) {
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
      const { name, amount, category, dueDay } = req.body;
      
      const payment = await FixedPayment.create(userId, {
        name,
        amount: parseFloat(amount),
        category,
        dueDay: parseInt(dueDay)
      });
      
      res.status(201).json({
        success: true,
        message: 'Sabit ödeme başarıyla oluşturuldu',
        data: payment.toJSON()
      });
    } catch (error) {
      console.error('Error creating fixed payment:', error);
      res.status(500).json({
        success: false,
        message: 'Sabit ödeme oluşturulurken hata oluştu'
      });
    }
  }

  // Update a fixed payment
  static async updateFixedPayment(req, res) {
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
      const { name, amount, category, dueDay, isActive } = req.body;
      
      const payment = await FixedPayment.update(id, userId, {
        name,
        amount: parseFloat(amount),
        category,
        dueDay: parseInt(dueDay),
        isActive: isActive !== undefined ? isActive : true
      });
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Sabit ödeme bulunamadı'
        });
      }
      
      res.json({
        success: true,
        message: 'Sabit ödeme başarıyla güncellendi',
        data: payment.toJSON()
      });
    } catch (error) {
      console.error('Error updating fixed payment:', error);
      res.status(500).json({
        success: false,
        message: 'Sabit ödeme güncellenirken hata oluştu'
      });
    }
  }

  // Delete a fixed payment (soft delete)
  static async deleteFixedPayment(req, res) {
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
      
      const deleted = await FixedPayment.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Sabit ödeme bulunamadı'
        });
      }
      
      res.json({
        success: true,
        message: 'Sabit ödeme başarıyla silindi'
      });
    } catch (error) {
      console.error('Error deleting fixed payment:', error);
      res.status(500).json({
        success: false,
        message: 'Sabit ödeme silinirken hata oluştu'
      });
    }
  }

  // Get monthly payment schedule
  static async getMonthlySchedule(req, res) {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;
      
      // Default to current month/year if not provided
      const now = new Date();
      const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
      const targetYear = year ? parseInt(year) : now.getFullYear();
      
      // Validate month and year
      if (targetMonth < 1 || targetMonth > 12) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ay değeri (1-12 arası olmalı)'
        });
      }
      
      if (targetYear < 2020 || targetYear > 2030) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz yıl değeri'
        });
      }
      
      const schedule = await FixedPayment.generateMonthlySchedule(userId, targetMonth, targetYear);
      
      res.json({
        success: true,
        data: {
          month: targetMonth,
          year: targetYear,
          payments: schedule,
          totalAmount: schedule.reduce((sum, payment) => sum + payment.amount, 0)
        }
      });
    } catch (error) {
      console.error('Error generating monthly schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Aylık ödeme planı oluşturulurken hata oluştu'
      });
    }
  }

  // Get payments due this month
  static async getPaymentsDueThisMonth(req, res) {
    try {
      const userId = req.user.id;
      
      const payments = await FixedPayment.getPaymentsDueThisMonth(userId);
      
      res.json({
        success: true,
        data: payments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching payments due this month:', error);
      res.status(500).json({
        success: false,
        message: 'Bu ay ödenecek ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get overdue payments
  static async getOverduePayments(req, res) {
    try {
      const userId = req.user.id;
      
      const payments = await FixedPayment.getOverduePayments(userId);
      
      res.json({
        success: true,
        data: payments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      res.status(500).json({
        success: false,
        message: 'Geciken ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get total monthly amount
  static async getTotalMonthlyAmount(req, res) {
    try {
      const userId = req.user.id;
      
      const total = await FixedPayment.getTotalMonthlyAmount(userId);
      
      res.json({
        success: true,
        data: {
          totalAmount: total
        }
      });
    } catch (error) {
      console.error('Error calculating total monthly amount:', error);
      res.status(500).json({
        success: false,
        message: 'Toplam aylık tutar hesaplanırken hata oluştu'
      });
    }
  }

  // Get payments by category
  static async getPaymentsByCategory(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.params;
      
      const payments = await FixedPayment.getByCategory(userId, category);
      
      res.json({
        success: true,
        data: payments.map(payment => payment.toJSON())
      });
    } catch (error) {
      console.error('Error fetching payments by category:', error);
      res.status(500).json({
        success: false,
        message: 'Kategoriye göre ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get all categories
  static async getCategories(req, res) {
    try {
      const userId = req.user.id;
      
      const categories = await FixedPayment.getCategories(userId);
      
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

module.exports = FixedPaymentController;