const geminiAIService = require('./geminiAIService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * NaturalLanguageService - Process natural language queries about financial data
 * Supports both Turkish and English queries
 */
class NaturalLanguageService {
  constructor() {
    this.geminiService = geminiAIService;
    
    // Common query patterns for quick matching
    this.queryPatterns = {
      spending: ['harcama', 'gider', 'spending', 'expense'],
      income: ['gelir', 'kazanç', 'income', 'earning'],
      balance: ['bakiye', 'balance', 'kalan'],
      category: ['kategori', 'category'],
      timeframe: ['ay', 'hafta', 'gün', 'yıl', 'month', 'week', 'day', 'year'],
      comparison: ['karşılaştır', 'fark', 'compare', 'difference'],
    };
  }

  /**
   * Process natural language query
   */
  async processQuery(query, userId, userContext = {}) {
    try {
      logger.info('Processing NL query', { userId, query });

      // Step 1: Parse the query using AI
      const interpretation = await this.interpretQuery(query, userContext);
      
      if (!interpretation.success) {
        return interpretation;
      }

      // Step 2: Execute the query based on interpretation
      const data = await this.executeQuery(interpretation.data, userId);

      // Step 3: Generate response with visualizations
      const response = await this.formatResponse(interpretation.data, data, query);

      // Step 4: Generate suggestions for related queries
      const suggestions = await this.generateSuggestions(query, interpretation.data);

      return {
        success: true,
        data: {
          interpretation: interpretation.data,
          results: data,
          response: response,
          suggestions: suggestions,
          visualizations: this.getVisualizationConfig(interpretation.data, data),
        },
      };

    } catch (error) {
      logger.error('NL query processing error', {
        error: error.message,
        userId,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Interpret natural language query using AI
   */
  async interpretQuery(query, userContext) {
    try {
      const prompt = `
Analyze this financial query and extract structured information:

Query: "${query}"
Language: ${this.detectLanguage(query)}

Extract the following information in JSON format:
{
  "intent": "spending|income|balance|comparison|summary|trend",
  "entities": {
    "timeframe": {
      "type": "last_month|this_month|last_week|this_week|custom",
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    },
    "categories": ["category1", "category2"],
    "accounts": ["account_name"],
    "amount": {
      "operator": "greater_than|less_than|equal|between",
      "value": number
    },
    "aggregation": "sum|average|count|max|min"
  },
  "filters": {
    "type": "income|expense|all",
    "minAmount": number,
    "maxAmount": number
  },
  "needsClarification": boolean,
  "clarificationQuestion": "string if needs clarification",
  "confidence": 0-100
}

Examples:
- "Geçen ay market harcamalarım ne kadar?" -> intent: spending, timeframe: last_month, categories: ["Yiyecek ve İçecek"]
- "Bu hafta gelirlerim toplamı" -> intent: income, timeframe: this_week
- "Son 3 aydaki ulaşım giderlerimi karşılaştır" -> intent: comparison, timeframe: last_3_months, categories: ["Ulaşım"]

Respond ONLY with valid JSON, no additional text.
`;

      const result = await this.geminiService.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and enhance the interpretation
        const enhanced = this.enhanceInterpretation(parsed, query);
        
        return {
          success: true,
          data: enhanced,
        };
      }

      throw new Error('Invalid AI response format');

    } catch (error) {
      logger.error('Query interpretation error', { error: error.message });
      return {
        success: false,
        error: 'Sorgunuz anlaşılamadı. Lütfen daha açık bir şekilde sorun.',
      };
    }
  }

  /**
   * Execute the interpreted query against database
   */
  async executeQuery(interpretation, userId) {
    try {
      const { intent, entities, filters } = interpretation;

      switch (intent) {
        case 'spending':
          return await this.getSpendingData(userId, entities, filters);
        
        case 'income':
          return await this.getIncomeData(userId, entities, filters);
        
        case 'balance':
          return await this.getBalanceData(userId, entities);
        
        case 'comparison':
          return await this.getComparisonData(userId, entities, filters);
        
        case 'summary':
          return await this.getSummaryData(userId, entities, filters);
        
        case 'trend':
          return await this.getTrendData(userId, entities, filters);
        
        default:
          throw new Error('Unknown query intent');
      }

    } catch (error) {
      logger.error('Query execution error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get spending data
   */
  async getSpendingData(userId, entities, filters) {
    const { timeframe, categories, aggregation = 'sum' } = entities;
    
    let query = `
      SELECT 
        t.category,
        ${aggregation === 'count' ? 'COUNT(*)' : `${aggregation.toUpperCase()}(t.amount)`} as value,
        COUNT(*) as transaction_count
      FROM transactions t
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
    `;
    
    const params = [userId, timeframe.start, timeframe.end];
    
    if (categories && categories.length > 0) {
      query += ` AND t.category = ANY($4)`;
      params.push(categories);
    }
    
    query += ` GROUP BY t.category ORDER BY value DESC`;
    
    const result = await db.query(query, params);
    
    return {
      type: 'spending',
      timeframe,
      data: result.rows,
      total: result.rows.reduce((sum, row) => sum + parseFloat(row.value), 0),
      count: result.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0),
    };
  }

  /**
   * Get income data
   */
  async getIncomeData(userId, entities, filters) {
    const { timeframe, aggregation = 'sum' } = entities;
    
    const query = `
      SELECT 
        t.category,
        ${aggregation === 'count' ? 'COUNT(*)' : `${aggregation.toUpperCase()}(t.amount)`} as value,
        COUNT(*) as transaction_count
      FROM transactions t
      WHERE t.user_id = $1
        AND t.type = 'income'
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
      GROUP BY t.category
      ORDER BY value DESC
    `;
    
    const result = await db.query(query, [userId, timeframe.start, timeframe.end]);
    
    return {
      type: 'income',
      timeframe,
      data: result.rows,
      total: result.rows.reduce((sum, row) => sum + parseFloat(row.value), 0),
      count: result.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0),
    };
  }

  /**
   * Get balance data
   */
  async getBalanceData(userId, entities) {
    const query = `
      SELECT 
        a.name,
        a.balance,
        a.currency,
        a.type
      FROM accounts a
      WHERE a.user_id = $1
      ORDER BY a.balance DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    return {
      type: 'balance',
      data: result.rows,
      total: result.rows.reduce((sum, row) => sum + parseFloat(row.balance), 0),
    };
  }

  /**
   * Get comparison data
   */
  async getComparisonData(userId, entities, filters) {
    // Compare current period with previous period
    const { timeframe, categories } = entities;
    
    // Calculate previous period
    const start = new Date(timeframe.start);
    const end = new Date(timeframe.end);
    const duration = end - start;
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start);
    
    // Get current period data
    const current = await this.getSpendingData(userId, entities, filters);
    
    // Get previous period data
    const previous = await this.getSpendingData(
      userId,
      { ...entities, timeframe: { start: prevStart.toISOString().split('T')[0], end: prevEnd.toISOString().split('T')[0] } },
      filters
    );
    
    return {
      type: 'comparison',
      current,
      previous,
      change: {
        amount: current.total - previous.total,
        percentage: previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0,
      },
    };
  }

  /**
   * Get summary data
   */
  async getSummaryData(userId, entities, filters) {
    const { timeframe } = entities;
    
    const query = `
      SELECT 
        t.type,
        SUM(t.amount) as total,
        COUNT(*) as count,
        AVG(t.amount) as average
      FROM transactions t
      WHERE t.user_id = $1
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
      GROUP BY t.type
    `;
    
    const result = await db.query(query, [userId, timeframe.start, timeframe.end]);
    
    const summary = {
      income: 0,
      expense: 0,
      net: 0,
      transactions: 0,
    };
    
    result.rows.forEach(row => {
      if (row.type === 'income') {
        summary.income = parseFloat(row.total);
      } else if (row.type === 'expense') {
        summary.expense = parseFloat(row.total);
      }
      summary.transactions += parseInt(row.count);
    });
    
    summary.net = summary.income - summary.expense;
    
    return {
      type: 'summary',
      timeframe,
      data: summary,
    };
  }

  /**
   * Get trend data
   */
  async getTrendData(userId, entities, filters) {
    const { timeframe, categories } = entities;
    
    let query = `
      SELECT 
        DATE_TRUNC('day', t.transaction_date) as date,
        SUM(t.amount) as value,
        COUNT(*) as count
      FROM transactions t
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
    `;
    
    const params = [userId, timeframe.start, timeframe.end];
    
    if (categories && categories.length > 0) {
      query += ` AND t.category = ANY($4)`;
      params.push(categories);
    }
    
    query += ` GROUP BY DATE_TRUNC('day', t.transaction_date) ORDER BY date`;
    
    const result = await db.query(query, params);
    
    return {
      type: 'trend',
      timeframe,
      data: result.rows,
    };
  }

  /**
   * Format response with natural language
   */
  async formatResponse(interpretation, data, originalQuery) {
    const { intent, entities } = interpretation;
    const lang = this.detectLanguage(originalQuery);
    
    let response = '';
    
    if (lang === 'tr') {
      switch (intent) {
        case 'spending':
          response = `${this.formatTimeframe(entities.timeframe, 'tr')} toplam ${data.total.toFixed(2)} TL harcama yaptınız. `;
          if (data.data.length > 0) {
            response += `En çok harcama yaptığınız kategori: ${data.data[0].category} (${parseFloat(data.data[0].value).toFixed(2)} TL)`;
          }
          break;
        
        case 'income':
          response = `${this.formatTimeframe(entities.timeframe, 'tr')} toplam ${data.total.toFixed(2)} TL gelir elde ettiniz.`;
          break;
        
        case 'balance':
          response = `Toplam bakiyeniz: ${data.total.toFixed(2)} TL. ${data.data.length} hesabınız bulunuyor.`;
          break;
        
        case 'comparison':
          const change = data.change.percentage > 0 ? 'artış' : 'azalış';
          response = `Bir önceki döneme göre %${Math.abs(data.change.percentage).toFixed(1)} ${change} var. `;
          response += `Fark: ${Math.abs(data.change.amount).toFixed(2)} TL`;
          break;
        
        case 'summary':
          response = `${this.formatTimeframe(entities.timeframe, 'tr')} özet: `;
          response += `Gelir: ${data.data.income.toFixed(2)} TL, `;
          response += `Gider: ${data.data.expense.toFixed(2)} TL, `;
          response += `Net: ${data.data.net.toFixed(2)} TL`;
          break;
        
        default:
          response = 'Sorgunuz işlendi.';
      }
    } else {
      // English responses
      switch (intent) {
        case 'spending':
          response = `You spent ${data.total.toFixed(2)} TL ${this.formatTimeframe(entities.timeframe, 'en')}. `;
          if (data.data.length > 0) {
            response += `Top category: ${data.data[0].category} (${parseFloat(data.data[0].value).toFixed(2)} TL)`;
          }
          break;
        
        case 'income':
          response = `You earned ${data.total.toFixed(2)} TL ${this.formatTimeframe(entities.timeframe, 'en')}.`;
          break;
        
        default:
          response = 'Query processed.';
      }
    }
    
    return response;
  }

  /**
   * Generate related query suggestions
   */
  async generateSuggestions(originalQuery, interpretation) {
    const lang = this.detectLanguage(originalQuery);
    const { intent, entities } = interpretation;
    
    const suggestions = [];
    
    if (lang === 'tr') {
      if (intent === 'spending') {
        suggestions.push('Bu ayki gelirlerim ne kadar?');
        suggestions.push('Geçen ayla karşılaştır');
        suggestions.push('Kategori bazında detay göster');
      } else if (intent === 'income') {
        suggestions.push('Giderlerimi de göster');
        suggestions.push('Net kazancım ne kadar?');
      }
      suggestions.push('Hesap bakiyelerimi göster');
      suggestions.push('Son 3 ayın özeti');
    } else {
      if (intent === 'spending') {
        suggestions.push('Show my income this month');
        suggestions.push('Compare with last month');
      }
      suggestions.push('Show account balances');
      suggestions.push('Summary of last 3 months');
    }
    
    return suggestions.slice(0, 5);
  }

  /**
   * Get visualization configuration
   */
  getVisualizationConfig(interpretation, data) {
    const { intent } = interpretation;
    
    const config = {
      type: 'none',
      data: null,
    };
    
    switch (intent) {
      case 'spending':
      case 'income':
        config.type = 'pie';
        config.data = data.data.map(item => ({
          name: item.category,
          value: parseFloat(item.value),
        }));
        break;
      
      case 'comparison':
        config.type = 'bar';
        config.data = [
          { name: 'Önceki Dönem', value: data.previous.total },
          { name: 'Bu Dönem', value: data.current.total },
        ];
        break;
      
      case 'trend':
        config.type = 'line';
        config.data = data.data.map(item => ({
          date: item.date,
          value: parseFloat(item.value),
        }));
        break;
      
      case 'summary':
        config.type = 'bar';
        config.data = [
          { name: 'Gelir', value: data.data.income },
          { name: 'Gider', value: data.data.expense },
          { name: 'Net', value: data.data.net },
        ];
        break;
    }
    
    return config;
  }

  /**
   * Enhance interpretation with defaults and validation
   */
  enhanceInterpretation(parsed, query) {
    // Set default timeframe if not specified
    if (!parsed.entities.timeframe) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      parsed.entities.timeframe = {
        type: 'this_month',
        start: firstDay.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    }
    
    // Set default aggregation
    if (!parsed.entities.aggregation) {
      parsed.entities.aggregation = 'sum';
    }
    
    return parsed;
  }

  /**
   * Detect query language
   */
  detectLanguage(query) {
    const turkishChars = /[çğıöşü]/i;
    const turkishWords = /\b(ne|kadar|toplam|ay|hafta|gün|harcama|gelir|bakiye)\b/i;
    
    if (turkishChars.test(query) || turkishWords.test(query)) {
      return 'tr';
    }
    return 'en';
  }

  /**
   * Format timeframe for display
   */
  formatTimeframe(timeframe, lang) {
    if (lang === 'tr') {
      switch (timeframe.type) {
        case 'last_month': return 'geçen ay';
        case 'this_month': return 'bu ay';
        case 'last_week': return 'geçen hafta';
        case 'this_week': return 'bu hafta';
        default: return `${timeframe.start} - ${timeframe.end} arası`;
      }
    } else {
      switch (timeframe.type) {
        case 'last_month': return 'last month';
        case 'this_month': return 'this month';
        case 'last_week': return 'last week';
        case 'this_week': return 'this week';
        default: return `between ${timeframe.start} and ${timeframe.end}`;
      }
    }
  }
}

// Export singleton instance
module.exports = new NaturalLanguageService();
