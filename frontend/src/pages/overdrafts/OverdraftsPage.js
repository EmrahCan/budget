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
  Alert,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Autocomplete,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Payment,
  ShoppingCart,
  CreditCard,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency, formatDate, handleApiError } from '../../services/api';
import { turkishBanks, getBankById, popularBanks, searchBanks, bankTypes } from '../../data/turkishBanks';

// Esnek Hesaplar API (şimdilik mock)
const overdraftsAPI = {
  getAll: () => Promise.resolve({ data: { data: { overdrafts: [] } } }),
  create: (data) => Promise.resolve({ data: { overdraft: { id: Date.now(), ...data } } }),
  update: (id, data) => Promise.resolve({ data: { overdraft: { id, ...data } } }),
  delete: (id) => Promise.resolve({ data: { success: true } }),
  addExpense: (id, data) => Promise.resolve({ data: { success: true } }),
  addPayment: (id, data) => Promise.resolve({ data: { success: true } }),
};

const OverdraftsPage = () => {
  const { showSuccess, showError } = useNotification();

  const [overdrafts, setOverdrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverdraft, setEditingOverdraft] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    bankName: '',
    creditLimit: '',
    usedAmount: '0',
    interestRate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // İşlem dialog'u için state
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedOverdraft, setSelectedOverdraft] = useState(null);
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'payment'
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: '',
  });
  const [transactionErrors, setTransactionErrors] = useState({});

  useEffect(() => {
    loadOverdrafts();
  }, []);

  const loadOverdrafts = async () => {
    try {
      setLoading(true);
      const response = await overdraftsAPI.getAll();
      setOverdrafts(response.data.data.overdrafts);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (overdraft = null) => {
    if (overdraft) {
      setEditingOverdraft(overdraft);
      setFormData({
        name: overdraft.name,
        bankId: overdraft.bankId || '',
        bankName: overdraft.bankName || '',
        creditLimit: overdraft.creditLimit.toString(),
        usedAmount: overdraft.usedAmount.toString(),
        interestRate: overdraft.interestRate.toString(),
      });
    } else {
      setEditingOverdraft(null);
      setFormData({
        name: '',
        bankId: '',
        bankName: '',
        creditLimit: '',
        usedAmount: '0',
        interestRate: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOverdraft(null);
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
      errors.name = 'Esnek hesap adı gereklidir';
    }

    if (!formData.creditLimit || isNaN(parseFloat(formData.creditLimit)) || parseFloat(formData.creditLimit) <= 0) {
      errors.creditLimit = 'Geçerli bir limit giriniz';
    }

    if (isNaN(parseFloat(formData.usedAmount)) || parseFloat(formData.usedAmount) < 0) {
      errors.usedAmount = 'Geçerli bir kullanılan miktar giriniz';
    }

    if (parseFloat(formData.usedAmount) > parseFloat(formData.creditLimit)) {
      errors.usedAmount = 'Kullanılan miktar limitten fazla olamaz';
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

      const overdraftData = {
        name: formData.name.trim(),
        bankId: formData.bankId || null,
        bankName: formData.bankName.trim() || null,
        creditLimit: parseFloat(formData.creditLimit),
        usedAmount: parseFloat(formData.usedAmount),
        interestRate: parseFloat(formData.interestRate),
      };

      if (editingOverdraft) {
        await overdraftsAPI.update(editingOverdraft.id, overdraftData);
        showSuccess('Esnek hesap başarıyla güncellendi');
      } else {
        await overdraftsAPI.create(overdraftData);
        showSuccess('Esnek hesap başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadOverdrafts();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOverdraft = async (overdraft) => {
    if (window.confirm(`"${overdraft.name}" esnek hesabını silmek istediğinizden emin misiniz?`)) {
      try {
        await overdraftsAPI.delete(overdraft.id);
        showSuccess('Esnek hesap başarıyla silindi');
        loadOverdrafts();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  // İşlem fonksiyonları
  const handleExpense = (overdraft) => {
    setSelectedOverdraft(overdraft);
    setTransactionType('expense');
    setTransactionData({
      amount: '',
      description: 'Esnek hesap harcaması',
    });
    setTransactionErrors({});
    setTransactionDialogOpen(true);
  };

  const handlePayment = (overdraft) => {
    setSelectedOverdraft(overdraft);
    setTransactionType('payment');
    setTransactionData({
      amount: overdraft.usedAmount.toString(),
      description: 'Esnek hesap borç ödemesi',
    });
    setTransactionErrors({});
    setTransactionDialogOpen(true);
  };

  const handleTransactionDialogClose = () => {
    setTransactionDialogOpen(false);
    setSelectedOverdraft(null);
    setTransactionData({ amount: '', description: '' });
    setTransactionErrors({});
  };

  const handleTransactionDataChange = (field, value) => {
    setTransactionData(prev => ({ ...prev, [field]: value }));
    if (transactionErrors[field]) {
      setTransactionErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateTransaction = () => {
    const errors = {};
    const amount = parseFloat(transactionData.amount);

    if (!transactionData.amount || isNaN(amount) || amount <= 0) {
      errors.amount = 'Geçerli bir tutar giriniz';
    }

    if (transactionType === 'expense') {
      const availableLimit = selectedOverdraft.creditLimit - selectedOverdraft.usedAmount;
      if (amount > availableLimit) {
        errors.amount = `Kalan limit: ${formatCurrency(availableLimit)}`;
      }
    } else if (transactionType === 'payment') {
      if (amount > selectedOverdraft.usedAmount) {
        errors.amount = `Maksimum ödeme: ${formatCurrency(selectedOverdraft.usedAmount)}`;
      }
    }

    setTransactionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTransactionSubmit = async () => {
    if (!validateTransaction()) return;

    try {
      setSubmitting(true);
      const amount = parseFloat(transactionData.amount);

      if (transactionType === 'expense') {
        await overdraftsAPI.addExpense(selectedOverdraft.id, {
          amount,
          description: transactionData.description,
        });
        showSuccess('Harcama başarıyla kaydedildi');
      } else {
        await overdraftsAPI.addPayment(selectedOverdraft.id, {
          amount,
          description: transactionData.description,
        });
        showSuccess('Ödeme başarıyla kaydedildi');
      }

      handleTransactionDialogClose();
      loadOverdrafts();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalLimit = () => {
    return overdrafts.reduce((total, overdraft) => total + overdraft.creditLimit, 0);
  };

  const getTotalUsed = () => {
    return overdrafts.reduce((total, overdraft) => total + overdraft.usedAmount, 0);
  };

  const getTotalAvailable = () => {
    return getTotalLimit() - getTotalUsed();
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
              Esnek Hesaplarım
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Esnek hesap limitlerini ve borçlarınızı yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Esnek Hesap Ekle
          </Button>
        </Box>

        {/* Summary Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Toplam Limit
                  </Typography>
                  <Typography variant="h3" component="div" color="primary.main">
                    {formatCurrency(getTotalLimit())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Kullanılan Miktar
                  </Typography>
                  <Typography variant="h3" component="div" color="error.main">
                    {formatCurrency(getTotalUsed())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Kalan Limit
                  </Typography>
                  <Typography variant="h3" component="div" color="success.main">
                    {formatCurrency(getTotalAvailable())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Hesap Sayısı
                  </Typography>
                  <Typography variant="h3" component="div">
                    {overdrafts.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Overdrafts Grid */}
        {overdrafts.length > 0 ? (
          <Grid container spacing={3}>
            {overdrafts.map((overdraft) => (
              <Grid item xs={12} md={6} lg={4} key={overdraft.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: overdraft.bankId ? getBankById(overdraft.bankId)?.color || 'primary.main' : 'primary.main', 
                          mr: 2 
                        }}
                      >
                        {overdraft.bankId ? getBankById(overdraft.bankId)?.name?.charAt(0) || <CreditCard /> : <CreditCard />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {overdraft.name}
                        </Typography>
                        {overdraft.bankName && (
                          <Typography variant="body2" color="textSecondary">
                            {overdraft.bankName}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(overdraft)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOverdraft(overdraft)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Limit Bilgileri */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Esnek Hesap Limiti:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {formatCurrency(overdraft.creditLimit)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Kullanılan Miktar:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(overdraft.usedAmount)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Kalan Limit:
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(overdraft.creditLimit - overdraft.usedAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Borç Durumu */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: overdraft.usedAmount > 0 ? 'error.50' : 'success.50', borderRadius: 1 }}>
                      <Typography variant="h5" fontWeight="bold" color={overdraft.usedAmount > 0 ? 'error.main' : 'success.main'}>
                        {overdraft.usedAmount > 0 ? `Borç: ${formatCurrency(overdraft.usedAmount)}` : 'Borç Yok'}
                      </Typography>
                      {overdraft.usedAmount > 0 && (
                        <Typography variant="body2" color="textSecondary">
                          Kullanım Oranı: %{((overdraft.usedAmount / overdraft.creditLimit) * 100).toFixed(1)}
                        </Typography>
                      )}
                    </Box>

                    {/* Faiz Bilgisi */}
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                      Faiz Oranı: %{overdraft.interestRate} • Aylık Faiz: {formatCurrency((overdraft.usedAmount * overdraft.interestRate) / 100 / 12)}
                    </Typography>

                    {/* İşlem Butonları */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<ShoppingCart />}
                        onClick={() => handleExpense(overdraft)}
                        disabled={(overdraft.creditLimit - overdraft.usedAmount) <= 0}
                        fullWidth
                      >
                        Harcama Yap
                      </Button>
                      {overdraft.usedAmount > 0 && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => handlePayment(overdraft)}
                          fullWidth
                        >
                          Borç Öde
                        </Button>
                      )}
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
                Henüz esnek hesap eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                İlk esnek hesabınızı ekleyerek başlayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                İlk Esnek Hesabı Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Esnek Hesap Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingOverdraft ? 'Esnek Hesap Düzenle' : 'Yeni Esnek Hesap Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Esnek Hesap:</strong> Belirlediğiniz limite kadar borçlanabilirsiniz. 
                  Kullandığınız miktar borç olarak takip edilir ve faiz işletilir.
                </Typography>
              </Alert>

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
                    handleFormChange('name', `${newValue.name} Esnek Hesap`);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Banka Seçin"
                    helperText="Esnek hesabınızın bulunduğu bankayı seçin"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: option?.color || 'primary.main',
                          width: 32, 
                          height: 32,
                          fontSize: '0.75rem'
                        }}
                      >
                        {option?.name?.charAt(0) || '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={option?.name || 'Bilinmeyen Banka'}
                      secondary={option?.fullName || ''}
                    />
                  </Box>
                )}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) {
                    const popular = popularBanks.map(id => getBankById(id)).filter(Boolean).slice(0, 6);
                    const others = options.filter(bank => !popular.find(p => p && p.id === bank.id));
                    return [...popular, ...others];
                  }
                  return searchBanks(inputValue);
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Esnek Hesap Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                placeholder="Örn: Ziraat Bankası Esnek Hesap"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Esnek Hesap Limiti *"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => handleFormChange('creditLimit', e.target.value)}
                error={!!formErrors.creditLimit}
                helperText={formErrors.creditLimit}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                required
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Kullanılan Miktar"
                type="number"
                value={formData.usedAmount}
                onChange={(e) => handleFormChange('usedAmount', e.target.value)}
                error={!!formErrors.usedAmount}
                helperText={formErrors.usedAmount || 'Şu anda ne kadar borçlusunuz?'}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                sx={{ mb: 3 }}
              />

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
                sx={{ mb: 3 }}
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
              {submitting ? 'Kaydediliyor...' : (editingOverdraft ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* İşlem Dialog'u */}
        <Dialog open={transactionDialogOpen} onClose={handleTransactionDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {transactionType === 'expense' ? 'Esnek Hesap Harcaması' : 'Esnek Hesap Borç Ödemesi'}
            {selectedOverdraft && ` - ${selectedOverdraft.name}`}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedOverdraft && (
                <Alert 
                  severity={transactionType === 'expense' ? 'warning' : 'success'} 
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body2">
                    <strong>Mevcut Borç:</strong> {formatCurrency(selectedOverdraft.usedAmount)}
                    <br />
                    <strong>Kalan Limit:</strong> {formatCurrency(selectedOverdraft.creditLimit - selectedOverdraft.usedAmount)}
                  </Typography>
                </Alert>
              )}

              <TextField
                fullWidth
                label={transactionType === 'expense' ? 'Harcama Tutarı' : 'Ödeme Tutarı'}
                type="number"
                value={transactionData.amount}
                onChange={(e) => handleTransactionDataChange('amount', e.target.value)}
                error={!!transactionErrors.amount}
                helperText={transactionErrors.amount}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                sx={{ mb: 2 }}
              />

              {transactionType === 'expense' && selectedOverdraft && (
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleTransactionDataChange('amount', '500')}
                  >
                    500 TL
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleTransactionDataChange('amount', '1000')}
                  >
                    1000 TL
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleTransactionDataChange('amount', (selectedOverdraft.creditLimit - selectedOverdraft.usedAmount).toString())}
                  >
                    Kalan Limiti Kullan
                  </Button>
                </Box>
              )}

              <TextField
                fullWidth
                label="Açıklama"
                value={transactionData.description}
                onChange={(e) => handleTransactionDataChange('description', e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              {selectedOverdraft && transactionData.amount && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    İşlem Sonrası Tahmini Durum:
                  </Typography>
                  {transactionType === 'expense' ? (
                    <Typography variant="body2" color="error.main">
                      <strong>Yeni Borç:</strong> {formatCurrency(selectedOverdraft.usedAmount + parseFloat(transactionData.amount || 0))}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="success.main">
                      <strong>Kalan Borç:</strong> {formatCurrency(Math.max(0, selectedOverdraft.usedAmount - parseFloat(transactionData.amount || 0)))}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleTransactionDialogClose}>İptal</Button>
            <Button
              onClick={handleTransactionSubmit}
              variant="contained"
              color={transactionType === 'expense' ? 'error' : 'success'}
              disabled={submitting}
            >
              {submitting ? 'İşleniyor...' : (transactionType === 'expense' ? 'Harcama Yap' : 'Ödeme Yap')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default OverdraftsPage;