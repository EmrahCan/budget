import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Container,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  useMediaQuery,
  useTheme,
  Paper,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Add,
  Receipt,
  Schedule,
  Assessment,
  Wallet,
  Savings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { accountsAPI, creditCardsAPI, transactionsAPI, fixedPaymentsAPI, installmentPaymentsAPI, formatCurrency } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DashboardClean = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    accounts: [],
    creditCards: [],
    recentTransactions: [],
    fixedPayments: [],
    installmentPayments: [],
    totalBalance: 0,
    totalCreditDebt: 0,
    monthlyFixedPayments: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [accountsRes, creditCardsRes, transactionsRes, fixedPaymentsRes, installmentPaymentsRes] = await Promise.allSettled([
        accountsAPI.getAll(),
        creditCardsAPI.getAll(),
        transactionsAPI.getRecent({ limit: 5 }),
        fixedPaymentsAPI.getAll(),
        installmentPaymentsAPI.getAll(),
      ]);

      // Log any failed requests for debugging
      if (accountsRes.status === 'rejected') console.error('Accounts API failed:', accountsRes.reason);
      if (creditCardsRes.status === 'rejected') console.error('Credit Cards API failed:', creditCardsRes.reason);
      if (transactionsRes.status === 'rejected') console.error('Transactions API failed:', transactionsRes.reason);
      if (fixedPaymentsRes.status === 'rejected') console.error('Fixed Payments API failed:', fixedPaymentsRes.reason);
      if (installmentPaymentsRes.status === 'rejected') console.error('Installment Payments API failed:', installmentPaymentsRes.reason);

      // Safely extract data from API responses
      const accounts = accountsRes.status === 'fulfilled' ? 
        (accountsRes.value.data.data?.accounts || []) : [];
      
      const creditCards = creditCardsRes.status === 'fulfilled' ? 
        (creditCardsRes.value.data.data?.creditCards || []) : [];
      
      const transactions = transactionsRes.status === 'fulfilled' ? 
        (transactionsRes.value.data.data?.transactions || []) : [];
      
      const fixedPayments = fixedPaymentsRes.status === 'fulfilled' ? 
        (Array.isArray(fixedPaymentsRes.value.data.data) ? fixedPaymentsRes.value.data.data : 
         Array.isArray(fixedPaymentsRes.value.data) ? fixedPaymentsRes.value.data : []) : [];
      
      const installmentPayments = installmentPaymentsRes.status === 'fulfilled' ? 
        (installmentPaymentsRes.value.data.data || []) : [];
      
      // Debug installment payments response
      console.log('Installment Payments Response:', {
        status: installmentPaymentsRes.status,
        rawData: installmentPaymentsRes.status === 'fulfilled' ? installmentPaymentsRes.value.data : null,
        parsedData: installmentPayments
      });
      
      // Debug logging
      console.log('Dashboard data loaded:', {
        accounts: accounts.length,
        creditCards: creditCards.length,
        transactions: transactions.length,
        fixedPayments: fixedPayments.length,
        installmentPayments: installmentPayments.length,
        fixedPaymentsType: typeof fixedPayments,
        fixedPaymentsIsArray: Array.isArray(fixedPayments)
      });

      const totalBalance = Array.isArray(accounts) ? 
        accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0) : 0;
      
      const totalCreditDebt = Array.isArray(creditCards) ? 
        creditCards.reduce((sum, card) => sum + (card.currentBalance || 0), 0) : 0;
      
      // Aylık sabit ödemeler = Sabit ödemeler + Taksitli ödemelerin aylık tutarları
      const fixedPaymentsTotal = Array.isArray(fixedPayments) ? 
        fixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) : 0;
      
      const installmentPaymentsTotal = Array.isArray(installmentPayments) ? 
        installmentPayments.reduce((sum, payment) => sum + (payment.installmentAmount || 0), 0) : 0;
      
      const monthlyFixedPayments = fixedPaymentsTotal + installmentPaymentsTotal;

      // Debug hesaplama
      console.log('Payment calculations:', {
        fixedPayments: fixedPayments.map(p => ({ name: p.name, amount: p.amount })),
        installmentPayments: installmentPayments.map(p => ({ itemName: p.itemName, installmentAmount: p.installmentAmount })),
        fixedPaymentsTotal,
        installmentPaymentsTotal,
        monthlyFixedPayments
      });

      const newDashboardData = {
        accounts,
        creditCards,
        recentTransactions: transactions,
        fixedPayments,
        installmentPayments,
        totalBalance,
        totalCreditDebt,
        monthlyFixedPayments,
        lastUpdated: Date.now(), // Force re-render
      };

      console.log('Setting dashboard data:', newDashboardData);
      setDashboardData(newDashboardData);
    } catch (error) {
      console.error('Dashboard loading error:', error);
      showError('Dashboard verileri yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Hesaplar',
      icon: <AccountBalance />,
      color: 'primary',
      onClick: () => navigate('/accounts'),
      count: dashboardData.accounts.length,
    },
    {
      title: 'Kredi Kartları',
      icon: <CreditCard />,
      color: 'secondary',
      onClick: () => navigate('/credit-cards'),
      count: dashboardData.creditCards.length,
    },
    {
      title: 'Sabit Ödemeler',
      icon: <Schedule />,
      color: 'warning',
      onClick: () => navigate('/fixed-payments'),
      count: dashboardData.fixedPayments.length,
    },
    {
      title: 'Esnek Hesaplar',
      icon: <Savings />,
      color: 'success',
      onClick: () => navigate('/overdrafts'),
      count: dashboardData.accounts.filter(acc => acc.type === 'overdraft').length,
    },
  ];

  const summaryCards = [
    {
      title: 'Toplam Bakiye',
      value: formatCurrency(dashboardData.totalBalance),
      icon: <Wallet />,
      color: dashboardData.totalBalance >= 0 ? 'success' : 'error',
      trend: dashboardData.totalBalance >= 0 ? 'up' : 'down',
    },
    {
      title: 'Kredi Kartı Borcu',
      value: formatCurrency(dashboardData.totalCreditDebt),
      icon: <CreditCard />,
      color: 'error',
      trend: 'down',
    },
    {
      title: 'Aylık Sabit Ödemeler',
      value: formatCurrency(dashboardData.monthlyFixedPayments),
      icon: <Schedule />,
      color: 'warning',
      trend: 'neutral',
    },
    {
      title: 'Net Durum',
      value: formatCurrency(dashboardData.totalBalance - dashboardData.totalCreditDebt),
      icon: <Assessment />,
      color: (dashboardData.totalBalance - dashboardData.totalCreditDebt) >= 0 ? 'success' : 'error',
      trend: (dashboardData.totalBalance - dashboardData.totalCreditDebt) >= 0 ? 'up' : 'down',
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard Yükleniyor...
          </Typography>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      <Typography variant="h6">Yükleniyor...</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Hoş Geldiniz, {user?.firstName || 'Kullanıcı'}! 👋
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Finansal durumunuzun özeti
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {summaryCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${card.color}.main`, 
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        {card.title}
                      </Typography>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        {card.value}
                      </Typography>
                    </Box>
                    {card.trend === 'up' && <TrendingUp color="success" />}
                    {card.trend === 'down' && <TrendingDown color="error" />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Hızlı İşlemler
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={action.icon}
                  onClick={action.onClick}
                  sx={{
                    py: 2,
                    flexDirection: 'column',
                    gap: 1,
                    borderColor: `${action.color}.main`,
                    color: `${action.color}.main`,
                    '&:hover': {
                      bgcolor: `${action.color}.50`,
                      borderColor: `${action.color}.main`,
                    }
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {action.count} adet
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Recent Activity */}
        <Grid container spacing={3}>
          {/* Recent Transactions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Son İşlemler
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/transactions')}
                    endIcon={<Receipt />}
                  >
                    Tümünü Gör
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {dashboardData.recentTransactions.length > 0 ? (
                  dashboardData.recentTransactions.map((transaction, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.description || 'İşlem'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {transaction.category || 'Kategori'}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                      >
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount || 0))}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                    Henüz işlem bulunmuyor
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Fixed Payments */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Yaklaşan Sabit Ödemeler
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/fixed-payments')}
                    endIcon={<Schedule />}
                  >
                    Tümünü Gör
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {dashboardData.fixedPayments.length > 0 ? (
                  dashboardData.fixedPayments.slice(0, 5).map((payment, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {payment.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Her ay {payment.dueDay}. günü
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                    Henüz sabit ödeme bulunmuyor
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Add Button */}
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate('/transactions')}
            sx={{
              borderRadius: 8,
              px: 3,
              py: 1.5,
              boxShadow: theme.shadows[8],
            }}
          >
            Hızlı İşlem
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardClean;