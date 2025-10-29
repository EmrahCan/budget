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
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Home,
  Phone,
  Wifi,
  ElectricBolt,
  LocalGasStation,
  DirectionsCar,
  FitnessCenter,
  School,
  HealthAndSafety,
  Schedule,
  Warning,
  CheckCircle,
  Tv,
  Movie,
  MusicNote,
  SportsEsports,
  LocalGroceryStore,
  Restaurant,
  Coffee,
  ShoppingCart,
  AccountBalance,
  CreditCard,
  Security,
  Pets,
  ChildCare,
  CleaningServices,
  Build,
  LocalLaundryService,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { fixedPaymentsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';

// Sabit ödeme kategorileri ve ikonları
const PAYMENT_CATEGORIES = [
  { value: 'Konut', label: 'Konut (Kira, Aidat)', icon: <Home /> },
  { value: 'Faturalar', label: 'Faturalar (Elektrik, Su, Doğalgaz)', icon: <ElectricBolt /> },
  { value: 'İletişim', label: 'İletişim (Telefon, İnternet)', icon: <Phone /> },
  { value: 'Eğlence', label: 'Eğlence & Medya', icon: <Tv /> },
  { value: 'Streaming', label: 'Streaming (Netflix, Spotify)', icon: <Movie /> },
  { value: 'Sağlık', label: 'Sağlık & Spor', icon: <HealthAndSafety /> },
  { value: 'Eğitim', label: 'Eğitim & Kurslar', icon: <School /> },
  { value: 'Ulaşım', label: 'Ulaşım & Yakıt', icon: <DirectionsCar /> },
  { value: 'Finans', label: 'Finans & Bankacılık', icon: <AccountBalance /> },
  { value: 'Sigorta', label: 'Sigorta & Güvenlik', icon: <Security /> },
  { value: 'Alışveriş', label: 'Alışveriş & Market', icon: <ShoppingCart /> },
  { value: 'Yemek', label: 'Yemek & İçecek', icon: <Restaurant /> },
  { value: 'Temizlik', label: 'Temizlik & Bakım', icon: <CleaningServices /> },
  { value: 'Çocuk', label: 'Çocuk & Bakım', icon: <ChildCare /> },
  { value: 'Evcil Hayvan', label: 'Evcil Hayvan', icon: <Pets /> },
  { value: 'Diğer', label: 'Diğer', icon: <Schedule /> },
];

const FixedPaymentsPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Faturalar',
    dueDay: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await fixedPaymentsAPI.getAll();
      setPayments(response.data.data || response.data);
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
        name: payment.name,
        amount: payment.amount.toString(),
        category: payment.category,
        dueDay: payment.dueDay.toString(),
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        amount: '',
        category: 'Faturalar',
        dueDay: '',
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
    
    if (!formData.name.trim()) {
      errors.name = 'Ödeme adı gereklidir';
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Geçerli bir tutar giriniz';
    }
    
    if (!formData.dueDay || parseInt(formData.dueDay) < 1 || parseInt(formData.dueDay) > 31) {
      errors.dueDay = 'Ödeme günü 1-31 arasında olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const paymentData = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        dueDay: parseInt(formData.dueDay),
      };

      if (editingPayment) {
        await fixedPaymentsAPI.update(editingPayment.id, paymentData);
        showSuccess('Sabit ödeme başarıyla güncellendi');
      } else {
        await fixedPaymentsAPI.create(paymentData);
        showSuccess('Sabit ödeme başarıyla eklendi');
      }

      handleCloseDialog();
      loadPayments(); // Listeyi yenile
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`"${payment.name}" ödemesini silmek istediğinizden emin misiniz?`)) {
      try {
        await fixedPaymentsAPI.delete(payment.id);
        showSuccess('Sabit ödeme başarıyla silindi');
        loadPayments(); // Listeyi yenile
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  const getCategoryInfo = (category) => {
    return PAYMENT_CATEGORIES.find(c => c.value === category) || PAYMENT_CATEGORIES[0];
  };

  const getTotalMonthlyPayments = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const currentDay = today.getDate();
    
    return payments
      .map(payment => ({
        ...payment,
        daysUntil: payment.dueDay >= currentDay 
          ? payment.dueDay - currentDay 
          : (new Date(today.getFullYear(), today.getMonth() + 1, payment.dueDay) - today) / (1000 * 60 * 60 * 24)
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  };

  const getPaymentsByCategory = () => {
    const grouped = payments.reduce((acc, payment) => {
      if (!acc[payment.category]) {
        acc[payment.category] = [];
      }
      acc[payment.category].push(payment);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, categoryPayments]) => ({
      category,
      payments: categoryPayments,
      total: categoryPayments.reduce((sum, p) => sum + p.amount, 0)
    }));
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Sabit Ödemelerim
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Aylık sabit ödemelerinizi (kira, faturalar, abonelikler) yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Sabit Ödeme Ekle
          </Button>
        </Box>

        {/* Alert */}


        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Schedule />
                  </Avatar>
                  <Typography variant="h6" color="textSecondary">
                    Toplam Aylık Ödeme
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" color="error.main">
                  {formatCurrency(getTotalMonthlyPayments())}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {payments.length} sabit ödeme
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yaklaşan Ödemeler
                </Typography>
                <List dense>
                  {getUpcomingPayments().slice(0, 3).map((payment, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                          {getCategoryInfo(payment.category).icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={payment.name}
                        secondary={`${Math.ceil(payment.daysUntil)} gün sonra - ${formatCurrency(payment.amount)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kategori Dağılımı
                </Typography>
                <List dense>
                  {getPaymentsByCategory().slice(0, 3).map((item, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          {getCategoryInfo(item.category).icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={item.category}
                        secondary={`${item.payments.length} ödeme - ${formatCurrency(item.total)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payments by Category */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Henüz sabit ödeme eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                İlk sabit ödemenizi eklemek için "Sabit Ödeme Ekle" butonuna tıklayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Sabit Ödeme Ekle
              </Button>
            </CardContent>
          </Card>
        ) : (
          getPaymentsByCategory().map((categoryGroup) => (
          <Card key={categoryGroup.category} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  {getCategoryInfo(categoryGroup.category).icon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    {categoryGroup.category}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {categoryGroup.payments.length} ödeme - Toplam: {formatCurrency(categoryGroup.total)}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {categoryGroup.payments.map((payment, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {payment.name}
                          </Typography>
                          <Box>
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
                        
                        <Typography variant="h6" color="error.main" gutterBottom>
                          {formatCurrency(payment.amount)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`${payment.dueDay}. gün`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="textSecondary">
                            Her ay {payment.dueDay}. günü
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )))}

        {/* Payment Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingPayment ? 'Sabit Ödeme Düzenle' : 'Yeni Sabit Ödeme Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Ödeme Adı"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{ mb: 3 }}
                placeholder="örn: Kira, Elektrik Faturası, İnternet"
              />

              <TextField
                fullWidth
                select
                label="Kategori"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                sx={{ mb: 3 }}
              >
                {PAYMENT_CATEGORIES.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {category.icon}
                      {category.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Aylık Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Ödeme Günü (Ayın Kaçı)"
                type="number"
                value={formData.dueDay}
                onChange={(e) => handleFormChange('dueDay', e.target.value)}
                error={!!formErrors.dueDay}
                helperText={formErrors.dueDay || 'Ayın hangi günü ödeme yapacağınızı belirtin (1-31)'}
                inputProps={{ min: 1, max: 31 }}
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
              {submitting ? 'Kaydediliyor...' : (editingPayment ? 'Güncelle' : 'Ekle')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default FixedPaymentsPage;