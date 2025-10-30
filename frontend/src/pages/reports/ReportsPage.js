import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  Divider,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Assessment,
  Download,
  Refresh,
  PictureAsPdf,
  TableChart,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Category,
  DateRange,
  FilterList,
  Share,
  Bookmark,
  BookmarkBorder,
  Link,
  History,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { reportsAPI, formatCurrency, formatDate, handleApiError } from '../../services/api';
import { reportCache, cacheMonitor } from '../../services/cacheManager';
import DateRangePicker from '../../components/reports/DateRangePicker';
import CategorySelector from '../../components/reports/CategorySelector';
import ReportTypeSelector from '../../components/reports/ReportTypeSelector';

import PDFExportButton from '../../components/reports/PDFExportButton';
import ExcelExportButton from '../../components/reports/ExcelExportButton';
import ReportContentDisplay from '../../components/reports/ReportContentDisplay';
import usePerformanceMonitor from '../../hooks/usePerformanceMonitor';

// Memoized components for performance
const MemoizedReportContentDisplay = memo(ReportContentDisplay);

const ReportsPage = () => {
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Performance monitoring - temporarily disabled
  // const { metrics: performanceHookMetrics, getPerformanceReport } = usePerformanceMonitor('ReportsPage');

  // URL state management utilities
  const getInitialFiltersFromURL = useCallback(() => {
    const reportType = searchParams.get('reportType') || 'summary';
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const categories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
    
    return {
      reportType,
      dateRange: { start: startDate, end: endDate },
      selectedCategories: categories,
      customFilters: {}
    };
  }, [searchParams]);

  const updateURLFromFilters = useCallback((filters) => {
    const newParams = new URLSearchParams();
    
    // Set report type
    if (filters.reportType && filters.reportType !== 'summary') {
      newParams.set('reportType', filters.reportType);
    }
    
    // Set date range if not default (current month)
    const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (filters.dateRange.start !== defaultStart) {
      newParams.set('startDate', filters.dateRange.start);
    }
    if (filters.dateRange.end !== defaultEnd) {
      newParams.set('endDate', filters.dateRange.end);
    }
    
    // Set categories if any selected
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      newParams.set('categories', filters.selectedCategories.join(','));
    }
    
    // Update URL without causing navigation
    setSearchParams(newParams, { replace: true });
  }, [setSearchParams]);

  const generateShareableURL = useCallback((filters) => {
    const baseURL = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    params.set('reportType', filters.reportType);
    params.set('startDate', filters.dateRange.start);
    params.set('endDate', filters.dateRange.end);
    
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      params.set('categories', filters.selectedCategories.join(','));
    }
    
    return `${baseURL}?${params.toString()}`;
  }, []);
  
  // Enhanced State management with better organization
  const [reportState, setReportState] = useState({
    // Filter states - initialized from URL
    filters: getInitialFiltersFromURL(),
    
    // Data states
    data: {
      current: null,
      previous: null,
      history: [], // Keep last 5 reports for comparison
      lastFetchTime: null,
      dataVersion: 0 // Increment on each successful fetch
    },
    
    // Loading states
    loading: {
      initial: true,
      refresh: false,
      filter: false, // When filters change
      export: { pdf: false, excel: false },
      cache: false
    },
    
    // Error states
    errors: {
      current: null,
      history: [], // Keep error history for debugging
      retryCount: 0,
      lastRetryTime: null
    },
    
    // Cache states
    cache: {
      stats: null,
      enabled: true,
      fromCache: false,
      lastClearTime: null,
      hitRate: 0
    },
    
    // UI states
    ui: {
      filtersExpanded: !isMobile, // Collapse on mobile by default
      autoRefresh: false,
      autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
      compactView: isMobile,
      sidebarOpen: false,
      shareDialogOpen: false,
      bookmarkDialogOpen: false
    },
    
    // Performance states
    performance: {
      loadTime: null,
      dataSize: null,
      renderTime: null,
      memoryUsage: null,
      slowQueryWarning: false
    },
    
    // Analytics states
    analytics: {
      pageViews: 0,
      reportGenerations: 0,
      exportCount: { pdf: 0, excel: 0 },
      filterChanges: 0,
      sessionStartTime: Date.now()
    }
  });

  // Derived state selectors with better organization
  const {
    filters: { reportType, dateRange, selectedCategories },
    data: { current: reportData, previous: previousReportData },
    loading,
    errors: { current: error },
    cache: { stats: cacheStats, fromCache: dataFromCache },
    ui: { filtersExpanded, autoRefresh },
    performance,
    analytics
  } = reportState;

  // Computed state values
  const isLoading = loading.initial || loading.refresh || loading.filter;
  const hasError = !!error;
  const hasData = !!reportData;
  const canExport = hasData && !isLoading && !hasError;

  // Enhanced state update helpers with better organization
  const updateReportState = useCallback((updates) => {
    setReportState(prev => {
      // Deep merge for nested objects
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
    
    updateReportState({
      filters: newFilters,
      analytics: { filterChanges: analytics.filterChanges + 1 }
    });
    
    // Update URL to reflect new filters
    updateURLFromFilters(newFilters);
  }, [updateReportState, analytics.filterChanges, reportState.filters, updateURLFromFilters]);

  const updateLoadingState = useCallback((loadingUpdates) => {
    updateReportState({ loading: loadingUpdates });
  }, [updateReportState]);

  const updateErrorState = useCallback((errorUpdates) => {
    updateReportState({ 
      errors: {
        ...errorUpdates,
        history: errorUpdates.current ? 
          [...reportState.errors.history.slice(-4), { error: errorUpdates.current, timestamp: Date.now() }] :
          reportState.errors.history
      }
    });
  }, [updateReportState, reportState.errors.history]);

  const updateCacheState = useCallback((cacheUpdates) => {
    updateReportState({ cache: cacheUpdates });
  }, [updateReportState]);

  const updateUIState = useCallback((uiUpdates) => {
    updateReportState({ ui: uiUpdates });
  }, [updateReportState]);

  const updatePerformanceState = useCallback((performanceUpdates) => {
    updateReportState({ performance: performanceUpdates });
  }, [updateReportState]);

  const updateAnalytics = useCallback((analyticsUpdates) => {
    updateReportState({ analytics: analyticsUpdates });
  }, [updateReportState]);

  // Filter-specific setters
  const setReportType = useCallback((type) => {
    updateFilters({ reportType: type });
  }, [updateFilters]);

  const setDateRange = useCallback((range) => {
    updateFilters({ dateRange: range });
  }, [updateFilters]);

  const setSelectedCategories = useCallback((categories) => {
    updateFilters({ selectedCategories: categories });
  }, [updateFilters]);

  // Load report data function - defined before useEffects to avoid initialization errors
  const loadReportData = useCallback(async (forceRefresh = false) => {
    const startTime = Date.now();
    
    try {
      // Update loading states
      updateLoadingState({
        initial: !reportState.data.current,
        refresh: forceRefresh,
        filter: false
      });
      
      updateErrorState({ current: null });
      
      // Prepare filters for API call
      const filters = {
        dateRange,
        categories: selectedCategories,
        reportType
      };
      
      // Call the appropriate API based on refresh type
      const response = forceRefresh ? 
        await reportsAPI.refreshReport(filters) :
        await reportsAPI.generateReport(filters);
      
      const loadTime = Date.now() - startTime;
      const dataSize = JSON.stringify(response.data.data).length;
      
      // Update data state with history tracking
      const newDataHistory = reportState.data.history.length >= 5 ? 
        reportState.data.history.slice(1) : 
        reportState.data.history;
      
      if (reportState.data.current) {
        newDataHistory.push({
          data: reportState.data.current,
          timestamp: reportState.data.lastFetchTime,
          filters: { reportType, dateRange, selectedCategories }
        });
      }
      
      updateReportState({
        data: {
          previous: reportState.data.current,
          current: response.data.data,
          history: newDataHistory,
          dataVersion: reportState.data.dataVersion + 1
        },
        cache: {
          fromCache: response.data.fromCache || false,
          hitRate: response.data.cacheHitRate || reportState.cache.hitRate
        },
        performance: {
          loadTime,
          dataSize,
          slowQueryWarning: loadTime > 10000
        },
        analytics: {
          reportGenerations: analytics.reportGenerations + 1
        }
      });
      
      // Update cache stats
      try {
        const statsResponse = await reportsAPI.getCacheStats();
        updateCacheState({
          stats: statsResponse.data.data
        });
      } catch (cacheError) {
        console.warn('Cache stats could not be loaded:', cacheError);
      }
      
    } catch (error) {
      const errorMessage = handleApiError(error);
      
      updateErrorState({
        current: errorMessage,
        retryCount: reportState.errors.retryCount + 1,
        lastRetryTime: new Date()
      });
      
      showError('Rapor verileri yüklenirken hata oluştu');
    } finally {
      updateLoadingState({
        initial: false,
        refresh: false,
        filter: false
      });
    }
  }, [dateRange, selectedCategories, reportType, showError]);

  // Load initial data - simplified to avoid loops
  useEffect(() => {
    // Just log page view, don't update state
    console.log('ReportsPage loaded');
    
    // Initial load with a flag to prevent loops
    if (!reportState.data.current && !initialLoadDone) {
      loadReportData().then(() => {
        setInitialLoadDone(true);
      });
    }
  }, []); // Empty dependency array for initial load only

  // URL synchronization effect - listen for URL changes (back/forward navigation)
  useEffect(() => {
    const urlFilters = getInitialFiltersFromURL();
    const currentFilters = reportState.filters;
    
    // Check if URL filters are different from current state
    const filtersChanged = 
      urlFilters.reportType !== currentFilters.reportType ||
      urlFilters.dateRange.start !== currentFilters.dateRange.start ||
      urlFilters.dateRange.end !== currentFilters.dateRange.end ||
      JSON.stringify(urlFilters.selectedCategories.sort()) !== JSON.stringify(currentFilters.selectedCategories.sort());
    
    if (filtersChanged) {
      // Update state without triggering URL update (to avoid infinite loop)
      updateReportState({
        filters: urlFilters
      });
    }
  }, [searchParams]);

  // Auto-refresh functionality with better control
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only auto-refresh if not currently loading and no errors
      if (!isLoading && !hasError) {
        loadReportData(false);
      }
    }, reportState.ui.autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isLoading, hasError, reportState.ui.autoRefreshInterval]);

  // Enhanced filter change effect - reload data when filters change
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  useEffect(() => {
    if (initialLoadDone) { // Skip initial load
      updateLoadingState({ filter: true });
      
      const timeoutId = setTimeout(() => {
        loadReportData(false);
      }, 300); // Debounce filter changes

      return () => clearTimeout(timeoutId);
    }
  }, [reportType, dateRange, selectedCategories, initialLoadDone]);

  // Browser navigation handling (back/forward buttons)
  useEffect(() => {
    const handlePopState = (event) => {
      // The URL synchronization effect will handle the state update
      console.log('Browser navigation detected, syncing filters from URL');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Responsive UI updates
  useEffect(() => {
    updateUIState({ 
      compactView: isMobile,
      filtersExpanded: !isMobile // Remove dependency on reportState.ui.filtersExpanded
    });
  }, [isMobile]);

  // Enhanced performance monitoring - simplified to avoid loops
  useEffect(() => {
    if (performance.loadTime && performance.dataSize) {
      console.log(`Report loaded in ${performance.loadTime}ms, data size: ${(performance.dataSize / 1024).toFixed(2)}KB`);
      
      // Just log warnings, don't update state to avoid loops
      if (performance.loadTime > 10000) {
        console.warn('Report load time is high, consider optimizing');
      }
      if (performance.dataSize > 1024 * 1024) {
        console.warn('Report data size is large, consider pagination');
      }
    }
  }, [performance.loadTime, performance.dataSize]);

  // Memory usage monitoring - simplified to avoid loops
  useEffect(() => {
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory;
      const usagePercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      
      // Just log high memory usage, don't update state
      if (usagePercentage > 80) {
        console.warn(`High memory usage: ${usagePercentage.toFixed(1)}%`);
      }
    }
  }, [reportData]); // Update when data changes



  const handleExportPDF = async () => {
    try {
      updateLoadingState({ export: { ...loading.export, pdf: true } });
      
      if (!canExport) {
        showError('Önce rapor verilerini yükleyin');
        return;
      }
      
      const response = await reportsAPI.exportToPDF(reportData, 'standard');
      showSuccess('PDF raporu başarıyla oluşturuldu');
      
      updateAnalytics({
        exportCount: { 
          ...analytics.exportCount, 
          pdf: analytics.exportCount.pdf + 1 
        }
      });
      
      // In a real implementation, this would trigger a download
      console.log('PDF Export:', response.data);
      
    } catch (error) {
      showError('PDF oluşturulurken hata oluştu');
    } finally {
      updateLoadingState({ export: { ...loading.export, pdf: false } });
    }
  };

  const handleExportExcel = async () => {
    try {
      updateLoadingState({ export: { ...loading.export, excel: true } });
      
      if (!canExport) {
        showError('Önce rapor verilerini yükleyin');
        return;
      }
      
      const response = await reportsAPI.exportToExcel(reportData);
      showSuccess('Excel raporu başarıyla oluşturuldu');
      
      updateAnalytics({
        exportCount: { 
          ...analytics.exportCount, 
          excel: analytics.exportCount.excel + 1 
        }
      });
      
      // In a real implementation, this would trigger a download
      console.log('Excel Export:', response.data);
      
    } catch (error) {
      showError('Excel oluşturulurken hata oluştu');
    } finally {
      updateLoadingState({ export: { ...loading.export, excel: false } });
    }
  };

  const handleRefresh = useCallback(() => {
    loadReportData(false);
  }, [loadReportData]);

  const handleForceRefresh = useCallback(() => {
    loadReportData(true);
  }, [loadReportData]);

  const handleClearCache = useCallback(async () => {
    try {
      updateLoadingState({ cache: true });
      
      await reportsAPI.clearCache();
      showSuccess('Cache temizlendi');
      
      updateCacheState({
        lastClearTime: new Date(),
        hitRate: 0,
        fromCache: false
      });
      
      // Reload data after clearing cache
      await loadReportData(true);
    } catch (error) {
      showError('Cache temizlenirken hata oluştu');
      updateLoadingState({ cache: false });
    }
  }, [loadReportData, showSuccess, showError]);

  const handleToggleFilters = useCallback(() => {
    updateUIState({ filtersExpanded: !filtersExpanded });
  }, [filtersExpanded]);

  const handleToggleAutoRefresh = useCallback(() => {
    updateUIState({ autoRefresh: !autoRefresh });
  }, [autoRefresh]);

  const handleRetryLastOperation = useCallback(() => {
    if (hasError) {
      loadReportData(false);
    }
  }, [hasError, loadReportData]);

  const handleResetFilters = useCallback(() => {
    updateFilters({
      reportType: 'summary',
      dateRange: { 
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      selectedCategories: []
    });
  }, [updateFilters]);

  const handleCompareWithPrevious = useCallback(() => {
    if (previousReportData) {
      // This would open a comparison view
      console.log('Comparing current with previous data');
    }
  }, [previousReportData]);

  const handleExportHistory = useCallback(() => {
    if (reportState.data.history.length > 0) {
      // Export historical data
      console.log('Exporting report history');
    }
  }, [reportState.data.history]);

  // URL and bookmark management functions
  const handleShareReport = useCallback(() => {
    const shareableURL = generateShareableURL(reportState.filters);
    
    if (navigator.share) {
      // Use native sharing if available
      navigator.share({
        title: 'Finansal Rapor',
        text: `${reportType === 'summary' ? 'Özet' : reportType === 'detailed' ? 'Detaylı' : 'Karşılaştırmalı'} finansal rapor`,
        url: shareableURL
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareableURL).then(() => {
        showSuccess('Rapor linki panoya kopyalandı');
      }).catch(() => {
        // Fallback for older browsers
        updateUIState({ shareDialogOpen: true });
      });
    }
  }, [generateShareableURL, reportState.filters, reportType, showSuccess, updateUIState]);

  const handleBookmarkReport = useCallback(() => {
    const bookmarkData = {
      url: generateShareableURL(reportState.filters),
      title: `Finansal Rapor - ${reportType === 'summary' ? 'Özet' : reportType === 'detailed' ? 'Detaylı' : 'Karşılaştırmalı'}`,
      filters: reportState.filters,
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage for now (could be enhanced with backend storage)
    const existingBookmarks = JSON.parse(localStorage.getItem('reportBookmarks') || '[]');
    const newBookmarks = [bookmarkData, ...existingBookmarks.slice(0, 9)]; // Keep last 10
    localStorage.setItem('reportBookmarks', JSON.stringify(newBookmarks));
    
    showSuccess('Rapor yer imlerine eklendi');
  }, [generateShareableURL, reportState.filters, reportType, showSuccess]);

  const handleLoadBookmark = useCallback((bookmark) => {
    // Update filters from bookmark
    updateFilters(bookmark.filters);
    showSuccess('Yer imi yüklendi');
  }, [updateFilters, showSuccess]);

  const handleCopyCurrentURL = useCallback(() => {
    const currentURL = generateShareableURL(reportState.filters);
    navigator.clipboard.writeText(currentURL).then(() => {
      showSuccess('Mevcut rapor linki kopyalandı');
    }).catch(() => {
      showError('Link kopyalanamadı');
    });
  }, [generateShareableURL, reportState.filters, showSuccess, showError]);

  const handleResetToDefaults = useCallback(() => {
    const defaultFilters = {
      reportType: 'summary',
      dateRange: { 
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      selectedCategories: [],
      customFilters: {}
    };
    
    updateFilters(defaultFilters);
    showSuccess('Filtreler varsayılan değerlere sıfırlandı');
  }, [updateFilters, showSuccess]);

  // Enhanced memoized calculations for performance
  const summaryMetrics = useMemo(() => {
    if (!reportData?.summary) return null;
    
    const { totalIncome, totalExpense, netIncome } = reportData.summary;
    const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0;
    const healthScore = reportData.financialMetrics?.healthScore || 0;
    
    return {
      totalIncome,
      totalExpense,
      netIncome,
      savingsRate: parseFloat(savingsRate),
      healthScore: parseFloat(healthScore.toFixed(1))
    };
  }, [reportData?.summary, reportData?.financialMetrics?.healthScore]);

  // Memoized filter state for performance
  const filterState = useMemo(() => ({
    reportType,
    dateRange,
    selectedCategories,
    hasFilters: reportType !== 'summary' || 
                selectedCategories.length > 0 ||
                dateRange.start !== new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] ||
                dateRange.end !== new Date().toISOString().split('T')[0]
  }), [reportType, dateRange, selectedCategories]);

  // Memoized UI state for performance
  const uiState = useMemo(() => ({
    isLoading,
    hasError,
    hasData,
    canExport,
    compactView: reportState.ui.compactView,
    filtersExpanded: reportState.ui.filtersExpanded
  }), [isLoading, hasError, hasData, canExport, reportState.ui.compactView, reportState.ui.filtersExpanded]);

  // Memoized performance metrics
  const performanceMetrics = useMemo(() => ({
    loadTime: performance.loadTime,
    dataSize: performance.dataSize,
    isSlowQuery: performance.slowQueryWarning,
    isLargeData: performance.dataSize > 1024 * 1024,
    memoryUsage: performance.memoryUsage,
    isHighMemory: performance.memoryUsage?.used > performance.memoryUsage?.limit * 0.8
  }), [performance]);

  // Enhanced loading state with better UX
  if (loading.initial && !hasData) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="textSecondary">
            Rapor verileri yükleniyor...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Bu işlem birkaç saniye sürebilir
          </Typography>
          {performance.loadTime && (
            <Typography variant="caption" color="textSecondary">
              Önceki yükleme: {performance.loadTime}ms
            </Typography>
          )}
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
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          mb: 4,
          gap: isMobile ? 2 : 0
        }}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
              Finansal Raporlar
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {isMobile ? 'Finansal analiz ve raporlar' : 'Gelir, gider ve finansal performansınızın detaylı analizi'}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: 1,
            width: isMobile ? '100%' : 'auto'
          }}>
            <Button
              variant="outlined"
              startIcon={isLoading ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
              fullWidth={isMobile}
            >
              {isMobile ? 'Yenile' : 'Raporları Yenile'}
            </Button>
            
            <PDFExportButton
              reportData={reportData}
              disabled={!canExport || loading.export.pdf}
              variant="outlined"
              fullWidth={isMobile}
              showTemplateSelector={true}
              defaultTemplate={reportType === 'comparison' ? 'comparison' : 
                              reportType === 'detailed' ? 'detailed' : 'standard'}
              loading={loading.export.pdf}
            />
            
            <ExcelExportButton
              reportData={reportData}
              disabled={!canExport || loading.export.excel}
              variant="contained"
              fullWidth={isMobile}
              showAdvancedOptions={true}
              loading={loading.export.excel}
            />
          </Box>
        </Box>

        {/* Enhanced Error Display with better context */}
        {hasError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" onClick={handleRetryLastOperation}>
                  Tekrar Dene ({reportState.errors.retryCount})
                </Button>
                <Button size="small" onClick={handleForceRefresh}>
                  Zorla Yenile
                </Button>
                <Button size="small" onClick={handleResetFilters}>
                  Filtreleri Sıfırla
                </Button>
              </Box>
            }
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Hata:</strong> {error}
            </Typography>
            {reportState.data.lastFetchTime && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                Son başarılı yükleme: {reportState.data.lastFetchTime.toLocaleString('tr-TR')}
              </Typography>
            )}
            {reportState.errors.retryCount > 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                Deneme sayısı: {reportState.errors.retryCount}
              </Typography>
            )}
            {reportState.errors.history.length > 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                Son hatalar: {reportState.errors.history.length} hata kaydedildi
              </Typography>
            )}
          </Alert>
        )}

        {/* Enhanced Loading States Info */}
        {isLoading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">
                {loading.refresh ? 'Veriler yenileniyor...' : 
                 loading.filter ? 'Filtreler uygulanıyor...' :
                 loading.initial ? 'İlk veriler yükleniyor...' : 'Rapor oluşturuluyor...'}
              </Typography>
            </Box>
            {performance.loadTime && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Önceki yükleme süresi: {performance.loadTime}ms
              </Typography>
            )}
            {loading.cache && (
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                Cache işlemi devam ediyor...
              </Typography>
            )}
            {performance.slowQueryWarning && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                ⚠️ Yavaş sorgu tespit edildi, lütfen bekleyin
              </Typography>
            )}
          </Alert>
        )}

        {/* Filter Section */}
        <Box sx={{ mb: 4 }}>
          {/* Date Range Picker */}
          <DateRangePicker
            value={filterState.dateRange}
            onChange={setDateRange}
            disabled={uiState.isLoading}
          />
          
          {/* Category Selector */}
          <CategorySelector
            value={filterState.selectedCategories}
            onChange={setSelectedCategories}
            disabled={uiState.isLoading}
          />
          
          {/* Report Type Selector */}
          <ReportTypeSelector
            value={filterState.reportType}
            onChange={setReportType}
            disabled={uiState.isLoading}
          />
          
          {/* Filter Summary and Actions */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FilterList color="primary" />
                <Typography variant="h6">
                  Aktif Filtreler
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Chip 
                  icon={<DateRange />}
                  label={`${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`}
                  variant="outlined"
                />
                <Chip 
                  icon={<Category />}
                  label={selectedCategories.length > 0 ? `${selectedCategories.length} kategori` : 'Tüm kategoriler'}
                  variant="outlined"
                />
                <Chip 
                  icon={<Assessment />}
                  label={reportType === 'summary' ? 'Özet Rapor' : reportType === 'detailed' ? 'Detaylı Rapor' : 'Karşılaştırmalı Rapor'}
                  color="primary"
                />
                {dataFromCache && (
                  <Chip 
                    label="Cache'den yüklendi"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
                {performanceMetrics.isSlowQuery && (
                  <Chip 
                    label="Yavaş sorgu"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
                {performanceMetrics.isHighMemory && (
                  <Chip 
                    label="Yüksek bellek kullanımı"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
                {performanceMetrics.isLargeData && (
                  <Chip 
                    label="Büyük veri seti"
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
                {reportState.data.dataVersion > 1 && (
                  <Chip 
                    label={`v${reportState.data.dataVersion}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
                {searchParams.toString() && (
                  <Tooltip title="Bu rapor URL parametreleri ile yüklendi - paylaşılabilir">
                    <Chip 
                      label="URL Senkronize"
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<Link />}
                    />
                  </Tooltip>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => loadReportData(false)}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} /> : <Assessment />}
                >
                  Raporu Oluştur
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleForceRefresh}
                  disabled={isLoading}
                >
                  Zorla Yenile
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={handleClearCache}
                  disabled={loading.cache}
                >
                  Cache Temizle
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={handleResetToDefaults}
                  disabled={isLoading}
                >
                  Varsayılana Sıfırla
                </Button>
                
                {/* URL and Bookmark Actions */}
                <Button
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={handleShareReport}
                  startIcon={<Share />}
                  disabled={isLoading}
                >
                  Paylaş
                </Button>
                
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={handleBookmarkReport}
                  startIcon={<BookmarkBorder />}
                  disabled={isLoading}
                >
                  Yer İmi Ekle
                </Button>
                
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => updateUIState({ bookmarkDialogOpen: true })}
                  startIcon={<History />}
                  disabled={isLoading}
                >
                  Kaydedilenler
                </Button>
                
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCopyCurrentURL}
                  startIcon={<Link />}
                  disabled={isLoading}
                >
                  Link Kopyala
                </Button>
                
                {/* Cache Stats */}
                {cacheStats && (
                  <Tooltip title={`Cache boyutu: ${cacheStats.reportCache?.size || 0} öğe, Hit rate: %${Math.round(reportState.cache.hitRate * 100)}`}>
                    <Chip 
                      label={`Cache: ${cacheStats.reportCache?.size || 0}`}
                      size="small"
                      variant="outlined"
                      color={reportState.cache.hitRate > 0.7 ? 'success' : 'default'}
                    />
                  </Tooltip>
                )}
                
                {/* Performance Stats */}
                {performance.loadTime && (
                  <Tooltip title={`Son yükleme: ${performance.loadTime}ms, Veri boyutu: ${Math.round(performance.dataSize / 1024)}KB`}>
                    <Chip 
                      label={`${performance.loadTime}ms`}
                      size="small"
                      variant="outlined"
                      color={performance.loadTime > 5000 ? 'warning' : 'success'}
                    />
                  </Tooltip>
                )}
                
                {/* Data History */}
                {reportState.data.history.length > 0 && (
                  <Tooltip title={`${reportState.data.history.length} geçmiş rapor mevcut`}>
                    <Chip 
                      label={`Geçmiş: ${reportState.data.history.length}`}
                      size="small"
                      variant="outlined"
                      onClick={handleExportHistory}
                      clickable
                    />
                  </Tooltip>
                )}
                
                {/* Compare with Previous */}
                {previousReportData && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={handleCompareWithPrevious}
                    disabled={isLoading}
                  >
                    Önceki ile Karşılaştır
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Toplam Gelir
                    </Typography>
                  </Box>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {formatCurrency(summaryMetrics.totalIncome)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingDown color="error" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Toplam Gider
                    </Typography>
                  </Box>
                  <Typography variant="h5" color="error.main" fontWeight="bold">
                    {formatCurrency(summaryMetrics.totalExpense)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalance color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Net Gelir
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h5" 
                    color={summaryMetrics.netIncome >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {formatCurrency(summaryMetrics.netIncome)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assessment color="info" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="textSecondary">
                      Finansal Sağlık
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h5" 
                    color={
                      summaryMetrics.healthScore >= 70 ? 'success.main' : 
                      summaryMetrics.healthScore >= 40 ? 'warning.main' : 'error.main'
                    }
                    fontWeight="bold"
                  >
                    {summaryMetrics.healthScore}/100
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Tasarruf: %{summaryMetrics.savingsRate}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Dynamic Report Content Display */}
        <MemoizedReportContentDisplay
          reportData={reportData}
          reportType={filterState.reportType}
          loading={uiState.isLoading}
          error={error}
          compactView={uiState.compactView}
          showAdvancedMetrics={true}
          onViewModeChange={(mode) => {
            if (mode === 'advancedMetrics') {
              // Toggle advanced metrics
              console.log('Advanced metrics toggled');
            }
          }}
        />



        {/* Enhanced Loading Overlay */}
        {isLoading && hasData && (
          <Box sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            bgcolor: 'rgba(255,255,255,0.8)', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 9999,
            gap: 2
          }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="textSecondary">
              {loading.refresh ? 'Veriler yenileniyor...' : 
               loading.filter ? 'Filtreler uygulanıyor...' :
               loading.cache ? 'Cache işlemi...' : 'İşlem devam ediyor...'}
            </Typography>
            {performance.loadTime && (
              <Typography variant="body2" color="textSecondary">
                Tahmini süre: ~{Math.round(performance.loadTime / 1000)}s
              </Typography>
            )}
          </Box>
        )}

        {/* Performance Warning */}
        {performance.memoryUsage?.used > performance.memoryUsage?.limit * 0.9 && (
          <Alert severity="warning" sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
            <Typography variant="body2">
              Yüksek bellek kullanımı tespit edildi. Sayfayı yenilemeyi düşünün.
            </Typography>
          </Alert>
        )}

        {/* Share Dialog */}
        <Dialog 
          open={reportState.ui.shareDialogOpen} 
          onClose={() => updateUIState({ shareDialogOpen: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Raporu Paylaş</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={generateShareableURL(reportState.filters)}
              label="Paylaşılabilir Link"
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
              sx={{ mt: 2 }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Bu link ile raporu başkalarıyla paylaşabilir veya daha sonra erişmek için kaydedebilirsiniz.
              Link mevcut filtre ayarlarınızı içerir.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => updateUIState({ shareDialogOpen: false })}>
              Kapat
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(generateShareableURL(reportState.filters));
                showSuccess('Link kopyalandı');
                updateUIState({ shareDialogOpen: false });
              }}
              variant="contained"
            >
              Kopyala
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bookmark Dialog */}
        <Dialog 
          open={reportState.ui.bookmarkDialogOpen} 
          onClose={() => updateUIState({ bookmarkDialogOpen: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Kaydedilmiş Raporlar</DialogTitle>
          <DialogContent>
            <BookmarkList onLoadBookmark={handleLoadBookmark} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => updateUIState({ bookmarkDialogOpen: false })}>
              Kapat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

// Bookmark List Component
const BookmarkList = ({ onLoadBookmark }) => {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem('reportBookmarks') || '[]');
    setBookmarks(savedBookmarks);
  }, []);

  const handleDeleteBookmark = (index) => {
    const updatedBookmarks = bookmarks.filter((_, i) => i !== index);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('reportBookmarks', JSON.stringify(updatedBookmarks));
  };

  if (bookmarks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <BookmarkBorder sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="body1" color="textSecondary">
          Henüz kaydedilmiş rapor bulunmuyor
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Bir rapor oluşturduktan sonra "Yer İmi" butonunu kullanarak kaydedin
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {bookmarks.map((bookmark, index) => (
        <ListItem key={index} divider>
          <ListItemIcon>
            <Bookmark color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={bookmark.title}
            secondary={
              <Box>
                <Typography variant="caption" display="block">
                  {new Date(bookmark.createdAt).toLocaleString('tr-TR')}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {bookmark.filters.dateRange.start} - {bookmark.filters.dateRange.end}
                  {bookmark.filters.selectedCategories.length > 0 && 
                    ` • ${bookmark.filters.selectedCategories.length} kategori`
                  }
                </Typography>
              </Box>
            }
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={() => onLoadBookmark(bookmark)}
              variant="outlined"
            >
              Yükle
            </Button>
            <Button
              size="small"
              onClick={() => handleDeleteBookmark(index)}
              color="error"
              variant="outlined"
            >
              Sil
            </Button>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default ReportsPage;