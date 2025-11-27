const geminiAIService = require('./geminiAIService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * CategorizationService - Smart transaction categorization with learning
 * Uses Gemini AI and learns from user corrections
 */
class CategorizationService {
  constructor() {
    this.geminiService = geminiAIService;
    
    // Available categories (should match your app's categories)
    this.categories = [
      'Yiyecek ve İçecek',
      'Ulaşım',
      'Alışveriş',
      'Faturalar',
      'Eğlence',
      'Sağlık',
      'Eğitim',
      'Ev ve Yaşam',
      'Teknoloji',
      'Giyim',
      'Seyahat',
      'Diğer'
    ];
  }

  /**
   * Categorize a transaction using AI and user learning data
   */
  async categorizeTransaction(description, amount, userId, context = {}) {
    try {
      // First, check if we have learned patterns for this user
      const learnedCategory = await this.getLearnedCategory(userId, description);
      
      if (learnedCategory && learnedCategory.confidence >= 90) {
        logger.info('Using learned category', {
          userId,
          description,
          category: learnedCategory.category
        });
        
        return {
          success: true,
          data: {
            category: learnedCategory.category,
            confidence: learnedCategory.confidence,
            reasoning: 'Daha önce benzer işlemler için bu kategoriyi seçtiniz',
            source: 'learned',
            suggestedTags: [],
            alternativeCategories: []
          }
        };
      }

      // If no strong learned pattern, use AI
      const aiResult = await this.geminiService.categorizeExpense(
        description,
        amount,
        { ...context, userId }
      );

      if (!aiResult.success) {
        return aiResult;
      }

      // Combine AI result with learned data if available
      if (learnedCategory && learnedCategory.confidence >= 70) {
        // Boost confidence if AI agrees with learned pattern
        if (aiResult.data.category === learnedCategory.category) {
          aiResult.data.confidence = Math.min(100, aiResult.data.confidence + 10);
          aiResult.data.reasoning += ' (Geçmiş tercihlerinizle uyumlu)';
        } else {
          // Add learned category as alternative
          if (!aiResult.data.alternativeCategories.includes(learnedCategory.category)) {
            aiResult.data.alternativeCategories.unshift(learnedCategory.category);
          }
        }
      }

      return aiResult;

    } catch (error) {
      logger.error('Categorization error', {
        error: error.message,
        userId,
        description
      });

      return {
        success: false,
        error: error.message,
        fallback: {
          category: 'Diğer',
          confidence: 0,
          reasoning: 'Kategorilendirme başarısız oldu',
          source: 'fallback',
          suggestedTags: [],
          alternativeCategories: []
        }
      };
    }
  }

  /**
   * Get learned category from user's history
   */
  async getLearnedCategory(userId, description) {
    try {
      // Normalize description for matching
      const normalizedDesc = description.toLowerCase().trim();
      
      // Look for exact or similar patterns
      const result = await db.query(`
        SELECT 
          actual_category,
          frequency,
          COUNT(*) OVER (PARTITION BY actual_category) as category_count
        FROM category_learning
        WHERE user_id = $1
          AND (
            LOWER(description_pattern) = $2
            OR LOWER(description_pattern) LIKE $3
            OR $2 LIKE LOWER(description_pattern)
          )
        ORDER BY frequency DESC, last_used DESC
        LIMIT 1
      `, [userId, normalizedDesc, `%${normalizedDesc}%`]);

      if (result.rows.length > 0) {
        const learned = result.rows[0];
        
        // Calculate confidence based on frequency
        const confidence = Math.min(95, 70 + (learned.frequency * 5));
        
        return {
          category: learned.actual_category,
          confidence,
          frequency: learned.frequency
        };
      }

      return null;

    } catch (error) {
      logger.error('Error getting learned category', {
        error: error.message,
        userId
      });
      return null;
    }
  }

  /**
   * Learn from user correction
   */
  async learnFromCorrection(userId, transactionId, description, suggestedCategory, actualCategory) {
    try {
      // Don't learn if user accepted the suggestion
      if (suggestedCategory === actualCategory) {
        return { success: true, message: 'No correction needed' };
      }

      const normalizedDesc = description.toLowerCase().trim();

      // Check if pattern already exists
      const existing = await db.query(`
        SELECT id, frequency
        FROM category_learning
        WHERE user_id = $1
          AND LOWER(description_pattern) = $2
          AND actual_category = $3
      `, [userId, normalizedDesc, actualCategory]);

      if (existing.rows.length > 0) {
        // Update existing pattern
        await db.query(`
          UPDATE category_learning
          SET frequency = frequency + 1,
              last_used = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [existing.rows[0].id]);

        logger.info('Updated learning pattern', {
          userId,
          pattern: normalizedDesc,
          category: actualCategory,
          newFrequency: existing.rows[0].frequency + 1
        });

      } else {
        // Insert new pattern
        await db.query(`
          INSERT INTO category_learning 
          (user_id, description_pattern, suggested_category, actual_category, frequency, last_used)
          VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
        `, [userId, normalizedDesc, suggestedCategory, actualCategory]);

        logger.info('Created new learning pattern', {
          userId,
          pattern: normalizedDesc,
          category: actualCategory
        });
      }

      return {
        success: true,
        message: 'Learning pattern updated successfully'
      };

    } catch (error) {
      logger.error('Error learning from correction', {
        error: error.message,
        userId,
        transactionId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's categorization statistics
   */
  async getUserCategorizationStats(userId) {
    try {
      const stats = await db.query(`
        SELECT 
          COUNT(*) as total_patterns,
          SUM(frequency) as total_corrections,
          COUNT(DISTINCT actual_category) as categories_used,
          MAX(last_used) as last_correction
        FROM category_learning
        WHERE user_id = $1
      `, [userId]);

      const topPatterns = await db.query(`
        SELECT 
          description_pattern,
          actual_category,
          frequency,
          last_used
        FROM category_learning
        WHERE user_id = $1
        ORDER BY frequency DESC, last_used DESC
        LIMIT 10
      `, [userId]);

      return {
        success: true,
        data: {
          summary: stats.rows[0],
          topPatterns: topPatterns.rows
        }
      };

    } catch (error) {
      logger.error('Error getting categorization stats', {
        error: error.message,
        userId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch categorize multiple transactions
   */
  async batchCategorize(userId, transactions) {
    try {
      const results = [];

      for (const transaction of transactions) {
        const result = await this.categorizeTransaction(
          transaction.description,
          transaction.amount,
          userId,
          transaction.context || {}
        );

        results.push({
          transactionId: transaction.id,
          description: transaction.description,
          ...result
        });
      }

      return {
        success: true,
        data: results
      };

    } catch (error) {
      logger.error('Batch categorization error', {
        error: error.message,
        userId,
        count: transactions.length
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get category suggestions based on partial description
   */
  async getSuggestions(userId, partialDescription, limit = 5) {
    try {
      if (!partialDescription || partialDescription.length < 2) {
        return { success: true, data: [] };
      }

      const normalizedDesc = partialDescription.toLowerCase().trim();

      // Get learned patterns that match
      const learned = await db.query(`
        SELECT DISTINCT
          actual_category,
          description_pattern,
          frequency
        FROM category_learning
        WHERE user_id = $1
          AND LOWER(description_pattern) LIKE $2
        ORDER BY frequency DESC, last_used DESC
        LIMIT $3
      `, [userId, `%${normalizedDesc}%`, limit]);

      return {
        success: true,
        data: learned.rows.map(row => ({
          category: row.actual_category,
          pattern: row.description_pattern,
          confidence: Math.min(95, 70 + (row.frequency * 5))
        }))
      };

    } catch (error) {
      logger.error('Error getting suggestions', {
        error: error.message,
        userId
      });

      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Clear learning data for a user
   */
  async clearLearningData(userId, category = null) {
    try {
      if (category) {
        // Clear specific category
        await db.query(`
          DELETE FROM category_learning
          WHERE user_id = $1 AND actual_category = $2
        `, [userId, category]);

        logger.info('Cleared learning data for category', {
          userId,
          category
        });

      } else {
        // Clear all learning data
        await db.query(`
          DELETE FROM category_learning
          WHERE user_id = $1
        `, [userId]);

        logger.info('Cleared all learning data', { userId });
      }

      return {
        success: true,
        message: 'Learning data cleared successfully'
      };

    } catch (error) {
      logger.error('Error clearing learning data', {
        error: error.message,
        userId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new CategorizationService();
