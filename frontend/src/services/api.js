import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  verifyToken: () => api.get('/auth/verify'),
};

// Accounts API
export const accountsAPI = {
  getAll: (params) => api.get('/accounts', { params }),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  getSummary: () => api.get('/accounts/summary'),
  getTransactions: (id, params) => api.get(`/accounts/${id}/transactions`, { params }),
  addIncome: (id, data) => api.post(`/accounts/${id}/income`, data),
  addExpense: (id, data) => api.post(`/accounts/${id}/expense`, data),
  transfer: (data) => api.post('/accounts/transfer', data),
  updateBalance: (id, data) => api.put(`/accounts/${id}/balance`, data),
};

// Credit Cards API
export const creditCardsAPI = {
  getAll: (params) => api.get('/credit-cards', { params }),
  getById: (id) => api.get(`/credit-cards/${id}`),
  create: (data) => api.post('/credit-cards', data),
  update: (id, data) => api.put(`/credit-cards/${id}`, data),
  delete: (id) => api.delete(`/credit-cards/${id}`),
  recordPayment: (id, data) => api.post(`/credit-cards/${id}/payment`, data),
  addExpense: (id, data) => api.post(`/credit-cards/${id}/expense`, data),
  getTransactions: (id, params) => api.get(`/credit-cards/${id}/transactions`, { params }),
  calculateInterest: (id, params) => api.get(`/credit-cards/${id}/calculate-interest`, { params }),
  getPaymentSchedule: (id, params) => api.get(`/credit-cards/${id}/payment-schedule`, { params }),
  compareScenarios: (id, data) => api.post(`/credit-cards/${id}/compare-scenarios`, data),
  getInterestSavings: (id, params) => api.get(`/credit-cards/${id}/interest-savings`, { params }),
  getUpcomingPayments: (params) => api.get('/credit-cards/payments/upcoming', { params }),
  getPaymentReminders: () => api.get('/credit-cards/payments/reminders'),
  getPaymentCalendar: (params) => api.get('/credit-cards/payments/calendar', { params }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getRecent: (params) => api.get('/transactions/recent', { params }),
  search: (params) => api.get('/transactions/search', { params }),
  getCategories: (params) => api.get('/transactions/categories', { params }),
  getStatistics: (params) => api.get('/transactions/statistics', { params }),
  getMonthlySummary: (params) => api.get('/transactions/summary/monthly', { params }),
  getCategoryBreakdown: (params) => api.get('/transactions/analysis/category-breakdown', { params }),
  getSpendingTrends: (params) => api.get('/transactions/analysis/spending-trends', { params }),
  bulkDelete: (data) => api.delete('/transactions/bulk/delete', { data }),
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || 'Sunucu hatası oluştu';
  } else if (error.request) {
    // Request was made but no response received
    return 'Sunucuya bağlanılamadı';
  } else {
    // Something else happened
    return 'Beklenmeyen bir hata oluştu';
  }
};

// Helper function to format currency
export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

// Helper function to format short date
export const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

// Fixed Payments API
export const fixedPaymentsAPI = {
  getAll: (params) => api.get('/fixed-payments', { params }),
  getById: (id) => api.get(`/fixed-payments/${id}`),
  create: (data) => api.post('/fixed-payments', data),
  update: (id, data) => api.put(`/fixed-payments/${id}`, data),
  delete: (id) => api.delete(`/fixed-payments/${id}`),
  getMonthlySchedule: (params) => api.get('/fixed-payments/schedule', { params }),
  getPaymentsDueThisMonth: () => api.get('/fixed-payments/due-this-month'),
  getOverduePayments: () => api.get('/fixed-payments/overdue'),
  getTotalMonthlyAmount: () => api.get('/fixed-payments/total-monthly'),
  getCategories: () => api.get('/fixed-payments/categories'),
  getByCategory: (category) => api.get(`/fixed-payments/category/${category}`),
};

// Installment Payments API
export const installmentPaymentsAPI = {
  getAll: (params) => api.get('/installment-payments', { params }),
  getById: (id) => api.get(`/installment-payments/${id}`),
  create: (data) => api.post('/installment-payments', data),
  update: (id, data) => api.put(`/installment-payments/${id}`, data),
  delete: (id) => api.delete(`/installment-payments/${id}`),
  recordPayment: (id, data) => api.post(`/installment-payments/${id}/payment`, data),
  getPaymentHistory: (id) => api.get(`/installment-payments/${id}/history`),
  getUpcomingPayments: (params) => api.get('/installment-payments/upcoming', { params }),
  getOverduePayments: () => api.get('/installment-payments/overdue'),
  getSummary: () => api.get('/installment-payments/summary'),
  getCategories: () => api.get('/installment-payments/categories'),
  getByCategory: (category) => api.get(`/installment-payments/category/${category}`),
};

// Reports API
export const reportsAPI = {
  getFinancialOverview: (params) => api.get('/reports/financial-overview', { params }),
  getCategoryBreakdown: (params) => api.get('/reports/category-breakdown', { params }),
  getMonthlyTrends: (params) => api.get('/reports/monthly-trends', { params }),
  getInstallmentsOverview: () => api.get('/reports/installments-overview'),
  getNetWorthHistory: (params) => api.get('/reports/net-worth-history', { params }),
  exportData: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getFinancialOverview: () => api.get('/admin/financial-overview'),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  updateUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
  resetUserPassword: (userId, data) => api.put(`/admin/users/${userId}/reset-password`, data),
  generateUserPassword: (userId) => api.post(`/admin/users/${userId}/generate-password`),
  createAdmin: (data) => api.post('/admin/create-admin', data),
};

export default api;