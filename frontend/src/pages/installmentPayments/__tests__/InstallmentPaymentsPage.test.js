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

// Mock data
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
];

const mockSummary = {
  totalDebt: 637500,
  totalPaid: 212500,
  totalRemaining: 637500,
  monthlyTotal: 22500,
  activeInstallments: 2,
  completionPercentage: 25,
};

describe('InstallmentPaymentsPage', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default API responses
    api.installmentPaymentsAPI.getAll.mockResolvedValue({
      data: { data: mockInstallmentPayments }
    });
    api.installmentPaymentsAPI.getSummary.mockResolvedValue({
      data: { data: mockSummary }
    });
  });

  describe('Component Rendering', () => {
    test('renders page title and description', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      expect(screen.getByText('Taksitli Ödemelerim')).toBeInTheDocument();
      expect(screen.getByText(/Telefon, araba, eğitim ve diğer taksitli alışverişlerinizi yönetin/)).toBeInTheDocument();
    });

    test('renders add payment button', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      expect(screen.getByText('Taksitli Ödeme Ekle')).toBeInTheDocument();
    });

    test('renders view mode toggle buttons', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      expect(screen.getByText('Kartlar')).toBeInTheDocument();
      expect(screen.getByText('Takvim')).toBeInTheDocument();
      expect(screen.getByText('Liste')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    test('loads installment payments on mount', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(api.installmentPaymentsAPI.getAll).toHaveBeenCalledTimes(1);
        expect(api.installmentPaymentsAPI.getSummary).toHaveBeenCalledTimes(1);
      });
    });

    test('displays loading state initially', () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('displays installment payments after loading', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
        expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      });
    });

    test('displays summary cards after loading', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Toplam Borç')).toBeInTheDocument();
        expect(screen.getByText('Ödenen Tutar')).toBeInTheDocument();
        expect(screen.getByText('Kalan Borç')).toBeInTheDocument();
        expect(screen.getByText('Aylık Toplam')).toBeInTheDocument();
      });
    });
  });

  describe('View Mode Switching', () => {
    test('switches to calendar view when calendar button is clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Takvim'));
      
      expect(screen.getByText(/Taksit Takvimi/)).toBeInTheDocument();
    });

    test('switches to list view when list button is clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liste'));
      
      expect(screen.getByText(/Taksit Ödemeleri Listesi/)).toBeInTheDocument();
    });

    test('shows month/year selectors only in calendar and list views', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      // Should not show selectors in cards view
      expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();
      
      // Switch to calendar view
      fireEvent.click(screen.getByText('Takvim'));
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API fails', async () => {
      api.installmentPaymentsAPI.getAll.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    test('shows retry button on error', async () => {
      api.installmentPaymentsAPI.getAll.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      });
    });

    test('retries loading data when retry button is clicked', async () => {
      api.installmentPaymentsAPI.getAll.mockRejectedValueOnce(new Error('Network error'));
      api.installmentPaymentsAPI.getAll.mockResolvedValueOnce({
        data: { data: mockInstallmentPayments }
      });
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Tekrar Dene'));
      
      await waitFor(() => {
        expect(api.installmentPaymentsAPI.getAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    test('displays empty state when no payments exist', async () => {
      api.installmentPaymentsAPI.getAll.mockResolvedValue({
        data: { data: [] }
      });
      
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Henüz taksitli ödeme eklenmemiş')).toBeInTheDocument();
        expect(screen.getByText('İlk Taksitli Ödemeyi Ekle')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interactions', () => {
    test('opens add payment dialog when add button is clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Taksitli Ödeme Ekle'));
      
      expect(screen.getByText('Yeni Taksitli Ödeme Ekle')).toBeInTheDocument();
    });

    test('closes dialog when cancel button is clicked', async () => {
      renderWithProviders(<InstallmentPaymentsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Taksitli Ödeme Ekle'));
      expect(screen.getByText('Yeni Taksitli Ödeme Ekle')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('İptal'));
      expect(screen.queryByText('Yeni Taksitli Ödeme Ekle')).not.toBeInTheDocument();
    });
  });
});