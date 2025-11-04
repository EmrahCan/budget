import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FixedPaymentsPage from '../FixedPaymentsPage';
import { NotificationProvider } from '../../../contexts/NotificationContext';
import * as api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('FixedPaymentsPage Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('should load and display fixed payments', async () => {
    // Mock API response
    const mockPayments = [
      {
        id: 1,
        name: 'Test Kira',
        amount: 2000,
        category: 'Konut',
        dueDay: 1,
        isActive: true
      }
    ];

    api.fixedPaymentsAPI.getAll.mockResolvedValue({
      data: mockPayments
    });

    render(
      <TestWrapper>
        <FixedPaymentsPage />
      </TestWrapper>
    );

    // Check if loading state is shown initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Kira')).toBeInTheDocument();
    });

    // Check if payment details are displayed
    expect(screen.getByText('₺2.000,00')).toBeInTheDocument();
    expect(screen.getByText('1. gün')).toBeInTheDocument();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error
    api.fixedPaymentsAPI.getAll.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Server error' }
      }
    });

    render(
      <TestWrapper>
        <FixedPaymentsPage />
      </TestWrapper>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Should show empty state or error message
    expect(screen.getByText(/henüz sabit ödeme eklenmemiş/i)).toBeInTheDocument();
  });

  test('should open add payment dialog', async () => {
    api.fixedPaymentsAPI.getAll.mockResolvedValue({
      data: []
    });

    render(
      <TestWrapper>
        <FixedPaymentsPage />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Click add button
    const addButton = screen.getByText(/sabit ödeme ekle/i);
    fireEvent.click(addButton);

    // Check if dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Yeni Sabit Ödeme Ekle')).toBeInTheDocument();
    });

    // Check if form fields are present
    expect(screen.getByLabelText(/ödeme adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kategori/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/aylık tutar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ödeme günü/i)).toBeInTheDocument();
  });

  test('should create new payment', async () => {
    api.fixedPaymentsAPI.getAll.mockResolvedValue({
      data: []
    });

    api.fixedPaymentsAPI.create.mockResolvedValue({
      data: {
        id: 2,
        name: 'New Payment',
        amount: 1000,
        category: 'Faturalar',
        dueDay: 15
      }
    });

    render(
      <TestWrapper>
        <FixedPaymentsPage />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open add dialog
    const addButton = screen.getByText(/sabit ödeme ekle/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Yeni Sabit Ödeme Ekle')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/ödeme adı/i), {
      target: { value: 'New Payment' }
    });
    fireEvent.change(screen.getByLabelText(/aylık tutar/i), {
      target: { value: '1000' }
    });
    fireEvent.change(screen.getByLabelText(/ödeme günü/i), {
      target: { value: '15' }
    });

    // Submit form
    const submitButton = screen.getByText('Ekle');
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(api.fixedPaymentsAPI.create).toHaveBeenCalledWith({
        name: 'New Payment',
        amount: 1000,
        category: 'Faturalar',
        dueDay: 15
      });
    });
  });
});