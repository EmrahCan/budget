import { CHART_COLORS } from './chartConstants';

// Format currency for charts
export const formatChartCurrency = (value) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `₺${(value / 1000).toFixed(1)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

// Format percentage
export const formatPercentage = (value) => {
  return `%${value.toFixed(1)}`;
};

// Get color by index
export const getColorByIndex = (index) => {
  return CHART_COLORS.primary[index % CHART_COLORS.primary.length];
};

// Process category data for pie chart
export const processCategoryData = (rawData, maxCategories = 6) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Sort by amount descending
  const sortedData = [...rawData].sort((a, b) => b.amount - a.amount);
  
  // Take top categories
  const topCategories = sortedData.slice(0, maxCategories);
  const otherCategories = sortedData.slice(maxCategories);
  
  // Add colors
  const processedData = topCategories.map((item, index) => ({
    ...item,
    color: getColorByIndex(index)
  }));
  
  // Add "Other" category if needed
  if (otherCategories.length > 0) {
    const otherTotal = otherCategories.reduce((sum, item) => sum + item.amount, 0);
    processedData.push({
      category: 'Diğer',
      amount: otherTotal,
      color: getColorByIndex(maxCategories),
      isOther: true
    });
  }
  
  return processedData;
};

// Process financial trend data
export const processFinancialTrendData = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  return rawData.map(item => ({
    ...item,
    net: item.income - item.expense
  }));
};

// Calculate financial metrics
export const calculateFinancialMetrics = (data) => {
  const {
    totalIncome = 0,
    totalExpense = 0,
    totalDebt = 0,
    totalAssets = 0,
    monthlyIncome = 0,
    emergencyFund = 0
  } = data;
  
  return {
    debtToIncomeRatio: monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
    emergencyFundMonths: monthlyIncome > 0 ? emergencyFund / monthlyIncome : 0,
    netWorth: totalAssets - totalDebt
  };
};

// Generate month labels for trend chart
export const generateMonthLabels = (monthsBack = 6) => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const result = [];
  const now = new Date();
  
  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: months[date.getMonth()],
      year: date.getFullYear(),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    });
  }
  
  return result;
};

// Responsive chart configuration
export const getResponsiveConfig = (isMobile) => {
  return {
    height: isMobile ? 200 : 300,
    margin: isMobile 
      ? { top: 5, right: 5, left: 5, bottom: 5 }
      : { top: 20, right: 30, left: 20, bottom: 5 },
    fontSize: isMobile ? 10 : 12
  };
};