import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Fab,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Error,
  CreditCard,
  MoreVert,
  Payment,
  Schedule,
  CalendarToday,
  FilterList,
  Sort,
  Visibility,
} from '@mui/icons-material';

import { useNotification } from '../../contexts/NotificationContext';
import { creditCardsAPI, formatCurrency, handleApiError } from '../../services/api';
import { turkishBanks, getBankById, popularBanks, searchBanks, bankTypes } from '../../data/turkishBanks';

// Credit Card summary component
const CreditCardSummaryCard = ({ creditCards }) => {
  const getTotalLimit = () => creditCards.reduce((total, cc) => total + (cc.creditLimit || 0), 0);
  const getTotalUsed = () => creditCards.reduce((total, cc) => total + (cc.currentBalance || 0), 0);
  const getTotalAvailable = () => getTotalLimit() - getTotalUsed();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Kredi Kartı Özeti
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {formatCurrency(getTotalLimit())}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Toplam Limit
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {formatCurrency(getTotalUsed())}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Kullanılan
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {formatCurrency(getTotalAvailable())}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Kullanılabilir
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};



// Credit Cards list component
const CreditCardsList = ({ creditCards, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sortBy] = useState('name'); // 'name', 'balance', 'limit', 'bank'
  const [filterType] = useState('all'); // 'all', 'normal', 'warning', 'critical'

  const getStatusInfo = (creditCard) => {
    const utilization = creditCard.utilizationPercentage || 0;
    
    if (utilization >= 90) {
      return { label: 'Kritik', color: 'error', icon: <Error /> };
    } else if (utilization >= 70) {
      return { label: 'Uyarı', color: 'warning', icon: <Warning /> };
    } else {
      return { label: 'Normal', color: 'success', icon: <CheckCircle /> };
    }
  };

  const getDaysUntilPayment = (paymentDueDate) => {
    if (!paymentDueDate) return null;
    const dueDate = new Date(paymentDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMenuClick = (event, creditCard) => {
    setAnchorEl(event.currentTarget);
    setSelectedCard(creditCard);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCard(null);
  };

  const sortedAndFilteredCards = creditCards
    .filter(card => {
      if (filterType === 'all') return true;
      const statusInfo = getStatusInfo(card);
      return statusInfo.label.toLowerCase() === filterType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return (b.currentBalance || 0) - (a.currentBalance || 0);
        case 'limit':
          return (b.creditLimit || 0) - (a.creditLimit || 0);
        case 'bank':
          return (a.bankName || '').localeCompare(b.bankName || '');
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Kredi Kartlarım ({sortedAndFilteredCards.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<FilterList />} variant="outlined">
              Filtrele
            </Button>
            <Button size="small" startIcon={<Sort />} variant="outlined">
              Sırala
            </Button>
          </Box>
        </Box>
        
        <List>
          {sortedAndFilteredCards.map((creditCard, index) => {
            const statusInfo = getStatusInfo(creditCard);
            const daysUntilPayment = getDaysUntilPayment(creditCard.paymentDueDate);
            const available = (creditCard.creditLimit || 0) - (creditCard.currentBalance || 0);
            
            return (
              <React.Fragment key={creditCard.id}>
                <ListItem
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: creditCard.bankId ? getBankById(creditCard.bankId)?.color || 'primary.main' : 'primary.main',
                        width: 48,
                        height: 48
                      }}
                    >
                      {creditCard.bankId && getBankById(creditCard.bankId)?.name 
                        ? getBankById(creditCard.bankId).name.charAt(0) 
                        : <CreditCard />}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {creditCard.name}
                        </Typography>
                        <Chip 
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                        {daysUntilPayment !== null && daysUntilPayment <= 7 && daysUntilPayment >= 0 && (
                          <Chip 
                            icon={<CalendarToday />}
                            label={`${daysUntilPayment} gün`}
                            color={daysUntilPayment <= 3 ? 'error' : 'warning'}
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="textSecondary" component="span" display="block">
                          {creditCard.bankName || 'Kredi Kartı'}
                        </Typography>
                        {creditCard.cardNumber && (
                          <Typography variant="caption" color="textSecondary" component="span" display="block">
                            Kart No: ****{creditCard.cardNumber.slice(-4)}
                          </Typography>
                        )}
                        {/* Kullanım oranı progress bar */}
                        <Box component="span" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={creditCard.utilizationPercentage || 0}
                            color={(creditCard.utilizationPercentage || 0) > 80 ? 'error' : (creditCard.utilizationPercentage || 0) > 60 ? 'warning' : 'success'}
                            sx={{ height: 6, borderRadius: 1, flexGrow: 1 }}
                          />
                          <Typography variant="caption" color="textSecondary" component="span">
                            %{(creditCard.utilizationPercentage || 0).toFixed(1)}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    }
                  />
                  
                  <Box sx={{ textAlign: 'right', mr: 2, minWidth: 120 }}>
                    {/* Toplam Limit */}
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                      Limit: {formatCurrency(creditCard.creditLimit || 0)}
                    </Typography>
                    
                    {/* Kullanılan Borç */}
                    <Typography variant="body2" color="error.main" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      Borç: {formatCurrency(creditCard.currentBalance || 0)}
                    </Typography>
                    
                    {/* Kullanılabilir */}
                    <Typography 
                      variant="subtitle1" 
                      color="success.main"
                      fontWeight="bold"
                      sx={{ fontSize: '1rem' }}
                    >
                      {formatCurrency(available)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                      Kullanılabilir
                    </Typography>
                    
                    {/* Minimum Ödeme */}
                    {creditCard.minimumPayment && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.7rem' }}>
                          Min. Ödeme: {formatCurrency(creditCard.minimumPayment)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={(e) => handleMenuClick(e, creditCard)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < sortedAndFilteredCards.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit && onEdit(selectedCard); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} /> Düzenle
          </MenuItem>
          <MenuItem onClick={() => { /* Handle view details */ handleMenuClose(); }}>
            <Visibility sx={{ mr: 1 }} /> Detayları Görüntüle
          </MenuItem>
          <MenuItem onClick={() => { /* Handle payment */ handleMenuClose(); }}>
            <Payment sx={{ mr: 1 }} /> Ödeme Yap
          </MenuItem>
          <MenuItem onClick={() => { /* Handle installment */ handleMenuClose(); }}>
            <Schedule sx={{ mr: 1 }} /> Taksitlendirme
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => { onDelete && onDelete(selectedCard?.id); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} /> Sil
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

// Quick stats component
const QuickStats = ({ creditCards }) => {
  const getStats = () => {
    const criticalCards = creditCards.filter(cc => (cc.utilizationPercentage || 0) >= 90);
    const warningCards = creditCards.filter(cc => {
      const utilization = cc.utilizationPercentage || 0;
      return utilization >= 70 && utilization < 90;
    });
    const normalCards = creditCards.filter(cc => (cc.utilizationPercentage || 0) < 70);
    
    // Ödeme tarihi yaklaşan kartlar (7 gün içinde)
    const upcomingPayments = creditCards.filter(cc => {
      if (!cc.paymentDueDate) return false;
      const dueDate = new Date(cc.paymentDueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });

    return {
      total: creditCards.length,
      normal: normalCards.length,
      warning: warningCards.length,
      critical: criticalCards.length,
      upcomingPayments: upcomingPayments.length
    };
  };

  const stats = getStats();

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary.main">
            {stats.total}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Toplam Kart
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {stats.normal}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Normal
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {stats.warning}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Uyarı
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="error.main">
            {stats.critical}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Kritik
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={6} sm={2.4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">
            {stats.upcomingPayments}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Yaklaşan Ödeme
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

const CreditCardsDashboard = () => {
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

  useEffect(() => {
    loadCreditCards();
  }, []);

  const loadCreditCards = async () => {
    try {
      setLoading(true);
      const response = await creditCardsAPI.getAll();
      setCreditCards(response.data.data.creditCards || []);
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

  const handleEdit = (creditCard) => {
    handleOpenDialog(creditCard);
  };

  const handleDelete = async (creditCardId) => {
    const card = creditCards.find(c => c.id === creditCardId);
    if (card && window.confirm(`"${card.name}" kredi kartını silmek istediğinizden emin misiniz?`)) {
      try {
        await creditCardsAPI.delete(creditCardId);
        showSuccess('Kredi kartı başarıyla silindi');
        loadCreditCards();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Kredi Kartlarım
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Kredi kartı limitlerini ve ödemelerini yönetin
            </Typography>
          </Box>
        </Box>

        {/* Summary Card */}
        <CreditCardSummaryCard creditCards={creditCards} />

        {/* Quick Stats */}
        <QuickStats creditCards={creditCards} />

        {/* Credit Cards List */}
        <CreditCardsList 
          creditCards={creditCards} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add credit card"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <Add />
        </Fab>

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
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) {
                    // Popüler bankaları önce göster
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

export default CreditCardsDashboard;