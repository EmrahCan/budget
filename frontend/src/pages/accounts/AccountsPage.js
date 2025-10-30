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
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Fab,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Add,
  AccountBalance,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Savings,
  AccountBalanceWallet,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { accountsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import { turkishBanks, getBankById, popularBanks, searchBanks, bankTypes } from '../../data/turkishBanks';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Vadesiz Hesap', icon: <AccountBalance />, description: 'Günlük işlemler için' },
  { value: 'savings', label: 'Vadeli Hesap', icon: <Savings />, description: 'Tasarruf amaçlı' },
  { value: 'cash', label: 'Nakit', icon: <AccountBalanceWallet />, description: 'Nakit para takibi' },
  { value: 'investment', label: 'Yatırım Hesabı', icon: <TrendingUp />, description: 'Yatırım portföyü' },
];

const AccountsPage = () => {
  const { showSuccess, showError } = useNotification();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: '',
    overdraftLimit: '',
    currency: 'TRY',
    bankId: '',
    bankName: '',
    iban: '',
    accountNumber: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsAPI.getAll();
      setAccounts(response.data.data.accounts);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        overdraftLimit: account.overdraftLimit?.toString() || '0',
        currency: account.currency,
        bankId: account.bankId || '',
        bankName: account.bankName || '',
        iban: account.iban || '',
        accountNumber: account.accountNumber || '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'checking',
        balance: '0',
        overdraftLimit: '0',
        currency: 'TRY',
        bankId: '',
        bankName: '',
        iban: '',
        accountNumber: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'checking',
      balance: '0',
      overdraftLimit: '0',
      currency: 'TRY',
    });
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      

      
      return newData;
    });
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Hesap adı gereklidir';
    }

    if (!formData.balance || isNaN(parseFloat(formData.balance))) {
      errors.balance = 'Geçerli bir bakiye giriniz';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const accountData = {
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance),
        overdraftLimit: parseFloat(formData.overdraftLimit || 0),
        currency: formData.currency,
        bankId: formData.bankId || null,
        bankName: formData.bankName.trim() || null,
        iban: formData.iban.trim() || null,
        accountNumber: formData.accountNumber.trim() || null,
      };

      console.log('Gönderilen hesap verisi:', accountData);

      if (editingAccount) {
        await accountsAPI.update(editingAccount.id, accountData);
        showSuccess('Hesap başarıyla güncellendi');
      } else {
        await accountsAPI.create(accountData);
        showSuccess('Hesap başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadAccounts();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (window.confirm(`"${account.name}" hesabını silmek istediğinizden emin misiniz?`)) {
      try {
        await accountsAPI.delete(account.id);
        showSuccess('Hesap başarıyla silindi');
        loadAccounts();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  const getAccountTypeInfo = (type) => {
    return ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  const getTotalOverdraftDebt = () => {
    return accounts
      .filter(account => account.type === 'overdraft' && account.balance < 0)
      .reduce((total, account) => total + Math.abs(account.balance), 0);
  };

  const getTotalOverdraftLimit = () => {
    return accounts
      .filter(account => account.type === 'overdraft')
      .reduce((total, account) => total + (account.overdraftLimit || 0), 0);
  };

  const getNetBalance = () => {
    return getTotalBalance() - getTotalOverdraftDebt();
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
              Hesaplarım
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Banka hesaplarınızı ve nakit durumunuzu yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Hesap Ekle
          </Button>
        </Box>

        {/* Summary Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Toplam Bakiye
                  </Typography>
                  <Typography variant="h3" component="div" color="primary.main">
                    {formatCurrency(getTotalBalance())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Esnek Hesap Borcu
                  </Typography>
                  <Typography variant="h3" component="div" color="error.main">
                    {formatCurrency(getTotalOverdraftDebt())}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Net Durum
                  </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    color={getNetBalance() >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(getNetBalance())}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Accounts Grid */}
        {accounts.length > 0 ? (
          <Grid container spacing={3}>
            {accounts.map((account) => {
              const typeInfo = getAccountTypeInfo(account.type);
              return (
                <Grid item xs={12} md={6} lg={4} key={account.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: account.bankId ? getBankById(account.bankId)?.color || 'primary.main' : 'primary.main', 
                            mr: 2 
                          }}
                        >
                          {account.bankId && getBankById(account.bankId)?.name ? getBankById(account.bankId).name.charAt(0) : typeInfo.icon}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" noWrap>
                            {account.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {account.bankName ? `${account.bankName} • ${typeInfo.label}` : typeInfo.label}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(account)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAccount(account)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Normal hesaplar için gösterim */}
                        /* Normal ve diğer hesaplar için gösterim */
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Hesap Bakiyesi
                          </Typography>
                          <Typography
                            variant="h4"
                            component="div"
                            color={account.balance >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(account.balance)}
                          </Typography>
                          
                          {/* Hesap türüne göre bütçe önerileri */}
                          {account.type === 'checking' && account.balance > 0 && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="caption">
                                💡 <strong>Öneri:</strong> Aylık gelirinizin %20'sini tasarruf etmeyi hedefleyin. 
                                Sabit giderlerinizi optimize edebiliriz.
                              </Typography>
                            </Alert>
                          )}
                          
                          {account.type === 'savings' && account.balance > 0 && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="caption">
                                🎯 <strong>Hedef:</strong> Tasarruf hesabınız büyüyor! Yıllık faiz oranınızı 
                                kontrol edin ve daha iyi alternatifler araştıralım.
                              </Typography>
                            </Alert>
                          )}
                          
                          {account.type === 'investment' && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography variant="caption">
                                📈 <strong>Yatırım:</strong> Portföy performansınızı takip edelim. 
                                Risk dağılımınızı analiz edebilirim.
                              </Typography>
                            </Alert>
                          )}
                        </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {!account.isActive && (
                          <Chip label="Pasif" color="error" size="small" />
                        )}
                        {account.isLowBalance && (
                          <Chip label="Düşük Bakiye" color="warning" size="small" />
                        )}
                        {account.isOverdrawn && (
                          <Chip label="Eksi Bakiye" color="error" size="small" />
                        )}
                        {account.isUsingOverdraft && (
                          <Chip label="Esnek Hesap Kullanımda" color="warning" size="small" />
                        )}
                      </Box>

                      {account.iban && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          IBAN: {account.iban.replace(/(.{4})/g, '$1 ').trim()}
                        </Typography>
                      )}
                      {account.accountNumber && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Hesap No: {account.accountNumber}
                        </Typography>
                      )}
                      <Typography variant="caption" color="textSecondary">
                        Para Birimi: {account.currency} • Oluşturulma: {formatDate(account.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Henüz hesap eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                İlk hesabınızı ekleyerek başlayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                İlk Hesabı Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingAccount ? 'Hesap Düzenle' : 'Yeni Hesap Ekle'}
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
                    handleFormChange('name', `${newValue.name} Hesabım`);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Banka Seçin"
                    error={!!formErrors.bankId}
                    helperText={formErrors.bankId || 'Hesabınızın bulunduğu bankayı seçin'}
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
                label="Hesap Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                placeholder="Örn: Ziraat Bankası Maaş Hesabı"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                select
                label="Hesap Türü"
                value={formData.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
                sx={{ mb: 3 }}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {type.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Başlangıç Bakiyesi"
                type="number"
                value={formData.balance}
                onChange={(e) => handleFormChange('balance', e.target.value)}
                error={!!formErrors.balance}
                helperText={formErrors.balance}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                sx={{ mb: 3 }}
              />

              {/* Esnek Hesap Limiti sadece esnek hesap türü için */}


              <TextField
                fullWidth
                label="IBAN"
                value={formData.iban}
                onChange={(e) => handleFormChange('iban', e.target.value.toUpperCase())}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                helperText="Türkiye IBAN formatında giriniz"
                inputProps={{ maxLength: 32 }}
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Hesap Numarası"
                value={formData.accountNumber}
                onChange={(e) => handleFormChange('accountNumber', e.target.value)}
                placeholder="Hesap numaranız"
                helperText="İsteğe bağlı"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                select
                label="Para Birimi"
                value={formData.currency}
                onChange={(e) => handleFormChange('currency', e.target.value)}
              >
                <MenuItem value="TRY">Türk Lirası (₺)</MenuItem>
                <MenuItem value="USD">Amerikan Doları ($)</MenuItem>
                <MenuItem value="EUR">Euro (€)</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : (editingAccount ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>


      </Box>
    </Container>
  );
};

export default AccountsPage;