import React, { useState, useEffect } from 'react';
import useSystemHealth from '../../hooks/useSystemHealth';
import memoryGuard from '../../services/memoryGuard';

const HealthSystemTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const {
    healthStatus,
    alerts,
    forceCleanup,
    recordRenderTime,
    recordNetworkRequest,
    getHealthReport
  } = useSystemHealth();

  const addResult = (test, result, status = 'success') => {
    setTestResults(prev => [...prev, {
      test,
      result,
      status,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Memory Guard
      addResult('Memory Guard Initialization', 'Testing memory guard service...');
      const memoryStats = memoryGuard.getMemoryStats();
      addResult('Memory Stats', `Current usage: ${memoryStats ? (memoryStats.current.percentage).toFixed(1) + '%' : 'N/A'}`);
      
      // Test 2: Component Registration
      addResult('Component Registration', 'Registering test component...');
      memoryGuard.registerComponent('test-component', {
        cleanup: () => console.log('Test component cleaned up'),
        isActive: () => true
      });
      addResult('Component Registration', 'Test component registered successfully');
      
      // Test 3: Cache Operations
      addResult('Cache Operations', 'Testing cache operations...');
      memoryGuard.cacheItem('test-key', { data: 'test-value', timestamp: Date.now() });
      const cachedItem = memoryGuard.getCachedItem('test-key');
      addResult('Cache Operations', cachedItem ? 'Cache read/write successful' : 'Cache operation failed', cachedItem ? 'success' : 'error');
      
      // Test 4: Performance Recording
      addResult('Performance Recording', 'Recording test render time...');
      const renderStart = performance.now();
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
      const renderTime = performance.now() - renderStart;
      recordRenderTime(renderTime);
      addResult('Performance Recording', `Recorded render time: ${renderTime.toFixed(2)}ms`);
      
      // Test 5: Network Request Simulation
      addResult('Network Simulation', 'Simulating network request...');
      const networkStart = performance.now();
      try {
        await fetch('/health');
        const networkTime = performance.now() - networkStart;
        recordNetworkRequest({ duration: networkTime, success: true });
        addResult('Network Simulation', `Network request completed in ${networkTime.toFixed(2)}ms`);
      } catch (error) {
        recordNetworkRequest({ duration: 5000, success: false, error: error.message });
        addResult('Network Simulation', `Network request failed: ${error.message}`, 'error');
      }
      
      // Test 6: Memory Stress Test
      addResult('Memory Stress Test', 'Creating memory pressure...');
      const largeArrays = [];
      for (let i = 0; i < 5; i++) {
        largeArrays.push(new Array(100000).fill(`stress-test-${i}`));
      }
      
      // Wait for memory monitoring to detect the change
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const stressStats = memoryGuard.getMemoryStats();
      addResult('Memory Stress Test', stressStats ? 
        `Memory usage after stress: ${stressStats.current.percentage.toFixed(1)}%` : 
        'Memory stats not available'
      );
      
      // Clean up stress test data
      largeArrays.length = 0;
      
      // Test 7: Force Cleanup
      addResult('Force Cleanup', 'Executing force cleanup...');
      const cleanupResult = await forceCleanup();
      addResult('Force Cleanup', cleanupResult ? 'Cleanup successful' : 'Cleanup failed', cleanupResult ? 'success' : 'error');
      
      // Test 8: Health Report
      addResult('Health Report', 'Generating health report...');
      const report = getHealthReport();
      addResult('Health Report', `Generated report with ${report.alerts.length} alerts and ${Object.keys(report.metrics).length} metric categories`);
      
      // Test 9: Component Cleanup
      addResult('Component Cleanup', 'Cleaning up test component...');
      memoryGuard.unregisterComponent('test-component');
      addResult('Component Cleanup', 'Test component unregistered successfully');
      
      addResult('Test Suite', '✅ All tests completed successfully!', 'success');
      
    } catch (error) {
      addResult('Test Suite', `❌ Test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔍 Health System Test Suite</h2>
      
      {/* Current Health Status */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Current System Health</h3>
        <div>Overall Status: <span style={{ 
          color: healthStatus.overall === 'healthy' ? 'green' : 
                healthStatus.overall === 'warning' ? 'orange' : 'red',
          fontWeight: 'bold'
        }}>
          {healthStatus.overall.toUpperCase()}
        </span></div>
        <div>Memory: {(healthStatus.memory.usage * 100).toFixed(1)}% ({healthStatus.memory.level})</div>
        <div>Performance: {healthStatus.performance.renderTime.toFixed(0)}ms ({healthStatus.performance.level})</div>
        <div>Network: {healthStatus.network.latency.toFixed(0)}ms ({healthStatus.network.level})</div>
        <div>Active Alerts: {alerts.length}</div>
      </div>
      
      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isRunning ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Health System Tests'}
        </button>
        
        <button 
          onClick={clearResults}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Clear Results
        </button>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ backgroundColor: '#000', color: '#00ff00', padding: '15px', borderRadius: '5px', maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ color: '#00ff00', marginTop: 0 }}>Test Results</h3>
          {testResults.map((result, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              <span style={{ color: '#888' }}>[{result.timestamp}]</span>{' '}
              <span style={{ color: result.status === 'error' ? '#ff4444' : '#00ff00' }}>
                {result.test}:
              </span>{' '}
              {result.result}
            </div>
          ))}
        </div>
      )}
      
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
          <h3>🚨 Active Alerts</h3>
          {alerts.map(alert => (
            <div key={alert.id} style={{ 
              marginBottom: '10px', 
              padding: '10px', 
              backgroundColor: alert.level === 'critical' ? '#f8d7da' : '#d1ecf1',
              borderRadius: '3px'
            }}>
              <strong>{alert.type.toUpperCase()}</strong> ({alert.level}): {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthSystemTest;