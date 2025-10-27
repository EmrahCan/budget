import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Block } from '@mui/icons-material';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // ProtectedRoute will handle loading
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
          <CardContent sx={{ py: 4 }}>
            <Block sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Erişim Engellendi
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekiyor.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return children;
};

export default AdminRoute;