import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  CalendarToday,
  Payment,
  AccountBalance,
  CreditCard,
  Repeat,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Landscape,
  PhoneIphone,
  DirectionsCar,
  School,
  Home,
  Computer,
  ShoppingCart,
  Category,
  ViewList,
  CalendarMonth,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  fixedPaymentsAPI, 
  installmentPaymentsAPI, 
  transactionsAPI,
  formatCurrency, 
  formatDate 
} from '../../services/api';

// Category icons mapping
const categoryIcons = {
  'Arsa': <Landscape />,
  'Teknoloji': <PhoneIphone />,
  'Araba': <DirectionsCar />,
  'Eğitim': <School />,
  'Ev & Yaşam': <Home />,
  'Bilgisayar': <Computer />,
  'Alışveriş': <ShoppingCart />,
  'Kira': <Home />,
  'Elektrik': <Home />,
  'Su': <Home />,
  'Doğalgaz': <Home />,
  'İnternet': <PhoneIphone />,
  'Telefon': <PhoneIphone />,
  'Diğer': <Category />
};

const PaymentCalendarPage = () => {
  const { showSuccess, showError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState([]);
  const [summary, setSummary] = useState({
    totalFixed: 0,
    totalInstallments: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0
  });

  useEffect(() => {
    loadCalendarData();
  }, [selectedMonth, selectedYear]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      const [fixedRes, installmentRes, transactionsRes] = await Promise.allSettled([
        fixedPaymentsAPI.getAll(),
        installmentPaymentsAPI.getUpcomingPayments({ 
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
        transactionsAPI.getAll({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
      ]);

      const fixedPayments = fixedRes.status === 'fulfilled' ? (fixedRes.value.data.data || fixedRes.value.data || []) : [];
      const installmentPayments = installmentRes.status === 'fulfilled' ? (installmentRes.value.data.data || installmentRes.value.data || []) : [];
      const transactions = transactionsRes.status === 'fulfilled' ? (transactionsRes.value.data.data?.transactions || transactionsRes.value.data || []) : [];

      // Combine all payments into calendar format
      const calendarItems = [];
      
      // Add fixed payments
      fixedPayments.forEach(payment => {
        const paymentDate = new Date(selectedYear, selectedMonth, payment.dueDay);
        if (paymentDate.getMonth() === selectedMonth) {
          calendarItems.push({
            id: `fixed-${payment.id}`,
            type: 'fixed',
            title: payment.name,
            amount: payment.amount,
            date: paymentDate,
            category: payment.category,
            status: 'pending',
            icon: <Repeat />
          });
        }
      });

      // Add installment payments
      installmentPayments.forEach(payment => {
        if (payment.nextPaymentDate) {
          const paymentDate = new Date(payment.nextPaymentDate);
          if (paymentDate.getMonth() === selectedMonth && paymentDate.getFullYear() === selectedYear) {
            calendarItems.push({
              id: `installment-${payment.id}`,
              type: 'installment',
              title: payment.itemName,
              amount: payment.installmentAmount,
              date: paymentDate,
              category: payment.category,
              status: paymentDate < new Date() ? 'overdue' : 'pending',
              icon: <TrendingUp />
            });
          }
        }
      });

      // Add transactions (income/expenses)
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        calendarItems.push({
          id: `transaction-${transaction.id}`,
          type: transaction.type,
          title: transaction.description,
          amount: transaction.amount,
          date: transactionDate,
          category: transaction.category,
          status: 'completed',
          icon: transaction.type === 'income' ? <TrendingUp /> : <Payment />
        });
      });

      // Sort by date
      calendarItems.sort((a, b) => a.date - b.date);
      setCalendarData(calendarItems);

      // Calculate summary
      const totalFixed = fixedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalInstallments = installmentPayments.reduce((sum, p) => sum + p.installmentAmount, 0);
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      setSummary({
        totalFixed,
        totalInstallments,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses - totalFixed - totalInstallments
      });

    } catch (error) {
      showError('Ödeme takvimi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    return categoryIcons[category] || categoryIcons['Diğer'];
  };

  // Takvim için helper fonksiyonlar
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Pazartesi = 0, Pazar = 6
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    // Önceki ayın son günleri
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, prevMonthDays - i)
      });
    }

    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(selectedYear, selectedMonth, day)
      });
    }

    // Sonraki ayın ilk günleri (42 gün tamamlamak için)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day)
      });
    }

    return days;
  };

  const getPaymentsForDate = (date) => {
    return calendarData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'error';
      case 'fixed': return 'info';
      case 'installment': return 'warning';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'income': return 'Gelir';
      case 'expense': return 'Gider';
      case 'fixed': return 'Sabit Ödeme';
      case 'installment': return 'Taksit';
      default: return type;
    }
  };

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ödeme Takvimi
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Tüm ödemelerinizi, gelirlerinizi ve giderlerinizi tek yerden takip edin
        </Typography>

        {/* Month/Year Selector */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ay</InputLabel>
            <Select
              value={selectedMonth}
              label="Ay"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month, index) => (
                <MenuItem key={index} value={index}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Yıl</InputLabel>
            <Select
              value={selectedYear}
              label="Yıl"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="calendar">
              <CalendarMonth sx={{ mr: 1 }} />
              Takvim
            </ToggleButton>
            <ToggleButton value="list">
              <ViewList sx={{ mr: 1 }} />
              Liste
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 32, height: 32 }}>
                    <TrendingUp fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Gelir
                  </Typography>
                </Box>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(summary.totalIncome)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'error.main', mr: 2, width: 32, height: 32 }}>
                    <Payment fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Gider
                  </Typography>
                </Box>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(summary.totalExpenses)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2, width: 32, height: 32 }}>
                    <Repeat fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Sabit Ödeme
                  </Typography>
                </Box>
                <Typography variant="h6" color="info.main">
                  {formatCurrency(summary.totalFixed)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 32, height: 32 }}>
                    <Schedule fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Taksit
                  </Typography>
                </Box>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(summary.totalInstallments)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ 
                    bgcolor: summary.netAmount >= 0 ? 'success.main' : 'error.main', 
                    mr: 2, 
                    width: 32, 
                    height: 32 
                  }}>
                    <AccountBalance fontSize="small" />
                  </Avatar>
                  <Typography variant="body2" color="textSecondary">
                    Net Durum
                  </Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  color={summary.netAmount >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summary.netAmount)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Calendar/List View */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {months[selectedMonth]} {selectedYear} - Ödeme Takvimi
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Yükleniyor...</Typography>
              </Box>
            ) : calendarData.length === 0 ? (
              <Alert severity="info">
                Bu ay için herhangi bir ödeme veya işlem bulunamadı.
              </Alert>
            ) : viewMode === 'calendar' ? (
              // Takvim Görünümü
              <Box>
                {/* Haftanın günleri */}
                <Grid container sx={{ mb: 1 }}>
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                    <Grid item xs key={day}>
                      <Typography 
                        variant="subtitle2" 
                        align="center" 
                        sx={{ 
                          py: 1, 
                          bgcolor: 'grey.100', 
                          fontWeight: 'bold',
                          borderRight: '1px solid',
                          borderColor: 'grey.300'
                        }}
                      >
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                {/* Takvim günleri */}
                <Grid container>
                  {getCalendarDays().map((dayInfo, index) => {
                    const dayPayments = getPaymentsForDate(dayInfo.date);
                    const isToday = dayInfo.date.toDateString() === new Date().toDateString();
                    
                    return (
                      <Grid item xs key={index}>
                        <Paper
                          sx={{
                            minHeight: 120,
                            p: 1,
                            border: '1px solid',
                            borderColor: 'grey.300',
                            bgcolor: dayInfo.isCurrentMonth ? 'background.paper' : 'grey.50',
                            position: 'relative',
                            '&:hover': {
                              bgcolor: dayInfo.isCurrentMonth ? 'grey.50' : 'grey.100'
                            }
                          }}
                        >
                          {/* Gün numarası */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isToday ? 'bold' : 'normal',
                              color: dayInfo.isCurrentMonth ? 'text.primary' : 'text.secondary',
                              bgcolor: isToday ? 'primary.main' : 'transparent',
                              color: isToday ? 'white' : (dayInfo.isCurrentMonth ? 'text.primary' : 'text.secondary'),
                              borderRadius: isToday ? '50%' : 0,
                              width: isToday ? 24 : 'auto',
                              height: isToday ? 24 : 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 0.5
                            }}
                          >
                            {dayInfo.day}
                          </Typography>

                          {/* Ödemeler */}
                          <Box sx={{ maxHeight: 90, overflow: 'hidden' }}>
                            {dayPayments.slice(0, 3).map((payment, idx) => (
                              <Chip
                                key={idx}
                                label={payment.title}
                                size="small"
                                color={getTypeColor(payment.type)}
                                sx={{
                                  fontSize: '0.6rem',
                                  height: 20,
                                  mb: 0.5,
                                  display: 'block',
                                  '& .MuiChip-label': {
                                    px: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%'
                                  }
                                }}
                              />
                            ))}
                            {dayPayments.length > 3 && (
                              <Typography variant="caption" color="textSecondary">
                                +{dayPayments.length - 3} daha
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Tür</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell>Kategori</TableCell>
                      <TableCell align="right">Tutar</TableCell>
                      <TableCell>Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calendarData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday fontSize="small" color="action" />
                            {formatDate(item.date)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getTypeLabel(item.type)}
                            color={getTypeColor(item.type)}
                            icon={item.icon}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(item.category)}
                            <Typography variant="body2">
                              {item.category || 'Diğer'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            color={item.type === 'income' ? 'success.main' : 'text.primary'}
                          >
                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              item.status === 'completed' ? 'Tamamlandı' :
                              item.status === 'pending' ? 'Bekliyor' : 'Gecikmiş'
                            }
                            color={getStatusColor(item.status)}
                            icon={
                              item.status === 'completed' ? <CheckCircle /> :
                              item.status === 'overdue' ? <Warning /> : <Schedule />
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PaymentCalendarPage;