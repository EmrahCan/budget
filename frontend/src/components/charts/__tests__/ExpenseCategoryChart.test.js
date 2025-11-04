import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ExpenseCategoryChart from '../ExpenseCategoryChart';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockCategoryData = [
  { category: 'Yemek', amount: 1200, color: '#FF6384' },
  { category: 'Ulaşım', amount: 800, color: '#36A2EB' },
  { category: 'Eğlence', amount: 400, color: '#FFCE56' },
  { category: 'Alışveriş', amount: 600, color: '#4BC0C0' },
];

describe('ExpenseCategoryChart', () => {
  describe('Loading State', () => {
    test('should show loading indicator when loading', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={[]} loading={true} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    test('should render pie chart with category data', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Should render chart container
      expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument();
    });

    test('should render category legend', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Should show all categories in legend
      expect(screen.getByText('Yemek')).toBeInTheDocument();
      expect(screen.getByText('Ulaşım')).toBeInTheDocument();
      expect(screen.getByText('Eğlence')).toBeInTheDocument();
      expect(screen.getByText('Alışveriş')).toBeInTheDocument();
    });

    test('should display category amounts', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Should show formatted amounts
      expect(screen.getByText('₺1,200')).toBeInTheDocument();
      expect(screen.getByText('₺800')).toBeInTheDocument();
      expect(screen.getByText('₺400')).toBeInTheDocument();
      expect(screen.getByText('₺600')).toBeInTheDocument();
    });

    test('should calculate and display percentages', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Total = 1200 + 800 + 400 + 600 = 3000
      // Yemek = 1200/3000 = 40%
      expect(screen.getByText('40%')).toBeInTheDocument();
      // Ulaşım = 800/3000 = 26.7%
      expect(screen.getByText(/26\.7%|27%/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('should handle empty category data', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={[]} loading={false} />);
      
      expect(screen.getByText('Henüz kategori verisi yok')).toBeInTheDocument();
    });

    test('should handle null category data', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={null} loading={false} />);
      
      expect(screen.getByText('Henüz kategori verisi yok')).toBeInTheDocument();
    });
  });

  describe('Chart Interactions', () => {
    test('should call onCategoryClick when category is clicked', () => {
      const mockOnCategoryClick = jest.fn();
      
      renderWithTheme(
        <ExpenseCategoryChart 
          categoryData={mockCategoryData} 
          loading={false}
          onCategoryClick={mockOnCategoryClick}
        />
      );
      
      // Click on a category
      const yemekCategory = screen.getByText('Yemek');
      fireEvent.click(yemekCategory);
      
      expect(mockOnCategoryClick).toHaveBeenCalledWith('Yemek');
    });

    test('should handle chart segment click', () => {
      const mockOnCategoryClick = jest.fn();
      
      renderWithTheme(
        <ExpenseCategoryChart 
          categoryData={mockCategoryData} 
          loading={false}
          onCategoryClick={mockOnCategoryClick}
        />
      );
      
      // Simulate chart segment click (implementation specific)
      const chartSegment = screen.getByTestId('chart-segment-Yemek');
      fireEvent.click(chartSegment);
      
      expect(mockOnCategoryClick).toHaveBeenCalledWith('Yemek');
    });
  });

  describe('Tooltip Functionality', () => {
    test('should show tooltip on hover', async () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      const chartSegment = screen.getByTestId('chart-segment-Yemek');
      fireEvent.mouseEnter(chartSegment);
      
      await waitFor(() => {
        expect(screen.getByText('Yemek: ₺1,200 (40%)')).toBeInTheDocument();
      });
    });

    test('should hide tooltip on mouse leave', async () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      const chartSegment = screen.getByTestId('chart-segment-Yemek');
      fireEvent.mouseEnter(chartSegment);
      fireEvent.mouseLeave(chartSegment);
      
      await waitFor(() => {
        expect(screen.queryByText('Yemek: ₺1,200 (40%)')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('should adapt chart size for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      const chart = screen.getByTestId('expense-category-chart');
      expect(chart).toHaveStyle({ width: '100%' });
    });

    test('should show compact legend on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Should show compact legend format
      expect(screen.getByTestId('compact-legend')).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    test('should sort categories by amount descending', () => {
      const unsortedData = [
        { category: 'Eğlence', amount: 400 },
        { category: 'Yemek', amount: 1200 },
        { category: 'Ulaşım', amount: 800 },
      ];

      renderWithTheme(<ExpenseCategoryChart categoryData={unsortedData} loading={false} />);
      
      // Should display categories in descending order by amount
      const categories = screen.getAllByTestId(/category-item/);
      expect(categories[0]).toHaveTextContent('Yemek');
      expect(categories[1]).toHaveTextContent('Ulaşım');
      expect(categories[2]).toHaveTextContent('Eğlence');
    });

    test('should handle zero amounts', () => {
      const dataWithZero = [
        { category: 'Yemek', amount: 1200 },
        { category: 'Ulaşım', amount: 0 },
      ];

      renderWithTheme(<ExpenseCategoryChart categoryData={dataWithZero} loading={false} />);
      
      // Should still display zero amount categories
      expect(screen.getByText('₺0')).toBeInTheDocument();
    });

    test('should handle negative amounts', () => {
      const dataWithNegative = [
        { category: 'Yemek', amount: 1200 },
        { category: 'Refund', amount: -100 },
      ];

      renderWithTheme(<ExpenseCategoryChart categoryData={dataWithNegative} loading={false} />);
      
      // Should handle negative amounts appropriately
      expect(screen.getByText('-₺100')).toBeInTheDocument();
    });
  });

  describe('Color Management', () => {
    test('should use predefined colors for categories', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Should apply correct colors to chart segments
      const yemekSegment = screen.getByTestId('chart-segment-Yemek');
      expect(yemekSegment).toHaveStyle({ fill: '#FF6384' });
    });

    test('should generate colors for categories without predefined colors', () => {
      const dataWithoutColors = [
        { category: 'Yeni Kategori', amount: 500 },
      ];

      renderWithTheme(<ExpenseCategoryChart categoryData={dataWithoutColors} loading={false} />);
      
      // Should assign a color to the new category
      const newCategorySegment = screen.getByTestId('chart-segment-Yeni Kategori');
      expect(newCategorySegment).toHaveAttribute('fill');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      expect(screen.getByLabelText('Kategori bazlı harcama grafiği')).toBeInTheDocument();
    });

    test('should support keyboard navigation', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      const firstCategory = screen.getByText('Yemek');
      firstCategory.focus();
      
      expect(document.activeElement).toBe(firstCategory);
      
      // Should respond to Enter key
      fireEvent.keyDown(firstCategory, { key: 'Enter', code: 'Enter' });
    });

    test('should provide screen reader friendly descriptions', () => {
      renderWithTheme(<ExpenseCategoryChart categoryData={mockCategoryData} loading={false} />);
      
      // Should have descriptive text for screen readers
      expect(screen.getByText(/toplam harcama/i)).toBeInTheDocument();
      expect(screen.getByText(/4 kategori/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        category: `Kategori ${i + 1}`,
        amount: Math.random() * 1000,
      }));

      const startTime = performance.now();
      renderWithTheme(<ExpenseCategoryChart categoryData={largeDataset} loading={false} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});