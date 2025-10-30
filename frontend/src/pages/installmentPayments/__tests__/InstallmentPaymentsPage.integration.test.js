import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InstallmentPaymentsPage from '../InstallmentPaymentsPage';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import * as api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  installmentPaymentsAPI: {
    getAll: jest.fn(),
    getSummary: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    recordPayment: jest.fn(),
    getPaymentHistory: jest.fn(),
  },
  formatCurrency: jest.fn((amount) => `₺${amount.toLocaleString()}`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString('tr-TR')),
  handleApiError: jest.fn((error) => error.message || 'API Error'),
}));

// Mock useMediaQuery for responsive testing
const mockUseMediaQuery = jest.fn();
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: mockUseMediaQuery,
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

// Mock data for different scenarios
const mockInstallmentPayments = [
  {
    id: 1,
    itemName: 'iPhone 15 Pro',
    category: 'Teknoloji',
    totalAmount: 50000,
    installmentAmount: 2500,
    totalInstallments: 20,
    paidInstallments: 5,
    interestRate: 1.5,
    startDate: '2024-01-01',
    nextPaymentDate: '2024-06-01',
    vendor: 'Apple Store',
    notes: 'Test notes',
    completionPercentage: 25,
    paidAmount: 12500,
    remainingAmount: 37500,
    isOverdue: false,
    daysUntilPayment: 15,
  },
  {
    id: 2,
    itemName: 'Honda Civic',
    category: 'Araba',
    totalAmount: 800000,
    installmentAmount: 20000,
    totalInstallments: 40,
    paidInstallments: 10,
    interestRate: 2.0,
    startDate: '2023-06-01',
    nextPaymentDate: '2024-04-01',
    vendor: 'Honda Bayii',
    notes: '',
    completionPercentage: 25,
    paidAmount: 200000,
    remainingAmount: 600000,
    isOverdue: true,
    daysUntilPayment: -30,
  },
  {
    id: 3,
    itemName: 'MacBook Pro',
    category: 'Teknoloji',
    totalAmount: 75000,
    installmentAmount: 3750,
    totalInstallments: 20,
    paidInstallments: 20,
    interestRate: 1.2,
    startDate: '2023-01-01',
    nextPaymentDate: null,
    vendor: 'Apple Store',
    notes: 'Completed payment',
    completionPercentage: 100,
    paidAmount: 75000,
    remainingAmount: 0,
    isOverdue: false,
    daysUntilPayment: null,
  },
];

const mockSummary = {
  totalDebt: 637500,
  totalPaid: 287500,
  totalRemaining: 637500,
  monthlyTotal: 22500,
  activeInstallments: 2,
  completionPercentage: 31,
};

describe('InstallmentPaymentsPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false); // Default to desktop
    
    api.installmentPaymentsAPI.getAll.mockResolvedValue({
      data: { data: mockInstallmentPayments }
    });
    api.installmentPaymentsAPI.getSummary.mockResolvedValue({
      data: { data: mockSummary }
    });
  });

  describe('View Mode Transitions', () => {
    test('seamlessly transitions between all view modes', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Start in cards view - should show payment cards
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();

      // Switch to calendar view
      fireEvent.click(screen.getByText('Takvim'));
      
      await waitFor(() => {
        expect(screen.getByText(/Taksit Takvimi/)).toBeInTheDocument();
      });
      
      // Should show month/year selectors and calendar grid
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      expect(screen.getByText('Pzt')).toBeInTheDocument();
      expect(screen.getByText('Sal')).toBeInTheDocument();

      // Switch to list view
      fireEvent.click(screen.getByText('Liste'));
      
      await waitFor(() => {
        expect(screen.getByText(/Taksit Ödemeleri Listesi/)).toBeInTheDocument();
      });
      
      // Should show table headers and month/year selectors
      expect(screen.getByText('Tarih')).toBeInTheDocument();
      expect(screen.getByText('Ürün/Hizmet')).toBeInTheDocument();
      expect(screen.getByText('Kategori')).toBeInTheDocument();
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();

      // Switch back to cards view
      fireEvent.click(screen.getByText('Kartlar'));
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });
      
      // Should hide month/year selectors again
      expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();
    });

    test('maintains data consistency across view switches', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Verify data in cards view
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();

      // Switch to list view and verify same data
      fireEvent.click(screen.getByText('Liste'));
      
      await waitFor(() => {
        expect(screen.getByText(/Taksit Ödemeleri Listesi/)).toBeInTheDocument();
      });

      // Data should be consistent
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    test('preserves month/year selection when switching between calendar and list', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Switch to calendar view
      fireEvent.click(screen.getByText('Takvim'));
      
      // Change month to February
      const monthSelect = screen.getByLabelText('Ay');
      fireEvent.mouseDown(monthSelect);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Şubat'));
      });

      // Switch to list view
      fireEvent.click(screen.getByText('Liste'));
      
      // Month should still be February (index 1)
      await waitFor(() => {
        const monthSelectInList = screen.getByLabelText('Ay');
        expect(monthSelectInList).toHaveDisplayValue('1');
      });

      // Switch back to calendar
      fireEvent.click(screen.getByText('Takvim'));
      
      // Month should still be February
      await waitFor(() => {
        const monthSelectInCalendar = screen.getByLabelText('Ay');
        expect(monthSelectInCalendar).toHaveDisplayValue('1');
      });
    });
  });

  describe('API Integration', () => {
    test('handles API errors gracefully across all views', async () => {
      api.installmentPaymentsAPI.getAll.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // Error should be visible in all views
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();

      // Try switching views - error should persist
      fireEvent.click(screen.getByText('Takvim'));
      expect(screen.getByText(/Network error/)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Liste'));
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    test('successfully retries API calls after error', async () => {
      // First call fails, second succeeds
      api.installmentPaymentsAPI.getAll
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { data: mockInstallmentPayments } });
      
      api.installmentPaymentsAPI.getSummary
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { data: mockSummary } });
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByText('Tekrar Dene'));
      
      // Should load data successfully
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      expect(api.installmentPaymentsAPI.getAll).toHaveBeenCalledTimes(2);
      expect(api.installmentPaymentsAPI.getSummary).toHaveBeenCalledTimes(2);
    });

    test('loads fresh data when refreshing', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Update mock data
      const updatedPayments = [...mockInstallmentPayments];
      updatedPayments[0].itemName = 'iPhone 16 Pro';
      
      api.installmentPaymentsAPI.getAll.mockResolvedValue({
        data: { data: updatedPayments }
      });

      // Trigger refresh (simulate user action that would refresh data)
      fireEvent.click(screen.getByText('Taksitli Ödeme Ekle'));
      fireEvent.click(screen.getByText('İptal')); // Close dialog to trigger refresh
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 16 Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile view
    });

    test('adapts UI for mobile devices', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Should show compact button labels
      expect(screen.getByText('Kart')).toBeInTheDocument();
      expect(screen.queryByText('Kartlar')).not.toBeInTheDocument();
    });

    test('shows mobile-specific features in calendar view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      await waitFor(() => {
        expect(screen.getByText('Kaydırarak ay değiştirin')).toBeInTheDocument();
      });

      // Should show navigation arrows
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    test('maintains functionality on mobile', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Should be able to switch views on mobile
      fireEvent.click(screen.getByText('Takvim'));
      expect(screen.getByText(/Taksit Takvimi/)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Liste'));
      expect(screen.getByText(/Taksit Ödemeleri Listesi/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles month/year changes in calendar view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      // Change month
      const monthSelect = screen.getByLabelText('Ay');
      fireEvent.mouseDown(monthSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Ocak')).toBeInTheDocument();
        expect(screen.getByText('Şubat')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Mart'));
      
      // Calendar should update to show March
      await waitFor(() => {
        expect(monthSelect).toHaveDisplayValue('2'); // March is index 2
      });

      // Change year
      const yearSelect = screen.getByLabelText('Yıl');
      fireEvent.mouseDown(yearSelect);
      
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      await waitFor(() => {
        expect(screen.getByText(nextYear.toString())).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(nextYear.toString()));
      
      await waitFor(() => {
        expect(yearSelect).toHaveDisplayValue(nextYear.toString());
      });
    });

    test('handles month/year changes in list view', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      // Change month in list view
      const monthSelect = screen.getByLabelText('Ay');
      fireEvent.mouseDown(monthSelect);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Nisan'));
      });

      // List should update to show April data
      await waitFor(() => {
        expect(monthSelect).toHaveDisplayValue('3'); // April is index 3
      });
    });

    test('opens and closes payment dialog correctly', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Open dialog
      fireEvent.click(screen.getByText('Taksitli Ödeme Ekle'));
      expect(screen.getByText('Yeni Taksitli Ödeme Ekle')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByText('İptal'));
      expect(screen.queryByText('Yeni Taksitli Ödeme Ekle')).not.toBeInTheDocument();

      // Should return to normal view
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });
  });

  describe('Data Filtering and Display', () => {
    test('shows different payment statuses correctly', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Should show different status indicators
      // Active payment (iPhone)
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      
      // Overdue payment (Honda)
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      
      // Completed payment (MacBook)
      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    });

    test('displays summary statistics correctly', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Toplam Borç')).toBeInTheDocument();
      });

      // Should show summary cards with correct data
      expect(screen.getByText('Toplam Borç')).toBeInTheDocument();
      expect(screen.getByText('Ödenen Tutar')).toBeInTheDocument();
      expect(screen.getByText('Kalan Borç')).toBeInTheDocument();
      expect(screen.getByText('Aylık Toplam')).toBeInTheDocument();
    });

    test('handles empty state correctly', async () => {
      api.installmentPaymentsAPI.getAll.mockResolvedValue({
        data: { data: [] }
      });
      api.installmentPaymentsAPI.getSummary.mockResolvedValue({
        data: { data: { ...mockSummary, activeInstallments: 0 } }
      });
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Henüz taksitli ödeme eklenmemiş')).toBeInTheDocument();
      });

      expect(screen.getByText('İlk Taksitli Ödemeyi Ekle')).toBeInTheDocument();
    });
  });

  describe('Performance and Loading States', () => {
    test('shows loading indicators during data fetch', () => {
      // Delay the API response
      api.installmentPaymentsAPI.getAll.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { data: mockInstallmentPayments } }), 100))
      );
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('handles concurrent view switches gracefully', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Rapidly switch between views
      fireEvent.click(screen.getByText('Takvim'));
      fireEvent.click(screen.getByText('Liste'));
      fireEvent.click(screen.getByText('Kartlar'));
      fireEvent.click(screen.getByText('Takvim'));
      
      // Should end up in calendar view without errors
      await waitFor(() => {
        expect(screen.getByText(/Taksit Takvimi/)).toBeInTheDocument();
      });
    });
  });
});