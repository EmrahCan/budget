import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Settings,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Add,
  Edit
} from '@mui/icons-material';
import ChartWrapper from './ChartWrapper';
import { formatCurrency } from '../../services/api';
import { CATEGORY_ICONS } from './chartConstants';

const BudgetComparisonWidget = ({ 
  budgetData = {}, 
  actualData = {}, 
  loading = false, 
  error = null,
  onBudgetUpdate = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ category: '', amount: '' });

  // Mevcut kategoriler listesi
  const availableCategories = [
    'Yemek', 'Ulaşım', 'Eğlence', 'Alışveriş', 'Sağlık', 'Eğitim',
    'Konut', 'Faturalar', 'İletişim', 'Diğer'
  ];

  // Bütçe performansını hesapla
  const budgetPerformance = useMemo(() => {
    const categories = Object.keys(budgetData);
    if (categories.length === 0) return [];

    return categories.map(category => {
      const target = budgetData[category] || 0;
      const actual = actualData[category] || 0;
      const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
      const remaining = target - actual;
      
      return {
        category,
        target,
        actual,
        percentage,
        remaining,
        status: percentage <= 80 ? 'success' : 
                percentage <= 100 ? 'warning' : 'error'
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgetData, actualData]);

  // Genel performans
  const overallPerformance = useMemo(() => {
    if (budgetPerformance.length === 0) return null;
    
    const totalTarget = budgetPerformance.reduce((sum, item) => sum + item.target, 0);
    const totalActual = budgetPerformance.reduce((sum, item) => sum + item.actual, 0);
    const avgPercentage = budgetPerformance.reduce((sum, item) => sum + item.percentage, 0) / budgetPerformance.length;
    
    return {
      totalTarget,
      totalActual,
      avgPercentage: Math.round(avgPercentage),
      totalRemaining: totalTarget - totalActual,
      onTrackCount: budgetPerformance.filter(item => item.status === 'success').length,
      warningCount: budgetPerformance.filter(item => item.status === 'warning').length,
      overBudgetCount: budgetPerformance.filter(item => item.status === 'error').length
    };
  }, [budgetPerformance]);

  // Performans rengini al
  const getPerformanceColor = (percentage) => {
    if (percentage <= 80) return 'success';
    if (percentage <= 100) return 'warning';
    return 'error';
  };

  // Performans ikonu al
  const getPerformanceIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <TrendingUp />;
      default: return <TrendingDown />;
    }
  };

  // Bütçe ayarları dialog'unu aç
  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  // Bütçe ayarları dialog'unu kapat
  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setEditingCategory(null);
    setBudgetForm({ category: '', amount: '' });
  };

  // Kategori düzenleme
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setBudgetForm({
      category,
      amount: budgetData[category]?.toString() || ''
    });
  };

  // Yeni kategori ekleme
  const handleAddCategory = () => {
    setEditingCategory(null);
    setBudgetForm({ category: '', amount: '' });
  };

  // Form gönderme
  const handleSubmitBudget = () => {
    if (budgetForm.category && budgetForm.amount && onBudgetUpdate) {
      const amount = parseFloat(budgetForm.amount);
      if (amount > 0) {
        onBudgetUpdate(budgetForm.category, amount);
        handleCloseSettings();
      }
    }
  };

  const widgetContent = (
    <Box>
      {budgetPerformance.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Henüz bütçe hedefi belirlenmemiş
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenSettings}
            size="small"
          >
            Bütçe Belirle
          </Button>
        </Box>
      ) : (
        <Box>
          {/* Genel Performans */}
          {overallPerformance && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Genel Performans
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`${overallPerformance.onTrackCount} hedefte`}
                  color="success"
                  size="small"
                />
                <Chip
                  label={`${overallPerformance.warningCount} dikkat`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`${overallPerformance.overBudgetCount} aşım`}
                  color="error"
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Toplam: {formatCurrency(overallPerformance.totalActual)} / {formatCurrency(overallPerformance.totalTarget)}
                </Typography>
                <Typography 
                  variant="body2" 
                  color={getPerformanceColor(overallPerformance.avgPercentage) + '.main'}
                  fontWeight="bold"
                >
                  %{overallPerformance.avgPercentage}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Kategori Performansları */}
          <List dense>
            {budgetPerformance.map((item, index) => {
              const icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS['Diğer'];
              
              return (
                <ListItem key={index} sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getPerformanceColor(item.percentage) + '.main',
                        width: 32,
                        height: 32,
                        fontSize: '0.8rem'
                      }}
                    >
                      {icon}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.category}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatCurrency(item.actual)} / {formatCurrency(item.target)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(item.percentage, 100)}
                          color={getPerformanceColor(item.percentage)}
                          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography 
                            variant="caption" 
                            color={getPerformanceColor(item.percentage) + '.main'}
                            fontWeight="bold"
                          >
                            %{item.percentage}
                            {item.percentage > 100 && ' (Hedef aşıldı)'}
                          </Typography>
                          
                          <Typography variant="caption" color="textSecondary">
                            {item.remaining >= 0 ? 'Kalan: ' : 'Aşım: '}
                            {formatCurrency(Math.abs(item.remaining))}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <ChartWrapper
        title="Bütçe Performansı"
        loading={loading}
        error={error}
        height={isMobile ? 400 : 500}
        actions={
          <IconButton size="small" onClick={handleOpenSettings}>
            <Settings />
          </IconButton>
        }
      >
        {widgetContent}
      </ChartWrapper>

      {/* Bütçe Ayarları Dialog */}
      <Dialog open={settingsOpen} onClose={handleCloseSettings} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bütçe Ayarları
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Kategori bazlı aylık bütçe hedeflerinizi belirleyin
            </Typography>
          </Box>

          {/* Mevcut Bütçeler */}
          {Object.keys(budgetData).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Mevcut Bütçeler
              </Typography>
              <List dense>
                {Object.entries(budgetData).map(([category, amount]) => (
                  <ListItem 
                    key={category}
                    secondaryAction={
                      <IconButton size="small" onClick={() => handleEditCategory(category)}>
                        <Edit />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={category}
                      secondary={formatCurrency(amount)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Yeni/Düzenle Form */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Kategori"
              value={budgetForm.category}
              onChange={(e) => setBudgetForm(prev => ({ ...prev, category: e.target.value }))}
              sx={{ flex: 1 }}
              size="small"
            >
              {availableCategories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Aylık Hedef"
              type="number"
              value={budgetForm.amount}
              onChange={(e) => setBudgetForm(prev => ({ ...prev, amount: e.target.value }))}
              sx={{ flex: 1 }}
              size="small"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₺</Typography>
              }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmitBudget}
            disabled={!budgetForm.category || !budgetForm.amount}
            fullWidth
          >
            {editingCategory ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseSettings}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BudgetComparisonWidget;