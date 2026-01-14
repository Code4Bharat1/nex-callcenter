import React, { useState } from 'react';

const RetryStatusBars = ({ data = [], labels = [], showLabels = true }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ color: '#6b7280', fontSize: '14px' }}>No retry data available</div>;
  }

  const [tooltip, setTooltip] = useState(null);

  const getTotal = (arr) => {
    if (!Array.isArray(arr) || arr.length < 4) return 0;
    return (arr[0] || 0) + (arr[1] || 0) + (arr[2] || 0) + (arr[3] || 0);
  };

  const maxTotal = Math.max(...data.map(stats => getTotal(stats)));

  const handleMouseEnter = (e, text) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} onMouseLeave={handleMouseLeave}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#4b5563', margin: 0 }}>Retry Progress</h3>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Per attempt</span>
        </div>
        <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>
          {maxTotal.toLocaleString()} <span style={{ fontSize: '18px', fontWeight: 400, color: '#9ca3af' }}>calls</span>
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', margin: 0 }}>Peak attempt volume</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((stats, index) => {
          if (!Array.isArray(stats) || stats.length < 4) {
            return null;
          }

          const [converted = 0, other = 0, notPicked = 0, queued = 0] = stats;
          const total = getTotal(stats);

          if (total === 0) {
            return null;
          }

          const notPickedPercent = (notPicked / total) * 100;
          const otherPercent = (other / total) * 100;
          const convertedPercent = (converted / total) * 100;
          const queuedPercent = (queued / total) * 100;

          const barWidthPercent = (total / maxTotal) * 100;
          const reachesEnd = barWidthPercent >= 99;

          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {showLabels && (
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', width: '32px', flexShrink: 0 }}>
                  {labels[index] || `Q${index + 1}`}
                </div>
              )}

              <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#f3f4f6', borderRadius: '9999px' }}></div>
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    display: 'flex',
                    overflow: 'hidden',
                    width: `${barWidthPercent}%`,
                    borderRadius: reachesEnd ? '9999px' : '9999px 0 0 9999px'
                  }}
                >
                  {notPicked > 0 && (
                    <div 
                      style={{ 
                        width: `${notPickedPercent}%`,
                        background: 'linear-gradient(to right, #6366f1, #4f46e5)',
                        minWidth: '4px',
                        height: '24px'
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, `Not Picked: ${notPicked}`)}
                      onMouseLeave={handleMouseLeave}
                    />
                  )}
                  {other > 0 && (
                    <div 
                      style={{ 
                        width: `${otherPercent}%`,
                        background: 'linear-gradient(to right, #a5b4fc, #818cf8)',
                        minWidth: '4px',
                        height: '24px'
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, `Other: ${other}`)}
                      onMouseLeave={handleMouseLeave}
                    />
                  )}
                  {converted > 0 && (
                    <div 
                      style={{ 
                        width: `${convertedPercent}%`,
                        background: 'linear-gradient(to right, #e0e7ff, #c7d2fe)',
                        minWidth: '4px',
                        height: '24px'
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, `Converted: ${converted}`)}
                      onMouseLeave={handleMouseLeave}
                    />
                  )}
                  {queued > 0 && (
                    <div 
                      style={{ 
                        width: `${queuedPercent}%`,
                        background: '#e5e7eb',
                        minWidth: '4px',
                        height: '24px'
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, `Queued: ${queued}`)}
                      onMouseLeave={handleMouseLeave}
                    />
                  )}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280', width: '40px', textAlign: 'right', flexShrink: 0 }}>
                {total}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingLeft: '40px', paddingRight: '8px', fontSize: '12px', color: '#9ca3af' }}>
        <span>0</span>
        <span>{Math.floor(maxTotal / 2).toLocaleString()}</span>
        <span>{maxTotal.toLocaleString()}</span>
      </div>

      {/* Custom Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)',
          background: '#1f2937',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          {tooltip.text}
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            background: '#1f2937',
            rotate: '45deg'
          }}></div>
        </div>
      )}
    </div>
  );
};

export default RetryStatusBars;
