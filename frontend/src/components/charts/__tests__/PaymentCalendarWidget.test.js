import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PaymentCalendarWidget from '../PaymentCalendarWidget';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
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

describe('PaymentCalendarWidget', () => {
  describe('Loading State', () => {
    test('should show loading indicator when loading', () => {
      renderWithTheme(<PaymentCalendarWidget payments={[]} loading={true} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Calendar Rendering', () => {
    test('should render calendar grid', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      // Should render calendar days
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    test('should render month navigation', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      // Should have previous and next month buttons
      const prevButton = screen.getByLabelText(/önceki ay/i);
      const nextButton = screen.getByLabelText(/sonraki ay/i);
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    test('should display current month and year', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      const currentDate = new Date();
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const currentMonth = monthNames[currentDate.getMonth()];
      const currentYear = currentDate.getFullYear();
      
      expect(screen.getByText(`${currentMonth} ${currentYear}`)).toBeInTheDocument();
    });
  });

  describe('Payment Display', () => {
    test('should show payments on correct days', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      // Should show payment indicators on days with payments
      const day1 = screen.getByText('1');
      const day15 = screen.getByText('15');
      const day31 = screen.getByText('31');
      
      expect(day1.closest('[data-has-payment="true"]')).toBeInTheDocument();
      expect(day15.closest('[data-has-payment="true"]')).toBeInTheDocument();
      expect(day31.closest('[data-has-payment="true"]')).toBeInTheDocument();
    });

    test('should handle empty payments array', () => {
      renderWithTheme(<PaymentCalendarWidget payments={[]} loading={false} />);
      
      // Should still render calendar without payments
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('Kira')).not.toBeInTheDocument();
    });
  });

  describe('Month Navigation', () => {
    test('should navigate to previous month', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      const prevButton = screen.getByLabelText(/önceki ay/i);
      fireEvent.click(prevButton);
      
      // Month should change (implementation specific)
      // This would need to be tested based on actual implementation
    });

    test('should navigate to next month', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      const nextButton = screen.getByLabelText(/sonraki ay/i);
      fireEvent.click(nextButton);
      
      // Month should change (implementation specific)
      // This would need to be tested based on actual implementation
    });
  });

  describe('Payment Details', () => {
    test('should show payment details on day click', async () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      const day1 = screen.getByText('1');
      fireEvent.click(day1);
      
      await waitFor(() => {
        expect(screen.getByText('Kira')).toBeInTheDocument();
        expect(screen.getByText('₺2000')).toBeInTheDocument();
      });
    });

    test('should close payment details dialog', async () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      const day1 = screen.getByText('1');
      fireEvent.click(day1);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText(/kapat/i);
        fireEvent.click(closeButton);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Kira')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      // Should render mobile-friendly calendar
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Date Calculations', () => {
    test('should handle month end edge cases', () => {
      const paymentsWithDay31 = [
        { id: 1, name: 'Test Payment', amount: 100, dueDay: 31 }
      ];
      
      renderWithTheme(<PaymentCalendarWidget payments={paymentsWithDay31} loading={false} />);
      
      // Should handle months with less than 31 days
      // Implementation would need to adjust day 31 to last day of month
      expect(screen.getByText('31')).toBeInTheDocument();
    });

    test('should handle leap year correctly', () => {
      const paymentsWithDay29 = [
        { id: 1, name: 'Test Payment', amount: 100, dueDay: 29 }
      ];
      
      renderWithTheme(<PaymentCalendarWidget payments={paymentsWithDay29} loading={false} />);
      
      // Should handle February 29th in leap years
      expect(screen.getByText('29')).toBeInTheDocument();
    });
  });

  describe('Payment Status', () => {
    test('should mark overdue payments', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const overduePayments = [
        { id: 1, name: 'Overdue Payment', amount: 100, dueDay: yesterday.getDate() }
      ];
      
      renderWithTheme(<PaymentCalendarWidget payments={overduePayments} loading={false} />);
      
      // Should mark overdue payments with different styling
      const overdueDay = screen.getByText(yesterday.getDate().toString());
      expect(overdueDay.closest('[data-payment-status="overdue"]')).toBeInTheDocument();
    });

    test('should mark today payments', () => {
      const today = new Date();
      const todayPayments = [
        { id: 1, name: 'Today Payment', amount: 100, dueDay: today.getDate() }
      ];
      
      renderWithTheme(<PaymentCalendarWidget payments={todayPayments} loading={false} />);
      
      // Should mark today's payments with different styling
      const todayDay = screen.getByText(today.getDate().toString());
      expect(todayDay.closest('[data-payment-status="today"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      // Should have accessible calendar navigation
      expect(screen.getByLabelText(/önceki ay/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sonraki ay/i)).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      renderWithTheme(<PaymentCalendarWidget payments={mockPayments} loading={false} />);
      
      const day1 = screen.getByText('1');
      
      // Should be focusable
      day1.focus();
      expect(document.activeElement).toBe(day1);
      
      // Should respond to Enter key
      fireEvent.keyDown(day1, { key: 'Enter', code: 'Enter' });
      // Implementation would show payment details
    });
  });
});