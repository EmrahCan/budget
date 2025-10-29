import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  AccountBalance,
  CreditCard,
  Receipt,
  Assessment,
  Person,
  TrendingUp,
  AdminPanelSettings,
  People,
  Schedule,
  Payment,
  Repeat,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const getMenuItems = (userRole) => {
  const baseItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/',
    },
    {
      text: 'Hesaplarım',
      icon: <AccountBalance />,
      path: '/accounts',
    },
    {
      text: 'Kredi Kartlarım',
      icon: <CreditCard />,
      path: '/credit-cards',
    },
    {
      text: 'İşlemlerim',
      icon: <Receipt />,
      path: '/transactions',
    },
    {
      text: 'Sabit Ödemeler',
      icon: <Repeat />,
      path: '/fixed-payments',
    },
    {
      text: 'Taksitli Ödemeler',
      icon: <Payment />,
      path: '/installment-payments',
    },
    {
      text: 'Ödeme Takvimi',
      icon: <CalendarToday />,
      path: '/payment-calendar',
    },
    {
      text: 'Raporlar',
      icon: <Assessment />,
      path: '/reports',
    },
  ];

  // Add admin items if user is admin
  if (userRole === 'admin') {
    baseItems.push(
      {
        text: 'Admin Panel',
        icon: <AdminPanelSettings />,
        path: '/admin',
      },
      {
        text: 'Kullanıcı Yönetimi',
        icon: <People />,
        path: '/admin/users',
      }
    );
  }

  return baseItems;
};

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = getMenuItems(user?.role);

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" noWrap component="div" color="primary">
            Budget App
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
              }}
            >
              {getInitials(user.firstName, user.lastName)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="textSecondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleItemClick(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path ? 'inherit' : 'action.active',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Profile Link */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profile'}
            onClick={() => handleItemClick('/profile')}
            sx={{
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: location.pathname === '/profile' ? 'inherit' : 'action.active',
              }}
            >
              <Person />
            </ListItemIcon>
            <ListItemText 
              primary="Profil"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/profile' ? 600 : 400,
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;