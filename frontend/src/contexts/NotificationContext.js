import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
    autoHideDuration: 6000
  });

  const showNotification = (message, severity = 'info', autoHideDuration = 6000) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration
    });
  };

  const showSuccess = (message, autoHideDuration = 4000) => {
    showNotification(message, 'success', autoHideDuration);
  };

  const showError = (message, autoHideDuration = 8000) => {
    showNotification(message, 'error', autoHideDuration);
  };

  const showWarning = (message, autoHideDuration = 6000) => {
    showNotification(message, 'warning', autoHideDuration);
  };

  const showInfo = (message, autoHideDuration = 6000) => {
    showNotification(message, 'info', autoHideDuration);
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={hideNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};