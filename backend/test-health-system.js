// Test script for health monitoring system
const systemHealthMonitor = require('./services/systemHealthMonitor');
const performanceMonitor = require('./services/performanceMonitor');

async function testHealthSystem() {
  console.log('🔍 Testing Health Monitoring System...\n');
  
  try {
    // Start monitoring
    console.log('1. Starting health monitoring...');
    systemHealthMonitor.startMonitoring(5000); // 5 second intervals for testing
    performanceMonitor.startMonitoring();
    
    // Wait a moment for initial metrics
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test health status
    console.log('2. Getting current health status...');
    const health = await systemHealthMonitor.getCurrentHealthStatus();
    console.log('Health Status:', {
      overall: health.overall,
      memory: `${(health.metrics.memory.usage * 100).toFixed(1)}%`,
      cpu: `${(health.metrics.cpu.usage * 100).toFixed(1)}%`
    });
    
    // Test performance metrics
    console.log('\n3. Getting performance report...');
    const perfReport = performanceMonitor.getPerformanceReport();
    console.log('Performance Metrics:', {
      requests: perfReport.metrics.requests.total,
      avgResponseTime: `${perfReport.metrics.requests.averageResponseTime.toFixed(2)}ms`,
      dbQueries: perfReport.metrics.database.queries,
      cacheHitRate: `${(perfReport.metrics.cache.hitRate * 100).toFixed(1)}%`
    });
    
    // Test memory stress (simulate high memory usage)
    console.log('\n4. Testing memory stress simulation...');
    const largeArrays = [];
    for (let i = 0; i < 10; i++) {
      largeArrays.push(new Array(100000).fill(`test-data-${i}`));
    }
    
    // Wait for health check to detect the change
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const stressHealth = await systemHealthMonitor.getCurrentHealthStatus();
    console.log('Health After Memory Stress:', {
      overall: stressHealth.overall,
      memory: `${(stressHealth.metrics.memory.usage * 100).toFixed(1)}%`,
      memoryLevel: stressHealth.details.memory
    });
    
    // Clean up test data
    largeArrays.length = 0;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('Forced garbage collection');
    }
    
    // Test alert callback
    console.log('\n5. Testing alert system...');
    systemHealthMonitor.registerAlertCallback('test', (alert) => {
      console.log(`🚨 Alert received: ${alert.type} - ${alert.message}`);
    });
    
    // Test emergency action
    console.log('\n6. Testing emergency cleanup...');
    await systemHealthMonitor.executeEmergencyAction('memory_cleanup');
    
    // Final health check
    await new Promise(resolve => setTimeout(resolve, 2000));
    const finalHealth = await systemHealthMonitor.getCurrentHealthStatus();
    console.log('\nFinal Health Status:', {
      overall: finalHealth.overall,
      memory: `${(finalHealth.metrics.memory.usage * 100).toFixed(1)}%`,
      uptime: `${finalHealth.metrics.uptime.toFixed(0)}s`
    });
    
    console.log('\n✅ Health monitoring system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Stop monitoring
    systemHealthMonitor.stopMonitoring();
    performanceMonitor.stopMonitoring();
    console.log('\n🛑 Monitoring stopped');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testHealthSystem().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testHealthSystem };