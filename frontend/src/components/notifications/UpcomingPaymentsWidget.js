import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Info,
  Error as ErrorIcon,
  Schedule,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Close,
  Notifications,
  NotificationsNone,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';

const UpcomingPaymentsWidget = () => {
  const {
    notifications,
    loading,
    markAsRead,
    dismissNotification,
  } = useNotifications();

  // Filter for payment-related notifications
  const paymentNotifications = notifications.filter(n =>
    n.notification_type.includes('fixed_payment') ||
    n.notification_type.includes('credit_card') ||
    n.notification_type.includes('budget')
  );

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  // Get notification type icon
  const getTypeIcon = (type) => {
    if (type.includes('fixed_payment')) {
      return <Schedule fontSize="small" />;
    } else if (type.includes('credit_card')) {
      return <CreditCard fontSize="small" />;
    } else if (type.includes('budget')) {
      return <TrendingUp fontSize="small" />;
    }
    return <Notifications fontSize="small" />;
  };

  // Get priority color for chip
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Acil';
      case 'medium':
        return 'Önemli';
      case 'low':
        return 'Bilgi';
      default:
        return 'Bilgi';
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleDismiss = async (notificationId) => {
    await dismissNotification(notificationId);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Yaklaşan Ödemeler ve Uyarılar
            </Typography>
          </Box>
          {paymentNotifications.length > 0 && (
            <Chip
              label={paymentNotifications.length}
              color="primary"
              size="small"
            />
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Loading State */}
        {loading && paymentNotifications.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Empty State */}
        {!loading && paymentNotifications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsNone sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Yaklaşan ödeme veya uyarı yok
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Tüm ödemeleriniz kontrol altında!
            </Typography>
          </Box>
        )}

        {/* Notification List */}
        {paymentNotifications.length > 0 && (
          <List sx={{ p: 0 }}>
            {paymentNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    px: 0,
                    py: 2,
                    backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1,
                    border: 1,
                    borderColor: notification.is_read ? 'divider' : 'primary.main',
                  }}
                >
                  {/* Notification Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1, px: 2 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mt: 0.5 }}>
                      {getPriorityIcon(notification.priority)}
                    </ListItemIcon>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {getTypeIcon(notification.notification_type)}
                        <Chip
                          label={getPriorityLabel(notification.priority)}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={notification.is_read ? 'normal' : 'bold'}
                        sx={{ mb: 0.5 }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {notification.message}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, px: 2 }}>
                    {!notification.is_read && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CheckCircle />}
                        onClick={() => handleMarkAsRead(notification.id)}
                        sx={{ textTransform: 'none', flex: 1 }}
                      >
                        Okundu İşaretle
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Close />}
                      onClick={() => handleDismiss(notification.id)}
                      sx={{ textTransform: 'none', flex: notification.is_read ? 1 : 0 }}
                    >
                      Kapat
                    </Button>
                  </Box>
                </ListItem>
                {index < paymentNotifications.length - 1 && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Info Alert */}
        {paymentNotifications.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              Bildirimleri zamanında kontrol ederek ödemelerinizi kaçırmayın.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingPaymentsWidget;
