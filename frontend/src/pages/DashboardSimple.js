import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const DashboardSimple = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard Test
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Bu basit dashboard testi çalışıyor mu?
        </Typography>
      </Box>
    </Container>
  );
};

export default DashboardSimple;