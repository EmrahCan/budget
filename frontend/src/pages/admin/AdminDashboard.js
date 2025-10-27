import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  People,
  AccountBalance,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  PersonAdd,
  Assessment,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { adminAPI, formatCurrency, handleApiError } from '../../services/api';

const AdminDashboard = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Sistem genel bakışı ve istatistikler
        </Typography>

        {stats && (
          <Grid container spacing={3}>
            {/* User Statistics */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <People />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Kullanıcı
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div">
                    {stats.users.total}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {stats.users.active} aktif kullanıcı
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <PersonAdd />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Yeni Kayıtlar
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div">
                    {stats.users.recentRegistrations}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Son 30 gün
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Statistics */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <AccountBalance />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Hesap
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div">
                    {stats.accounts.total}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(stats.accounts.totalBalance)} toplam bakiye
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                      <CreditCard />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Kredi Kartları
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div">
                    {stats.creditCards.total}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(stats.creditCards.totalDebt)} toplam borç
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Transaction Statistics */}
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <Receipt />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam İşlem
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div">
                    {stats.transactions.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tüm zamanlar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <Assessment />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Aylık İşlem
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="div">
                    {stats.transactions.monthly}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Son 30 gün
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Net Worth */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sistem Net Değeri
                  </Typography>
                  <Typography 
                    variant="h2" 
                    component="div" 
                    color={stats.accounts.totalBalance - stats.creditCards.totalDebt >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(stats.accounts.totalBalance - stats.creditCards.totalDebt)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Toplam varlık - Toplam borç
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Activity Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sistem Aktivitesi
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                        <TrendingUp />
                      </Avatar>
                      <Typography variant="h6">{stats.users.active}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Aktif Kullanıcı
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                        <TrendingDown />
                      </Avatar>
                      <Typography variant="h6">{stats.users.total - stats.users.active}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Pasif Kullanıcı
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default AdminDashboard;