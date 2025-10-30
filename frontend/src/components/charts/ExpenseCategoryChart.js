import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import ChartWrapper from './ChartWrapper';
import { processCategoryData, getColorByIndex } from './chartUtils';
import { formatCurrency } from '../../services/api';
import { CATEGORY_ICONS } from './chartConstants';

const ExpenseCategoryChart = ({ 
  categoryData = [], 
  loading = false, 
  error = null,
  onCategoryClick = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Veriyi işle - güvenli kontrol ekle
  const processedData = useMemo(() => {
    if (!categoryData || !Array.isArray(categoryData)) {
      return [];
    }
    return processCategoryData(categoryData, 6);
  }, [categoryData]);

  // Toplam tutar
  const totalAmount = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.amount, 0);
  }, [processedData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : 0;
      
      return (
        <Paper sx={{ p: 2, maxWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: data.color,
                borderRadius: '50%',
                mr: 1
              }}
            />
            <Typography variant="body2" fontWeight="bold">
              {data.category}
            </Typography>
          </Box>
          <Typography variant="body2" color="primary">
            {formatCurrency(data.amount)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            %{percentage}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Custom Legend
  const CustomLegend = ({ payload }) => {
    if (!payload || payload.length === 0) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <List dense>
          {payload.map((entry, index) => {
            if (!entry || !entry.payload || typeof entry.payload.amount === 'undefined') return null;
            const percentage = totalAmount > 0 ? ((entry.payload.amount / totalAmount) * 100).toFixed(1) : 0;
            const icon = CATEGORY_ICONS[entry.payload.category] || CATEGORY_ICONS['Diğer'];
            
            return (
              <ListItem 
                key={index} 
                sx={{ 
                  py: 0.5,
                  cursor: onCategoryClick ? 'pointer' : 'default',
                  '&:hover': onCategoryClick ? { bgcolor: 'action.hover' } : {}
                }}
                onClick={() => onCategoryClick && onCategoryClick(entry.payload.category)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: entry.color, 
                      width: 24, 
                      height: 24,
                      fontSize: '0.8rem'
                    }}
                  >
                    {icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {entry.payload.category}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(entry.payload.amount)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          %{percentage}
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
    );
  };

  // Pie chart click handler
  const handlePieClick = (data) => {
    if (onCategoryClick && !data.isOther) {
      onCategoryClick(data.category);
    }
  };

  const chartContent = (
    <Box>
      {processedData.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Henüz harcama verisi bulunmuyor
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? 60 : 80}
                innerRadius={isMobile ? 20 : 30}
                fill="#8884d8"
                dataKey="amount"
                onClick={handlePieClick}
                stroke="#fff"
                strokeWidth={2}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{ cursor: onCategoryClick && !entry.isOther ? 'pointer' : 'default' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Toplam Tutar */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Toplam Harcama
            </Typography>
            <Typography variant="h6" color="error.main" fontWeight="bold">
              {formatCurrency(totalAmount)}
            </Typography>
          </Box>

          {/* Legend */}
          {!isMobile && <CustomLegend payload={processedData} />}
        </Box>
      )}
    </Box>
  );

  // Loading state
  if (loading) {
    return (
      <ChartWrapper
        title="Kategori Bazlı Harcamalar"
        loading={true}
        height={isMobile ? 400 : 500}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography variant="body2" color="textSecondary">
            Kategori verileri yükleniyor...
          </Typography>
        </Box>
      </ChartWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <ChartWrapper
        title="Kategori Bazlı Harcamalar"
        error={error}
        height={isMobile ? 400 : 500}
      >
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      </ChartWrapper>
    );
  }

  return (
    <ChartWrapper
      title="Kategori Bazlı Harcamalar"
      height={isMobile ? 400 : 500}
    >
      {chartContent}
    </ChartWrapper>
  );
};

export default ExpenseCategoryChart;