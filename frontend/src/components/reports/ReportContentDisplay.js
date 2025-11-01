import React, { useState, useMemo, memo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Collapse,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  TableChart,
  BarChart,
  PieChart,
  TrendingUp,
  Visibility,
  VisibilityOff,
  Info,
  Warning,
} from '@mui/icons-material';
import { formatCurrency, formatDate, formatPercentage } from '../../services/api';
import LazyWrapper from '../common/LazyWrapper';
import VirtualizedTable from '../common/VirtualizedTable';
import PaginationControls from '../common/PaginationControls';
import usePagination from '../../hooks/usePagination';
import useMemoryManagement from '../../hooks/useMemoryManagement';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';
import ResponsiveChartContainer from '../common/ResponsiveChartContainer';
import { TouchButton, SwipeableCard, TouchTabs } from '../common/TouchFriendlyControls';

// Lazy loaded chart components for better performance
const SummaryCharts = React.lazy(() => import('./SummaryCharts'));
const CategoryAnalysisCharts = React.lazy(() => import('./CategoryAnalysisCharts'));
const TrendAnalysisCharts = React.lazy(() => import('./TrendAnalysisCharts'));

const ReportContentDisplay = ({ 
  reportData, 
  reportType, 
  loading, 
  error,
  compactView = false,
  showAdvancedMetrics = true,
  mobileOptimized = false,
  touchSupport = false,
  mobileConfig = {},
  onViewModeChange,
  enableVirtualization = true,
  enablePagination = true,
  maxRowsBeforeVirtualization = 100
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    charts: true,
    details: false,
    insights: false
  });
  const [viewSettings, setViewSettings] = useState({
    showCharts: true,
    showTables: !mobileOptimized, // Hide tables on mobile by default
    showInsights: !mobileOptimized, // Hide insights on mobile by default
    showComparisons: reportType === 'comparison' && !mobileOptimized,
    compactMode: compactView || mobileOptimized,
    useVirtualization: enableVirtualization,
    usePagination: enablePagination
  });

  // Responsive layout
  const layout = useResponsiveLayout({
    enableTouchDetection: true,
    enableOrientationDetection: true
  });

  // Memory management
  const { 
    memoryStats, 
    cacheItem, 
    getCachedItem, 
    clearCache,
    forceCleanup 
  } = useMemoryManagement({
    maxCacheSize: 50,
    cleanupInterval: 30000,
    memoryThreshold: 0.8
  });

  // Memoized data processing
  const processedData = useMemo(() => {
    if (!reportData) return null;

    const summary = reportData.summary || {};
    const categoryAnalysis = reportData.categoryAnalysis || [];
    const trendData = reportData.trendAnalysis || {};
    const insights = reportData.insights || [];

    return {
      summary: {
        totalIncome: summary.totalIncome || 0,
        totalExpense: summary.totalExpense || 0,
        netIncome: (summary.totalIncome || 0) - (summary.totalExpense || 0),
        transactionCount: summary.transactionCount || 0,
        averageTransaction: summary.transactionCount > 0 ? 
          (summary.totalIncome + summary.totalExpense) / summary.transactionCount : 0,
        savingsRate: summary.totalIncome > 0 ? 
          ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100 : 0
      },
      categories: categoryAnalysis.map(cat => ({
        ...cat,
        percentage: parseFloat(cat.percentage || 0),
        trend: cat.trend || 'stable',
        efficiency: cat.budgetVsActual ? 
          ((cat.budgetVsActual.budget - cat.budgetVsActual.actual) / cat.budgetVsActual.budget) * 100 : null
      })),
      trends: {
        monthlyData: trendData.monthlyData || [],
        growthRate: trendData.growthRate || 0,
        seasonality: trendData.seasonality || {},
        predictions: trendData.predictions || []
      },
      insights: insights.map(insight => ({
        ...insight,
        severity: insight.severity || 'info',
        actionable: insight.actionable || false
      }))
    };
  }, [reportData]);

  // Pagination for category data
  const categoryPagination = usePagination({
    data: processedData?.categories || [],
    initialPageSize: layout.isMobile ? 10 : compactView ? 15 : 25,
    pageSizeOptions: layout.isMobile ? [5, 10, 25] : [10, 25, 50, 100]
  });

  const handleSectionToggle = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleViewSettingChange = useCallback((setting) => {
    setViewSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Touch gesture handlers for mobile
  const handleSwipeLeft = useCallback(() => {
    if (touchSupport && activeTab < 2) {
      setActiveTab(prev => prev + 1);
    }
  }, [touchSupport, activeTab]);

  const handleSwipeRight = useCallback(() => {
    if (touchSupport && activeTab > 0) {
      setActiveTab(prev => prev - 1);
    }
  }, [touchSupport, activeTab]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              Rapor içeriği yükleniyor...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <Typography variant="body1">
              Rapor içeriği yüklenirken hata oluştu: {error}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!processedData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="body1">
              Gösterilecek rapor verisi bulunmuyor. Lütfen filtreleri kontrol edin.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const renderSummarySection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Finansal Özet
          </Typography>
          <IconButton onClick={() => handleSectionToggle('summary')}>
            {expandedSections.summary ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={expandedSections.summary}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h4" color="success.contrastText" fontWeight="bold">
                  {formatCurrency(processedData.summary.totalIncome)}
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  Toplam Gelir
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="h4" color="error.contrastText" fontWeight="bold">
                  {formatCurrency(processedData.summary.totalExpense)}
                </Typography>
                <Typography variant="body2" color="error.contrastText">
                  Toplam Gider
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2, 
                bgcolor: processedData.summary.netIncome >= 0 ? 'primary.light' : 'warning.light', 
                borderRadius: 1 
              }}>
                <Typography variant="h4" color="primary.contrastText" fontWeight="bold">
                  {formatCurrency(processedData.summary.netIncome)}
                </Typography>
                <Typography variant="body2" color="primary.contrastText">
                  Net Gelir
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="h4" color="info.contrastText" fontWeight="bold">
                  %{processedData.summary.savingsRate.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="info.contrastText">
                  Tasarruf Oranı
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {showAdvancedMetrics && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Toplam İşlem: <strong>{processedData.summary.transactionCount}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Ortalama İşlem: <strong>{formatCurrency(processedData.summary.averageTransaction)}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    Rapor Türü: <strong>
                      {reportType === 'summary' ? 'Özet' : 
                       reportType === 'detailed' ? 'Detaylı' : 'Karşılaştırmalı'}
                    </strong>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderChartsSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Grafiksel Analiz
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewSettings.showCharts}
                  onChange={() => handleViewSettingChange('showCharts')}
                  size="small"
                />
              }
              label="Grafikleri Göster"
            />
            <IconButton onClick={() => handleSectionToggle('charts')}>
              {expandedSections.charts ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expandedSections.charts && viewSettings.showCharts}>
          {mobileOptimized ? (
            <TouchTabs
              tabs={[
                {
                  label: "Özet",
                  icon: <PieChart />
                },
                ...(reportType !== 'summary' ? [{
                  label: "Kategori",
                  icon: <BarChart />
                }] : []),
                ...(reportType === 'comparison' ? [{
                  label: "Trend",
                  icon: <TrendingUp />
                }] : [])
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
              showSwipeHint={touchSupport}
              sx={{ mb: 3 }}
            />
          ) : (
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              sx={{ mb: 3 }}
              variant="standard"
            >
              <Tab 
                label="Özet Grafikler" 
                icon={<PieChart />} 
              />
              {reportType !== 'summary' && (
                <Tab 
                  label="Kategori Analizi" 
                  icon={<BarChart />}
                />
              )}
              {reportType === 'comparison' && (
                <Tab 
                  icon={<TrendingUp />}
                />
              )}
            </Tabs>
          )}
          
          {activeTab === 0 && (
            <ResponsiveChartContainer
              minHeight={layout.isMobile ? 250 : 300}
              maxHeight={layout.isMobile ? 400 : 600}
              mobileHeight={250}
              tabletHeight={350}
              desktopHeight={400}
              maintainAspectRatio={!layout.isMobile}
              aspectRatio={layout.isMobile ? 4/3 : 16/9}
            >
              <LazyWrapper minHeight="250px">
                <SummaryCharts
                  data={reportData}
                  loading={loading}
                  error={error}
                  showIncomeExpensePie={true}
                  showTrendLine={!layout.isMobile} // Hide complex charts on mobile
                  showMonthlyComparison={reportType !== 'summary' && !layout.isMobile}
                  compactView={layout.isMobile || viewSettings.compactMode}
                  responsive={true}
                  {...layout.chartDimensions}
                />
              </LazyWrapper>
            </ResponsiveChartContainer>
          )}
          
          {activeTab === 1 && reportType !== 'summary' && (
            <ResponsiveChartContainer
              minHeight={layout.isMobile ? 300 : 400}
              maxHeight={layout.isMobile ? 500 : 700}
              mobileHeight={300}
              tabletHeight={400}
              desktopHeight={500}
              maintainAspectRatio={!layout.isMobile}
            >
              <LazyWrapper minHeight="300px">
                <CategoryAnalysisCharts
                  data={reportData}
                  loading={loading}
                  error={error}
                  showBarChart={true}
                  showPieChart={!layout.isMobile} // Hide pie chart on mobile to save space
                  showTable={viewSettings.showTables && !layout.isMobile}
                  showRadialChart={reportType === 'comparison' && !layout.isMobile}
                  maxCategories={layout.isMobile ? 5 : reportType === 'detailed' ? 8 : 12}
                  compactView={layout.isMobile || viewSettings.compactMode}
                  responsive={true}
                  {...layout.chartDimensions}
                />
              </LazyWrapper>
            </ResponsiveChartContainer>
          )}
          
          {activeTab === 2 && reportType === 'comparison' && (
            <ResponsiveChartContainer
              minHeight={layout.isMobile ? 280 : 350}
              maxHeight={layout.isMobile ? 450 : 600}
              mobileHeight={280}
              tabletHeight={350}
              desktopHeight={450}
              maintainAspectRatio={!layout.isMobile}
            >
              <LazyWrapper minHeight="280px">
                <TrendAnalysisCharts
                  data={reportData}
                  loading={loading}
                  error={error}
                  showTimeBasedTrend={true}
                  showComparison={!layout.isMobile} // Simplify on mobile
                  showGrowthAnalysis={!layout.isMobile}
                  showSeasonalAnalysis={false}
                  compactView={layout.isMobile || viewSettings.compactMode}
                  responsive={true}
                  {...layout.chartDimensions}
                />
              </LazyWrapper>
            </ResponsiveChartContainer>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderDetailsTable = () => {
    const categories = processedData?.categories || [];
    const shouldUseVirtualization = enableVirtualization && categories.length > maxRowsBeforeVirtualization;
    const shouldUsePagination = enablePagination && !shouldUseVirtualization && categories.length > 25;

    // Define table columns
    const tableColumns = [
      {
        field: 'category',
        headerName: 'Kategori',
        render: (item) => (
          <Typography variant="body2" fontWeight="medium">
            {item.category}
          </Typography>
        )
      },
      {
        field: 'amount',
        headerName: 'Tutar',
        align: 'right',
        render: (item) => (
          <Typography variant="body2" fontWeight="bold">
            {formatCurrency(item.amount)}
          </Typography>
        )
      },
      {
        field: 'percentage',
        headerName: 'Oran',
        align: 'right',
        render: (item) => (
          <Chip 
            label={`%${item.percentage.toFixed(1)}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        )
      },
      {
        field: 'trend',
        headerName: 'Trend',
        align: 'center',
        render: (item) => (
          <Chip 
            label={
              item.trend === 'up' ? '↗ Artış' : 
              item.trend === 'down' ? '↘ Azalış' : '→ Sabit'
            }
            size="small"
            color={
              item.trend === 'up' ? 'error' : 
              item.trend === 'down' ? 'success' : 'default'
            }
            variant="outlined"
          />
        )
      },
      {
        field: 'transactionCount',
        headerName: 'İşlem Sayısı',
        align: 'right',
        render: (item) => (
          <Typography variant="body2">
            {item.transactionCount || 0}
          </Typography>
        )
      }
    ];

    // Add efficiency column if advanced metrics are enabled
    if (showAdvancedMetrics) {
      tableColumns.push({
        field: 'efficiency',
        headerName: 'Verimlilik',
        align: 'right',
        render: (item) => (
          item.efficiency !== null ? (
            <Chip 
              label={`%${item.efficiency.toFixed(1)}`}
              size="small"
              color={item.efficiency > 0 ? 'success' : 'warning'}
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" color="textSecondary">
              N/A
            </Typography>
          )
        )
      });
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h3">
              Detaylı Kategori Analizi
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={viewSettings.showTables}
                    onChange={() => handleViewSettingChange('showTables')}
                    size="small"
                  />
                }
                label="Tabloları Göster"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={viewSettings.useVirtualization}
                    onChange={() => handleViewSettingChange('useVirtualization')}
                    size="small"
                  />
                }
                label="Sanal Kaydırma"
              />
              <IconButton onClick={() => handleSectionToggle('details')}>
                {expandedSections.details ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>
          
          <Collapse in={expandedSections.details && viewSettings.showTables}>
            {/* Memory usage warning */}
            {memoryStats.isHigh && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Yüksek bellek kullanımı tespit edildi (%{memoryStats.percentage.toFixed(1)}). 
                  Performans için sanal kaydırma önerilir.
                </Typography>
                <Button size="small" onClick={forceCleanup} sx={{ mt: 1 }}>
                  Belleği Temizle
                </Button>
              </Alert>
            )}

            {/* Virtualized table for large datasets */}
            {shouldUseVirtualization && viewSettings.useVirtualization ? (
              <VirtualizedTable
                data={categories}
                columns={tableColumns}
                rowHeight={viewSettings.compactMode ? 48 : 60}
                containerHeight={400}
                loading={loading}
                emptyMessage="Kategori verisi bulunamadı"
              />
            ) : shouldUsePagination && viewSettings.usePagination ? (
              /* Paginated table for medium datasets */
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table size={viewSettings.compactMode ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow>
                        {tableColumns.map((column, index) => (
                          <TableCell key={index} align={column.align || 'left'}>
                            {column.headerName}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryPagination.paginatedData.map((category, index) => (
                        <TableRow key={index} hover>
                          {tableColumns.map((column, colIndex) => (
                            <TableCell key={colIndex} align={column.align || 'left'}>
                              {column.render ? column.render(category) : category[column.field]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <PaginationControls
                  currentPage={categoryPagination.currentPage}
                  totalPages={categoryPagination.totalPages}
                  pageSize={categoryPagination.pageSize}
                  pageSizeOptions={categoryPagination.pageSizeOptions}
                  totalItems={categoryPagination.totalItems}
                  startIndex={categoryPagination.startIndex}
                  endIndex={categoryPagination.endIndex}
                  onPageChange={categoryPagination.goToPage}
                  onPageSizeChange={categoryPagination.changePageSize}
                  variant={viewSettings.compactMode ? 'compact' : 'standard'}
                />
              </>
            ) : (
              /* Standard table for small datasets */
              <TableContainer component={Paper} variant="outlined">
                <Table size={viewSettings.compactMode ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      {tableColumns.map((column, index) => (
                        <TableCell key={index} align={column.align || 'left'}>
                          {column.headerName}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category, index) => (
                      <TableRow key={index} hover>
                        {tableColumns.map((column, colIndex) => (
                          <TableCell key={colIndex} align={column.align || 'left'}>
                            {column.render ? column.render(category) : category[column.field]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Performance info */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                {categories.length.toLocaleString()} kategori • 
                Bellek: %{memoryStats.percentage.toFixed(1)} • 
                {shouldUseVirtualization ? 'Sanal kaydırma' : 
                 shouldUsePagination ? 'Sayfalama' : 'Standart'} modu
              </Typography>
              
              {categories.length > maxRowsBeforeVirtualization && !viewSettings.useVirtualization && (
                <Button
                  size="small"
                  onClick={() => handleViewSettingChange('useVirtualization')}
                  variant="outlined"
                  color="primary"
                >
                  Sanal Kaydırmayı Etkinleştir
                </Button>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  const renderInsightsSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Finansal İçgörüler
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewSettings.showInsights}
                  onChange={() => handleViewSettingChange('showInsights')}
                  size="small"
                />
              }
              label="İçgörüleri Göster"
            />
            <IconButton onClick={() => handleSectionToggle('insights')}>
              {expandedSections.insights ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expandedSections.insights && viewSettings.showInsights}>
          {processedData.insights.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {processedData.insights.map((insight, index) => (
                <Alert 
                  key={index}
                  severity={insight.severity}
                  action={
                    insight.actionable && (
                      <Button size="small" color="inherit">
                        Aksiyon Al
                      </Button>
                    )
                  }
                >
                  <Typography variant="body2">
                    <strong>{insight.title}:</strong> {insight.description}
                  </Typography>
                  {insight.recommendation && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <strong>Öneri:</strong> {insight.recommendation}
                    </Typography>
                  )}
                </Alert>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                Bu rapor için henüz içgörü bulunmuyor. Daha fazla veri toplandıkça 
                finansal öneriler ve analizler burada görünecek.
              </Typography>
            </Alert>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );

  return (
    <SwipeableCard
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      disabled={!touchSupport}
      showSwipeIndicators={touchSupport && mobileOptimized}
    >
      {/* View Settings */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: layout.isMobile ? 'column' : 'row',
          flexWrap: 'wrap', 
          gap: layout.getSpacing(2, 2, 3)
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewSettings.compactMode}
                onChange={() => handleViewSettingChange('compactMode')}
                size={layout.isMobile ? 'medium' : 'small'}
              />
            }
            label="Kompakt Görünüm"
            sx={{ 
              minHeight: layout.getTouchSizes().minTouchTarget,
              '& .MuiFormControlLabel-label': {
                fontSize: layout.isMobile ? '1rem' : '0.875rem'
              }
            }}
          />
          
          {reportType === 'comparison' && (
            <FormControlLabel
              control={
                <Switch
                  checked={viewSettings.showComparisons}
                  onChange={() => handleViewSettingChange('showComparisons')}
                  size={layout.isMobile ? 'medium' : 'small'}
                />
              }
              label="Karşılaştırmaları Göster"
              sx={{ 
                minHeight: layout.getTouchSizes().minTouchTarget,
                '& .MuiFormControlLabel-label': {
                  fontSize: layout.isMobile ? '1rem' : '0.875rem'
                }
              }}
            />
          )}
          
          <Tooltip title="Gelişmiş metrikleri ve hesaplamaları gösterir">
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvancedMetrics}
                  onChange={() => onViewModeChange && onViewModeChange('advancedMetrics')}
                  size={layout.isMobile ? 'medium' : 'small'}
                />
              }
              label="Gelişmiş Metrikler"
              sx={{ 
                minHeight: layout.getTouchSizes().minTouchTarget,
                '& .MuiFormControlLabel-label': {
                  fontSize: layout.isMobile ? '1rem' : '0.875rem'
                }
              }}
            />
          </Tooltip>

          {/* Mobile-specific settings */}
          {layout.isMobile && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={viewSettings.useVirtualization}
                    onChange={() => handleViewSettingChange('useVirtualization')}
                    size="medium"
                  />
                }
                label="Sanal Kaydırma"
                sx={{ 
                  minHeight: layout.getTouchSizes().minTouchTarget,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '1rem'
                  }
                }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={viewSettings.usePagination}
                    onChange={() => handleViewSettingChange('usePagination')}
                    size="medium"
                  />
                }
                label="Sayfalama"
                sx={{ 
                  minHeight: layout.getTouchSizes().minTouchTarget,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '1rem'
                  }
                }}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Content Sections */}
      {renderSummarySection()}
      {renderChartsSection()}
      {reportType !== 'summary' && renderDetailsTable()}
      {renderInsightsSection()}
    </SwipeableCard>
  );
};

export default memo(ReportContentDisplay);