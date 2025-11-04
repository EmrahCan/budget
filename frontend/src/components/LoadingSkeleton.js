import React from 'react';
import { 
  Card, 
  CardContent, 
  Skeleton, 
  Box, 
  Grid,
  Typography 
} from '@mui/material';

// Dashboard Card Skeleton
export const DashboardCardSkeleton = ({ height = 120 }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      </Box>
      <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={16} />
    </CardContent>
  </Card>
);

// Chart Widget Skeleton
export const ChartWidgetSkeleton = ({ height = 300, title }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height }}>
        <Skeleton variant="rectangular" width="100%" height="80%" />
      </Box>
    </CardContent>
  </Card>
);

// List Item Skeleton
export const ListItemSkeleton = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 2, px: 1 }}>
        <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Skeleton variant="text" width={60} height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="rectangular" width={50} height={20} />
        </Box>
      </Box>
    ))}
  </>
);

// Transaction List Skeleton
export const TransactionListSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
      <ListItemSkeleton count={5} />
    </CardContent>
  </Card>
);

// Payment Calendar Skeleton
export const PaymentCalendarSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
      <Grid container spacing={1}>
        {Array.from({ length: 28 }).map((_, index) => (
          <Grid item xs={1.7} key={index}>
            <Skeleton variant="rectangular" height={40} />
          </Grid>
        ))}
      </Grid>
    </CardContent>
  </Card>
);

// Financial Metrics Skeleton
export const FinancialMetricsSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 3 }} />
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="20%" height={20} />
          </Box>
          <Skeleton variant="rectangular" height={8} />
        </Box>
      ))}
    </CardContent>
  </Card>
);

// Budget Comparison Skeleton
export const BudgetComparisonSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
      {Array.from({ length: 3 }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="text" width="20%" height={16} />
          </Box>
          <Skeleton variant="rectangular" height={6} />
        </Box>
      ))}
    </CardContent>
  </Card>
);

// Expense Category Chart Skeleton
export const ExpenseCategorySkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
        <Skeleton variant="circular" width={200} height={200} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={12} height={12} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

// Financial Trend Chart Skeleton
export const FinancialTrendSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
      <Box sx={{ height: 300 }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    </CardContent>
  </Card>
);

export default {
  DashboardCardSkeleton,
  ChartWidgetSkeleton,
  ListItemSkeleton,
  TransactionListSkeleton,
  PaymentCalendarSkeleton,
  FinancialMetricsSkeleton,
  BudgetComparisonSkeleton,
  ExpenseCategorySkeleton,
  FinancialTrendSkeleton
};