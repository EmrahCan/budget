import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Pagination,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';

const PaginationControls = ({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showItemCount = true,
  showFirstLastButtons = true,
  variant = 'standard', // 'standard', 'compact', 'minimal'
  size = 'medium'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Adjust variant based on screen size
  const effectiveVariant = isMobile ? 'compact' : variant;
  const effectiveSize = isMobile ? 'small' : size;

  const handlePageChange = (event, page) => {
    onPageChange(page);
  };

  const handlePageSizeChange = (event) => {
    onPageSizeChange(event.target.value);
  };

  // Minimal variant - just page numbers
  if (effectiveVariant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          size={effectiveSize}
          showFirstButton={showFirstLastButtons}
          showLastButton={showFirstLastButtons}
        />
      </Box>
    );
  }

  // Compact variant - for mobile
  if (effectiveVariant === 'compact') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 2,
        px: 1
      }}>
        {/* Page navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            size={effectiveSize}
          >
            <FirstPage />
          </IconButton>
          
          <IconButton
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            size={effectiveSize}
          >
            <KeyboardArrowLeft />
          </IconButton>
          
          <Typography variant="body2" sx={{ mx: 2, minWidth: '80px', textAlign: 'center' }}>
            {currentPage} / {totalPages}
          </Typography>
          
          <IconButton
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            size={effectiveSize}
          >
            <KeyboardArrowRight />
          </IconButton>
          
          <IconButton
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            size={effectiveSize}
          >
            <LastPage />
          </IconButton>
        </Box>

        {/* Item count and page size */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          fontSize: '0.875rem'
        }}>
          {showItemCount && (
            <Typography variant="caption" color="textSecondary">
              {startIndex + 1}-{endIndex} / {totalItems.toLocaleString()} kayıt
            </Typography>
          )}
          
          {showPageSizeSelector && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Sayfa</InputLabel>
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
                label="Sayfa"
              >
                {pageSizeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
    );
  }

  // Standard variant - full featured
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: isTablet ? 'column' : 'row',
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: 2,
      py: 2,
      px: 2
    }}>
      {/* Left side - Item count and page size */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        flexWrap: 'wrap'
      }}>
        {showItemCount && (
          <Typography variant="body2" color="textSecondary">
            {startIndex + 1}-{endIndex} / {totalItems.toLocaleString()} kayıt gösteriliyor
          </Typography>
        )}
        
        {showPageSizeSelector && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sayfa başına</InputLabel>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              label="Sayfa başına"
            >
              {pageSizeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option} kayıt
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Right side - Page navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showFirstLastButtons && (
          <IconButton
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            size={effectiveSize}
            title="İlk sayfa"
          >
            <FirstPage />
          </IconButton>
        )}
        
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          size={effectiveSize}
          showFirstButton={false}
          showLastButton={false}
          siblingCount={isMobile ? 0 : 1}
          boundaryCount={isMobile ? 1 : 2}
        />
        
        {showFirstLastButtons && (
          <IconButton
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            size={effectiveSize}
            title="Son sayfa"
          >
            <LastPage />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default PaginationControls;