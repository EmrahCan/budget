import React, { useState } from 'react';
import useSystemHealth from '../../hooks/useSystemHealth';
import './SystemHealthIndicator.css';

const SystemHealthIndicator = ({ 
  position = 'bottom-right',
  showDetails = false,
  autoHide = true 
}) => {
  const {
    healthStatus,
    alerts,
    forceCleanup,
    dismissAlert,
    getHealthReport
  } = useSystemHealth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Don't show if healthy and autoHide is enabled
  if (autoHide && healthStatus.overall === 'healthy' && alerts.length === 0) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '⚠';
      default: return '?';
    }
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await forceCleanup();
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (ms) => {
    return `${ms.toFixed(0)}ms`;
  };

  return (
    <div className={`system-health-indicator ${position}`}>
      {/* Main indicator */}
      <div 
        className={`health-status ${healthStatus.overall}`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ backgroundColor: getStatusColor(healthStatus.overall) }}
      >
        <span className="status-icon">
          {getStatusIcon(healthStatus.overall)}
        </span>
        {alerts.length > 0 && (
          <span className="alert-count">{alerts.length}</span>
        )}
      </div>

      {/* Expanded details */}
      {(isExpanded || showDetails) && (
        <div className="health-details">
          <div className="health-header">
            <h4>System Health</h4>
            <button 
              className="close-btn"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>

          {/* Overall status */}
          <div className="overall-status">
            <div className="status-item">
              <span className="status-label">Overall:</span>
              <span className={`status-value ${healthStatus.overall}`}>
                {healthStatus.overall.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Memory status */}
          <div className="metric-section">
            <h5>Memory</h5>
            <div className="metric-item">
              <span className="metric-label">Usage:</span>
              <span className={`metric-value ${healthStatus.memory.level}`}>
                {formatPercentage(healthStatus.memory.usage)}
              </span>
            </div>
            <div className="metric-progress">
              <div 
                className={`progress-bar ${healthStatus.memory.level}`}
                style={{ width: formatPercentage(healthStatus.memory.usage) }}
              />
            </div>
          </div>

          {/* Performance status */}
          <div className="metric-section">
            <h5>Performance</h5>
            <div className="metric-item">
              <span className="metric-label">Render Time:</span>
              <span className={`metric-value ${healthStatus.performance.level}`}>
                {formatTime(healthStatus.performance.renderTime)}
              </span>
            </div>
          </div>

          {/* Network status */}
          <div className="metric-section">
            <h5>Network</h5>
            <div className="metric-item">
              <span className="metric-label">Latency:</span>
              <span className={`metric-value ${healthStatus.network.level}`}>
                {formatTime(healthStatus.network.latency)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Error Rate:</span>
              <span className={`metric-value ${healthStatus.network.level}`}>
                {formatPercentage(healthStatus.network.errors)}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="alerts-section">
              <h5>Active Alerts</h5>
              {alerts.slice(-3).map(alert => (
                <div key={alert.id} className={`alert-item ${alert.level}`}>
                  <div className="alert-content">
                    <span className="alert-type">{alert.type.toUpperCase()}</span>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                  <button 
                    className="dismiss-btn"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="actions-section">
            <button 
              className="cleanup-btn"
              onClick={handleCleanup}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? 'Cleaning...' : 'Force Cleanup'}
            </button>
            
            <button 
              className="report-btn"
              onClick={() => {
                const report = getHealthReport();
                console.log('System Health Report:', report);
                // Could also download as JSON file
              }}
            >
              Export Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthIndicator;