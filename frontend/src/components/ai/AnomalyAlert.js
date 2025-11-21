import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Cancel,
  TrendingUp,
  Speed,
  Store,
} from '@mui/icons-material';

const AnomalyAlert = ({ open, onClose, onConfirm, onReject, anomalyData, transaction }) => {
  if (!anomalyData || !transaction) {
    return null;
  }

  const { isAnomaly, riskLevel, explanation, anomalyFactors, profile } = anomalyData;

  const getRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high':
        return <Error color="error" sx={{ fontSize: 48 }} />;
      case 'medium':
        return <Warning color="warning" sx={{ fontSize: 48 }} />;
      case 'low':
      default:
        return <Info color="info" sx={{ fontSize: 48 }} />;
    }
  };

  const getRiskLabel = (level) => {
    switch (level) {
      case 'high':
        return 'Yüksek Risk';
      case 'medium':
        return 'Orta Risk';
      case 'low':
      default:
        return 'Düşük Risk';
    }
  };

  const getFactorIcon = (factor) => {
    switch (factor) {
      case 'unusual_amount':
        return <TrendingUp color="warning" />;
      case 'high_frequency':
        return <Speed color="warning" />;
      case 'unusual_merchant':
        return <Store color="warning" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getFactorLabel = (factor) => {
    switch (factor) {
      case 'unusual_amount':
        return 'Olağandışı Tutar';
      case 'high_frequency':
        return 'Yüksek İşlem Sıklığı';
      case 'unusual_merchant':
        return 'Bilinmeyen İşyeri';
      default:
        return factor;
    }
  };

  const handleConfirmNormal = () => {
    onConfirm(transaction, true);
    onClose();
  };

  const handleConfirmAnomaly = () => {
    onReject(transaction, false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 8,
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getRiskIcon(riskLevel)}
          <Box>
            <Typography variant="h6">Olağandışı İşlem Tespit Edildi</Typography>
            <Chip
              label={getRiskLabel(riskLevel)}
              color={getRiskColor(riskLevel)}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Transaction Details */}
        <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            İşlem Detayları
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Tutar:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Kategori:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {transaction.category}
            </Typography>
          </Box>
          {transaction.description && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Açıklama:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {transaction.description}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Explanation */}
        <Alert severity={getRiskColor(riskLevel)} sx={{ mb: 2 }}>
          <Typography variant="body2">{explanation}</Typography>
        </Alert>

        {/* Anomaly Factors */}
        {anomalyFactors && anomalyFactors.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tespit Edilen Faktörler:
            </Typography>
            <List dense>
              {anomalyFactors.map((factor, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getFactorIcon(factor)}
                  </ListItemIcon>
                  <ListItemText primary={getFactorLabel(factor)} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Profile Comparison */}
        {profile && profile.avgAmount && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Harcama Profili Karşılaştırması:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Ortalama Harcama:
                </Typography>
                <Typography variant="caption">
                  {profile.avgAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Min - Max:
                </Typography>
                <Typography variant="caption">
                  {profile.minAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ -{' '}
                  {profile.maxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="textSecondary">
                  Toplam İşlem:
                </Typography>
                <Typography variant="caption">{profile.transactionCount}</Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Warning Message */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Bu işlem size ait değilse veya şüpheli görünüyorsa "Şüpheli" butonuna tıklayın.
            Aksi takdirde "Normal" butonuna tıklayarak devam edebilirsiniz.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          İptal
        </Button>
        <Button
          onClick={handleConfirmAnomaly}
          variant="outlined"
          color="error"
          startIcon={<Cancel />}
        >
          Şüpheli
        </Button>
        <Button
          onClick={handleConfirmNormal}
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
        >
          Normal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnomalyAlert;
