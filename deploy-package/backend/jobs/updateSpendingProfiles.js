const db = require('../config/database');
const anomalyDetectionService = require('../services/anomalyDetectionService');
const logger = require('../utils/logger');

/**
 * Update Spending Profiles Job
 * Runs daily to rebuild user spending profiles for anomaly detection
 */
async function updateSpendingProfiles() {
  try {
    logger.info('Starting spending profile update job');

    // Get all active users
    const usersQuery = `
      SELECT DISTINCT id
      FROM users
      WHERE is_active = true
    `;

    const usersResult = await db.query(usersQuery);
    const users = usersResult.rows;

    logger.info(`Found ${users.length} active users to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        const result = await anomalyDetectionService.rebuildUserProfile(user.id);

        if (result.success) {
          successCount++;
          logger.info(`Updated profile for user ${user.id}: ${result.categoriesUpdated} categories`);
        } else {
          errorCount++;
          logger.error(`Failed to update profile for user ${user.id}: ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        logger.error(`Error processing user ${user.id}:`, error);
      }
    }

    logger.info(`Spending profile update job completed: ${successCount} success, ${errorCount} errors`);

    return {
      success: true,
      processed: users.length,
      successCount,
      errorCount,
    };
  } catch (error) {
    logger.error('Spending profile update job failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run if called directly
if (require.main === module) {
  updateSpendingProfiles()
    .then((result) => {
      console.log('Job completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Job failed:', error);
      process.exit(1);
    });
}

module.exports = updateSpendingProfiles;
