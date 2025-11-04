import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TableChart,
  Download,
  Settings,
  Close,
  CheckCircle,
  Error,
  Info,
  Description,
  Assessment,
  TrendingUp,
  Category,
  Dashboard,
} from '@mui/icons-material';
import ExcelGenerator from '../../services/excelGenerator';
import { useNotification } from '../../contexts/NotificationContext';

const ExcelExportButton = ({ 
  reportData, 
  disabled = false, 
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  showAdvancedOptions = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useNotification();

  // State management
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'preparing', 'generating', 'complete', 'error'
  const [exportError, setExportError] = useState('');

  // Export options
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [useAdvancedFormatting, setUseAdvancedFormatting] = useState(true);
  const [fileName, setFileName] = useState('');
  const [optimizeFileSize, setOptimizeFileSize] = useState(false);

  // Excel generator
  const [excelGenerator] = useState(new ExcelGenerator());

  // Export presets
  const exportPresets = [
    {
      key: 'quick',
      name: 'Hızlı Export',
      description: 'Temel veriler, hızlı indirme',
      icon: <Download />,
      options: {
        includeTransactions: false,
        includeMetrics: true,
        includeTrends: false,
        useAdvancedFormatting: false,
        optimizeFileSize: true
      }
    },
    {
      key: 'standard',
      name: 'Standart Export',
      description: 'Tüm veriler, orta kalite',
      icon: <TableChart />,
      options: {
        includeTransactions: true,
        includeMetrics: true,
        includeTrends: true,
        useAdvancedFormatting: true,
        optimizeFileSize: false
      }
    },
    {
      key: 'comprehensive',
      name: 'Kapsamlı Export',
      description: 'Tüm veriler, en yüksek kalite',
      icon: <Assessment />,
      options: {
        includeTransactions: true,
        includeMetrics: true,
        includeTrends: true,
        useAdvancedFormatting: true,
        optimizeFileSize: false
      }
    }
  ];

  // Handle menu open/close
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle dialog open/close
  const handleDialogOpen = () => {
    setDialogOpen(true);
    setAnchorEl(null);
    resetExportState();
  };

  const handleDialogClose = () => {
    if (!exporting) {
      setDialogOpen(false);
      resetExportState();
    }
  };

  // Reset export state
  const resetExportState = () => {
    setExporting(false);
    setExportProgress(0);
    setExportStatus('idle');
    setExportError('');
  };

  // Generate default filename
  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const type = useAdvancedFormatting ? 'gelismis' : 'temel';
    return `finansal-rapor-${type}-${date}.xlsx`;
  };

  // Apply preset options
  const applyPreset = (preset) => {
    setIncludeTransactions(preset.options.includeTransactions);
    setIncludeMetrics(preset.options.includeMetrics);
    setIncludeTrends(preset.options.includeTrends);
    setUseAdvancedFormatting(preset.options.useAdvancedFormatting);
    setOptimizeFileSize(preset.options.optimizeFileSize);
  };

  // Quick export with preset
  const handleQuickExport = async (presetKey = 'standard') => {
    if (!reportData) {
      showError('Rapor verileri mevcut değil');
      return;
    }

    const preset = exportPresets.find(p => p.key === presetKey);
    if (preset) {
      applyPreset(preset);
    }

    try {
      setExporting(true);
      setExportStatus('generating');

      const options = {
        includeTransactions: preset?.options.includeTransactions ?? includeTransactions,
        includeMetrics: preset?.options.includeMetrics ?? includeMetrics,
        includeTrends: preset?.options.includeTrends ?? includeTrends,
        useAdvancedFormatting: preset?.options.useAdvancedFormatting ?? useAdvancedFormatting,
        fileName: fileName || generateFileName()
      };

      const workbook = await excelGenerator.generateReport(reportData, options);
      const filename = fileName || generateFileName();
      
      await excelGenerator.saveAsFile(filename);
      
      setExportStatus('complete');
      showSuccess('Excel raporu başarıyla oluşturuldu');
      
      setTimeout(() => {
        setExporting(false);
        setExportStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Excel export error:', error);
      setExportStatus('error');
      setExportError(error.message || 'Excel oluşturulurken hata oluştu');
      showError('Excel oluşturulurken hata oluştu');
      
      setTimeout(() => {
        setExporting(false);
        setExportStatus('idle');
      }, 3000);
    }
  };

  // Advanced export with progress tracking
  const handleAdvancedExport = async () => {
    if (!reportData) {
      showError('Rapor verileri mevcut değil');
      return;
    }

    try {
      setExporting(true);
      setExportStatus('preparing');
      setExportProgress(10);

      // Simulate preparation phase
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      setExportStatus('generating');
      setExportProgress(50);

      const options = {
        includeTransactions,
        includeMetrics,
        includeTrends,
        useAdvancedFormatting,
        fileName: fileName || generateFileName()
      };

      setExportProgress(70);

      const workbook = await excelGenerator.generateReport(reportData, options);
      
      setExportProgress(90);

      const filename = fileName || generateFileName();
      await excelGenerator.saveAsFile(filename);
      
      setExportProgress(100);
      setExportStatus('complete');
      showSuccess('Excel raporu başarıyla oluşturuldu');
      
      setTimeout(() => {
        handleDialogClose();
      }, 2000);

    } catch (error) {
      console.error('Excel export error:', error);
      setExportStatus('error');
      setExportError(error.message || 'Excel oluşturulurken hata oluştu');
      showError('Excel oluşturulurken hata oluştu');
    }
  };

  // Calculate estimated file size
  const getEstimatedFileSize = () => {
    let size = 50; // Base size in KB
    
    if (includeTransactions) size += 100;
    if (includeMetrics) size += 30;
    if (includeTrends) size += 50;
    if (useAdvancedFormatting) size += 20;
    
    if (reportData?.categoryAnalysis) {
      size += reportData.categoryAnalysis.length * 2;
    }
    
    return optimizeFileSize ? Math.round(size * 0.7) : size;
  };

  // Render export status
  const renderExportStatus = () => {
    switch (exportStatus) {
      case 'preparing':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="info" />
            <Typography variant="body2">Veriler hazırlanıyor...</Typography>
          </Box>
        );
      case 'generating':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            <Typography variant="body2">Excel dosyası oluşturuluyor...</Typography>
          </Box>
        );
      case 'complete':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="body2" color="success.main">
              Excel başarıyla oluşturuldu!
            </Typography>
          </Box>
        );
      case 'error':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Error color="error" />
            <Typography variant="body2" color="error.main">
              Hata oluştu
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Main Export Button */}
      {showAdvancedOptions ? (
        <>
          <Button
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            startIcon={exporting ? null : <TableChart />}
            onClick={handleMenuOpen}
            disabled={disabled || exporting || !reportData}
            sx={{ minWidth: isMobile ? 'auto' : 120 }}
          >
            {exporting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={exportProgress} 
                  sx={{ width: 60, height: 4 }}
                />
                {!isMobile && `${exportProgress}%`}
              </Box>
            ) : (
              isMobile ? 'Excel' : 'Excel İndir'
            )}
          </Button>

          {/* Preset Selection Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { minWidth: 280 }
            }}
          >
            {exportPresets.map((preset) => (
              <MenuItem 
                key={preset.key} 
                onClick={() => {
                  handleQuickExport(preset.key);
                  handleMenuClose();
                }}
                disabled={exporting}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {preset.icon}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      {preset.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {preset.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleDialogOpen} disabled={exporting}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Settings />
                <Typography variant="subtitle2">
                  Gelişmiş Seçenekler
                </Typography>
              </Box>
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          startIcon={exporting ? null : <TableChart />}
          onClick={() => handleQuickExport()}
          disabled={disabled || exporting || !reportData}
        >
          {exporting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={exportProgress} 
                sx={{ width: 60, height: 4 }}
              />
              {!isMobile && `${exportProgress}%`}
            </Box>
          ) : (
            isMobile ? 'Excel' : 'Excel İndir'
          )}
        </Button>
      )}

      {/* Advanced Export Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Excel Export Seçenekleri</Typography>
          <IconButton onClick={handleDialogClose} disabled={exporting}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Export Presets */}
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Hızlı Seçenekler:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            {exportPresets.map((preset) => (
              <Chip
                key={preset.key}
                icon={preset.icon}
                label={preset.name}
                onClick={() => applyPreset(preset)}
                disabled={exporting}
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* File Name */}
          <TextField
            fullWidth
            label="Dosya Adı (İsteğe Bağlı)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={exporting}
            sx={{ mb: 3 }}
            placeholder={generateFileName()}
            helperText="Dosya uzantısı (.xlsx) otomatik olarak eklenecektir"
          />

          {/* Export Options */}
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            İçerik Seçenekleri:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard ve Özet" 
                secondary="Her zaman dahil edilir"
              />
              <Chip label="Zorunlu" size="small" color="primary" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Category />
              </ListItemIcon>
              <ListItemText 
                primary="Kategori Analizi" 
                secondary="Detaylı kategori bazlı harcama analizi"
              />
              <Chip label="Dahil" size="small" color="success" />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Description />
              </ListItemIcon>
              <ListItemText 
                primary="İşlem Detayları" 
                secondary="Tüm işlemlerin detaylı listesi"
              />
              <Switch
                checked={includeTransactions}
                onChange={(e) => setIncludeTransactions(e.target.checked)}
                disabled={exporting}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Assessment />
              </ListItemIcon>
              <ListItemText 
                primary="Finansal Metrikler" 
                secondary="Detaylı finansal performans metrikleri"
              />
              <Switch
                checked={includeMetrics}
                onChange={(e) => setIncludeMetrics(e.target.checked)}
                disabled={exporting}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <TrendingUp />
              </ListItemIcon>
              <ListItemText 
                primary="Trend Analizi" 
                secondary="Aylık trend analizleri ve projeksiyonlar"
              />
              <Switch
                checked={includeTrends}
                onChange={(e) => setIncludeTrends(e.target.checked)}
                disabled={exporting}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          {/* Format Options */}
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Format Seçenekleri:
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={useAdvancedFormatting}
                onChange={(e) => setUseAdvancedFormatting(e.target.checked)}
                disabled={exporting}
              />
            }
            label="Gelişmiş Formatlamalar (Renkler, formüller, koşullu formatlamalar)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={optimizeFileSize}
                onChange={(e) => setOptimizeFileSize(e.target.checked)}
                disabled={exporting}
              />
            }
            label="Dosya Boyutunu Optimize Et (Daha hızlı indirme)"
          />

          {/* File Size Estimate */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Tahmini Dosya Boyutu:</strong> ~{getEstimatedFileSize()} KB
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Gerçek boyut veri miktarına göre değişebilir
            </Typography>
          </Box>

          {/* Export Progress */}
          {exporting && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">İlerleme</Typography>
                <Typography variant="body2">{exportProgress}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={exportProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box sx={{ mt: 1 }}>
                {renderExportStatus()}
              </Box>
            </Box>
          )}

          {/* Error Display */}
          {exportError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {exportError}
            </Alert>
          )}

          {/* Success Message */}
          {exportStatus === 'complete' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Excel raporu başarıyla oluşturuldu ve indirildi!
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleDialogClose} 
            disabled={exporting}
          >
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAdvancedExport}
            disabled={exporting || !reportData}
            startIcon={exporting ? null : <Download />}
          >
            {exporting ? 'Oluşturuluyor...' : 'Excel Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExcelExportButton;