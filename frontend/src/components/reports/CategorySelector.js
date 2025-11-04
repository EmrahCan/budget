import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Chip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Category,
  SelectAll,
  ClearAll,
  ExpandMore,
  ExpandLess,
  FilterList,
} from '@mui/icons-material';
import { reportsAPI } from '../../services/api';

const CategorySelector = ({ 
  value = [], 
  onChange, 
  disabled = false,
  showSelectAll = true,
  showClearAll = true,
  maxHeight = 400,
  collapsible = true,
  showSelectedCount = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(value || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(!collapsible);

  // Load available categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Update local state when value prop changes
  useEffect(() => {
    setSelectedCategories(value || []);
  }, [value]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportsAPI.getAvailableCategories();
      const categories = response.data.data || [];
      
      setAvailableCategories(categories);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Kategoriler yüklenirken hata oluştu');
      
      // Fallback to default categories
      setAvailableCategories([
        'Gıda', 'Ulaşım', 'Eğlence', 'Faturalar', 'Alışveriş', 
        'Sağlık', 'Eğitim', 'Teknoloji', 'Ev & Yaşam', 'Diğer'
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle individual category selection
  const handleCategoryChange = (category, checked) => {
    if (disabled) return;

    let newSelection;
    if (checked) {
      newSelection = [...selectedCategories, category];
    } else {
      newSelection = selectedCategories.filter(cat => cat !== category);
    }

    setSelectedCategories(newSelection);
    
    if (onChange) {
      onChange(newSelection);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (disabled) return;

    const newSelection = [...availableCategories];
    setSelectedCategories(newSelection);
    
    if (onChange) {
      onChange(newSelection);
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (disabled) return;

    setSelectedCategories([]);
    
    if (onChange) {
      onChange([]);
    }
  };

  // Toggle expansion
  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Get selection summary
  const getSelectionSummary = () => {
    const selectedCount = selectedCategories.length;
    const totalCount = availableCategories.length;
    
    if (selectedCount === 0) {
      return 'Hiç kategori seçilmedi';
    } else if (selectedCount === totalCount) {
      return 'Tüm kategoriler seçili';
    } else {
      return `${selectedCount} / ${totalCount} kategori seçili`;
    }
  };

  // Render category chips for mobile view
  const renderSelectedChips = () => {
    if (selectedCategories.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Seçili Kategoriler:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedCategories.map((category) => (
            <Chip
              key={category}
              label={category}
              onDelete={disabled ? undefined : () => handleCategoryChange(category, false)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Kategoriler yükleniyor...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Category color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Kategori Seçimi
          </Typography>
        </Box>
        
        {collapsible && (
          <IconButton onClick={handleToggleExpanded} disabled={disabled}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      {/* Selection Summary */}
      {showSelectedCount && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {getSelectionSummary()}
          </Typography>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Collapsible Content */}
      <Collapse in={expanded}>
        {/* Action Buttons */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={1}>
            {showSelectAll && (
              <Grid item xs={6} sm="auto">
                <Button
                  variant="outlined"
                  startIcon={<SelectAll />}
                  onClick={handleSelectAll}
                  disabled={disabled || selectedCategories.length === availableCategories.length}
                  fullWidth={isMobile}
                  size="small"
                >
                  Tümünü Seç
                </Button>
              </Grid>
            )}
            
            {showClearAll && (
              <Grid item xs={6} sm="auto">
                <Button
                  variant="outlined"
                  startIcon={<ClearAll />}
                  onClick={handleClearAll}
                  disabled={disabled || selectedCategories.length === 0}
                  fullWidth={isMobile}
                  size="small"
                >
                  Tümünü Temizle
                </Button>
              </Grid>
            )}
            
            <Grid item xs={12} sm="auto">
              <Button
                variant="text"
                startIcon={<FilterList />}
                onClick={loadCategories}
                disabled={disabled || loading}
                size="small"
              >
                Yenile
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Category List */}
        <Box 
          sx={{ 
            maxHeight: maxHeight,
            overflowY: 'auto',
            pr: 1
          }}
        >
          <FormGroup>
            <Grid container spacing={isMobile ? 1 : 2}>
              {availableCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        disabled={disabled}
                        color="primary"
                      />
                    }
                    label={category}
                    sx={{
                      m: 0,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': disabled ? {} : {
                        backgroundColor: 'action.hover'
                      },
                      '& .MuiFormControlLabel-label': {
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </FormGroup>
        </Box>

        {/* Selected Categories Chips (Mobile) */}
        {isMobile && renderSelectedChips()}
      </Collapse>

      {/* Collapsed State Summary */}
      {!expanded && selectedCategories.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedCategories.slice(0, 3).map((category) => (
              <Chip
                key={category}
                label={category}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            {selectedCategories.length > 3 && (
              <Chip
                label={`+${selectedCategories.length - 3} daha`}
                size="small"
                color="primary"
                variant="filled"
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default CategorySelector;