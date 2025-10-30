import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { processFinancialTrendData, formatChartCurrency } from './chartUtils';
import { CHART_COLORS } from './chartConstants';
import { formatCurrency } from '../../services/api';

const FinancialTrendChart = ({ 
  trendData = [], 
  loading = false, 
  error = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Veriyi işle
  const processedData = useMemo(() => {
    return processFinancialTrendData(trendData);
  }, [trendData]);

  // Özet istatistikler
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) return null;
    
    const totalIncome = processedData.reduce((sum, item) => sum + item.income, 0);
    const totalExpense = processedData.reduce((sum, item) => sum + item.expense, 0);
    const avgIncome = totalIncome / processedData.length;
    const avgExpense = totalExpense / processedData.length;
    const totalNet = totalIncome - totalExpense;
    
    return {
      totalIncome,
      totalExpense,
      avgIncome,
      avgExpense,
      totalNet
    };
  }, [processedData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2,
            minWidth: 200
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {label}
          </Typography>
          
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: entry.color,
                  borderRadius: '50%',
                  mr: 1
                }}
              />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color={entry.color}>
                {formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
          
          <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="textSecondary">
              Net: <span style={{ 
                color: data.net >= 0 ? CHART_COLORS.success : CHART_COLORS.error,
                fontWeight: 'bold'
              }}>
                {formatCurrency(data.net)}
              </span>
            </Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  // Y ekseni formatter
  const formatYAxis = (value) => {
    return formatChartCurrency(value);
  };

  const chartContent = (
    <Box>
      {processedData.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Henüz finansal trend verisi bulunmuyor
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Özet İstatistikler */}
          {summaryStats && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`Toplam Gelir: ${formatCurrency(summaryStats.totalIncome)}`}
                color="success"
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Toplam Gider: ${formatCurrency(summaryStats.totalExpense)}`}
                color="error"
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Net: ${formatCurrency(summaryStats.totalNet)}`}
                color={summaryStats.totalNet >= 0 ? 'success' : 'error'}
                size="small"
                variant="filled"
              />
            </Box>
          )}

          {/* Line Chart */}
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart
              data={processedData}
              margin={isMobile ? 
                { top: 5, right: 5, left: 5, bottom: 5 } :
                { top: 20, right: 30, left: 20, bottom: 5 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                stroke={theme.palette.text.secondary}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tick={{ fontSize: isMobile ? 10 : 12 }}
                stroke={theme.palette.text.secondary}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }}
              />
              
              {/* Gelir Çizgisi */}
              <Line
                type="monotone"
                dataKey="income"
                stroke={CHART_COLORS.income}
                strokeWidth={2}
                name="Gelir"
                dot={{ fill: CHART_COLORS.income, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS.income, strokeWidth: 2 }}
              />
              
              {/* Gider Çizgisi */}
              <Line
                type="monotone"
                dataKey="expense"
                stroke={CHART_COLORS.expense}
                strokeWidth={2}
                name="Gider"
                dot={{ fill: CHART_COLORS.expense, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS.expense, strokeWidth: 2 }}
              />
              
              {/* Net Çizgisi */}
              <Line
                type="monotone"
                dataKey="net"
                stroke={CHART_COLORS.net}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Net"
                dot={{ fill: CHART_COLORS.net, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS.net, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Trend Analizi */}
          {summaryStats && processedData.length >= 2 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Trend Analizi
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="textSecondary">
                  Ortalama Gelir: <strong>{formatCurrency(summaryStats.avgIncome)}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ortalama Gider: <strong>{formatCurrency(summaryStats.avgExpense)}</strong>
                </Typography>
                <Typography 
                  variant="body2" 
                  color={summaryStats.totalNet >= 0 ? 'success.main' : 'error.main'}
                >
                  Genel Durum: <strong>
                    {summaryStats.totalNet >= 0 ? 'Pozitif' : 'Negatif'}
                  </strong>
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  // Loading state
  if (loading) {
    return (
      <ChartWrapper
        title="Son 6 Ay Finansal Trend"
        loading={true}
        height={isMobile ? 450 : 550}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Trend verileri yükleniyor...
          </Typography>
        </Box>
      </ChartWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <ChartWrapper
        title="Son 6 Ay Finansal Trend"
        error={error}
        height={isMobile ? 450 : 550}
      >
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Son 6 Ay Finansal Trend"
      height={isMobile ? 450 : 550}
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default FinancialTrendChart;