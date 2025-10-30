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
  onViewModeChange 
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
    showTables: true,
    showInsights: true,
    showComparisons: reportType === 'comparison',
    compactMode: compactView
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
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Özet Grafikler" icon={<PieChart />} />
            {reportType !== 'summary' && (
              <Tab label="Kategori Analizi" icon={<BarChart />} />
            )}
            {reportType === 'comparison' && (
              <Tab label="Trend Analizi" icon={<TrendingUp />} />
            )}
          </Tabs>
          
          {activeTab === 0 && (
            <LazyWrapper minHeight="300px">
              <SummaryCharts
                data={reportData}
                loading={loading}
                error={error}
                showIncomeExpensePie={true}
                showTrendLine={true}
                showMonthlyComparison={reportType !== 'summary'}
                compactView={viewSettings.compactMode}
              />
            </LazyWrapper>
          )}
          
          {activeTab === 1 && reportType !== 'summary' && (
            <LazyWrapper minHeight="400px">
              <CategoryAnalysisCharts
                data={reportData}
                loading={loading}
                error={error}
                showBarChart={true}
                showPieChart={true}
                showTable={viewSettings.showTables}
                showRadialChart={reportType === 'comparison'}
                maxCategories={reportType === 'detailed' ? 8 : 12}
                compactView={viewSettings.compactMode}
              />
            </LazyWrapper>
          )}
          
          {activeTab === 2 && reportType === 'comparison' && (
            <LazyWrapper minHeight="350px">
              <TrendAnalysisCharts
                data={reportData}
                loading={loading}
                error={error}
                showTimeBasedTrend={true}
                showComparison={viewSettings.showComparisons}
                showGrowthAnalysis={true}
                showSeasonalAnalysis={false}
                compactView={viewSettings.compactMode}
              />
            </LazyWrapper>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );

  const renderDetailsTable = () => (
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
            <IconButton onClick={() => handleSectionToggle('details')}>
              {expandedSections.details ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expandedSections.details && viewSettings.showTables}>
          <TableContainer component={Paper} variant="outlined">
            <Table size={viewSettings.compactMode ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Kategori</TableCell>
                  <TableCell align="right">Tutar</TableCell>
                  <TableCell align="right">Oran</TableCell>
                  <TableCell align="center">Trend</TableCell>
                  <TableCell align="right">İşlem Sayısı</TableCell>
                  {showAdvancedMetrics && (
                    <TableCell align="right">Verimlilik</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {processedData.categories.map((category, index) => (
                  <TableRow key={index} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {category.category}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(category.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`%${category.percentage.toFixed(1)}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={
                          category.trend === 'up' ? '↗ Artış' : 
                          category.trend === 'down' ? '↘ Azalış' : '→ Sabit'
                        }
                        size="small"
                        color={
                          category.trend === 'up' ? 'error' : 
                          category.trend === 'down' ? 'success' : 'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {category.transactionCount || 0}
                      </Typography>
                    </TableCell>
                    {showAdvancedMetrics && (
                      <TableCell align="right">
                        {category.efficiency !== null ? (
                          <Chip 
                            label={`%${category.efficiency.toFixed(1)}`}
                            size="small"
                            color={category.efficiency > 0 ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </CardContent>
    </Card>
  );

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
    <Box>
      {/* View Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Görünüm Ayarları
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewSettings.compactMode}
                  onChange={() => handleViewSettingChange('compactMode')}
                />
              }
              label="Kompakt Görünüm"
            />
            {reportType === 'comparison' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={viewSettings.showComparisons}
                    onChange={() => handleViewSettingChange('showComparisons')}
                  />
                }
                label="Karşılaştırmaları Göster"
              />
            )}
            <Tooltip title="Gelişmiş metrikleri ve hesaplamaları gösterir">
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvancedMetrics}
                    onChange={() => onViewModeChange && onViewModeChange('advancedMetrics')}
                  />
                }
                label="Gelişmiş Metrikler"
              />
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Content Sections */}
      {renderSummarySection()}
      {renderChartsSection()}
      {reportType !== 'summary' && renderDetailsTable()}
      {renderInsightsSection()}
    </Box>
  );
};

export default memo(ReportContentDisplay);