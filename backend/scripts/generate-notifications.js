#!/usr/bin/env node

/**
 * Script to manually generate notifications for all users
 * Usage: node scripts/generate-notifications.js
 */

const notificationGeneratorService = require('../services/notificationGeneratorService');
const logger = require('../utils/logger');

async function generateNotifications() {
  try {
    logger.info('Starting manual notification generation...');
    
    const result = await notificationGeneratorService.generateDailyNotifications();
    
    logger.info('Notification generation completed', result);
    console.log('\n✅ Bildirimler başarıyla oluşturuldu!');
    console.log(`   İşlenen kullanıcı sayısı: ${result.usersProcessed}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Notification generation failed', { error: error.message });
    console.error('\n❌ Bildirim oluşturma başarısız:', error.message);
    process.exit(1);
  }
}

// Run the script
generateNotifications();
