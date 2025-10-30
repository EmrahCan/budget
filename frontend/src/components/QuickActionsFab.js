import React, { useState } from 'react';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  AccountBalance,
  CreditCard,
  Receipt,
  Assessment,
  DateRange,
  Payment,
  TrendingUp,
} from '@mui/icons-material';

const QuickActionsFab = ({ onAction, position = 'bottom-right' }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAction = (action) => {
    handleClose();
    onAction(action);
  };

  const actions = [
    {
      icon: <TrendingUp />,
      name: 'İşlem Ekle',
      action: 'addTransaction',
      color: 'primary'
    },
    {
      icon: <AccountBalance />,
      name: 'Hesap Ekle',
      action: 'addAccount',
      color: 'secondary'
    },
    {
      icon: <CreditCard />,
      name: 'Kredi Kartı Ekle',
      action: 'addCreditCard',
      color: 'error'
    },
    {
      icon: <Receipt />,
      name: 'Sabit Ödeme Ekle',
      action: 'addFixedPayment',
      color: 'warning'
    },
    {
      icon: <Payment />,
      name: 'Taksit Ekle',
      action: 'addInstallment',
      color: 'info'
    },
    {
      icon: <Assessment />,
      name: 'Raporlar',
      action: 'viewReports',
      color: 'success'
    },
    {
      icon: <DateRange />,
      name: 'Takvim',
      action: 'viewCalendar',
      color: 'primary'
    },
  ];

  const getPosition = () => {
    switch (position) {
      case 'bottom-left':
        return { position: 'fixed', bottom: 16, left: 16 };
      case 'bottom-right':
        return { position: 'fixed', bottom: 16, right: 16 };
      case 'top-right':
        return { position: 'fixed', top: 16, right: 16 };
      case 'top-left':
        return { position: 'fixed', top: 16, left: 16 };
      default:
        return { position: 'fixed', bottom: 16, right: 16 };
    }
  };

  if (isMobile) {
    return (
      <>
        <SpeedDial
          ariaLabel="Hızlı İşlemler"
          sx={getPosition()}
          icon={<SpeedDialIcon />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
          direction="up"
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => handleAction(action.action)}
              sx={{
                '& .MuiSpeedDialAction-fab': {
                  bgcolor: `${action.color}.main`,
                  '&:hover': {
                    bgcolor: `${action.color}.dark`,
                  },
                },
              }}
            />
          ))}
        </SpeedDial>
        
        <Backdrop
          open={open}
          onClick={handleClose}
          sx={{ zIndex: (theme) => theme.zIndex.speedDial - 1 }}
        />
      </>
    );
  }

  return (
    <SpeedDial
      ariaLabel="Hızlı İşlemler"
      sx={getPosition()}
      icon={<SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => handleAction(action.action)}
          sx={{
            '& .MuiSpeedDialAction-fab': {
              bgcolor: `${action.color}.main`,
              '&:hover': {
                bgcolor: `${action.color}.dark`,
              },
            },
          }}
        />
      ))}
    </SpeedDial>
  );
};

export default QuickActionsFab;