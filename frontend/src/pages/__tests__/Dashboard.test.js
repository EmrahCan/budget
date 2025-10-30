import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock API
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
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  handleApiError: jest.fn((error) => error.message),
}));

// Mock chart components
jest.mock('../../components/charts/PaymentCalendarWidget', () => {
  return function MockPaymentCalendarWidget({ payments, loading }) {
    if (loading) return <div>Loading calendar...</div>;
    return <div data-testid="payment-calendar">Payment Calendar Widget</div>;
  };
});

jest.mock('../../components/charts/ExpenseCategoryChart', () => {
  return function MockExpenseCategoryChart({ categoryData, loading, onCategoryClick }) {
    if (loading) return <div>Loading category chart...</div>;
    return (
      <div data-testid="expense-category-chart">
        <div>Expense Category Chart</div>
        {categoryData?.map((item, index) => (
          <button key={index} onClick={() => onCategoryClick?.(item.category)}>
            {item.category}: {item.amount}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/charts/FinancialTrendChart', () => {
  return function MockFinancialTrendChart({ trendData, loading }) {
    if (loading) return <div>Loading trend chart...</div>;
    return <div data-testid="financial-trend-chart">Financial Trend Chart</div>;
  };
});

jest.mock('../../components/charts/BudgetComparisonWidget', () => {
  return function MockBudgetComparisonWidget({ budgetData, actualData, loading, onBudgetUpdate }) {
    if (loading) return <div>Loading budget widget...</div>;
    return (
      <div data-testid="budget-comparison-widget">
        <div>Budget Comparison Widget</div>
        {Object.entries(budgetData || {}).map(([category, budget]) => (
          <div key={category}>
            {category}: Budget {budget}, Actual {actualData?.[category] || 0}
            <button onClick={() => onBudgetUpdate?.(category, budget + 100)}>
              Update Budget
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/charts/FinancialMetricsWidget', () => {
  return function MockFinancialMetricsWidget({ metricsData, loading }) {
    if (loading) return <div>Loading metrics widget...</div>;
    return <div data-testid="financial-metrics-widget">Financial Metrics Widget</div>;
  };
});

const theme = createTheme();

const mockUser = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider value={{ user: mockUser, loading: false }}>
          <NotificationProvider>
            {component}
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock data
const mockDashboardData = {
  accountSummary: {
    totalBalance: 10000,
    activeAccounts: 2,
  },
  creditCardSummary: {
    creditCards: [
      { id: 1, name: 'Test Card', currentBalance: 1500 },
    ],
  },
  monthlySummary: {
    income: { total: 8000, count: 5 },
    expense: { total: 6000, count: 15 },
    netIncome: 2000,
  },
  recentTransactions: [
    {
      id: 1,
      description: 'Test Transaction',
      amount: 100,
      type: 'expense',
      transactionDate: '2024-01-15',
      category: 'Food',
    },
  ],
  upcomingPayments: [
    {
      creditCardId: 1,
      creditCardName: 'Test Card',
      minimumPayment: 150,
      daysUntil: 5,
      isOverdue: false,
    },
  ],
  fixedPayments: {
    totalMonthly: 2000,
    dueThisMonth: [
      { id: 1, name: 'Rent', amount: 1500, category: 'Housing', dueDay: 1 },
    ],
    overdue: [],
  },
  installmentPayments: {
    summary: { totalMonthly: 500 },
    upcoming: [],
    overdue: [],
  },
};

const mockChartData = {
  categoryExpenses: [
    { category: 'Food', amount: 1200 },
    { category: 'Transport', amount: 800 },
    { category: 'Entertainment', amount: 400 },
  ],
  financialTrends: [
    { month: 'Jan', income: 8000, expense: 6000 },
    { month: 'Feb', income: 8200, expense: 6200 },
  ],
  calendarPayments: [
    { id: 1, name: 'Rent', amount: 1500, dueDay: 1 },
  ],
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API mocks
    const api = require('../../services/api');
    api.accountsAPI.getSummary.mockResolvedValue({ data: { data: mockDashboardData.accountSummary } });
    api.creditCardsAPI.getAll.mockResolvedValue({ data: { data: mockDashboardData.creditCardSummary } });
    api.transactionsAPI.getMonthlySummary.mockResolvedValue({ data: { data: { summary: mockDashboardData.monthlySummary } } });
    api.transactionsAPI.getRecent.mockResolvedValue({ data: { data: { transactions: mockDashboardData.recentTransactions } } });
    api.creditCardsAPI.getUpcomingPayments.mockResolvedValue({ data: { data: { upcomingPayments: mockDashboardData.upcomingPayments } } });
    api.fixedPaymentsAPI.getTotalMonthlyAmount.mockResolvedValue({ data: { data: { totalAmount: mockDashboardData.fixedPayments.totalMonthly } } });
    api.fixedPaymentsAPI.getPaymentsDueThisMonth.mockResolvedValue({ data: { data: mockDashboardData.fixedPayments.dueThisMonth } });
    api.fixedPaymentsAPI.getOverduePayments.mockResolvedValue({ data: { data: mockDashboardData.fixedPayments.overdue } });
    api.installmentPaymentsAPI.getSummary.mockResolvedValue({ data: { data: mockDashboardData.installmentPayments.summary } });
    api.installmentPaymentsAPI.getUpcomingPayments.mockResolvedValue({ data: { data: mockDashboardData.installmentPayments.upcoming } });
    api.installmentPaymentsAPI.getOverduePayments.mockResolvedValue({ data: { data: mockDashboardData.installmentPayments.overdue } });
    
    // Chart data mocks
    api.transactionsAPI.getCategoryExpenses.mockResolvedValue({ data: { data: mockChartData.categoryExpenses } });
    api.transactionsAPI.getFinancialTrend.mockResolvedValue({ data: { data: mockChartData.financialTrends } });
    api.fixedPaymentsAPI.getAll.mockResolvedValue({ data: { data: mockChartData.calendarPayments } });
  });

  describe('Loading State', () => {
    test('should show loading skeletons initially', () => {
      renderWithProviders(<Dashboard />);
      
      // Should show skeleton loading elements
      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Content', () => {
    test('should render welcome message with user name', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, Test!')).toBeInTheDocument();
      });
    });

    test('should render summary cards', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Toplam Bakiye')).toBeInTheDocument();
        expect(screen.getByText('Kredi Kartı Borcu')).toBeInTheDocument();
        expect(screen.getByText('Bu Ay Gelir')).toBeInTheDocument();
        expect(screen.getByText('Bu Ay Gider')).toBeInTheDocument();
      });
    });

    test('should display correct financial values', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('₺10000.00')).toBeInTheDocument(); // Total balance
        expect(screen.getByText('₺1500.00')).toBeInTheDocument(); // Credit card debt
        expect(screen.getByText('₺8000.00')).toBeInTheDocument(); // Monthly income
        expect(screen.getByText('₺6000.00')).toBeInTheDocument(); // Monthly expense
      });
    });

    test('should render additional financial metrics', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemeler')).toBeInTheDocument();
        expect(screen.getByText('Tahmini Aylık Bakiye')).toBeInTheDocument();
        expect(screen.getByText('Finansal Sağlık')).toBeInTheDocument();
        expect(screen.getByText('Borç/Varlık Oranı')).toBeInTheDocument();
      });
    });
  });

  describe('Widget Rendering', () => {
    test('should render all dashboard widgets on desktop', async () => {
      // Mock desktop view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByTestId('payment-calendar')).toBeInTheDocument();
        expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument();
        expect(screen.getByTestId('financial-trend-chart')).toBeInTheDocument();
        expect(screen.getByTestId('budget-comparison-widget')).toBeInTheDocument();
        expect(screen.getByTestId('financial-metrics-widget')).toBeInTheDocument();
      });
    });

    test('should render mobile widget carousel on mobile', async () => {
      // Mock mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Grafikler ve Analizler')).toBeInTheDocument();
      });
    });
  });

  describe('Widget Interactions', () => {
    test('should handle category click in expense chart', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const categoryButton = screen.getByText('Food: 1200');
        fireEvent.click(categoryButton);
      });
      
      // Should navigate to transactions page (mocked)
      // In real implementation, this would test navigation
    });

    test('should handle budget update', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const updateButton = screen.getByText('Update Budget');
        fireEvent.click(updateButton);
      });
      
      // Should update budget data
      // In real implementation, this would test state update
    });
  });

  describe('Recent Transactions', () => {
    test('should render recent transactions list', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Son İşlemler')).toBeInTheDocument();
        expect(screen.getByText('Test Transaction')).toBeInTheDocument();
      });
    });

    test('should show empty state when no transactions', async () => {
      const api = require('../../services/api');
      api.transactionsAPI.getRecent.mockResolvedValue({ data: { data: { transactions: [] } } });
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Henüz işlem yok')).toBeInTheDocument();
      });
    });
  });

  describe('Upcoming Payments', () => {
    test('should render upcoming payments list', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Yaklaşan Ödemeler')).toBeInTheDocument();
        expect(screen.getByText('Test Card')).toBeInTheDocument();
      });
    });

    test('should show success message when no upcoming payments', async () => {
      const api = require('../../services/api');
      api.creditCardsAPI.getUpcomingPayments.mockResolvedValue({ data: { data: { upcomingPayments: [] } } });
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Yaklaşan ödeme yok')).toBeInTheDocument();
      });
    });
  });

  describe('Fixed Payments', () => {
    test('should render fixed payments section', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemeler')).toBeInTheDocument();
        expect(screen.getByText('Rent')).toBeInTheDocument();
      });
    });

    test('should show empty state when no fixed payments', async () => {
      const api = require('../../services/api');
      api.fixedPaymentsAPI.getPaymentsDueThisMonth.mockResolvedValue({ data: { data: [] } });
      api.fixedPaymentsAPI.getOverduePayments.mockResolvedValue({ data: { data: [] } });
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Sabit ödeme tanımlanmamış')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    test('should render quick actions section', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Hızlı İşlemler')).toBeInTheDocument();
        expect(screen.getByText('Hesap Ekle')).toBeInTheDocument();
        expect(screen.getByText('Kredi Kartı Ekle')).toBeInTheDocument();
        expect(screen.getByText('İşlem Ekle')).toBeInTheDocument();
        expect(screen.getByText('Sabit Ödeme Ekle')).toBeInTheDocument();
        expect(screen.getByText('Taksit Ekle')).toBeInTheDocument();
        expect(screen.getByText('Raporları Gör')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const api = require('../../services/api');
      api.accountsAPI.getSummary.mockRejectedValue(new Error('API Error'));
      
      renderWithProviders(<Dashboard />);
      
      // Component should still render with error state
      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, Test!')).toBeInTheDocument();
      });
    });

    test('should show retry button on critical errors', async () => {
      const api = require('../../services/api');
      api.accountsAPI.getSummary.mockRejectedValue(new Error('Critical Error'));
      api.transactionsAPI.getMonthlySummary.mockRejectedValue(new Error('Critical Error'));
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      });
    });
  });

  describe('Financial Calculations', () => {
    test('should calculate net worth correctly', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Net worth = Total balance (10000) - Credit card debt (1500) = 8500
        expect(screen.getByText('₺8500.00')).toBeInTheDocument();
      });
    });

    test('should calculate financial health score', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Should show financial health score out of 100
        const healthScoreRegex = /\d+\/100/;
        expect(screen.getByText(healthScoreRegex)).toBeInTheDocument();
      });
    });

    test('should calculate debt to asset ratio', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Debt ratio = 1500 / 10000 = 15%
        expect(screen.getByText('%15')).toBeInTheDocument();
      });
    });
  });
});