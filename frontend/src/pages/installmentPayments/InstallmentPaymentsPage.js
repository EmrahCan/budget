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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Payment,
  Edit,
  Delete,
  History,
  Warning,
  CheckCircle,
  CalendarToday,
  TrendingUp,
  ShoppingCart,
  DirectionsCar,
  PhoneIphone,
  School,
  Home,
  Computer,
  Category,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { installmentPaymentsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';

// Category icons mapping
const categoryIcons = {
  'Teknoloji': <PhoneIphone />,
  'Araba': <DirectionsCar />,
  'Eğitim': <School />,
  'Ev & Yaşam': <Home />,
  'Bilgisayar': <Computer />,
  'Alışveriş': <ShoppingCart />,
  'Diğer': <Category />
};

const InstallmentPaymentsPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [installmentPayments, setInstallmentPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    totalAmount: '',
    installmentAmount: '',
    totalInstallments: '',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
    vendor: '',
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

  const categories = [
    'Teknoloji',
    'Araba', 
    'Eğitim',
    'Ev & Yaşam',
    'Bilgisayar',
    'Alışveriş',
    'Diğer'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes] = await Promise.allSettled([
        installmentPaymentsAPI.getAll(),
        installmentPaymentsAPI.getSummary(),
      ]);
      
      if (paymentsRes.status === 'fulfilled') {
        setInstallmentPayments(paymentsRes.value.data.data);
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

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        itemName: payment.itemName,
        category: payment.category || '',
        totalAmount: payment.totalAmount.toString(),
        installmentAmount: payment.installmentAmount.toString(),
        totalInstallments: payment.totalInstallments.toString(),
        interestRate: payment.interestRate.toString(),
        startDate: payment.startDate ? payment.startDate.split('T')[0] : '',
        vendor: payment.vendor || '',
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        itemName: '',
        category: '',
        totalAmount: '',
        installmentAmount: '',
        totalInstallments: '',
        interestRate: '0',
        startDate: new Date().toISOString().split('T')[0],
        vendor: '',
        notes: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPayment(null);
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
    
    if (!formData.itemName.trim()) {
      errors.itemName = 'Ürün/hizmet adı gereklidir';
    }
    
    if (!formData.totalAmount || isNaN(parseFloat(formData.totalAmount)) || parseFloat(formData.totalAmount) <= 0) {
      errors.totalAmount = 'Geçerli bir toplam tutar giriniz';
    }
    
    if (!formData.installmentAmount || isNaN(parseFloat(formData.installmentAmount)) || parseFloat(formData.installmentAmount) <= 0) {
      errors.installmentAmount = 'Geçerli bir taksit tutarı giriniz';
    }
    
    if (!formData.totalInstallments || isNaN(parseInt(formData.totalInstallments)) || parseInt(formData.totalInstallments) <= 0) {
      errors.totalInstallments = 'Geçerli bir taksit sayısı giriniz';
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
      
      const paymentData = {
        itemName: formData.itemName.trim(),
        category: formData.category || null,
        totalAmount: parseFloat(formData.totalAmount),
        installmentAmount: parseFloat(formData.installmentAmount),
        totalInstallments: parseInt(formData.totalInstallments),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        vendor: formData.vendor.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingPayment) {
        await installmentPaymentsAPI.update(editingPayment.id, paymentData);
        showSuccess('Taksitli ödeme başarıyla güncellendi');
      } else {
        await installmentPaymentsAPI.create(paymentData);
        showSuccess('Taksitli ödeme başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`"${payment.itemName}" taksitli ödemesini silmek istediğinizden emin misiniz?`)) {
      try {
        await installmentPaymentsAPI.delete(payment.id);
        showSuccess('Taksitli ödeme başarıyla silindi');
        loadData();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  // Payment functions
  const handleOpenPaymentDialog = (payment) => {
    setSelectedPayment(payment);
    setPaymentData({
      amount: payment.installmentAmount?.toString() || '',
      paymentDate: new Date().toISOString().split('T')[0],
      description: `${payment.itemName} - ${payment.paidInstallments + 1}. taksit`,
      receiptNumber: '',
    });
    setPaymentErrors({});
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedPayment(null);
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
        description: paymentData.description.trim() || `${selectedPayment.itemName} taksit ödemesi`,
        receiptNumber: paymentData.receiptNumber.trim() || null,
      };

      await installmentPaymentsAPI.recordPayment(selectedPayment.id, payment);
      showSuccess('Taksit ödemesi başarıyla kaydedildi');
      
      handleClosePaymentDialog();
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  // History functions
  const handleOpenHistoryDialog = async (payment) => {
    try {
      setSelectedPayment(payment);
      const response = await installmentPaymentsAPI.getPaymentHistory(payment.id);
      setPaymentHistory(response.data.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedPayment(null);
    setPaymentHistory([]);
  };

  const getCategoryIcon = (category) => {
    return categoryIcons[category] || categoryIcons['Diğer'];
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
              Taksitli Ödemelerim
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Telefon, araba, eğitim ve diğer taksitli alışverişlerinizi yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Taksitli Ödeme Ekle
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
                      <ShoppingCart />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Borç
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(summary.totalDebt)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {summary.activeInstallments} aktif taksit
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

        {/* Installment Payments Grid */}
        {installmentPayments.length > 0 ? (
          <Grid container spacing={3}>
            {installmentPayments.map((payment) => (
              <Grid item xs={12} md={6} lg={4} key={payment.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {getCategoryIcon(payment.category)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {payment.itemName}
                        </Typography>
                        {payment.vendor && (
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {payment.vendor}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(payment)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePayment(payment)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Category */}
                    {payment.category && (
                      <Chip 
                        label={payment.category} 
                        size="small" 
                        sx={{ mb: 2 }}
                        icon={getCategoryIcon(payment.category)}
                      />
                    )}

                    {/* Total Amount */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Toplam Tutar
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ mb: 2 }}
                    >
                      {formatCurrency(payment.totalAmount)}
                    </Typography>

                    {/* Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          İlerleme
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          %{payment.completionPercentage}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={payment.completionPercentage}
                        color={payment.completionPercentage > 80 ? 'success' : payment.completionPercentage > 50 ? 'primary' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Payment Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Ödenen
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(payment.paidAmount)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Kalan
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {formatCurrency(payment.remainingAmount)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Taksit ({payment.paidInstallments}/{payment.totalInstallments})
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payment.installmentAmount)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Next Payment */}
                    {payment.nextPaymentDate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Sonraki Taksit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday fontSize="small" />
                          <Typography variant="body2">
                            {formatDate(payment.nextPaymentDate)}
                          </Typography>
                          {payment.daysUntilPayment !== null && (
                            <Chip
                              label={payment.isOverdue ? 'Gecikmiş' : `${payment.daysUntilPayment} gün`}
                              size="small"
                              color={payment.isOverdue ? 'error' : payment.daysUntilPayment <= 7 ? 'warning' : 'primary'}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Status Chips */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {payment.isOverdue && (
                        <Chip label="Taksit Gecikmiş" color="error" size="small" icon={<Warning />} />
                      )}
                      {payment.completionPercentage === 100 && (
                        <Chip label="Tamamlandı" color="success" size="small" icon={<CheckCircle />} />
                      )}
                      {payment.interestRate > 0 && (
                        <Chip label={`%${payment.interestRate} Faiz`} size="small" />
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Payment />}
                        onClick={() => handleOpenPaymentDialog(payment)}
                        disabled={payment.completionPercentage === 100}
                        fullWidth
                      >
                        Taksit Öde
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<History />}
                        onClick={() => handleOpenHistoryDialog(payment)}
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
              <Payment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Henüz taksitli ödeme eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                İlk taksitli ödemenizi ekleyerek başlayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                İlk Taksitli Ödemeyi Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Installment Payment Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPayment ? 'Taksitli Ödeme Düzenle' : 'Yeni Taksitli Ödeme Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Ürün/Hizmet Adı"
                    value={formData.itemName}
                    onChange={(e) => handleFormChange('itemName', e.target.value)}
                    error={!!formErrors.itemName}
                    helperText={formErrors.itemName}
                    placeholder="iPhone 15 Pro, Honda Civic, Üniversite Eğitimi..."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={formData.category}
                      label="Kategori"
                      onChange={(e) => handleFormChange('category', e.target.value)}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(category)}
                            {category}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Toplam Tutar"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleFormChange('totalAmount', e.target.value)}
                    error={!!formErrors.totalAmount}
                    helperText={formErrors.totalAmount}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Satıcı/Mağaza"
                    value={formData.vendor}
                    onChange={(e) => handleFormChange('vendor', e.target.value)}
                    placeholder="Apple Store, Honda Bayii, Üniversite..."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Aylık Taksit"
                    type="number"
                    value={formData.installmentAmount}
                    onChange={(e) => handleFormChange('installmentAmount', e.target.value)}
                    error={!!formErrors.installmentAmount}
                    helperText={formErrors.installmentAmount}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Taksit Sayısı"
                    type="number"
                    value={formData.totalInstallments}
                    onChange={(e) => handleFormChange('totalInstallments', e.target.value)}
                    error={!!formErrors.totalInstallments}
                    helperText={formErrors.totalInstallments}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notlar"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Ürün özellikleri, garanti bilgileri vb..."
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
              {submitting ? 'Kaydediliyor...' : (editingPayment ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Taksit Ödemesi - {selectedPayment?.itemName}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedPayment && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(selectedPayment.remainingAmount)}
                    <br />
                    <strong>Aylık Taksit:</strong> {formatCurrency(selectedPayment.installmentAmount)}
                    <br />
                    <strong>Taksit:</strong> {selectedPayment.paidInstallments + 1} / {selectedPayment.totalInstallments}
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
                sx={{ mb: 2 }}
              />

              {/* Quick Payment Options */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', selectedPayment?.installmentAmount?.toString() || '')}
                >
                  Normal Taksit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', (selectedPayment?.installmentAmount * 2)?.toString() || '')}
                >
                  2 Taksit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', selectedPayment?.remainingAmount?.toString() || '')}
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

              {selectedPayment && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Ödeme Sonrası Tahmini Durum:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(Math.max(0, selectedPayment.remainingAmount - (parseFloat(paymentData.amount) || 0)))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tamamlanma:</strong> %{Math.min(100, ((selectedPayment.paidAmount + (parseFloat(paymentData.amount) || 0)) / selectedPayment.totalAmount * 100).toFixed(1))}
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
              {submitting ? 'Kaydediliyor...' : 'Taksiti Öde'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={historyDialogOpen} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Taksit Geçmişi - {selectedPayment?.itemName}
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
                  Henüz taksit ödemesi yapılmamış
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

export default InstallmentPaymentsPage;