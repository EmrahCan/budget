/**
 * Report Analytics Service
 * Handles data analysis and calculations for the reporting system
 */

// Category analysis functions
export const analyzeCategoryData = (transactions, categories = null) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Group transactions by category
  const categoryGroups = transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Diğer';
    
    // Filter by selected categories if provided
    if (categories && categories.length > 0 && !categories.includes(category)) {
      return acc;
    }
    
    if (!acc[category]) {
      acc[category] = {
        category,
        transactions: [],
        totalAmount: 0,
        transactionCount: 0
      };
    }
    
    acc[category].transactions.push(transaction);
    acc[category].totalAmount += Math.abs(transaction.amount);
    acc[category].transactionCount += 1;
    
    return acc;
  }, {});

  // Calculate percentages and trends
  const totalExpense = Object.values(categoryGroups).reduce((sum, group) => sum + group.totalAmount, 0);
  
  return Object.values(categoryGroups).map(group => {
    const percentage = totalExpense > 0 ? ((group.totalAmount / totalExpense) * 100) : 0;
    const avgAmount = group.transactionCount > 0 ? (group.totalAmount / group.transactionCount) : 0;
    
    // Calculate trend (simplified - comparing with previous period)
    const trend = calculateCategoryTrend(group.transactions);
    
    return {
      category: group.category,
      amount: group.totalAmount,
      percentage: parseFloat(percentage.toFixed(1)),
      transactionCount: group.transactionCount,
      avgAmount: avgAmount,
      trend: trend
    };
  }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
};

// Trend analysis functions
export const analyzeTrendData = (transactions, period = 'monthly') => {
  if (!transactions || transactions.length === 0) {
    return { monthly: [], weekly: [] };
  }

  const trendData = {
    monthly: [],
    weekly: []
  };

  if (period === 'monthly' || period === 'both') {
    trendData.monthly = calculateMonthlyTrends(transactions);
  }
  
  if (period === 'weekly' || period === 'both') {
    trendData.weekly = calculateWeeklyTrends(transactions);
  }

  return trendData;
};

// Financial summary calculations
export const calculateFinancialSummary = (transactions, accounts = [], creditCards = []) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      transactionCount: 0,
      accountBalance: 0,
      creditCardDebt: 0,
      netWorth: 0
    };
  }

  // Separate income and expenses
  const income = transactions.filter(t => t.amount > 0);
  const expenses = transactions.filter(t => t.amount < 0);

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  const netIncome = totalIncome - totalExpense;

  // Calculate account balances
  const accountBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  
  // Calculate credit card debt
  const creditCardDebt = creditCards.reduce((sum, card) => sum + (card.currentBalance || 0), 0);
  
  // Calculate net worth
  const netWorth = accountBalance - creditCardDebt;

  return {
    totalIncome,
    totalExpense,
    netIncome,
    transactionCount: transactions.length,
    accountBalance,
    creditCardDebt,
    netWorth,
    savingsRate: totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0
  };
};

// Comparison analysis
export const comparePeriodsData = (currentData, previousData) => {
  if (!currentData || !previousData) {
    return null;
  }

  const comparison = {
    income: {
      current: currentData.totalIncome,
      previous: previousData.totalIncome,
      change: currentData.totalIncome - previousData.totalIncome,
      changePercent: previousData.totalIncome > 0 ? 
        (((currentData.totalIncome - previousData.totalIncome) / previousData.totalIncome) * 100) : 0
    },
    expense: {
      current: currentData.totalExpense,
      previous: previousData.totalExpense,
      change: currentData.totalExpense - previousData.totalExpense,
      changePercent: previousData.totalExpense > 0 ? 
        (((currentData.totalExpense - previousData.totalExpense) / previousData.totalExpense) * 100) : 0
    },
    netIncome: {
      current: currentData.netIncome,
      previous: previousData.netIncome,
      change: currentData.netIncome - previousData.netIncome,
      changePercent: previousData.netIncome !== 0 ? 
        (((currentData.netIncome - previousData.netIncome) / Math.abs(previousData.netIncome)) * 100) : 0
    }
  };

  return comparison;
};

// Helper functions
const calculateCategoryTrend = (transactions) => {
  if (!transactions || transactions.length < 2) {
    return 'stable';
  }

  // Simple trend calculation based on recent vs older transactions
  const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentHalf = sortedTransactions.slice(0, Math.floor(sortedTransactions.length / 2));
  const olderHalf = sortedTransactions.slice(Math.floor(sortedTransactions.length / 2));

  const recentAvg = recentHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((sum, t) => sum + Math.abs(t.amount), 0) / olderHalf.length;

  const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  if (changePercent > 10) return 'up';
  if (changePercent < -10) return 'down';
  return 'stable';
};

const calculateMonthlyTrends = (transactions) => {
  const monthlyGroups = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
        netIncome: 0,
        transactionCount: 0
      };
    }

    if (transaction.amount > 0) {
      monthlyGroups[monthKey].income += transaction.amount;
    } else {
      monthlyGroups[monthKey].expense += Math.abs(transaction.amount);
    }
    
    monthlyGroups[monthKey].transactionCount += 1;
  });

  // Calculate net income for each month
  Object.values(monthlyGroups).forEach(month => {
    month.netIncome = month.income - month.expense;
  });

  // Sort by month and return last 12 months
  return Object.values(monthlyGroups)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
};

const calculateWeeklyTrends = (transactions) => {
  const weeklyGroups = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = {
        week: weekKey,
        income: 0,
        expense: 0,
        netIncome: 0,
        transactionCount: 0
      };
    }

    if (transaction.amount > 0) {
      weeklyGroups[weekKey].income += transaction.amount;
    } else {
      weeklyGroups[weekKey].expense += Math.abs(transaction.amount);
    }
    
    weeklyGroups[weekKey].transactionCount += 1;
  });

  // Calculate net income for each week
  Object.values(weeklyGroups).forEach(week => {
    week.netIncome = week.income - week.expense;
  });

  // Sort by week and return last 8 weeks
  return Object.values(weeklyGroups)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8);
};

// Advanced analytics functions
export const calculateFinancialMetrics = (data) => {
  if (!data || !data.summary) {
    return {};
  }

  const { totalIncome, totalExpense, netIncome } = data.summary;

  return {
    // Savings rate
    savingsRate: totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0,
    
    // Expense ratio
    expenseRatio: totalIncome > 0 ? ((totalExpense / totalIncome) * 100) : 0,
    
    // Financial health score (simplified)
    healthScore: calculateHealthScore(totalIncome, totalExpense, netIncome),
    
    // Spending velocity (transactions per day)
    spendingVelocity: data.summary.transactionCount / 30, // Assuming 30-day period
    
    // Average transaction size
    avgTransactionSize: data.summary.transactionCount > 0 ? 
      (totalExpense / data.summary.transactionCount) : 0
  };
};

const calculateHealthScore = (income, expense, netIncome) => {
  if (income <= 0) return 0;
  
  let score = 50; // Base score
  
  // Positive net income adds points
  if (netIncome > 0) {
    score += Math.min(30, (netIncome / income) * 100);
  } else {
    score -= Math.min(30, Math.abs(netIncome / income) * 100);
  }
  
  // Low expense ratio adds points
  const expenseRatio = expense / income;
  if (expenseRatio < 0.5) {
    score += 20;
  } else if (expenseRatio < 0.8) {
    score += 10;
  } else if (expenseRatio > 1) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
};

// Export utility functions
export const prepareChartData = (data, chartType) => {
  switch (chartType) {
    case 'categoryPie':
      return prepareCategoryPieData(data.categoryAnalysis);
    case 'trendLine':
      return prepareTrendLineData(data.trendAnalysis);
    case 'monthlyBar':
      return prepareMonthlyBarData(data.trendAnalysis);
    default:
      return null;
  }
};

const prepareCategoryPieData = (categoryData) => {
  if (!categoryData || categoryData.length === 0) return null;

  return {
    labels: categoryData.map(item => item.category),
    datasets: [{
      data: categoryData.map(item => item.amount),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ].slice(0, categoryData.length),
      borderWidth: 2,
    }]
  };
};

const prepareTrendLineData = (trendData) => {
  if (!trendData || !trendData.monthly) return null;

  return {
    labels: trendData.monthly.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: 'Gelir',
        data: trendData.monthly.map(item => item.income),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Gider',
        data: trendData.monthly.map(item => item.expense),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      }
    ]
  };
};

const prepareMonthlyBarData = (trendData) => {
  if (!trendData || !trendData.monthly) return null;

  return {
    labels: trendData.monthly.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('tr-TR', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Net Gelir',
        data: trendData.monthly.map(item => item.netIncome),
        backgroundColor: trendData.monthly.map(item => 
          item.netIncome >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
        ),
        borderColor: trendData.monthly.map(item => 
          item.netIncome >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)'
        ),
        borderWidth: 1,
      }
    ]
  };
};