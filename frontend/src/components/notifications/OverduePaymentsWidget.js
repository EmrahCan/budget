import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const OverduePaymentsWidget = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverdueSummary();
  }, []);

  const fetchOverdueSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notifications/overdue/summary');
      setSummary(response.data.data);
    } catch (err) {
      console.error('Failed to fetch overdue summary:', err);
      setError('Gecikmiş ödeme bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (type) => {
    switch (type) {
      case 'fixed_payments':
        navigate('/fixed-payments');
        break;
      case 'credit_cards':
        navigate('/credit-cards');
        break;
      case 'installments':
        navigate('/installments');
        break;
      default:
        break;
    }
  };

  const getDaysOverdueColor = (daysOverdue) => {
    if (daysOverdue >= 7) return 'error';
    if (daysOverdue >= 3) return 'warning';
    return 'warning';
  };

  const getDaysOverdueSeverity = (daysOverdue) => {
    if (daysOverdue >= 7) return 'error';
    return 'warning';
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // If no overdue payments, don't show the widget
  if (!summary || summary.totalCount === 0) {
    return null;
  }

  const mostOverdue = summary.mostOverdue;

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: '2px solid',
        borderColor: mostOverdue && mostOverdue.daysOverdue >= 7 ? 'error.main' : 'warning.main',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon 
              color={mostOverdue && mostOverdue.daysOverdue >= 7 ? 'error' : 'warning'} 
              fontSize="large" 
            />
            <Typography variant="h6" fontWeight="bold">
              Gecikmiş Ödemeler
            </Typography>
          </Box>
          <Chip
            label={`${summary.totalCount} Ödeme`}
            color={mostOverdue && mostOverdue.daysOverdue >= 7 ? 'error' : 'warning'}
            size="small"
          />
        </Box>

        {/* Total Amount */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Toplam Gecikmiş Tutar
          </Typography>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            color={mostOverdue && mostOverdue.daysOverdue >= 7 ? 'error.main' : 'warning.main'}
          >
            {summary.totalAmount.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} TL
          </Typography>
        </Box>

        {/* Most Overdue Payment */}
        {mostOverdue && (
          <Alert 
            severity={getDaysOverdueSeverity(mostOverdue.daysOverdue)}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2" fontWeight="bold">
              En Gecikmiş: {mostOverdue.name}
            </Typography>
            <Typography variant="caption">
              {mostOverdue.daysOverdue} gün gecikti - {mostOverdue.amount.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} TL
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Breakdown by Type */}
        <Box>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => setExpanded(!expanded)}
          >
            <Typography variant="body2" fontWeight="bold">
              Detaylar
            </Typography>
            <IconButton size="small">
              <ExpandMoreIcon 
                sx={{ 
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Box>

          <Collapse in={expanded}>
            <Box mt={2} display="flex" flexDirection="column" gap={1.5}>
              {/* Fixed Payments */}
              {summary.byType.fixedPayments.count > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={1.5}
                  sx={{
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                  onClick={() => handleNavigate('fixed_payments')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <ReceiptIcon color="warning" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Sabit Ödemeler
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {summary.byType.fixedPayments.count} ödeme
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    {summary.byType.fixedPayments.amount.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} TL
                  </Typography>
                </Box>
              )}

              {/* Credit Cards */}
              {summary.byType.creditCards.count > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={1.5}
                  sx={{
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                  onClick={() => handleNavigate('credit_cards')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <CreditCardIcon color="error" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Kredi Kartları
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {summary.byType.creditCards.count} kart
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {summary.byType.creditCards.amount.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} TL
                  </Typography>
                </Box>
              )}

              {/* Installments */}
              {summary.byType.installments.count > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={1.5}
                  sx={{
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                  onClick={() => handleNavigate('installments')}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <PaymentIcon color="warning" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Taksitler
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {summary.byType.installments.count} taksit
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    {summary.byType.installments.amount.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} TL
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OverduePaymentsWidget;
