const CreditCard = require('../models/CreditCard');
const InterestCalculator = require('../services/InterestCalculator');
const PaymentScheduler = require('../services/PaymentScheduler');

class CreditCardController {
  // Get all credit cards for the authenticated user
  static async getAllCreditCards(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, includeInactive = false } = req.query;

      const creditCards = await CreditCard.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        includeInactive: includeInactive === 'true'
      });

      res.json({
        success: true,
        data: {
          creditCards: creditCards.map(card => card.toJSON()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: creditCards.length
          }
        }
      });
    } catch (error) {
      console.error('Get credit cards error:', error);
      res.status(500).json({
        success: false,
        message: 'Kredi kartları alınırken hata oluştu'
      });
    }
  }

  // Get a specific credit card
  static async getCreditCard(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      res.json({
        success: true,
        data: {
          creditCard: creditCard.toJSON()
        }
      });
    } catch (error) {
      console.error('Get credit card error:', error);
      res.status(500).json({
        success: false,
        message: 'Kredi kartı bilgileri alınırken hata oluştu'
      });
    }
  }

  // Create a new credit card
  static async createCreditCard(req, res) {
    try {
      const userId = req.user.id;
      const cardData = req.body;

      const creditCard = await CreditCard.create(userId, cardData);

      res.status(201).json({
        success: true,
        message: 'Kredi kartı başarıyla oluşturuldu',
        data: {
          creditCard: creditCard.toJSON()
        }
      });
    } catch (error) {
      console.error('Create credit card error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Kredi kartı oluşturulurken hata oluştu'
      });
    }
  }

  // Update a credit card
  static async updateCreditCard(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      await creditCard.update(updateData);

      res.json({
        success: true,
        message: 'Kredi kartı başarıyla güncellendi',
        data: {
          creditCard: creditCard.toJSON()
        }
      });
    } catch (error) {
      console.error('Update credit card error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Kredi kartı güncellenirken hata oluştu'
      });
    }
  }

  // Delete a credit card (soft delete)
  static async deleteCreditCard(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      await creditCard.delete();

      res.json({
        success: true,
        message: 'Kredi kartı başarıyla silindi'
      });
    } catch (error) {
      console.error('Delete credit card error:', error);
      res.status(500).json({
        success: false,
        message: 'Kredi kartı silinirken hata oluştu'
      });
    }
  }

  // Record a payment
  static async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;
      const userId = req.user.id;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const result = await creditCard.recordPayment(amount, description);

      res.json({
        success: true,
        message: 'Ödeme başarıyla kaydedildi',
        data: {
          creditCard: result.creditCard.toJSON(),
          transaction: result.transaction
        }
      });
    } catch (error) {
      console.error('Record payment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Ödeme kaydedilirken hata oluştu'
      });
    }
  }

  // Add an expense
  static async addExpense(req, res) {
    try {
      const { id } = req.params;
      const { amount, description, category } = req.body;
      const userId = req.user.id;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const result = await creditCard.addExpense(amount, description, category);

      res.json({
        success: true,
        message: 'Harcama başarıyla eklendi',
        data: {
          creditCard: result.creditCard.toJSON(),
          transaction: result.transaction
        }
      });
    } catch (error) {
      console.error('Add expense error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Harcama eklenirken hata oluştu'
      });
    }
  }

  // Get transaction history for a credit card
  static async getTransactions(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, startDate, endDate, type } = req.query;
      const userId = req.user.id;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const transactions = await creditCard.getTransactions({
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        type
      });

      res.json({
        success: true,
        data: {
          transactions,
          creditCard: creditCard.toJSON(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length
          }
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'İşlemler alınırken hata oluştu'
      });
    }
  }

  // Calculate interest and payment schedule
  static async calculateInterest(req, res) {
    try {
      const { id } = req.params;
      const { paymentAmount, targetMonths } = req.query;
      const userId = req.user.id;

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const calculator = new InterestCalculator(creditCard);
      let result = {};

      if (paymentAmount) {
        // Calculate schedule for specific payment amount
        result.paymentSchedule = calculator.generatePaymentSchedule(parseFloat(paymentAmount));
      }

      if (targetMonths) {
        // Calculate payment needed for target months
        result.requiredPayment = calculator.calculatePaymentForTargetMonths(parseInt(targetMonths));
      }

      // Always include basic calculations
      result.basicCalculations = {
        monthlyInterest: calculator.calculateMonthlyInterest(),
        minimumPayment: calculator.calculateMinimumPayment(),
        utilizationPercentage: creditCard.getUtilizationPercentage(),
        availableCredit: creditCard.getAvailableCredit()
      };

      // Get payment recommendations
      result.recommendations = calculator.getPaymentRecommendations();

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Calculate interest error:', error);
      res.status(500).json({
        success: false,
        message: 'Faiz hesaplaması yapılırken hata oluştu'
      });
    }
  }

  // Get payment schedule
  static async getPaymentSchedule(req, res) {
    try {
      const { id } = req.params;
      const { paymentAmount } = req.query;
      const userId = req.user.id;

      if (!paymentAmount) {
        return res.status(400).json({
          success: false,
          message: 'Ödeme tutarı gereklidir'
        });
      }

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const calculator = new InterestCalculator(creditCard);
      const schedule = calculator.generatePaymentSchedule(parseFloat(paymentAmount));

      res.json({
        success: true,
        data: {
          schedule,
          creditCard: creditCard.toJSON()
        }
      });
    } catch (error) {
      console.error('Get payment schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Ödeme planı oluşturulurken hata oluştu'
      });
    }
  }

  // Get upcoming payments for all cards
  static async getUpcomingPayments(req, res) {
    try {
      const userId = req.user.id;
      const { daysAhead = 30 } = req.query;

      const upcomingPayments = await PaymentScheduler.getUpcomingPayments(
        userId, 
        parseInt(daysAhead)
      );

      res.json({
        success: true,
        data: {
          upcomingPayments,
          totalCards: upcomingPayments.length,
          totalMinimumPayments: upcomingPayments.reduce(
            (sum, payment) => sum + payment.minimumPayment, 0
          )
        }
      });
    } catch (error) {
      console.error('Get upcoming payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Yaklaşan ödemeler alınırken hata oluştu'
      });
    }
  }

  // Get payment reminders
  static async getPaymentReminders(req, res) {
    try {
      const userId = req.user.id;

      const reminders = await PaymentScheduler.getPaymentReminders(userId);

      res.json({
        success: true,
        data: {
          reminders,
          count: reminders.length
        }
      });
    } catch (error) {
      console.error('Get payment reminders error:', error);
      res.status(500).json({
        success: false,
        message: 'Ödeme hatırlatıcıları alınırken hata oluştu'
      });
    }
  }

  // Get monthly payment calendar
  static async getPaymentCalendar(req, res) {
    try {
      const userId = req.user.id;
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

      const calendar = await PaymentScheduler.getMonthlyPaymentCalendar(
        userId, 
        parseInt(year), 
        parseInt(month)
      );

      res.json({
        success: true,
        data: calendar
      });
    } catch (error) {
      console.error('Get payment calendar error:', error);
      res.status(500).json({
        success: false,
        message: 'Ödeme takvimi alınırken hata oluştu'
      });
    }
  }

  // Compare payment scenarios
  static async comparePaymentScenarios(req, res) {
    try {
      const { id } = req.params;
      const { paymentAmounts } = req.body; // Array of payment amounts
      const userId = req.user.id;

      if (!Array.isArray(paymentAmounts) || paymentAmounts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Ödeme tutarları dizisi gereklidir'
        });
      }

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const calculator = new InterestCalculator(creditCard);
      const scenarios = calculator.comparePaymentScenarios(paymentAmounts);

      res.json({
        success: true,
        data: {
          scenarios,
          creditCard: creditCard.toJSON()
        }
      });
    } catch (error) {
      console.error('Compare payment scenarios error:', error);
      res.status(500).json({
        success: false,
        message: 'Ödeme senaryoları karşılaştırılırken hata oluştu'
      });
    }
  }

  // Get interest savings calculation
  static async getInterestSavings(req, res) {
    try {
      const { id } = req.params;
      const { extraPayment } = req.query;
      const userId = req.user.id;

      if (!extraPayment) {
        return res.status(400).json({
          success: false,
          message: 'Ekstra ödeme tutarı gereklidir'
        });
      }

      const creditCard = await CreditCard.findById(id, userId);
      if (!creditCard) {
        return res.status(404).json({
          success: false,
          message: 'Kredi kartı bulunamadı'
        });
      }

      const calculator = new InterestCalculator(creditCard);
      const savings = calculator.calculateInterestSavings(parseFloat(extraPayment));

      res.json({
        success: true,
        data: {
          savings,
          creditCard: creditCard.toJSON()
        }
      });
    } catch (error) {
      console.error('Get interest savings error:', error);
      res.status(500).json({
        success: false,
        message: 'Faiz tasarrufu hesaplanırken hata oluştu'
      });
    }
  }
}

module.exports = CreditCardController;