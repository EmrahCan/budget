// Chart color palette
export const CHART_COLORS = {
  primary: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'],
  income: '#4CAF50',
  expense: '#F44336',
  net: '#2196F3',
  warning: '#FF9800',
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3'
};

// Chart default configurations
export const CHART_CONFIG = {
  margin: {
    desktop: { top: 20, right: 30, left: 20, bottom: 5 },
    mobile: { top: 5, right: 5, left: 5, bottom: 5 }
  },
  height: {
    desktop: 300,
    mobile: 200
  },
  animation: {
    duration: 800,
    easing: 'ease-out'
  }
};

// Category icons mapping for charts
export const CATEGORY_ICONS = {
  'Yemek': '🍽️',
  'Ulaşım': '🚗',
  'Eğlence': '🎬',
  'Alışveriş': '🛍️',
  'Sağlık': '🏥',
  'Eğitim': '📚',
  'Konut': '🏠',
  'Faturalar': '⚡',
  'İletişim': '📱',
  'Diğer': '📊'
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 600,
  tablet: 960,
  desktop: 1280
};