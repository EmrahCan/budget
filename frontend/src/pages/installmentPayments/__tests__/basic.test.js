import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  useMediaQuery: jest.fn(() => false),
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

describe('InstallmentPaymentsPage Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    api.installmentPaymentsAPI.getAll.mockResolvedValue({
      data: { data: [] }
    });
    api.installmentPaymentsAPI.getSummary.mockResolvedValue({
      data: { data: { totalDebt: 0, totalPaid: 0, totalRemaining: 0, monthlyTotal: 0, activeInstallments: 0 } }
    });
  });

  test('renders page title', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    expect(screen.getByText('Taksitli Ödemelerim')).toBeInTheDocument();
  });

  test('shows view mode buttons', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Kartlar')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Takvim')).toBeInTheDocument();
    expect(screen.getByText('Liste')).toBeInTheDocument();
  });

  test('shows empty state', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Henüz taksitli ödeme eklenmemiş')).toBeInTheDocument();
    });
  });

  test('shows add payment button', async () => {
    renderWithProviders(<InstallmentPaymentsPage />);
    
    expect(screen.getByText('Taksitli Ödeme Ekle')).toBeInTheDocument();
  });
});