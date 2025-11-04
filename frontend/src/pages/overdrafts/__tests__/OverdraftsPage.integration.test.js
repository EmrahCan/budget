import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import OverdraftsPage from '../OverdraftsPage';
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

describe('OverdraftsPage Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('should load and display overdraft accounts', async () => {
    // Mock API response
    const mockOverdrafts = [
      {
        id: 1,
        name: 'Test Esnek Hesap',
        type: 'overdraft',
        overdraftLimit: 5000,
        overdraftUsed: 1000,
        bankName: 'Test Bank',
        isActive: true
      }
    ];

    api.accountsAPI.getAll.mockResolvedValue({
      data: {
        accounts: mockOverdrafts
      }
    });

    render(
      <TestWrapper>
        <OverdraftsPage />
      </TestWrapper>
    );

    // Check if loading state is shown initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Esnek Hesap')).toBeInTheDocument();
    });

    // Check if account details are displayed
    expect(screen.getByText('₺5.000,00')).toBeInTheDocument(); // Limit
    expect(screen.getByText('₺1.000,00')).toBeInTheDocument(); // Used amount
    expect(screen.getByText('₺4.000,00')).toBeInTheDocument(); // Available
    expect(screen.getByText('Test Bank')).toBeInTheDocument();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error
    api.accountsAPI.getAll.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Server error' }
      }
    });

    render(
      <TestWrapper>
        <OverdraftsPage />
      </TestWrapper>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Should show empty state
    expect(screen.getByText(/henüz esnek hesap eklenmemiş/i)).toBeInTheDocument();
  });

  test('should open add overdraft dialog', async () => {
    api.accountsAPI.getAll.mockResolvedValue({
      data: { accounts: [] }
    });

    render(
      <TestWrapper>
        <OverdraftsPage />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Click add button
    const addButton = screen.getByText(/esnek hesap ekle/i);
    fireEvent.click(addButton);

    // Check if dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Yeni Esnek Hesap Ekle')).toBeInTheDocument();
    });

    // Check if form fields are present
    expect(screen.getByLabelText(/esnek hesap adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/esnek hesap limiti/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kullanılan miktar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/faiz oranı/i)).toBeInTheDocument();
  });

  test('should create new overdraft account', async () => {
    api.accountsAPI.getAll.mockResolvedValue({
      data: { accounts: [] }
    });

    api.accountsAPI.create.mockResolvedValue({
      data: {
        account: {
          id: 2,
          name: 'New Overdraft',
          type: 'overdraft',
          overdraftLimit: 3000,
          overdraftUsed: 0,
          bankName: 'New Bank'
        }
      }
    });

    render(
      <TestWrapper>
        <OverdraftsPage />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open add dialog
    const addButton = screen.getByText(/esnek hesap ekle/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Yeni Esnek Hesap Ekle')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/esnek hesap adı/i), {
      target: { value: 'New Overdraft' }
    });
    fireEvent.change(screen.getByLabelText(/esnek hesap limiti/i), {
      target: { value: '3000' }
    });
    fireEvent.change(screen.getByLabelText(/kullanılan miktar/i), {
      target: { value: '0' }
    });
    fireEvent.change(screen.getByLabelText(/faiz oranı/i), {
      target: { value: '0' }
    });

    // Submit form
    const submitButton = screen.getByText('Oluştur');
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(api.accountsAPI.create).toHaveBeenCalledWith({
        name: 'New Overdraft',
        type: 'overdraft',
        bankId: null,
        bankName: null,
        overdraftLimit: 3000,
        balance: 0
      });
    });
  });

  test('should handle expense transaction', async () => {
    const mockOverdraft = {
      id: 1,
      name: 'Test Esnek Hesap',
      type: 'overdraft',
      overdraftLimit: 5000,
      overdraftUsed: 1000,
      bankName: 'Test Bank'
    };

    api.accountsAPI.getAll.mockResolvedValue({
      data: { accounts: [mockOverdraft] }
    });

    api.accountsAPI.addExpense.mockResolvedValue({
      data: { success: true }
    });

    render(
      <TestWrapper>
        <OverdraftsPage />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Esnek Hesap')).toBeInTheDocument();
    });

    // Click expense button
    const expenseButton = screen.getByText('Harcama Yap');
    fireEvent.click(expenseButton);

    // Check if transaction dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Esnek Hesap Harcaması')).toBeInTheDocument();
    });

    // Fill amount
    fireEvent.change(screen.getByLabelText(/harcama tutarı/i), {
      target: { value: '500' }
    });

    // Submit transaction
    const submitButton = screen.getByText('Harcama Yap');
    fireEvent.click(submitButton);

    // Wait for API call
    await waitFor(() => {
      expect(api.accountsAPI.addExpense).toHaveBeenCalledWith(1, {
        amount: 500,
        description: 'Esnek hesap harcaması'
      });
    });
  });
});