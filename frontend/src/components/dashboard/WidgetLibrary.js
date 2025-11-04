import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  TrendingUp,
  Receipt,
  CalendarToday,
  PieChart,
  Timeline,
  Assessment,
  Speed,
  Add,
  Close,
} from '@mui/icons-material';

// Available widget types with metadata
const AVAILABLE_WIDGETS = [
  {
    id: 'summary_cards',
    type: 'summary_cards',
    title: 'Finansal Özet Kartları',
    description: 'Toplam bakiye, borç, gelir ve gider kartları',
    icon: <AccountBalance />,
    category: 'Özet',
    size: { width: 12, height: 2 },
    color: 'primary',
    popular: true,
  },
  {
    id: 'payment_calendar',
    type: 'payment_calendar',
    title: 'Ödeme Takvimi',
    description: 'Aylık ödeme takvimi görünümü',
    icon: <CalendarToday />,
    category: 'Takvim',
    size: { width: 6, height: 4 },
    color: 'info',
    popular: true,
  },
  {
    id: 'expense_chart',
    type: 'expense_chart',
    title: 'Kategori Harcamaları',
    description: 'Harcamaların kategori bazında grafiği',
    icon: <PieChart />,
    category: 'Grafik',
    size: { width: 6, height: 4 },
    color: 'warning',
    popular: true,
  },
  {
    id: 'trend_chart',
    type: 'trend_chart',
    title: 'Finansal Trend',
    description: 'Gelir-gider trend analizi',
    icon: <Timeline />,
    category: 'Grafik',
    size: { width: 8, height: 4 },
    color: 'success',
    popular: false,
  },
  {
    id: 'recent_transactions',
    type: 'recent_transactions',
    title: 'Son İşlemler',
    description: 'En son yapılan finansal işlemler',
    icon: <Receipt />,
    category: 'Liste',
    size: { width: 6, height: 4 },
    color: 'secondary',
    popular: true,
  },
  {
    id: 'upcoming_payments',
    type: 'upcoming_payments',
    title: 'Yaklaşan Ödemeler',
    description: 'Yaklaşan kredi kartı ödemeleri',
    icon: <CreditCard />,
    category: 'Liste',
    size: { width: 6, height: 4 },
    color: 'error',
    popular: true,
  },
  {
    id: 'net_worth',
    type: 'net_worth',
    title: 'Net Değer',
    description: 'Toplam net değer ve aylık bakiye',
    icon: <TrendingUp />,
    category: 'Özet',
    size: { width: 4, height: 3 },
    color: 'success',
    popular: false,
  },
  {
    id: 'quick_actions',
    type: 'quick_actions',
    title: 'Hızlı İşlemler',
    description: 'Sık kullanılan işlem butonları',
    icon: <Speed />,
    category: 'Eylem',
    size: { width: 4, height: 3 },
    color: 'primary',
    popular: false,
  },
  {
    id: 'budget_widget',
    type: 'budget_widget',
    title: 'Bütçe Karşılaştırması',
    description: 'Bütçe hedefleri vs gerçek harcamalar',
    icon: <Assessment />,
    category: 'Grafik',
    size: { width: 6, height: 4 },
    color: 'info',
    popular: false,
  },
  {
    id: 'metrics_widget',
    type: 'metrics_widget',
    title: 'Finansal Metrikler',
    description: 'Detaylı finansal performans metrikleri',
    icon: <Assessment />,
    category: 'Analiz',
    size: { width: 4, height: 4 },
    color: 'secondary',
    popular: false,
  },
];

const WidgetLibrary = ({ open, onClose, onAddWidget, existingWidgets = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  
  // Get unique categories
  const categories = ['Tümü', ...new Set(AVAILABLE_WIDGETS.map(w => w.category))];
  
  // Filter widgets by category and exclude existing ones
  const filteredWidgets = AVAILABLE_WIDGETS.filter(widget => {
    const categoryMatch = selectedCategory === 'Tümü' || widget.category === selectedCategory;
    const notExists = !existingWidgets.some(existing => existing.type === widget.type);
    return categoryMatch && notExists;
  });

  const handleAddWidget = (widget) => {
    const newWidget = {
      id: `${widget.type}_${Date.now()}`,
      type: widget.type,
      title: widget.title,
      size: widget.size,
      position: { x: 0, y: 0 }, // Will be positioned automatically
      visible: true,
      settings: getDefaultSettings(widget.type),
    };
    
    onAddWidget(newWidget);
  };

  const getDefaultSettings = (type) => {
    switch (type) {
      case 'summary_cards':
        return { showIcons: true, compactView: false, colorScheme: 'default' };
      case 'payment_calendar':
        return { showWeekends: true, highlightToday: true, showOverdue: true };
      case 'expense_chart':
        return { chartType: 'pie', showLabels: true, animationEnabled: true };
      case 'trend_chart':
        return { timeRange: '6months', showGrid: true, smoothLines: true };
      case 'recent_transactions':
        return { itemCount: 5, showCategories: true, showIcons: true };
      case 'upcoming_payments':
        return { daysAhead: 7, showOverdue: true, sortBy: 'date' };
      default:
        return {};
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add />
            <Typography variant="h6">Widget Ekle</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Category Filter */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Kategori
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Widget Grid */}
        <Grid container spacing={2}>
          {filteredWidgets.map((widget) => (
            <Grid item xs={12} sm={6} md={4} key={widget.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => handleAddWidget(widget)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${widget.color}.main`,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {widget.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {widget.title}
                        </Typography>
                        {widget.popular && (
                          <Chip 
                            label="Popüler" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {widget.description}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={widget.category} 
                      size="small" 
                      variant="outlined"
                    />
                    <Typography variant="caption" color="textSecondary">
                      {widget.size.width}x{widget.size.height}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredWidgets.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Eklenebilecek widget yok
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Bu kategoride tüm widget'lar zaten dashboard'da mevcut.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WidgetLibrary;