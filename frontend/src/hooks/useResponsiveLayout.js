import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

const useResponsiveLayout = ({
  mobileBreakpoint = 'sm',
  tabletBreakpoint = 'md',
  enableTouchDetection = true,
  enableOrientationDetection = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  const isTablet = useMediaQuery(theme.breakpoints.down(tabletBreakpoint));
  const isDesktop = useMediaQuery(theme.breakpoints.up(tabletBreakpoint));
  
  const [layoutState, setLayoutState] = useState({
    isMobile,
    isTablet,
    isDesktop,
    isTouch: false,
    orientation: 'portrait',
    screenSize: 'desktop',
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  });

  // Detect touch capability
  const detectTouch = useCallback(() => {
    if (!enableTouchDetection) return false;
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }, [enableTouchDetection]);

  // Detect orientation
  const detectOrientation = useCallback(() => {
    if (!enableOrientationDetection) return 'portrait';
    
    if (window.innerWidth > window.innerHeight) {
      return 'landscape';
    }
    return 'portrait';
  }, [enableOrientationDetection]);

  // Get screen size category
  const getScreenSize = useCallback(() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }, [isMobile, isTablet]);

  // Update layout state
  const updateLayoutState = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      isMobile,
      isTablet,
      isDesktop,
      isTouch: detectTouch(),
      orientation: detectOrientation(),
      screenSize: getScreenSize(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    }));
  }, [isMobile, isTablet, isDesktop, detectTouch, detectOrientation, getScreenSize]);

  // Listen for viewport changes
  useEffect(() => {
    updateLayoutState();

    const handleResize = () => {
      updateLayoutState();
    };

    const handleOrientationChange = () => {
      // Delay to ensure viewport dimensions are updated
      setTimeout(updateLayoutState, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateLayoutState]);

  // Responsive grid columns
  const getGridColumns = useCallback((mobileColumns = 1, tabletColumns = 2, desktopColumns = 3) => {
    if (layoutState.isMobile) return mobileColumns;
    if (layoutState.isTablet) return tabletColumns;
    return desktopColumns;
  }, [layoutState.isMobile, layoutState.isTablet]);

  // Responsive spacing
  const getSpacing = useCallback((mobileSpacing = 1, tabletSpacing = 2, desktopSpacing = 3) => {
    if (layoutState.isMobile) return mobileSpacing;
    if (layoutState.isTablet) return tabletSpacing;
    return desktopSpacing;
  }, [layoutState.isMobile, layoutState.isTablet]);

  // Responsive font sizes
  const getFontSize = useCallback((mobileFontSize = 'body2', tabletFontSize = 'body1', desktopFontSize = 'h6') => {
    if (layoutState.isMobile) return mobileFontSize;
    if (layoutState.isTablet) return tabletFontSize;
    return desktopFontSize;
  }, [layoutState.isMobile, layoutState.isTablet]);

  // Chart dimensions
  const getChartDimensions = useCallback(() => {
    const { viewportWidth, viewportHeight, isMobile, isTablet } = layoutState;
    
    if (isMobile) {
      return {
        width: Math.min(viewportWidth - 32, 400), // Account for padding
        height: Math.min(viewportHeight * 0.4, 250),
        aspectRatio: 4 / 3
      };
    }
    
    if (isTablet) {
      return {
        width: Math.min(viewportWidth - 64, 600),
        height: Math.min(viewportHeight * 0.5, 350),
        aspectRatio: 16 / 10
      };
    }
    
    return {
      width: Math.min(viewportWidth - 96, 800),
      height: Math.min(viewportHeight * 0.6, 400),
      aspectRatio: 16 / 9
    };
  }, [layoutState]);

  // Touch-friendly sizes
  const getTouchSizes = useCallback(() => {
    const { isTouch, isMobile } = layoutState;
    
    return {
      minTouchTarget: isTouch ? 44 : 32, // Minimum touch target size
      buttonSize: isMobile ? 'large' : 'medium',
      iconSize: isMobile ? 'large' : 'medium',
      chipSize: isMobile ? 'medium' : 'small',
      fabSize: isMobile ? 'large' : 'medium'
    };
  }, [layoutState]);

  // Layout configurations
  const getLayoutConfig = useCallback(() => {
    const { isMobile, isTablet, isTouch, orientation } = layoutState;
    
    return {
      // Container settings
      maxWidth: isMobile ? 'sm' : isTablet ? 'md' : 'xl',
      padding: getSpacing(2, 3, 4),
      
      // Grid settings
      gridSpacing: getSpacing(1, 2, 3),
      gridColumns: getGridColumns(1, 2, 3),
      
      // Component sizes
      ...getTouchSizes(),
      
      // Behavior flags
      useDrawers: isMobile,
      useCollapse: !isMobile,
      enableSwipeGestures: isTouch,
      showCompactView: isMobile,
      
      // Layout preferences
      stackVertically: isMobile || (isTablet && orientation === 'portrait'),
      showSidebar: !isMobile,
      useBottomNavigation: isMobile,
      
      // Chart settings
      chartDimensions: getChartDimensions()
    };
  }, [layoutState, getSpacing, getGridColumns, getTouchSizes, getChartDimensions]);

  return {
    // Layout state
    ...layoutState,
    
    // Helper functions
    getGridColumns,
    getSpacing,
    getFontSize,
    getChartDimensions,
    getTouchSizes,
    getLayoutConfig,
    
    // Convenience flags
    isLandscape: layoutState.orientation === 'landscape',
    isPortrait: layoutState.orientation === 'portrait',
    isSmallScreen: layoutState.viewportWidth < 600,
    isLargeScreen: layoutState.viewportWidth > 1200,
    
    // Update function
    updateLayoutState
  };
};

export default useResponsiveLayout;