import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FixedPaymentsPage from '../FixedPaymentsPage';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Mock API with more realistic responses
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
    name: 'Elektrik Faturası',
    amount: 150,
    category: 'Faturalar',
    dueDay: 15,
  },
  {
    id: 3,
    name: 'İnternet',
    amount: 100,
    category: 'İletişim',
    dueDay: 28,
  },
];

describe('FixedPaymentsPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../../services/api').fixedPaymentsAPI.getAll.mockResolvedValue({
      data: mockPayments,
    });
  });

  describe('View Mode Integration', () => {
    test('should switch between view modes correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Initially should be in category view
      await waitFor(() => {
        expect(screen.getByText('Kira')).toBeInTheDocument();
      });

      // Switch to calendar view
      const calendarButton = screen.getByText('Takvim');
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Takvimi/)).toBeInTheDocument();
        expect(screen.getByText('Pzt')).toBeInTheDocument();
      });

      // Switch to list view
      const listButton = screen.getByText('Liste');
      await user.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Listesi/)).toBeInTheDocument();
        expect(screen.getByText('Tarih')).toBeInTheDocument();
      });

      // Switch back to category view
      const categoryButton = screen.getByText(/Kategoriler|Kat\./);
      await user.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByText('Kira')).toBeInTheDocument();
      });
    });

    test('should show month/year selectors only in calendar and list views', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Initially in category view - no month/year selectors
      expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Yıl')).not.toBeInTheDocument();

      // Switch to calendar view - should show selectors
      const calendarButton = screen.getByText('Takvim');
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Ay')).toBeInTheDocument();
        expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      });

      // Switch to list view - should still show selectors
      const listButton = screen.getByText('Liste');
      await user.click(listButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Ay')).toBeInTheDocument();
        expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      });
    });
  });

  describe('Month/Year Navigation', () => {
    test('should change month and update calendar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Switch to calendar view
      const calendarButton = screen.getByText('Takvim');
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      });

      // Change month
      const monthSelect = screen.getByLabelText('Ay');
      await user.click(monthSelect);

      // Select a different month (e.g., March)
      const marchOption = screen.getByText('Mart');
      await user.click(marchOption);

      await waitFor(() => {
        expect(screen.getByText(/Mart.*Sabit Ödemeler Takvimi/)).toBeInTheDocument();
      });
    });

    test('should change year and update calendar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Switch to calendar view
      const calendarButton = screen.getByText('Takvim');
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
      });

      // Change year
      const yearSelect = screen.getByLabelText('Yıl');
      await user.click(yearSelect);

      // Select a different year
      const nextYear = new Date().getFullYear() + 1;
      const nextYearOption = screen.getByText(nextYear.toString());
      await user.click(nextYearOption);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${nextYear}.*Sabit Ödemeler Takvimi`))).toBeInTheDocument();
      });
    });
  });

  describe('Payment CRUD Operations', () => {
    test('should open and close payment dialog', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Click add payment button
      const addButton = screen.getByText(/Sabit Ödeme Ekle|Ekle/);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Yeni Sabit Ödeme Ekle')).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = screen.getByText('İptal');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Yeni Sabit Ödeme Ekle')).not.toBeInTheDocument();
      });
    });

    test('should create new payment', async () => {
      const user = userEvent.setup();
      const mockCreate = require('../../../services/api').fixedPaymentsAPI.create;
      mockCreate.mockResolvedValue({ data: { id: 4 } });

      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Open add dialog
      const addButton = screen.getByText(/Sabit Ödeme Ekle|Ekle/);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Yeni Sabit Ödeme Ekle')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText('Ödeme Adı');
      await user.type(nameInput, 'Su Faturası');

      const amountInput = screen.getByLabelText('Aylık Tutar');
      await user.type(amountInput, '80');

      const dayInput = screen.getByLabelText(/Ödeme Günü/);
      await user.type(dayInput, '10');

      // Submit form
      const submitButton = screen.getByText('Ekle');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          name: 'Su Faturası',
          amount: 80,
          category: 'Faturalar',
          dueDay: 10,
        });
      });
    });

    test('should edit existing payment', async () => {
      const user = userEvent.setup();
      const mockUpdate = require('../../../services/api').fixedPaymentsAPI.update;
      mockUpdate.mockResolvedValue({ data: { id: 1 } });

      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Kira')).toBeInTheDocument();
      });

      // Find and click edit button for Kira payment
      const editButtons = screen.getAllByLabelText(/edit|düzenle/i);
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödeme Düzenle')).toBeInTheDocument();
      });

      // Update amount
      const amountInput = screen.getByLabelText('Aylık Tutar');
      await user.clear(amountInput);
      await user.type(amountInput, '2200');

      // Submit form
      const submitButton = screen.getByText('Güncelle');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(1, {
          name: 'Kira',
          amount: 2200,
          category: 'Konut',
          dueDay: 1,
        });
      });
    });

    test('should delete payment with confirmation', async () => {
      const user = userEvent.setup();
      const mockDelete = require('../../../services/api').fixedPaymentsAPI.delete;
      mockDelete.mockResolvedValue({ data: {} });

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Kira')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButtons = screen.getAllByLabelText(/delete|sil/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('"Kira" ödemesini silmek istediğinizden emin misiniz?');
        expect(mockDelete).toHaveBeenCalledWith(1);
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Calendar Integration', () => {
    test('should display payments in calendar view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Switch to calendar view
      const calendarButton = screen.getByText('Takvim');
      await user.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Takvimi/)).toBeInTheDocument();
      });

      // Should show weekday headers
      expect(screen.getByText('Pzt')).toBeInTheDocument();
      expect(screen.getByText('Sal')).toBeInTheDocument();
      expect(screen.getByText('Çar')).toBeInTheDocument();
      expect(screen.getByText('Per')).toBeInTheDocument();
      expect(screen.getByText('Cum')).toBeInTheDocument();
      expect(screen.getByText('Cmt')).toBeInTheDocument();
      expect(screen.getByText('Paz')).toBeInTheDocument();
    });
  });

  describe('List Integration', () => {
    test('should display payments in list view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FixedPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Switch to list view
      const listButton = screen.getByText('Liste');
      await user.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Listesi/)).toBeInTheDocument();
      });

      // Should show table headers
      expect(screen.getByText('Tarih')).toBeInTheDocument();
      expect(screen.getByText('Ödeme')).toBeInTheDocument();
      expect(screen.getByText('Kategori')).toBeInTheDocument();
      expect(screen.getByText('Tutar')).toBeInTheDocument();
      expect(screen.getByText('Durum')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle network errors gracefully', async () => {
      const mockError = new Error('Network Error');
      require('../../../services/api').fixedPaymentsAPI.getAll.mockRejectedValue(mockError);

      renderWithProviders(<FixedPaymentsPage />);

      // Component should still render
      await waitFor(() => {
        expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
      });

      // Should be able to switch views even with error
      const calendarButton = screen.getByText('Takvim');
      fireEvent.click(calendarButton);

      await waitFor(() => {
        expect(screen.getByText(/Sabit Ödemeler Takvimi/)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<FixedPaymentsPage />);

      // Component should render without errors on mobile
      expect(screen.getByText('Sabit Ödemelerim')).toBeInTheDocument();
    });
  });
});