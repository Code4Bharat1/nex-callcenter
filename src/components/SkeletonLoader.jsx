import React from 'react';
import './SkeletonLoader.css';

// Generic skeleton loader components
export const SkeletonBox = ({ width, height, style = {} }) => (
  <div 
    className="skeleton-box" 
    style={{ 
      width: width || '100%', 
      height: height || '20px',
      ...style 
    }} 
  />
);

export const SkeletonText = ({ width = '100%', lines = 1, gap = '8px' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox 
        key={i} 
        width={i === lines - 1 ? (typeof width === 'string' ? width : `${width * 0.7}%`) : width}
        height="16px"
      />
    ))}
  </div>
);

export const SkeletonCard = ({ height = '200px', style = {} }) => (
  <div 
    className="skeleton-card"
    style={{ height, ...style }}
  >
    <div className="skeleton-card-content">
      <SkeletonBox width="40px" height="40px" style={{ borderRadius: '8px' }} />
      <div style={{ flex: 1, marginTop: '12px' }}>
        <SkeletonText width="60%" lines={1} />
        <div style={{ marginTop: '12px' }}>
          <SkeletonText width="100%" lines={2} gap="6px" />
        </div>
      </div>
    </div>
  </div>
);

// Settings cards skeleton - matches exact Settings page structure
export const SkeletonSettingsCards = () => (
  <div className="settings-container">
    {/* System Overview Section Skeleton */}
    <h2 className="settings-section-heading">System Overview</h2>
    <div className="settings-profile-section">
      <div className="profile-avatar-section">
        <SkeletonBox width="64px" height="64px" style={{ borderRadius: '8px', flexShrink: 0 }} />
        <div className="profile-info">
          <SkeletonBox width="120px" height="28px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="60px" height="20px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="100px" height="28px" style={{ borderRadius: '6px', marginTop: '8px' }} />
        </div>
      </div>
      <div className="profile-contact-section">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="contact-item">
            <SkeletonBox width="150px" height="20px" style={{ flexShrink: 0 }} />
            <SkeletonBox width="150px" height="20px" style={{ flex: 1 }} />
            <SkeletonBox width="40px" height="20px" />
          </div>
        ))}
      </div>
    </div>

    {/* Horizontal Separator */}
    <hr className="settings-separator" />

    {/* Account Settings Section Skeleton */}
    <h2 className="settings-section-heading">Account Settings</h2>
    <div className="settings-cards-section">
      <div className="settings-group">
        <div className="settings-cards-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="settings-card">
            <div className="card-icon" style={{ background: 'transparent' }}>
              <SkeletonBox 
                width="40px" 
                height="40px" 
                style={{ 
                  borderRadius: '8px'
                }} 
              />
            </div>
            <div className="card-content">
              <SkeletonBox 
                width="60%" 
                height="25px" 
                style={{ 
                  marginBottom: '6px',
                  borderRadius: '4px'
                }} 
              />
              <ul className="card-items">
                {Array.from({ length: 2 }).map((_, j) => (
                  <li key={j}>
                    <SkeletonBox 
                      width={j === 0 ? '90%' : '70%'} 
                      height="20px" 
                      style={{ borderRadius: '4px' }} 
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>

    {/* Horizontal Separator */}
    <hr className="settings-separator" />

    {/* Integrations Section Skeleton */}
    <h2 className="settings-section-heading">Integrations</h2>
    <div className="settings-cards-section">
      <div className="settings-group">
        <div className="settings-cards-grid">
          {Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="settings-card">
              <div className="card-header">
                <div className="card-icon" style={{ background: 'transparent' }}>
                  <SkeletonBox 
                    width="32px" 
                    height="32px" 
                    style={{ 
                      borderRadius: '6px'
                    }} 
                  />
                </div>
                <SkeletonBox 
                  width="100px" 
                  height="25px" 
                  style={{ 
                    borderRadius: '4px'
                  }} 
                />
              </div>
              <div className="card-content">
                <ul className="card-items">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <li key={j}>
                      <SkeletonBox 
                        width={j === 0 ? '90%' : '70%'} 
                        height="20px" 
                        style={{ borderRadius: '4px' }} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Horizontal Separator */}
    <hr className="settings-separator" />

    {/* Support & Resources Section Skeleton */}
    <h2 className="settings-section-heading">Support & Resources</h2>
    <div className="settings-cards-section">
      <div className="settings-group">
        <div className="settings-cards-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="settings-card">
              <div className="card-header">
                <div className="card-icon" style={{ background: 'transparent' }}>
                  <SkeletonBox 
                    width="32px" 
                    height="32px" 
                    style={{ 
                      borderRadius: '6px'
                    }} 
                  />
                </div>
                <SkeletonBox 
                  width="120px" 
                  height="25px" 
                  style={{ 
                    borderRadius: '4px'
                  }} 
                />
              </div>
              <div className="card-content">
                <ul className="card-items">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <li key={j}>
                      <SkeletonBox 
                        width={j === 0 ? '90%' : '70%'} 
                        height="20px" 
                        style={{ borderRadius: '4px' }} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Table skeleton
export const SkeletonTable = ({ rows = 10, columns = 5 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonBox key={i} width="80%" height="14px" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonBox key={colIndex} width="90%" height="14px" />
        ))}
      </div>
    ))}
  </div>
);

// Dashboard stats skeleton
export const SkeletonDashboardStats = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="skeleton-card" style={{ height: '120px', padding: '20px' }}>
        <SkeletonText width="50%" lines={1} />
        <SkeletonBox width="60%" height="32px" style={{ marginTop: '12px' }} />
        <SkeletonText width="40%" lines={1} style={{ marginTop: '8px' }} />
      </div>
    ))}
  </div>
);

// Agent/Script card skeleton
export const SkeletonScriptCard = () => (
  <div className="skeleton-card" style={{ height: '160px', marginBottom: '16px' }}>
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <SkeletonText width="70%" lines={1} />
          <SkeletonText width="90%" lines={2} gap="8px" style={{ marginTop: '12px' }} />
        </div>
        <SkeletonBox width="60px" height="32px" style={{ borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <SkeletonBox width="80px" height="24px" style={{ borderRadius: '12px' }} />
        <SkeletonBox width="80px" height="24px" style={{ borderRadius: '12px' }} />
      </div>
    </div>
  </div>
);

export const SkeletonScriptList = ({ count = 6 }) => (
  <div>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonScriptCard key={i} />
    ))}
  </div>
);

// Form skeleton
export const SkeletonForm = () => (
  <div style={{ padding: '24px' }}>
    <SkeletonText width="40%" lines={1} style={{ marginBottom: '24px' }} />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} style={{ marginBottom: '24px' }}>
        <SkeletonBox width="120px" height="14px" style={{ marginBottom: '8px' }} />
        <SkeletonBox width="100%" height="40px" style={{ borderRadius: '8px' }} />
      </div>
    ))}
    <SkeletonBox width="120px" height="40px" style={{ borderRadius: '8px', marginTop: '32px' }} />
  </div>
);

// Page skeleton with header and content
export const SkeletonPage = ({ children }) => (
  <div className="skeleton-page">
    <div className="skeleton-page-header">
      <SkeletonBox width="200px" height="32px" />
      <SkeletonBox width="120px" height="40px" style={{ borderRadius: '8px' }} />
    </div>
    <div className="skeleton-page-content">
      {children || <SkeletonTable rows={10} />}
    </div>
  </div>
);

// Voice library skeleton
export const SkeletonVoiceGrid = ({ count = 12 }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
    gap: '16px',
    padding: '24px'
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card" style={{ height: '180px', padding: '16px' }}>
        <SkeletonBox width="60px" height="60px" style={{ borderRadius: '50%', margin: '0 auto 12px' }} />
        <SkeletonText width="80%" lines={1} style={{ marginBottom: '8px' }} />
        <SkeletonText width="60%" lines={1} />
        <SkeletonBox width="100%" height="36px" style={{ borderRadius: '8px', marginTop: '16px' }} />
      </div>
    ))}
  </div>
);

// TTS Providers skeleton - matches exact Voices page TTS Provider sections structure
export const SkeletonTTSProviders = () => {
  // Render skeleton premium voice card
  const renderSkeletonPremiumVoiceCard = () => (
    <div className="premium-voice-card" style={{ pointerEvents: 'none' }}>
      {/* Left Section - Image Skeleton */}
      <div className="premium-voice-card-image">
        <SkeletonBox width="60px" height="60px" style={{ borderRadius: '50%' }} />
      </div>
      
      {/* Middle Section - Content Skeleton */}
      <div className="premium-voice-card-content">
        <SkeletonBox width="60%" height="16px" style={{ marginBottom: '6px' }} />
        <SkeletonBox width="80%" height="14px" style={{ marginBottom: '6px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <SkeletonBox width="24px" height="24px" style={{ borderRadius: '50%' }} />
          <SkeletonBox width="60px" height="12px" />
        </div>
      </div>
      
      {/* Rightmost Section - Controls Skeleton (hidden) */}
      <div className="premium-voice-card-controls" style={{ opacity: 0 }}>
        <SkeletonBox width="32px" height="32px" style={{ borderRadius: '50%' }} />
      </div>
    </div>
  );

  // Render skeleton TTS Provider section
  const renderSkeletonTTSProviderSection = (badgeCount = 5) => (
    <div className="premium-voices-section">
      <div className="premium-voices-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SkeletonBox width="150px" height="24px" />
            <SkeletonBox width="100px" height="18px" />
          </div>
          <SkeletonBox width="80px" height="32px" style={{ borderRadius: '6px' }} />
        </div>
      </div>
      
      {/* Feature Badges Skeleton */}
      <div className="premium-voices-badges">
        {Array.from({ length: badgeCount }).map((_, i) => {
          const widths = [70, 80, 90, 100, 85, 75, 95];
          return (
            <div key={i} className="premium-voice-badge" style={{ background: '#f0f0f0', border: '1px solid #e5e7eb', pointerEvents: 'none' }}>
              <SkeletonBox width="16px" height="16px" style={{ borderRadius: '2px' }} />
              <SkeletonBox width={widths[i % widths.length] + 'px'} height="14px" />
            </div>
          );
        })}
      </div>
      
      {/* Premium Voice Cards Skeleton */}
      <div className="premium-voices-container-wrapper">
        <div className="premium-voices-container">
          {Array.from({ length: 5 }).map((_, i) => (
            <React.Fragment key={i}>
              {renderSkeletonPremiumVoiceCard()}
            </React.Fragment>
          ))}
        </div>
        <div className="premium-voices-fade-right"></div>
      </div>
    </div>
  );

  return (
    <>
      {/* Scalysis V3 Skeleton */}
      {renderSkeletonTTSProviderSection(7)}
      
      {/* Sarvam Skeleton */}
      {renderSkeletonTTSProviderSection(4)}
      
      {/* ElevenLabs Skeleton */}
      {renderSkeletonTTSProviderSection(5)}
      
      {/* Cartesia Skeleton */}
      {renderSkeletonTTSProviderSection(4)}
      
      {/* Scalysis V1 Skeleton */}
      {renderSkeletonTTSProviderSection(4)}
      
      {/* Rime Skeleton */}
      {renderSkeletonTTSProviderSection(3)}
      
      {/* Hume Skeleton */}
      {renderSkeletonTTSProviderSection(3)}
    </>
  );
};

export default {
  SkeletonBox,
  SkeletonText,
  SkeletonCard,
  SkeletonSettingsCards,
  SkeletonTable,
  SkeletonDashboardStats,
  SkeletonScriptCard,
  SkeletonScriptList,
  SkeletonForm,
  SkeletonPage,
  SkeletonVoiceGrid,
  SkeletonTTSProviders
};

