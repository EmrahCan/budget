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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Collapse,
} from '@mui/material';
import {
  Lightbulb,
  TrendingUp,
  Savings,
  MonetizationOn,
  AccountBalance,
  CheckCircle,
  Close,
  ExpandMore,
  ExpandLess,
  Refresh,
  Star,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../services/api';

const AIRecommendations = () => {
  const { showError, showSuccess } = useNotification();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRec, setExpandedRec] = useState(null);
  const [dismissedRecs, setDismissedRecs] = useState(new Set());
  const [totalPotentialSavings, setTotalPotentialSavings] = useState(0);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // AI Analysis endpoint for recommendations
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/reports/enhanced/ai-analysis`, {
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
        throw new Error(data.message || 'AI önerileri yüklenemedi');
      }
      
      if (data.success) {
        // Insights'ları recommendations olarak kullan (mock data için)
        const insights = data.data.insights || [];
        setRecommendations(insights.map((insight, index) => ({
          id: index + 1,
          type: insight.type === 'spending_pattern' ? 'cost_reduction' : 
                insight.type === 'budget_alert' ? 'budget' : 
                insight.type === 'saving_opportunity' ? 'saving' : 'budget',
          title: insight.title,
          description: insight.description,
          priority: insight.severity === 'critical' ? 'high' : 
                   insight.severity === 'warning' ? 'medium' : 'low',
          estimatedSavings: 0,
          timeframe: 'aylık',
          actionSteps: insight.recommendations || []
        })));
        setTotalPotentialSavings(0);
      } else {
        throw new Error(data.message || 'AI önerileri alınamadı');
      }
      
    } catch (error) {
      console.error('AI Recommendations error:', error);
      setError(error.message);
      showError(`AI önerileri yüklenemedi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'budget':
        return <AccountBalance color="primary" />;
      case 'saving':
        return <Savings color="success" />;
      case 'investment':
        return <TrendingUp color="info" />;
      case 'cost_reduction':
        return <MonetizationOn color="warning" />;
      default:
        return <Lightbulb color="primary" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'high': 'Yüksek Öncelik',
      'medium': 'Orta Öncelik',
      'low': 'Düşük Öncelik'
    };
    return labels[priority] || 'Öncelik';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'budget': 'Bütçe Optimizasyonu',
      'saving': 'Tasarruf Stratejisi',
      'investment': 'Yatırım Önerisi',
      'cost_reduction': 'Maliyet Azaltma'
    };
    return labels[type] || 'Öneri';
  };

  const handleExpandRec = (recId) => {
    setExpandedRec(expandedRec === recId ? null : recId);
  };

  const handleDismissRec = (recId) => {
    setDismissedRecs(prev => new Set([...prev, recId]));
    showSuccess('Öneri gizlendi');
  };

  const handleAcceptRec = (rec) => {
    // Implement recommendation acceptance logic
    showSuccess(`"${rec.title}" önerisi kabul edildi`);
  };

  const visibleRecommendations = recommendations.filter(rec => !dismissedRecs.has(rec.id));

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Lightbulb color="primary" />
            <Typography variant="h6">AI Finansal Önerileri</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
          <Typography variant="body2" color="textSecondary" align="center">
            Kişiselleştirilmiş öneriler hazırlanıyor...
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
            <Lightbulb color="primary" />
            <Typography variant="h6">AI Finansal Önerileri</Typography>
          </Box>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={loadRecommendations}>
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
            <Lightbulb color="primary" />
            <Box>
              <Typography variant="h6">AI Finansal Önerileri</Typography>
              <Typography variant="caption" color="textSecondary">
                Kişiselleştirilmiş finansal öneriler
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<Refresh />}
            onClick={loadRecommendations}
            disabled={loading}
            size="small"
          >
            Yenile
          </Button>
        </Box>

        {/* Potential Savings Summary */}
        {totalPotentialSavings > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Star />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Toplam Potansiyel Tasarruf
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(totalPotentialSavings)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {visibleRecommendations.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">
              Şu anda öneriniz bulunmuyor. Daha fazla işlem yaptıkça AI size özel öneriler sunacak.
            </Typography>
          </Alert>
        ) : (
          <List>
            {visibleRecommendations.map((rec, index) => (
              <React.Fragment key={rec.id}>
                <ListItem
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Recommendation Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
                    <ListItemIcon>
                      {getRecommendationIcon(rec.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {rec.title}
                          </Typography>
                          <Chip 
                            label={getTypeLabel(rec.type)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={getPriorityLabel(rec.priority)}
                            size="small"
                            color={getPriorityColor(rec.priority)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            {rec.description}
                          </Typography>
                          {rec.estimatedSavings > 0 && (
                            <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                              Tahmini tasarruf: {formatCurrency(rec.estimatedSavings)} / {rec.timeframe}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          onClick={() => handleExpandRec(rec.id)}
                          size="small"
                        >
                          {expandedRec === rec.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDismissRec(rec.id)}
                          size="small"
                          color="error"
                        >
                          <Close />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </Box>

                  {/* Expanded Content */}
                  <Collapse in={expandedRec === rec.id}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
                      {rec.actionSteps && rec.actionSteps.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Uygulama Adımları:
                          </Typography>
                          <List dense>
                            {rec.actionSteps.map((step, stepIndex) => (
                              <ListItem key={stepIndex} sx={{ pl: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <Typography variant="body2" color="primary" fontWeight="bold">
                                    {stepIndex + 1}.
                                  </Typography>
                                </ListItemIcon>
                                <ListItemText 
                                  primary={step}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAcceptRec(rec)}
                        >
                          Kabul Et
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleDismissRec(rec.id)}
                        >
                          Gizle
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </ListItem>
                {index < visibleRecommendations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* AI Disclaimer */}
        <Divider sx={{ my: 3 }} />
        <Alert severity="info">
          <Typography variant="caption">
            Bu öneriler yapay zeka tarafından üretilmiştir ve kişisel finansal durumunuza göre özelleştirilmiştir. 
            Önemli finansal kararlar alırken profesyonel danışmanlık alınması önerilir.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;