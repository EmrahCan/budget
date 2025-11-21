import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  CheckCircle,
  Lightbulb,
  Psychology,
  Analytics,
  Refresh,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const AIInsightsDashboard = ({ timeframe = 'monthly' }) => {
  const { showError, showSuccess } = useNotification();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadInsights();
  }, [timeframe]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // AI Analysis endpoint
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/reports/enhanced/ai-analysis?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'AI insights yüklenemedi');
      }
      
      if (data.success) {
        setInsights(data.data.insights || []);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.message || 'AI insights alınamadı');
      }
      
    } catch (error) {
      console.error('AI Insights error:', error);
      setError(error.message);
      showError(`AI insights yüklenemedi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'spending_pattern':
        return <Analytics color="primary" />;
      case 'budget_alert':
        return <Warning color="warning" />;
      case 'unusual_transaction':
        return <Info color="info" />;
      case 'saving_opportunity':
        return <TrendingUp color="success" />;
      case 'trend_analysis':
        return <TrendingDown color="secondary" />;
      default:
        return <Psychology color="primary" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const getInsightTypeLabel = (type) => {
    const labels = {
      'spending_pattern': 'Harcama Deseni',
      'budget_alert': 'Bütçe Uyarısı',
      'unusual_transaction': 'Olağandışı İşlem',
      'saving_opportunity': 'Tasarruf Fırsatı',
      'trend_analysis': 'Trend Analizi'
    };
    return labels[type] || 'AI Analizi';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Psychology color="primary" />
            <Typography variant="h6">AI Finansal Analizi</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
          <Typography variant="body2" color="textSecondary" align="center">
            AI finansal verilerinizi analiz ediyor...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Psychology color="primary" />
            <Typography variant="h6">AI Finansal Analizi</Typography>
          </Box>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={loadInsights}>
                Tekrar Dene
              </Button>
            }
          >
            {error}
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
            <Psychology color="primary" />
            <Box>
              <Typography variant="h6">AI Finansal Analizi</Typography>
              <Typography variant="caption" color="textSecondary">
                {lastUpdated && `Son güncelleme: ${lastUpdated.toLocaleString('tr-TR')}`}
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<Refresh />}
            onClick={loadInsights}
            disabled={loading}
            size="small"
          >
            Yenile
          </Button>
        </Box>

        {insights.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">
              Henüz yeterli veri bulunmuyor. AI analizi için daha fazla işlem gerekiyor.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {insights.map((insight, index) => (
              <Grid item xs={12} key={index}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {getInsightIcon(insight.type)}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {insight.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={getInsightTypeLabel(insight.type)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={insight.severity === 'critical' ? 'Kritik' : 
                                   insight.severity === 'warning' ? 'Uyarı' : 'Bilgi'}
                            size="small"
                            color={getSeverityColor(insight.severity)}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 5 }}>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {insight.description}
                      </Typography>
                      
                      {insight.actionable && insight.recommendations && insight.recommendations.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Lightbulb color="warning" fontSize="small" />
                            Öneriler:
                          </Typography>
                          <List dense>
                            {insight.recommendations.map((rec, recIndex) => (
                              <ListItem key={recIndex} sx={{ pl: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircle color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={rec}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        )}

        {/* AI Disclaimer */}
        <Divider sx={{ my: 3 }} />
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Bu analizler yapay zeka tarafından üretilmiştir ve yalnızca bilgilendirme amaçlıdır. 
            Finansal kararlar alırken profesyonel danışmanlık alınması önerilir.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AIInsightsDashboard;