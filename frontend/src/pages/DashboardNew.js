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
  Skeleton,
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
import { accountsAPI, creditCardsAPI, transactionsAPI, fixedPaymentsAPI, installmentPaymentsAPI, formatCurrency, formatDate } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Import the new draggable dashboard
import DraggableDashboard from '../components/dashboard/DraggableDashboard';
import WidgetDemo from '../components/dashboard/WidgetDemo';

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

// Lazy load chart components
const PaymentCalendarWidget = lazy(() => import('../components/charts/PaymentCalendarWidget'));
const ExpenseCategoryChart = lazy(() => import('../components/charts/ExpenseCategoryChart'));
const FinancialTrendChart = lazy(() => import('../components/charts/FinancialTrendChart'));
const BudgetComparisonWidget = lazy(() => import('../components/charts/BudgetComparisonWidget'));
const FinancialMetricsWidget = lazy(() => import('../components/charts/FinancialMetricsWidget'));

const DashboardNew = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
    chartData: {
      categoryExpenses: [],
      financialTrends: [],
      calendarPayments: []
    },
    budgetTargets: {},
    metricsData: {}
  });

  // Memoized calculations
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

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
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

      // Load chart data
      await loadChartData();
      
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      showError('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load chart data
  const loadChartData = useCallback(async () => {
    try {
      const [categoryExpensesRes, trendRes, calendarRes] = await Promise.allSettled([
        transactionsAPI.getCategoryExpenses(),
        transactionsAPI.getFinancialTrend({ months: 6 }),
        fixedPaymentsAPI.getAll()
      ]);
      
      setDashboardData(prev => ({
        ...prev,
        chartData: {
          categoryExpenses: categoryExpensesRes.status === 'fulfilled' ? categoryExpensesRes.value.data?.data || [] : [],
          financialTrends: trendRes.status === 'fulfilled' ? trendRes.value.data?.data || [] : [],
          calendarPayments: calendarRes.status === 'fulfilled' ? calendarRes.value.data?.data || calendarRes.value.data || [] : []
        }
      }));
    } catch (error) {
      console.error('Chart data loading error:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Widget components
  const widgetComponents = useMemo(() => ({
    summary_cards: (
      <WidgetDemo 
        type="summary_cards" 
        title="Finansal Özet"
        data={dashboardData}
      />
    ),
    payment_calendar: (
      <WidgetDemo 
        type="payment_calendar" 
        title="Ödeme Takvimi"
        data={dashboardData.chartData.calendarPayments}
      />
    ),
    expense_chart: (
      <WidgetDemo 
        type="expense_chart" 
        title="Kategori Harcamaları"
        data={dashboardData.chartData.categoryExpenses}
      />
    ),
    trend_chart: (
      <WidgetDemo 
        type="trend_chart" 
        title="Finansal Trend"
        data={dashboardData.chartData.financialTrends}
      />
    ),
    budget_widget: (
      <WidgetDemo 
        type="budget_widget" 
        title="Bütçe Karşılaştırması"
        data={dashboardData.budgetTargets}
      />
    ),
    metrics_widget: (
      <WidgetDemo 
        type="metrics_widget" 
        title="Finansal Metrikler"
        data={dashboardData.metricsData}
      />
    ),
    recent_transactions: (
      <WidgetDemo 
        type="recent_transactions" 
        title="Son İşlemler"
        data={dashboardData.recentTransactions}
      />
    ),
    upcoming_payments: (
      <WidgetDemo 
        type="upcoming_payments" 
        title="Yaklaşan Ödemeler"
        data={dashboardData.upcomingPayments}
      />
    ),
    net_worth: (
      <WidgetDemo 
        type="net_worth" 
        title="Net Değer"
        data={{ netWorth: getNetWorth, monthlyBalance: getProjectedMonthlyBalance }}
      />
    ),
    quick_actions: (
      <WidgetDemo 
        type="quick_actions" 
        title="Hızlı İşlemler"
        data={{}}
      />
    ),
  }), [dashboardData, calculateTotalCreditCardDebt, getNetWorth, getProjectedMonthlyBalance, navigate]);

  // Handle widget events
  const handleWidgetMove = useCallback((widgetId, direction) => {
    console.log('Widget moved:', widgetId, direction);
  }, []);

  const handleWidgetSettings = useCallback((widget) => {
    console.log('Widget settings:', widget);
  }, []);

  const handleLayoutSave = useCallback((layout) => {
    showSuccess('Dashboard düzeni kaydedildi');
    console.log('Layout saved:', layout);
  }, [showSuccess]);

  const handleLayoutReset = useCallback(() => {
    showSuccess('Dashboard düzeni sıfırlandı');
  }, [showSuccess]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 4 }} />
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <DashboardCardSkeleton />
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Hoş geldiniz, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Drag & drop ile dashboard'ınızı özelleştirin
          </Typography>
        </Box>

        <DraggableDashboard
          dashboardData={dashboardData}
          onWidgetMove={handleWidgetMove}
          onWidgetSettings={handleWidgetSettings}
          onLayoutSave={handleLayoutSave}
          onLayoutReset={handleLayoutReset}
        >
          {widgetComponents}
        </DraggableDashboard>
      </Box>
    </Container>
  );
};

export default DashboardNew;