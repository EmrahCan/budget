import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add,
  Terrain,
  Edit,
  Delete,
  Payment,
  History,
  Warning,
  CheckCircle,
  LocationOn,
  CalendarToday,
  TrendingUp,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { landPaymentsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';

const LandPaymentsPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [landPayments, setLandPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingLand, setEditingLand] = useState(null);
  const [selectedLand, setSelectedLand] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    landName: '',
    location: '',
    adaNo: '',
    parselNo: '',
    totalPrice: '',
    monthlyInstallment: '',
    installmentCount: '',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
    contractNumber: '',
    notes: '',
  });
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
    receiptNumber: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [landPaymentsRes, summaryRes] = await Promise.allSettled([
        landPaymentsAPI.getAll(),
        landPaymentsAPI.getSummary(),
      ]);
      
      if (landPaymentsRes.status === 'fulfilled') {
        setLandPayments(landPaymentsRes.value.data.data);
      }
      
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data.data);
      }
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (land = null) => {
    if (land) {
      setEditingLand(land);
      setFormData({
        landName: land.landName,
        location: land.location || '',
        adaNo: land.adaNo || '',
        parselNo: land.parselNo || '',
        totalPrice: land.totalPrice.toString(),
        monthlyInstallment: land.monthlyInstallment.toString(),
        installmentCount: land.installmentCount.toString(),
        interestRate: land.interestRate.toString(),
        startDate: land.startDate ? land.startDate.split('T')[0] : '',
        contractNumber: land.contractNumber || '',
        notes: land.notes || '',
      });
    } else {
      setEditingLand(null);
      setFormData({
        landName: '',
        location: '',
        adaNo: '',
        parselNo: '',
        totalPrice: '',
        monthlyInstallment: '',
        installmentCount: '',
        interestRate: '0',
        startDate: new Date().toISOString().split('T')[0],
        contractNumber: '',
        notes: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLand(null);
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.landName.trim()) {
      errors.landName = 'Arsa adı gereklidir';
    }
    
    if (!formData.totalPrice || isNaN(parseFloat(formData.totalPrice)) || parseFloat(formData.totalPrice) <= 0) {
      errors.totalPrice = 'Geçerli bir toplam fiyat giriniz';
    }
    
    if (!formData.monthlyInstallment || isNaN(parseFloat(formData.monthlyInstallment)) || parseFloat(formData.monthlyInstallment) <= 0) {
      errors.monthlyInstallment = 'Geçerli bir aylık taksit tutarı giriniz';
    }
    
    if (!formData.installmentCount || isNaN(parseInt(formData.installmentCount)) || parseInt(formData.installmentCount) <= 0) {
      errors.installmentCount = 'Geçerli bir taksit sayısı giriniz';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Başlangıç tarihi gereklidir';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const landData = {
        landName: formData.landName.trim(),
        location: formData.location.trim() || null,
        adaNo: formData.adaNo.trim() || null,
        parselNo: formData.parselNo.trim() || null,
        totalPrice: parseFloat(formData.totalPrice),
        monthlyInstallment: parseFloat(formData.monthlyInstallment),
        installmentCount: parseInt(formData.installmentCount),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        contractNumber: formData.contractNumber.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingLand) {
        await landPaymentsAPI.update(editingLand.id, landData);
        showSuccess('Arsa ödemesi başarıyla güncellendi');
      } else {
        await landPaymentsAPI.create(landData);
        showSuccess('Arsa ödemesi başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLand = async (land) => {
    if (window.confirm(`"${land.landName}" arsa ödemesini silmek istediğinizden emin misiniz?`)) {
      try {
        await landPaymentsAPI.delete(land.id);
        showSuccess('Arsa ödemesi başarıyla silindi');
        loadData();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  // Payment functions
  const handleOpenPaymentDialog = (land) => {
    setSelectedLand(land);
    setPaymentData({
      amount: land.monthlyInstallment?.toString() || '',
      paymentDate: new Date().toISOString().split('T')[0],
      description: `${land.landName} - ${land.paidInstallments + 1}. taksit ödemesi`,
      receiptNumber: '',
    });
    setPaymentErrors({});
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedLand(null);
    setPaymentErrors({});
  };

  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    if (paymentErrors[field]) {
      setPaymentErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePayment = () => {
    const errors = {};
    
    if (!paymentData.amount || isNaN(parseFloat(paymentData.amount)) || parseFloat(paymentData.amount) <= 0) {
      errors.amount = 'Geçerli bir ödeme tutarı giriniz';
    }
    
    if (!paymentData.paymentDate) {
      errors.paymentDate = 'Ödeme tarihi gereklidir';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePayment()) return;

    try {
      setSubmitting(true);
      
      const payment = {
        amount: parseFloat(paymentData.amount),
        paymentDate: paymentData.paymentDate,
        description: paymentData.description.trim() || `${selectedLand.landName} taksit ödemesi`,
        receiptNumber: paymentData.receiptNumber.trim() || null,
      };

      await landPaymentsAPI.recordPayment(selectedLand.id, payment);
      showSuccess('Ödeme başarıyla kaydedildi');
      
      handleClosePaymentDialog();
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  // History functions
  const handleOpenHistoryDialog = async (land) => {
    try {
      setSelectedLand(land);
      const response = await landPaymentsAPI.getPaymentHistory(land.id);
      setPaymentHistory(response.data.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedLand(null);
    setPaymentHistory([]);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Arsa Ödemelerim
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Arsa taksitlerini ve ödeme planlarınızı yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Arsa Ekle
          </Button>
        </Box>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Terrain />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Yatırım
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(summary.totalInvestment)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {summary.activeLands} aktif arsa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <CheckCircle />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Ödenen Tutar
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="success.main">
                    {formatCurrency(summary.totalPaid)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    %{summary.completionPercentage} tamamlandı
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Kalan Borç
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="warning.main">
                    {formatCurrency(summary.totalRemaining)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Ödenmesi gereken
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <CalendarToday />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Aylık Toplam
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="info.main">
                    {formatCurrency(summary.monthlyTotal)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Aylık taksit toplamı
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Land Payments Grid */}
        {landPayments.length > 0 ? (
          <Grid container spacing={3}>
            {landPayments.map((land) => (
              <Grid item xs={12} md={6} lg={4} key={land.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <Terrain />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {land.landName}
                        </Typography>
                        {land.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" color="textSecondary" noWrap>
                              {land.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(land)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLand(land)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Ada/Parsel Info */}
                    {(land.adaNo || land.parselNo) && (
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Ada: {land.adaNo || '-'} • Parsel: {land.parselNo || '-'}
                      </Typography>
                    )}

                    {/* Total Investment */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Toplam Yatırım
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ mb: 2 }}
                    >
                      {formatCurrency(land.totalPrice)}
                    </Typography>

                    {/* Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          İlerleme
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          %{land.completionPercentage}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={land.completionPercentage}
                        color={land.completionPercentage > 80 ? 'success' : land.completionPercentage > 50 ? 'primary' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Payment Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Ödenen
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(land.paidAmount)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Kalan
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {formatCurrency(land.remainingAmount)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Taksit ({land.paidInstallments}/{land.installmentCount})
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(land.monthlyInstallment)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Next Payment */}
                    {land.nextPaymentDate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Sonraki Ödeme
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday fontSize="small" />
                          <Typography variant="body2">
                            {formatDate(land.nextPaymentDate)}
                          </Typography>
                          {land.daysUntilPayment !== null && (
                            <Chip
                              label={land.isOverdue ? 'Gecikmiş' : `${land.daysUntilPayment} gün`}
                              size="small"
                              color={land.isOverdue ? 'error' : land.daysUntilPayment <= 7 ? 'warning' : 'primary'}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Status Chips */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {land.isOverdue && (
                        <Chip label="Ödeme Gecikmiş" color="error" size="small" icon={<Warning />} />
                      )}
                      {land.completionPercentage === 100 && (
                        <Chip label="Tamamlandı" color="success" size="small" icon={<CheckCircle />} />
                      )}
                      {land.contractNumber && (
                        <Chip label={`Sözleşme: ${land.contractNumber}`} size="small" />
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Payment />}
                        onClick={() => handleOpenPaymentDialog(land)}
                        disabled={land.completionPercentage === 100}
                        fullWidth
                      >
                        Ödeme Yap
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<History />}
                        onClick={() => handleOpenHistoryDialog(land)}
                        fullWidth
                      >
                        Geçmiş
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Terrain sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Henüz arsa ödemesi eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                İlk arsa ödemenizi ekleyerek başlayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                İlk Arsa Ödemesini Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Land Payment Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingLand ? 'Arsa Ödemesi Düzenle' : 'Yeni Arsa Ödemesi Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Arsa Adı"
                    value={formData.landName}
                    onChange={(e) => handleFormChange('landName', e.target.value)}
                    error={!!formErrors.landName}
                    helperText={formErrors.landName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Konum"
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Ada No"
                    value={formData.adaNo}
                    onChange={(e) => handleFormChange('adaNo', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Parsel No"
                    value={formData.parselNo}
                    onChange={(e) => handleFormChange('parselNo', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Toplam Fiyat"
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => handleFormChange('totalPrice', e.target.value)}
                    error={!!formErrors.totalPrice}
                    helperText={formErrors.totalPrice}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Aylık Taksit"
                    type="number"
                    value={formData.monthlyInstallment}
                    onChange={(e) => handleFormChange('monthlyInstallment', e.target.value)}
                    error={!!formErrors.monthlyInstallment}
                    helperText={formErrors.monthlyInstallment}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Taksit Sayısı"
                    type="number"
                    value={formData.installmentCount}
                    onChange={(e) => handleFormChange('installmentCount', e.target.value)}
                    error={!!formErrors.installmentCount}
                    helperText={formErrors.installmentCount}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Faiz Oranı (%)"
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => handleFormChange('interestRate', e.target.value)}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Başlangıç Tarihi"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    error={!!formErrors.startDate}
                    helperText={formErrors.startDate}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sözleşme No"
                    value={formData.contractNumber}
                    onChange={(e) => handleFormChange('contractNumber', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notlar"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : (editingLand ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Arsa Taksit Ödemesi - {selectedLand?.landName}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedLand && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(selectedLand.remainingAmount)}
                    <br />
                    <strong>Aylık Taksit:</strong> {formatCurrency(selectedLand.monthlyInstallment)}
                    <br />
                    <strong>Taksit:</strong> {selectedLand.paidInstallments + 1} / {selectedLand.installmentCount}
                  </Typography>
                </Alert>
              )}

              <TextField
                fullWidth
                label="Ödeme Tutarı"
                type="number"
                value={paymentData.amount}
                onChange={(e) => handlePaymentChange('amount', e.target.value)}
                error={!!paymentErrors.amount}
                helperText={paymentErrors.amount}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                sx={{ mb: 3 }}
              />

              {/* Quick Payment Options */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', selectedLand?.monthlyInstallment?.toString() || '')}
                >
                  Normal Taksit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', (selectedLand?.monthlyInstallment * 2)?.toString() || '')}
                >
                  2 Taksit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', selectedLand?.remainingAmount?.toString() || '')}
                >
                  Kalan Tümü
                </Button>
              </Box>

              <TextField
                fullWidth
                label="Ödeme Tarihi"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => handlePaymentChange('paymentDate', e.target.value)}
                error={!!paymentErrors.paymentDate}
                helperText={paymentErrors.paymentDate}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Makbuz No"
                value={paymentData.receiptNumber}
                onChange={(e) => handlePaymentChange('receiptNumber', e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Açıklama"
                value={paymentData.description}
                onChange={(e) => handlePaymentChange('description', e.target.value)}
                multiline
                rows={2}
                helperText="İsteğe bağlı"
              />

              {selectedLand && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Ödeme Sonrası Tahmini Durum:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(Math.max(0, selectedLand.remainingAmount - (parseFloat(paymentData.amount) || 0)))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tamamlanma:</strong> %{Math.min(100, ((selectedLand.paidAmount + (parseFloat(paymentData.amount) || 0)) / selectedLand.totalPrice * 100).toFixed(1))}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePaymentDialog}>İptal</Button>
            <Button
              onClick={handlePaymentSubmit}
              variant="contained"
              disabled={submitting}
              startIcon={<Payment />}
            >
              {submitting ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={historyDialogOpen} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Ödeme Geçmişi - {selectedLand?.landName}
          </DialogTitle>
          <DialogContent>
            {paymentHistory.length > 0 ? (
              <List>
                {paymentHistory.map((payment) => (
                  <ListItem key={payment.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                        <Payment fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${payment.installment_number}. Taksit - ${formatCurrency(payment.amount)}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(payment.payment_date)}
                          </Typography>
                          {payment.description && (
                            <Typography variant="body2" color="textSecondary">
                              {payment.description}
                            </Typography>
                          )}
                          {payment.receipt_number && (
                            <Typography variant="body2" color="textSecondary">
                              Makbuz: {payment.receipt_number}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Payment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Henüz ödeme yapılmamış
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHistoryDialog}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default LandPaymentsPage;