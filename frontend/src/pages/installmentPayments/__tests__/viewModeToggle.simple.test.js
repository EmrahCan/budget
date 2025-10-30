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
];

const mockSummary = {
  totalDebt: 637500,
  totalPaid: 212500,
  totalRemaining: 637500,
  monthlyTotal: 22500,
  activeInstallments: 1,
  completionPercentage: 25,
};

describe('View Mode Toggle - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    api.installmentPaymentsAPI.getAll.mockResolvedValue({
      data: { data: mockInstallmentPayments }
    });
    api.installmentPaymentsAPI.getSummary.mockResolvedValue({
      data: { data: mockSummary }
    });
  });

  test('renders page with view mode buttons', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    // Should show view mode buttons
    expect(screen.getByText('Kartlar')).toBeInTheDocument();
    expect(screen.getByText('Takvim')).toBeInTheDocument();
    expect(screen.getByText('Liste')).toBeInTheDocument();
  });

  test('can switch to calendar view', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Takvim'));
    
    // Should show month/year selectors in calendar view
    await waitFor(() => {
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
    });
  });

  test('can switch to list view', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Liste'));
    
    // Should show month/year selectors in list view
    await waitFor(() => {
      expect(screen.getByLabelText('Ay')).toBeInTheDocument();
      expect(screen.getByLabelText('Yıl')).toBeInTheDocument();
    });
  });

  test('month/year selectors are hidden in cards view', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Should not show selectors in cards view (default)
    expect(screen.queryByLabelText('Ay')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Yıl')).not.toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    api.installmentPaymentsAPI.getAll.mockRejectedValue(new Error('Network error'));
    
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument();
    });
  });

  test('shows empty state when no payments exist', async () => {
    api.installmentPaymentsAPI.getAll.mockResolvedValue({
      data: { data: [] }
    });
    
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Henüz taksitli ödeme eklenmemiş')).toBeInTheDocument();
    });
  });
});