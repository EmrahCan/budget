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
  useTheme
} from '@mui/material';
import {
  Schedule,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import ChartWrapper from './ChartWrapper';
import { formatCurrency } from '../../services/api';

const PaymentCalendarWidget = ({ 
  payments = [], 
  selectedMonth = new Date().getMonth(),
  selectedYear = new Date().getFullYear(),
  loading = false,
  error = null 
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

  // Mini takvim günlerini hesapla
  const getMiniCalendarDays = useMemo(() => {
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
    
    // Sonraki ayın ilk günleri (28 gün tamamlamak için - 4x7 grid)
    const remainingDays = 28 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      days.push({
        day,
        date: new Date(nextYear, nextMonth, day),
        isCurrentMonth: false
      });
    }
    
    return days.slice(0, 28); // 4x7 grid için 28 gün
  }, [selectedMonth, selectedYear]);

  // Belirli bir tarihteki ödemeleri getir
  const getPaymentsForDate = (date) => {
    return payments.filter(payment => {
      const paymentDate = new Date(selectedYear, selectedMonth, payment.dueDay);
      return paymentDate.toDateString() === date.toDateString();
    });
  };

  // Gün tıklama handler'ı
  const handleDayClick = (date, dayPayments) => {
    if (dayPayments.length > 0) {
      setSelectedDate({ date, payments: dayPayments });
      setDialogOpen(true);
    }
  };

  // Dialog kapatma
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDate(null);
  };

  // Ödeme durumu belirleme
  const getPaymentStatus = (payment) => {
    const paymentDate = new Date(selectedYear, selectedMonth, payment.dueDay);
    const today = new Date();
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const paymentDateWithoutTime = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
    
    if (paymentDateWithoutTime < todayWithoutTime) {
      return { status: 'overdue', color: 'error', icon: <Warning /> };
    } else if (paymentDateWithoutTime.getTime() === todayWithoutTime.getTime()) {
      return { status: 'today', color: 'warning', icon: <Schedule /> };
    } else {
      return { status: 'pending', color: 'info', icon: <Schedule /> };
    }
  };

  const calendarContent = (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
        {months[selectedMonth]} {selectedYear}
      </Typography>
      
      {/* Haftanın günleri */}
      <Grid container spacing={0.5} sx={{ mb: 1 }}>
        {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, index) => (
          <Grid item xs key={index}>
            <Typography 
              variant="caption" 
              align="center" 
              sx={{ 
                display: 'block',
                fontWeight: 'bold',
                color: 'text.secondary',
                fontSize: isMobile ? '0.6rem' : '0.75rem'
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>
      
      {/* Takvim günleri */}
      <Grid container spacing={0.5}>
        {getMiniCalendarDays.map((dayInfo, index) => {
          const dayPayments = getPaymentsForDate(dayInfo.date);
          const totalAmount = dayPayments.reduce((sum, payment) => sum + payment.amount, 0);
          const hasOverdue = dayPayments.some(payment => getPaymentStatus(payment).status === 'overdue');
          const isToday = dayInfo.date.toDateString() === new Date().toDateString();
          
          return (
            <Grid item xs key={index}>
              <Paper
                sx={{
                  minHeight: isMobile ? 32 : 40,
                  p: 0.5,
                  cursor: dayPayments.length > 0 ? 'pointer' : 'default',
                  bgcolor: hasOverdue ? 'error.light' : 
                           dayPayments.length > 0 ? 'primary.light' : 
                           isToday ? 'warning.light' : 'transparent',
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'warning.main' : 'grey.300',
                  opacity: dayInfo.isCurrentMonth ? 1 : 0.3,
                  '&:hover': {
                    bgcolor: dayPayments.length > 0 ? 
                             (hasOverdue ? 'error.main' : 'primary.main') : 
                             'grey.100',
                    color: dayPayments.length > 0 ? 'white' : 'inherit'
                  }
                }}
                onClick={() => handleDayClick(dayInfo.date, dayPayments)}
              >
                <Typography 
                  variant="caption" 
                  align="center" 
                  sx={{ 
                    display: 'block',
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    fontWeight: isToday ? 'bold' : 'normal'
                  }}
                >
                  {dayInfo.day}
                </Typography>
                
                {totalAmount > 0 && (
                  <Typography 
                    variant="caption" 
                    align="center"
                    sx={{ 
                      display: 'block',
                      fontSize: isMobile ? '0.5rem' : '0.6rem',
                      color: hasOverdue ? 'error.dark' : 'primary.dark',
                      fontWeight: 'bold'
                    }}
                  >
                    ₺{totalAmount > 1000 ? `${(totalAmount/1000).toFixed(1)}K` : totalAmount}
                  </Typography>
                )}
                
                {dayPayments.length > 1 && (
                  <Typography 
                    variant="caption" 
                    align="center"
                    sx={{ 
                      display: 'block',
                      fontSize: '0.5rem',
                      color: 'text.secondary'
                    }}
                  >
                    +{dayPayments.length - 1}
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  return (
    <>
      <ChartWrapper
        title="Bu Ay Ödemeler"
        loading={loading}
        error={error}
        height={isMobile ? 250 : 300}
      >
        {calendarContent}
      </ChartWrapper>

      {/* Ödeme Detayları Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDate && (
            <Box>
              <Typography variant="h6">
                {selectedDate.date.toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedDate.payments.length} ödeme
              </Typography>
            </Box>
          )}
        </DialogTitle>
        
        <DialogContent>
          {selectedDate && (
            <List>
              {selectedDate.payments.map((payment, index) => {
                const statusInfo = getPaymentStatus(payment);
                return (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: statusInfo.color + '.main', width: 32, height: 32 }}>
                        {statusInfo.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={payment.name}
                      secondary={payment.category}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <Chip
                        label={
                          statusInfo.status === 'overdue' ? 'Gecikmiş' :
                          statusInfo.status === 'today' ? 'Bugün' : 'Bekliyor'
                        }
                        color={statusInfo.color}
                        size="small"
                      />
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentCalendarWidget;