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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  CardActions,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Add,
  Receipt,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { accountsAPI, creditCardsAPI, transactionsAPI, fixedPaymentsAPI, landPaymentsAPI, installmentPaymentsAPI, formatCurrency, formatDate } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    accountSummary: null,
    creditCardSummary: null,
    monthlySummary: null,
    recentTransactions: [],
    upcomingPayments: [],
    fixedPayments: {
      totalMonthly: 0,
      dueThisMonth: [],
      overdue: []
    },
    landPayments: {
      summary: null,
      upcoming: [],
      overdue: []
    },
    installmentPayments: {
      summary: null,
      upcoming: [],
      overdue: []
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        accountSummaryRes,
        creditCardSummaryRes,
        monthlySummaryRes,
        recentTransactionsRes,
        upcomingPaymentsRes,
        fixedPaymentsTotalRes,
        fixedPaymentsDueRes,
        fixedPaymentsOverdueRes,
        landPaymentsSummaryRes,
        landPaymentsUpcomingRes,
        landPaymentsOverdueRes,
        installmentPaymentsSummaryRes,
        installmentPaymentsUpcomingRes,
        installmentPaymentsOverdueRes,
      ] = await Promise.allSettled([
        accountsAPI.getSummary(),
        creditCardsAPI.getAll(),
        transactionsAPI.getMonthlySummary(),
        transactionsAPI.getRecent({ limit: 5 }),
        creditCardsAPI.getUpcomingPayments({ daysAhead: 7 }),
        fixedPaymentsAPI.getTotalMonthlyAmount(),
        fixedPaymentsAPI.getPaymentsDueThisMonth(),
        fixedPaymentsAPI.getOverduePayments(),
        landPaymentsAPI.getSummary(),
        landPaymentsAPI.getUpcomingPayments({ days_ahead: 30 }),
        landPaymentsAPI.getOverduePayments(),
        installmentPaymentsAPI.getSummary(),
        installmentPaymentsAPI.getUpcomingPayments({ days_ahead: 30 }),
        installmentPaymentsAPI.getOverduePayments(),
      ]);

      setDashboardData({
        accountSummary: accountSummaryRes.status === 'fulfilled' ? accountSummaryRes.value.data.data : null,
        creditCardSummary: creditCardSummaryRes.status === 'fulfilled' ? creditCardSummaryRes.value.data.data : null,
        monthlySummary: monthlySummaryRes.status === 'fulfilled' ? monthlySummaryRes.value.data.data.summary : null,
        recentTransactions: recentTransactionsRes.status === 'fulfilled' ? recentTransactionsRes.value.data.data.transactions : [],
        upcomingPayments: upcomingPaymentsRes.status === 'fulfilled' ? upcomingPaymentsRes.value.data.data.upcomingPayments : [],
        fixedPayments: {
          totalMonthly: fixedPaymentsTotalRes.status === 'fulfilled' ? fixedPaymentsTotalRes.value.data.data.totalAmount : 0,
          dueThisMonth: fixedPaymentsDueRes.status === 'fulfilled' ? fixedPaymentsDueRes.value.data.data : [],
          overdue: fixedPaymentsOverdueRes.status === 'fulfilled' ? fixedPaymentsOverdueRes.value.data.data : []
        },
        landPayments: {
          summary: landPaymentsSummaryRes.status === 'fulfilled' ? landPaymentsSummaryRes.value.data.data : null,
          upcoming: landPaymentsUpcomingRes.status === 'fulfilled' ? landPaymentsUpcomingRes.value.data.data : [],
          overdue: landPaymentsOverdueRes.status === 'fulfilled' ? landPaymentsOverdueRes.value.data.data : []
        },
        installmentPayments: {
          summary: installmentPaymentsSummaryRes.status === 'fulfilled' ? installmentPaymentsSummaryRes.value.data.data : null,
          upcoming: installmentPaymentsUpcomingRes.status === 'fulfilled' ? installmentPaymentsUpcomingRes.value.data.data : [],
          overdue: installmentPaymentsOverdueRes.status === 'fulfilled' ? installmentPaymentsOverdueRes.value.data.data : []
        },
      });
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      showError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCreditCardDebt = () => {
    if (!dashboardData.creditCardSummary?.creditCards) return 0;
    return dashboardData.creditCardSummary.creditCards.reduce((total, card) => total + card.currentBalance, 0);
  };

  const getNetWorth = () => {
    const totalBalance = dashboardData.accountSummary?.totalBalance || 0;
    const totalDebt = calculateTotalCreditCardDebt();
    return totalBalance - totalDebt;
  };

  const getProjectedMonthlyBalance = () => {
    const monthlyIncome = dashboardData.monthlySummary?.income?.total || 0;
    const monthlyExpenses = dashboardData.monthlySummary?.expense?.total || 0;
    const fixedPayments = dashboardData.fixedPayments?.totalMonthly || 0;
    return monthlyIncome - monthlyExpenses - fixedPayments;
  };

  const getFinancialHealthScore = () => {
    const netWorth = getNetWorth();
    const monthlyBalance = getProjectedMonthlyBalance();
    const totalBalance = dashboardData.accountSummary?.totalBalance || 0;
    const totalDebt = calculateTotalCreditCardDebt();
    
    let score = 50; // Base score
    
    // Net worth factor (30 points)
    if (netWorth > 0) {
      score += Math.min(30, (netWorth / 10000) * 10);
    } else {
      score -= Math.min(30, Math.abs(netWorth / 10000) * 10);
    }
    
    // Monthly balance factor (20 points)
    if (monthlyBalance > 0) {
      score += Math.min(20, (monthlyBalance / 1000) * 5);
    } else {
      score -= Math.min(20, Math.abs(monthlyBalance / 1000) * 5);
    }
    
    // Debt to asset ratio factor (20 points)
    if (totalBalance > 0) {
      const debtRatio = totalDebt / totalBalance;
      if (debtRatio < 0.3) score += 20;
      else if (debtRatio < 0.5) score += 10;
      else if (debtRatio < 0.7) score += 5;
      else score -= 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Hoş geldiniz, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Finansal durumunuzun özeti
          </Typography>
        </Box>
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <AccountBalance />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Toplam Bakiye
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {formatCurrency(dashboardData.accountSummary?.totalBalance || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {dashboardData.accountSummary?.activeAccounts || 0} aktif hesap
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                    <CreditCard />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Kredi Kartı Borcu
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" color="error.main">
                  {formatCurrency(calculateTotalCreditCardDebt())}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {dashboardData.creditCardSummary?.creditCards?.length || 0} kredi kartı
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Bu Ay Gelir
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" color="success.main">
                  {formatCurrency(dashboardData.monthlySummary?.income?.total || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {dashboardData.monthlySummary?.income?.count || 0} işlem
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <TrendingDown />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Bu Ay Gider
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" color="warning.main">
                  {formatCurrency(dashboardData.monthlySummary?.expense?.total || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {dashboardData.monthlySummary?.expense?.count || 0} işlem
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Additional Financial Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <Receipt />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Sabit Ödemeler
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" color="info.main">
                  {formatCurrency(dashboardData.fixedPayments?.totalMonthly || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Aylık toplam
                </Typography>
                {dashboardData.fixedPayments?.overdue?.length > 0 && (
                  <Chip
                    label={`${dashboardData.fixedPayments.overdue.length} geciken`}
                    color="error"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: getProjectedMonthlyBalance() >= 0 ? 'success.main' : 'error.main', 
                    mr: 2 
                  }}>
                    {getProjectedMonthlyBalance() >= 0 ? <TrendingUp /> : <TrendingDown />}
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Tahmini Aylık Bakiye
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color={getProjectedMonthlyBalance() >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(getProjectedMonthlyBalance())}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Gelir - Gider - Sabit ödemeler
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: getFinancialHealthScore() >= 70 ? 'success.main' : 
                             getFinancialHealthScore() >= 40 ? 'warning.main' : 'error.main', 
                    mr: 2 
                  }}>
                    {getFinancialHealthScore() >= 70 ? <CheckCircle /> : 
                     getFinancialHealthScore() >= 40 ? <Warning /> : <TrendingDown />}
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Finansal Sağlık
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color={getFinancialHealthScore() >= 70 ? 'success.main' : 
                         getFinancialHealthScore() >= 40 ? 'warning.main' : 'error.main'}
                >
                  {getFinancialHealthScore()}/100
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {getFinancialHealthScore() >= 70 ? 'Mükemmel' : 
                   getFinancialHealthScore() >= 40 ? 'Orta' : 'Dikkat gerekli'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: calculateTotalCreditCardDebt() === 0 ? 'success.main' : 'warning.main', 
                    mr: 2 
                  }}>
                    <CreditCard />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Borç/Varlık Oranı
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color={calculateTotalCreditCardDebt() === 0 ? 'success.main' : 'warning.main'}
                >
                  {dashboardData.accountSummary?.totalBalance > 0 
                    ? `%${Math.round((calculateTotalCreditCardDebt() / dashboardData.accountSummary.totalBalance) * 100)}`
                    : '-%'
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {calculateTotalCreditCardDebt() === 0 ? 'Borç yok' : 'Borç/Varlık'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Net Worth Card */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Net Değer
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  color={getNetWorth() >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(getNetWorth())}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Toplam varlık - Toplam borç
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bu Ay Net Gelir
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  color={dashboardData.monthlySummary?.netIncome >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(dashboardData.monthlySummary?.netIncome || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Gelir - Gider
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Transactions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Son İşlemler
                </Typography>
                {dashboardData.recentTransactions.length > 0 ? (
                  <List>
                    {dashboardData.recentTransactions.map((transaction) => (
                      <ListItem key={transaction.id} divider>
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: transaction.type === 'income' ? 'success.main' : 
                                      transaction.type === 'expense' ? 'error.main' : 'primary.main',
                              width: 32,
                              height: 32
                            }}
                          >
                            <Receipt fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={transaction.description}
                          secondary={`${formatDate(transaction.transactionDate)} • ${transaction.category || 'Kategori yok'}`}
                        />
                        <Typography 
                          variant="body2" 
                          color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                    Henüz işlem yok
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate('/transactions')}
                  startIcon={<Receipt />}
                >
                  Tüm İşlemleri Gör
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Upcoming Payments */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yaklaşan Ödemeler
                </Typography>
                {dashboardData.upcomingPayments.length > 0 ? (
                  <List>
                    {dashboardData.upcomingPayments.map((payment) => (
                      <ListItem key={payment.creditCardId} divider>
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: payment.isOverdue ? 'error.main' : 
                                      payment.daysUntil <= 3 ? 'warning.main' : 'primary.main',
                              width: 32,
                              height: 32
                            }}
                          >
                            {payment.isOverdue ? <Warning fontSize="small" /> : <CreditCard fontSize="small" />}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={payment.creditCardName}
                          secondary={`Min. ödeme: ${formatCurrency(payment.minimumPayment)}`}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={payment.isOverdue ? 'Gecikmiş' : `${payment.daysUntil} gün`}
                            color={payment.isOverdue ? 'error' : payment.daysUntil <= 3 ? 'warning' : 'primary'}
                            size="small"
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      Yaklaşan ödeme yok
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate('/credit-cards')}
                  startIcon={<CreditCard />}
                >
                  Kredi Kartlarını Yönet
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Fixed Payments */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sabit Ödemeler
                </Typography>
                {(dashboardData.fixedPayments?.overdue?.length > 0 || dashboardData.fixedPayments?.dueThisMonth?.length > 0) ? (
                  <List>
                    {/* Overdue payments first */}
                    {dashboardData.fixedPayments.overdue.map((payment) => (
                      <ListItem key={`overdue-${payment.id}`} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                            <Warning fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={payment.name}
                          secondary={`${payment.category || 'Kategori yok'} • ${payment.dueDay}. gün`}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="error.main" fontWeight="bold">
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Chip label="Gecikmiş" color="error" size="small" />
                        </Box>
                      </ListItem>
                    ))}
                    
                    {/* Due this month */}
                    {dashboardData.fixedPayments.dueThisMonth.slice(0, 3).map((payment) => (
                      <ListItem key={`due-${payment.id}`} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                            <Receipt fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={payment.name}
                          secondary={`${payment.category || 'Kategori yok'} • ${payment.dueDay}. gün`}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="info.main" fontWeight="bold">
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <Chip label="Bu ay" color="info" size="small" />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Receipt color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      Sabit ödeme tanımlanmamış
                    </Typography>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate('/fixed-payments')}
                  startIcon={<Receipt />}
                >
                  Sabit Ödemeleri Yönet
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Hızlı İşlemler
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/accounts')}
                sx={{ py: 2 }}
              >
                Hesap Ekle
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/credit-cards')}
                sx={{ py: 2 }}
              >
                Kredi Kartı Ekle
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/transactions')}
                sx={{ py: 2 }}
              >
                İşlem Ekle
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/fixed-payments')}
                sx={{ py: 2 }}
              >
                Sabit Ödeme Ekle
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/land-payments')}
                sx={{ py: 2 }}
              >
                Arsa Ekle
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/installment-payments')}
                sx={{ py: 2 }}
              >
                Taksit Ekle
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Receipt />}
                onClick={() => navigate('/reports')}
                sx={{ py: 2 }}
              >
                Raporları Gör
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;