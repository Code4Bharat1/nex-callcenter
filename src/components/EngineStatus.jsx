import React from 'react';
import './EngineStatus.css';

const EngineStatus = ({ isActive, status = 'active' }) => {
  if (!isActive) return null;

  const statusConfig = {
    active: { color: '#10b981', label: 'Active' },
    warmup: { color: '#f59e0b', label: 'Warming Up' },
    error: { color: '#ef4444', label: 'Error' },
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <div className="engine-status">
      <span className="engine-status-label">Engine:</span>
      <span className="engine-status-value">{config.label}</span>
      <div className="engine-status-indicator">
        <div 
          className="engine-status-pulse"
          style={{ 
            backgroundColor: config.color,
            boxShadow: `0 0 0 0 ${config.color}40`
          }}
        />
        <div 
          className="engine-status-core"
          style={{ backgroundColor: config.color }}
        />
      </div>
    </div>
  );
};

export default EngineStatus;

