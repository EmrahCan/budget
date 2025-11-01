import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  SwipeableDrawer,
  Chip,
  Button,
  Typography,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Collapse
} from '@mui/material';
import {
  SwipeLeft,
  SwipeRight,
  TouchApp,
  Gesture,
  PanTool,
  Menu as MenuIcon,
  Close,
  ArrowBack,
  ArrowForward,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

// Touch-friendly button with haptic feedback
export const TouchButton = ({ 
  children, 
  onClick, 
  size = 'large',
  variant = 'contained',
  color = 'primary',
  disabled = false,
  hapticFeedback = true,
  minTouchTarget = 44,
  ...props 
}) => {
  const handleClick = (e) => {
    // Haptic feedback for supported devices
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10); // Short vibration
    }
    
    onClick?.(e);
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      sx={{
        minHeight: minTouchTarget,
        minWidth: minTouchTarget,
        borderRadius: 2,
        fontSize: '1rem',
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: variant === 'contained' ? 2 : 0,
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s ease'
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

// Swipeable card component
export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  swipeThreshold = 50,
  disabled = false,
  showSwipeIndicators = true,
  ...props 
}) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [swiping, setSwiping] = useState(false);
  const cardRef = useRef(null);

  const handleTouchStart = (e) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || !swiping) return;
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (disabled || !swiping) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.(deltaX);
        } else {
          onSwipeLeft?.(Math.abs(deltaX));
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.(deltaY);
        } else {
          onSwipeUp?.(Math.abs(deltaY));
        }
      }
    }
    
    setSwiping(false);
    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  };

  return (
    <Box
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        cursor: disabled ? 'default' : 'grab',
        userSelect: 'none',
        '&:active': {
          cursor: disabled ? 'default' : 'grabbing'
        },
        ...props.sx
      }}
      {...props}
    >
      {children}
      
      {/* Swipe indicators */}
      {showSwipeIndicators && !disabled && (
        <>
          {onSwipeLeft && (
            <Box sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.3,
              pointerEvents: 'none'
            }}>
              <SwipeLeft fontSize="small" />
            </Box>
          )}
          {onSwipeRight && (
            <Box sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.3,
              pointerEvents: 'none'
            }}>
              <SwipeRight fontSize="small" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// Touch-friendly drawer for mobile navigation
export const TouchDrawer = ({ 
  open, 
  onOpen, 
  onClose, 
  anchor = 'left',
  items = [],
  title,
  ...props 
}) => {
  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <SwipeableDrawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableBackdropTransition={!iOS}
      disableDiscovery={iOS}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          maxWidth: '80vw'
        }
      }}
      {...props}
    >
      <Box sx={{ p: 2 }}>
        {title && (
          <>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        
        <List>
          {items.map((item, index) => (
            <ListItemButton
              key={index}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
              sx={{
                minHeight: 48,
                borderRadius: 1,
                mb: 0.5,
                '&:active': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              {item.icon && (
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText 
                primary={item.text}
                secondary={item.description}
              />
              {item.badge && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  color="primary" 
                />
              )}
            </ListItemButton>
          ))}
        </List>
      </Box>
    </SwipeableDrawer>
  );
};

// Touch-friendly tab navigation
export const TouchTabs = ({ 
  tabs = [], 
  activeTab = 0, 
  onChange, 
  orientation = 'horizontal',
  showSwipeHint = true,
  ...props 
}) => {
  const [swipeHintVisible, setSwipeHintVisible] = useState(showSwipeHint);
  const tabsRef = useRef(null);

  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => {
        setSwipeHintVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint]);

  const handleSwipeLeft = () => {
    if (activeTab < tabs.length - 1) {
      onChange(activeTab + 1);
    }
  };

  const handleSwipeRight = () => {
    if (activeTab > 0) {
      onChange(activeTab - 1);
    }
  };

  return (
    <Box sx={{ position: 'relative' }} {...props}>
      <SwipeableCard
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        showSwipeIndicators={false}
        sx={{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: 1,
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}
      >
        {tabs.map((tab, index) => (
          <TouchButton
            key={index}
            variant={activeTab === index ? 'contained' : 'outlined'}
            color={activeTab === index ? 'primary' : 'inherit'}
            onClick={() => onChange(index)}
            sx={{
              flex: orientation === 'horizontal' ? 1 : 'none',
              minHeight: 48,
              fontSize: '0.875rem'
            }}
          >
            {tab.icon && (
              <Box sx={{ mr: tab.label ? 1 : 0 }}>
                {tab.icon}
              </Box>
            )}
            {tab.label}
          </TouchButton>
        ))}
      </SwipeableCard>
      
      {/* Swipe hint */}
      {swipeHintVisible && (
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          opacity: 0.7,
          animation: 'fadeInOut 3s ease-in-out'
        }}>
          <Gesture fontSize="small" />
          <Typography variant="caption">
            Kaydırarak geçiş yapabilirsiniz
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Floating action button with touch optimization
export const TouchFab = ({ 
  icon, 
  label, 
  onClick, 
  position = 'bottom-right',
  color = 'primary',
  size = 'large',
  hapticFeedback = true,
  ...props 
}) => {
  const getPosition = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'top-left':
        return { top: 16, left: 16 };
      default:
        return { bottom: 16, right: 16 };
    }
  };

  const handleClick = (e) => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(15);
    }
    onClick?.(e);
  };

  return (
    <Fab
      color={color}
      size={size}
      onClick={handleClick}
      sx={{
        position: 'fixed',
        ...getPosition(),
        zIndex: 1000,
        minHeight: 56,
        minWidth: 56,
        '&:active': {
          transform: 'scale(0.95)',
          transition: 'transform 0.1s ease'
        },
        ...props.sx
      }}
      {...props}
    >
      {icon}
    </Fab>
  );
};

// Touch-friendly accordion
export const TouchAccordion = ({ 
  items = [], 
  allowMultiple = false,
  defaultExpanded = [],
  ...props 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = (index) => {
    if (allowMultiple) {
      setExpanded(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      setExpanded(prev => 
        prev.includes(index) ? [] : [index]
      );
    }
  };

  return (
    <Box {...props}>
      {items.map((item, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <TouchButton
            variant="outlined"
            fullWidth
            onClick={() => handleToggle(index)}
            endIcon={expanded.includes(index) ? <ExpandLess /> : <ExpandMore />}
            sx={{
              justifyContent: 'space-between',
              textAlign: 'left',
              p: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {item.icon}
              <Typography variant="body1">
                {item.title}
              </Typography>
            </Box>
          </TouchButton>
          
          {expanded.includes(index) && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              borderRadius: '0 0 8px 8px',
              border: '1px solid',
              borderColor: 'divider',
              borderTop: 'none'
            }}>
              {item.content}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

// All components are already exported with 'export const' above
// No need for additional export statement