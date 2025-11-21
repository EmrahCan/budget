import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Category as CategoryIcon,
  CompareArrows,
  Refresh,
  Download,
} from '@mui/icons-material';
import {
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
import { useNotification } from '../../contexts/NotificationContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const CategoryTrendAnalysis = ({ timeframe = 'monthly' }) => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [topCategories, setTopCategories] = useState({ increasing: [], decreasing: [] });

  useEffect(() => {
    loadCategoryTrends();
  }, [timeframe]);

  const loadCategoryTrends = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/ai/trends/${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Kategori trend verileri yüklenemedi');
      }

      // Process category data
      const categoryData = processCategoryData(data.data);
      setTrendData(categoryData);
      setAvailableCategories(Object.keys(categoryData.byCategory));
      
      // Auto-select top 5 categories by total amount
      const topCats = Object.entries(categoryData.byCategory)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5)
        .map(([cat]) => cat);
      setSelectedCategories(topCats);

      // Calculate top increasing/decreasing
      calculateTopCategories(categoryData.byCategory);

    } catch (error) {
      console.error('Category trend error:', error);
      showError(`Kategori trend analizi yüklenemedi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processCategoryData = (data) => {
    const byCategory = {};
    const timeSeriesData = [];

    // Group by category
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach(item => {
        const category = item.category;
        const amount = parseFloat(item.total || item.amount || 0);
        const period = item.period || item.month;

        if (!byCategory[category]) {
          byCategory[category] = {
            total: 0,
            periods: [],
            trend: 0,
          };
        }

        byCategory[category].total += amount;
        byCategory[category].periods.push({
          period,
          amount,
        });
      });
    }

    // Calculate trends
    Object.keys(byCategory).forEach(category => {
      const periods = byCategory[category].periods;
      if (periods.length >= 2) {
        const firstHalf = periods.slice(0, Math.floor(periods.length / 2));
        const secondHalf = periods.slice(Math.floor(periods.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, p) => sum + p.amount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.amount, 0) / secondHalf.length;
        
        byCategory[category].trend = ((secondAvg - firstAvg) / firstAvg) * 100;
      }
    });

    // Create time series data for selected categories
    const allPeriods = new Set();
    Object.values(byCategory).forEach(cat => {
      cat.periods.forEach(p => allPeriods.add(p.period));
    });

    Array.from(allPeriods).sort().forEach(period => {
      const dataPoint = { period };
      Object.keys(byCategory).forEach(category => {
        const periodData = byCategory[category].periods.find(p => p.period === period);
        dataPoint[category] = periodData ? periodData.amount : 0;
      });
      timeSeriesData.push(dataPoint);
    });

    return {
      byCategory,
      timeSeriesData,
    };
  };

  const calculateTopCategories = (byCategory) => {
    const categoriesWithTrend = Object.entries(byCategory)
      .filter(([_, data]) => data.trend !== 0)
      .map(([category, data]) => ({
        category,
        trend: data.trend,
        total: data.total,
      }));

    const increasing = categoriesWithTrend
      .filter(c => c.trend > 0)
      .sort((a, b) => b.trend - a.trend)
      .slice(0, 5);

    const decreasing = categoriesWithTrend
      .filter(c => c.trend < 0)
      .sort((a, b) => a.trend - b.trend)
      .slice(0, 5);

    setTopCategories({ increasing, decreasing });
  };

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  const getChartData = () => {
    if (!trendData) return [];
    return trendData.timeSeriesData;
  };

  const getComparisonData = () => {
    if (!trendData) return [];
    
    return selectedCategories.map(category => {
      const data = trendData.byCategory[category];
      return {
        category,
        total: data.total,
        trend: data.trend,
        avgPerPeriod: data.total / data.periods.length,
      };
    }).sort((a, b) => b.total - a.total);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendColor = (trend) => {
    if (trend > 10) return 'error';
    if (trend > 0) return 'warning';
    if (trend < -10) return 'success';
    if (trend < 0) return 'info';
    return 'default';
  };

  const getTrendIcon = (trend) => {
    return trend > 0 ? <TrendingUp /> : <TrendingDown />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">Kategori Trend Analizi</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!trendData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Kategori trend analizi için yeterli veri bulunmuyor.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">Kategori Trend Analizi</Typography>
          </Box>
          <Button
            startIcon={<Refresh />}
            onClick={loadCategoryTrends}
            disabled={loading}
            size="small"
          >
            Yenile
          </Button>
        </Box>

        {/* Category Selector */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Kategoriler</InputLabel>
          <Select
            multiple
            value={selectedCategories}
            onChange={handleCategoryChange}
            input={<OutlinedInput label="Kategoriler" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {availableCategories.map((category) => (
              <MenuItem key={category} value={category}>
                <Checkbox checked={selectedCategories.indexOf(category) > -1} />
                <ListItemText primary={category} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Top Categories */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="error" />
                En Çok Artan Kategoriler
              </Typography>
              {topCategories.increasing.map((cat, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{cat.category}</Typography>
                  <Chip
                    label={formatPercentage(cat.trend)}
                    size="small"
                    color="error"
                    icon={<TrendingUp />}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown color="success" />
                En Çok Azalan Kategoriler
              </Typography>
              {topCategories.decreasing.map((cat, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{cat.category}</Typography>
                  <Chip
                    label={formatPercentage(cat.trend)}
                    size="small"
                    color="success"
                    icon={<TrendingDown />}
                  />
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Trend Chart */}
        {selectedCategories.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Seçili Kategoriler Trend Grafiği
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                {selectedCategories.map((category, index) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={`hsl(${(index * 360) / selectedCategories.length}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Comparison Table */}
        {selectedCategories.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CompareArrows />
              Kategori Karşılaştırma
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Kategori</TableCell>
                    <TableCell align="right">Toplam Harcama</TableCell>
                    <TableCell align="right">Dönem Ortalaması</TableCell>
                    <TableCell align="right">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getComparisonData().map((row) => (
                    <TableRow key={row.category}>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">{formatCurrency(row.total)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.avgPerPeriod)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatPercentage(row.trend)}
                          size="small"
                          color={getTrendColor(row.trend)}
                          icon={getTrendIcon(row.trend)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryTrendAnalysis;
