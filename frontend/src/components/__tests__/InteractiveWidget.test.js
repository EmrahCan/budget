import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InteractiveWidget from '../InteractiveWidget';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('InteractiveWidget', () => {
  const mockProps = {
    title: 'Test Widget',
    onFullscreen: jest.fn(),
    onSettings: jest.fn(),
    onRefresh: jest.fn(),
    onNavigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render widget with title', () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Widget Content</div>
        </InteractiveWidget>
      );
      
      expect(screen.getByText('Test Widget')).toBeInTheDocument();
      expect(screen.getByText('Widget Content')).toBeInTheDocument();
    });

    test('should render without title', () => {
      renderWithTheme(
        <InteractiveWidget onNavigate={mockProps.onNavigate}>
          <div>Widget Content</div>
        </InteractiveWidget>
      );
      
      expect(screen.getByText('Widget Content')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    test('should render children content', () => {
      renderWithTheme(
        <InteractiveWidget title="Test">
          <div data-testid="child-content">Child Content</div>
        </InteractiveWidget>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Menu Functionality', () => {
    test('should show menu button on hover', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Widget Menüsü')).toBeInTheDocument();
      });
    });

    test('should open menu on button click', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      expect(screen.getByText('Detayları Gör')).toBeInTheDocument();
      expect(screen.getByText('Tam Ekran')).toBeInTheDocument();
      expect(screen.getByText('Yenile')).toBeInTheDocument();
    });

    test('should show settings option when enabled', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} showSettings={true}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    });

    test('should hide menu when showMenu is false', () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} showMenu={false}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      expect(screen.queryByLabelText('Widget Menüsü')).not.toBeInTheDocument();
    });
  });

  describe('Menu Actions', () => {
    test('should call onNavigate when "Detayları Gör" is clicked', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      const navigateOption = screen.getByText('Detayları Gör');
      fireEvent.click(navigateOption);
      
      expect(mockProps.onNavigate).toHaveBeenCalled();
    });

    test('should call onFullscreen when "Tam Ekran" is clicked', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      const fullscreenOption = screen.getByText('Tam Ekran');
      fireEvent.click(fullscreenOption);
      
      expect(mockProps.onFullscreen).toHaveBeenCalled();
    });

    test('should call onRefresh when "Yenile" is clicked', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      const refreshOption = screen.getByText('Yenile');
      fireEvent.click(refreshOption);
      
      expect(mockProps.onRefresh).toHaveBeenCalled();
    });

    test('should call onSettings when "Ayarlar" is clicked', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} showSettings={true}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      const settingsOption = screen.getByText('Ayarlar');
      fireEvent.click(settingsOption);
      
      expect(mockProps.onSettings).toHaveBeenCalled();
    });
  });

  describe('Custom Actions', () => {
    test('should render custom actions in menu', async () => {
      const customActions = [
        {
          label: 'Custom Action',
          icon: <div>Icon</div>,
          callback: jest.fn(),
        },
      ];

      renderWithTheme(
        <InteractiveWidget {...mockProps} customActions={customActions}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });

    test('should call custom action callback', async () => {
      const mockCallback = jest.fn();
      const customActions = [
        {
          label: 'Custom Action',
          icon: <div>Icon</div>,
          callback: mockCallback,
        },
      ];

      renderWithTheme(
        <InteractiveWidget {...mockProps} customActions={customActions}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      const customAction = screen.getByText('Custom Action');
      fireEvent.click(customAction);
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Click Behavior', () => {
    test('should call onNavigate when widget is clicked', () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.click(widget);
      
      expect(mockProps.onNavigate).toHaveBeenCalled();
    });

    test('should not be clickable when onNavigate is not provided', () => {
      const propsWithoutNavigate = { ...mockProps };
      delete propsWithoutNavigate.onNavigate;

      renderWithTheme(
        <InteractiveWidget {...propsWithoutNavigate}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      expect(widget).not.toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Error State', () => {
    test('should display error message when error prop is provided', () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} error="Something went wrong">
          <div>Content</div>
        </InteractiveWidget>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    test('should not display error when error is null', () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} error={null}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    test('should apply hover styles when onNavigate is provided', () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      expect(widget).toHaveStyle({ cursor: 'pointer' });
    });

    test('should show menu button on hover', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        expect(menuButton).toBeVisible();
      });
    });

    test('should hide menu button on mouse leave', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      fireEvent.mouseLeave(widget);
      
      await waitFor(() => {
        const menuButton = screen.queryByLabelText('Widget Menüsü');
        expect(menuButton).not.toBeVisible();
      });
    });
  });

  describe('Menu Visibility Options', () => {
    test('should hide navigate option when showNavigate is false', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} showNavigate={false}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      expect(screen.queryByText('Detayları Gör')).not.toBeInTheDocument();
    });

    test('should hide fullscreen option when showFullscreen is false', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} showFullscreen={false}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      expect(screen.queryByText('Tam Ekran')).not.toBeInTheDocument();
    });

    test('should hide refresh option when showRefresh is false', async () => {
      renderWithTheme(
        <InteractiveWidget {...mockProps} showRefresh={false}>
          <div>Content</div>
        </InteractiveWidget>
      );
      
      const widget = screen.getByText('Test Widget').closest('.MuiCard-root');
      fireEvent.mouseEnter(widget);
      
      await waitFor(() => {
        const menuButton = screen.getByLabelText('Widget Menüsü');
        fireEvent.click(menuButton);
      });
      
      expect(screen.queryByText('Yenile')).not.toBeInTheDocument();
    });
  });
});