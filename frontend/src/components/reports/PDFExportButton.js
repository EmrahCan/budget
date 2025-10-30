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
} from '@mui/material';
import {
  PictureAsPdf,
  Download,
  Settings,
  Close,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import PDFTemplateEngine, { PDF_TEMPLATES } from '../../services/pdfTemplates';
import { useNotification } from '../../contexts/NotificationContext';

const PDFExportButton = ({ 
  reportData, 
  disabled = false, 
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  showTemplateSelector = true,
  defaultTemplate = 'standard'
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
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [fileName, setFileName] = useState('');

  // Template engine
  const [templateEngine] = useState(new PDFTemplateEngine());

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
    const template = PDF_TEMPLATES[selectedTemplate];
    const date = new Date().toISOString().split('T')[0];
    const templateName = template.name.toLowerCase().replace(/\s+/g, '-');
    return `${templateName}-${date}.pdf`;
  };

  // Quick export without dialog
  const handleQuickExport = async (templateType = selectedTemplate) => {
    if (!reportData) {
      showError('Rapor verileri mevcut değil');
      return;
    }

    try {
      setExporting(true);
      setExportStatus('generating');

      const options = {
        title: customTitle || getDefaultTitle(templateType),
        subtitle: customSubtitle || getDefaultSubtitle(),
        includeCharts,
        includeDetails,
        template: templateType
      };

      const pdf = await templateEngine.generateReport(reportData, templateType, options);
      const filename = fileName || generateFileName();
      
      pdf.save(filename);
      
      setExportStatus('complete');
      showSuccess('PDF raporu başarıyla oluşturuldu');
      
      setTimeout(() => {
        setExporting(false);
        setExportStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('PDF export error:', error);
      setExportStatus('error');
      setExportError(error.message || 'PDF oluşturulurken hata oluştu');
      showError('PDF oluşturulurken hata oluştu');
      
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
        title: customTitle || getDefaultTitle(selectedTemplate),
        subtitle: customSubtitle || getDefaultSubtitle(),
        includeCharts,
        includeDetails,
        template: selectedTemplate
      };

      setExportProgress(70);

      const pdf = await templateEngine.generateReport(reportData, selectedTemplate, options);
      
      setExportProgress(90);

      const filename = fileName || generateFileName();
      pdf.save(filename);
      
      setExportProgress(100);
      setExportStatus('complete');
      showSuccess('PDF raporu başarıyla oluşturuldu');
      
      setTimeout(() => {
        handleDialogClose();
      }, 2000);

    } catch (error) {
      console.error('PDF export error:', error);
      setExportStatus('error');
      setExportError(error.message || 'PDF oluşturulurken hata oluştu');
      showError('PDF oluşturulurken hata oluştu');
    }
  };

  // Get default title based on template
  const getDefaultTitle = (templateType) => {
    const template = PDF_TEMPLATES[templateType];
    return template ? template.name : 'Finansal Rapor';
  };

  // Get default subtitle
  const getDefaultSubtitle = () => {
    if (reportData?.summary?.period) {
      const start = new Date(reportData.summary.period.start).toLocaleDateString('tr-TR');
      const end = new Date(reportData.summary.period.end).toLocaleDateString('tr-TR');
      return `Dönem: ${start} - ${end}`;
    }
    return `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
  };

  // Render export status
  const renderExportStatus = () => {
    switch (exportStatus) {
      case 'preparing':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="info" />
            <Typography variant="body2">Rapor hazırlanıyor...</Typography>
          </Box>
        );
      case 'generating':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            <Typography variant="body2">PDF oluşturuluyor...</Typography>
          </Box>
        );
      case 'complete':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="body2" color="success.main">
              PDF başarıyla oluşturuldu!
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
      {showTemplateSelector ? (
        <>
          <Button
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            startIcon={exporting ? null : <PictureAsPdf />}
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
              isMobile ? 'PDF' : 'PDF İndir'
            )}
          </Button>

          {/* Template Selection Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { minWidth: 250 }
            }}
          >
            {Object.entries(PDF_TEMPLATES).map(([key, template]) => (
              <MenuItem 
                key={key} 
                onClick={() => {
                  setSelectedTemplate(key);
                  handleQuickExport(key);
                  handleMenuClose();
                }}
                disabled={exporting}
              >
                <Box>
                  <Typography variant="subtitle2">
                    {template.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {template.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <MenuItem onClick={handleDialogOpen} disabled={exporting}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings fontSize="small" />
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
          startIcon={exporting ? null : <PictureAsPdf />}
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
            isMobile ? 'PDF' : 'PDF İndir'
          )}
        </Button>
      )}

      {/* Advanced Export Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">PDF Export Seçenekleri</Typography>
          <IconButton onClick={handleDialogClose} disabled={exporting}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Template Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Rapor Şablonu</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              label="Rapor Şablonu"
              disabled={exporting}
            >
              {Object.entries(PDF_TEMPLATES).map(([key, template]) => (
                <MenuItem key={key} value={key}>
                  <Box>
                    <Typography variant="body1">{template.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {template.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Template Info */}
          {selectedTemplate && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Şablon Özellikleri:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={PDF_TEMPLATES[selectedTemplate].layout === 'landscape' ? 'Yatay' : 'Dikey'} 
                  size="small" 
                  variant="outlined"
                />
                {PDF_TEMPLATES[selectedTemplate].includeCharts && (
                  <Chip label="Grafikler" size="small" variant="outlined" color="primary" />
                )}
                {PDF_TEMPLATES[selectedTemplate].includeDetails && (
                  <Chip label="Detaylar" size="small" variant="outlined" color="secondary" />
                )}
              </Box>
            </Box>
          )}

          {/* Custom Title */}
          <TextField
            fullWidth
            label="Özel Başlık (İsteğe Bağlı)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            disabled={exporting}
            sx={{ mb: 2 }}
            placeholder={getDefaultTitle(selectedTemplate)}
          />

          {/* Custom Subtitle */}
          <TextField
            fullWidth
            label="Özel Alt Başlık (İsteğe Bağlı)"
            value={customSubtitle}
            onChange={(e) => setCustomSubtitle(e.target.value)}
            disabled={exporting}
            sx={{ mb: 2 }}
            placeholder={getDefaultSubtitle()}
          />

          {/* File Name */}
          <TextField
            fullWidth
            label="Dosya Adı (İsteğe Bağlı)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={exporting}
            sx={{ mb: 3 }}
            placeholder={generateFileName()}
            helperText="Dosya uzantısı (.pdf) otomatik olarak eklenecektir"
          />

          {/* Export Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Export Seçenekleri:
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  disabled={exporting}
                />
              }
              label="Grafikleri Dahil Et"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  disabled={exporting}
                />
              }
              label="Detaylı Analizleri Dahil Et"
            />
          </Box>

          {/* Export Progress */}
          {exporting && (
            <Box sx={{ mb: 3 }}>
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
            <Alert severity="error" sx={{ mb: 2 }}>
              {exportError}
            </Alert>
          )}

          {/* Success Message */}
          {exportStatus === 'complete' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              PDF raporu başarıyla oluşturuldu ve indirildi!
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
            {exporting ? 'Oluşturuluyor...' : 'PDF Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PDFExportButton;