import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone,
  CheckCircle,
  Close,
  Warning,
  Info,
  Error as ErrorIcon,
  Schedule,
  CreditCard,
  TrendingUp,
  MarkEmailRead,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    dismissNotification,
    markAllAsRead,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDismiss = async (notificationId, event) => {
    event.stopPropagation();
    await dismissNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Get priority icon and color
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
      case 'high':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
      case 'medium':
        return <Warning fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'low':
        return <Info fontSize="small" sx={{ color: 'info.main' }} />;
      default:
        return <Info fontSize="small" sx={{ color: 'info.main' }} />;
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
    return <NotificationsIcon fontSize="small" />;
  };

  // Get priority color for border
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error.main';
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      case 'low':
        return 'info.main';
      default:
        return 'grey.400';
    }
  };

  // Format notification time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  // Group notifications by type
  const overdueNotifications = notifications.filter(n => 
    n.notification_type && n.notification_type.includes('overdue')
  );
  
  const upcomingNotifications = notifications.filter(n => 
    n.notification_type && !n.notification_type.includes('overdue')
  );

  // Get recent notifications (max 5 from each group)
  const recentOverdue = overdueNotifications.slice(0, 5);
  const recentUpcoming = upcomingNotifications.slice(0, 5);
  
  // Count overdue notifications for badge
  const overdueCount = overdueNotifications.filter(n => !n.is_read).length;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notifications"
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 400,
            maxWidth: '90vw',
            maxHeight: 600,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Bildirimler
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              sx={{ textTransform: 'none' }}
            >
              Tümünü Okundu İşaretle
            </Button>
          )}
        </Box>
        <Divider />

        {/* Loading State */}
        {loading && notifications.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <NotificationsNone sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Yeni bildirim yok
            </Typography>
          </Box>
        )}

        {/* Overdue Notifications Section */}
        {recentOverdue.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 1, backgroundColor: 'error.light', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon fontSize="small" sx={{ color: 'error.dark' }} />
              <Typography variant="subtitle2" fontWeight="bold" color="error.dark">
                Gecikmiş Ödemeler ({overdueCount})
              </Typography>
            </Box>
            {recentOverdue.map((notification) => (
              <MenuItem
                key={notification.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  py: 1.5,
                  px: 2,
                  borderLeft: 4,
                  borderColor: getPriorityColor(notification.priority),
                  backgroundColor: notification.is_read ? 'transparent' : 'error.lighter',
                  '&:hover': {
                    backgroundColor: notification.is_read ? 'action.hover' : 'action.selected',
                  },
                }}
                onClick={() => {}}
              >
                {/* Notification Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                  <Box sx={{ mt: 0.5 }}>
                    {getTypeIcon(notification.notification_type)}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={notification.is_read ? 'normal' : 'bold'}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mt: 0.5,
                      }}
                    >
                      {notification.message}
                    </Typography>
                  </Box>
                  <Box>
                    {getPriorityIcon(notification.priority)}
                  </Box>
                </Box>

                {/* Notification Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    {formatTime(notification.sent_at || notification.created_at)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {!notification.is_read && (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<CheckCircle />}
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                      >
                        Okundu
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<Close />}
                      onClick={(e) => handleDismiss(notification.id, e)}
                      sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                    >
                      Kapat
                    </Button>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            {overdueNotifications.length > 5 && (
              <Box sx={{ px: 2, py: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  +{overdueNotifications.length - 5} gecikmiş ödeme daha
                </Typography>
              </Box>
            )}
            <Divider />
          </>
        )}

        {/* Upcoming Notifications Section */}
        {recentUpcoming.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 1, backgroundColor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                Yaklaşan Ödemeler
              </Typography>
            </Box>
            {recentUpcoming.map((notification) => (
          <MenuItem
            key={notification.id}
            sx={{
              flexDirection: 'column',
              alignItems: 'stretch',
              py: 1.5,
              px: 2,
              borderLeft: 4,
              borderColor: getPriorityColor(notification.priority),
              backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
              '&:hover': {
                backgroundColor: notification.is_read ? 'action.hover' : 'action.selected',
              },
            }}
            onClick={() => {}}
          >
            {/* Notification Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
              <Box sx={{ mt: 0.5 }}>
                {getTypeIcon(notification.notification_type)}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={notification.is_read ? 'normal' : 'bold'}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {notification.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mt: 0.5,
                  }}
                >
                  {notification.message}
                </Typography>
              </Box>
              <Box>
                {getPriorityIcon(notification.priority)}
              </Box>
            </Box>

            {/* Notification Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="textSecondary">
                {formatTime(notification.sent_at || notification.created_at)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!notification.is_read && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<CheckCircle />}
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                  >
                    Okundu
                  </Button>
                )}
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  startIcon={<Close />}
                  onClick={(e) => handleDismiss(notification.id, e)}
                  sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                >
                  Kapat
                </Button>
              </Box>
            </Box>
          </MenuItem>
        ))}
            {upcomingNotifications.length > 5 && (
              <Box sx={{ px: 2, py: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  +{upcomingNotifications.length - 5} yaklaşan ödeme daha
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Show More Link */}
        {notifications.length > 10 && (
          <>
            <Divider />
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Button
                size="small"
                onClick={handleClose}
                sx={{ textTransform: 'none' }}
              >
                Tüm Bildirimleri Görüntüle ({notifications.length})
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
