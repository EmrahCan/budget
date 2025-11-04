import React, { useState, useEffect, useRef } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const ResponsiveChartContainer = ({
  children,
  minHeight = 300,
  maxHeight = 600,
  aspectRatio = 16 / 9, // width / height
  maintainAspectRatio = true,
  mobileHeight = 250,
  tabletHeight = 350,
  desktopHeight = 400,
  padding = 2,
  enableAutoResize = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate responsive height
  const getResponsiveHeight = () => {
    if (isMobile) return mobileHeight;
    if (isTablet) return tabletHeight;
    return desktopHeight;
  };

  // Update dimensions on resize
  useEffect(() => {
    if (!enableAutoResize || !containerRef.current) return;

    const updateDimensions = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        
        let height = getResponsiveHeight();
        
        // Maintain aspect ratio if enabled
        if (maintainAspectRatio) {
          const calculatedHeight = width / aspectRatio;
          height = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
        }
        
        setDimensions({ width, height });
      }
    };

    // Initial calculation
    updateDimensions();

    // Add resize listener
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    // Fallback for older browsers
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [
    enableAutoResize,
    maintainAspectRatio,
    aspectRatio,
    minHeight,
    maxHeight,
    isMobile,
    isTablet,
    mobileHeight,
    tabletHeight,
    desktopHeight
  ]);

  const containerStyle = {
    width: '100%',
    height: enableAutoResize ? dimensions.height || getResponsiveHeight() : getResponsiveHeight(),
    minHeight,
    maxHeight,
    padding: theme.spacing(padding),
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <Box
      ref={containerRef}
      sx={containerStyle}
    >
      {React.cloneElement(children, {
        width: dimensions.width || '100%',
        height: dimensions.height || getResponsiveHeight(),
        isMobile,
        isTablet,
        responsive: true
      })}
    </Box>
  );
};

export default ResponsiveChartContainer;