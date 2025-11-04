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
  Autocomplete,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add,
  CreditCard,
  Edit,
  Delete,
  Payment,
  Calculate,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { creditCardsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import { turkishBanks, getBankById, popularBanks, searchBanks, bankTypes } from '../../data/turkishBanks';

const CreditCardsPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    bankName: '',
    creditLimit: '',
    currentBalance: '0',
    interestRate: '',
    minimumPaymentRate: '5',
    paymentDueDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({});

  useEffect(() => {
    loadCreditCards();
  }, []);

  const loadCreditCards = async () => {
    try {
      setLoading(true);
      const response = await creditCardsAPI.getAll();
      setCreditCards(response.data.data.creditCards);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        name: card.name,
        bankId: card.bankId || '',
        bankName: card.bankName || '',
        creditLimit: card.creditLimit.toString(),
        currentBalance: card.currentBalance.toString(),
        interestRate: card.interestRate.toString(),
        minimumPaymentRate: card.minimumPaymentRate.toString(),
        paymentDueDate: card.paymentDueDate?.toString() || '',
      });
    } else {
      setEditingCard(null);
      setFormData({
        name: '',
        bankId: '',
        bankName: '',
        creditLimit: '',
        currentBalance: '0',
        interestRate: '',
        minimumPaymentRate: '5',
        paymentDueDate: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCard(null);
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
    
    if (!formData.name.trim()) {
      errors.name = 'Kart adı gereklidir';
    }
    
    if (!formData.creditLimit || isNaN(parseFloat(formData.creditLimit)) || parseFloat(formData.creditLimit) <= 0) {
      errors.creditLimit = 'Geçerli bir kredi limiti giriniz';
    }
    
    if (isNaN(parseFloat(formData.currentBalance)) || parseFloat(formData.currentBalance) < 0) {
      errors.currentBalance = 'Geçerli bir mevcut bakiye giriniz';
    }
    
    if (!formData.interestRate || isNaN(parseFloat(formData.interestRate)) || parseFloat(formData.interestRate) < 0) {
      errors.interestRate = 'Geçerli bir faiz oranı giriniz';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const cardData = {
        name: formData.name.trim(),
        bankId: formData.bankId || null,
        bankName: formData.bankName.trim() || null,
        creditLimit: parseFloat(formData.creditLimit),
        currentBalance: parseFloat(formData.currentBalance),
        interestRate: parseFloat(formData.interestRate),
        minimumPaymentRate: parseFloat(formData.minimumPaymentRate),
        paymentDueDate: formData.paymentDueDate ? parseInt(formData.paymentDueDate) : null,
      };

      if (editingCard) {
        await creditCardsAPI.update(editingCard.id, cardData);
        showSuccess('Kredi kartı başarıyla güncellendi');
      } else {
        await creditCardsAPI.create(cardData);
        showSuccess('Kredi kartı başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadCreditCards();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (card) => {
    if (window.confirm(`"${card.name}" kredi kartını silmek istediğinizden emin misiniz?`)) {
      try {
        await creditCardsAPI.delete(card.id);
        showSuccess('Kredi kartı başarıyla silindi');
        loadCreditCards();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  // Payment functions
  const handleOpenPaymentDialog = (card) => {
    setSelectedCard(card);
    setPaymentData({
      amount: card.minimumPayment?.toString() || '',
      paymentDate: new Date().toISOString().split('T')[0],
      description: `${card.name} kredi kartı ödemesi`,
    });
    setPaymentErrors({});
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedCard(null);
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
    
    if (parseFloat(paymentData.amount) > selectedCard?.currentBalance) {
      errors.amount = 'Ödeme tutarı mevcut borçtan fazla olamaz';
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
        description: paymentData.description.trim() || `${selectedCard.name} kredi kartı ödemesi`,
      };

      await creditCardsAPI.recordPayment(selectedCard.id, payment);
      showSuccess('Ödeme başarıyla kaydedildi');
      
      handleClosePaymentDialog();
      loadCreditCards();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalDebt = () => {
    return creditCards.reduce((total, card) => total + card.currentBalance, 0);
  };

  const getTotalCreditLimit = () => {
    return creditCards.reduce((total, card) => total + card.creditLimit, 0);
  };

  const getOverallUtilization = () => {
    const totalLimit = getTotalCreditLimit();
    const totalDebt = getTotalDebt();
    return totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
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
              Kredi Kartlarım
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Kredi kartı borçlarınızı ve ödemelerinizi yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Kredi Kartı Ekle
          </Button>
        </Box>

        {/* Summary Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Toplam Borç
                  </Typography>
                  <Typography variant="h3" component="div" color="error.main">
                    {formatCurrency(getTotalDebt())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Toplam Limit
                  </Typography>
                  <Typography variant="h3" component="div" color="primary.main">
                    {formatCurrency(getTotalCreditLimit())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Kullanım Oranı
                  </Typography>
                  <Typography variant="h3" component="div" color={getOverallUtilization() > 70 ? 'error.main' : 'success.main'}>
                    %{getOverallUtilization().toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Kart Sayısı
                  </Typography>
                  <Typography variant="h3" component="div">
                    {creditCards.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* High Utilization Warning */}
            {getOverallUtilization() > 70 && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Dikkat:</strong> Kredi kartı kullanım oranınız %{getOverallUtilization().toFixed(1)} seviyesinde. 
                  Kredi puanınızı korumak için kullanım oranınızı %30'un altında tutmanız önerilir.
                </Typography>
              </Alert>
            )}
            
            {/* Payment Reminder */}
            {creditCards.some(card => card.isPaymentOverdue) && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Acil:</strong> Gecikmiş ödemeleriniz bulunmaktadır. Faiz ve gecikme ücretlerinden kaçınmak için 
                  en kısa sürede ödeme yapmanız önerilir.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Credit Cards Grid */}
        {creditCards.length > 0 ? (
          <Grid container spacing={3}>
            {creditCards.map((card) => (
              <Grid item xs={12} md={6} lg={4} key={card.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: card.bankId ? getBankById(card.bankId)?.color || 'primary.main' : 'primary.main', 
                          mr: 2 
                        }}
                      >
                        {card.bankId ? getBankById(card.bankId)?.name?.charAt(0) || <CreditCard /> : <CreditCard />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {card.name}
                        </Typography>
                        {card.bankName && (
                          <Typography variant="body2" color="textSecondary">
                            {card.bankName}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(card)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteCard(card)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Current Balance */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Mevcut Borç
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      color="error.main"
                      sx={{ mb: 2 }}
                    >
                      {formatCurrency(card.currentBalance)}
                    </Typography>

                    {/* Credit Utilization */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Kullanım Oranı
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          %{card.utilizationPercentage}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(card.utilizationPercentage, 100)}
                        color={card.utilizationPercentage > 70 ? 'error' : card.utilizationPercentage > 50 ? 'warning' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Available Credit */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Kullanılabilir Limit
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(card.availableCredit)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Payment Info */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Minimum Ödeme
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {formatCurrency(card.minimumPayment)}
                      </Typography>
                    </Box>

                    {/* Payment Due Date */}
                    {card.nextPaymentDueDate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Sonraki Ödeme Tarihi
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" />
                          <Typography variant="body2">
                            {formatDate(card.nextPaymentDueDate)}
                          </Typography>
                          {card.daysUntilPayment !== null && (
                            <Chip
                              label={`${card.daysUntilPayment} gün`}
                              size="small"
                              color={card.daysUntilPayment <= 3 ? 'error' : card.daysUntilPayment <= 7 ? 'warning' : 'primary'}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Status Chips */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {card.isPaymentOverdue && (
                        <Chip label="Ödeme Gecikmiş" color="error" size="small" icon={<Warning />} />
                      )}
                      {card.utilizationPercentage > 90 && (
                        <Chip label="Limit Doldu" color="error" size="small" />
                      )}
                      {card.utilizationPercentage === 0 && (
                        <Chip label="Borç Yok" color="success" size="small" icon={<CheckCircle />} />
                      )}
                    </Box>

                    {/* Interest Rate */}
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                      Faiz Oranı: %{card.interestRate} • Aylık Faiz: {formatCurrency(card.monthlyInterest)}
                    </Typography>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Payment />}
                        onClick={() => handleOpenPaymentDialog(card)}
                        disabled={card.currentBalance === 0}
                        fullWidth
                      >
                        Ödeme Yap
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Calculate />}
                        onClick={() => {/* TODO: Open interest calculator */}}
                        fullWidth
                      >
                        Faiz Hesapla
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
              <CreditCard sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Henüz kredi kartı eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                İlk kredi kartınızı ekleyerek başlayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                İlk Kredi Kartını Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Kredi Kartı Ödemesi - {selectedCard?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedCard && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Mevcut Borç:</strong> {formatCurrency(selectedCard.currentBalance)}
                    <br />
                    <strong>Minimum Ödeme:</strong> {formatCurrency(selectedCard.minimumPayment)}
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
                  onClick={() => handlePaymentChange('amount', selectedCard?.minimumPayment?.toString() || '')}
                >
                  Minimum Ödeme
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', (selectedCard?.currentBalance * 0.5)?.toString() || '')}
                >
                  %50 Ödeme
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', selectedCard?.currentBalance?.toString() || '')}
                >
                  Tüm Borcu Öde
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
                label="Açıklama"
                value={paymentData.description}
                onChange={(e) => handlePaymentChange('description', e.target.value)}
                multiline
                rows={2}
                helperText="İsteğe bağlı"
              />

              {selectedCard && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Ödeme Sonrası Tahmini Durum:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(Math.max(0, selectedCard.currentBalance - (parseFloat(paymentData.amount) || 0)))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kullanım Oranı:</strong> %{(Math.max(0, selectedCard.currentBalance - (parseFloat(paymentData.amount) || 0)) / selectedCard.creditLimit * 100).toFixed(1)}
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

        {/* Credit Card Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCard ? 'Kredi Kartı Düzenle' : 'Yeni Kredi Kartı Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Banka Seçimi */}
              <Autocomplete
                options={turkishBanks}
                getOptionLabel={(option) => option.name}
                groupBy={(option) => bankTypes[option.type]}
                value={getBankById(formData.bankId) || null}
                onChange={(event, newValue) => {
                  handleFormChange('bankId', newValue?.id || '');
                  handleFormChange('bankName', newValue?.name || '');
                  if (newValue && !formData.name) {
                    handleFormChange('name', `${newValue.name} Kredi Kartı`);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Banka Seçin"
                    error={!!formErrors.bankId}
                    helperText={formErrors.bankId || 'Kredi kartınızın bankasını seçin'}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: option.color,
                          width: 32, 
                          height: 32,
                          fontSize: '0.75rem'
                        }}
                      >
                        {option.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={option.name}
                      secondary={option.fullName}
                    />
                  </Box>
                )}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) {
                    // Popüler bankaları önce göster
                    const popular = popularBanks.map(id => getBankById(id)).filter(Boolean).slice(0, 6);
                    const others = options.filter(bank => !popular.find(p => p.id === bank.id));
                    return [...popular, ...others];
                  }
                  return searchBanks(inputValue);
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Kart Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                placeholder="Örn: Ziraat Bankası World Kart"
                sx={{ mb: 3 }}
              />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Kredi Limiti"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => handleFormChange('creditLimit', e.target.value)}
                    error={!!formErrors.creditLimit}
                    helperText={formErrors.creditLimit}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Mevcut Borç"
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) => handleFormChange('currentBalance', e.target.value)}
                    error={!!formErrors.currentBalance}
                    helperText={formErrors.currentBalance}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Faiz Oranı (%)"
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => handleFormChange('interestRate', e.target.value)}
                    error={!!formErrors.interestRate}
                    helperText={formErrors.interestRate}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Min. Ödeme Oranı (%)"
                    type="number"
                    value={formData.minimumPaymentRate}
                    onChange={(e) => handleFormChange('minimumPaymentRate', e.target.value)}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Ödeme Günü (Ayın Kaçı)"
                type="number"
                value={formData.paymentDueDate}
                onChange={(e) => handleFormChange('paymentDueDate', e.target.value)}
                inputProps={{ min: 1, max: 31 }}
                helperText="Aylık ödeme tarihi (1-31 arası)"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : (editingCard ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CreditCardsPage;