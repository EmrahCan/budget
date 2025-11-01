import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Skeleton,
} from '@mui/material';

const VirtualizedTable = ({
  data = [],
  columns = [],
  rowHeight = 60,
  containerHeight = 400,
  loading = false,
  onRowClick,
  stickyHeader = true,
  emptyMessage = "Veri bulunamadı",
  loadingRowCount = 10
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!data.length) return { start: 0, end: 0 };
    
    const start = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(start + visibleCount + 5, data.length); // +5 for buffer
    
    return { start: Math.max(0, start - 2), end }; // -2 for buffer
  }, [scrollTop, rowHeight, containerHeight, data.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((event) => {
    const scrollTop = event.target.scrollTop;
    setScrollTop(scrollTop);
  }, []);

  // Scroll to top when data changes
  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [data]);

  // Calculate total height and offset
  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.start * rowHeight;

  // Loading skeleton rows
  const renderLoadingRows = () => {
    return Array.from({ length: loadingRowCount }, (_, index) => (
      <TableRow key={`loading-${index}`} style={{ height: rowHeight }}>
        {columns.map((column, colIndex) => (
          <TableCell key={colIndex}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // Render visible rows
  const renderVisibleRows = () => {
    return visibleItems.map((item, index) => {
      const actualIndex = visibleRange.start + index;
      
      return (
        <TableRow
          key={item.id || actualIndex}
          hover
          onClick={() => onRowClick && onRowClick(item, actualIndex)}
          sx={{ 
            height: rowHeight,
            cursor: onRowClick ? 'pointer' : 'default',
            '&:hover': onRowClick ? { backgroundColor: 'action.hover' } : {}
          }}
        >
          {columns.map((column, colIndex) => (
            <TableCell key={colIndex} align={column.align || 'left'}>
              {column.render ? column.render(item, actualIndex) : item[column.field]}
            </TableCell>
          ))}
        </TableRow>
      );
    });
  };

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ height: containerHeight }}>
        <Table stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index} align={column.align || 'left'}>
                  {column.headerName || column.field}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {renderLoadingRows()}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (!data.length) {
    return (
      <TableContainer component={Paper} sx={{ height: containerHeight }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography variant="h6" color="textSecondary">
            {emptyMessage}
          </Typography>
        </Box>
      </TableContainer>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ height: containerHeight }}
      ref={setContainerRef}
    >
      <Table stickyHeader={stickyHeader}>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell 
                key={index} 
                align={column.align || 'left'}
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'background.paper',
                  zIndex: 2
                }}
              >
                {column.headerName || column.field}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      </Table>
      
      <Box
        ref={scrollElementRef}
        onScroll={handleScroll}
        sx={{
          height: containerHeight - 56, // Subtract header height
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <Box sx={{ height: totalHeight, position: 'relative' }}>
          <Box sx={{ transform: `translateY(${offsetY}px)` }}>
            <Table>
              <TableBody>
                {renderVisibleRows()}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>
      
      {/* Row count indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
          zIndex: 3
        }}
      >
        {data.length.toLocaleString()} kayıt
      </Box>
    </TableContainer>
  );
};

export default VirtualizedTable;