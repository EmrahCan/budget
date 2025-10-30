import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Typography,
  Fade,
} from '@mui/material';
import {
  MoreVert,
  Fullscreen,
  Settings,
  Refresh,
  Launch,
} from '@mui/icons-material';

const InteractiveWidget = ({
  title,
  children,
  onFullscreen,
  onSettings,
  onRefresh,
  onNavigate,
  loading = false,
  error = null,
  showMenu = true,
  showFullscreen = true,
  showSettings = false,
  showRefresh = true,
  showNavigate = true,
  customActions = [],
  ...cardProps
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAction = (action, callback) => {
    handleMenuClose();
    if (callback) {
      callback();
    }
  };

  const menuItems = [
    ...(showNavigate && onNavigate ? [{
      label: 'Detayları Gör',
      icon: <Launch fontSize="small" />,
      action: () => handleAction('navigate', onNavigate)
    }] : []),
    ...(showFullscreen && onFullscreen ? [{
      label: 'Tam Ekran',
      icon: <Fullscreen fontSize="small" />,
      action: () => handleAction('fullscreen', onFullscreen)
    }] : []),
    ...(showRefresh && onRefresh ? [{
      label: 'Yenile',
      icon: <Refresh fontSize="small" />,
      action: () => handleAction('refresh', onRefresh)
    }] : []),
    ...(showSettings && onSettings ? [{
      label: 'Ayarlar',
      icon: <Settings fontSize="small" />,
      action: () => handleAction('settings', onSettings)
    }] : []),
    ...customActions.map(action => ({
      label: action.label,
      icon: action.icon,
      action: () => handleAction('custom', action.callback)
    }))
  ];

  return (
    <Card
      {...cardProps}
      sx={{
        position: 'relative',
        cursor: onNavigate ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: onNavigate ? 'translateY(-2px)' : 'none',
          boxShadow: onNavigate ? 4 : 1,
        },
        ...cardProps.sx
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onNavigate}
    >
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          }
          action={
            showMenu && menuItems.length > 0 && (
              <Fade in={isHovered || Boolean(menuAnchor)}>
                <Tooltip title="Widget Menüsü">
                  <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{ opacity: isHovered || Boolean(menuAnchor) ? 1 : 0.7 }}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Fade>
            )
          }
          sx={{ pb: 1 }}
        />
      )}
      
      <CardContent sx={{ pt: title ? 0 : 2 }}>
        {error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </CardContent>

      {/* Widget Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {menuItems.map((item, index) => (
          <MenuItem key={index} onClick={item.action}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
};

export default InteractiveWidget;