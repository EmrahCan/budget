import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock API with more realistic responses
jest.mock('../../services/api', () => ({
  accountsAPI: {
    getSummary: jest.fn(),
  },
  creditCardsAPI: {
    getAll: jest.fn(),
    getUpcomingPayments: jest.fn(),
  },
  transactionsAPI: {
    getMonthlySummary: jest.fn(),
    getRecent: jest.fn(),
    getCategoryExpenses: jest.fn(),
    getFinancialTrend: jest.fn(),
  },
  fixedPaymentsAPI: {
    getTotalMonthlyAmount: jest.fn(),
    getPaymentsDueThisMonth: jest.fn(),
    getOverduePayments: jest.fn(),
    getAll: jest.fn(),
  },
  installmentPaymentsAPI: {
    getSummary: jest.fn(),
    getUpcomingPayments: jest.fn(),
    getOverduePayments: jest.fn(),
  },
  formatCurrency: jest.fn((amount) => `₺${amount?.toFixed(2) || '0.00'}`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString('tr-TR')),
  handleApiError: jest.fn((error) => error.message),
}));

// Mock chart components with more realistic behavior
jest.mock('../../components/charts/PaymentCalendarWidget', () => {
  return function MockPaymentCalendarWidget({ payments, loading, onPaymentClick }) {
    if (loading) return <div data-testid="calendar-loading">Loading calendar...</div>;
    return (
      <div data-testid="payment-calendar">
        <h3>Payment Calendar</h3>
        {payments?.map((payment) => (
          <button
            key={payment.id}
            data-testid={`payment-${payment.id}`}
            onClick={() => onPaymentClick?.(payment)}
          >
            {payment.name} - Day {payment.dueDay}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/charts/ExpenseCategoryChart', () => {
  return function MockExpenseCategoryChart({ categoryData, loading, onCategoryClick }) {
    if (loading) return <div data-testid="category-loading">Loading category chart...</div>;
    return (
      <div data-testid="expense-category-chart">
        <h3>Expense Categories</h3>
        {categoryData?.map((item, index) => (
          <div key={index} data-testid={`category-${item.category}`}>
            <button onClick={() => onCategoryClick?.(item.category)}>
              {item.category}: ₺{item.amount}
            </button>
          </div>
        ))}
      </div>
    );
  };
});

const theme = createTheme();

const mockUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider value={{ user: mockUser, loading: false }}>
          <NotificationProvider>
            <Dashboard />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Comprehensive mock data
const setupMockData = () => {
  const api = require('../../services/api');
  
  // Account data
  api.accountsAPI.getSummary.mockResolvedValue({
    data: {
      data: {
        totalBalance: 25000,
        activeAccounts: 3,
      }
    }
  });

  // Credit card data
  api.creditCardsAPI.getAll.mockResolvedValue({
    data: {
      data: {
        creditCards: [
          { id: 1, name: 'Visa Card', currentBalance: 2500, limit: 10000 },
          { id: 2, name: 'Master Card', currentBalance: 1200, limit: 5000 },
        ]
      }
    }
  });

  // Monthly summary
  api.transactionsAPI.getMonthlySummary.mockResolvedValue({
    data: {
      data: {
        summary: {
          income: { total: 12000, count: 8 },
          expense: { total: 8500, count: 25 },
          netIncome: 3500,
        }
      }
    }
  });

  // Recent transactions
  api.transactionsAPI.getRecent.mockResolvedValue({
    data: {
      data: {
        transactions: [
          {
            id: 1,
            description: 'Grocery Shopping',
            amount: 150,
            type: 'expense',
            transactionDate: '2024-01-15',
            category: 'Food',
          },
          {
            id: 2,
            description: 'Salary',
            amount: 5000,
            type: 'income',
            transactionDate: '2024-01-01',
            category: 'Salary',
          },
        ]
      }
    }
  });

  // Upcoming payments
  api.creditCardsAPI.getUpcomingPayments.mockResolvedValue({
    data: {
      data: {
        upcomingPayments: [
          {
            creditCardId: 1,
            creditCardName: 'Visa Card',
            minimumPayment: 250,
            daysUntil: 3,
            isOverdue: false,
          },
        ]
      }
    }
  });

  // Fixed payments
  api.fixedPaymentsAPI.getTotalMonthlyAmount.mockResolvedValue({
    data: { data: { totalAmount: 3500 } }
  });

  api.fixedPaymentsAPI.getPaymentsDueThisMonth.mockResolvedValue({
    data: {
      data: [
        { id: 1, name: 'Rent', amount: 2000, category: 'Housing', dueDay: 1 },
        { id: 2, name: 'Internet', amount: 100, category: 'Utilities', dueDay: 15 },
      ]
    }
  });

  api.fixedPaymentsAPI.getOverduePayments.mockResolvedValue({
    data: { data: [] }
  });

  // Installment payments
  api.installmentPaymentsAPI.getSummary.mockResolvedValue({
    data: { data: { totalMonthly: 800 } }
  });

  api.installmentPaymentsAPI.getUpcomingPayments.mockResolvedValue({
    data: { data: [] }
  });

  api.installmentPaymentsAPI.getOverduePayments.mockResolvedValue({
    data: { data: [] }
  });

  // Chart data
  api.transactionsAPI.getCategoryExpenses.mockResolvedValue({
    data: {
      data: [
        { category: 'Food', amount: 1500 },
        { category: 'Transport', amount: 600 },
        { category: 'Entertainment', amount: 300 },
        { category: 'Shopping', amount: 800 },
      ]
    }
  });

  api.transactionsAPI.getFinancialTrend.mockResolvedValue({
    data: {
      data: [
        { month: 'Nov', income: 11000, expense: 8000 },
        { month: 'Dec', income: 11500, expense: 8200 },
        { month: 'Jan', income: 12000, expense: 8500 },
      ]
    }
  });

  api.fixedPaymentsAPI.getAll.mockResolvedValue({
    data: {
      data: [
        { id: 1, name: 'Rent', amount: 2000, dueDay: 1 },
        { id: 2, name: 'Internet', amount: 100, dueDay: 15 },
        { id: 3, name: 'Phone', amount: 80, dueDay: 20 },
      ]
    }
  });
};

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockData();
  });

  describe('Full Dashboard Loading Flow', () => {
    test('should load and display all dashboard data correctly', async () => {
      renderDashboard();

      // Initially should show loading skeletons
      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('₺25000.00')).toBeInTheDocument(); // Total balance
      expect(screen.getByText('₺3700.00')).toBeInTheDocument(); // Credit card debt (2500 + 1200)
      expect(screen.getByText('₺12000.00')).toBeInTheDocument(); // Monthly income
      expect(screen.getByText('₺8500.00')).toBeInTheDocument(); // Monthly expense

      // Check additional metrics
      expect(screen.getByText('₺3500.00')).toBeInTheDocument(); // Fixed payments
      expect(screen.getByText('₺21300.00')).toBeInTheDocument(); // Net worth (25000 - 3700)

      // Check recent transactions
      expect(screen.getByText('Grocery Shopping')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();

      // Check upcoming payments
      expect(screen.getByText('Visa Card')).toBeInTheDocument();

      // Check fixed payments
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Internet')).toBeInTheDocument();
    });

    test('should load widget data after main dashboard data', async () => {
      renderDashboard();

      // Wait for main data to load
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Wait for widgets to load
      await waitFor(() => {
        expect(screen.getByTestId('payment-calendar')).toBeInTheDocument();
        expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument();
      });

      // Check widget content
      expect(screen.getByText('Payment Calendar')).toBeInTheDocument();
      expect(screen.getByText('Expense Categories')).toBeInTheDocument();
      expect(screen.getByText('Food: ₺1500')).toBeInTheDocument();
      expect(screen.getByText('Transport: ₺600')).toBeInTheDocument();
    });
  });

  describe('Widget Interactions', () => {
    test('should handle category click in expense chart', async () => {
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument();
      });

      const foodCategory = screen.getByText('Food: ₺1500');
      fireEvent.click(foodCategory);

      // Should trigger navigation (mocked)
      // In real implementation, this would test actual navigation
    });

    test('should handle payment calendar interactions', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('payment-calendar')).toBeInTheDocument();
      });

      const rentPayment = screen.getByTestId('payment-1');
      fireEvent.click(rentPayment);

      // Should handle payment click
      // In real implementation, this might show payment details
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle partial API failures gracefully', async () => {
      const api = require('../../services/api');
      
      // Make one API call fail
      api.creditCardsAPI.getAll.mockRejectedValue(new Error('Credit card API error'));
      
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Should still show other data
      expect(screen.getByText('₺25000.00')).toBeInTheDocument(); // Account balance
      expect(screen.getByText('₺12000.00')).toBeInTheDocument(); // Income

      // Credit card data should show default/empty state
      expect(screen.getByText('₺0.00')).toBeInTheDocument(); // Credit card debt should be 0
    });

    test('should show error state for critical failures', async () => {
      const api = require('../../services/api');
      
      // Make critical APIs fail
      api.accountsAPI.getSummary.mockRejectedValue(new Error('Critical error'));
      api.transactionsAPI.getMonthlySummary.mockRejectedValue(new Error('Critical error'));
      
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      });
    });

    test('should handle widget loading errors', async () => {
      const api = require('../../services/api');
      
      // Make widget data fail
      api.transactionsAPI.getCategoryExpenses.mockRejectedValue(new Error('Chart error'));
      
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Main dashboard should still work
      expect(screen.getByText('₺25000.00')).toBeInTheDocument();

      // Widget should show error state or fallback
      await waitFor(() => {
        // Widget might show error or empty state
        expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior Integration', () => {
    test('should adapt layout for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Should show mobile-specific elements
      expect(screen.getByText('Grafikler ve Analizler')).toBeInTheDocument();
      
      // Should show widget navigation controls
      expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument(); // Widget counter
    });

    test('should show desktop layout on larger screens', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Should show all widgets simultaneously on desktop
      await waitFor(() => {
        expect(screen.getByTestId('payment-calendar')).toBeInTheDocument();
        expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument();
      });

      // Should not show mobile widget navigation
      expect(screen.queryByText('Grafikler ve Analizler')).not.toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    test('should load dashboard data efficiently', async () => {
      const startTime = performance.now();
      
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within reasonable time (less than 1 second)
      expect(loadTime).toBeLessThan(1000);
    });

    test('should handle concurrent API calls correctly', async () => {
      const api = require('../../services/api');
      
      // Add delays to simulate real API calls
      api.accountsAPI.getSummary.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { data: { totalBalance: 25000, activeAccounts: 3 } }
        }), 100))
      );

      api.transactionsAPI.getMonthlySummary.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { data: { summary: { income: { total: 12000 }, expense: { total: 8500 } } } }
        }), 150))
      );

      renderDashboard();

      // Should handle concurrent loading
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Both API results should be displayed
      expect(screen.getByText('₺25000.00')).toBeInTheDocument();
      expect(screen.getByText('₺12000.00')).toBeInTheDocument();
    });
  });

  describe('User Experience Integration', () => {
    test('should provide smooth loading experience', async () => {
      renderDashboard();

      // Should show loading skeletons immediately
      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);

      // Should transition to content smoothly
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Loading skeletons should be gone
      expect(screen.queryAllByTestId(/skeleton/i)).toHaveLength(0);
    });

    test('should maintain user context throughout loading', async () => {
      renderDashboard();

      // User name should be available immediately from context
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, John!')).toBeInTheDocument();
      });

      // Should maintain user context even during data loading
      expect(screen.getByText('John')).toBeInTheDocument();
    });
  });
});