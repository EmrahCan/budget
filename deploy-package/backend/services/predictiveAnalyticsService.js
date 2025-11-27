const geminiAIService = require('./geminiAIService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * PredictiveAnalyticsService - Predictive analytics and forecasting
 * Provides expense predictions, trend analysis, and budget recommendations
 */
class PredictiveAnalyticsService {
  constructor() {
    this.geminiService = geminiAIService;
  }

  /**
   * Predict future expenses for the next N months
   */
  async predictFutureExpenses(userId, months = 3) {
    try {
      logger.info('Predicting future expenses', { userId, months });

      // Get historical data (last 6 months)
      const historicalData = await this.getHistoricalData(userId, 6);
      
      if (historicalData.length === 0) {
        return {
          success: false,
          error: 'Yeterli geçmiş veri yok. En az 2 aylık veri gerekli.',
        };
      }

      // Calculate statistics
      const stats = this.calculateStatistics(historicalData);
      
      // Get fixed payments
      const fixedPayments = await this.getFixedPayments(userId);
      
      // Generate predictions using AI
      const predictions = await this.generatePredictions(
        historicalData,
        stats,
        fixedPayments,
        months
      );

      return {
        success: true,
        data: {
          predictions,
          confidence: this.calculateConfidence(historicalData),
          historicalAverage: stats.average,
          trend: stats.trend,
          fixedPayments: fixedPayments.reduce((sum, fp) => sum + parseFloat(fp.amount), 0),
        },
      };

    } catch (error) {
      logger.error('Prediction error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Analyze spending trends
   */
  async analyzeTrends(userId, timeframe = 'monthly') {
    try {
      const data = await this.getTrendData(userId, timeframe);
      
      if (data.length === 0) {
        return {
          success: false,
          error: 'Trend analizi için yeterli veri yok',
        };
      }

      // Calculate trend metrics
      const trend = this.calculateTrendMetrics(data);
      
      // Identify anomalies
      const anomalies = this.identifyAnomalies(data);
      
      // Get AI insights
      const insights = await this.generateTrendInsights(data, trend, anomalies);

      return {
        success: true,
        data: {
          timeframe,
          data,
          trend,
          anomalies,
          insights,
        },
      };

    } catch (error) {
      logger.error('Trend analysis error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate budget plan
   */
  async generateBudgetPlan(userId, goals = {}) {
    try {
      // Get user's financial data
      const income = await this.getAverageIncome(userId);
      const expenses = await this.getCategoryExpenses(userId);
      const fixedPayments = await this.getFixedPayments(userId);

      // Calculate current spending patterns
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.total), 0);
      const fixedTotal = fixedPayments.reduce((sum, fp) => sum + parseFloat(fp.amount), 0);
      
      // Generate AI-powered budget recommendations
      const recommendations = await this.generateBudgetRecommendations(
        income,
        expenses,
        fixedPayments,
        goals
      );

      return {
        success: true,
        data: {
          income,
          currentExpenses: totalExpenses,
          fixedPayments: fixedTotal,
          discretionary: totalExpenses - fixedTotal,
          recommendations,
          savingsGoal: goals.savingsGoal || income * 0.2, // Default 20%
        },
      };

    } catch (error) {
      logger.error('Budget plan generation error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get historical spending data
   */
  async getHistoricalData(userId, months) {
    const query = `
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND transaction_date >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', transaction_date), category
      ORDER BY month DESC, total DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get fixed payments
   */
  async getFixedPayments(userId) {
    const query = `
      SELECT 
        name,
        amount,
        frequency,
        category
      FROM fixed_payments
      WHERE user_id = $1
        AND is_active = true
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Calculate statistics from historical data
   */
  calculateStatistics(data) {
    // Group by month
    const monthlyTotals = {};
    data.forEach(row => {
      const month = row.month;
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += parseFloat(row.total);
    });

    const values = Object.values(monthlyTotals);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate trend (simple linear regression)
    const trend = this.calculateTrend(values);

    return {
      average,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
      trend, // 'increasing', 'decreasing', 'stable'
      trendPercentage: trend.percentage,
    };
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = sumY / n;
    
    const percentage = (slope / avgValue) * 100;
    
    let direction = 'stable';
    if (percentage > 5) direction = 'increasing';
    else if (percentage < -5) direction = 'decreasing';
    
    return { direction, percentage };
  }

  /**
   * Generate predictions using AI
   */
  async generatePredictions(historicalData, stats, fixedPayments, months) {
    try {
      const prompt = `
Analyze this financial data and predict future expenses:

Historical Data (last 6 months):
${JSON.stringify(historicalData.slice(0, 10), null, 2)}

Statistics:
- Average monthly expense: ${stats.average.toFixed(2)} TL
- Standard deviation: ${stats.stdDev.toFixed(2)} TL
- Trend: ${stats.trend.direction} (${stats.trend.percentage.toFixed(1)}%)

Fixed Payments:
${JSON.stringify(fixedPayments, null, 2)}

Generate predictions for the next ${months} months in JSON format:
{
  "predictions": [
    {
      "month": "2024-12",
      "predicted_amount": number,
      "confidence": 0-100,
      "breakdown": {
        "category1": amount,
        "category2": amount
      },
      "factors": ["factor1", "factor2"]
    }
  ],
  "insights": ["insight1", "insight2"],
  "warnings": ["warning1", "warning2"]
}

Consider:
- Seasonal patterns
- Fixed payments
- Historical trends
- Category-specific patterns

Respond ONLY with valid JSON.
`;

      const result = await this.geminiService.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.predictions || [];
      }

      // Fallback to statistical prediction
      return this.generateStatisticalPredictions(stats, fixedPayments, months);

    } catch (error) {
      logger.error('AI prediction error', { error: error.message });
      return this.generateStatisticalPredictions(stats, fixedPayments, months);
    }
  }

  /**
   * Generate statistical predictions (fallback)
   */
  generateStatisticalPredictions(stats, fixedPayments, months) {
    const predictions = [];
    const fixedTotal = fixedPayments.reduce((sum, fp) => sum + parseFloat(fp.amount), 0);
    
    for (let i = 1; i <= months; i++) {
      const trendAdjustment = (stats.trend.percentage / 100) * stats.average * i;
      const predicted = stats.average + trendAdjustment;
      
      predictions.push({
        month: this.getMonthOffset(i),
        predicted_amount: Math.max(0, predicted),
        confidence: Math.max(50, 90 - (i * 10)), // Confidence decreases over time
        breakdown: {
          'Sabit Ödemeler': fixedTotal,
          'Değişken Giderler': Math.max(0, predicted - fixedTotal),
        },
        factors: [
          `Geçmiş ortalama: ${stats.average.toFixed(2)} TL`,
          `Trend: ${stats.trend.direction}`,
        ],
      });
    }
    
    return predictions;
  }

  /**
   * Get month offset (YYYY-MM format)
   */
  getMonthOffset(offset) {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toISOString().slice(0, 7);
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(historicalData) {
    // More data = higher confidence
    const dataPoints = historicalData.length;
    
    if (dataPoints < 3) return 50;
    if (dataPoints < 6) return 70;
    if (dataPoints < 12) return 85;
    return 95;
  }

  /**
   * Get trend data
   */
  async getTrendData(userId, timeframe) {
    let groupBy = 'day';
    let interval = '30 days';
    
    if (timeframe === 'weekly') {
      groupBy = 'week';
      interval = '12 weeks';
    } else if (timeframe === 'monthly') {
      groupBy = 'month';
      interval = '12 months';
    }
    
    const query = `
      SELECT 
        DATE_TRUNC('${groupBy}', transaction_date) as period,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND transaction_date >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('${groupBy}', transaction_date)
      ORDER BY period
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Calculate trend metrics
   */
  calculateTrendMetrics(data) {
    const values = data.map(d => parseFloat(d.total));
    const trend = this.calculateTrend(values);
    
    return {
      direction: trend.direction,
      percentage: trend.percentage,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      volatility: this.calculateVolatility(values),
    };
  }

  /**
   * Calculate volatility
   */
  calculateVolatility(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return (stdDev / avg) * 100; // Coefficient of variation
  }

  /**
   * Identify anomalies in data
   */
  identifyAnomalies(data) {
    const values = data.map(d => parseFloat(d.total));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
    );
    
    const anomalies = [];
    data.forEach((item, index) => {
      const value = parseFloat(item.total);
      const zScore = Math.abs((value - avg) / stdDev);
      
      if (zScore > 2) { // More than 2 standard deviations
        anomalies.push({
          period: item.period,
          value,
          deviation: ((value - avg) / avg) * 100,
          type: value > avg ? 'spike' : 'drop',
        });
      }
    });
    
    return anomalies;
  }

  /**
   * Generate trend insights using AI
   */
  async generateTrendInsights(data, trend, anomalies) {
    // Simple insights without AI for now
    const insights = [];
    
    if (trend.direction === 'increasing') {
      insights.push(`Harcamalarınız %${Math.abs(trend.percentage).toFixed(1)} artış eğiliminde`);
    } else if (trend.direction === 'decreasing') {
      insights.push(`Harcamalarınız %${Math.abs(trend.percentage).toFixed(1)} azalış eğiliminde`);
    }
    
    if (trend.volatility > 30) {
      insights.push('Harcamalarınız oldukça değişken');
    }
    
    if (anomalies.length > 0) {
      insights.push(`${anomalies.length} olağandışı harcama dönemi tespit edildi`);
    }
    
    return insights;
  }

  /**
   * Get average income
   */
  async getAverageIncome(userId) {
    const query = `
      SELECT AVG(amount) as average
      FROM transactions
      WHERE user_id = $1
        AND type = 'income'
        AND transaction_date >= NOW() - INTERVAL '3 months'
    `;
    
    const result = await db.query(query, [userId]);
    return parseFloat(result.rows[0]?.average || 0);
  }

  /**
   * Get category expenses
   */
  async getCategoryExpenses(userId) {
    const query = `
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND transaction_date >= NOW() - INTERVAL '3 months'
      GROUP BY category
      ORDER BY total DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Generate budget recommendations
   */
  async generateBudgetRecommendations(income, expenses, fixedPayments, goals) {
    const recommendations = [];
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const savingsRate = ((income - totalExpenses) / income) * 100;
    
    // Savings recommendation
    if (savingsRate < 10) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        title: 'Tasarruf Oranını Artır',
        description: `Şu anda gelirinizin %${savingsRate.toFixed(1)}'ini tasarruf ediyorsunuz. En az %20 hedefleyin.`,
        target: income * 0.2,
      });
    }
    
    // Category-specific recommendations
    expenses.forEach(expense => {
      const percentage = (parseFloat(expense.total) / income) * 100;
      if (percentage > 30 && expense.category !== 'Ev ve Yaşam') {
        recommendations.push({
          type: 'category',
          priority: 'medium',
          title: `${expense.category} Harcamalarını Azalt`,
          description: `Bu kategoride gelirinizin %${percentage.toFixed(1)}'ini harcıyorsunuz.`,
          target: income * 0.25,
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Evaluate budget performance
   * Compares actual spending against budgets and provides performance metrics
   */
  async evaluateBudgetPerformance(userId) {
    try {
      logger.info('Evaluating budget performance', { userId });

      // Get user's budgets
      const budgetsQuery = `
        SELECT 
          category,
          amount as budget_amount,
          period
        FROM budgets
        WHERE user_id = $1
          AND is_active = true
      `;
      const budgetsResult = await db.query(budgetsQuery, [userId]);
      const budgets = budgetsResult.rows;

      if (budgets.length === 0) {
        return {
          success: false,
          error: 'Henüz bütçe tanımlanmamış',
        };
      }

      // Get actual spending for current period
      const spendingQuery = `
        SELECT 
          category,
          SUM(amount) as actual_amount,
          COUNT(*) as transaction_count
        FROM transactions
        WHERE user_id = $1
          AND type = 'expense'
          AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY category
      `;
      const spendingResult = await db.query(spendingQuery, [userId]);
      const spending = spendingResult.rows;

      // Calculate performance for each category
      const categoryPerformance = [];
      let totalBudget = 0;
      let totalSpent = 0;
      let categoriesOnTrack = 0;
      let categoriesOverBudget = 0;

      budgets.forEach(budget => {
        const actualSpending = spending.find(s => s.category === budget.category);
        const actualAmount = actualSpending ? parseFloat(actualSpending.actual_amount) : 0;
        const budgetAmount = parseFloat(budget.budget_amount);
        const utilizationRate = (actualAmount / budgetAmount) * 100;
        const remaining = budgetAmount - actualAmount;

        totalBudget += budgetAmount;
        totalSpent += actualAmount;

        let status = 'on_track';
        if (utilizationRate > 100) {
          status = 'over_budget';
          categoriesOverBudget++;
        } else if (utilizationRate > 80) {
          status = 'warning';
        } else {
          categoriesOnTrack++;
        }

        categoryPerformance.push({
          category: budget.category,
          budgetAmount,
          actualAmount,
          remaining,
          utilizationRate: Math.round(utilizationRate),
          status,
          transactionCount: actualSpending ? parseInt(actualSpending.transaction_count) : 0,
        });
      });

      // Calculate overall performance score (0-100)
      const overallUtilization = (totalSpent / totalBudget) * 100;
      let performanceScore = 100;
      
      if (overallUtilization > 100) {
        performanceScore = Math.max(0, 100 - (overallUtilization - 100));
      } else if (overallUtilization > 90) {
        performanceScore = 90;
      } else if (overallUtilization > 80) {
        performanceScore = 95;
      }

      // Generate achievements
      const achievements = [];
      if (categoriesOnTrack >= budgets.length * 0.8) {
        achievements.push({
          title: 'Bütçe Kahramanı',
          description: 'Kategorilerin çoğunda bütçe hedeflerinize uyuyorsunuz',
          icon: 'trophy',
        });
      }
      if (overallUtilization < 80) {
        achievements.push({
          title: 'Tasarruf Ustası',
          description: 'Bütçenizin %20\'sinden fazlasını tasarruf ediyorsunuz',
          icon: 'savings',
        });
      }

      // Generate improvement suggestions
      const improvements = await this.suggestBudgetAdjustments(
        userId,
        categoryPerformance,
        totalBudget,
        totalSpent
      );

      return {
        success: true,
        data: {
          performanceScore: Math.round(performanceScore),
          overallUtilization: Math.round(overallUtilization),
          totalBudget,
          totalSpent,
          totalRemaining: totalBudget - totalSpent,
          categoriesOnTrack,
          categoriesOverBudget,
          categoryPerformance: categoryPerformance.sort((a, b) => b.utilizationRate - a.utilizationRate),
          achievements,
          improvements,
          period: 'current_month',
          evaluatedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      logger.error('Budget performance evaluation error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Suggest budget adjustments
   * Provides actionable recommendations to improve budget performance
   */
  async suggestBudgetAdjustments(userId, categoryPerformance, totalBudget, totalSpent) {
    try {
      const suggestions = [];

      // Analyze each category
      categoryPerformance.forEach(cat => {
        if (cat.status === 'over_budget') {
          suggestions.push({
            type: 'reduce_spending',
            priority: 'high',
            category: cat.category,
            title: `${cat.category} Harcamalarını Azaltın`,
            description: `Bu kategoride bütçenizi %${(cat.utilizationRate - 100).toFixed(0)} aştınız. ${Math.abs(cat.remaining).toFixed(2)} TL fazla harcadınız.`,
            action: 'Önümüzdeki günlerde bu kategorideki harcamalarınızı sınırlandırın',
            targetReduction: Math.abs(cat.remaining),
          });
        } else if (cat.status === 'warning') {
          suggestions.push({
            type: 'monitor',
            priority: 'medium',
            category: cat.category,
            title: `${cat.category} Kategorisini İzleyin`,
            description: `Bütçenizin %${cat.utilizationRate}'ini kullandınız. ${cat.remaining.toFixed(2)} TL kaldı.`,
            action: 'Ay sonuna kadar dikkatli harcama yapın',
            remainingBudget: cat.remaining,
          });
        } else if (cat.utilizationRate < 50 && cat.budgetAmount > 500) {
          suggestions.push({
            type: 'reallocate',
            priority: 'low',
            category: cat.category,
            title: `${cat.category} Bütçesini Yeniden Değerlendirin`,
            description: `Bu kategoride bütçenizin sadece %${cat.utilizationRate}'ini kullandınız.`,
            action: 'Fazla bütçeyi başka kategorilere aktarabilirsiniz',
            availableAmount: cat.remaining,
          });
        }
      });

      // Overall budget suggestions
      const utilizationRate = (totalSpent / totalBudget) * 100;
      
      if (utilizationRate > 100) {
        suggestions.push({
          type: 'emergency',
          priority: 'critical',
          category: 'Genel',
          title: 'Acil Bütçe Ayarlaması Gerekli',
          description: `Toplam bütçenizi %${(utilizationRate - 100).toFixed(1)} aştınız.`,
          action: 'Gelecek ay için bütçenizi artırın veya harcamalarınızı ciddi şekilde kısın',
          overspent: totalSpent - totalBudget,
        });
      } else if (utilizationRate < 70) {
        suggestions.push({
          type: 'optimize',
          priority: 'low',
          category: 'Genel',
          title: 'Bütçe Optimizasyonu',
          description: `Toplam bütçenizin %${(100 - utilizationRate).toFixed(1)}'i kullanılmadı.`,
          action: 'Bütçenizi daha gerçekçi hedeflere göre ayarlayabilirsiniz',
          unused: totalBudget - totalSpent,
        });
      }

      // Get AI-powered suggestions if available
      try {
        const aiSuggestions = await this.getAIBudgetSuggestions(
          userId,
          categoryPerformance,
          totalBudget,
          totalSpent
        );
        if (aiSuggestions && aiSuggestions.length > 0) {
          suggestions.push(...aiSuggestions);
        }
      } catch (aiError) {
        logger.warn('AI suggestions failed, using rule-based only', { error: aiError.message });
      }

      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return suggestions;

    } catch (error) {
      logger.error('Budget adjustment suggestions error', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get AI-powered budget suggestions
   */
  async getAIBudgetSuggestions(userId, categoryPerformance, totalBudget, totalSpent) {
    try {
      const prompt = `
Analyze this budget performance data and provide actionable suggestions:

Total Budget: ${totalBudget.toFixed(2)} TL
Total Spent: ${totalSpent.toFixed(2)} TL
Utilization: ${((totalSpent / totalBudget) * 100).toFixed(1)}%

Category Performance:
${JSON.stringify(categoryPerformance, null, 2)}

Provide 2-3 specific, actionable suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "string (reduce_spending, increase_budget, reallocate, etc.)",
      "priority": "string (high, medium, low)",
      "category": "string",
      "title": "string (short title in Turkish)",
      "description": "string (detailed explanation in Turkish)",
      "action": "string (specific action to take in Turkish)",
      "expectedImpact": "string (expected result in Turkish)"
    }
  ]
}

Focus on:
- Categories that are over budget or at risk
- Realistic and achievable actions
- Specific amounts and percentages
- Turkish language

Respond ONLY with valid JSON.
`;

      const result = await this.geminiService.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suggestions || [];
      }

      return [];

    } catch (error) {
      logger.error('AI budget suggestions error', { error: error.message });
      return [];
    }
  }
}

// Export singleton instance
module.exports = new PredictiveAnalyticsService();
