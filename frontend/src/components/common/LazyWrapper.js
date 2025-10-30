import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LazyWrapper = ({ children, fallback, minHeight = '200px' }) => {
  const defaultFallback = (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight,
        gap: 2 
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="textSecondary">
        Bileşen yükleniyor...
      </Typography>
    </Box>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;