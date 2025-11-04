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
  CreditCard as CreditCardIcon,
  MoreVert,
  Payment,
  FilterList,
  Sort,
  Visibility,
} from '@mui/icons-material';

import { useNotification } from '../../contexts/NotificationContext';
import { accountsAPI, formatCurrency, handleApiError } from '../../services/api';
import { turkishBanks, getBankById, popularBanks, searchBanks, bankTypes } from '../../data/turkishBanks';

// Overdraft summary component
const OverdraftSummaryCard = ({ overdrafts }) => {
  const getTotalLimit = () => overdrafts.reduce((total, od) => total + (od.overdraftLimit || 0), 0);
  const getTotalUsed = () => overdrafts.reduce((total, od) => total + Math.abs(Math.min(0, od.currentBalance || 0)), 0);
  const getTotalAvailable = () => getTotalLimit() - getTotalUsed();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Esnek Hesap Özeti
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

// Overdrafts list component
const OverdraftsList = ({ overdrafts, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOverdraft, setSelectedOverdraft] = useState(null);
  const [sortBy] = useState('name'); // 'name', 'balance', 'limit', 'bank'
  const [filterType] = useState('all'); // 'all', 'normal', 'warning', 'critical'

  const getStatusInfo = (overdraft) => {
    const used = Math.abs(Math.min(0, overdraft.currentBalance || 0));
    const utilizationRate = overdraft.overdraftLimit > 0 ? (used / overdraft.overdraftLimit) * 100 : 0;
    
    if (utilizationRate >= 90) {
      return { label: 'Kritik', color: 'error', icon: <Error /> };
    } else if (utilizationRate >= 70) {
      return { label: 'Uyarı', color: 'warning', icon: <Warning /> };
    } else {
      return { label: 'Normal', color: 'success', icon: <CheckCircle /> };
    }
  };

  const handleMenuClick = (event, overdraft) => {
    setAnchorEl(event.currentTarget);
    setSelectedOverdraft(overdraft);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOverdraft(null);
  };

  const sortedAndFilteredOverdrafts = overdrafts
    .filter(overdraft => {
      if (filterType === 'all') return true;
      const statusInfo = getStatusInfo(overdraft);
      return statusInfo.label.toLowerCase() === filterType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return Math.abs(Math.min(0, b.currentBalance || 0)) - Math.abs(Math.min(0, a.currentBalance || 0));
        case 'limit':
          return (b.overdraftLimit || 0) - (a.overdraftLimit || 0);
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
            Esnek Hesaplarım ({sortedAndFilteredOverdrafts.length})
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
          {sortedAndFilteredOverdrafts.map((overdraft, index) => {
            const statusInfo = getStatusInfo(overdraft);
            const used = Math.abs(Math.min(0, overdraft.currentBalance || 0));
            const available = (overdraft.overdraftLimit || 0) - used;
            const utilizationRate = overdraft.overdraftLimit > 0 ? (used / overdraft.overdraftLimit) * 100 : 0;
            
            return (
              <React.Fragment key={overdraft.id}>
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
                        bgcolor: overdraft.bankId ? getBankById(overdraft.bankId)?.color || 'primary.main' : 'primary.main',
                        width: 48,
                        height: 48
                      }}
                    >
                      {overdraft.bankId && getBankById(overdraft.bankId)?.name 
                        ? getBankById(overdraft.bankId).name.charAt(0) 
                        : <CreditCardIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {overdraft.name}
                        </Typography>
                        <Chip 
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="textSecondary" component="span" display="block">
                          {overdraft.bankName || 'Esnek Hesap'}
                        </Typography>
                        {overdraft.accountNumber && (
                          <Typography variant="caption" color="textSecondary" component="span" display="block">
                            Hesap No: {overdraft.accountNumber}
                          </Typography>
                        )}
                        {/* Kullanım oranı progress bar */}
                        <Box component="span" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={utilizationRate}
                            color={utilizationRate > 80 ? 'error' : utilizationRate > 60 ? 'warning' : 'success'}
                            sx={{ height: 6, borderRadius: 1, flexGrow: 1 }}
                          />
                          <Typography variant="caption" color="textSecondary" component="span">
                            %{utilizationRate.toFixed(1)}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    }
                  />
                  
                  <Box sx={{ textAlign: 'right', mr: 2, minWidth: 120 }}>
                    {/* Toplam Limit */}
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                      Limit: {formatCurrency(overdraft.overdraftLimit || 0)}
                    </Typography>
                    
                    {/* Kullanılan Borç */}
                    <Typography variant="body2" color="error.main" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      Kullanılan: {formatCurrency(used)}
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
                    
                    {/* Faiz Oranı */}
                    {overdraft.interestRate && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                          Faiz: %{overdraft.interestRate}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={(e) => handleMenuClick(e, overdraft)}
                    >
                      <MoreVert />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < sortedAndFilteredOverdrafts.length - 1 && <Divider />}
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
          <MenuItem onClick={() => { onEdit && onEdit(selectedOverdraft); handleMenuClose(); }}>
            <Edit sx={{ mr: 1 }} /> Düzenle
          </MenuItem>
          <MenuItem onClick={() => { /* Handle view details */ handleMenuClose(); }}>
            <Visibility sx={{ mr: 1 }} /> Detayları Görüntüle
          </MenuItem>
          <MenuItem onClick={() => { /* Handle payment */ handleMenuClose(); }}>
            <Payment sx={{ mr: 1 }} /> Ödeme Yap
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => { onDelete && onDelete(selectedOverdraft?.id); handleMenuClose(); }}
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
const QuickStats = ({ overdrafts }) => {
  const getStats = () => {
    const criticalOverdrafts = overdrafts.filter(od => {
      const used = Math.abs(Math.min(0, od.currentBalance || 0));
      const utilizationRate = od.overdraftLimit > 0 ? (used / od.overdraftLimit) * 100 : 0;
      return utilizationRate >= 90;
    });
    
    const warningOverdrafts = overdrafts.filter(od => {
      const used = Math.abs(Math.min(0, od.currentBalance || 0));
      const utilizationRate = od.overdraftLimit > 0 ? (used / od.overdraftLimit) * 100 : 0;
      return utilizationRate >= 70 && utilizationRate < 90;
    });
    
    const normalOverdrafts = overdrafts.filter(od => {
      const used = Math.abs(Math.min(0, od.currentBalance || 0));
      const utilizationRate = od.overdraftLimit > 0 ? (used / od.overdraftLimit) * 100 : 0;
      return utilizationRate < 70;
    });

    // Yüksek faizli hesaplar (örnek olarak %15 üzeri)
    const highInterestOverdrafts = overdrafts.filter(od => (od.interestRate || 0) > 15);

    return {
      total: overdrafts.length,
      normal: normalOverdrafts.length,
      warning: warningOverdrafts.length,
      critical: criticalOverdrafts.length,
      highInterest: highInterestOverdrafts.length
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
            Toplam Hesap
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
            {stats.highInterest}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Yüksek Faiz
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

const OverdraftsDashboard = () => {
  const { showSuccess, showError } = useNotification();
  const [overdrafts, setOverdrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverdraft, setEditingOverdraft] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    bankName: '',
    overdraftLimit: '',
    currentBalance: '0',
    interestRate: '',
    accountNumber: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOverdrafts();
  }, []);

  const loadOverdrafts = async () => {
    try {
      setLoading(true);
      const response = await accountsAPI.getAll();
      // Filter only overdraft accounts
      const overdraftAccounts = response.data.data.accounts.filter(account => account.type === 'overdraft');
      setOverdrafts(overdraftAccounts);
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
        overdraftLimit: overdraft.overdraftLimit?.toString() || '',
        currentBalance: overdraft.currentBalance?.toString() || '0',
        interestRate: overdraft.interestRate?.toString() || '',
        accountNumber: overdraft.accountNumber || '',
      });
    } else {
      setEditingOverdraft(null);
      setFormData({
        name: '',
        bankId: '',
        bankName: '',
        overdraftLimit: '',
        currentBalance: '0',
        interestRate: '',
        accountNumber: '',
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
      errors.name = 'Hesap adı gereklidir';
    }
    if (!formData.overdraftLimit || isNaN(parseFloat(formData.overdraftLimit)) || parseFloat(formData.overdraftLimit) <= 0) {
      errors.overdraftLimit = 'Geçerli bir esnek hesap limiti giriniz';
    }
    if (isNaN(parseFloat(formData.currentBalance))) {
      errors.currentBalance = 'Geçerli bir bakiye giriniz';
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
        overdraftLimit: parseFloat(formData.overdraftLimit),
        currentBalance: parseFloat(formData.currentBalance),
        interestRate: parseFloat(formData.interestRate),
        accountNumber: formData.accountNumber.trim() || null,
        type: 'overdraft',
      };
      if (editingOverdraft) {
        await accountsAPI.update(editingOverdraft.id, overdraftData);
        showSuccess('Esnek hesap başarıyla güncellendi');
      } else {
        await accountsAPI.create(overdraftData);
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

  const handleEdit = (overdraft) => {
    handleOpenDialog(overdraft);
  };

  const handleDelete = async (overdraftId) => {
    const overdraft = overdrafts.find(o => o.id === overdraftId);
    if (overdraft && window.confirm(`"${overdraft.name}" esnek hesabını silmek istediğinizden emin misiniz?`)) {
      try {
        await accountsAPI.delete(overdraftId);
        showSuccess('Esnek hesap başarıyla silindi');
        loadOverdrafts();
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
              Esnek Hesaplarım
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Esnek hesap limitlerini ve kullanımlarını yönetin
            </Typography>
          </Box>
        </Box>

        {/* Summary Card */}
        <OverdraftSummaryCard overdrafts={overdrafts} />

        {/* Quick Stats */}
        <QuickStats overdrafts={overdrafts} />

        {/* Overdrafts List */}
        <OverdraftsList 
          overdrafts={overdrafts} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add overdraft"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <Add />
        </Fab>

        {/* Overdraft Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingOverdraft ? 'Esnek Hesap Düzenle' : 'Yeni Esnek Hesap Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Banka Seçimi */}
              <Autocomplete
                options={turkishBanks}
                getOptionLabel={(option) => option.name}
                groupBy={(option) => bankTypes[option.type]}
                value={getBankById(formData.bankId) || null}
                onChange={(_, newValue) => {
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
                    error={!!formErrors.bankId}
                    helperText={formErrors.bankId || 'Esnek hesabınızın bankasını seçin'}
                  />
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
                label="Hesap Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                placeholder="Örn: Ziraat Bankası Esnek Hesap"
                sx={{ mb: 3 }}
              />
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Esnek Hesap Limiti"
                    type="number"
                    value={formData.overdraftLimit}
                    onChange={(e) => handleFormChange('overdraftLimit', e.target.value)}
                    error={!!formErrors.overdraftLimit}
                    helperText={formErrors.overdraftLimit}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Mevcut Bakiye"
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) => handleFormChange('currentBalance', e.target.value)}
                    error={!!formErrors.currentBalance}
                    helperText={formErrors.currentBalance || 'Negatif değer borç anlamına gelir'}
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
                    label="Hesap Numarası"
                    value={formData.accountNumber}
                    onChange={(e) => handleFormChange('accountNumber', e.target.value)}
                    helperText="Opsiyonel"
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
              {submitting ? 'Kaydediliyor...' : (editingOverdraft ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default OverdraftsDashboard;