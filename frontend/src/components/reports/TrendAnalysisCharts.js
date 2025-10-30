import React, { useMemo, useState } from 'react';
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
  Button,
  ButtonGroup,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Timeline,
  CompareArrows,
  Analytics,
} from '@mui/icons-material';
import { 
  formatChartCurrency, 
  formatPercentage, 
  processFinancialTrendData,
  getResponsiveConfig,
  generateMonthLabels
} from '../charts/chartUtils';
import { CHART_COLORS } from '../charts/chartConstants';

const TrendAnalysisCharts = ({ 
  data, 
  loading = false, 
  error = null,
  showTimeBasedTrend = true,
  showComparison = true,
  showGrowthAnalysis = true,
  showSeasonalAnalysis = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const responsiveConfig = getResponsiveConfig(isMobile);

  const [viewMode, setViewMode] = useState('line'); // 'line', 'area', 'composed'
  const [timeFrame, setTimeFrame] = useState('monthly'); // 'monthly', 'weekly'
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState('previous'); // 'previous', 'yearAgo'

  // Process data for trend analysis
  const chartData = useMemo(() => {
    if (!data?.trendAnalysis) return null;

    const trendData = data.trendAnalysis[timeFrame] || data.trendAnalysis.monthly || [];
    const processedData = processFinancialTrendData(trendData);

    // Calculate moving averages if enabled
    const dataWithMovingAverage = showMovingAverage ? 
      processedData.map((item, index) => {
        const window = 3; // 3-period moving average
        const start = Math.max(0, index - window + 1);
        const subset = processedData.slice(start, index + 1);
        
        const avgIncome = subset.reduce((sum, d) => sum + d.income, 0) / subset.length;
        const avgExpense = subset.reduce((sum, d) => sum + d.expense, 0) / subset.length;
        
        return {
          ...item,
          incomeMA: avgIncome,
          expenseMA: avgExpense,
          netMA: avgIncome - avgExpense
        };
      }) : processedData;

    // Calculate growth rates
    const growthData = dataWithMovingAverage.map((item, index) => {
      if (index === 0) return { ...item, incomeGrowth: 0, expenseGrowth: 0, netGrowth: 0 };
      
      const prev = dataWithMovingAverage[index - 1];
      const incomeGrowth = prev.income > 0 ? ((item.income - prev.income) / prev.income) * 100 : 0;
      const expenseGrowth = prev.expense > 0 ? ((item.expense - prev.expense) / prev.expense) * 100 : 0;
      const netGrowth = prev.net !== 0 ? ((item.net - prev.net) / Math.abs(prev.net)) * 100 : 0;
      
      return {
        ...item,
        incomeGrowth,
        expenseGrowth,
        netGrowth
      };
    });

    // Calculate comparison data
    const comparisonData = growthData.map((item, index) => {
      let compareIndex;
      if (comparisonPeriod === 'previous') {
        compareIndex = index - 1;
      } else if (comparisonPeriod === 'yearAgo') {
        compareIndex = index - 12; // 12 months ago
      }
      
      if (compareIndex >= 0 && compareIndex < growthData.length) {
        const compareItem = growthData[compareIndex];
        return {
          ...item,
          prevIncome: compareItem.income,
          prevExpense: compareItem.expense,
          prevNet: compareItem.net,
          incomeChange: item.income - compareItem.income,
          expenseChange: item.expense - compareItem.expense,
          netChange: item.net - compareItem.net
        };
      }
      
      return item;
    });

    // Calculate summary statistics
    const totalIncome = growthData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = growthData.reduce((sum, item) => sum + item.expense, 0);
    const avgIncome = totalIncome / growthData.length;
    const avgExpense = totalExpense / growthData.length;
    const avgNet = avgIncome - avgExpense;

    // Calculate trend direction
    const firstHalf = growthData.slice(0, Math.floor(growthData.length / 2));
    const secondHalf = growthData.slice(Math.floor(growthData.length / 2));
    
    const firstHalfAvgIncome = firstHalf.reduce((sum, item) => sum + item.income, 0) / firstHalf.length;
    const secondHalfAvgIncome = secondHalf.reduce((sum, item) => sum + item.income, 0) / secondHalf.length;
    const firstHalfAvgExpense = firstHalf.reduce((sum, item) => sum + item.expense, 0) / firstHalf.length;
    const secondHalfAvgExpense = secondHalf.reduce((sum, item) => sum + item.expense, 0) / secondHalf.length;

    const incomeTrend = secondHalfAvgIncome > firstHalfAvgIncome ? 'up' : 
                       secondHalfAvgIncome < firstHalfAvgIncome ? 'down' : 'stable';
    const expenseTrend = secondHalfAvgExpense > firstHalfAvgExpense ? 'up' : 
                        secondHalfAvgExpense < firstHalfAvgExpense ? 'down' : 'stable';

    return {
      processedData: comparisonData,
      avgIncome,
      avgExpense,
      avgNet,
      incomeTrend,
      expenseTrend,
      totalPeriods: growthData.length
    };
  }, [data, timeFrame, showMovingAverage, comparisonPeriod]);

  // Custom tooltip for trend charts
  const TrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: 1, 
          borderColor: 'grey.300',
          borderRadius: 1,
          boxShadow: 2,
          minWidth: 250
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ 
                color: entry.color, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 0.5
              }}
            >
              <span>{entry.name}:</span>
              <strong>{formatChartCurrency(entry.value)}</strong>
            </Typography>
          ))}
          
          {/* Show growth rates if available */}
          {payload[0]?.payload?.incomeGrowth !== undefined && (
            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'grey.200' }}>
              <Typography variant="caption" color="textSecondary">
                Büyüme Oranları:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                Gelir: {formatPercentage(payload[0].payload.incomeGrowth)}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                Gider: {formatPercentage(payload[0].payload.expenseGrowth)}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ my: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Trend analizi verileri yüklenirken hata oluştu: {error}
      </Alert>
    );
  }

  // No data state
  if (!chartData || chartData.processedData.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Trend analizi için yeterli veri bulunmuyor. Lütfen daha geniş bir tarih aralığı seçin.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Timeline color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Trend Analizi
            </Typography>
          </Box>
          
          {/* View Mode Selector */}
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => setViewMode('line')}
              variant={viewMode === 'line' ? 'contained' : 'outlined'}
              startIcon={<ShowChart />}
            >
              {!isMobile && 'Çizgi'}
            </Button>
            <Button
              onClick={() => setViewMode('area')}
              variant={viewMode === 'area' ? 'contained' : 'outlined'}
              startIcon={<Analytics />}
            >
              {!isMobile && 'Alan'}
            </Button>
            <Button
              onClick={() => setViewMode('composed')}
              variant={viewMode === 'composed' ? 'contained' : 'outlined'}
              startIcon={<CompareArrows />}
            >
              {!isMobile && 'Karma'}
            </Button>
          </ButtonGroup>
        </Box>

        {/* Controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Zaman Dilimi</InputLabel>
              <Select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                label="Zaman Dilimi"
              >
                <MenuItem value="monthly">Aylık</MenuItem>
                <MenuItem value="weekly">Haftalık</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Karşılaştırma</InputLabel>
              <Select
                value={comparisonPeriod}
                onChange={(e) => setComparisonPeriod(e.target.value)}
                label="Karşılaştırma"
              >
                <MenuItem value="previous">Önceki Dönem</MenuItem>
                <MenuItem value="yearAgo">Geçen Yıl</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showMovingAverage}
                  onChange={(e) => setShowMovingAverage(e.target.checked)}
                  size="small"
                />
              }
              label="Hareketli Ortalama"
            />
          </Grid>
        </Grid>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Ortalama Gelir
              </Typography>
              <Typography variant="h6" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData.incomeTrend === 'up' ? <TrendingUp fontSize="small" /> : 
                 chartData.incomeTrend === 'down' ? <TrendingDown fontSize="small" /> : null}
                {formatChartCurrency(chartData.avgIncome)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Ortalama Gider
              </Typography>
              <Typography variant="h6" color="error.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData.expenseTrend === 'up' ? <TrendingUp fontSize="small" /> : 
                 chartData.expenseTrend === 'down' ? <TrendingDown fontSize="small" /> : null}
                {formatChartCurrency(chartData.avgExpense)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Ortalama Net
              </Typography>
              <Typography 
                variant="h6" 
                color={chartData.avgNet >= 0 ? 'success.main' : 'error.main'}
              >
                {formatChartCurrency(chartData.avgNet)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Dönem Sayısı
              </Typography>
              <Typography variant="h6" color="primary.main">
                {chartData.totalPeriods}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Chart Content */}
        <Box sx={{ height: responsiveConfig.height + 100 }}>
          {/* Line Chart */}
          {viewMode === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.processedData} margin={responsiveConfig.margin}>
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
                <Tooltip content={<TrendTooltip />} />
                <Legend />
                
                {/* Main trend lines */}
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke={CHART_COLORS.income} 
                  strokeWidth={3}
                  name="Gelir"
                  dot={{ fill: CHART_COLORS.income, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke={CHART_COLORS.expense} 
                  strokeWidth={3}
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
                  dot={{ fill: CHART_COLORS.net, strokeWidth: 2, r: 3 }}
                />
                
                {/* Moving averages */}
                {showMovingAverage && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="incomeMA" 
                      stroke={CHART_COLORS.income} 
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      name="Gelir (3 Dönem Ort.)"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenseMA" 
                      stroke={CHART_COLORS.expense} 
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      name="Gider (3 Dönem Ort.)"
                      dot={false}
                    />
                  </>
                )}
                
                {/* Reference line for break-even */}
                <ReferenceLine y={0} stroke={theme.palette.grey[500]} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Area Chart */}
          {viewMode === 'area' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.processedData} margin={responsiveConfig.margin}>
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
                <Tooltip content={<TrendTooltip />} />
                <Legend />
                
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stackId="1"
                  stroke={CHART_COLORS.income} 
                  fill={CHART_COLORS.income}
                  fillOpacity={0.6}
                  name="Gelir"
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stackId="2"
                  stroke={CHART_COLORS.expense} 
                  fill={CHART_COLORS.expense}
                  fillOpacity={0.6}
                  name="Gider"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Composed Chart */}
          {viewMode === 'composed' && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.processedData} margin={responsiveConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: responsiveConfig.fontSize }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={formatChartCurrency}
                  tick={{ fontSize: responsiveConfig.fontSize }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tickFormatter={formatPercentage}
                  tick={{ fontSize: responsiveConfig.fontSize }}
                  stroke={theme.palette.text.secondary}
                />
                <Tooltip content={<TrendTooltip />} />
                <Legend />
                
                {/* Bars for amounts */}
                <Bar 
                  yAxisId="left"
                  dataKey="income" 
                  fill={CHART_COLORS.income}
                  fillOpacity={0.7}
                  name="Gelir"
                />
                <Bar 
                  yAxisId="left"
                  dataKey="expense" 
                  fill={CHART_COLORS.expense}
                  fillOpacity={0.7}
                  name="Gider"
                />
                
                {/* Line for growth rates */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="incomeGrowth" 
                  stroke={CHART_COLORS.success} 
                  strokeWidth={2}
                  name="Gelir Büyümesi (%)"
                  dot={{ fill: CHART_COLORS.success, r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="expenseGrowth" 
                  stroke={CHART_COLORS.warning} 
                  strokeWidth={2}
                  name="Gider Büyümesi (%)"
                  dot={{ fill: CHART_COLORS.warning, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Trend Insights */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Trend Analizi Özeti
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip
                  icon={chartData.incomeTrend === 'up' ? <TrendingUp /> : 
                        chartData.incomeTrend === 'down' ? <TrendingDown /> : null}
                  label={`Gelir Trendi: ${chartData.incomeTrend === 'up' ? 'Yükseliş' : 
                                         chartData.incomeTrend === 'down' ? 'Düşüş' : 'Sabit'}`}
                  color={chartData.incomeTrend === 'up' ? 'success' : 
                         chartData.incomeTrend === 'down' ? 'error' : 'default'}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  icon={chartData.expenseTrend === 'up' ? <TrendingUp /> : 
                        chartData.expenseTrend === 'down' ? <TrendingDown /> : null}
                  label={`Gider Trendi: ${chartData.expenseTrend === 'up' ? 'Yükseliş' : 
                                          chartData.expenseTrend === 'down' ? 'Düşüş' : 'Sabit'}`}
                  color={chartData.expenseTrend === 'down' ? 'success' : 
                         chartData.expenseTrend === 'up' ? 'error' : 'default'}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary">
                <strong>Finansal Performans:</strong> {
                  chartData.avgNet > 0 ? 'Pozitif net gelir trendi' : 'Negatif net gelir trendi'
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Öneriler:</strong> {
                  chartData.expenseTrend === 'up' && chartData.incomeTrend !== 'up' ? 
                  'Gider kontrolü yapılması önerilir' :
                  chartData.incomeTrend === 'up' && chartData.expenseTrend !== 'up' ?
                  'Olumlu finansal trend devam ediyor' :
                  'Mevcut trend izlenmeye devam edilmeli'
                }
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysisCharts;