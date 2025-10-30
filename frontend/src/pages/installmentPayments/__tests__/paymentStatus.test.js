/**
 * Unit tests for payment status calculation logic
 */

describe('Payment Status Calculation', () => {
  // Mock the status calculation logic that should be in the component
  const calculatePaymentStatus = (payment) => {
    try {
      if (!payment) {
        throw new Error('Payment object is null or undefined');
      }

      // If payment is 100% completed
      if (payment.completionPercentage === 100) {
        return {
          status: 'completed',
          label: 'Tamamlandı',
          color: 'success',
          priority: 1
        };
      }
      
      // If payment is overdue (trust the API flag if available)
      if (payment.isOverdue) {
        return {
          status: 'overdue',
          label: 'Gecikmiş',
          color: 'error',
          priority: 4
        };
      }
      
      // Calculate days until payment
      const today = new Date();
      const paymentDate = new Date(payment.nextPaymentDate);
      const daysUntil = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));
      
      // If payment is today
      if (daysUntil === 0) {
        return {
          status: 'today',
          label: 'Bugün',
          color: 'warning',
          priority: 3,
          daysUntil: 0
        };
      }
      
      // If payment is overdue (negative days)
      if (daysUntil < 0) {
        return {
          status: 'overdue',
          label: 'Gecikmiş',
          color: 'error',
          priority: 4,
          daysUntil
        };
      }
      
      // If payment is due within 7 days
      if (daysUntil > 0 && daysUntil <= 7) {
        return {
          status: 'upcoming',
          label: `${daysUntil} gün kaldı`,
          color: 'warning',
          priority: 3,
          daysUntil
        };
      }
      
      // If payment is due within 30 days
      if (daysUntil > 7 && daysUntil <= 30) {
        return {
          status: 'pending',
          label: `${daysUntil} gün kaldı`,
          color: 'info',
          priority: 2,
          daysUntil
        };
      }
      
      // If payment is far in the future
      return {
        status: 'future',
        label: `${daysUntil} gün kaldı`,
        color: 'default',
        priority: 1,
        daysUntil
      };
      
    } catch (error) {
      return {
        status: 'error',
        label: 'Hata',
        color: 'default',
        priority: 1
      };
    }
  };

  describe('Completed Payments', () => {
    test('identifies completed payments correctly', () => {
      const payment = {
        id: 1,
        completionPercentage: 100,
        isOverdue: false,
        nextPaymentDate: '2024-06-01'
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('completed');
      expect(result.label).toBe('Tamamlandı');
      expect(result.color).toBe('success');
      expect(result.priority).toBe(1);
    });

    test('prioritizes completion over overdue status', () => {
      const payment = {
        id: 1,
        completionPercentage: 100,
        isOverdue: true, // This should be ignored
        nextPaymentDate: '2024-01-01'
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('completed');
    });
  });

  describe('Overdue Payments', () => {
    test('identifies overdue payments from API flag', () => {
      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: true,
        nextPaymentDate: '2024-01-01'
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('overdue');
      expect(result.label).toBe('Gecikmiş');
      expect(result.color).toBe('error');
      expect(result.priority).toBe(4);
    });

    test('identifies overdue payments from date calculation', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: yesterday.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('overdue');
      expect(result.daysUntil).toBeLessThan(0);
    });
  });

  describe('Today Payments', () => {
    test('identifies payments due today', () => {
      const today = new Date();
      
      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: today.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('today');
      expect(result.label).toBe('Bugün');
      expect(result.color).toBe('warning');
      expect(result.priority).toBe(3);
      expect(result.daysUntil).toBe(0);
    });
  });

  describe('Upcoming Payments', () => {
    test('identifies payments due within 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: futureDate.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('upcoming');
      expect(result.label).toBe('5 gün kaldı');
      expect(result.color).toBe('warning');
      expect(result.priority).toBe(3);
      expect(result.daysUntil).toBe(5);
    });

    test('handles edge case of exactly 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: futureDate.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('upcoming');
      expect(result.daysUntil).toBe(7);
    });
  });

  describe('Pending Payments', () => {
    test('identifies payments due within 8-30 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: futureDate.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('pending');
      expect(result.label).toBe('15 gün kaldı');
      expect(result.color).toBe('info');
      expect(result.priority).toBe(2);
      expect(result.daysUntil).toBe(15);
    });

    test('handles edge case of exactly 30 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: futureDate.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('pending');
      expect(result.daysUntil).toBe(30);
    });
  });

  describe('Future Payments', () => {
    test('identifies payments due after 30 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);

      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: futureDate.toISOString()
      };

      const result = calculatePaymentStatus(payment);

      expect(result.status).toBe('future');
      expect(result.label).toBe('45 gün kaldı');
      expect(result.color).toBe('default');
      expect(result.priority).toBe(1);
      expect(result.daysUntil).toBe(45);
    });
  });

  describe('Error Handling', () => {
    test('handles null payment object', () => {
      const result = calculatePaymentStatus(null);

      expect(result.status).toBe('error');
      expect(result.label).toBe('Hata');
      expect(result.color).toBe('default');
      expect(result.priority).toBe(1);
    });

    test('handles undefined payment object', () => {
      const result = calculatePaymentStatus(undefined);

      expect(result.status).toBe('error');
    });

    test('handles payment with invalid date', () => {
      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false,
        nextPaymentDate: 'invalid-date'
      };

      const result = calculatePaymentStatus(payment);

      // Should still return a valid status object
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('priority');
    });

    test('handles payment with missing nextPaymentDate', () => {
      const payment = {
        id: 1,
        completionPercentage: 50,
        isOverdue: false
        // nextPaymentDate is missing
      };

      const result = calculatePaymentStatus(payment);

      // Should still return a valid status object
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
    });
  });

  describe('Priority Ordering', () => {
    test('assigns correct priority levels', () => {
      const completedPayment = { completionPercentage: 100, isOverdue: false };
      const overduePayment = { completionPercentage: 50, isOverdue: true };
      const todayPayment = { 
        completionPercentage: 50, 
        isOverdue: false, 
        nextPaymentDate: new Date().toISOString() 
      };
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const pendingPayment = { 
        completionPercentage: 50, 
        isOverdue: false, 
        nextPaymentDate: futureDate.toISOString() 
      };

      expect(calculatePaymentStatus(completedPayment).priority).toBe(1);
      expect(calculatePaymentStatus(overduePayment).priority).toBe(4);
      expect(calculatePaymentStatus(todayPayment).priority).toBe(3);
      expect(calculatePaymentStatus(pendingPayment).priority).toBe(2);
    });

    test('overdue payments have highest priority', () => {
      const overduePayment = { completionPercentage: 50, isOverdue: true };
      const result = calculatePaymentStatus(overduePayment);
      
      expect(result.priority).toBe(4);
    });

    test('completed payments have lowest priority', () => {
      const completedPayment = { completionPercentage: 100, isOverdue: false };
      const result = calculatePaymentStatus(completedPayment);
      
      expect(result.priority).toBe(1);
    });
  });
});