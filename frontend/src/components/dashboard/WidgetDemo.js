import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CreditCard,
  Receipt,
  Warning,
} from '@mui/icons-material';

// Demo widget component
const WidgetDemo = ({ type, title, data = {} }) => {
  const renderContent = () => {
    switch (type) {
      case 'summary_cards':
        return (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: 32, height: 32 }}>
                  <AccountBalance fontSize="small" />
                </Avatar>
                <Typography variant="h6">₺25,430</Typography>
                <Typography variant="caption" color="textSecondary">
                  Toplam Bakiye
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ textAlign: 'center', p: 1 }}>
                <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 1, width: 32, height: 32 }}>
                  <CreditCard fontSize="small" />
                </Avatar>
                <Typography variant="h6" color="error.main">₺8,250</Typography>
                <Typography variant="caption" color="textSecondary">
                  Kredi Kartı Borcu
                </Typography>
              </Card>
            </Grid>
          </Grid>
        );

      case 'payment_calendar':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              📅 Ödeme Takvimi
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Bu ay 5 ödeme planlandı
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Chip label="15 Kasım" color="warning" size="small" />
              <Chip label="20 Kasım" color="error" size="small" />
            </Box>
          </Box>
        );

      case 'expense_chart':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              📊 Kategori Harcamaları
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <Box>
                <Typography variant="body2" color="primary.main">Yemek</Typography>
                <Typography variant="h6">₺2,450</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="warning.main">Ulaşım</Typography>
                <Typography variant="h6">₺850</Typography>
              </Box>
            </Box>
          </Box>
        );

      case 'trend_chart':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              📈 Finansal Trend
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
              Son 6 ayda %12 artış
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={75} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        );

      case 'recent_transactions':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Son İşlemler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'error.main', width: 24, height: 24 }}>
                    <Receipt fontSize="small" />
                  </Avatar>
                  <Typography variant="body2">Market alışverişi</Typography>
                </Box>
                <Typography variant="body2" color="error.main">-₺125</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24 }}>
                    <TrendingUp fontSize="small" />
                  </Avatar>
                  <Typography variant="body2">Maaş</Typography>
                </Box>
                <Typography variant="body2" color="success.main">+₺5,000</Typography>
              </Box>
            </Box>
          </Box>
        );

      case 'upcoming_payments':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Yaklaşan Ödemeler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 24, height: 24 }}>
                    <CreditCard fontSize="small" />
                  </Avatar>
                  <Typography variant="body2">Ziraat Kredi Kartı</Typography>
                </Box>
                <Chip label="3 gün" color="warning" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'error.main', width: 24, height: 24 }}>
                    <Warning fontSize="small" />
                  </Avatar>
                  <Typography variant="body2">Akbank Kredi Kartı</Typography>
                </Box>
                <Chip label="Gecikmiş" color="error" size="small" />
              </Box>
            </Box>
          </Box>
        );

      case 'net_worth':
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Net Değer
            </Typography>
            <Typography variant="h4" color="success.main" sx={{ mb: 1 }}>
              ₺17,180
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Toplam varlık - Toplam borç
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Bu Ay</Typography>
                <Typography variant="body2" color="success.main">+₺1,250</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Geçen Ay</Typography>
                <Typography variant="body2">₺15,930</Typography>
              </Box>
            </Box>
          </Box>
        );

      case 'quick_actions':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Hızlı İşlemler
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Card sx={{ p: 1, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Typography variant="body2">+ İşlem</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ p: 1, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Typography variant="body2">+ Hesap</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ p: 1, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Typography variant="body2">+ Kart</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ p: 1, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Typography variant="body2">📊 Rapor</Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Widget içeriği yükleniyor...
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', p: 2 }}>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default WidgetDemo;