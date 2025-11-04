import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  DragIndicator,
  Settings,
  Visibility,
  VisibilityOff,
  Add,
  GridView,
  ViewModule,
  Fullscreen,
  Refresh,
  Close,
  Save,
  RestoreFromTrash,
  Palette,
  Tune,
  Delete,
} from '@mui/icons-material';

// Import Widget Library
import WidgetLibrary from './WidgetLibrary';

// Widget types
const WIDGET_TYPES = {
  SUMMARY_CARDS: 'summary_cards',
  PAYMENT_CALENDAR: 'payment_calendar',
  EXPENSE_CHART: 'expense_chart',
  TREND_CHART: 'trend_chart',
  BUDGET_WIDGET: 'budget_widget',
  METRICS_WIDGET: 'metrics_widget',
  RECENT_TRANSACTIONS: 'recent_transactions',
  UPCOMING_PAYMENTS: 'upcoming_payments',
  FIXED_PAYMENTS: 'fixed_payments',
  NET_WORTH: 'net_worth',
  QUICK_ACTIONS: 'quick_actions',
};

// Widget configurations
const DEFAULT_WIDGETS = [
  {
    id: 'summary_cards',
    type: WIDGET_TYPES.SUMMARY_CARDS,
    title: 'Finansal Özet',
    size: { width: 12, height: 2 },
    position: { x: 0, y: 0 },
    visible: true,
    settings: {
      showIcons: true,
      compactView: false,
      colorScheme: 'default',
    },
  },
  {
    id: 'payment_calendar',
    type: WIDGET_TYPES.PAYMENT_CALENDAR,
    title: 'Ödeme Takvimi',
    size: { width: 4, height: 4 },
    position: { x: 0, y: 2 },
    visible: true,
    settings: {
      showWeekends: true,
      highlightToday: true,
      showOverdue: true,
    },
  },
  {
    id: 'expense_chart',
    type: WIDGET_TYPES.EXPENSE_CHART,
    title: 'Kategori Harcamaları',
    size: { width: 4, height: 4 },
    position: { x: 4, y: 2 },
    visible: true,
    settings: {
      chartType: 'pie',
      showLabels: true,
      animationEnabled: true,
    },
  },
  {
    id: 'trend_chart',
    type: WIDGET_TYPES.TREND_CHART,
    title: 'Finansal Trend',
    size: { width: 4, height: 4 },
    position: { x: 8, y: 2 },
    visible: true,
    settings: {
      timeRange: '6months',
      showGrid: true,
      smoothLines: true,
    },
  },
  {
    id: 'recent_transactions',
    type: WIDGET_TYPES.RECENT_TRANSACTIONS,
    title: 'Son İşlemler',
    size: { width: 6, height: 4 },
    position: { x: 0, y: 6 },
    visible: true,
    settings: {
      itemCount: 5,
      showCategories: true,
      showIcons: true,
    },
  },
  {
    id: 'upcoming_payments',
    type: WIDGET_TYPES.UPCOMING_PAYMENTS,
    title: 'Yaklaşan Ödemeler',
    size: { width: 6, height: 4 },
    position: { x: 6, y: 6 },
    visible: true,
    settings: {
      daysAhead: 7,
      showOverdue: true,
      sortBy: 'date',
    },
  },
];

// Draggable Widget Component
const DraggableWidget = ({ widget, children, onMove, onResize, onSettings, isEditMode }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'widget',
    item: { id: widget.id, type: widget.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isEditMode,
  });

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    onSettings(widget);
    handleMenuClose();
  };

  return (
    <div ref={dragPreview}>
      <Paper
        elevation={isDragging ? 8 : 2}
        sx={{
          height: '100%',
          position: 'relative',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s ease-in-out',
          border: isEditMode ? `2px dashed ${theme.palette.primary.main}` : 'none',
          '&:hover': {
            elevation: 4,
            transform: isEditMode ? 'scale(1.02)' : 'none',
          },
        }}
      >
        {/* Widget Header */}
        {isEditMode && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 40,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              zIndex: 10,
              borderRadius: '4px 4px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <div ref={drag} style={{ cursor: 'move', display: 'flex', alignItems: 'center' }}>
                <DragIndicator fontSize="small" />
              </div>
              <Typography variant="body2" fontWeight="bold">
                {widget.title}
              </Typography>
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ color: 'inherit' }}
              >
                <Settings fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Widget Content */}
        <Box
          sx={{
            height: '100%',
            pt: isEditMode ? 5 : 0,
            overflow: 'hidden',
          }}
        >
          {children}
        </Box>

        {/* Widget Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleSettings}>
            <Settings fontSize="small" sx={{ mr: 1 }} />
            Ayarlar
          </MenuItem>
          <MenuItem onClick={() => onMove(widget.id, 'up')}>
            <GridView fontSize="small" sx={{ mr: 1 }} />
            Yukarı Taşı
          </MenuItem>
          <MenuItem onClick={() => onMove(widget.id, 'down')}>
            <ViewModule fontSize="small" sx={{ mr: 1 }} />
            Aşağı Taşı
          </MenuItem>
        </Menu>
      </Paper>
    </div>
  );
};

// Drop Zone Component
const DropZone = ({ onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'widget',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;
      
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        minHeight: '100vh',
        backgroundColor: isOver && canDrop ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      {children}
    </div>
  );
};

// Widget Settings Dialog
const WidgetSettingsDialog = ({ widget, open, onClose, onSave }) => {
  const [settings, setSettings] = useState(widget?.settings || {});

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onSave(widget.id, settings);
    onClose();
  };

  if (!widget) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          {widget.title} Ayarları
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Common Settings */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.visible !== false}
                onChange={(e) => handleSettingChange('visible', e.target.checked)}
              />
            }
            label="Widget'ı Göster"
          />

          {/* Widget-specific settings */}
          {widget.type === WIDGET_TYPES.PAYMENT_CALENDAR && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showWeekends !== false}
                    onChange={(e) => handleSettingChange('showWeekends', e.target.checked)}
                  />
                }
                label="Hafta Sonlarını Göster"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.highlightToday !== false}
                    onChange={(e) => handleSettingChange('highlightToday', e.target.checked)}
                  />
                }
                label="Bugünü Vurgula"
              />
            </>
          )}

          {widget.type === WIDGET_TYPES.EXPENSE_CHART && (
            <>
              <FormControl fullWidth>
                <InputLabel>Grafik Türü</InputLabel>
                <Select
                  value={settings.chartType || 'pie'}
                  onChange={(e) => handleSettingChange('chartType', e.target.value)}
                  label="Grafik Türü"
                >
                  <MenuItem value="pie">Pasta Grafik</MenuItem>
                  <MenuItem value="bar">Çubuk Grafik</MenuItem>
                  <MenuItem value="doughnut">Halka Grafik</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showLabels !== false}
                    onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
                  />
                }
                label="Etiketleri Göster"
              />
            </>
          )}

          {widget.type === WIDGET_TYPES.RECENT_TRANSACTIONS && (
            <>
              <Box>
                <Typography gutterBottom>Gösterilecek İşlem Sayısı</Typography>
                <Slider
                  value={settings.itemCount || 5}
                  onChange={(e, value) => handleSettingChange('itemCount', value)}
                  min={3}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showCategories !== false}
                    onChange={(e) => handleSettingChange('showCategories', e.target.checked)}
                  />
                }
                label="Kategorileri Göster"
              />
            </>
          )}

          {widget.type === WIDGET_TYPES.TREND_CHART && (
            <FormControl fullWidth>
              <InputLabel>Zaman Aralığı</InputLabel>
              <Select
                value={settings.timeRange || '6months'}
                onChange={(e) => handleSettingChange('timeRange', e.target.value)}
                label="Zaman Aralığı"
              >
                <MenuItem value="3months">Son 3 Ay</MenuItem>
                <MenuItem value="6months">Son 6 Ay</MenuItem>
                <MenuItem value="1year">Son 1 Yıl</MenuItem>
                <MenuItem value="2years">Son 2 Yıl</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave}>
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Draggable Dashboard Component
const DraggableDashboard = ({ 
  children, 
  dashboardData, 
  onWidgetMove, 
  onWidgetSettings,
  onLayoutSave,
  onLayoutReset 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [widgetLibraryOpen, setWidgetLibraryOpen] = useState(false);

  // Detect touch device for backend selection
  const backend = useMemo(() => {
    return 'ontouchstart' in window ? TouchBackend : HTML5Backend;
  }, []);

  const backendOptions = useMemo(() => {
    return backend === TouchBackend ? { enableMouseEvents: true } : {};
  }, [backend]);

  const handleDrop = useCallback((item) => {
    // Handle widget drop logic
    console.log('Widget dropped:', item);
  }, []);

  const handleWidgetMove = useCallback((widgetId, direction) => {
    setWidgets(prev => {
      const newWidgets = [...prev];
      const widgetIndex = newWidgets.findIndex(w => w.id === widgetId);
      
      if (widgetIndex === -1) return prev;
      
      const widget = newWidgets[widgetIndex];
      const newPosition = { ...widget.position };
      
      switch (direction) {
        case 'up':
          newPosition.y = Math.max(0, newPosition.y - 1);
          break;
        case 'down':
          newPosition.y += 1;
          break;
        case 'left':
          newPosition.x = Math.max(0, newPosition.x - 1);
          break;
        case 'right':
          newPosition.x = Math.min(8, newPosition.x + 1);
          break;
        default:
          break;
      }
      
      newWidgets[widgetIndex] = { ...widget, position: newPosition };
      return newWidgets;
    });
  }, []);

  const handleWidgetSettings = useCallback((widget) => {
    setSelectedWidget(widget);
    setSettingsOpen(true);
  }, []);

  const handleSettingsSave = useCallback((widgetId, newSettings) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, settings: { ...widget.settings, ...newSettings } }
          : widget
      )
    );
  }, []);

  const handleLayoutSave = useCallback(() => {
    localStorage.setItem('dashboard_layout', JSON.stringify(widgets));
    onLayoutSave?.(widgets);
    setIsEditMode(false);
  }, [widgets, onLayoutSave]);

  const handleLayoutReset = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem('dashboard_layout');
    onLayoutReset?.();
  }, [onLayoutReset]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  // Load saved layout on mount
  React.useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard_layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setWidgets(parsedLayout);
      } catch (error) {
        console.error('Error loading saved layout:', error);
      }
    }
  }, []);

  // Render widgets in grid
  const renderWidgets = () => {
    return widgets
      .filter(widget => widget.visible !== false)
      .map(widget => (
        <Grid
          item
          xs={12}
          sm={widget.size.width <= 6 ? widget.size.width * 2 : 12}
          md={widget.size.width}
          key={widget.id}
        >
          <DraggableWidget
            widget={widget}
            onMove={handleWidgetMove}
            onSettings={handleWidgetSettings}
            isEditMode={isEditMode}
          >
            {children?.[widget.type] || (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  {widget.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Widget içeriği yükleniyor...
                </Typography>
              </Box>
            )}
          </DraggableWidget>
        </Grid>
      ));
  };

  return (
    <DndProvider backend={backend} options={backendOptions}>
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        {/* Edit Mode Header */}
        {isEditMode && (
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1300,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Palette />
                <Typography variant="h6">Dashboard Düzenleme Modu</Typography>
                <Chip
                  label="Widget'ları sürükleyip bırakın"
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLayoutReset}
                  sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }}
                  startIcon={<RestoreFromTrash />}
                >
                  Sıfırla
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleLayoutSave}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                  startIcon={<Save />}
                >
                  Kaydet
                </Button>
                <IconButton
                  onClick={toggleEditMode}
                  sx={{ color: 'inherit' }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Dashboard Content */}
        <DropZone onDrop={handleDrop}>
          <Box sx={{ pt: isEditMode ? 10 : 0 }}>
            <Grid container spacing={3}>
              {renderWidgets()}
            </Grid>
          </Box>
        </DropZone>

        {/* Floating Action Button */}
        {!isMobile && (
          <SpeedDial
            ariaLabel="Dashboard Actions"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            icon={<SpeedDialIcon />}
            open={speedDialOpen}
            onOpen={() => setSpeedDialOpen(true)}
            onClose={() => setSpeedDialOpen(false)}
          >
            <SpeedDialAction
              icon={isEditMode ? <Close /> : <Tune />}
              tooltipTitle={isEditMode ? 'Düzenlemeyi Bitir' : 'Dashboard Düzenle'}
              onClick={toggleEditMode}
            />
            <SpeedDialAction
              icon={<Save />}
              tooltipTitle="Layout Kaydet"
              onClick={handleLayoutSave}
            />
            <SpeedDialAction
              icon={<RestoreFromTrash />}
              tooltipTitle="Varsayılana Sıfırla"
              onClick={handleLayoutReset}
            />
          </SpeedDial>
        )}

        {/* Mobile Edit Button */}
        {isMobile && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={toggleEditMode}
          >
            {isEditMode ? <Close /> : <Tune />}
          </Fab>
        )}

        {/* Widget Settings Dialog */}
        <WidgetSettingsDialog
          widget={selectedWidget}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSave}
        />
      </Box>
    </DndProvider>
  );
};

export default DraggableDashboard;