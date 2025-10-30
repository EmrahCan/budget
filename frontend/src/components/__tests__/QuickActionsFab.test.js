import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuickActionsFab from '../QuickActionsFab';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('QuickActionsFab', () => {
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render FAB button', () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      expect(screen.getByLabelText('Hızlı İşlemler')).toBeInTheDocument();
    });

    test('should render in bottom-right position by default', () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      expect(fab.closest('.MuiSpeedDial-root')).toHaveStyle({
        position: 'fixed',
        bottom: '16px',
        right: '16px',
      });
    });

    test('should render in custom position', () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} position="top-left" />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      expect(fab.closest('.MuiSpeedDial-root')).toHaveStyle({
        position: 'fixed',
        top: '16px',
        left: '16px',
      });
    });
  });

  describe('Speed Dial Actions', () => {
    test('should show all action buttons when opened', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByLabelText('İşlem Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Hesap Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Kredi Kartı Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Sabit Ödeme Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Taksit Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Raporlar')).toBeInTheDocument();
        expect(screen.getByLabelText('Takvim')).toBeInTheDocument();
      });
    });

    test('should close speed dial when action is clicked', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        const addTransactionButton = screen.getByLabelText('İşlem Ekle');
        fireEvent.click(addTransactionButton);
      });
      
      expect(mockOnAction).toHaveBeenCalledWith('addTransaction');
      
      // Speed dial should close after action
      await waitFor(() => {
        expect(screen.queryByLabelText('İşlem Ekle')).not.toBeInTheDocument();
      });
    });
  });

  describe('Action Callbacks', () => {
    test('should call onAction with correct action for each button', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      const actions = [
        { label: 'İşlem Ekle', action: 'addTransaction' },
        { label: 'Hesap Ekle', action: 'addAccount' },
        { label: 'Kredi Kartı Ekle', action: 'addCreditCard' },
        { label: 'Sabit Ödeme Ekle', action: 'addFixedPayment' },
        { label: 'Taksit Ekle', action: 'addInstallment' },
        { label: 'Raporlar', action: 'viewReports' },
        { label: 'Takvim', action: 'viewCalendar' },
      ];
      
      for (const { label, action } of actions) {
        await waitFor(() => {
          const button = screen.getByLabelText(label);
          fireEvent.click(button);
        });
        
        expect(mockOnAction).toHaveBeenCalledWith(action);
        mockOnAction.mockClear();
        
        // Reopen for next test
        if (label !== 'Takvim') { // Don't reopen after last action
          fireEvent.click(fab);
        }
      }
    });
  });

  describe('Mobile Behavior', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
    });

    test('should show backdrop on mobile when opened', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument(); // Backdrop
      });
    });

    test('should close when backdrop is clicked on mobile', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        const backdrop = screen.getByRole('presentation');
        fireEvent.click(backdrop);
      });
      
      await waitFor(() => {
        expect(screen.queryByLabelText('İşlem Ekle')).not.toBeInTheDocument();
      });
    });
  });

  describe('Desktop Behavior', () => {
    beforeEach(() => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
    });

    test('should not show backdrop on desktop', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByLabelText('İşlem Ekle')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
  });

  describe('Position Variants', () => {
    const positions = [
      { position: 'bottom-left', expected: { bottom: '16px', left: '16px' } },
      { position: 'bottom-right', expected: { bottom: '16px', right: '16px' } },
      { position: 'top-left', expected: { top: '16px', left: '16px' } },
      { position: 'top-right', expected: { top: '16px', right: '16px' } },
    ];

    positions.forEach(({ position, expected }) => {
      test(`should position FAB correctly for ${position}`, () => {
        renderWithTheme(<QuickActionsFab onAction={mockOnAction} position={position} />);
        
        const fab = screen.getByLabelText('Hızlı İşlemler');
        const speedDial = fab.closest('.MuiSpeedDial-root');
        
        Object.entries(expected).forEach(([property, value]) => {
          expect(speedDial).toHaveStyle({ [property]: value });
        });
      });
    });
  });

  describe('Action Colors', () => {
    test('should apply correct colors to action buttons', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        const addTransactionButton = screen.getByLabelText('İşlem Ekle');
        const addAccountButton = screen.getByLabelText('Hesap Ekle');
        const addCreditCardButton = screen.getByLabelText('Kredi Kartı Ekle');
        
        // Check if buttons have appropriate color styling
        expect(addTransactionButton.closest('.MuiSpeedDialAction-fab')).toHaveClass('MuiSpeedDialAction-fab');
        expect(addAccountButton.closest('.MuiSpeedDialAction-fab')).toHaveClass('MuiSpeedDialAction-fab');
        expect(addCreditCardButton.closest('.MuiSpeedDialAction-fab')).toHaveClass('MuiSpeedDialAction-fab');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support keyboard navigation', () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      
      // Should be focusable
      fab.focus();
      expect(document.activeElement).toBe(fab);
      
      // Should open on Enter key
      fireEvent.keyDown(fab, { key: 'Enter', code: 'Enter' });
      
      // Should show action buttons
      expect(screen.getByLabelText('İşlem Ekle')).toBeInTheDocument();
    });

    test('should close on Escape key', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByLabelText('İşlem Ekle')).toBeInTheDocument();
      });
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByLabelText('İşlem Ekle')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByLabelText('İşlem Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Hesap Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Kredi Kartı Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Sabit Ödeme Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Taksit Ekle')).toBeInTheDocument();
        expect(screen.getByLabelText('Raporlar')).toBeInTheDocument();
        expect(screen.getByLabelText('Takvim')).toBeInTheDocument();
      });
    });

    test('should have proper tooltip titles', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        const addTransactionButton = screen.getByLabelText('İşlem Ekle');
        fireEvent.mouseEnter(addTransactionButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('İşlem Ekle')).toBeInTheDocument();
      });
    });
  });

  describe('Animation and Transitions', () => {
    test('should animate actions when opening', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      // Actions should appear with animation
      await waitFor(() => {
        const actions = screen.getAllByRole('button').filter(button => 
          button.getAttribute('aria-label') !== 'Hızlı İşlemler'
        );
        expect(actions.length).toBe(7);
      });
    });

    test('should animate actions when closing', async () => {
      renderWithTheme(<QuickActionsFab onAction={mockOnAction} />);
      
      const fab = screen.getByLabelText('Hızlı İşlemler');
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.getByLabelText('İşlem Ekle')).toBeInTheDocument();
      });
      
      // Close by clicking FAB again
      fireEvent.click(fab);
      
      await waitFor(() => {
        expect(screen.queryByLabelText('İşlem Ekle')).not.toBeInTheDocument();
      });
    });
  });
});