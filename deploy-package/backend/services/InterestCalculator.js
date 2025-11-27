class InterestCalculator {
  constructor(creditCard) {
    this.creditCard = creditCard;
    this.balance = creditCard.currentBalance;
    this.interestRate = creditCard.interestRate;
    this.minimumPaymentRate = creditCard.minimumPaymentRate;
  }

  // Calculate monthly interest rate
  getMonthlyInterestRate() {
    return this.interestRate / 12 / 100;
  }

  // Calculate daily interest rate
  getDailyInterestRate() {
    return this.interestRate / 365 / 100;
  }

  // Calculate monthly interest amount
  calculateMonthlyInterest(balance = null) {
    const currentBalance = balance || this.balance;
    const monthlyRate = this.getMonthlyInterestRate();
    return Math.round(currentBalance * monthlyRate * 100) / 100;
  }

  // Calculate minimum payment
  calculateMinimumPayment(balance = null) {
    const currentBalance = balance || this.balance;
    const minPayment = currentBalance * (this.minimumPaymentRate / 100);
    return Math.max(minPayment, 50); // Minimum 50 TL
  }

  // Calculate payment schedule with different payment amounts
  generatePaymentSchedule(paymentAmount, maxMonths = 60) {
    if (paymentAmount <= 0 || this.balance <= 0) {
      return [];
    }

    const schedule = [];
    let remainingBalance = this.balance;
    let month = 1;
    let totalInterestPaid = 0;

    while (remainingBalance > 0.01 && month <= maxMonths) {
      const monthlyInterest = this.calculateMonthlyInterest(remainingBalance);
      const principalPayment = Math.min(paymentAmount - monthlyInterest, remainingBalance);
      
      // If payment is less than interest, debt will grow
      if (paymentAmount < monthlyInterest) {
        return {
          error: 'Ödeme tutarı aylık faizden düşük, borç artacak',
          minimumRequired: Math.ceil(monthlyInterest + 1)
        };
      }

      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      totalInterestPaid += monthlyInterest;

      schedule.push({
        month,
        paymentAmount: Math.round(paymentAmount * 100) / 100,
        interestPayment: Math.round(monthlyInterest * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100
      });

      month++;
    }

    return {
      schedule,
      summary: {
        totalPayments: schedule.length,
        totalAmountPaid: Math.round((this.balance + totalInterestPaid) * 100) / 100,
        totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
        monthlyPayment: paymentAmount,
        payoffDate: this.calculatePayoffDate(schedule.length)
      }
    };
  }

  // Calculate payoff date
  calculatePayoffDate(months) {
    const today = new Date();
    const payoffDate = new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
    return payoffDate;
  }

  // Compare different payment scenarios
  comparePaymentScenarios(paymentAmounts) {
    const scenarios = [];

    paymentAmounts.forEach(amount => {
      const result = this.generatePaymentSchedule(amount);
      
      if (!result.error) {
        scenarios.push({
          paymentAmount: amount,
          ...result.summary
        });
      } else {
        scenarios.push({
          paymentAmount: amount,
          error: result.error,
          minimumRequired: result.minimumRequired
        });
      }
    });

    return scenarios;
  }

  // Calculate time to pay off with minimum payments
  calculateMinimumPayoffTime() {
    const minPayment = this.calculateMinimumPayment();
    return this.generatePaymentSchedule(minPayment);
  }

  // Calculate optimal payment to pay off in specific months
  calculatePaymentForTargetMonths(targetMonths) {
    if (targetMonths <= 0 || this.balance <= 0) {
      return null;
    }

    // Binary search for the right payment amount
    let low = this.calculateMinimumPayment();
    let high = this.balance * 2; // Upper bound
    let precision = 0.01;

    while (high - low > precision) {
      const mid = (low + high) / 2;
      const result = this.generatePaymentSchedule(mid);
      
      if (result.error) {
        low = mid;
      } else if (result.schedule.length > targetMonths) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return Math.ceil(high);
  }

  // Calculate interest savings by paying more than minimum
  calculateInterestSavings(extraPayment) {
    const minPayment = this.calculateMinimumPayment();
    const minScenario = this.generatePaymentSchedule(minPayment);
    const extraScenario = this.generatePaymentSchedule(minPayment + extraPayment);

    if (minScenario.error || extraScenario.error) {
      return null;
    }

    return {
      minimumPayment: {
        monthlyPayment: minPayment,
        totalInterest: minScenario.summary.totalInterestPaid,
        payoffMonths: minScenario.summary.totalPayments
      },
      extraPayment: {
        monthlyPayment: minPayment + extraPayment,
        totalInterest: extraScenario.summary.totalInterestPaid,
        payoffMonths: extraScenario.summary.totalPayments
      },
      savings: {
        interestSaved: Math.round((minScenario.summary.totalInterestPaid - extraScenario.summary.totalInterestPaid) * 100) / 100,
        monthsSaved: minScenario.summary.totalPayments - extraScenario.summary.totalPayments,
        percentageSaved: Math.round(((minScenario.summary.totalInterestPaid - extraScenario.summary.totalInterestPaid) / minScenario.summary.totalInterestPaid) * 100 * 100) / 100
      }
    };
  }

  // Calculate compound interest growth if no payments made
  calculateDebtGrowth(months) {
    const growth = [];
    let balance = this.balance;
    const monthlyRate = this.getMonthlyInterestRate();

    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      balance += interest;
      
      growth.push({
        month,
        balance: Math.round(balance * 100) / 100,
        interestAdded: Math.round(interest * 100) / 100,
        totalInterestAccrued: Math.round((balance - this.balance) * 100) / 100
      });
    }

    return growth;
  }

  // Get payment recommendations
  getPaymentRecommendations() {
    const minPayment = this.calculateMinimumPayment();
    const recommendations = [];

    // Minimum payment scenario
    const minScenario = this.generatePaymentSchedule(minPayment);
    if (!minScenario.error) {
      recommendations.push({
        type: 'minimum',
        title: 'Minimum Ödeme',
        description: 'Sadece minimum ödeme yaparak',
        paymentAmount: minPayment,
        ...minScenario.summary
      });
    }

    // 2x minimum payment
    const doubleMinScenario = this.generatePaymentSchedule(minPayment * 2);
    if (!doubleMinScenario.error) {
      recommendations.push({
        type: 'double_minimum',
        title: '2x Minimum Ödeme',
        description: 'Minimum ödemenin iki katını ödeyerek',
        paymentAmount: minPayment * 2,
        ...doubleMinScenario.summary
      });
    }

    // 12-month payoff
    const payment12Months = this.calculatePaymentForTargetMonths(12);
    if (payment12Months) {
      const scenario12 = this.generatePaymentSchedule(payment12Months);
      if (!scenario12.error) {
        recommendations.push({
          type: '12_months',
          title: '12 Ayda Bitir',
          description: '1 yılda tamamlamak için',
          paymentAmount: payment12Months,
          ...scenario12.summary
        });
      }
    }

    // 6-month payoff
    const payment6Months = this.calculatePaymentForTargetMonths(6);
    if (payment6Months) {
      const scenario6 = this.generatePaymentSchedule(payment6Months);
      if (!scenario6.error) {
        recommendations.push({
          type: '6_months',
          title: '6 Ayda Bitir',
          description: '6 ayda tamamlamak için',
          paymentAmount: payment6Months,
          ...scenario6.summary
        });
      }
    }

    return recommendations;
  }

  // Calculate avalanche vs snowball method comparison
  static compareDebtStrategies(creditCards) {
    // This would be used for multiple credit cards
    // Avalanche: Pay minimums on all, extra on highest interest rate
    // Snowball: Pay minimums on all, extra on smallest balance
    
    const avalanche = [...creditCards].sort((a, b) => b.interestRate - a.interestRate);
    const snowball = [...creditCards].sort((a, b) => a.currentBalance - b.currentBalance);

    return {
      avalanche: {
        order: avalanche.map(card => ({
          id: card.id,
          name: card.name,
          balance: card.currentBalance,
          interestRate: card.interestRate,
          priority: 'En yüksek faiz oranı'
        }))
      },
      snowball: {
        order: snowball.map(card => ({
          id: card.id,
          name: card.name,
          balance: card.currentBalance,
          interestRate: card.interestRate,
          priority: 'En düşük bakiye'
        }))
      }
    };
  }
}

module.exports = InterestCalculator;