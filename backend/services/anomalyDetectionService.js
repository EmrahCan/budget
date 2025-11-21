const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * AnomalyDetectionService - Anomaly detection and security monitoring
 * Detects unusual spending patterns and potential fraudulent transactions
 */
class AnomalyDetectionService {
  constructor() {
    this.zScoreThreshold = 2.5; // Standard deviations for anomaly detection
    this.minTransactionsForProfile = 10; // Minimum transactions needed for reliable detection
  }

  /**
   * Detect if a transaction is anomalous
   * @param {Object} transaction - Transaction to check
   * @param {string} userId - User ID
   * @returns {Object} Detection result with risk level and explanation
   */
  async detectAnomaly(transaction, userId) {
    try {
      logger.info('Detecting anomaly', { userId, transaction });

      const { amount, category, description } = transaction;

      // Get user's spending profile for this category
      const profile = await this.getUserProfile(userId, category);

      if (!profile || profile.transaction_count < this.minTransactionsForProfile) {
        // Not enough data for reliable detection
        return {
          success: true,
          data: {
            isAnomaly: false,
            riskLevel: 'low',
            confidence: 'low',
            reason: 'insufficient_data',
            explanation: 'Henüz bu kategori için yeterli veri yok. İşlem normal kabul edildi.',
            profileExists: false,
          },
        };
      }

      // Calculate z-score for amount
      const avgAmount = parseFloat(profile.avg_amount);
      const stdDev = parseFloat(profile.std_deviation);
      const zScore = stdDev > 0 ? Math.abs((amount - avgAmount) / stdDev) : 0;

      // Check if amount is outside normal range
      const isAmountAnomaly = zScore > this.zScoreThreshold;

      // Check for unusual time patterns (e.g., multiple transactions in short time)
      const recentTransactions = await this.getRecentTransactions(userId, category, 1); // Last 1 hour
      const isFrequencyAnomaly = recentTransactions.length >= 3;

      // Check for unusual merchant/description patterns
      const isDescriptionAnomaly = await this.checkDescriptionAnomaly(userId, category, description);

      // Determine overall risk level
      let riskLevel = 'low';
      let isAnomaly = false;
      const anomalyFactors = [];

      if (isAmountAnomaly) {
        anomalyFactors.push('unusual_amount');
        isAnomaly = true;
      }

      if (isFrequencyAnomaly) {
        anomalyFactors.push('high_frequency');
        isAnomaly = true;
      }

      if (isDescriptionAnomaly) {
        anomalyFactors.push('unusual_merchant');
        isAnomaly = true;
      }

      // Calculate risk level
      if (anomalyFactors.length >= 2) {
        riskLevel = 'high';
      } else if (anomalyFactors.length === 1) {
        if (zScore > 3) {
          riskLevel = 'high';
        } else {
          riskLevel = 'medium';
        }
      }

      // Generate explanation
      const explanation = this.generateExplanation(
        amount,
        avgAmount,
        zScore,
        anomalyFactors,
        profile
      );

      return {
        success: true,
        data: {
          isAnomaly,
          riskLevel,
          confidence: 'high',
          zScore: zScore.toFixed(2),
          anomalyFactors,
          explanation,
          profileExists: true,
          profile: {
            avgAmount,
            stdDev,
            transactionCount: profile.transaction_count,
            minAmount: parseFloat(profile.min_amount),
            maxAmount: parseFloat(profile.max_amount),
          },
        },
      };
    } catch (error) {
      logger.error('Anomaly detection error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's spending profile for a category
   */
  async getUserProfile(userId, category) {
    const query = `
      SELECT 
        avg_amount,
        std_deviation,
        min_amount,
        max_amount,
        transaction_count,
        last_updated
      FROM user_spending_profile
      WHERE user_id = $1 AND category = $2
    `;

    const result = await db.query(query, [userId, category]);
    return result.rows[0] || null;
  }

  /**
   * Get recent transactions for frequency analysis
   */
  async getRecentTransactions(userId, category, hours = 1) {
    const query = `
      SELECT id, amount, transaction_date
      FROM transactions
      WHERE user_id = $1
        AND category = $2
        AND transaction_date >= NOW() - INTERVAL '${hours} hours'
      ORDER BY transaction_date DESC
    `;

    const result = await db.query(query, [userId, category]);
    return result.rows;
  }

  /**
   * Check if description/merchant is unusual
   */
  async checkDescriptionAnomaly(userId, category, description) {
    if (!description || description.length < 3) {
      return false;
    }

    // Get common merchants/descriptions for this user and category
    const query = `
      SELECT description, COUNT(*) as frequency
      FROM transactions
      WHERE user_id = $1
        AND category = $2
        AND description IS NOT NULL
      GROUP BY description
      ORDER BY frequency DESC
      LIMIT 20
    `;

    const result = await db.query(query, [userId, category]);
    const commonDescriptions = result.rows;

    if (commonDescriptions.length === 0) {
      return false; // No history to compare
    }

    // Check if current description is similar to any common ones
    const descLower = description.toLowerCase();
    const isSimilar = commonDescriptions.some((row) => {
      const commonDesc = row.description.toLowerCase();
      return (
        descLower.includes(commonDesc) ||
        commonDesc.includes(descLower) ||
        this.calculateSimilarity(descLower, commonDesc) > 0.6
      );
    });

    return !isSimilar; // Anomaly if not similar to any common description
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Generate human-readable explanation
   */
  generateExplanation(amount, avgAmount, zScore, anomalyFactors, profile) {
    const explanations = [];

    if (anomalyFactors.includes('unusual_amount')) {
      const difference = ((amount - avgAmount) / avgAmount) * 100;
      if (amount > avgAmount) {
        explanations.push(
          `Bu işlem tutarı (${amount.toFixed(2)} ₺), bu kategorideki ortalama harcamanızdan %${Math.abs(difference).toFixed(0)} daha yüksek.`
        );
      } else {
        explanations.push(
          `Bu işlem tutarı (${amount.toFixed(2)} ₺), bu kategorideki ortalama harcamanızdan %${Math.abs(difference).toFixed(0)} daha düşük.`
        );
      }
    }

    if (anomalyFactors.includes('high_frequency')) {
      explanations.push('Son 1 saat içinde bu kategoride çok sayıda işlem yapıldı.');
    }

    if (anomalyFactors.includes('unusual_merchant')) {
      explanations.push('Bu işyeri/açıklama daha önce kullanılmamış.');
    }

    if (explanations.length === 0) {
      return 'İşlem normal görünüyor.';
    }

    return explanations.join(' ');
  }

  /**
   * Update user's spending profile
   * @param {string} userId - User ID
   * @param {Object} transaction - Transaction data
   * @param {boolean} isNormal - Whether transaction is confirmed as normal
   */
  async updateUserProfile(userId, transaction, isNormal = true) {
    try {
      logger.info('Updating user profile', { userId, category: transaction.category });

      const { amount, category } = transaction;

      // Get current profile
      const currentProfile = await this.getUserProfile(userId, category);

      if (!currentProfile) {
        // Create new profile
        await this.createUserProfile(userId, category, amount);
      } else if (isNormal) {
        // Update existing profile with new transaction
        await this.updateExistingProfile(userId, category, amount, currentProfile);
      }

      return {
        success: true,
        message: 'Profil güncellendi',
      };
    } catch (error) {
      logger.error('Profile update error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create new spending profile for user and category
   */
  async createUserProfile(userId, category, amount) {
    const query = `
      INSERT INTO user_spending_profile (
        user_id,
        category,
        avg_amount,
        std_deviation,
        min_amount,
        max_amount,
        transaction_count,
        last_updated
      ) VALUES ($1, $2, $3, 0, $3, $3, 1, NOW())
    `;

    await db.query(query, [userId, category, amount]);
  }

  /**
   * Update existing spending profile
   */
  async updateExistingProfile(userId, category, newAmount, currentProfile) {
    const n = parseInt(currentProfile.transaction_count);
    const oldAvg = parseFloat(currentProfile.avg_amount);
    const oldStdDev = parseFloat(currentProfile.std_deviation);
    const oldMin = parseFloat(currentProfile.min_amount);
    const oldMax = parseFloat(currentProfile.max_amount);

    // Calculate new average (incremental)
    const newAvg = (oldAvg * n + newAmount) / (n + 1);

    // Calculate new standard deviation (incremental)
    // Using Welford's online algorithm
    const oldVariance = oldStdDev * oldStdDev;
    const newVariance =
      (n * oldVariance + (newAmount - oldAvg) * (newAmount - newAvg)) / (n + 1);
    const newStdDev = Math.sqrt(newVariance);

    // Update min/max
    const newMin = Math.min(oldMin, newAmount);
    const newMax = Math.max(oldMax, newAmount);

    const query = `
      UPDATE user_spending_profile
      SET 
        avg_amount = $1,
        std_deviation = $2,
        min_amount = $3,
        max_amount = $4,
        transaction_count = transaction_count + 1,
        last_updated = NOW()
      WHERE user_id = $5 AND category = $6
    `;

    await db.query(query, [newAvg, newStdDev, newMin, newMax, userId, category]);
  }

  /**
   * Rebuild user profile from scratch (for maintenance)
   */
  async rebuildUserProfile(userId, category = null) {
    try {
      logger.info('Rebuilding user profile', { userId, category });

      let categoryFilter = '';
      let params = [userId];

      if (category) {
        categoryFilter = 'AND category = $2';
        params.push(category);
      }

      // Get all transactions for user (and optionally category)
      const query = `
        SELECT 
          category,
          amount
        FROM transactions
        WHERE user_id = $1
          AND type = 'expense'
          ${categoryFilter}
        ORDER BY transaction_date
      `;

      const result = await db.query(query, params);
      const transactions = result.rows;

      // Group by category
      const categoryGroups = {};
      transactions.forEach((tx) => {
        if (!categoryGroups[tx.category]) {
          categoryGroups[tx.category] = [];
        }
        categoryGroups[tx.category].push(parseFloat(tx.amount));
      });

      // Calculate statistics for each category
      for (const [cat, amounts] of Object.entries(categoryGroups)) {
        if (amounts.length === 0) continue;

        const avg = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
        const variance =
          amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const min = Math.min(...amounts);
        const max = Math.max(...amounts);

        // Upsert profile
        const upsertQuery = `
          INSERT INTO user_spending_profile (
            user_id,
            category,
            avg_amount,
            std_deviation,
            min_amount,
            max_amount,
            transaction_count,
            last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (user_id, category)
          DO UPDATE SET
            avg_amount = EXCLUDED.avg_amount,
            std_deviation = EXCLUDED.std_deviation,
            min_amount = EXCLUDED.min_amount,
            max_amount = EXCLUDED.max_amount,
            transaction_count = EXCLUDED.transaction_count,
            last_updated = NOW()
        `;

        await db.query(upsertQuery, [userId, cat, avg, stdDev, min, max, amounts.length]);
      }

      return {
        success: true,
        message: 'Profil yeniden oluşturuldu',
        categoriesUpdated: Object.keys(categoryGroups).length,
      };
    } catch (error) {
      logger.error('Profile rebuild error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get anomaly statistics for user
   */
  async getAnomalyStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE is_anomaly = true) as anomaly_count,
          COUNT(*) as total_checks,
          AVG(CASE WHEN is_anomaly = true THEN 1 ELSE 0 END) * 100 as anomaly_rate
        FROM ai_interactions
        WHERE user_id = $1
          AND interaction_type = 'anomaly_detection'
          AND created_at >= NOW() - INTERVAL '30 days'
      `;

      const result = await db.query(query, [userId]);
      return {
        success: true,
        data: result.rows[0],
      };
    } catch (error) {
      logger.error('Anomaly stats error', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
module.exports = new AnomalyDetectionService();
