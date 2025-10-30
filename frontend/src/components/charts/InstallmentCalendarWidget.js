import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  Button,
  Divider
} from '@mui/material';
import {
  Schedule,
  Warning,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Payment,
  ShoppingCart,
  DirectionsCar,
  PhoneIphone,
  School,
  Home,
  Computer,
  Category,
  Landscape
} from '@mui/icons-material';
import ChartWrapper from './ChartWrapper';
import { formatCurrency, formatDate } from '../../services/api';

// Category icons mapping
const categoryIcons = {
  'Arsa': <Landscape />,
  'Teknoloji': <PhoneIphone />,
  'Araba': <DirectionsCar />,
  'Eğitim': <School />,
  'Ev & Yaşam': <Home />,
  'Bilgisayar': <Computer />,
  'Alışveriş': <ShoppingCart />,
  'Diğer': <Category />
};

const InstallmentCalendarWidget = ({ 
  installments = [], 
  selectedMonth = new Date().getMonth(),
  selectedYear = new Date().getFullYear(),
  loading = false,
  error = null,
  onMonthChange = () => {},
  onPaymentClick = () => {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Ay isimleri
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Gün isimleri
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Takvim günlerini hesapla
  const getCalendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Pazartesi = 0
    
    const days = [];
    
    // Önceki ayın son günleri
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
      days.push({
        day: prevMonthDays - i,
        date: new Date(prevYear, prevMonth, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        date: new Date(selectedYear, selectedMonth, day),
        isCurrentMonth: true
      });
    }
    
    // Sonraki ayın ilk günleri (42 gün tamamlamak için - 6x7 grid)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      days.push({
        day,
        date: new Date(nextYear, nextMonth, day),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [selectedMonth, selectedYear]);

  // Belirli bir tarihteki taksitleri getir
  const getInstallmentsForDate = (date) => {
    return installments.filter(installment => {
      if (!installment.nextPaymentDate) return false;
      const paymentDate = new Date(installment.nextPaymentDate);
      return paymentDate.toDateString() === date.toDateString();
    });
  };

  // Gün tıklama handler'ı
  const handleDayClick = (date, dayInstallments) => {
    if (dayInstallments.length > 0) {
      setSelectedDate({ date, installments: dayInstallments });
      setDialogOpen(true);
    }
  };

  // Dialog kapatma
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDate(null);
  };

  // Ay değiştirme
  const handlePrevMonth = () => {
    const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    onMonthChange(newMonth, newYear);
  };

  const handleNextMonth = () => {
    const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    onMonthChange(newMonth, newYear);
  };

  // Kategori ikonu getir
  const getCategoryIcon = (category) => {
    return categoryIcons[category] || categoryIcons['Diğer'];
  };

  // Bugünün tarihi
  const today = new Date();
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <ChartWrapper loading={loading} error={error} minHeight="400px">
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" component="div">
            {months[selectedMonth]} {selectedYear}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Gün başlıkları */}
        <Grid container spacing={0} sx={{ mb: 1 }}>
          {dayNames.map((dayName) => (
            <Grid item xs key={dayName} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                {dayName}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Takvim günleri */}
        <Grid container spacing={0}>
          {getCalendarDays.map((dayInfo, index) => {
            const dayInstallments = getInstallmentsForDate(dayInfo.date);
            const hasPayments = dayInstallments.length > 0;
            const hasOverdue = dayInstallments.some(inst => inst.isOverdue);
            const totalAmount = dayInstallments.reduce((sum, inst) => sum + inst.installmentAmount, 0);

            return (
              <Grid item xs key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    minHeight: isMobile ? 40 : 60,
                    p: 0.5,
                    cursor: hasPayments ? 'pointer' : 'default',
                    bgcolor: !dayInfo.isCurrentMonth 
                      ? 'grey.50' 
                      : isToday(dayInfo.date)
                      ? 'primary.50'
                      : hasPayments
                      ? hasOverdue ? 'error.50' : 'success.50'
                      : 'transparent',
                    border: isToday(dayInfo.date) ? '2px solid' : '1px solid',
                    borderColor: isToday(dayInfo.date) 
                      ? 'primary.main' 
                      : hasPayments
                      ? hasOverdue ? 'error.main' : 'success.main'
                      : 'grey.200',
                    '&:hover': hasPayments ? {
                      bgcolor: hasOverdue ? 'error.100' : 'success.100',
                      transform: 'scale(1.02)',
                      transition: 'all 0.2s'
                    } : {}
                  }}
                  onClick={() => handleDayClick(dayInfo.date, dayInstallments)}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday(dayInfo.date) ? 'bold' : 'normal',
                      color: !dayInfo.isCurrentMonth 
                        ? 'text.disabled' 
                        : isToday(dayInfo.date)
                        ? 'primary.main'
                        : 'text.primary',
                      textAlign: 'center',
                      mb: hasPayments ? 0.5 : 0
                    }}
                  >
                    {dayInfo.day}
                  </Typography>
                  
                  {hasPayments && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: isMobile ? '0.5rem' : '0.6rem',
                          color: hasOverdue ? 'error.dark' : 'success.dark',
                          fontWeight: 'bold'
                        }}
                      >
                        {dayInstallments.length} taksit
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: isMobile ? '0.4rem' : '0.5rem',
                          color: hasOverdue ? 'error.dark' : 'success.dark'
                        }}
                      >
                        {formatCurrency(totalAmount)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Açıklama */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: 1 }} />
            <Typography variant="caption">Taksit Var</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: 1 }} />
            <Typography variant="caption">Gecikmiş</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', borderRadius: 1 }} />
            <Typography variant="caption">Bugün</Typography>
          </Box>
        </Box>
      </Box>

      {/* Taksit Detayları Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '80vh' }
        }}
      >
        <DialogTitle>
          {selectedDate && (
            <Box>
              <Typography variant="h6">
                {formatDate(selectedDate.date)} - Taksitler
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedDate.installments.length} taksit • Toplam: {formatCurrency(
                  selectedDate.installments.reduce((sum, inst) => sum + inst.installmentAmount, 0)
                )}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedDate && (
            <List>
              {selectedDate.installments.map((installment, index) => (
                <React.Fragment key={installment.id}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      borderRadius: 1
                    }}
                    onClick={() => onPaymentClick(installment)}
                  >
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: installment.isOverdue ? 'error.main' : 'primary.main',
                          width: 40,
                          height: 40
                        }}
                      >
                        {getCategoryIcon(installment.category)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {installment.itemName}
                          </Typography>
                          {installment.isOverdue && (
                            <Chip 
                              label="Gecikmiş" 
                              color="error" 
                              size="small" 
                              icon={<Warning />} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Taksit: {installment.paidInstallments + 1} / {installment.totalInstallments}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Tutar: {formatCurrency(installment.installmentAmount)}
                          </Typography>
                          {installment.vendor && (
                            <Typography variant="body2" color="textSecondary">
                              {installment.vendor}
                            </Typography>
                          )}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Kalan: {formatCurrency(installment.remainingAmount)} • 
                              %{installment.completionPercentage} tamamlandı
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Payment />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPaymentClick(installment);
                        }}
                        disabled={installment.completionPercentage === 100}
                      >
                        Öde
                      </Button>
                    </Box>
                  </ListItem>
                  {index < selectedDate.installments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </ChartWrapper>
  );
};

export default InstallmentCalendarWidget;