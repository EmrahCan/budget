const geminiAIService = require('./geminiAIService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * FinancialCoachService - AI-powered financial coaching
 * Provides personalized financial advice and health reports
 */
class FinancialCoachService {
  constructor() {
    this.geminiService = geminiAIService;
  }

  /**
   * Answer user's financial question
   * @param {string} question - User's question
   * @param {string} userId - User ID
   * @param {Object} context - User's financial context
   * @returns {Object} AI response with answer and suggestions
   */
  async answerQuestion(question, userId, context = {}) {
    try {
      logger.info('Financial coach answering question', { userId, question });

      // Get user's financial data for context
      const financialData = await this.getUserFinancialData(userId);

      // Build context-aware prompt
      const prompt = this.buildCoachPrompt(question, financialData, context);

      // Get AI response
      const result = await this.geminiService.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response
      const answer = this.parseCoachResponse(text);

      // Store conversation in database
      await this.storeConversation(userId, question, answer);

      return {
        success: true,
        data: {
          answer: answer.text,
          suggestions: answer.suggestions || [],
          resources: answer.resources || [],
          followUpQuestions: answer.followUpQuestions || [],
        },
      };
    } catch (error) {
      logger.error('Financial coach error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate financial health report
   * @param {string} userId - User ID
   * @returns {Object} Health report with score and recommendations
   */
  async generateHealthReport(userId) {
    try {
      logger.info('Generating financial health report', { userId });

      const financialData = await this.getUserFinancialData(userId);

      // Calculate health score (0-100)
      const healthScore = this.calculateHealthScore(financialData);

      // Generate AI insights
      const insights = await this.generateHealthInsights(financialData, healthScore);

      // Get recommendations
      const recommendations = this.generateRecommendations(financialData, healthScore);

      return {
        success: true,
        data: {
          healthScore,
          insights,
          recommendations,
          metrics: {
            savingsRate: financialData.savingsRate,
            debtToIncome: financialData.debtToIncome,
            budgetAdherence: financialData.budgetAdherence,
            emergencyFund: financialData.emergencyFund,
          },
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Health report generation error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Track user's financial progress
   * @param {string} userId - User ID
   * @returns {Object} Progress data
   */
  async trackProgress(userId) {
    try {
      const query = `
        SELECT 
          created_at,
          request_data,
          response_data
        FROM ai_interactions
        WHERE user_id = $1
          AND interaction_type = 'financial_coach'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const result = await db.query(query, [userId]);

      return {
        success: true,
        data: {
          recentSessions: result.rows.length,
          lastSession: result.rows[0]?.created_at || null,
          topics: this.extractTopics(result.rows),
        },
      };
    } catch (error) {
      logger.error('Progress tracking error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's financial data
   */
  async getUserFinancialData(userId) {
    // Get income
    const incomeQuery = `
      SELECT AVG(amount) as avg_income
      FROM transactions
      WHERE user_id = $1
        AND type = 'income'
        AND transaction_date >= NOW() - INTERVAL '3 months'
    `;
    const incomeResult = await db.query(incomeQuery, [userId]);
    const avgIncome = parseFloat(incomeResult.rows[0]?.avg_income || 0);

    // Get expenses
    const expenseQuery = `
      SELECT 
        SUM(amount) as total_expense,
        AVG(amount) as avg_expense
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND transaction_date >= NOW() - INTERVAL '3 months'
    `;
    const expenseResult = await db.query(expenseQuery, [userId]);
    const totalExpense = parseFloat(expenseResult.rows[0]?.total_expense || 0);
    const avgExpense = parseFloat(expenseResult.rows[0]?.avg_expense || 0);

    // Get category breakdown
    const categoryQuery = `
      SELECT 
        category,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = $1
        AND type = 'expense'
        AND transaction_date >= NOW() - INTERVAL '3 months'
      GROUP BY category
      ORDER BY total DESC
      LIMIT 5
    `;
    const categoryResult = await db.query(categoryQuery, [userId]);

    // Calculate metrics
    const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;
    const debtToIncome = 0; // Simplified - would need debt data
    const budgetAdherence = 75; // Simplified - would need budget comparison
    const emergencyFund = 0; // Simplified - would need savings account data

    return {
      avgIncome,
      avgExpense,
      totalExpense,
      savingsRate,
      debtToIncome,
      budgetAdherence,
      emergencyFund,
      topCategories: categoryResult.rows,
    };
  }

  /**
   * Build context-aware prompt for coach
   */
  buildCoachPrompt(question, financialData, context) {
    return `
Sen bir uzman finansal danışmansın. Kullanıcının finansal durumunu analiz edip Türkçe olarak yardımcı ol.

Kullanıcının Finansal Durumu:
- Ortalama Aylık Gelir: ${financialData.avgIncome.toFixed(2)} TL
- Ortalama Aylık Gider: ${financialData.avgExpense.toFixed(2)} TL
- Tasarruf Oranı: %${financialData.savingsRate.toFixed(1)}
- En Çok Harcama Yapılan Kategoriler: ${financialData.topCategories.map(c => c.category).join(', ')}

Kullanıcının Sorusu: "${question}"

Lütfen şu formatta yanıt ver:

CEVAP:
[Soruya detaylı ve kişiselleştirilmiş cevap]

ÖNERİLER:
- [Öneri 1]
- [Öneri 2]
- [Öneri 3]

TAKİP SORULARI:
- [Takip sorusu 1]
- [Takip sorusu 2]

Yanıtın pratik, uygulanabilir ve kullanıcının mevcut finansal durumuna uygun olsun.
`;
  }

  /**
   * Parse coach response
   */
  parseCoachResponse(text) {
    const sections = {
      text: '',
      suggestions: [],
      followUpQuestions: [],
    };

    // Extract main answer
    const answerMatch = text.match(/CEVAP:([\s\S]*?)(?:ÖNERİLER:|TAKİP SORULARI:|$)/i);
    if (answerMatch) {
      sections.text = answerMatch[1].trim();
    } else {
      sections.text = text;
    }

    // Extract suggestions
    const suggestionsMatch = text.match(/ÖNERİLER:([\s\S]*?)(?:TAKİP SORULARI:|$)/i);
    if (suggestionsMatch) {
      sections.suggestions = suggestionsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim());
    }

    // Extract follow-up questions
    const followUpMatch = text.match(/TAKİP SORULARI:([\s\S]*?)$/i);
    if (followUpMatch) {
      sections.followUpQuestions = followUpMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim());
    }

    return sections;
  }

  /**
   * Calculate health score
   */
  calculateHealthScore(financialData) {
    let score = 0;

    // Savings rate (0-30 points)
    if (financialData.savingsRate >= 20) score += 30;
    else if (financialData.savingsRate >= 10) score += 20;
    else if (financialData.savingsRate >= 5) score += 10;

    // Budget adherence (0-25 points)
    score += (financialData.budgetAdherence / 100) * 25;

    // Debt to income (0-25 points)
    if (financialData.debtToIncome === 0) score += 25;
    else if (financialData.debtToIncome < 20) score += 20;
    else if (financialData.debtToIncome < 40) score += 10;

    // Emergency fund (0-20 points)
    if (financialData.emergencyFund >= 6) score += 20;
    else if (financialData.emergencyFund >= 3) score += 15;
    else if (financialData.emergencyFund >= 1) score += 10;

    return Math.round(score);
  }

  /**
   * Generate health insights
   */
  async generateHealthInsights(financialData, healthScore) {
    const insights = [];

    if (healthScore >= 80) {
      insights.push({
        type: 'success',
        title: 'Mükemmel Finansal Sağlık',
        description: 'Finansal durumunuz çok iyi. Mevcut alışkanlıklarınızı sürdürün.',
      });
    } else if (healthScore >= 60) {
      insights.push({
        type: 'info',
        title: 'İyi Finansal Sağlık',
        description: 'Finansal durumunuz iyi, ancak iyileştirme alanları var.',
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Dikkat Gerekli',
        description: 'Finansal sağlığınızı iyileştirmek için adımlar atmalısınız.',
      });
    }

    // Savings rate insight
    if (financialData.savingsRate < 10) {
      insights.push({
        type: 'warning',
        title: 'Düşük Tasarruf Oranı',
        description: `Tasarruf oranınız %${financialData.savingsRate.toFixed(1)}. En az %20 hedefleyin.`,
      });
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(financialData, healthScore) {
    const recommendations = [];

    if (financialData.savingsRate < 20) {
      recommendations.push({
        priority: 'high',
        title: 'Tasarruf Oranını Artır',
        description: 'Gelirin en az %20\'sini tasarruf etmeyi hedefle',
        action: 'Otomatik tasarruf planı oluştur',
      });
    }

    if (financialData.topCategories.length > 0) {
      const topCategory = financialData.topCategories[0];
      recommendations.push({
        priority: 'medium',
        title: `${topCategory.category} Harcamalarını Gözden Geçir`,
        description: `Bu kategoride ${topCategory.total.toFixed(2)} TL harcama yaptınız`,
        action: 'Gereksiz harcamaları belirle ve azalt',
      });
    }

    return recommendations;
  }

  /**
   * Store conversation
   */
  async storeConversation(userId, question, answer) {
    try {
      await db.query(
        `
        INSERT INTO ai_interactions (
          user_id,
          interaction_type,
          request_data,
          response_data,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `,
        [
          userId,
          'financial_coach',
          JSON.stringify({ question }),
          JSON.stringify({ answer: answer.text, suggestions: answer.suggestions }),
        ]
      );
    } catch (error) {
      logger.error('Store conversation error', { error: error.message });
    }
  }

  /**
   * Extract topics from sessions
   */
  extractTopics(sessions) {
    const topics = new Set();
    sessions.forEach(session => {
      if (session.request_data?.question) {
        // Simple topic extraction - could be improved with NLP
        const question = session.request_data.question.toLowerCase();
        if (question.includes('tasarruf')) topics.add('Tasarruf');
        if (question.includes('bütçe')) topics.add('Bütçe');
        if (question.includes('borç')) topics.add('Borç');
        if (question.includes('yatırım')) topics.add('Yatırım');
      }
    });
    return Array.from(topics);
  }
}

// Export singleton instance
module.exports = new FinancialCoachService();
