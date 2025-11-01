import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Assessment,
  Refresh,
  History,
  Bookmark,
  TrendingUp,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { reportsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import DateRangePicker from '../../components/reports/DateRangePicker';
import CategorySelector from '../../components/reports/CategorySelector';
import ReportTypeSelector from '../../components/reports/ReportTypeSelector';
import PDFExportButton from '../../components/reports/PDFExportButton';
import ExcelExportButton from '../../components/reports/ExcelExportButton';
import ReportContentDisplay from '../../components/reports/ReportContentDisplay';
import MobileExportButton from '../../components/reports/MobileExportButton';
import useTouchGestures from '../../hooks/useTouchGestures';
import useMobileOptimization from '../../hooks/useMobileOptimization';
import { TouchButton, TouchFab } from '../../components/common/TouchFriendlyControls';

const ReportsPage = () => {
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mobile optimization
  const { 
    touchSupport, 
    getMobileConfig, 
    createTouchHandlers,
    isSmallScreen 
  } = useMobileOptimization();
  
  const mobileConfig = getMobileConfig();

  // Touch gestures for mobile navigation
  const touchGestures = useTouchGestures({
    onSwipeLeft: () => {
      if (isMobile && reportType === 'summary') {
        setReportType('detailed');
      } else if (isMobile && reportType === 'detailed') {
        setReportType('comparison');
      }
    },
    onSwipeRight: () => {
      if (isMobile && reportType === 'comparison') {
        setReportType('detailed');
      } else if (isMobile && reportType === 'detailed') {
        setReportType('summary');
      }
    },
    enableSwipe: isMobile,
    swipeThreshold: 50
  });

  // URL state management
  const getInitialFiltersFromURL = useCallback(() => {
    const reportType = searchParams.get('reportType') || 'summary';
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const categories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
    
    return {
      reportType,
      dateRange: { start: startDate, end: endDate },
      selectedCategories: categories
    };
  }, [searchParams]);

  const updateURLFromFilters = useCallback((filters) => {
    const newParams = new URLSearchParams();
    
    if (filters.reportType && filters.reportType !== 'summary') {
      newParams.set('reportType', filters.reportType);
    }
    
    const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (filters.dateRange.start !== defaultStart) {
      newParams.set('startDate', filters.dateRange.start);
    }
    if (filters.dateRange.end !== defaultEnd) {
      newParams.set('endDate', filters.dateRange.end);
    }
    
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      newParams.set('categories', filters.selectedCategories.join(','));
    }
    
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams]);

  // State management
  const [reportState, setReportState] = useState({
    filters: getInitialFiltersFromURL(),
    data: { current: null, previous: null },
    loading: { initial: true, refresh: false, export: { pdf: false, excel: false } },
    errors: { current: null },
    ui: { 
      shareDialogOpen: false, 
      bookmarkDialogOpen: false,
      recentReportsOpen: false,
      templatesOpen: false,
      filtersExpanded: !isMobile
    }
  });

  const { filters: { reportType, dateRange, selectedCategories }, data: { current: reportData }, loading, errors: { current: error }, ui } = reportState;

  const isLoading = loading.initial || loading.refresh;
  const hasError = !!error;
  const hasData = !!reportData;
  const canExport = hasData && !isLoading && !hasError;

  // State update helpers
  const updateReportState = useCallback((updates) => {
    setReportState(prev => {
      const newState = { ...prev };
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
          newState[key] = { ...prev[key], ...updates[key] };
        } else {
          newState[key] = updates[key];
        }
      });
      return newState;
    });
  }, []);

  const updateFilters = useCallback((filterUpdates) => {
    const newFilters = { ...reportState.filters, ...filterUpdates };
    updateReportState({ filters: newFilters });
    updateURLFromFilters(newFilters);
  }, [reportState.filters, updateReportState, updateURLFromFilters]);

  const setReportType = useCallback((type) => {
    updateFilters({ reportType: type });
  }, [updateFilters]);

  const setDateRange = useCallback((range) => {
    updateFilters({ dateRange: range });
  }, [updateFilters]);

  const setSelectedCategories = useCallback((categories) => {
    updateFilters({ selectedCategories: categories });
  }, [updateFilters]);

  const updateUIState = useCallback((uiUpdates) => {
    updateReportState({ ui: uiUpdates });
  }, [updateReportState]);

  // Data loading
  const loadReportData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        updateReportState({ loading: { initial: true } });
      } else {
        updateReportState({ loading: { refresh: true } });
      }

      const response = await reportsAPI.generateReport({
        reportType,
        dateRange,
        categories: selectedCategories
      });

      updateReportState({
        data: { current: response.data },
        loading: { initial: false, refresh: false },
        errors: { current: null }
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      updateReportState({
        errors: { current: errorMessage },
        loading: { initial: false, refresh: false }
      });
      showError('Rapor verileri yüklenirken hata oluştu');
    }
  }, [dateRange, selectedCategories, reportType, reportData, showError, updateReportState]);

  // Export handlers
  const handleExportPDF = async () => {
    try {
      updateReportState({ loading: { export: { ...loading.export, pdf: true } } });
      await reportsAPI.exportToPDF(reportData, 'standard');
      showSuccess('PDF raporu başarıyla oluşturuldu');
    } catch (error) {
      showError('PDF oluşturulurken hata oluştu');
    } finally {
      updateReportState({ loading: { export: { ...loading.export, pdf: false } } });
    }
  };

  const handleExportExcel = async () => {
    try {
      updateReportState({ loading: { export: { ...loading.export, excel: true } } });
      await reportsAPI.exportToExcel(reportData);
      showSuccess('Excel raporu başarıyla oluşturuldu');
    } catch (error) {
      showError('Excel oluşturulurken hata oluştu');
    } finally {
      updateReportState({ loading: { export: { ...loading.export, excel: false } } });
    }
  };

  const handleRefresh = useCallback(() => {
    loadReportData(false);
  }, [loadReportData]);

  // Effects
  useEffect(() => {
    loadReportData();
  }, []);

  useEffect(() => {
    if (reportData) {
      const timeoutId = setTimeout(() => {
        loadReportData(false);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [reportType, dateRange, selectedCategories]);

  // Memoized calculations
  const summaryMetrics = useMemo(() => {
    if (!reportData?.summary) return null;
    
    const { totalIncome, totalExpense, netIncome } = reportData.summary;
    const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0;
    
    return {
      totalIncome,
      totalExpense,
      netIncome,
      savingsRate: parseFloat(savingsRate)
    };
  }, [reportData?.summary]);

  if (loading.initial && !hasData) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="textSecondary">
            Rapor verileri yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box 
        ref={touchGestures.elementRef}
        sx={{ py: 3 }}
      >
        {/* Professional Header */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom sx={{ mb: 0.5 }}>
                    Finansal Raporlar
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {isMobile ? 'Finansal analiz ve raporlar' : 'Detaylı finansal analizler ve profesyonel raporlar oluşturun'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: isMobile ? 'center' : 'flex-end', flexWrap: 'wrap' }}>
                <TouchButton
                  variant="outlined"
                  startIcon={<History />}
                  onClick={() => updateUIState({ recentReportsOpen: true })}
                  size={isMobile ? 'small' : 'medium'}
                  minTouchTarget={mobileConfig.minTouchTarget}
                  hapticFeedback={touchSupport}
                >
                  {isMobile ? 'Geçmiş' : 'Son Raporlar'}
                </TouchButton>
                <TouchButton
                  variant="outlined"
                  startIcon={<Bookmark />}
                  onClick={() => updateUIState({ templatesOpen: true })}
                  size={isMobile ? 'small' : 'medium'}
                  minTouchTarget={mobileConfig.minTouchTarget}
                  hapticFeedback={touchSupport}
                >
                  {isMobile ? 'Şablon' : 'Şablonlar'}
                </TouchButton>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Quick Stats Summary */}
        {summaryMetrics && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Özet İstatistikler
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                  <Typography variant={isMobile ? "body1" : "h6"} color="success.contrastText" fontWeight="bold">
                    {formatCurrency(summaryMetrics.totalIncome)}
                  </Typography>
                  <Typography variant="caption" color="success.contrastText">
                    Toplam Gelir
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                  <Typography variant={isMobile ? "body1" : "h6"} color="error.contrastText" fontWeight="bold">
                    {formatCurrency(summaryMetrics.totalExpense)}
                  </Typography>
                  <Typography variant="caption" color="error.contrastText">
                    Toplam Gider
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: summaryMetrics.netIncome >= 0 ? 'primary.light' : 'warning.light',
                  borderRadius: 2
                }}>
                  <Typography variant={isMobile ? "body1" : "h6"} color="primary.contrastText" fontWeight="bold">
                    {formatCurrency(summaryMetrics.netIncome)}
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText">
                    Net Gelir
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                  <Typography variant={isMobile ? "body1" : "h6"} color="info.contrastText" fontWeight="bold">
                    %{summaryMetrics.savingsRate}
                  </Typography>
                  <Typography variant="caption" color="info.contrastText">
                    Tasarruf Oranı
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Filters Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <CategorySelector
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <ReportTypeSelector
                  value={reportType}
                  onChange={setReportType}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>

            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 2, 
              flexWrap: 'wrap', 
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <TouchButton
                variant="contained"
                onClick={() => loadReportData(false)}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} /> : <Assessment />}
                fullWidth={isMobile}
                minTouchTarget={mobileConfig.minTouchTarget}
                hapticFeedback={touchSupport}
              >
                {isMobile ? 'Oluştur' : 'Raporu Oluştur'}
              </TouchButton>
              
              <TouchButton
                variant="outlined"
                onClick={handleRefresh}
                disabled={isLoading}
                fullWidth={isMobile}
                minTouchTarget={mobileConfig.minTouchTarget}
                hapticFeedback={touchSupport}
              >
                {isMobile ? 'Yenile' : 'Zorla Yenile'}
              </TouchButton>
            </Box>
          </CardContent>
        </Card>

        {/* Export Actions */}
        {!isMobile && canExport && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <PDFExportButton
              reportData={reportData}
              disabled={!canExport || loading.export.pdf}
              variant="outlined"
              loading={loading.export.pdf}
            />
            
            <ExcelExportButton
              reportData={reportData}
              disabled={!canExport || loading.export.excel}
              variant="contained"
              loading={loading.export.excel}
            />
          </Box>
        )}

        {/* Dynamic Report Content */}
        <ReportContentDisplay
          reportData={reportData}
          reportType={reportType}
          loading={isLoading}
          error={error}
          compactView={isMobile}
          showAdvancedMetrics={!isMobile}
          enableVirtualization={true}
          enablePagination={true}
          maxRowsBeforeVirtualization={100}
          mobileOptimized={isMobile}
          touchSupport={touchSupport}
          mobileConfig={mobileConfig}
          onViewModeChange={(mode) => {
            if (mode === 'advancedMetrics') {
              console.log('Advanced metrics toggled');
            }
          }}
        />

        {/* Mobile Export Button */}
        {isMobile && reportData && (
          <TouchFab
            icon={<Assessment />}
            label="Hızlı Rapor"
            onClick={() => loadReportData(false)}
            position="bottom-right"
            color="primary"
            hapticFeedback={touchSupport}
          />
        )}

        {/* Recent Reports Dialog */}
        <Dialog
          open={ui.recentReportsOpen}
          onClose={() => updateUIState({ recentReportsOpen: false })}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History />
              Son Raporlar
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Son oluşturulan raporlarınız burada görünecek.
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Assessment />
                </ListItemIcon>
                <ListItemText
                  primary="Aylık Özet Raporu"
                  secondary="15 Aralık 2024 - PDF"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp />
                </ListItemIcon>
                <ListItemText
                  primary="Kategori Analizi"
                  secondary="10 Aralık 2024 - Excel"
                />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <TouchButton onClick={() => updateUIState({ recentReportsOpen: false })}>
              Kapat
            </TouchButton>
          </DialogActions>
        </Dialog>

        {/* Templates Dialog */}
        <Dialog
          open={ui.templatesOpen}
          onClose={() => updateUIState({ templatesOpen: false })}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bookmark />
              Rapor Şablonları
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Önceden hazırlanmış rapor şablonlarını kullanarak hızlıca rapor oluşturun.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Assessment color="primary" />
                    <Typography variant="subtitle1">Aylık Özet</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Aylık gelir-gider özeti ve temel analizler
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <TouchButton onClick={() => updateUIState({ templatesOpen: false })}>
              Kapat
            </TouchButton>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ReportsPage;