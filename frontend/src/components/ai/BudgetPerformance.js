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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  EmojiEvents,
  Lightbulb,
  Assessment,
  Refresh,
  MonetizationOn,
  Savings,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const BudgetPerformance = () => {
  const { showError, showSuccess } = useNotification();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/ai/budget/performance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Bütçe performansı yüklenemedi');
      }
      
      setPerformance(data.data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Budget performance error:', error);
      setError(error.message);
      showError(`Bütçe performansı yüklenemedi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceLabel = (score) => {
    if (score >= 90) return 'Mükemmel';
    if (score >= 70) return 'İyi';
    if (score >= 50) return 'Orta';
    return 'Dikkat Gerekli';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'over_budget':
        return <Error color="error" />;
      default:
        return <CheckCircle />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'on_track':
        return 'Hedefte';
      case 'warning':
        return 'Dikkat';
      case 'over_budget':
        return 'Aşıldı';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track':
        return 'success';
      case 'warning':
        return 'warning';
      case 'over_budget':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'critical':
        return 'Kritik';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Assessment color="primary" />
            <Typography variant="h6">Bütçe Performansı</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
          <Typography variant="body2" color="textSecondary" align="center">
            Bütçe performansınız analiz ediliyor...
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
            <Assessment color="primary" />
            <Typography variant="h6">Bütçe Performansı</Typography>
          </Box>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={loadPerformance}>
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

  if (!performance) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assessment color="primary" />
            <Box>
              <Typography variant="h6">Bütçe Performansı</Typography>
              <Typography variant="caption" color="textSecondary">
                {lastUpdated && `Son güncelleme: ${lastUpdated.toLocaleString('tr-TR')}`}
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<Refresh />}
            onClick={loadPerformance}
            disabled={loading}
            size="small"
          >
            Yenile
          </Button>
        </Box>

        {/* Performance Score */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography variant="h3" color={getPerformanceColor(performance.performanceScore)}>
            {performance.performanceScore}
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Performans Skoru
          </Typography>
          <Chip 
            label={getPerformanceLabel(performance.performanceScore)}
            color={getPerformanceColor(performance.performanceScore)}
            sx={{ mt: 1 }}
          />
        </Paper>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <MonetizationOn color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {performance.totalBudget.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Toplam Bütçe
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <TrendingDown color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {performance.totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Harcanan
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Savings color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {performance.totalRemaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Kalan
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
              <Assessment color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                %{performance.overallUtilization}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Kullanım Oranı
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Achievements */}
        {performance.achievements && performance.achievements.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EmojiEvents color="warning" />
              Başarılar
            </Typography>
            <Grid container spacing={2}>
              {performance.achievements.map((achievement, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EmojiEvents sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {achievement.title}
                        </Typography>
                        <Typography variant="body2">
                          {achievement.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Category Performance */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Kategori Bazında Performans
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {performance.categoriesOnTrack} kategori hedefte, {performance.categoriesOverBudget} kategori bütçe aşımında
          </Typography>
          <List>
            {performance.categoryPerformance.map((category, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(category.status)}
                      <Typography variant="subtitle1" fontWeight="bold">
                        {category.category}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(category.status)}
                        size="small"
                        color={getStatusColor(category.status)}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {category.actualAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ / {category.budgetAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(category.utilizationRate, 100)}
                      color={getStatusColor(category.status)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="caption" color="textSecondary">
                      %{category.utilizationRate} kullanıldı
                    </Typography>
                    <Typography variant="caption" color={category.remaining >= 0 ? 'success.main' : 'error.main'}>
                      {category.remaining >= 0 ? 'Kalan: ' : 'Aşım: '}
                      {Math.abs(category.remaining).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Typography>
                  </Box>
                </ListItem>
                {index < performance.categoryPerformance.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Improvement Suggestions */}
        {performance.improvements && performance.improvements.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Lightbulb color="warning" />
              İyileştirme Önerileri
            </Typography>
            {performance.improvements.map((suggestion, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {suggestion.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip 
                          label={getPriorityLabel(suggestion.priority)}
                          size="small"
                          color={getPriorityColor(suggestion.priority)}
                        />
                        {suggestion.category && (
                          <Chip 
                            label={suggestion.category}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {suggestion.description}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Önerilen Aksiyon:
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {suggestion.action}
                    </Typography>
                    {suggestion.expectedImpact && (
                      <>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Beklenen Etki:
                        </Typography>
                        <Typography variant="body2">
                          {suggestion.expectedImpact}
                        </Typography>
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* AI Disclaimer */}
        <Divider sx={{ my: 3 }} />
        <Alert severity="info">
          <Typography variant="caption">
            Bu performans analizi ve öneriler yapay zeka tarafından üretilmiştir. 
            Finansal kararlar alırken kişisel durumunuzu ve hedeflerinizi göz önünde bulundurun.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default BudgetPerformance;
