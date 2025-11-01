import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const useMobileOptimization = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  const [touchSupport, setTouchSupport] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    os: 'unknown',
    browser: 'unknown',
    screenSize: { width: 0, height: 0 },
    pixelRatio: 1
  });

  // Detect touch support
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0 || 
                    navigator.msMaxTouchPoints > 0;
    setTouchSupport(hasTouch);
  }, []);

  // Detect device information
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let deviceType = 'desktop';
    let os = 'unknown';
    let browser = 'unknown';

    // Device type detection
    if (isMobile) {
      deviceType = 'mobile';
    } else if (isTablet) {
      deviceType = 'tablet';
    }

    // OS detection
    if (/Android/i.test(userAgent)) {
      os = 'android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      os = 'ios';
    } else if (/Windows/i.test(userAgent)) {
      os = 'windows';
    } else if (/Mac/i.test(userAgent)) {
      os = 'macos';
    } else if (/Linux/i.test(userAgent)) {
      os = 'linux';
    }

    // Browser detection
    if (/Chrome/i.test(userAgent)) {
      browser = 'chrome';
    } else if (/Firefox/i.test(userAgent)) {
      browser = 'firefox';
    } else if (/Safari/i.test(userAgent)) {
      browser = 'safari';
    } else if (/Edge/i.test(userAgent)) {
      browser = 'edge';
    }

    setDeviceInfo({
      type: deviceType,
      os,
      browser,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      pixelRatio: window.devicePixelRatio || 1
    });
  }, [isMobile, isTablet]);

  // Mobile-specific configurations
  const getMobileConfig = useCallback(() => {
    return {
      // Touch targets should be at least 44px
      minTouchTarget: 44,
      
      // Spacing adjustments for mobile
      spacing: {
        xs: isMobile ? 1 : 2,
        sm: isMobile ? 2 : 3,
        md: isMobile ? 3 : 4,
        lg: isMobile ? 4 : 6
      },
      
      // Typography scaling for mobile
      typography: {
        scale: isMobile ? 0.9 : 1,
        lineHeight: isMobile ? 1.4 : 1.5
      },
      
      // Component sizes for mobile
      componentSizes: {
        button: isMobile ? 'medium' : 'large',
        input: isMobile ? 'small' : 'medium',
        chip: isMobile ? 'small' : 'medium',
        avatar: isMobile ? 'small' : 'medium'
      },
      
      // Layout configurations
      layout: {
        maxWidth: isMobile ? '100%' : 'xl',
        padding: isMobile ? 1 : 3,
        margin: isMobile ? 0.5 : 2,
        borderRadius: isMobile ? 1 : 2
      },
      
      // Chart configurations for mobile
      charts: {
        height: isMobile ? 250 : 400,
        responsive: true,
        maintainAspectRatio: !isMobile,
        legend: {
          display: !isMobile,
          position: isMobile ? 'bottom' : 'right'
        }
      },
      
      // Table configurations for mobile
      table: {
        size: isMobile ? 'small' : 'medium',
        stickyHeader: isMobile,
        pagination: {
          rowsPerPageOptions: isMobile ? [5, 10] : [10, 25, 50],
          defaultRowsPerPage: isMobile ? 5 : 10
        }
      }
    };
  }, [isMobile]);

  // Viewport utilities
  const getViewportInfo = useCallback(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      availableWidth: window.screen.availWidth,
      availableHeight: window.screen.availHeight,
      orientation: isLandscape ? 'landscape' : 'portrait',
      safeArea: {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0'),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0'),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0')
      }
    };
  }, [isLandscape]);

  // Touch gesture helpers
  const createTouchHandlers = useCallback((callbacks = {}) => {
    if (!touchSupport) return {};

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
      callbacks.onTouchStart?.(e);
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Swipe detection (minimum 50px movement)
      if (absDeltaX > 50 || absDeltaY > 50) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            callbacks.onSwipeRight?.(e, deltaX);
          } else {
            callbacks.onSwipeLeft?.(e, Math.abs(deltaX));
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            callbacks.onSwipeDown?.(e, deltaY);
          } else {
            callbacks.onSwipeUp?.(e, Math.abs(deltaY));
          }
        }
      } else {
        // Tap
        callbacks.onTap?.(e);
      }
      
      callbacks.onTouchEnd?.(e);
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    };
  }, [touchSupport]);

  // Performance optimizations for mobile
  const getMobilePerformanceConfig = useCallback(() => {
    return {
      // Reduce animations on mobile for better performance
      animations: {
        enabled: !isMobile || deviceInfo.os !== 'android', // Disable on Android for performance
        duration: isMobile ? 200 : 300,
        easing: 'ease-out'
      },
      
      // Lazy loading configurations
      lazyLoading: {
        enabled: isMobile,
        threshold: isMobile ? 0.1 : 0.3,
        rootMargin: isMobile ? '50px' : '100px'
      },
      
      // Image optimizations
      images: {
        quality: isMobile ? 0.8 : 0.9,
        format: 'webp',
        sizes: {
          thumbnail: isMobile ? 150 : 200,
          medium: isMobile ? 300 : 500,
          large: isMobile ? 600 : 1000
        }
      },
      
      // Memory management
      memory: {
        maxCacheSize: isMobile ? 50 : 100, // MB
        cleanupInterval: isMobile ? 30000 : 60000, // ms
        maxHistoryItems: isMobile ? 10 : 50
      }
    };
  }, [isMobile, deviceInfo.os]);

  return {
    // Device detection
    isMobile,
    isTablet,
    isLandscape,
    touchSupport,
    deviceInfo,
    
    // Configuration helpers
    getMobileConfig,
    getViewportInfo,
    getMobilePerformanceConfig,
    
    // Touch utilities
    createTouchHandlers,
    
    // Utility functions
    isSmallScreen: isMobile || isTablet,
    isPortrait: !isLandscape,
    hasNotch: deviceInfo.os === 'ios' && deviceInfo.screenSize.height >= 812,
    
    // Responsive breakpoints
    breakpoints: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    }
  };
};

export default useMobileOptimization;