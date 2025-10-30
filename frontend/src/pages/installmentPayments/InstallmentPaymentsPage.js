import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add,
  Payment,
  Edit,
  Delete,
  History,
  Warning,
  CheckCircle,
  CalendarToday,
  TrendingUp,
  ShoppingCart,
  DirectionsCar,
  PhoneIphone,
  School,
  Home,
  Computer,
  Category,
  Landscape,
  ViewList,
  ViewModule,
  CalendarMonth,
  Schedule,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { installmentPaymentsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import InstallmentCalendarWidget from '../../components/charts/InstallmentCalendarWidget';

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

// Month names in Turkish
const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Generate year range (current year ±5)
const YEAR_RANGE = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

const InstallmentPaymentsPage = () => {
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [installmentPayments, setInstallmentPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    totalAmount: '',
    installmentAmount: '',
    totalInstallments: '',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
  });
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
    receiptNumber: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Görünüm state'leri
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'calendar', 'list'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Takvim detay modal state'leri
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);
  
  // Touch gesture state'leri
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Debounce state for month/year changes
  const [isChangingDate, setIsChangingDate] = useState(false);
  
  // Error handling states
  const [error, setError] = useState(null);
  const [calendarError, setCalendarError] = useState(null);
  const [listError, setListError] = useState(null);

  const categories = [
    'Arsa',
    'Teknoloji',
    'Araba', 
    'Eğitim',
    'Ev & Yaşam',
    'Bilgisayar',
    'Alışveriş',
    'Diğer'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      clearError();
      
      const [paymentsRes, summaryRes] = await Promise.allSettled([
        installmentPaymentsAPI.getAll(),
        installmentPaymentsAPI.getSummary(),
      ]);
      
      if (paymentsRes.status === 'fulfilled') {
        setInstallmentPayments(paymentsRes.value.data.data);
      } else {
        handleDataError(paymentsRes.reason, 'Taksit ödemeleri yükleme');
      }
      
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data.data);
      } else {
        handleDataError(summaryRes.reason, 'Özet bilgileri yükleme');
      }
    } catch (error) {
      handleDataError(error, 'Veri yükleme');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        itemName: payment.itemName,
        category: payment.category || '',
        totalAmount: payment.totalAmount.toString(),
        installmentAmount: payment.installmentAmount.toString(),
        totalInstallments: payment.totalInstallments.toString(),
        interestRate: payment.interestRate.toString(),
        startDate: payment.startDate ? payment.startDate.split('T')[0] : '',
        vendor: payment.vendor || '',
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        itemName: '',
        category: '',
        totalAmount: '',
        installmentAmount: '',
        totalInstallments: '',
        interestRate: '0',
        startDate: new Date().toISOString().split('T')[0],
        vendor: '',
        notes: '',
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
    
    if (!formData.itemName.trim()) {
      errors.itemName = 'Ürün/hizmet adı gereklidir';
    }
    
    if (!formData.totalAmount || isNaN(parseFloat(formData.totalAmount)) || parseFloat(formData.totalAmount) <= 0) {
      errors.totalAmount = 'Geçerli bir toplam tutar giriniz';
    }
    
    if (!formData.installmentAmount || isNaN(parseFloat(formData.installmentAmount)) || parseFloat(formData.installmentAmount) <= 0) {
      errors.installmentAmount = 'Geçerli bir taksit tutarı giriniz';
    }
    
    if (!formData.totalInstallments || isNaN(parseInt(formData.totalInstallments)) || parseInt(formData.totalInstallments) <= 0) {
      errors.totalInstallments = 'Geçerli bir taksit sayısı giriniz';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Başlangıç tarihi gereklidir';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      const paymentData = {
        itemName: formData.itemName.trim(),
        category: formData.category || null,
        totalAmount: parseFloat(formData.totalAmount),
        installmentAmount: parseFloat(formData.installmentAmount),
        totalInstallments: parseInt(formData.totalInstallments),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        vendor: formData.vendor.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingPayment) {
        await installmentPaymentsAPI.update(editingPayment.id, paymentData);
        showSuccess('Taksitli ödeme başarıyla güncellendi');
      } else {
        await installmentPaymentsAPI.create(paymentData);
        showSuccess('Taksitli ödeme başarıyla oluşturuldu');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`"${payment.itemName}" taksitli ödemesini silmek istediğinizden emin misiniz?`)) {
      try {
        await installmentPaymentsAPI.delete(payment.id);
        showSuccess('Taksitli ödeme başarıyla silindi');
        loadData();
      } catch (error) {
        showError(handleApiError(error));
      }
    }
  };

  // Payment functions
  const handleOpenPaymentDialog = (payment) => {
    setSelectedPayment(payment);
    setPaymentData({
      amount: payment.installmentAmount?.toString() || '',
      paymentDate: new Date().toISOString().split('T')[0],
      description: `${payment.itemName} - ${payment.paidInstallments + 1}. taksit`,
      receiptNumber: '',
    });
    setPaymentErrors({});
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedPayment(null);
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
        description: paymentData.description.trim() || `${selectedPayment.itemName} taksit ödemesi`,
        receiptNumber: paymentData.receiptNumber.trim() || null,
      };

      await installmentPaymentsAPI.recordPayment(selectedPayment.id, payment);
      showSuccess('Taksit ödemesi başarıyla kaydedildi');
      
      handleClosePaymentDialog();
      loadData();
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  // History functions
  const handleOpenHistoryDialog = async (payment) => {
    try {
      setSelectedPayment(payment);
      const response = await installmentPaymentsAPI.getPaymentHistory(payment.id);
      setPaymentHistory(response.data.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedPayment(null);
    setPaymentHistory([]);
  };

  // Memoized category icon getter
  const getCategoryIcon = useCallback((category) => {
    return categoryIcons[category] || categoryIcons['Diğer'];
  }, []);

  // Error handling functions
  const clearError = useCallback(() => {
    setError(null);
    setCalendarError(null);
    setListError(null);
  }, []);

  const handleDataError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Bir hata oluştu';
    
    if (context.includes('calendar')) {
      setCalendarError(errorMessage);
    } else if (context.includes('list')) {
      setListError(errorMessage);
    } else {
      setError(errorMessage);
    }
    
    showError(`${context}: ${errorMessage}`);
  }, [showError]);

  // Memoized month/year selector handlers
  const handleMonthChange = useCallback((event) => {
    setSelectedMonth(event.target.value);
  }, []);

  const handleYearChange = useCallback((event) => {
    setSelectedYear(event.target.value);
  }, []);

  // Memoized month/year display text
  const currentMonthYearText = useMemo(() => {
    return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  // Legacy function for backward compatibility
  const getCurrentMonthYearText = useCallback(() => {
    return currentMonthYearText;
  }, [currentMonthYearText]);

  // Memoized day click handler
  const handleDayClick = useCallback((dayData) => {
    if (dayData.payments.length > 0) {
      setSelectedDayData(dayData);
      setDayDetailOpen(true);
    }
  }, []);

  // Memoized modal handlers
  const handleCloseDayDetail = useCallback(() => {
    setDayDetailOpen(false);
    setSelectedDayData(null);
  }, []);

  // Touch gesture handlers for month navigation
  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - next month
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    }

    if (isRightSwipe) {
      // Swipe right - previous month
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    }
  }, [touchStart, touchEnd, selectedMonth]);

  // Debounced navigation handlers
  const handlePreviousMonth = useCallback(() => {
    if (isChangingDate) return;
    
    setIsChangingDate(true);
    setTimeout(() => setIsChangingDate(false), 300);
    
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  }, [selectedMonth, isChangingDate]);

  const handleNextMonth = useCallback(() => {
    if (isChangingDate) return;
    
    setIsChangingDate(true);
    setTimeout(() => setIsChangingDate(false), 300);
    
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  }, [selectedMonth, isChangingDate]);

  // Calculate payment status based on dates and completion (with error handling)
  const calculatePaymentStatus = (payment) => {
    try {
      // Validate payment object
      if (!payment) {
        throw new Error('Payment object is null or undefined');
      }

      // If payment is 100% completed
      if (payment.completionPercentage === 100) {
        return {
          status: 'completed',
          label: 'Tamamlandı',
          color: 'success',
          icon: <CheckCircle />,
          priority: 1 // Lowest priority for sorting
        };
      }
      
      // If payment is overdue (trust the API flag if available)
      if (payment.isOverdue) {
        return {
          status: 'overdue',
          label: 'Gecikmiş',
          color: 'error',
          icon: <Warning />,
          priority: 4 // Highest priority for sorting
        };
      }
      
      // Get safe payment date
      const paymentDate = safeCalculateNextPaymentDate(payment);
      if (!paymentDate) {
        // Fallback status if we can't determine the date
        return {
          status: 'unknown',
          label: 'Bilinmiyor',
          color: 'default',
          icon: <CalendarToday />,
          priority: 1
        };
      }

      // Calculate days until payment using safe function
      const today = new Date();
      const daysUntil = safeDateDifference(today, paymentDate);
      
      // If payment is today
      if (daysUntil === 0) {
        return {
          status: 'today',
          label: 'Bugün',
          color: 'warning',
          icon: <Schedule />,
          priority: 3,
          daysUntil: 0
        };
      }
      
      // If payment is overdue (negative days)
      if (daysUntil < 0) {
        return {
          status: 'overdue',
          label: 'Gecikmiş',
          color: 'error',
          icon: <Warning />,
          priority: 4,
          daysUntil
        };
      }
      
      // If payment is due within 7 days
      if (daysUntil > 0 && daysUntil <= 7) {
        return {
          status: 'upcoming',
          label: `${daysUntil} gün kaldı`,
          color: 'warning',
          icon: <Schedule />,
          priority: 3,
          daysUntil
        };
      }
      
      // If payment is due within 30 days
      if (daysUntil > 7 && daysUntil <= 30) {
        return {
          status: 'pending',
          label: `${daysUntil} gün kaldı`,
          color: 'info',
          icon: <CalendarToday />,
          priority: 2,
          daysUntil
        };
      }
      
      // If payment is far in the future
      return {
        status: 'future',
        label: `${daysUntil} gün kaldı`,
        color: 'default',
        icon: <CalendarToday />,
        priority: 1,
        daysUntil
      };
      
    } catch (error) {
      console.error('Error calculating payment status:', error);
      
      // Fallback status
      return {
        status: 'error',
        label: 'Hata',
        color: 'default',
        icon: <Warning />,
        priority: 1
      };
    }
  };

  // Get enhanced payment status (returns the full status object)
  const getPaymentStatusInfo = (payment) => {
    return calculatePaymentStatus(payment);
  };

  // Calculate installment status (legacy function for backward compatibility)
  const calculateInstallmentStatus = (payment) => {
    const statusInfo = calculatePaymentStatus(payment);
    return statusInfo.status;
  };

  // Safe date calculation for next payment date
  const safeCalculateNextPaymentDate = (payment) => {
    try {
      // If nextPaymentDate is already provided by API, use it
      if (payment.nextPaymentDate) {
        const date = new Date(payment.nextPaymentDate);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Fallback: Calculate based on start date and paid installments
      if (payment.startDate && payment.paidInstallments !== undefined) {
        const startDate = new Date(payment.startDate);
        if (isNaN(startDate.getTime())) {
          console.warn(`Invalid start date for payment ${payment.itemName}: ${payment.startDate}`);
          return new Date(); // Fallback to current date
        }

        // Calculate next payment date (assuming monthly payments)
        const nextPaymentDate = new Date(startDate);
        nextPaymentDate.setMonth(startDate.getMonth() + payment.paidInstallments + 1);

        // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
        const targetMonth = (startDate.getMonth() + payment.paidInstallments + 1) % 12;
        const targetYear = startDate.getFullYear() + Math.floor((startDate.getMonth() + payment.paidInstallments + 1) / 12);
        
        // Get the last day of the target month
        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const originalDay = startDate.getDate();
        
        // Adjust day if original day doesn't exist in target month
        const adjustedDay = Math.min(originalDay, lastDayOfTargetMonth);
        
        const adjustedDate = new Date(targetYear, targetMonth, adjustedDay);
        
        // Validate the calculated date
        if (isNaN(adjustedDate.getTime())) {
          console.warn(`Invalid calculated date for payment ${payment.itemName}`);
          return new Date(); // Fallback to current date
        }

        return adjustedDate;
      }

      // Final fallback
      console.warn(`Unable to calculate next payment date for payment ${payment.itemName}`);
      return new Date();
    } catch (error) {
      console.error('Error calculating next payment date:', error);
      return new Date(); // Fallback to current date
    }
  };

  // Safe date difference calculation
  const safeDateDifference = (date1, date2) => {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        return 0;
      }
      
      const diffTime = d2 - d1;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating date difference:', error);
      return 0;
    }
  };

  // Validate and normalize date input
  const validateDate = (dateInput) => {
    try {
      if (!dateInput) return null;
      
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Check if date is within reasonable range (1900-2100)
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        console.warn(`Date out of reasonable range: ${dateInput}`);
        return null;
      }
      
      return date;
    } catch (error) {
      console.error('Error validating date:', error);
      return null;
    }
  };

  // Handle leap year calculations
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  // Get days in month with leap year handling
  const getDaysInMonth = (year, month) => {
    try {
      // Month is 0-indexed (0 = January, 11 = December)
      if (month < 0 || month > 11) {
        throw new Error(`Invalid month: ${month}`);
      }
      
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      
      if (month === 1 && isLeapYear(year)) { // February in leap year
        return 29;
      }
      
      return daysInMonth[month];
    } catch (error) {
      console.error('Error getting days in month:', error);
      return 30; // Safe fallback
    }
  };

  // Generate calendar days for the selected month/year (with error handling)
  const generateCalendarDays = () => {
    try {
      const year = selectedYear;
      const month = selectedMonth;
      
      // Validate input parameters
      if (year < 1900 || year > 2100) {
        throw new Error(`Invalid year: ${year}`);
      }
      if (month < 0 || month > 11) {
        throw new Error(`Invalid month: ${month}`);
      }
      
      // Get first day of month (0 = Sunday, 1 = Monday, etc.)
      const firstDay = new Date(year, month, 1).getDay();
      // Convert to Monday = 0, Sunday = 6
      const firstDayMonday = firstDay === 0 ? 6 : firstDay - 1;
      
      // Get number of days in month using safe function
      const daysInMonth = getDaysInMonth(year, month);
      
      // Get previous month info with safe calculations
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
      
      const days = [];
      
      // Previous month days
      for (let i = firstDayMonday - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const date = new Date(prevYear, prevMonth, dayNum);
        
        // Validate the created date
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date created: ${prevYear}-${prevMonth + 1}-${dayNum}`);
          continue;
        }
        
        days.push({
          date,
          day: dayNum,
          isCurrentMonth: false,
          isToday: false,
          payments: []
        });
      }
      
      // Current month days
      const today = new Date();
      const todayString = today.toDateString();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        
        // Validate the created date
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date created: ${year}-${month + 1}-${day}`);
          continue;
        }
        
        const isToday = date.toDateString() === todayString;
        
        days.push({
          date,
          day,
          isCurrentMonth: true,
          isToday,
          payments: []
        });
      }
      
      // Next month days to fill the grid (42 days total)
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const remainingDays = 42 - days.length;
      
      for (let day = 1; day <= remainingDays && day <= 31; day++) {
        const date = new Date(nextYear, nextMonth, day);
        
        // Validate the created date
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date created: ${nextYear}-${nextMonth + 1}-${day}`);
          break;
        }
        
        days.push({
          date,
          day,
          isCurrentMonth: false,
          isToday: false,
          payments: []
        });
        
        // Safety check to prevent infinite loop
        if (days.length >= 42) break;
      }
      
      // Ensure we have exactly 42 days (6 weeks * 7 days)
      while (days.length < 42) {
        const lastDate = days[days.length - 1].date;
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        
        days.push({
          date: nextDate,
          day: nextDate.getDate(),
          isCurrentMonth: false,
          isToday: false,
          payments: []
        });
      }
      
      return days.slice(0, 42); // Ensure exactly 42 days
      
    } catch (error) {
      console.error('Error generating calendar days:', error);
      
      // Fallback: return a basic 42-day grid for current month
      const fallbackDays = [];
      const today = new Date();
      
      for (let i = 0; i < 42; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), i - 15); // Rough approximation
        fallbackDays.push({
          date,
          day: date.getDate(),
          isCurrentMonth: date.getMonth() === today.getMonth(),
          isToday: date.toDateString() === today.toDateString(),
          payments: []
        });
      }
      
      return fallbackDays;
    }
  };

  // Get payments for a specific date
  const getPaymentsForDate = (targetDate) => {
    return installmentPayments.filter(payment => {
      if (!payment.nextPaymentDate) return false;
      
      const paymentDate = new Date(payment.nextPaymentDate);
      return paymentDate.toDateString() === targetDate.toDateString();
    }).map(payment => ({
      ...payment,
      paymentStatus: calculatePaymentStatus(payment),
      isInSelectedMonth: targetDate.getMonth() === selectedMonth && targetDate.getFullYear() === selectedYear
    }));
  };

  // Memoized filtered payments with error handling
  const filteredPayments = useMemo(() => {
    try {
      setListError(null);
      return installmentPayments.filter(payment => {
        if (!payment.nextPaymentDate) return false;
        
        try {
          const paymentDate = new Date(payment.nextPaymentDate);
          return paymentDate.getMonth() === selectedMonth && paymentDate.getFullYear() === selectedYear;
        } catch (error) {
          console.warn('Error filtering payment by date:', error);
          return false;
        }
      }).map(payment => {
        try {
          const statusInfo = getPaymentStatusInfo(payment);
          return {
            ...payment,
            paymentStatus: statusInfo.status,
            paymentStatusInfo: statusInfo,
            isInSelectedMonth: true
          };
        } catch (error) {
          console.warn('Error processing payment for list:', error);
          return {
            ...payment,
            paymentStatus: 'error',
            paymentStatusInfo: {
              status: 'error',
              label: 'Hata',
              color: 'default',
              icon: <Warning />,
              priority: 1
            },
            isInSelectedMonth: true
          };
        }
      }).sort((a, b) => {
        try {
          // Sort by priority first (overdue first, then by urgency)
          if (a.paymentStatusInfo.priority !== b.paymentStatusInfo.priority) {
            return b.paymentStatusInfo.priority - a.paymentStatusInfo.priority;
          }
          // Then sort by date
          return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
        } catch (error) {
          console.warn('Error sorting payments:', error);
          return 0;
        }
      });
    } catch (error) {
      console.error('Error filtering payments:', error);
      setListError('Liste verileri yüklenirken hata oluştu');
      return [];
    }
  }, [installmentPayments, selectedMonth, selectedYear]);

  // Legacy function for backward compatibility
  const getFilteredPayments = useCallback(() => {
    return filteredPayments;
  }, [filteredPayments]);

  // Get payments with enhanced status for calendar
  const getPaymentsForDateEnhanced = (targetDate) => {
    return installmentPayments.filter(payment => {
      if (!payment.nextPaymentDate) return false;
      
      const paymentDate = new Date(payment.nextPaymentDate);
      return paymentDate.toDateString() === targetDate.toDateString();
    }).map(payment => {
      const statusInfo = getPaymentStatusInfo(payment);
      return {
        ...payment,
        paymentStatus: statusInfo.status,
        paymentStatusInfo: statusInfo,
        isInSelectedMonth: targetDate.getMonth() === selectedMonth && targetDate.getFullYear() === selectedYear
      };
    });
  };

  // Memoized calendar data generation with error handling
  const calendarData = useMemo(() => {
    try {
      setCalendarError(null);
      const calendarDays = generateCalendarDays();
      
      // Add payments to each day
      return calendarDays.map(day => {
        try {
          const dayPayments = installmentPayments.filter(payment => {
            if (!payment.nextPaymentDate) return false;
            
            const paymentDate = new Date(payment.nextPaymentDate);
            return paymentDate.toDateString() === day.date.toDateString();
          }).map(payment => {
            try {
              const statusInfo = getPaymentStatusInfo(payment);
              return {
                ...payment,
                paymentStatus: statusInfo.status,
                paymentStatusInfo: statusInfo,
                isInSelectedMonth: day.date.getMonth() === selectedMonth && day.date.getFullYear() === selectedYear
              };
            } catch (error) {
              console.warn('Error processing payment status:', error);
              return {
                ...payment,
                paymentStatus: 'error',
                paymentStatusInfo: {
                  status: 'error',
                  label: 'Hata',
                  color: 'default',
                  icon: <Warning />,
                  priority: 1
                },
                isInSelectedMonth: day.date.getMonth() === selectedMonth && day.date.getFullYear() === selectedYear
              };
            }
          });

          return {
            ...day,
            payments: dayPayments,
            totalAmount: dayPayments.reduce((sum, payment) => sum + (payment.installmentAmount || 0), 0),
            hasOverduePayments: dayPayments.some(payment => payment.paymentStatus === 'overdue'),
            hasTodayPayments: dayPayments.some(payment => payment.paymentStatus === 'today'),
            hasUpcomingPayments: dayPayments.some(payment => payment.paymentStatus === 'upcoming'),
            urgencyLevel: Math.max(...dayPayments.map(p => p.paymentStatusInfo?.priority || 1), 0)
          };
        } catch (error) {
          console.warn('Error processing calendar day:', error);
          return {
            ...day,
            payments: [],
            totalAmount: 0,
            hasOverduePayments: false,
            hasTodayPayments: false,
            hasUpcomingPayments: false,
            urgencyLevel: 0
          };
        }
      });
    } catch (error) {
      console.error('Error generating calendar data:', error);
      setCalendarError('Takvim verileri yüklenirken hata oluştu');
      return [];
    }
  }, [selectedYear, selectedMonth, installmentPayments]);

  // Legacy function for backward compatibility
  const getCalendarData = useCallback(() => {
    return calendarData;
  }, [calendarData]);

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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
              Taksitli Ödemelerim
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isMobile ? "Taksitli alışverişlerinizi yönetin" : "Telefon, araba, eğitim ve diğer taksitli alışverişlerinizi yönetin"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
          >
            {isMobile ? "Ekle" : "Taksitli Ödeme Ekle"}
          </Button>
        </Box>

        {/* General Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {error}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={clearError}>
                  Kapat
                </Button>
                <Button size="small" onClick={() => {
                  clearError();
                  loadData();
                }}>
                  Tekrar Dene
                </Button>
              </Box>
            </Box>
          </Alert>
        )}

        {/* View Mode Toggle and Month/Year Selector */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          gap: 2, 
          alignItems: isMobile ? 'stretch' : 'center', 
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size={isMobile ? "medium" : "small"}
            fullWidth={isMobile}
          >
            <ToggleButton value="cards">
              <ViewModule sx={{ mr: isMobile ? 0.5 : 1 }} />
              {isMobile ? "Kart" : "Kartlar"}
            </ToggleButton>
            <ToggleButton value="calendar">
              <CalendarMonth sx={{ mr: isMobile ? 0.5 : 1 }} />
              Takvim
            </ToggleButton>
            <ToggleButton value="list">
              <ViewList sx={{ mr: isMobile ? 0.5 : 1 }} />
              Liste
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Month/Year Selector - Only visible for calendar and list views */}
          {(viewMode === 'calendar' || viewMode === 'list') && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              {!isMobile && (
                <Typography variant="body2" color="textSecondary" sx={{ minWidth: 'fit-content' }}>
                  Görüntülenen Dönem:
                </Typography>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                width: isMobile ? '100%' : 'auto'
              }}>
                {/* Mobile: Previous Month Button */}
                {isMobile && (
                  <IconButton 
                    size="small" 
                    onClick={handlePreviousMonth}
                    sx={{ minWidth: 40 }}
                  >
                    <ChevronLeft />
                  </IconButton>
                )}
                
                <FormControl size="small" sx={{ minWidth: isMobile ? 'auto' : 120, flex: isMobile ? 1 : 'none' }}>
                  <InputLabel id="month-select-label">Ay</InputLabel>
                  <Select
                    labelId="month-select-label"
                    value={selectedMonth}
                    label="Ay"
                    onChange={handleMonthChange}
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <MenuItem key={index} value={index}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: isMobile ? 80 : 100 }}>
                  <InputLabel id="year-select-label">Yıl</InputLabel>
                  <Select
                    labelId="year-select-label"
                    value={selectedYear}
                    label="Yıl"
                    onChange={handleYearChange}
                  >
                    {YEAR_RANGE.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Mobile: Next Month Button */}
                {isMobile && (
                  <IconButton 
                    size="small" 
                    onClick={handleNextMonth}
                    sx={{ minWidth: 40 }}
                  >
                    <ChevronRight />
                  </IconButton>
                )}
              </Box>

              {/* Current selection indicator - only on desktop */}
              {!isMobile && (
                <Chip 
                  label={getCurrentMonthYearText()}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <ShoppingCart />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Toplam Borç
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(summary.totalDebt)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {summary.activeInstallments} aktif taksit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <CheckCircle />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Ödenen Tutar
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="success.main">
                    {formatCurrency(summary.totalPaid)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    %{summary.completionPercentage} tamamlandı
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Kalan Borç
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="warning.main">
                    {formatCurrency(summary.totalRemaining)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Ödenmesi gereken
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <CalendarToday />
                    </Avatar>
                    <Typography variant="h6" color="textSecondary">
                      Aylık Toplam
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="info.main">
                    {formatCurrency(summary.monthlyTotal)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Aylık taksit toplamı
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* View Content */}
        {viewMode === 'cards' && (
          /* Installment Payments Grid */
          installmentPayments.length > 0 ? (
            <Grid container spacing={3}>
              {installmentPayments.map((payment) => (
              <Grid item xs={12} md={6} lg={4} key={payment.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {getCategoryIcon(payment.category)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {payment.itemName}
                        </Typography>
                        {payment.vendor && (
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {payment.vendor}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
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

                    {/* Category */}
                    {payment.category && (
                      <Chip 
                        label={payment.category} 
                        size="small" 
                        sx={{ mb: 2 }}
                        icon={getCategoryIcon(payment.category)}
                      />
                    )}

                    {/* Total Amount */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Toplam Tutar
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ mb: 2 }}
                    >
                      {formatCurrency(payment.totalAmount)}
                    </Typography>

                    {/* Progress */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          İlerleme
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          %{payment.completionPercentage}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={payment.completionPercentage}
                        color={payment.completionPercentage > 80 ? 'success' : payment.completionPercentage > 50 ? 'primary' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Payment Info */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Ödenen
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(payment.paidAmount)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Kalan
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {formatCurrency(payment.remainingAmount)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Taksit ({payment.paidInstallments}/{payment.totalInstallments})
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payment.installmentAmount)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Next Payment */}
                    {payment.nextPaymentDate && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Sonraki Taksit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday fontSize="small" />
                          <Typography variant="body2">
                            {formatDate(payment.nextPaymentDate)}
                          </Typography>
                          {payment.daysUntilPayment !== null && (
                            <Chip
                              label={payment.isOverdue ? 'Gecikmiş' : `${payment.daysUntilPayment} gün`}
                              size="small"
                              color={payment.isOverdue ? 'error' : payment.daysUntilPayment <= 7 ? 'warning' : 'primary'}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Status Chips */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {payment.isOverdue && (
                        <Chip label="Taksit Gecikmiş" color="error" size="small" icon={<Warning />} />
                      )}
                      {payment.completionPercentage === 100 && (
                        <Chip label="Tamamlandı" color="success" size="small" icon={<CheckCircle />} />
                      )}
                      {payment.interestRate > 0 && (
                        <Chip label={`%${payment.interestRate} Faiz`} size="small" />
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Payment />}
                        onClick={() => handleOpenPaymentDialog(payment)}
                        disabled={payment.completionPercentage === 100}
                        fullWidth
                      >
                        Taksit Öde
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<History />}
                        onClick={() => handleOpenHistoryDialog(payment)}
                        fullWidth
                      >
                        Geçmiş
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
                <Payment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Henüz taksitli ödeme eklenmemiş
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  İlk taksitli ödemenizi ekleyerek başlayın
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  İlk Taksitli Ödemeyi Ekle
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card>
            <CardContent
              onTouchStart={isMobile ? handleTouchStart : undefined}
              onTouchMove={isMobile ? handleTouchMove : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
              sx={{ 
                touchAction: isMobile ? 'pan-y' : 'auto',
                userSelect: 'none'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant={isMobile ? "subtitle1" : "h6"}>
                    {getCurrentMonthYearText()} - Taksit Takvimi
                  </Typography>
                  {isChangingDate && (
                    <CircularProgress size={16} />
                  )}
                </Box>
                {isMobile && (
                  <Typography variant="caption" color="textSecondary">
                    Kaydırarak ay değiştirin
                  </Typography>
                )}
              </Box>
              
              {/* Calendar Header - Days of Week */}
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

              {/* Calendar Error Display */}
              {calendarError && (
                <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {calendarError}
                    </Typography>
                    <Button size="small" onClick={() => {
                      setCalendarError(null);
                      loadData();
                    }}>
                      Tekrar Dene
                    </Button>
                  </Box>
                </Alert>
              )}

              {/* Calendar Grid */}
              <Grid container>
                {getCalendarData().map((dayInfo, index) => {
                  const isToday = dayInfo.isToday;
                  
                  return (
                    <Grid item xs key={index}>
                      <Paper
                        sx={{
                          minHeight: isMobile ? 80 : 120,
                          p: isMobile ? 0.5 : 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                          bgcolor: dayInfo.isCurrentMonth ? 'background.paper' : 'grey.50',
                          position: 'relative',
                          cursor: dayInfo.payments.length > 0 ? 'pointer' : 'default',
                          '&:hover': {
                            bgcolor: dayInfo.isCurrentMonth ? 'grey.50' : 'grey.100'
                          },
                          '&:active': isMobile ? {
                            bgcolor: 'primary.light',
                            transform: 'scale(0.98)'
                          } : {}
                        }}
                        onClick={() => handleDayClick(dayInfo)}
                      >
                        {/* Day Number */}
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

                        {/* Payments */}
                        <Box sx={{ maxHeight: isMobile ? 60 : 90, overflow: 'hidden' }}>
                          {dayInfo.payments.slice(0, isMobile ? 1 : 2).map((payment, idx) => (
                            <Chip
                              key={idx}
                              label={isMobile ? 
                                payment.itemName : 
                                `${payment.itemName} - ${formatCurrency(payment.installmentAmount)}`
                              }
                              size="small"
                              color={payment.paymentStatusInfo.color}
                              icon={isMobile ? undefined : getCategoryIcon(payment.category)}
                              sx={{
                                fontSize: isMobile ? '0.5rem' : '0.55rem',
                                height: isMobile ? 16 : 18,
                                mb: 0.5,
                                display: 'block',
                                '& .MuiChip-label': {
                                  px: isMobile ? 0.3 : 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '100%'
                                },
                                '& .MuiChip-icon': {
                                  fontSize: '0.7rem',
                                  ml: 0.5,
                                  mr: -0.5
                                }
                              }}
                            />
                          ))}
                          {dayInfo.payments.length > 2 && (
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem' }}>
                              +{dayInfo.payments.length - 2} ödeme daha
                            </Typography>
                          )}
                          
                          {/* Total amount for the day */}
                          {dayInfo.totalAmount > 0 && dayInfo.payments.length > 1 && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 'bold',
                                color: dayInfo.hasOverduePayments ? 'error.main' : 'primary.main',
                                display: 'block',
                                mt: 0.5
                              }}
                            >
                              Toplam: {formatCurrency(dayInfo.totalAmount)}
                            </Typography>
                          )}
                        </Box>

                        {/* Total Amount Indicator */}
                        {dayInfo.totalAmount > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              right: 4,
                              bgcolor: dayInfo.hasOverduePayments ? 'error.main' : 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem'
                            }}
                          >
                            {dayInfo.payments.length}
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Calendar Summary */}
              {getFilteredPayments().length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    {getCurrentMonthYearText()} Özeti:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Typography variant="body2">
                      Toplam Ödeme: {getFilteredPayments().length}
                    </Typography>
                    <Typography variant="body2">
                      Toplam Tutar: {formatCurrency(getFilteredPayments().reduce((sum, p) => sum + p.installmentAmount, 0))}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Gecikmiş: {getFilteredPayments().filter(p => p.paymentStatus === 'overdue').length}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Tamamlanan: {getFilteredPayments().filter(p => p.paymentStatus === 'completed').length}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {getCurrentMonthYearText()} - Taksit Ödemeleri Listesi
              </Typography>
              
              {/* List Error Display */}
              {listError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {listError}
                    </Typography>
                    <Button size="small" onClick={() => {
                      setListError(null);
                      loadData();
                    }}>
                      Tekrar Dene
                    </Button>
                  </Box>
                </Alert>
              )}

              {getFilteredPayments().length > 0 ? (
                <>
                  {/* List Summary */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          Toplam Ödeme
                        </Typography>
                        <Typography variant="h6">
                          {getFilteredPayments().length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          Toplam Tutar
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {formatCurrency(getFilteredPayments().reduce((sum, p) => sum + p.installmentAmount, 0))}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          Gecikmiş
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {getFilteredPayments().filter(p => p.paymentStatus === 'overdue').length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          Tamamlanan
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {getFilteredPayments().filter(p => p.paymentStatus === 'completed').length}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Payments Table */}
                  <TableContainer>
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tarih</TableCell>
                          <TableCell>Ürün/Hizmet</TableCell>
                          {!isMobile && <TableCell>Kategori</TableCell>}
                          <TableCell align="right">Tutar</TableCell>
                          <TableCell align="center">Durum</TableCell>
                          {!isMobile && <TableCell align="center">Taksit</TableCell>}
                          {!isMobile && <TableCell align="right">Kalan Borç</TableCell>}
                          <TableCell align="center">İşlem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getFilteredPayments().map((payment) => (
                          <TableRow 
                            key={payment.id}
                            sx={{ 
                              '&:hover': { bgcolor: 'grey.50' },
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // Show payment details or navigate to payment
                              console.log('Clicked payment:', payment);
                            }}
                          >
                            {/* Date */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                                {!isMobile && <CalendarToday fontSize="small" color="action" />}
                                <Typography variant={isMobile ? "caption" : "body2"}>
                                  {isMobile ? 
                                    formatDate(payment.nextPaymentDate).split(' ')[0] : // Only date part
                                    formatDate(payment.nextPaymentDate)
                                  }
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Item Name */}
                            <TableCell>
                              <Box>
                                <Typography variant={isMobile ? "caption" : "body2"} fontWeight="medium">
                                  {isMobile ? 
                                    payment.itemName.length > 15 ? 
                                      payment.itemName.substring(0, 15) + '...' : 
                                      payment.itemName :
                                    payment.itemName
                                  }
                                </Typography>
                                {payment.vendor && !isMobile && (
                                  <Typography variant="caption" color="textSecondary">
                                    {payment.vendor}
                                  </Typography>
                                )}
                                {/* Mobile: Show category here */}
                                {isMobile && payment.category && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    {getCategoryIcon(payment.category)}
                                    <Typography variant="caption" color="textSecondary">
                                      {payment.category}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>

                            {/* Category - Desktop only */}
                            {!isMobile && (
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getCategoryIcon(payment.category)}
                                  <Typography variant="body2">
                                    {payment.category || 'Diğer'}
                                  </Typography>
                                </Box>
                              </TableCell>
                            )}

                            {/* Installment Amount */}
                            <TableCell align="right">
                              <Typography variant={isMobile ? "caption" : "body2"} fontWeight="medium">
                                {formatCurrency(payment.installmentAmount)}
                              </Typography>
                              {/* Mobile: Show remaining amount here */}
                              {isMobile && (
                                <Typography 
                                  variant="caption" 
                                  color={payment.remainingAmount > 0 ? 'warning.main' : 'success.main'}
                                  display="block"
                                >
                                  Kalan: {formatCurrency(payment.remainingAmount)}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={isMobile ? 
                                  payment.paymentStatusInfo.status === 'overdue' ? 'Geç' :
                                  payment.paymentStatusInfo.status === 'completed' ? 'OK' :
                                  payment.paymentStatusInfo.status === 'today' ? 'Bugün' : 'Bekl'
                                  : payment.paymentStatusInfo.label
                                }
                                color={payment.paymentStatusInfo.color}
                                icon={isMobile ? undefined : payment.paymentStatusInfo.icon}
                              />
                              {/* Mobile: Show installment progress here */}
                              {isMobile && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    {payment.paidInstallments + 1}/{payment.totalInstallments}
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={payment.completionPercentage}
                                    color={
                                      payment.completionPercentage > 80 ? 'success' :
                                      payment.completionPercentage > 50 ? 'primary' : 'warning'
                                    }
                                    sx={{ height: 2, borderRadius: 1 }}
                                  />
                                </Box>
                              )}
                            </TableCell>

                            {/* Installment Progress - Desktop only */}
                            {!isMobile && (
                              <TableCell align="center">
                                <Box>
                                  <Typography variant="body2">
                                    {payment.paidInstallments + 1} / {payment.totalInstallments}
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={payment.completionPercentage}
                                    color={
                                      payment.completionPercentage > 80 ? 'success' :
                                      payment.completionPercentage > 50 ? 'primary' : 'warning'
                                    }
                                    sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                                  />
                                </Box>
                              </TableCell>
                            )}

                            {/* Remaining Amount - Desktop only */}
                            {!isMobile && (
                              <TableCell align="right">
                                <Typography 
                                  variant="body2" 
                                  color={payment.remainingAmount > 0 ? 'warning.main' : 'success.main'}
                                  fontWeight="medium"
                                >
                                  {formatCurrency(payment.remainingAmount)}
                                </Typography>
                              </TableCell>
                            )}

                            {/* Actions */}
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: isMobile ? 0.2 : 0.5, flexDirection: isMobile ? 'column' : 'row' }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPaymentDialog(payment);
                                  }}
                                  disabled={payment.completionPercentage === 100}
                                  title="Taksit Öde"
                                >
                                  <Payment fontSize="small" />
                                </IconButton>
                                {!isMobile && (
                                  <>
                                    <IconButton
                                      size="small"
                                      color="info"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenHistoryDialog(payment);
                                      }}
                                      title="Ödeme Geçmişi"
                                    >
                                      <History fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="default"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDialog(payment);
                                      }}
                                      title="Düzenle"
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                /* Empty State */
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ViewList sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {getCurrentMonthYearText()} ayında taksit ödemesi yok
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    {installmentPayments.length === 0 ? 
                      'Henüz hiç taksitli ödeme eklenmemiş.' :
                      'Bu ay için herhangi bir taksit ödemesi bulunmuyor.'
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {installmentPayments.length === 0 ? (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                      >
                        İlk Taksitli Ödemeyi Ekle
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={() => setViewMode('cards')}
                        >
                          Tüm Taksitleri Görüntüle
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleOpenDialog()}
                        >
                          Yeni Taksit Ekle
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Installment Payment Form Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingPayment ? 'Taksitli Ödeme Düzenle' : 'Yeni Taksitli Ödeme Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Ürün/Hizmet Adı"
                    value={formData.itemName}
                    onChange={(e) => handleFormChange('itemName', e.target.value)}
                    error={!!formErrors.itemName}
                    helperText={formErrors.itemName}
                    placeholder="iPhone 15 Pro, Honda Civic, Üniversite Eğitimi..."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={formData.category}
                      label="Kategori"
                      onChange={(e) => handleFormChange('category', e.target.value)}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(category)}
                            {category}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Toplam Tutar"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleFormChange('totalAmount', e.target.value)}
                    error={!!formErrors.totalAmount}
                    helperText={formErrors.totalAmount}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Satıcı/Mağaza"
                    value={formData.vendor}
                    onChange={(e) => handleFormChange('vendor', e.target.value)}
                    placeholder="Apple Store, Honda Bayii, Üniversite..."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Aylık Taksit"
                    type="number"
                    value={formData.installmentAmount}
                    onChange={(e) => handleFormChange('installmentAmount', e.target.value)}
                    error={!!formErrors.installmentAmount}
                    helperText={formErrors.installmentAmount}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Taksit Sayısı"
                    type="number"
                    value={formData.totalInstallments}
                    onChange={(e) => handleFormChange('totalInstallments', e.target.value)}
                    error={!!formErrors.totalInstallments}
                    helperText={formErrors.totalInstallments}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Faiz Oranı (%)"
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => handleFormChange('interestRate', e.target.value)}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>%</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Başlangıç Tarihi"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    error={!!formErrors.startDate}
                    helperText={formErrors.startDate}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notlar"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Ürün özellikleri, garanti bilgileri vb..."
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
              {submitting ? 'Kaydediliyor...' : (editingPayment ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            Taksit Ödemesi - {selectedPayment?.itemName}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {selectedPayment && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(selectedPayment.remainingAmount)}
                    <br />
                    <strong>Aylık Taksit:</strong> {formatCurrency(selectedPayment.installmentAmount)}
                    <br />
                    <strong>Taksit:</strong> {selectedPayment.paidInstallments + 1} / {selectedPayment.totalInstallments}
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
                  onClick={() => handlePaymentChange('amount', selectedPayment?.installmentAmount?.toString() || '')}
                >
                  Normal Taksit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', (selectedPayment?.installmentAmount * 2)?.toString() || '')}
                >
                  2 Taksit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handlePaymentChange('amount', selectedPayment?.remainingAmount?.toString() || '')}
                >
                  Kalan Tümü
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
                label="Makbuz No"
                value={paymentData.receiptNumber}
                onChange={(e) => handlePaymentChange('receiptNumber', e.target.value)}
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

              {selectedPayment && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Ödeme Sonrası Tahmini Durum:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kalan Borç:</strong> {formatCurrency(Math.max(0, selectedPayment.remainingAmount - (parseFloat(paymentData.amount) || 0)))}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tamamlanma:</strong> %{Math.min(100, ((selectedPayment.paidAmount + (parseFloat(paymentData.amount) || 0)) / selectedPayment.totalAmount * 100).toFixed(1))}
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
              {submitting ? 'Kaydediliyor...' : 'Taksiti Öde'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={historyDialogOpen} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Taksit Geçmişi - {selectedPayment?.itemName}
          </DialogTitle>
          <DialogContent>
            {paymentHistory.length > 0 ? (
              <List>
                {paymentHistory.map((payment) => (
                  <ListItem key={payment.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                        <Payment fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${payment.installment_number}. Taksit - ${formatCurrency(payment.amount)}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(payment.payment_date)}
                          </Typography>
                          {payment.description && (
                            <Typography variant="body2" color="textSecondary">
                              {payment.description}
                            </Typography>
                          )}
                          {payment.receipt_number && (
                            <Typography variant="body2" color="textSecondary">
                              Makbuz: {payment.receipt_number}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Payment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                  Henüz taksit ödemesi yapılmamış
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseHistoryDialog}>Kapat</Button>
          </DialogActions>
        </Dialog>

        {/* Day Detail Modal */}
        <Dialog open={dayDetailOpen} onClose={handleCloseDayDetail} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarToday />
              {selectedDayData && (
                <Typography variant="h6">
                  {formatDate(selectedDayData.date)} - Taksit Ödemeleri
                </Typography>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedDayData && (
              <Box>
                {/* Day Summary */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Toplam Ödeme
                      </Typography>
                      <Typography variant="h6">
                        {selectedDayData.payments.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Toplam Tutar
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(selectedDayData.totalAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Gecikmiş
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {selectedDayData.payments.filter(p => p.paymentStatus === 'overdue').length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Tamamlanan
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {selectedDayData.payments.filter(p => p.paymentStatus === 'completed').length}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Payment List */}
                <List>
                  {selectedDayData.payments.map((payment) => (
                    <ListItem key={payment.id} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          {getCategoryIcon(payment.category)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {payment.itemName}
                            </Typography>
                            <Chip
                              size="small"
                              label={payment.paymentStatusInfo.label}
                              color={payment.paymentStatusInfo.color}
                              icon={payment.paymentStatusInfo.icon}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Kategori:</strong> {payment.category || 'Diğer'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Taksit Tutarı:</strong> {formatCurrency(payment.installmentAmount)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Taksit:</strong> {payment.paidInstallments + 1} / {payment.totalInstallments}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Kalan Borç:</strong> {formatCurrency(payment.remainingAmount)}
                            </Typography>
                            {payment.vendor && (
                              <Typography variant="body2" color="textSecondary">
                                <strong>Satıcı:</strong> {payment.vendor}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Payment />}
                          onClick={() => {
                            handleCloseDayDetail();
                            handleOpenPaymentDialog(payment);
                          }}
                          disabled={payment.completionPercentage === 100}
                        >
                          Taksit Öde
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<History />}
                          onClick={() => {
                            handleCloseDayDetail();
                            handleOpenHistoryDialog(payment);
                          }}
                        >
                          Geçmiş
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDayDetail}>Kapat</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default InstallmentPaymentsPage;