import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InstallmentPaymentsPage from '../InstallmentPaymentsPage';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import * as api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  installmentPaymentsAPI: {
    getAll: jest.fn(),
    getSummary: jest.fn(),
  },
  formatCurrency: jest.fn((amount) => `₺${amount.toLocaleString()}`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString('tr-TR')),
  handleApiError: jest.fn((error) => error.message || 'API Error'),
}));

// Mock useMediaQuery
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(() => false), // Default to desktop
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

const mockInstallmentPayments = [
  {
    id: 1,
    itemName: 'iPhone 15 Pro',
    category: 'Teknoloji',
    totalAmount: 50000,
    installmentAmount: 2500,
    totalInstallments: 20,
    paidInstallments: 5,
    nextPaymentDate: '2024-06-01',
    completionPercentage: 25,
    isOverdue: false,
  },
  {
    id: 2,
    itemName: 'Honda Civic',
    category: 'Araba',
    totalAmount: 800000,
    installmentAmount: 20000,
    totalInstallments: 40,
    paidInstallments: 10,
    nextPaymentDate: '2024-05-15',
    completionPercentage: 25,
    isOverdue: false,
  },
];

const mockSummary = {
  totalDebt: 637500,
  totalPaid: 212500,
  totalRemaining: 637500,
  monthlyTotal: 22500,
  activeInstallments: 2,
  completionPercentage: 25,
};

describe('View Mode Toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    api.installmentPaymentsAPI.getAll.mockResolvedValue({
      data: { data: mockInstallmentPayments }
    });
    api.installmentPaymentsAPI.getSummary.mockResolvedValue({
      data: { data: mockSummary }
    });
  });

  describe('Initial State', () => {
    test('defaults to cards view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show payment cards
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      
      // Should not show month/year selectors in cards view
      expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();
    });

    test('shows all three view mode buttons', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      expect(screen.getByText('Kartlar')).toBeInTheDocument();
      expect(screen.getByText('Takvim')).toBeInTheDocument();
      expect(screen.getByText('Liste')).toBeInTheDocument();
    });

    test('cards button is initially selected', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
      
      const cardsButton = screen.getByText('Kartlar').closest('button');
      expect(cardsButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Calendar View', () => {
    test('switches to calendar view when calendar button is clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      // Should show month/year selectors
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      
      // Should show calendar grid headers
      expect(screen.getByText('Pzt')).toBeInTheDocument();
      expect(screen.getByText('Sal')).toBeInTheDocument();
      expect(screen.getByText('Çar')).toBeInTheDocument();
    });

    test('calendar button becomes selected when clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      const calendarButton = screen.getByText('Takvim').closest('button');
      expect(calendarButton).toHaveAttribute('aria-pressed', 'true');
      
      const cardsButton = screen.getByText('Kartlar').closest('button');
      expect(cardsButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('shows swipe instruction on mobile in calendar view', async () => {
      // Mock mobile view
      const { useMediaQuery } = require('@mui/material');
      useMediaQuery.mockReturnValue(true);
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      expect(screen.getByText('Kaydırarak ay değiştirin')).toBeInTheDocument();
    });
  });

  describe('List View', () => {
    test('switches to list view when list button is clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      // Should show list title
      expect(screen.getByText(/Taksit Ödemeleri Listesi/)).toBeInTheDocument();
      
      // Should show month/year selectors
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      
      // Should show table headers
      expect(screen.getByText('Tarih')).toBeInTheDocument();
      expect(screen.getByText('Ürün/Hizmet')).toBeInTheDocument();
      expect(screen.getByText('Kategori')).toBeInTheDocument();
    });

    test('list button becomes selected when clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      const listButton = screen.getByText('Liste').closest('button');
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
      
      const cardsButton = screen.getByText('Kartlar').closest('button');
      expect(cardsButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('shows summary cards in list view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      // Should show summary metrics
      expect(screen.getByText('Toplam Ödeme')).toBeInTheDocument();
      expect(screen.getByText('Toplam Tutar')).toBeInTheDocument();
      expect(screen.getByText('Gecikmiş')).toBeInTheDocument();
      expect(screen.getByText('Tamamlanan')).toBeInTheDocument();
    });
  });

  describe('Month/Year Selectors', () => {
    test('month/year selectors are hidden in cards view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Yıl')).not.toBeInTheDocument();
    });

    test('month/year selectors are visible in calendar view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
    });

    test('month/year selectors are visible in list view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
    });

    test('can change month in calendar view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      const monthSelect = screen.getByLabelText('Ay');
      fireEvent.mouseDown(monthSelect);
      
      // Should show month options
      await waitFor(() => {
        expect(screen.getByText('Ocak')).toBeInTheDocument();
        expect(screen.getByText('Şubat')).toBeInTheDocument();
      });
    });

    test('can change year in list view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      const yearSelect = screen.getByLabelText('Yıl');
      fireEvent.mouseDown(yearSelect);
      
      // Should show year options
      await waitFor(() => {
        const currentYear = new Date().getFullYear();
        expect(screen.getByText(currentYear.toString())).toBeInTheDocument();
      });
    });
  });

  describe('View Switching', () => {
    test('can switch between all three views', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Start in cards view
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      
      // Switch to calendar
      fireEvent.click(screen.getByText('Takvim'));
      expect(screen.getByText(/Taksit Takvimi/)).toBeInTheDocument();
      
      // Switch to list
      fireEvent.click(screen.getByText('Liste'));
      expect(screen.getByText(/Taksit Ödemeleri Listesi/)).toBeInTheDocument();
      
      // Switch back to cards
      fireEvent.click(screen.getByText('Kartlar'));
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    test('maintains selected month/year when switching between calendar and list', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Switch to calendar and change month
      fireEvent.click(screen.getByText('Takvim'));
      
      const monthSelect = screen.getByLabelText('Ay');
      fireEvent.mouseDown(monthSelect);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Şubat'));
      });

      // Switch to list view
      fireEvent.click(screen.getByText('Liste'));
      
      // Month should still be February
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // February is index 1
    });
  });

  describe('Mobile Optimizations', () => {
    beforeEach(() => {
      // Mock mobile view
      const { useMediaQuery } = require('@mui/material');
      useMediaQuery.mockReturnValue(true);
    });

    test('shows compact labels on mobile', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Should show "Kart" instead of "Kartlar" on mobile
      expect(screen.getByText('Kart')).toBeInTheDocument();
      expect(screen.queryByText('Kartlar')).not.toBeInTheDocument();
    });

    test('shows navigation arrows in calendar view on mobile', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      // Should show previous/next month buttons
      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });
});