import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart,
  Download,
  DateRange,
  AccountBalance,
  CreditCard,
  Payment,
  Timeline,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useNotification } from '../../contexts/NotificationContext';
import { reportsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [months, setMonths] = useState(12);
  
  const [reportData, setReportData] = useState({
    financialOverview: null,
    categoryBreakdown: null,
    monthlyTrends: null,
    installmentsOverview: null,
    netWorthHistory: null,
  });

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const [
        financialRes,
        categoryRes,
        trendsRes,
        installmentsRes,
        netWorthRes,
      ] = await Promise.allSettled([
        reportsAPI.getFinancialOverview(dateRange),
        reportsAPI.getCategoryBreakdown({ ...dateRange, type: 'expense' }),
        reportsAPI.getMonthlyTrends({ months }),
        reportsAPI.getInstallmentsOverview(),
        reportsAPI.getNetWorthHistory({ months }),
      ]);

      setReportData({
        financialOverview: financialRes.status === 'fulfilled' ? financialRes.value.data.data : null,
        categoryBreakdown: categoryRes.status === 'fulfilled' ? categoryRes.value.data.data : null,
        monthlyTrends: trendsRes.status === 'fulfilled' ? trendsRes.value.data.data : null,
        installmentsOverview: installmentsRes.status === 'fulfilled' ? installmentsRes.value.data.data : null,
        netWorthHistory: netWorthRes.status === 'fulfilled' ? netWorthRes.value.data.data : null,
      });
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    loadReportData();
  };

  const handleExport = async (type) => {
    try {
      const response = await reportsAPI.exportData({ type, ...dateRange });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${dateRange.startDate}_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Rapor başarıyla indirildi');
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  // Chart configurations
  const getMonthlyTrendsChart = () => {
    if (!reportData.monthlyTrends?.trends) return null;

    const data = {
      labels: reportData.monthlyTrends.trends.map(t => {
        const date = new Date(t.month + '-01');
        return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
      }),
      datasets: [
        {
          label: 'Gelir',
          data: reportData.monthlyTrends.trends.map(t => t.income),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Gider',
          data: reportData.monthlyTrends.trends.map(t => t.expense),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Net Gelir',
          data: reportData.monthlyTrends.trends.map(t => t.netIncome),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Aylık Gelir/Gider Trendi',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 0,
              }).format(value);
            }
          }
        }
      }
    };

    return <Line data={data} options={options} />;
  };

  const getCategoryBreakdownChart = () => {
    if (!reportData.categoryBreakdown?.categories) return null;

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    const data = {
      labels: reportData.categoryBreakdown.categories.map(c => c.category),
      datasets: [
        {
          data: reportData.categoryBreakdown.categories.map(c => c.amount),
          backgroundColor: colors.slice(0, reportData.categoryBreakdown.categories.length),
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Kategori Bazlı Harcamalar',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatCurrency(context.parsed);
              const percentage = reportData.categoryBreakdown.categories[context.dataIndex]?.percentage || 0;
              return `${label}: ${value} (%${percentage})`;
            }
          }
        }
      },
    };

    return <Doughnut data={data} options={options} />;
  };

  const getNetWorthChart = () => {
    if (!reportData.netWorthHistory?.history) return null;

    const data = {
      labels: reportData.netWorthHistory.history.map(h => {
        const date = new Date(h.month + '-01');
        return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
      }),
      datasets: [
        {
          label: 'Net Değer',
          data: reportData.netWorthHistory.history.map(h => h.netWorth),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Net Değer Geçmişi',
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    };

    return <Line data={data} options={options} />;
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
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Finansal Raporlar
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Gelir, gider ve yatırımlarınızın detaylı analizi
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('transactions')}
            >
              İşlemleri İndir
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport('installments')}
            >
              Taksitleri İndir
            </Button>
          </Box>
        </Box>

        {/* Date Range Controls */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Trend Periyodu</InputLabel>
                  <Select
                    value={months}
                    label="Trend Periyodu"
                    onChange={(e) => setMonths(e.target.value)}
                  >
                    <MenuItem value={6}>Son 6 Ay</MenuItem>
                    <MenuItem value={12}>Son 12 Ay</MenuItem>
                    <MenuItem value={24}>Son 24 Ay</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleRefresh}
                  sx={{ py: 1.5 }}
                >
                  Raporları Yenile
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Financial Overview Cards */}
        {reportData.financialOverview && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Gelir
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="success.main">
                    {formatCurrency(reportData.financialOverview.summary.income)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                      <TrendingDown />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Gider
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="error.main">
                    {formatCurrency(reportData.financialOverview.summary.expenses)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <AccountBalance />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Net Gelir
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    color={reportData.financialOverview.summary.netIncome >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(reportData.financialOverview.summary.netIncome)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <Timeline />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Net Değer
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    color={reportData.financialOverview.summary.netWorth >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(reportData.financialOverview.summary.netWorth)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Monthly Trends Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Aylık Gelir/Gider Trendi
                </Typography>
                <Box sx={{ height: 400 }}>
                  {getMonthlyTrendsChart()}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Breakdown Chart */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Harcama Kategorileri
                </Typography>
                <Box sx={{ height: 400 }}>
                  {getCategoryBreakdownChart()}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Net Worth History */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Net Değer Geçmişi
                </Typography>
                <Box sx={{ height: 300 }}>
                  {getNetWorthChart()}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Installments Overview */}
        {reportData.installmentsOverview && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Taksit Ödemeleri Özeti
                  </Typography>
                  
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">
                          {formatCurrency(reportData.installmentsOverview.summary.totalDebt)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Toplam Borç
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {formatCurrency(reportData.installmentsOverview.summary.monthlyPayments)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Aylık Ödeme
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {reportData.installmentsOverview.summary.totalItems}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Toplam Taksit
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          %{reportData.installmentsOverview.summary.avgInterestRate.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Ortalama Faiz
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Upcoming Payments */}
                  <Typography variant="h6" gutterBottom>
                    Yaklaşan Ödemeler
                  </Typography>
                  <Grid container spacing={2}>
                    {reportData.installmentsOverview.allInstallments.slice(0, 6).map((item, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {item.item_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatCurrency(item.monthly_payment)} - {formatDate(item.next_payment_date)}
                          </Typography>
                          <Chip 
                            label={item.type === 'credit_card' ? 'Kredi Kartı' : 
                                  item.type === 'land_payment' ? 'Arsa' : 'Taksit'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Category Details */}
        {reportData.categoryBreakdown && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Kategori Detayları
                  </Typography>
                  <Grid container spacing={2}>
                    {reportData.categoryBreakdown.categories.map((category, index) => (
                      <Grid item xs={12} md={6} lg={4} key={index}>
                        <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                              {category.category}
                            </Typography>
                            <Chip label={`%${category.percentage}`} size="small" />
                          </Box>
                          <Typography variant="h6" color="primary.main">
                            {formatCurrency(category.amount)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {category.transactionCount} işlem • Ort: {formatCurrency(category.avgAmount)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default ReportsPage;