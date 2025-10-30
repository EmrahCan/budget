import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  AccountBalance,
  Savings,
  Security,
  Assessment,
  Info
} from '@mui/icons-material';
import ChartWrapper from './ChartWrapper';
import { calculateFinancialMetrics } from './chartUtils';
import { formatCurrency } from '../../services/api';

const FinancialMetricsWidget = ({ 
  metricsData = {}, 
  loading = false, 
  error = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Finansal metrikleri hesapla
  const calculatedMetrics = useMemo(() => {
    return calculateFinancialMetrics(metricsData);
  }, [metricsData]);

  // Metrik tanımları
  const metrics = useMemo(() => [
    {
      id: 'debtToIncomeRatio',
      title: 'Borç/Gelir Oranı',
      value: calculatedMetrics.debtToIncomeRatio,
      format: 'percentage',
      threshold: { excellent: 20, good: 30, warning: 50 },
      icon: <AccountBalance />,
      description: 'Toplam borcunuzun yıllık gelirinize oranı. %30\'un altında olması önerilir.',
      unit: '%'
    },
    {
      id: 'savingsRate',
      title: 'Tasarruf Oranı',
      value: calculatedMetrics.savingsRate,
      format: 'percentage',
      threshold: { excellent: 30, good: 20, warning: 10 },
      icon: <Savings />,
      description: 'Gelirinizin ne kadarını tasarruf ettiğinizi gösterir. %20\'nin üstünde olması önerilir.',
      unit: '%'
    },
    {
      id: 'emergencyFundMonths',
      title: 'Acil Durum Fonu',
      value: calculatedMetrics.emergencyFundMonths,
      format: 'months',
      threshold: { excellent: 6, good: 3, warning: 1 },
      icon: <Security />,
      description: 'Acil durum fonunuzun kaç aylık giderinizi karşılayabileceğini gösterir. 6 ay önerilir.',
      unit: ' ay'
    },
    {
      id: 'netWorth',
      title: 'Net Değer',
      value: calculatedMetrics.netWorth,
      format: 'currency',
      threshold: { excellent: 100000, good: 50000, warning: 0 },
      icon: <Assessment />,
      description: 'Toplam varlıklarınızdan toplam borçlarınızı çıkardığınızda kalan tutar.',
      unit: ''
    }
  ], [calculatedMetrics]);

  // Metrik durumunu belirle
  const getMetricStatus = (value, threshold, isReverse = false) => {
    if (isReverse) {
      // Borç oranı gibi düşük olması gereken metrikler için
      if (value <= threshold.excellent) return 'excellent';
      if (value <= threshold.good) return 'good';
      if (value <= threshold.warning) return 'warning';
      return 'poor';
    } else {
      // Tasarruf oranı gibi yüksek olması gereken metrikler için
      if (value >= threshold.excellent) return 'excellent';
      if (value >= threshold.good) return 'good';
      if (value >= threshold.warning) return 'warning';
      return 'poor';
    }
  };

  // Durum rengini al
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  // Durum ikonunu al
  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return <CheckCircle />;
      case 'good': return <TrendingUp />;
      case 'warning': return <Warning />;
      case 'poor': return <TrendingDown />;
      default: return <Info />;
    }
  };

  // Durum metnini al
  const getStatusText = (status) => {
    switch (status) {
      case 'excellent': return 'Mükemmel';
      case 'good': return 'İyi';
      case 'warning': return 'Dikkat';
      case 'poor': return 'Kötü';
      default: return 'Bilinmiyor';
    }
  };

  // Değeri formatla
  const formatMetricValue = (value, format) => {
    switch (format) {
      case 'percentage':
        return `%${value.toFixed(1)}`;
      case 'months':
        return `${value.toFixed(1)} ay`;
      case 'currency':
        return formatCurrency(value);
      default:
        return value.toString();
    }
  };

  // Genel finansal sağlık skoru
  const overallHealthScore = useMemo(() => {
    const scores = metrics.map(metric => {
      const isReverse = metric.id === 'debtToIncomeRatio';
      const status = getMetricStatus(metric.value, metric.threshold, isReverse);
      
      switch (status) {
        case 'excellent': return 100;
        case 'good': return 75;
        case 'warning': return 50;
        case 'poor': return 25;
        default: return 0;
      }
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [metrics]);

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const widgetContent = (
    <Box>
      {/* Genel Finansal Sağlık Skoru */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, textAlign: 'center' }}>
        <Typography variant="subtitle2" gutterBottom>
          Finansal Sağlık Skoru
        </Typography>
        
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={overallHealthScore}
            color={getHealthScoreColor(overallHealthScore)}
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              width: 200,
              transform: 'rotate(-90deg)',
              transformOrigin: 'center'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Typography 
              variant="h4" 
              component="div" 
              color={getHealthScoreColor(overallHealthScore) + '.main'}
              fontWeight="bold"
            >
              {overallHealthScore}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary">
          {overallHealthScore >= 80 ? 'Mükemmel finansal durum' :
           overallHealthScore >= 60 ? 'İyi finansal durum' :
           overallHealthScore >= 40 ? 'Orta finansal durum' : 'Dikkat gereken finansal durum'}
        </Typography>
      </Box>

      {/* Metrikler */}
      <Grid container spacing={2}>
        {metrics.map((metric) => {
          const isReverse = metric.id === 'debtToIncomeRatio';
          const status = getMetricStatus(metric.value, metric.threshold, isReverse);
          const statusColor = getStatusColor(status);
          const statusIcon = getStatusIcon(status);
          const statusText = getStatusText(status);
          
          return (
            <Grid item xs={12} sm={6} key={metric.id}>
              <Box sx={{ 
                p: 2, 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1,
                height: '100%'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: statusColor + '.main',
                      width: 32,
                      height: 32,
                      mr: 2
                    }}
                  >
                    {metric.icon}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Tooltip title={metric.description} arrow>
                      <Typography variant="body2" color="textSecondary" sx={{ cursor: 'help' }}>
                        {metric.title}
                        <Info sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Typography 
                  variant="h5" 
                  color={statusColor + '.main'}
                  fontWeight="bold"
                  gutterBottom
                >
                  {formatMetricValue(metric.value, metric.format)}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={statusText}
                    color={statusColor}
                    size="small"
                    icon={statusIcon}
                  />
                  
                  {/* Hedef göstergesi */}
                  <Typography variant="caption" color="textSecondary">
                    Hedef: {metric.format === 'percentage' ? '%' : ''}
                    {isReverse ? 
                      `<${metric.threshold.good}${metric.unit}` : 
                      `>${metric.threshold.good}${metric.unit}`
                    }
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Öneriler */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 Finansal Sağlık Önerileri
        </Typography>
        
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {overallHealthScore < 60 && (
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Acil durum fonu oluşturmaya öncelik verin
            </Typography>
          )}
          {calculatedMetrics.debtToIncomeRatio > 30 && (
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Borç/gelir oranınızı %30'un altına indirmeye çalışın
            </Typography>
          )}
          {calculatedMetrics.savingsRate < 20 && (
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Tasarruf oranınızı artırmak için harcamalarınızı gözden geçirin
            </Typography>
          )}
          {overallHealthScore >= 80 && (
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Harika! Finansal durumunuz çok iyi. Yatırım seçeneklerini değerlendirebilirsiniz
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <ChartWrapper
      title="Finansal Metrikler"
      loading={loading}
      error={error}
      height={isMobile ? 600 : 700}
    >
      {widgetContent}
    </ChartWrapper>
  );
};

export default FinancialMetricsWidget;