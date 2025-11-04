import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  DateRange,
  Today,
  CalendarMonth,
  Schedule,
  Refresh,
} from '@mui/icons-material';

const DateRangePicker = ({ 
  value, 
  onChange, 
  disabled = false,
  maxRange = 365 * 5, // 5 years max
  minDate = null,
  maxDate = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [startDate, setStartDate] = useState(value?.start || '');
  const [endDate, setEndDate] = useState(value?.end || '');
  const [error, setError] = useState('');

  // Predefined date ranges
  const datePresets = [
    {
      key: 'thisMonth',
      label: 'Bu Ay',
      icon: <Today />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      key: 'lastMonth',
      label: 'Geçen Ay',
      icon: <CalendarMonth />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      key: 'last3Months',
      label: 'Son 3 Ay',
      icon: <Schedule />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      key: 'last6Months',
      label: 'Son 6 Ay',
      icon: <Schedule />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      key: 'thisYear',
      label: 'Bu Yıl',
      icon: <CalendarMonth />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    },
    {
      key: 'lastYear',
      label: 'Geçen Yıl',
      icon: <CalendarMonth />,
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        };
      }
    }
  ];

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      setStartDate(value.start || '');
      setEndDate(value.end || '');
      
      // Check if current value matches any preset
      const matchingPreset = datePresets.find(preset => {
        const presetValue = preset.getValue();
        return presetValue.start === value.start && presetValue.end === value.end;
      });
      
      setSelectedPreset(matchingPreset ? matchingPreset.key : 'custom');
    }
  }, [value]);

  // Validate date range
  const validateDateRange = (start, end) => {
    if (!start || !end) {
      return 'Başlangıç ve bitiş tarihi gerekli';
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();

    if (startDate > endDate) {
      return 'Başlangıç tarihi bitiş tarihinden sonra olamaz';
    }

    if (endDate > today) {
      return 'Bitiş tarihi bugünden sonra olamaz';
    }

    if (minDate && startDate < new Date(minDate)) {
      return `Başlangıç tarihi ${new Date(minDate).toLocaleDateString('tr-TR')} tarihinden önce olamaz`;
    }

    if (maxDate && endDate > new Date(maxDate)) {
      return `Bitiş tarihi ${new Date(maxDate).toLocaleDateString('tr-TR')} tarihinden sonra olamaz`;
    }

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxRange) {
      return `Maksimum ${maxRange} günlük aralık seçilebilir`;
    }

    return '';
  };

  // Handle preset selection
  const handlePresetChange = (presetKey) => {
    if (disabled) return;
    
    setSelectedPreset(presetKey);
    
    if (presetKey === 'custom') {
      return;
    }

    const preset = datePresets.find(p => p.key === presetKey);
    if (preset) {
      const newValue = preset.getValue();
      setStartDate(newValue.start);
      setEndDate(newValue.end);
      
      const validationError = validateDateRange(newValue.start, newValue.end);
      setError(validationError);
      
      if (!validationError && onChange) {
        onChange(newValue);
      }
    }
  };

  // Handle manual date input
  const handleDateChange = (field, newValue) => {
    if (disabled) return;
    
    const updatedStart = field === 'start' ? newValue : startDate;
    const updatedEnd = field === 'end' ? newValue : endDate;
    
    if (field === 'start') {
      setStartDate(newValue);
    } else {
      setEndDate(newValue);
    }
    
    setSelectedPreset('custom');
    
    if (updatedStart && updatedEnd) {
      const validationError = validateDateRange(updatedStart, updatedEnd);
      setError(validationError);
      
      if (!validationError && onChange) {
        onChange({ start: updatedStart, end: updatedEnd });
      }
    } else {
      setError('');
    }
  };

  // Apply current dates
  const handleApply = () => {
    if (disabled) return;
    
    const validationError = validateDateRange(startDate, endDate);
    setError(validationError);
    
    if (!validationError && onChange) {
      onChange({ start: startDate, end: endDate });
    }
  };

  // Reset to default
  const handleReset = () => {
    if (disabled) return;
    
    const thisMonth = datePresets[0].getValue();
    setStartDate(thisMonth.start);
    setEndDate(thisMonth.end);
    setSelectedPreset('thisMonth');
    setError('');
    
    if (onChange) {
      onChange(thisMonth);
    }
  };

  // Get current range info
  const getCurrentRangeInfo = () => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      days: daysDiff,
      startFormatted: start.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      endFormatted: end.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    };
  };

  const rangeInfo = getCurrentRangeInfo();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DateRange color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Tarih Aralığı Seçimi
        </Typography>
      </Box>

      {/* Quick Presets */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Hızlı Seçim
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {datePresets.map((preset) => (
            <Chip
              key={preset.key}
              icon={preset.icon}
              label={preset.label}
              onClick={() => handlePresetChange(preset.key)}
              color={selectedPreset === preset.key ? 'primary' : 'default'}
              variant={selectedPreset === preset.key ? 'filled' : 'outlined'}
              disabled={disabled}
              sx={{ 
                cursor: disabled ? 'default' : 'pointer',
                '&:hover': disabled ? {} : { backgroundColor: 'action.hover' }
              }}
            />
          ))}
          <Chip
            label="Özel Aralık"
            onClick={() => handlePresetChange('custom')}
            color={selectedPreset === 'custom' ? 'primary' : 'default'}
            variant={selectedPreset === 'custom' ? 'filled' : 'outlined'}
            disabled={disabled}
            sx={{ 
              cursor: disabled ? 'default' : 'pointer',
              '&:hover': disabled ? {} : { backgroundColor: 'action.hover' }
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Manual Date Selection */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Başlangıç Tarihi"
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            disabled={disabled}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: minDate,
              max: maxDate || new Date().toISOString().split('T')[0]
            }}
            error={!!error}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Bitiş Tarihi"
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            disabled={disabled}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: startDate || minDate,
              max: maxDate || new Date().toISOString().split('T')[0]
            }}
            error={!!error}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleApply}
              disabled={disabled || !startDate || !endDate || !!error}
              fullWidth={isMobile}
            >
              Uygula
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
              disabled={disabled}
              fullWidth={isMobile}
            >
              Sıfırla
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Error Message */}
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {/* Range Info */}
      {rangeInfo && !error && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            <strong>Seçilen Aralık:</strong> {rangeInfo.startFormatted} - {rangeInfo.endFormatted}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Toplam Gün:</strong> {rangeInfo.days} gün
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DateRangePicker;