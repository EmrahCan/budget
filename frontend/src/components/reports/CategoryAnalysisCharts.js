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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  Category,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart,
  TrendingUp,
  TrendingDown,
  Remove,
  ExpandMore,
  ExpandLess,
  Visibility,
} from '@mui/icons-material';
import { 
  formatChartCurrency, 
  formatPercentage, 
  getColorByIndex,
  processCategoryData,
  getResponsiveConfig 
} from '../charts/chartUtils';
import { CHART_COLORS, CATEGORY_ICONS } from '../charts/chartConstants';

const CategoryAnalysisCharts = ({ 
  data, 
  loading = false, 
  error = null,
  showBarChart = true,
  showPieChart = true,
  showTable = true,
  showRadialChart = false,
  maxCategories = 8
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const responsiveConfig = getResponsiveConfig(isMobile);

  const [viewMode, setViewMode] = useState('bar'); // 'bar', 'pie', 'table', 'radial'
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('amount'); // 'amount', 'percentage', 'count'

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data?.categoryAnalysis) return null;

    const categoryData = data.categoryAnalysis;

    // Sort categories based on selected criteria
    const sortedData = [...categoryData].sort((a, b) => {
      switch (sortBy) {
        case 'percentage':
          return b.percentage - a.percentage;
        case 'count':
          return b.transactionCount - a.transactionCount;
        case 'amount':
        default:
          return b.amount - a.amount;
      }
    });

    // Process for different chart types
    const processedData = sortedData.slice(0, maxCategories).map((item, index) => ({
      ...item,
      color: getColorByIndex(index),
      icon: CATEGORY_ICONS[item.category] || CATEGORY_ICONS['Diğer'],
      trendIcon: item.trend === 'up' ? '↗️' : item.trend === 'down' ? '↘️' : '➡️',
      trendColor: item.trend === 'up' ? CHART_COLORS.error : 
                  item.trend === 'down' ? CHART_COLORS.success : 
                  CHART_COLORS.info
    }));

    // Calculate totals
    const totalAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);
    const totalTransactions = categoryData.reduce((sum, item) => sum + item.transactionCount, 0);

    // Radial chart data (top 5 categories)
    const radialData = processedData.slice(0, 5).map((item, index) => ({
      ...item,
      fill: item.color,
      value: item.percentage
    }));

    return {
      processedData,
      radialData,
      totalAmount,
      totalTransactions,
      averageAmount: totalAmount / categoryData.length,
      categoryCount: categoryData.length
    };
  }, [data, sortBy, maxCategories]);

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: 1, 
          borderColor: 'grey.300',
          borderRadius: 1,
          boxShadow: 2,
          minWidth: 200
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            {data.icon} {label}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Tutar:</strong> {formatChartCurrency(data.amount)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Oran:</strong> {formatPercentage(data.percentage)}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>İşlem Sayısı:</strong> {data.transactionCount}
          </Typography>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            <strong>Trend:</strong> 
            <span style={{ color: data.trendColor, marginLeft: 4 }}>
              {data.trendIcon} {data.trend === 'up' ? 'Artış' : data.trend === 'down' ? 'Azalış' : 'Sabit'}
            </span>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: 1, 
          borderColor: 'grey.300',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            {data.icon} {data.category}
          </Typography>
          <Typography variant="body2" sx={{ color: data.color, fontWeight: 'bold' }}>
            {formatChartCurrency(data.amount)} ({formatPercentage(data.percentage)})
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle sort change
  const handleSortChange = (criteria) => {
    setSortBy(criteria);
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ my: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Kategori analizi verileri yüklenirken hata oluştu: {error}
      </Alert>
    );
  }

  // No data state
  if (!chartData || chartData.processedData.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Kategori analizi için yeterli veri bulunmuyor. Lütfen farklı bir tarih aralığı seçin.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Category color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Kategori Analizi
            </Typography>
          </Box>
          
          {/* View Mode Selector */}
          <ButtonGroup size="small" variant="outlined">
            {showBarChart && (
              <Button
                onClick={() => handleViewModeChange('bar')}
                variant={viewMode === 'bar' ? 'contained' : 'outlined'}
                startIcon={<BarChartIcon />}
              >
                {!isMobile && 'Çubuk'}
              </Button>
            )}
            {showPieChart && (
              <Button
                onClick={() => handleViewModeChange('pie')}
                variant={viewMode === 'pie' ? 'contained' : 'outlined'}
                startIcon={<PieChartIcon />}
              >
                {!isMobile && 'Pasta'}
              </Button>
            )}
            {showRadialChart && (
              <Button
                onClick={() => handleViewModeChange('radial')}
                variant={viewMode === 'radial' ? 'contained' : 'outlined'}
                startIcon={<PieChartIcon />}
              >
                {!isMobile && 'Radyal'}
              </Button>
            )}
            {showTable && (
              <Button
                onClick={() => handleViewModeChange('table')}
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                startIcon={<TableChart />}
              >
                {!isMobile && 'Tablo'}
              </Button>
            )}
          </ButtonGroup>
        </Box>

        {/* Sort Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="textSecondary">
            Sıralama:
          </Typography>
          <ButtonGroup size="small">
            <Button
              onClick={() => handleSortChange('amount')}
              variant={sortBy === 'amount' ? 'contained' : 'outlined'}
              size="small"
            >
              Tutar
            </Button>
            <Button
              onClick={() => handleSortChange('percentage')}
              variant={sortBy === 'percentage' ? 'contained' : 'outlined'}
              size="small"
            >
              Oran
            </Button>
            <Button
              onClick={() => handleSortChange('count')}
              variant={sortBy === 'count' ? 'contained' : 'outlined'}
              size="small"
            >
              İşlem Sayısı
            </Button>
          </ButtonGroup>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Toplam Kategori
              </Typography>
              <Typography variant="h6" color="primary.main">
                {chartData.categoryCount}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Toplam Tutar
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatChartCurrency(chartData.totalAmount)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Toplam İşlem
              </Typography>
              <Typography variant="h6" color="info.main">
                {chartData.totalTransactions}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Ortalama
              </Typography>
              <Typography variant="h6" color="warning.main">
                {formatChartCurrency(chartData.averageAmount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Chart Content */}
        <Box sx={{ height: responsiveConfig.height + 50 }}>
          {/* Bar Chart */}
          {viewMode === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.processedData} margin={responsiveConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: responsiveConfig.fontSize }}
                  stroke={theme.palette.text.secondary}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 80 : 60}
                />
                <YAxis 
                  tickFormatter={formatChartCurrency}
                  tick={{ fontSize: responsiveConfig.fontSize }}
                  stroke={theme.palette.text.secondary}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar 
                  dataKey="amount" 
                  name="Tutar"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Pie Chart */}
          {viewMode === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.processedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => 
                    percentage > 5 ? `${category} (${formatPercentage(percentage)})` : ''
                  }
                  outerRadius={isMobile ? 80 : 120}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {chartData.processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Radial Chart */}
          {viewMode === 'radial' && (
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="80%" 
                data={chartData.radialData}
              >
                <RadialBar 
                  minAngle={15} 
                  label={{ position: 'insideStart', fill: '#fff' }} 
                  background 
                  clockWise 
                  dataKey="value" 
                />
                <Legend 
                  iconSize={10} 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right" 
                />
                <Tooltip content={<PieTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <TableContainer component={Paper} sx={{ maxHeight: responsiveConfig.height }}>
              <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Kategori</TableCell>
                    <TableCell align="right">Tutar</TableCell>
                    <TableCell align="right">Oran</TableCell>
                    <TableCell align="right">İşlem</TableCell>
                    <TableCell align="center">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chartData.processedData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: row.color, 
                              borderRadius: '50%', 
                              mr: 1 
                            }} 
                          />
                          {row.icon} {row.category}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatChartCurrency(row.amount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(row.percentage)}
                      </TableCell>
                      <TableCell align="right">
                        {row.transactionCount}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.trend === 'up' ? 'Artış' : row.trend === 'down' ? 'Azalış' : 'Sabit'}
                          size="small"
                          color={row.trend === 'up' ? 'error' : row.trend === 'down' ? 'success' : 'default'}
                          variant="outlined"
                          icon={
                            row.trend === 'up' ? <TrendingUp /> : 
                            row.trend === 'down' ? <TrendingDown /> : <Remove />
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Details Section */}
        <Box sx={{ mt: 3 }}>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
            size="small"
          >
            {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
          </Button>
          
          <Collapse in={showDetails}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Kategori Analizi Detayları
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>En Yüksek Harcama:</strong> {chartData.processedData[0]?.category} 
                    ({formatChartCurrency(chartData.processedData[0]?.amount)})
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>En Düşük Harcama:</strong> {chartData.processedData[chartData.processedData.length - 1]?.category}
                    ({formatChartCurrency(chartData.processedData[chartData.processedData.length - 1]?.amount)})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>En Çok İşlem:</strong> {
                      [...chartData.processedData].sort((a, b) => b.transactionCount - a.transactionCount)[0]?.category
                    } ({[...chartData.processedData].sort((a, b) => b.transactionCount - a.transactionCount)[0]?.transactionCount} işlem)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ortalama İşlem Tutarı:</strong> {formatChartCurrency(chartData.totalAmount / chartData.totalTransactions)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryAnalysisCharts;