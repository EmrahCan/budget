import React from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';

const ChartWrapper = ({ 
  title, 
  children, 
  loading = false, 
  error = null, 
  height = 300,
  actions = null 
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {actions}
        </Box>
        
        <Box sx={{ height, position: 'relative' }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              {error}
            </Alert>
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChartWrapper;