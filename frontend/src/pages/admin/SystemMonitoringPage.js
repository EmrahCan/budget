import React, { useState, useEffect } from 'react';
import useSystemHealth from '../../hooks/useSystemHealth';
import SystemHealthIndicator from '../../components/common/SystemHealthIndicator';

const SystemMonitoringPage = () => {
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    healthStatus,
    systemMetrics,
    isMonitoring,
    getHealthReport,
    clearAlerts,
    memoryManager,
    performanceMonitor
  } = useSystemHealth({
    monitoringInterval: refreshInterval,
    enableAutoRecovery: true
  });

  const [backendHealth, setBackendHealth] = useState(null);
  const [backendMetrics, setBackendMetrics] = useState(null);

  // Fetch backend health data
  const fetchBackendHealth = async () => {
    try {
      const response = await fetch('/api/health/detailed');
      if (response.ok) {
        const data = await response.json();
        setBackendHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch backend health:', error);
    }
  };

  const fetchBackendMetrics = async () => {
    try {
      const response = await fetch('/api/health/metrics');
      if (response.ok) {
        const data = await response.json();
        setBackendMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch backend metrics:', error);
    }
  };

  useEffect(() => {
    fetchBackendHealth();
    fetchBackendMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchBackendHealth();
        fetchBackendMetrics();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    margin: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const tabStyle = (isActive) => ({
    padding: '8px 16px',
    margin: '0 4px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#2196F3' : '#f0f0f0',
    color: isActive ? 'white' : '#333'
  });

  const metricRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  };

  const statusBadgeStyle = (status) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: getStatusColor(status)
  });

  const renderOverview = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
      {/* Frontend Health */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', color: getStatusColor(healthStatus.overall) }}>
          Frontend Health
        </h3>
        <div style={metricRowStyle}>
          <span>Overall Status:</span>
          <span style={statusBadgeStyle(healthStatus.overall)}>
            {healthStatus.overall.toUpperCase()}
          </span>
        </div>
        <div style={metricRowStyle}>
          <span>Memory:</span>
          <span style={statusBadgeStyle(healthStatus.memory)}>
            {systemMetrics.memory?.percentage?.toFixed(1) || 0}%
          </span>
        </div>
        <div style={metricRowStyle}>
          <span>Performance:</span>
          <span style={statusBadgeStyle(healthStatus.performance)}>
            {systemMetrics.performance?.averageRenderTime?.toFixed(1) || 0}ms
          </span>
        </div>
        <div style={metricRowStyle}>
          <span>Errors:</span>
          <span style={statusBadgeStyle(healthStatus.errors)}>
            {systemMetrics.errors?.totalErrors || 0}
          </span>
        </div>
        <div style={metricRowStyle}>
          <span>Uptime:</span>
          <span>{formatDuration(systemMetrics.uptime || 0)}</span>
        </div>
      </div>

      {/* Backend Health */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0', color: getStatusColor(backendHealth?.overall || 'unknown') }}>
          Backend Health
        </h3>
        {backendHealth ? (
          <>
            <div style={metricRowStyle}>
              <span>Overall Status:</span>
              <span style={statusBadgeStyle(backendHealth.overall)}>
                {backendHealth.overall.toUpperCase()}
              </span>
            </div>
            {backendHealth.checks && Object.entries(backendHealth.checks).map(([name, check]) => (
              <div key={name} style={metricRowStyle}>
                <span>{name.charAt(0).toUpperCase() + name.slice(1)}:</span>
                <span style={statusBadgeStyle(check.status)}>
                  {check.status.toUpperCase()}
                </span>
              </div>
            ))}
          </>
        ) : (
          <div>Loading backend health...</div>
        )}
      </div>

      {/* System Resources */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0' }}>System Resources</h3>
        {backendHealth?.system && (
          <>
            <div style={metricRowStyle}>
              <span>CPU Usage:</span>
              <span>{(backendHealth.system.cpu?.usage * 100 || 0).toFixed(1)}%</span>
            </div>
            <div style={metricRowStyle}>
              <span>Memory Usage:</span>
              <span>{(backendHealth.system.memory?.usage * 100 || 0).toFixed(1)}%</span>
            </div>
            <div style={metricRowStyle}>
              <span>Process Memory:</span>
              <span>{formatBytes(backendHealth.system.memory?.process?.heapUsed || 0)}</span>
            </div>
            <div style={metricRowStyle}>
              <span>System Uptime:</span>
              <span>{formatDuration((backendHealth.system.node?.uptime || 0) * 1000)}</span>
            </div>
          </>
        )}
      </div>

      {/* Performance Metrics */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px 0' }}>Performance Metrics</h3>
        {backendMetrics && (
          <>
            <div style={metricRowStyle}>
              <span>Total Requests:</span>
              <span>{backendMetrics.metrics?.requests?.total || 0}</span>
            </div>
            <div style={metricRowStyle}>
              <span>Avg Response Time:</span>
              <span>{(backendMetrics.metrics?.requests?.averageResponseTime || 0).toFixed(2)}ms</span>
            </div>
            <div style={metricRowStyle}>
              <span>Database Queries:</span>
              <span>{backendMetrics.metrics?.database?.queries || 0}</span>
            </div>
            <div style={metricRowStyle}>
              <span>Cache Hit Rate:</span>
              <span>{((backendMetrics.metrics?.cache?.hitRate || 0) * 100).toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Active Alerts</h3>
        <button 
          onClick={clearAlerts}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#f44336',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>
      
      {healthStatus.alerts && healthStatus.alerts.length > 0 ? (
        healthStatus.alerts.map((alert, index) => (
          <div key={index} style={{
            padding: '12px',
            margin: '8px 0',
            border: `1px solid ${getStatusColor(alert.severity)}`,
            borderRadius: '4px',
            backgroundColor: `${getStatusColor(alert.severity)}10`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: getStatusColor(alert.severity) }}>
                {alert.type.toUpperCase()}
              </span>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
            <div style={{ margin: '8px 0' }}>{alert.message}</div>
            {alert.autoRecoveryAttempted && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Auto-recovery attempted: {alert.recoveryActions?.join(', ') || 'Yes'}
              </div>
            )}
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          No active alerts
        </div>
      )}
      
      {/* Backend Alerts */}
      {backendHealth?.alerts && backendHealth.alerts.length > 0 && (
        <>
          <h4>Backend Alerts</h4>
          {backendHealth.alerts.map((alert, index) => (
            <div key={index} style={{
              padding: '12px',
              margin: '8px 0',
              border: `1px solid ${getStatusColor(alert.severity)}`,
              borderRadius: '4px',
              backgroundColor: `${getStatusColor(alert.severity)}10`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: getStatusColor(alert.severity) }}>
                  {alert.type.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ margin: '8px 0' }}>{alert.message}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const renderControls = () => (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 16px 0' }}>Monitoring Controls</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Refresh Interval:
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={{ marginLeft: '8px', padding: '4px' }}
          >
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>1 minute</option>
            <option value={300000}>5 minutes</option>
          </select>
        </label>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={(e) => setAutoRefresh(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Auto Refresh
        </label>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => {
            fetchBackendHealth();
            fetchBackendMetrics();
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#2196F3',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Refresh Now
        </button>
        
        <button 
          onClick={() => memoryManager.forceCleanup()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#FF9800',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Force Cleanup
        </button>
        
        <button 
          onClick={() => memoryManager.clearCache()}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#9C27B0',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Clear Cache
        </button>
        
        <button 
          onClick={() => {
            const report = getHealthReport();
            console.log('Health Report:', report);
            alert('Health report logged to console');
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#4CAF50',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Export Report
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '20px' }}>System Monitoring Dashboard</h1>
        
        {/* Tab Navigation */}
        <div style={{ marginBottom: '20px' }}>
          <button 
            style={tabStyle(selectedTab === 'overview')}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          <button 
            style={tabStyle(selectedTab === 'alerts')}
            onClick={() => setSelectedTab('alerts')}
          >
            Alerts ({(healthStatus.alerts?.length || 0) + (backendHealth?.alerts?.length || 0)})
          </button>
          <button 
            style={tabStyle(selectedTab === 'controls')}
            onClick={() => setSelectedTab('controls')}
          >
            Controls
          </button>
        </div>
        
        {/* Tab Content */}
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'alerts' && renderAlerts()}
        {selectedTab === 'controls' && renderControls()}
        
        {/* System Health Indicator */}
        <SystemHealthIndicator 
          showDetails={true}
          position="bottom-right"
          enableNotifications={true}
        />
      </div>
    </div>
  );
};

export default SystemMonitoringPage;