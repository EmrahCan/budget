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
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { fixedPaymentsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';

// Sabit ödeme kategorileri ve ikonları
const PAYMENT_CATEGORIES = [
  // Konut ve Barınma
  { value: 'Kira', label: 'Kira', icon: <Home />, color: '#FF6B6B' },
  { value: 'Aidat', label: 'Site/Apartman Aidatı', icon: <Home />, color: '#FF8E8E' },
  { value: 'Emlak_Vergisi', label: 'Emlak Vergisi', icon: <Home />, color: '#FFB3B3' },
  
  // Faturalar - Temel İhtiyaçlar
  { value: 'Elektrik', label: 'Elektrik Faturası', icon: <ElectricBolt />, color: '#4ECDC4' },
  { value: 'Dogalgaz', label: 'Doğalgaz Faturası', icon: <LocalGasStation />, color: '#45B7D1' },
  { value: 'Su', label: 'Su Faturası', icon: <ElectricBolt />, color: '#96CEB4' },
  { value: 'Isitma', label: 'Isıtma/Soğutma', icon: <ElectricBolt />, color: '#FFEAA7' },
  
  // İletişim ve Teknoloji
  { value: 'Telefon', label: 'Telefon Faturası', icon: <Phone />, color: '#DDA0DD' },
  { value: 'Internet', label: 'İnternet Faturası', icon: <Wifi />, color: '#98D8C8' },
  { value: 'Kablo_TV', label: 'Kablo TV/Dijital Platform', icon: <Phone />, color: '#F7DC6F' },
  { value: 'Mobil_Hat', label: 'Mobil Hat Faturası', icon: <Phone />, color: '#BB8FCE' },
  
  // Ulaşım
  { value: 'Arac_Kredisi', label: 'Araç Kredisi', icon: <DirectionsCar />, color: '#85C1E9' },
  { value: 'Arac_Sigortasi', label: 'Araç Sigortası', icon: <DirectionsCar />, color: '#7FB3D3' },
  { value: 'Yakit', label: 'Yakıt (Sabit Tutar)', icon: <LocalGasStation />, color: '#F8C471' },
  { value: 'Otopark', label: 'Otopark Ücreti', icon: <DirectionsCar />, color: '#AED6F1' },
  { value: 'Toplu_Tasima', label: 'Toplu Taşıma Kartı', icon: <DirectionsCar />, color: '#A9DFBF' },
  
  // Sağlık ve Kişisel Bakım
  { value: 'Saglik_Sigortasi', label: 'Sağlık Sigortası', icon: <HealthAndSafety />, color: '#F1948A' },
  { value: 'Spor_Salonu', label: 'Spor Salonu/Fitness', icon: <FitnessCenter />, color: '#82E0AA' },
  { value: 'Doktor_Kontrolu', label: 'Düzenli Doktor Kontrolü', icon: <HealthAndSafety />, color: '#F8D7DA' },
  { value: 'Ilac', label: 'Düzenli İlaç Gideri', icon: <HealthAndSafety />, color: '#D5DBDB' },
  
  // Eğitim ve Gelişim
  { value: 'Okul_Ucreti', label: 'Okul Ücreti', icon: <School />, color: '#D2B4DE' },
  { value: 'Kurs', label: 'Kurs/Eğitim Ücreti', icon: <School />, color: '#C39BD3' },
  { value: 'Kitap_Dergi', label: 'Kitap/Dergi Aboneliği', icon: <School />, color: '#BB8FCE' },
  { value: 'Online_Egitim', label: 'Online Eğitim Platformu', icon: <School />, color: '#A569BD' },
  
  // Finansal Yükümlülükler
  { value: 'Kredi_Karti', label: 'Kredi Kartı Asgari Ödeme', icon: <Schedule />, color: '#F7DC6F' },
  { value: 'Banka_Kredisi', label: 'Banka Kredisi', icon: <Schedule />, color: '#F4D03F' },
  { value: 'Hayat_Sigortasi', label: 'Hayat Sigortası', icon: <HealthAndSafety />, color: '#F8C471' },
  { value: 'Emeklilik', label: 'Bireysel Emeklilik', icon: <Schedule />, color: '#FADBD8' },
  
  // Eğlence ve Sosyal
  { value: 'Streaming', label: 'Streaming Servisleri', icon: <Phone />, color: '#AED6F1' },
  { value: 'Muzik', label: 'Müzik Platformu', icon: <Phone />, color: '#A9DFBF' },
  { value: 'Dernek_Uyelik', label: 'Dernek/Kulüp Üyeliği', icon: <FitnessCenter />, color: '#D5A6BD' },
  
  // Aile ve Çocuk
  { value: 'Cocuk_Bakimi', label: 'Çocuk Bakımı/Kreş', icon: <School />, color: '#F9E79F' },
  { value: 'Oyuncak_Oyun', label: 'Çocuk Oyun/Aktivite', icon: <School />, color: '#F7DC6F' },
  
  // Ev Bakımı ve Temizlik
  { value: 'Temizlik', label: 'Temizlik Hizmeti', icon: <Home />, color: '#A3E4D7' },
  { value: 'Bahce_Bakim', label: 'Bahçe Bakımı', icon: <Home />, color: '#85C1E9' },
  { value: 'Ev_Bakimi', label: 'Ev Bakım/Onarım', icon: <Home />, color: '#D2B4DE' },
  
  // Diğer
  { value: 'Bagis', label: 'Düzenli Bağış', icon: <HealthAndSafety />, color: '#F8D7DA' },
  { value: 'Diger', label: 'Diğer Sabit Giderler', icon: <Schedule />, color: '#D5DBDB' },
];

// Örnek sabit ödemeler (demo için)
const SAMPLE_PAYMENTS = [
  { name: 'Ev Kirası', amount: 2500, category: 'Kira', dueDay: 1 },
  { name: 'Site Aidatı', amount: 200, category: 'Aidat', dueDay: 1 },
  { name: 'Elektrik Faturası', amount: 150, category: 'Elektrik', dueDay: 15 },
  { name: 'Doğalgaz Faturası', amount: 120, category: 'Dogalgaz', dueDay: 25 },
  { name: 'Su Faturası', amount: 80, category: 'Su', dueDay: 20 },
  { name: 'İnternet Faturası', amount: 100, category: 'Internet', dueDay: 10 },
  { name: 'Telefon Faturası', amount: 80, category: 'Telefon', dueDay: 20 },
  { name: 'Netflix Aboneliği', amount: 45, category: 'Streaming', dueDay: 5 },
  { name: 'Spor Salonu', amount: 150, category: 'Spor_Salonu', dueDay: 5 },
  { name: 'Araç Sigortası', amount: 200, category: 'Arac_Sigortasi', dueDay: 12 },
  { name: 'Sağlık Sigortası', amount: 300, category: 'Saglik_Sigortasi', dueDay: 8 },
  { name: 'Bireysel Emeklilik', amount: 250, category: 'Emeklilik', dueDay: 3 },
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
      setPayments(response.data.data || []);
    } catch (error) {
      showError(handleApiError(error));
      // Fallback to sample data if API fails
      setPayments(SAMPLE_PAYMENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name || '',
        amount: payment.amount?.toString() || '',
        category: payment.category || 'Kira',
        dueDay: payment.dueDay?.toString() || payment.due_day?.toString() || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        amount: '',
        category: 'Kira',
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
        isActive: true,
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

  // Kategori gruplarını oluştur
  const getCategoryGroups = () => {
    const groups = {};
    PAYMENT_CATEGORIES.forEach(category => {
      const groupName = getCategoryGroupName(category.value);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(category);
    });
    return groups;
  };

  const getCategoryGroupName = (categoryValue) => {
    if (['Kira', 'Aidat', 'Emlak_Vergisi'].includes(categoryValue)) return 'Konut ve Barınma';
    if (['Elektrik', 'Dogalgaz', 'Su', 'Isitma'].includes(categoryValue)) return 'Temel Faturalar';
    if (['Telefon', 'Internet', 'Kablo_TV', 'Mobil_Hat'].includes(categoryValue)) return 'İletişim ve Teknoloji';
    if (['Arac_Kredisi', 'Arac_Sigortasi', 'Yakit', 'Otopark', 'Toplu_Tasima'].includes(categoryValue)) return 'Ulaşım';
    if (['Saglik_Sigortasi', 'Spor_Salonu', 'Doktor_Kontrolu', 'Ilac'].includes(categoryValue)) return 'Sağlık ve Kişisel Bakım';
    if (['Okul_Ucreti', 'Kurs', 'Kitap_Dergi', 'Online_Egitim'].includes(categoryValue)) return 'Eğitim ve Gelişim';
    if (['Kredi_Karti', 'Banka_Kredisi', 'Hayat_Sigortasi', 'Emeklilik'].includes(categoryValue)) return 'Finansal Yükümlülükler';
    if (['Streaming', 'Muzik', 'Dernek_Uyelik'].includes(categoryValue)) return 'Eğlence ve Sosyal';
    if (['Cocuk_Bakimi', 'Oyuncak_Oyun'].includes(categoryValue)) return 'Aile ve Çocuk';
    if (['Temizlik', 'Bahce_Bakim', 'Ev_Bakimi'].includes(categoryValue)) return 'Ev Bakımı';
    return 'Diğer';
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
                        <Avatar sx={{ 
                          bgcolor: getCategoryInfo(payment.category).color || 'warning.main', 
                          width: 32, 
                          height: 32 
                        }}>
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
                        <Avatar sx={{ 
                          bgcolor: getCategoryInfo(item.category).color || 'success.main', 
                          width: 32, 
                          height: 32 
                        }}>
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
        {getPaymentsByCategory().map((categoryGroup) => (
          <Card key={categoryGroup.category} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: getCategoryInfo(categoryGroup.category).color || 'primary.main', 
                  mr: 2 
                }}>
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
        ))}

        {payments.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Henüz sabit ödeme eklenmemiş
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Kira, faturalar ve aboneliklerinizi ekleyerek başlayın
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                İlk Sabit Ödemeyi Ekle
              </Button>
            </CardContent>
          </Card>
        )}

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
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 400,
                      },
                    },
                  },
                }}
              >
                {Object.entries(getCategoryGroups()).map(([groupName, categories]) => [
                  <MenuItem key={`group-${groupName}`} disabled sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    backgroundColor: 'grey.100',
                    fontSize: '0.875rem'
                  }}>
                    {groupName}
                  </MenuItem>,
                  ...categories.map((category) => (
                    <MenuItem key={category.value} value={category.value} sx={{ pl: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%',
                          backgroundColor: category.color || 'primary.main',
                          color: 'white',
                          fontSize: '0.75rem'
                        }}>
                          {category.icon}
                        </Box>
                        <Typography variant="body2">
                          {category.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                ]).flat()}
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