import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  ShowChart,
} from '@mui/icons-material';
import { 
  formatChartCurrency, 
  formatPercentage, 
  getColorByIndex,
  processFinancialTrendData,
  getResponsiveConfig 
} from '../charts/chartUtils';
import { CHART_COLORS } from '../charts/chartConstants';

const SummaryCharts = ({ 
  data, 
  loading = false, 
  error = null,
  showIncomeExpensePie = true,
  showTrendLine = true,
  showMonthlyComparison = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const responsiveConfig = getResponsiveConfig(isMobile);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data) return null;

    // Income vs Expense Pie Chart Data
    const incomeExpenseData = [
      {
        name: 'Gelir',
        value: data.summary?.totalIncome || 0,
        color: CHART_COLORS.income,
        icon: '💰'
      },
      {
        name: 'Gider',
        value: data.summary?.totalExpense || 0,
        color: CHART_COLORS.expense,
        icon: '💸'
      }
    ].filter(item => item.value > 0);

    // Monthly Trend Data
    const trendData = processFinancialTrendData(data.trendAnalysis?.monthly || []);

    // Monthly Comparison Data (current vs previous period)
    const monthlyComparisonData = trendData.slice(-6).map((item, index) => ({
      month: item.month,
      income: item.income,
      expense: item.expense,
      net: item.net,
      previousIncome: index > 0 ? trendData[trendData.length - 6 + index - 1]?.income || 0 : 0,
      previousExpense: index > 0 ? trendData[trendData.length - 6 + index - 1]?.expense || 0 : 0,
    }));

    return {
      incomeExpenseData,
      trendData,
      monthlyComparisonData
    };
  }, [data]);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 1, 
          border: 1, 
          borderColor: 'grey.300',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="body2">
            {data.payload.icon} {data.name}
          </Typography>
          <Typography variant="body2" fontWeight="bold" color={data.payload.color}>
            {formatChartCurrency(data.value)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const LineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: 1, 
          borderColor: 'grey.300',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ color: entry.color, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box sx={{ width: 12, height: 12, bgcolor: entry.color, borderRadius: '50%' }} />
              {entry.name}: {formatChartCurrency(entry.value)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', my: 2 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ my: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Grafik verileri yüklenirken hata oluştu: {error}
      </Alert>
    );
  }

  // No data state
  if (!chartData) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Grafik için yeterli veri bulunmuyor. Lütfen farklı bir tarih aralığı seçin.
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Income vs Expense Pie Chart */}
      {showIncomeExpensePie && chartData.incomeExpenseData.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PieChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Gelir vs Gider Dağılımı
                </Typography>
              </Box>
              
              <ResponsiveContainer width="100%" height={responsiveConfig.height}>
                <PieChart>
                  <Pie
                    data={chartData.incomeExpenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 80 : 100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.incomeExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {entry.payload.icon} {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Summary Stats */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Net Gelir
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={data.summary?.netIncome >= 0 ? 'success.main' : 'error.main'}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {data.summary?.netIncome >= 0 ? <TrendingUp /> : <TrendingDown />}
                    {formatChartCurrency(data.summary?.netIncome || 0)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Tasarruf Oranı
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatPercentage(data.financialMetrics?.savingsRate || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Monthly Trend Line Chart */}
      {showTrendLine && chartData.trendData.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShowChart color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Aylık Finansal Trend
                </Typography>
              </Box>
              
              <ResponsiveContainer width="100%" height={responsiveConfig.height}>
                <LineChart data={chartData.trendData} margin={responsiveConfig.margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: responsiveConfig.fontSize }}
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis 
                    tickFormatter={formatChartCurrency}
                    tick={{ fontSize: responsiveConfig.fontSize }}
                    stroke={theme.palette.text.secondary}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke={CHART_COLORS.income} 
                    strokeWidth={2}
                    name="Gelir"
                    dot={{ fill: CHART_COLORS.income, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke={CHART_COLORS.expense} 
                    strokeWidth={2}
                    name="Gider"
                    dot={{ fill: CHART_COLORS.expense, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke={CHART_COLORS.net} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Net Gelir"
                    dot={{ fill: CHART_COLORS.net, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Monthly Comparison Bar Chart */}
      {showMonthlyComparison && chartData.monthlyComparisonData.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShowChart color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Son 6 Ay Gelir/Gider Karşılaştırması
                </Typography>
              </Box>
              
              <ResponsiveContainer width="100%" height={responsiveConfig.height + 50}>
                <BarChart data={chartData.monthlyComparisonData} margin={responsiveConfig.margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: responsiveConfig.fontSize }}
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis 
                    tickFormatter={formatChartCurrency}
                    tick={{ fontSize: responsiveConfig.fontSize }}
                    stroke={theme.palette.text.secondary}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="income" 
                    fill={CHART_COLORS.income} 
                    name="Gelir"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill={CHART_COLORS.expense} 
                    name="Gider"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Trend Indicators */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Ortalama Gelir
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatChartCurrency(
                      chartData.monthlyComparisonData.reduce((sum, item) => sum + item.income, 0) / 
                      chartData.monthlyComparisonData.length
                    )}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Ortalama Gider
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatChartCurrency(
                      chartData.monthlyComparisonData.reduce((sum, item) => sum + item.expense, 0) / 
                      chartData.monthlyComparisonData.length
                    )}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Ortalama Net
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatChartCurrency(
                      chartData.monthlyComparisonData.reduce((sum, item) => sum + item.net, 0) / 
                      chartData.monthlyComparisonData.length
                    )}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default SummaryCharts;