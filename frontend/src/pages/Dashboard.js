import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
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
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  IconButton,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Fab,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
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
  SwipeLeft,
  SwipeRight,
  Menu as MenuIcon,
  MoreVert,
  Fullscreen,
  Close,
  Settings,
  Refresh,
  Launch,
  FilterList,
  DateRange,
  PieChart,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { accountsAPI, creditCardsAPI, transactionsAPI, fixedPaymentsAPI, installmentPaymentsAPI, formatCurrency, formatDate } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Error boundary for widget error handling
import ErrorBoundary from '../components/ErrorBoundary';

// Interactive components
import InteractiveWidget from '../components/InteractiveWidget';
import QuickActionsFab from '../components/QuickActionsFab';

// Loading skeletons
import {
  DashboardCardSkeleton,
  TransactionListSkeleton,
  PaymentCalendarSkeleton,
  FinancialMetricsSkeleton,
  BudgetComparisonSkeleton,
  ExpenseCategorySkeleton,
  FinancialTrendSkeleton
} from '../components/LoadingSkeleton';

// Lazy load chart components for better performance
const PaymentCalendarWidget = lazy(() => import('../components/charts/PaymentCalendarWidget'));
const ExpenseCategoryChart = lazy(() => import('../components/charts/ExpenseCategoryChart'));
const FinancialTrendChart = lazy(() => import('../components/charts/FinancialTrendChart'));
const BudgetComparisonWidget = lazy(() => import('../components/charts/BudgetComparisonWidget'));
const FinancialMetricsWidget = lazy(() => import('../components/charts/FinancialMetricsWidget'));

const Dashboard = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
    installmentPayments: {
      summary: null,
      upcoming: [],
      overdue: []
    },
    // Yeni widget verileri
    chartData: {
      categoryExpenses: [],
      financialTrends: [],
      calendarPayments: []
    },
    budgetTargets: {},
    metricsData: {}
  });
  
  // Widget loading state'leri
  const [widgetLoading, setWidgetLoading] = useState({
    calendar: false,
    categoryChart: false,
    trendChart: false,
    budgetWidget: false,
    metricsWidget: false
  });

  // Error state'leri
  const [errors, setErrors] = useState({
    dashboard: null,
    calendar: null,
    categoryChart: null,
    trendChart: null,
    budgetWidget: null,
    metricsWidget: null
  });

  // Retry counters
  const [retryCount, setRetryCount] = useState({
    dashboard: 0,
    calendar: 0,
    categoryChart: 0,
    trendChart: 0,
    budgetWidget: 0,
    metricsWidget: 0
  });
  
  // Mobil widget navigation
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Widget etkileşimleri
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [widgetDetailOpen, setWidgetDetailOpen] = useState(false);
  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [widgetMenuAnchor, setWidgetMenuAnchor] = useState(null);
  const [fullscreenWidget, setFullscreenWidget] = useState(null);

  // Memoized hesaplama fonksiyonları (performans optimizasyonu)
  const calculateTotalCreditCardDebt = useMemo(() => {
    if (!dashboardData.creditCardSummary?.creditCards) return 0;
    return dashboardData.creditCardSummary.creditCards.reduce((total, card) => total + (card.currentBalance || 0), 0);
  }, [dashboardData.creditCardSummary?.creditCards]);

  const getNetWorth = useMemo(() => {
    const totalBalance = dashboardData.accountSummary?.totalBalance || 0;
    const totalDebt = calculateTotalCreditCardDebt;
    return totalBalance - totalDebt;
  }, [dashboardData.accountSummary?.totalBalance, calculateTotalCreditCardDebt]);

  const getProjectedMonthlyBalance = useMemo(() => {
    const monthlyIncome = dashboardData.monthlySummary?.income?.total || 0;
    const monthlyExpenses = dashboardData.monthlySummary?.expense?.total || 0;
    const fixedPayments = dashboardData.fixedPayments?.totalMonthly || 0;
    return monthlyIncome - monthlyExpenses - fixedPayments;
  }, [
    dashboardData.monthlySummary?.income?.total,
    dashboardData.monthlySummary?.expense?.total,
    dashboardData.fixedPayments?.totalMonthly
  ]);

  const getFinancialHealthScore = useMemo(() => {
    const netWorth = getNetWorth;
    const monthlyBalance = getProjectedMonthlyBalance;
    const totalBalance = dashboardData.accountSummary?.totalBalance || 0;
    const totalDebt = calculateTotalCreditCardDebt;
    
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
  }, [getNetWorth, getProjectedMonthlyBalance, dashboardData.accountSummary?.totalBalance, calculateTotalCreditCardDebt]);

  // Memoized widget data processing
  const processedBudgetData = useMemo(() => {
    return dashboardData.chartData.categoryExpenses.reduce((acc, item) => {
      acc[item.category] = item.amount;
      return acc;
    }, {});
  }, [dashboardData.chartData.categoryExpenses]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setErrors(prev => ({ ...prev, dashboard: null }));
      
      const [
        accountSummaryRes,
        creditCardSummaryRes,
        monthlySummaryRes,
        recentTransactionsRes,
        upcomingPaymentsRes,
        fixedPaymentsTotalRes,
        fixedPaymentsDueRes,
        fixedPaymentsOverdueRes,
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
        installmentPaymentsAPI.getSummary(),
        installmentPaymentsAPI.getUpcomingPayments({ days_ahead: 30 }),
        installmentPaymentsAPI.getOverduePayments(),
      ]);

      // Check for critical failures
      const criticalFailures = [
        accountSummaryRes,
        monthlySummaryRes
      ].filter(res => res.status === 'rejected');

      if (criticalFailures.length > 0) {
        throw new Error('Kritik veriler yüklenemedi');
      }

      setDashboardData(prevData => ({
        ...prevData,
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
        installmentPayments: {
          summary: installmentPaymentsSummaryRes.status === 'fulfilled' ? installmentPaymentsSummaryRes.value.data.data : null,
          upcoming: installmentPaymentsUpcomingRes.status === 'fulfilled' ? installmentPaymentsUpcomingRes.value.data.data : [],
          overdue: installmentPaymentsOverdueRes.status === 'fulfilled' ? installmentPaymentsOverdueRes.value.data.data : []
        },
      }));

      // Reset retry count on success
      setRetryCount(prev => ({ ...prev, dashboard: 0 }));
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      const errorMessage = error.message || 'Dashboard verileri yüklenirken hata oluştu';
      
      setErrors(prev => ({ ...prev, dashboard: errorMessage }));
      setRetryCount(prev => ({ ...prev, dashboard: prev.dashboard + 1 }));
      
      // Show error notification only on first failure or after multiple retries
      if (retryCount.dashboard === 0 || retryCount.dashboard >= 3) {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [showError, retryCount.dashboard]);

  // useEffect to load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Cancel any pending API requests if needed
      setLoading(false);
      setWidgetLoading({
        calendar: false,
        categoryChart: false,
        trendChart: false,
        budgetWidget: false,
        metricsWidget: false
      });
    };
  }, [loadDashboardData]);

  // Widget verilerini yükle (memoized)
  const loadChartData = useCallback(async () => {
    try {
      setWidgetLoading(prev => ({ ...prev, categoryChart: true, trendChart: true }));
      setErrors(prev => ({ ...prev, categoryChart: null, trendChart: null }));
      
      // Kategori bazlı harcama verileri
      const categoryExpensesRes = await transactionsAPI.getCategoryExpenses();
      
      // Finansal trend verileri (son 6 ay)
      const trendRes = await transactionsAPI.getFinancialTrend({ months: 6 });
      
      setDashboardData(prev => ({
        ...prev,
        chartData: {
          ...prev.chartData,
          categoryExpenses: categoryExpensesRes.data?.data || [],
          financialTrends: trendRes.data?.data || []
        }
      }));

      // Reset retry counts on success
      setRetryCount(prev => ({ ...prev, categoryChart: 0, trendChart: 0 }));
    } catch (error) {
      console.error('Chart data loading error:', error);
      const errorMessage = 'Grafik verileri yüklenirken hata oluştu';
      
      setErrors(prev => ({ 
        ...prev, 
        categoryChart: errorMessage,
        trendChart: errorMessage
      }));
      setRetryCount(prev => ({ 
        ...prev, 
        categoryChart: prev.categoryChart + 1,
        trendChart: prev.trendChart + 1
      }));
    } finally {
      setWidgetLoading(prev => ({ ...prev, categoryChart: false, trendChart: false }));
    }
  }, []);

  // Ödeme takvimi verilerini yükle (memoized)
  const loadCalendarData = useCallback(async () => {
    try {
      setWidgetLoading(prev => ({ ...prev, calendar: true }));
      setErrors(prev => ({ ...prev, calendar: null }));
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Bu ayın sabit ödemelerini al
      const fixedPaymentsRes = await fixedPaymentsAPI.getAll();
      const calendarPayments = fixedPaymentsRes.data?.data || fixedPaymentsRes.data || [];
      
      setDashboardData(prev => ({
        ...prev,
        chartData: {
          ...prev.chartData,
          calendarPayments
        }
      }));

      // Reset retry count on success
      setRetryCount(prev => ({ ...prev, calendar: 0 }));
    } catch (error) {
      console.error('Calendar data loading error:', error);
      const errorMessage = 'Takvim verileri yüklenirken hata oluştu';
      
      setErrors(prev => ({ ...prev, calendar: errorMessage }));
      setRetryCount(prev => ({ ...prev, calendar: prev.calendar + 1 }));
    } finally {
      setWidgetLoading(prev => ({ ...prev, calendar: false }));
    }
  }, []);

  // Finansal metrikler verilerini hesapla (memoized)
  const loadMetricsData = useCallback(async () => {
    try {
      setWidgetLoading(prev => ({ ...prev, metricsWidget: true }));
      setErrors(prev => ({ ...prev, metricsWidget: null }));
      
      const totalIncome = dashboardData.monthlySummary?.income?.total || 0;
      const totalExpense = dashboardData.monthlySummary?.expense?.total || 0;
      const totalDebt = calculateTotalCreditCardDebt;
      const totalAssets = dashboardData.accountSummary?.totalBalance || 0;
      const monthlyIncome = totalIncome;
      const emergencyFund = totalAssets * 0.1; // Basit hesaplama
      
      setDashboardData(prev => ({
        ...prev,
        metricsData: {
          totalIncome,
          totalExpense,
          totalDebt,
          totalAssets,
          monthlyIncome,
          emergencyFund
        }
      }));

      // Reset retry count on success
      setRetryCount(prev => ({ ...prev, metricsWidget: 0 }));
    } catch (error) {
      console.error('Metrics data loading error:', error);
      const errorMessage = 'Metrik verileri hesaplanırken hata oluştu';
      
      setErrors(prev => ({ ...prev, metricsWidget: errorMessage }));
      setRetryCount(prev => ({ ...prev, metricsWidget: prev.metricsWidget + 1 }));
    } finally {
      setWidgetLoading(prev => ({ ...prev, metricsWidget: false }));
    }
  }, [dashboardData.monthlySummary, dashboardData.accountSummary, calculateTotalCreditCardDebt]);

  // Retry fonksiyonları
  const retryDashboardLoad = useCallback(() => {
    if (retryCount.dashboard < 3) {
      loadDashboardData();
    }
  }, [loadDashboardData, retryCount.dashboard]);

  const retryWidgetLoad = useCallback((widgetType) => {
    switch (widgetType) {
      case 'calendar':
        if (retryCount.calendar < 3) loadCalendarData();
        break;
      case 'categoryChart':
      case 'trendChart':
        if (retryCount.categoryChart < 3) loadChartData();
        break;
      case 'metricsWidget':
        if (retryCount.metricsWidget < 3) loadMetricsData();
        break;
      default:
        break;
    }
  }, [loadCalendarData, loadChartData, loadMetricsData, retryCount]);

  // Bütçe hedefi güncelleme (memoized)
  const handleBudgetUpdate = useCallback((category, amount) => {
    setDashboardData(prev => ({
      ...prev,
      budgetTargets: {
        ...prev.budgetTargets,
        [category]: amount
      }
    }));
    
    // Burada API çağrısı yapılabilir
    console.log('Budget updated:', category, amount);
  }, []);

  // Kategori tıklama handler'ı (memoized)
  const handleCategoryClick = useCallback((category) => {
    navigate('/transactions', { state: { filterCategory: category } });
  }, [navigate]);

  // Widget etkileşim fonksiyonları
  const handleWidgetClick = useCallback((widgetType, data = null) => {
    switch (widgetType) {
      case 'calendar':
        navigate('/calendar');
        break;
      case 'categoryChart':
        navigate('/transactions', { state: { groupBy: 'category' } });
        break;
      case 'trendChart':
        navigate('/reports', { state: { activeTab: 1 } });
        break;
      case 'budgetWidget':
        navigate('/budget');
        break;
      case 'metricsWidget':
        navigate('/reports', { state: { activeTab: 0 } });
        break;
      case 'paymentDetail':
        if (data?.paymentId) {
          navigate('/fixed-payments', { state: { highlightId: data.paymentId } });
        }
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleWidgetFullscreen = useCallback((widgetType) => {
    setFullscreenWidget(widgetType);
  }, []);

  const handleWidgetSettings = useCallback((widgetType) => {
    setSelectedWidget(widgetType);
    setWidgetSettingsOpen(true);
  }, []);

  const handleWidgetMenu = useCallback((event, widgetType) => {
    event.stopPropagation();
    setWidgetMenuAnchor(event.currentTarget);
    setSelectedWidget(widgetType);
  }, []);

  const handleCloseWidgetMenu = useCallback(() => {
    setWidgetMenuAnchor(null);
    setSelectedWidget(null);
  }, []);

  const handleQuickAction = useCallback((action, data = null) => {
    switch (action) {
      case 'addTransaction':
        navigate('/transactions', { state: { openDialog: true } });
        break;
      case 'addAccount':
        navigate('/accounts', { state: { openDialog: true } });
        break;
      case 'addCreditCard':
        navigate('/credit-cards', { state: { openDialog: true } });
        break;
      case 'addFixedPayment':
        navigate('/fixed-payments', { state: { openDialog: true } });
        break;
      case 'addInstallment':
        navigate('/installment-payments', { state: { openDialog: true } });
        break;
      case 'viewReports':
        navigate('/reports');
        break;
      case 'viewCalendar':
        navigate('/calendar');
        break;
      default:
        break;
    }
    setQuickActionsOpen(false);
  }, [navigate]);

  // Widget verilerini yükle (dependency optimization)
  useEffect(() => {
    if (!loading && dashboardData.monthlySummary) {
      loadChartData();
      loadCalendarData();
      loadMetricsData();
    }
  }, [loading, dashboardData.monthlySummary, loadChartData, loadCalendarData, loadMetricsData]);

  // Mobil widget'lar listesi (memoized for performance)
  const mobileWidgets = useMemo(() => [
    {
      id: 'calendar',
      title: 'Ödeme Takvimi',
      component: (
        <PaymentCalendarWidget
          payments={dashboardData.chartData.calendarPayments}
          loading={widgetLoading.calendar}
        />
      )
    },
    {
      id: 'categoryChart',
      title: 'Kategori Harcamaları',
      component: (
        <ExpenseCategoryChart
          categoryData={dashboardData.chartData.categoryExpenses}
          loading={widgetLoading.categoryChart}
          onCategoryClick={handleCategoryClick}
        />
      )
    },
    {
      id: 'budgetWidget',
      title: 'Bütçe Performansı',
      component: (
        <BudgetComparisonWidget
          budgetData={dashboardData.budgetTargets}
          actualData={processedBudgetData}
          loading={widgetLoading.budgetWidget}
          onBudgetUpdate={handleBudgetUpdate}
        />
      )
    },
    {
      id: 'trendChart',
      title: 'Finansal Trend',
      component: (
        <FinancialTrendChart
          trendData={dashboardData.chartData.financialTrends}
          loading={widgetLoading.trendChart}
        />
      )
    },
    {
      id: 'metricsWidget',
      title: 'Finansal Metrikler',
      component: (
        <FinancialMetricsWidget
          metricsData={dashboardData.metricsData}
          loading={widgetLoading.metricsWidget}
        />
      )
    }
  ], [
    dashboardData.chartData.calendarPayments,
    dashboardData.chartData.categoryExpenses,
    dashboardData.chartData.financialTrends,
    dashboardData.budgetTargets,
    dashboardData.metricsData,
    processedBudgetData,
    widgetLoading,
    handleCategoryClick,
    handleBudgetUpdate
  ]);

  // Touch gesture handlers (memoized)
  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentWidgetIndex < mobileWidgets.length - 1) {
      setCurrentWidgetIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentWidgetIndex > 0) {
      setCurrentWidgetIndex(prev => prev - 1);
    }
  }, [touchStart, touchEnd, currentWidgetIndex, mobileWidgets.length]);

  // Widget navigation (memoized)
  const handlePrevWidget = useCallback(() => {
    setCurrentWidgetIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextWidget = useCallback(() => {
    setCurrentWidgetIndex(prev => Math.min(mobileWidgets.length - 1, prev + 1));
  }, [mobileWidgets.length]);



  if (loading) {
    return (
      <Container maxWidth={isMobile ? 'sm' : 'xl'}>
        <Box sx={{ py: isMobile ? 2 : 3 }}>
          {/* Header Skeleton */}
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
          
          {/* Summary Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} md={3} key={index}>
                <DashboardCardSkeleton />
              </Grid>
            ))}
          </Grid>

          {/* Additional Metrics Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} md={3} key={index}>
                <DashboardCardSkeleton />
              </Grid>
            ))}
          </Grid>

          {/* Net Worth Cards Skeleton */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <DashboardCardSkeleton height={150} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DashboardCardSkeleton height={150} />
            </Grid>
          </Grid>

          {/* Widget Skeletons */}
          {isMobile ? (
            <Box sx={{ mt: 3 }}>
              <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
              <PaymentCalendarSkeleton />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6} lg={4}>
                <PaymentCalendarSkeleton />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <ExpenseCategorySkeleton />
              </Grid>
              <Grid item xs={12} md={6} lg={4}>
                <BudgetComparisonSkeleton />
              </Grid>
              <Grid item xs={12} lg={8}>
                <FinancialTrendSkeleton />
              </Grid>
              <Grid item xs={12} lg={4}>
                <FinancialMetricsSkeleton />
              </Grid>
            </Grid>
          )}

          {/* Transaction Lists Skeleton */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <TransactionListSkeleton />
            </Grid>
            <Grid item xs={12} md={6}>
              <TransactionListSkeleton />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  // Dashboard error state
  if (errors.dashboard && retryCount.dashboard >= 3) {
    return (
      <Container maxWidth={isMobile ? 'sm' : 'xl'}>
        <Box sx={{ py: isMobile ? 2 : 3 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={retryDashboardLoad}>
                Tekrar Dene
              </Button>
            }
            sx={{ mb: 3 }}
          >
            {errors.dashboard}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={isMobile ? 'sm' : 'xl'}>
      <Box sx={{ py: isMobile ? 2 : 3 }}>
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
                  {formatCurrency(calculateTotalCreditCardDebt)}
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
                    bgcolor: getProjectedMonthlyBalance >= 0 ? 'success.main' : 'error.main', 
                    mr: 2 
                  }}>
                    {getProjectedMonthlyBalance >= 0 ? <TrendingUp /> : <TrendingDown />}
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Tahmini Aylık Bakiye
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color={getProjectedMonthlyBalance >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(getProjectedMonthlyBalance)}
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
                    bgcolor: getFinancialHealthScore >= 70 ? 'success.main' : 
                             getFinancialHealthScore >= 40 ? 'warning.main' : 'error.main', 
                    mr: 2 
                  }}>
                    {getFinancialHealthScore >= 70 ? <CheckCircle /> : 
                     getFinancialHealthScore >= 40 ? <Warning /> : <TrendingDown />}
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Finansal Sağlık
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  component="div" 
                  color={getFinancialHealthScore >= 70 ? 'success.main' : 
                         getFinancialHealthScore >= 40 ? 'warning.main' : 'error.main'}
                >
                  {getFinancialHealthScore}/100
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {getFinancialHealthScore >= 70 ? 'Mükemmel' : 
                   getFinancialHealthScore >= 40 ? 'Orta' : 'Dikkat gerekli'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: calculateTotalCreditCardDebt === 0 ? 'success.main' : 'warning.main', 
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
                  color={calculateTotalCreditCardDebt === 0 ? 'success.main' : 'warning.main'}
                >
                  {dashboardData.accountSummary?.totalBalance > 0 
                    ? `%${Math.round((calculateTotalCreditCardDebt / dashboardData.accountSummary.totalBalance) * 100)}`
                    : '-%'
                  }
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {calculateTotalCreditCardDebt === 0 ? 'Borç yok' : 'Borç/Varlık'}
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
                  color={getNetWorth >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(getNetWorth)}
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

        {/* New Dashboard Widgets */}
        {isMobile ? (
          /* Mobil Widget Carousel */
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Grafikler ve Analizler
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={handlePrevWidget}
                  disabled={currentWidgetIndex === 0}
                >
                  <SwipeLeft />
                </IconButton>
                <Typography variant="body2" color="textSecondary">
                  {currentWidgetIndex + 1} / {mobileWidgets.length}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleNextWidget}
                  disabled={currentWidgetIndex === mobileWidgets.length - 1}
                >
                  <SwipeRight />
                </IconButton>
              </Box>
            </Box>
            
            <Box
              sx={{ 
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Box
                sx={{
                  display: 'flex',
                  transform: `translateX(-${currentWidgetIndex * 100}%)`,
                  transition: 'transform 0.3s ease-in-out',
                  width: `${mobileWidgets.length * 100}%`
                }}
              >
                {mobileWidgets.map((widget, index) => (
                  <Box key={widget.id} sx={{ width: '100%', flexShrink: 0 }}>
                    <ErrorBoundary title={`${widget.title} Hatası`}>
                      <Suspense fallback={
                        <Card>
                          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                          </CardContent>
                        </Card>
                      }>
                        {widget.component}
                      </Suspense>
                    </ErrorBoundary>
                  </Box>
                ))}
              </Box>
            </Box>
            
            {/* Widget Indicators */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              {mobileWidgets.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: index === currentWidgetIndex ? 'primary.main' : 'grey.300',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => setCurrentWidgetIndex(index)}
                />
              ))}
            </Box>
          </Box>
        ) : (
          /* Desktop Widget Grid */
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Payment Calendar Widget */}
            <Grid item xs={12} md={6} lg={4}>
              {errors.calendar && retryCount.calendar >= 3 ? (
                <InteractiveWidget
                  title="Ödeme Takvimi"
                  error={errors.calendar}
                  onRefresh={() => retryWidgetLoad('calendar')}
                  showMenu={false}
                />
              ) : (
                <InteractiveWidget
                  title="Ödeme Takvimi"
                  onNavigate={() => handleWidgetClick('calendar')}
                  onFullscreen={() => handleWidgetFullscreen('calendar')}
                  onRefresh={loadCalendarData}
                  loading={widgetLoading.calendar}
                >
                  <ErrorBoundary title="Ödeme Takvimi Hatası" onRetry={loadCalendarData}>
                    <Suspense fallback={<PaymentCalendarSkeleton />}>
                      <PaymentCalendarWidget
                        payments={dashboardData.chartData.calendarPayments}
                        loading={widgetLoading.calendar}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </InteractiveWidget>
              )}
            </Grid>

            {/* Expense Category Chart */}
            <Grid item xs={12} md={6} lg={4}>
              {errors.categoryChart && retryCount.categoryChart >= 3 ? (
                <InteractiveWidget
                  title="Kategori Harcamaları"
                  error={errors.categoryChart}
                  onRefresh={() => retryWidgetLoad('categoryChart')}
                  showMenu={false}
                />
              ) : (
                <InteractiveWidget
                  title="Kategori Harcamaları"
                  onNavigate={() => handleWidgetClick('categoryChart')}
                  onFullscreen={() => handleWidgetFullscreen('categoryChart')}
                  onRefresh={loadChartData}
                  loading={widgetLoading.categoryChart}
                >
                  <ErrorBoundary title="Kategori Grafiği Hatası" onRetry={loadChartData}>
                    <Suspense fallback={<ExpenseCategorySkeleton />}>
                      <ExpenseCategoryChart
                        categoryData={dashboardData.chartData.categoryExpenses}
                        loading={widgetLoading.categoryChart}
                        onCategoryClick={handleCategoryClick}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </InteractiveWidget>
              )}
            </Grid>

            {/* Budget Comparison Widget */}
            <Grid item xs={12} md={6} lg={4}>
              {errors.budgetWidget && retryCount.budgetWidget >= 3 ? (
                <InteractiveWidget
                  title="Bütçe Karşılaştırması"
                  error={errors.budgetWidget}
                  onRefresh={() => retryWidgetLoad('budgetWidget')}
                  showMenu={false}
                />
              ) : (
                <InteractiveWidget
                  title="Bütçe Karşılaştırması"
                  onNavigate={() => handleWidgetClick('budgetWidget')}
                  onFullscreen={() => handleWidgetFullscreen('budgetWidget')}
                  onSettings={() => handleWidgetSettings('budgetWidget')}
                  showSettings={true}
                  loading={widgetLoading.budgetWidget}
                >
                  <ErrorBoundary title="Bütçe Widget'ı Hatası">
                    <Suspense fallback={<BudgetComparisonSkeleton />}>
                      <BudgetComparisonWidget
                        budgetData={dashboardData.budgetTargets}
                        actualData={processedBudgetData}
                        loading={widgetLoading.budgetWidget}
                        onBudgetUpdate={handleBudgetUpdate}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </InteractiveWidget>
              )}
            </Grid>

            {/* Financial Trend Chart */}
            <Grid item xs={12} lg={8}>
              {errors.trendChart && retryCount.trendChart >= 3 ? (
                <InteractiveWidget
                  title="Finansal Trend"
                  error={errors.trendChart}
                  onRefresh={() => retryWidgetLoad('trendChart')}
                  showMenu={false}
                />
              ) : (
                <InteractiveWidget
                  title="Finansal Trend"
                  onNavigate={() => handleWidgetClick('trendChart')}
                  onFullscreen={() => handleWidgetFullscreen('trendChart')}
                  onRefresh={loadChartData}
                  loading={widgetLoading.trendChart}
                >
                  <ErrorBoundary title="Trend Grafiği Hatası" onRetry={loadChartData}>
                    <Suspense fallback={<FinancialTrendSkeleton />}>
                      <FinancialTrendChart
                        trendData={dashboardData.chartData.financialTrends}
                        loading={widgetLoading.trendChart}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </InteractiveWidget>
              )}
            </Grid>

            {/* Financial Metrics Widget */}
            <Grid item xs={12} lg={4}>
              {errors.metricsWidget && retryCount.metricsWidget >= 3 ? (
                <InteractiveWidget
                  title="Finansal Metrikler"
                  error={errors.metricsWidget}
                  onRefresh={() => retryWidgetLoad('metricsWidget')}
                  showMenu={false}
                />
              ) : (
                <InteractiveWidget
                  title="Finansal Metrikler"
                  onNavigate={() => handleWidgetClick('metricsWidget')}
                  onFullscreen={() => handleWidgetFullscreen('metricsWidget')}
                  onRefresh={loadMetricsData}
                  loading={widgetLoading.metricsWidget}
                >
                  <ErrorBoundary title="Metrikler Widget'ı Hatası" onRetry={loadMetricsData}>
                    <Suspense fallback={<FinancialMetricsSkeleton />}>
                      <FinancialMetricsWidget
                        metricsData={dashboardData.metricsData}
                        loading={widgetLoading.metricsWidget}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </InteractiveWidget>
              )}
            </Grid>
          </Grid>
        )}

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

        {/* Quick Actions FAB */}
        <QuickActionsFab onAction={handleQuickAction} />

        {/* Fullscreen Widget Dialog */}
        <Dialog
          open={Boolean(fullscreenWidget)}
          onClose={() => setFullscreenWidget(null)}
          maxWidth="xl"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {fullscreenWidget === 'calendar' && 'Ödeme Takvimi'}
                {fullscreenWidget === 'categoryChart' && 'Kategori Harcamaları'}
                {fullscreenWidget === 'trendChart' && 'Finansal Trend'}
                {fullscreenWidget === 'budgetWidget' && 'Bütçe Karşılaştırması'}
                {fullscreenWidget === 'metricsWidget' && 'Finansal Metrikler'}
              </Typography>
              <IconButton onClick={() => setFullscreenWidget(null)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {fullscreenWidget === 'calendar' && (
              <Suspense fallback={<PaymentCalendarSkeleton />}>
                <PaymentCalendarWidget
                  payments={dashboardData.chartData.calendarPayments}
                  loading={widgetLoading.calendar}
                  fullscreen={true}
                />
              </Suspense>
            )}
            {fullscreenWidget === 'categoryChart' && (
              <Suspense fallback={<ExpenseCategorySkeleton />}>
                <ExpenseCategoryChart
                  categoryData={dashboardData.chartData.categoryExpenses}
                  loading={widgetLoading.categoryChart}
                  onCategoryClick={handleCategoryClick}
                  fullscreen={true}
                />
              </Suspense>
            )}
            {fullscreenWidget === 'trendChart' && (
              <Suspense fallback={<FinancialTrendSkeleton />}>
                <FinancialTrendChart
                  trendData={dashboardData.chartData.financialTrends}
                  loading={widgetLoading.trendChart}
                  fullscreen={true}
                />
              </Suspense>
            )}
            {fullscreenWidget === 'budgetWidget' && (
              <Suspense fallback={<BudgetComparisonSkeleton />}>
                <BudgetComparisonWidget
                  budgetData={dashboardData.budgetTargets}
                  actualData={processedBudgetData}
                  loading={widgetLoading.budgetWidget}
                  onBudgetUpdate={handleBudgetUpdate}
                  fullscreen={true}
                />
              </Suspense>
            )}
            {fullscreenWidget === 'metricsWidget' && (
              <Suspense fallback={<FinancialMetricsSkeleton />}>
                <FinancialMetricsWidget
                  metricsData={dashboardData.metricsData}
                  loading={widgetLoading.metricsWidget}
                  fullscreen={true}
                />
              </Suspense>
            )}
          </DialogContent>
        </Dialog>

        {/* Widget Settings Dialog */}
        <Dialog
          open={widgetSettingsOpen}
          onClose={() => setWidgetSettingsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Widget Ayarları</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary">
              {selectedWidget === 'budgetWidget' && 'Bütçe hedeflerinizi ve kategorilerinizi yönetin.'}
              {selectedWidget === 'calendar' && 'Takvim görünümü ayarlarını düzenleyin.'}
              {selectedWidget === 'categoryChart' && 'Kategori grafiği ayarlarını düzenleyin.'}
              {selectedWidget === 'trendChart' && 'Trend grafiği ayarlarını düzenleyin.'}
              {selectedWidget === 'metricsWidget' && 'Metrik hesaplama ayarlarını düzenleyin.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWidgetSettingsOpen(false)}>
              İptal
            </Button>
            <Button variant="contained" onClick={() => setWidgetSettingsOpen(false)}>
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

// Memoize the entire Dashboard component for performance
export default React.memo(Dashboard);