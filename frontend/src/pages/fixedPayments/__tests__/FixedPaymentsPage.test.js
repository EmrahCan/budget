import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FixedPaymentsPage from '../FixedPaymentsPage';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Mock API
jest.mock('../../../services/api', () => ({
  fixedPaymentsAPI: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  formatCurrency: jest.fn((amount) => `₺${amount.toFixed(2)}`),
  formatDate: jest.fn((date) => date.toLocaleDateString()),
  handleApiError: jest.fn((error) => error.message),
}));

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        {component}
      </NotificationProvider>
    </ThemeProvider>
  );
};

// Test helper functions
const mockPayments = [
  {
    id: 1,
    name: 'Kira',
    amount: 2000,
    category: 'Konut',
    dueDay: 1,
  },
  {
    id: 2,
    name: 'Elektrik',
    amount: 150,
    category: 'Faturalar',
    dueDay: 15,
  },
  {
    id: 3,
    name: 'İnternet',
    amount: 100,
    category: 'İletişim',
    dueDay: 31,
  },
];

describe('FixedPaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../../services/api').fixedPaymentsAPI.getAll.mockResolvedValue({
      data: mockPayments,
    });
  });

  describe('Date Calculations', () => {
    test('should calculate correct payment date', () => {
      // Test helper function for date calculation
      const calculatePaymentDate = (payment, month, year) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const adjustedDay = Math.min(payment.dueDay, daysInMonth);
        return new Date(year, month, adjustedDay);
      };

      const payment = { dueDay: 15 };
      const result = calculatePaymentDate(payment, 2, 2024); // Mart 2024
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    test('should handle month end edge cases', () => {
      const calculatePaymentDate = (payment, month, year) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const adjustedDay = Math.min(payment.dueDay, daysInMonth);
        return new Date(year, month, adjustedDay);
      };

      const payment = { dueDay: 31 };
      const result = calculatePaymentDate(payment, 1, 2024); // Şubat 2024
      expect(result.getDate()).toBe(29); // 2024 artık yıl
    });

    test('should handle leap year correctly', () => {
      const calculatePaymentDate = (payment, month, year) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const adjustedDay = Math.min(payment.dueDay, daysInMonth);
        return new Date(year, month, adjustedDay);
      };

      const payment = { dueDay: 29 };
      const result2024 = calculatePaymentDate(payment, 1, 2024); // Şubat 2024 (artık yıl)
      const result2023 = calculatePaymentDate(payment, 1, 2023); // Şubat 2023 (normal yıl)
      
      expect(result2024.getDate()).toBe(29);
      expect(result2023.getDate()).toBe(28);
    });
  });

  describe('Payment Status', () => {
    test('should mark overdue payments correctly', () => {
      const calculatePaymentStatus = (payment, month, year) => {
        const paymentDate = new Date(year, month, payment.dueDay);
        const today = new Date();
        const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const paymentDateWithoutTime = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
        
        if (paymentDateWithoutTime < todayWithoutTime) {
          return 'overdue';
        } else if (paymentDateWithoutTime.getTime() === todayWithoutTime.getTime()) {
          return 'today';
        } else {
          return 'pending';
        }
      };

      const payment = { dueDay: 1 };
      const lastMonth = new Date().getMonth() - 1;
      const year = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
      const month = lastMonth < 0 ? 11 : lastMonth;
      
      const status = calculatePaymentStatus(payment, month, year);
      expect(status).toBe('overdue');
    });

    test('should mark today payments correctly', () => {
      const calculatePaymentStatus = (payment, month, year) => {
        const paymentDate = new Date(year, month, payment.dueDay);
        const today = new Date();
        const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const paymentDateWithoutTime = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
        
        if (paymentDateWithoutTime < todayWithoutTime) {
          return 'overdue';
        } else if (paymentDateWithoutTime.getTime() === todayWithoutTime.getTime()) {
          return 'today';
        } else {
          return 'pending';
        }
      };

      const today = new Date();
      const payment = { dueDay: today.getDate() };
      const status = calculatePaymentStatus(payment, today.getMonth(), today.getFullYear());
      expect(status).toBe('today');
    });

    test('should mark pending payments correctly', () => {
      const calculatePaymentStatus = (payment, month, year) => {
        const paymentDate = new Date(year, month, payment.dueDay);
        const today = new Date();
        const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const paymentDateWithoutTime = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
        
        if (paymentDateWithoutTime < todayWithoutTime) {
          return 'overdue';
        } else if (paymentDateWithoutTime.getTime() === todayWithoutTime.getTime()) {
          return 'today';
        } else {
          return 'pending';
        }
      };

      const nextMonth = new Date().getMonth() + 1;
      const year = nextMonth > 11 ? new Date().getFullYear() + 1 : new Date().getFullYear();
      const month = nextMonth > 11 ? 0 : nextMonth;
      
      const payment = { dueDay: 15 };
      const status = calculatePaymentStatus(payment, month, year);
      expect(status).toBe('pending');
    });
  });

  describe('Component Rendering', () => {
    test('should render page title', async () => {
      renderWithProviders(<FixedPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });
    });

    test('should render view mode toggle buttons', async () => {
      renderWithProviders(<FixedPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Kategoriler')).toBeInTheDocument();
        expect(screen.getByText('Takvim')).toBeInTheDocument();
        expect(screen.getByText('Liste')).toBeInTheDocument();
      });
    });

    test('should render add payment button', async () => {
      renderWithProviders(<FixedPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödeme Ekle|Ekle/)).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Switching', () => {
    test('should switch to calendar view', async () => {
      renderWithProviders(<FixedPaymentsPage />);
      
      await waitFor(() => {
        const calendarButton = screen.getByText('Takvim');
        fireEvent.click(calendarButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Takvimi/)).toBeInTheDocument();
      });
    });

    test('should switch to list view', async () => {
      renderWithProviders(<FixedPaymentsPage />);
      
      await waitFor(() => {
        const listButton = screen.getByText('Liste');
        fireEvent.click(listButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Listesi/)).toBeInTheDocument();
      });
    });

    test('should show month/year selector in calendar and list views', async () => {
      renderWithProviders(<FixedPaymentsPage />);
      
      // Switch to calendar view
      await waitFor(() => {
        const calendarButton = screen.getByText('Takvim');
        fireEvent.click(calendarButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Ay')).toBeInTheDocument();
        expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      require('../../../services/api').fixedPaymentsAPI.getAll.mockRejectedValue(mockError);

      renderWithProviders(<FixedPaymentsPage />);
      
      // Component should still render even with API error
      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });
    });
  });
});