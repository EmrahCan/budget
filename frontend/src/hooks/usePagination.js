import { useState, useMemo, useCallback } from 'react';

const usePagination = ({
  data = [],
  initialPage = 1,
  initialPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100, 250, 500]
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [data.length, currentPage, pageSize]);

  // Get current page data
  const paginatedData = useMemo(() => {
    const { startIndex, endIndex } = paginationInfo;
    return data.slice(startIndex, endIndex);
  }, [data, paginationInfo]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, paginationInfo.totalPages));
    setCurrentPage(validPage);
  }, [paginationInfo.totalPages]);

  const goToNextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const goToPreviousPage = useCallback(() => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPreviousPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationInfo.totalPages);
  }, [paginationInfo.totalPages]);

  // Page size change
  const changePageSize = useCallback((newPageSize) => {
    const currentStartIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentStartIndex / newPageSize) + 1;
    
    setPageSize(newPageSize);
    setCurrentPage(newPage);
  }, [currentPage, pageSize]);

  // Reset pagination when data changes
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Get page numbers for pagination component
  const getPageNumbers = useCallback((maxVisible = 7) => {
    const { totalPages, currentPage } = paginationInfo;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages = [];
    
    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [paginationInfo]);

  return {
    // Data
    paginatedData,
    
    // Pagination info
    ...paginationInfo,
    
    // Navigation functions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    
    // Page size
    changePageSize,
    pageSizeOptions,
    
    // Utilities
    resetPagination,
    getPageNumbers
  };
};

export default usePagination;