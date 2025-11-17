import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { performStartupChecks, checkApiConnectivity } from './utils/startup';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './i18n/config'; // Initialize i18n
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import DashboardNew from './pages/DashboardNew';
import AccountsPage from './pages/accounts/AccountsPage';
import OverdraftsPage from './pages/overdrafts/OverdraftsPage';
import CreditCardsDashboard from './pages/creditCards/CreditCardsDashboard';
import TransactionsPage from './pages/transactions/TransactionsPage';
import ReportsPage from './pages/reports/ReportsPage';
import ProfilePage from './pages/profile/ProfilePage';
import FixedPaymentsPage from './pages/fixedPayments/FixedPaymentsPage';
import InstallmentPaymentsPage from './pages/installmentPayments/InstallmentPaymentsPage';
import PaymentCalendarPage from './pages/calendar/PaymentCalendarPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemHealthIndicator from './components/common/SystemHealthIndicator';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  // Perform startup checks
  useEffect(() => {
    const runStartupChecks = async () => {
      // Environment validation
      performStartupChecks();
      
      // API connectivity check (non-blocking)
      setTimeout(() => {
        checkApiConnectivity();
      }, 1000);
    };
    
    runStartupChecks();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard-new" element={<DashboardNew />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="overdrafts" element={<OverdraftsPage />} />
                <Route path="credit-cards" element={<CreditCardsDashboard />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="fixed-payments" element={<FixedPaymentsPage />} />
                <Route path="installment-payments" element={<InstallmentPaymentsPage />} />
                <Route path="payment-calendar" element={<PaymentCalendarPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* Admin Routes */}
                <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
              </Route>
              
              {/* Redirect unknown routes to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* System Health Indicator - only show in development or when issues occur */}
            <SystemHealthIndicator 
              position="bottom-left"
              autoHide={process.env.NODE_ENV === 'production'}
            />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;