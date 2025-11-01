import React, { useState } from 'react';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  FileDownload,
  PictureAsPdf,
  TableChart,
  Share,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';

const MobileExportButton = ({
  reportData,
  reportType,
  onPDFExport,
  onExcelExport,
  onShare,
  disabled = false,
  loading = false,
  position = { bottom: 16, right: 16 },
  touchSupport = false,
  mobileConfig = {},
  hapticFeedback = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Haptic feedback helper
  const triggerHapticFeedback = (intensity = 10) => {
    if (hapticFeedback && touchSupport && navigator.vibrate) {
      navigator.vibrate(intensity);
    }
  };
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'exporting', 'success', 'error'
  const [exportError, setExportError] = useState(null);

  const handleSpeedDialToggle = () => {
    triggerHapticFeedback(10);
    setSpeedDialOpen(!speedDialOpen);
  };

  const handleSpeedDialClose = () => {
    setSpeedDialOpen(false);
  };

  const handleExportClick = (type) => {
    triggerHapticFeedback(15); // Stronger feedback for important actions
    setExportType(type);
    setExportDialogOpen(true);
    setSpeedDialOpen(false);
    setExportStatus('idle');
    setExportProgress(0);
    setExportError(null);
  };

  const handleExportConfirm = async () => {
    setExportStatus('exporting');
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let result;
      if (exportType === 'pdf') {
        result = await onPDFExport();
      } else if (exportType === 'excel') {
        result = await onExcelExport();
      }

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('success');

      // Auto close after success
      setTimeout(() => {
        setExportDialogOpen(false);
        setExportStatus('idle');
      }, 2000);

    } catch (error) {
      setExportStatus('error');
      setExportError(error.message || 'Export işlemi başarısız oldu');
      setExportProgress(0);
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    }
    setSpeedDialOpen(false);
  };

  const handleDialogClose = () => {
    if (exportStatus !== 'exporting') {
      setExportDialogOpen(false);
      setExportStatus('idle');
    }
  };

  const getExportTitle = () => {
    switch (exportType) {
      case 'pdf':
        return 'PDF Raporu Oluştur';
      case 'excel':
        return 'Excel Raporu Oluştur';
      default:
        return 'Rapor Oluştur';
    }
  };

  const getExportDescription = () => {
    const typeText = reportType === 'summary' ? 'Özet' : 
                    reportType === 'detailed' ? 'Detaylı' : 'Karşılaştırmalı';
    
    switch (exportType) {
      case 'pdf':
        return `${typeText} rapor PDF formatında oluşturulacak. Bu işlem birkaç saniye sürebilir.`;
      case 'excel':
        return `${typeText} rapor Excel formatında oluşturulacak. Veriler çoklu sayfalarda organize edilecek.`;
      default:
        return 'Rapor oluşturulacak.';
    }
  };

  const speedDialActions = [
    {
      icon: <PictureAsPdf />,
      name: 'PDF',
      onClick: () => handleExportClick('pdf'),
      disabled: !reportData || disabled
    },
    {
      icon: <TableChart />,
      name: 'Excel',
      onClick: () => handleExportClick('excel'),
      disabled: !reportData || disabled
    },
    {
      icon: <Share />,
      name: 'Paylaş',
      onClick: handleShareClick,
      disabled: !reportData || disabled
    }
  ];

  if (!isMobile) {
    // Return regular buttons for desktop
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={() => handleExportClick('pdf')}
          disabled={!reportData || disabled || loading}
          size="small"
        >
          PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableChart />}
          onClick={() => handleExportClick('excel')}
          disabled={!reportData || disabled || loading}
          size="small"
        >
          Excel
        </Button>
        <Button
          variant="outlined"
          startIcon={<Share />}
          onClick={handleShareClick}
          disabled={!reportData || disabled}
          size="small"
        >
          Paylaş
        </Button>
      </Box>
    );
  }

  return (
    <>
      <SpeedDial
        ariaLabel="Export options"
        sx={{ 
          position: 'fixed', 
          ...position,
          '& .MuiFab-root': {
            minHeight: touchSupport ? (mobileConfig.minTouchTarget || 56) : 56,
            minWidth: touchSupport ? (mobileConfig.minTouchTarget || 56) : 56
          }
        }}
        icon={<SpeedDialIcon icon={<FileDownload />} openIcon={<Close />} />}
        onClose={handleSpeedDialClose}
        onOpen={handleSpeedDialToggle}
        open={speedDialOpen}
        direction="up"
        disabled={disabled || loading}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
            disabled={action.disabled}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                minHeight: touchSupport ? (mobileConfig.minTouchTarget || 48) : 48,
                minWidth: touchSupport ? (mobileConfig.minTouchTarget || 48) : 48
              }
            }}
          />
        ))}
      </SpeedDial>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {exportType === 'pdf' ? <PictureAsPdf color="primary" /> : <TableChart color="primary" />}
            <Typography variant="h6">
              {getExportTitle()}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {exportStatus === 'idle' && (
            <>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {getExportDescription()}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`${reportType === 'summary' ? 'Özet' : 
                          reportType === 'detailed' ? 'Detaylı' : 'Karşılaştırmalı'} Rapor`}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={exportType === 'pdf' ? 'PDF Format' : 'Excel Format'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {exportType === 'pdf' ? 
                    'PDF dosyası grafikler ve görsel öğeler ile oluşturulacak.' :
                    'Excel dosyası çoklu sayfa ve formüller ile oluşturulacak.'
                  }
                </Typography>
              </Alert>
            </>
          )}

          {exportStatus === 'exporting' && (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Rapor oluşturuluyor...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={exportProgress} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                %{exportProgress} tamamlandı
              </Typography>
            </Box>
          )}

          {exportStatus === 'success' && (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                Başarılı!
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Rapor başarıyla oluşturuldu ve indirildi.
              </Typography>
            </Box>
          )}

          {exportStatus === 'error' && (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" color="error.main" sx={{ mb: 1 }}>
                Hata Oluştu
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {exportError}
              </Typography>
              <Alert severity="error">
                <Typography variant="body2">
                  Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {exportStatus === 'idle' && (
            <>
              <Button onClick={handleDialogClose} disabled={exportStatus === 'exporting'}>
                İptal
              </Button>
              <Button 
                onClick={handleExportConfirm} 
                variant="contained"
                disabled={!reportData}
                startIcon={exportType === 'pdf' ? <PictureAsPdf /> : <TableChart />}
              >
                Oluştur
              </Button>
            </>
          )}

          {exportStatus === 'exporting' && (
            <Button disabled>
              Oluşturuluyor...
            </Button>
          )}

          {(exportStatus === 'success' || exportStatus === 'error') && (
            <Button onClick={handleDialogClose} variant="contained">
              Tamam
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MobileExportButton;