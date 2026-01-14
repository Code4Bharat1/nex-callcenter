import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Settings.css';

const CallSettings = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Retry Settings State
  const [retrySettings, setRetrySettings] = useState({
    maxRetries: 0,
    retryIntervalMinutes: 0,
    autoCancelOnMaxRetries: false,
    maxOutcomeRetries: null,
    allowedTimeStart: '09:00',
    allowedTimeEnd: '20:00',
    timezone: 'Asia/Kolkata'
  });
  
  // Auto Call Settings State
  const [autoCallSettings, setAutoCallSettings] = useState({
    autoCallEnabled: false
  });
  
  // Inbound Settings State
  const [inboundSettings, setInboundSettings] = useState({
    inboundEnabled: false,
    phoneNumber: '',
    defaultInboundScriptId: null,
    inboundLookback: 24
  });

  // Scripts state
  const [scripts, setScripts] = useState([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [shop]);

  const loadSettings = async () => {
    if (!shop) return;
    
    try {
      // Load all settings from user-retry-settings endpoint
      const response = await fetch(`/api/user-retry-settings?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.settings) {
        // Parse retry settings
        const settings = data.settings;
        setRetrySettings({
          maxRetries: settings.maxRetries || 0,
          retryIntervalMinutes: settings.retryIntervalMinutes || 0,
          autoCancelOnMaxRetries: settings.autoCancelOnMaxRetries || false,
          maxOutcomeRetries: settings.maxOutcomeRetries || null,
          allowedTimeStart: settings.allowedTimeStart || '09:00',
          allowedTimeEnd: settings.allowedTimeEnd || '20:00',
          timezone: settings.timezone || 'Asia/Kolkata'
        });
        setAutoCallSettings({
          autoCallEnabled: settings.autoCallEnabled || false
        });
        setInboundSettings({
          inboundEnabled: settings.inboundEnabled || false,
          phoneNumber: settings.phoneNumber || '',
          defaultInboundScriptId: settings.defaultInboundScriptId || null,
          inboundLookback: settings.inboundLookback !== undefined && settings.inboundLookback !== null ? settings.inboundLookback : 24
        });
      }

      // Load scripts for inbound dropdown
      const scriptsResponse = await fetch(`/api/scripts?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const scriptsData = await scriptsResponse.json();
      if (scriptsData.success && scriptsData.data) {
        setScripts(scriptsData.data.scripts || []);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setStatusMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const saveRetrySettings = async () => {
    if (!shop) return;
    
    setSaving(true);
    setStatusMessage(null);
    
    try {
      const response = await fetch('/api/retry-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, ...retrySettings }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Retry settings saved successfully' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save retry settings' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to save retry settings' });
    } finally {
      setSaving(false);
    }
  };

  const saveAutoCallSettings = async () => {
    if (!shop) return;
    
    setSaving(true);
    setStatusMessage(null);
    
    try {
      const response = await fetch('/api/auto-call-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, ...autoCallSettings }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Auto call settings saved successfully' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save auto call settings' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to save auto call settings' });
    } finally {
      setSaving(false);
    }
  };

  const saveInboundSettings = async () => {
    if (!shop) return;
    
    setSaving(true);
    setStatusMessage(null);
    
    try {
      const response = await fetch('/api/inbound-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, ...inboundSettings }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Inbound settings saved successfully' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save inbound settings' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to save inbound settings' });
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    await Promise.all([
      saveRetrySettings(),
      saveAutoCallSettings(),
      saveInboundSettings()
    ]);
  };

  if (!shop) {
    return (
      <div className="settings-container">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#6B7280', fontSize: '16px' }}>No shop selected. Please select a shop to view settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Status Message */}
      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '6px',
          background: statusMessage.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          color: statusMessage.type === 'success' ? '#047857' : '#DC2626',
          border: `1px solid ${statusMessage.type === 'success' ? '#86EFAC' : '#FECACA'}`,
          fontSize: '14px'
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* Retry Settings Card */}
      <div className="settings-card">
        <h3 className="card-heading">Retry Settings</h3>
        
        {/* Failed Call Retries Section */}
        <div className="profile-detail-section">
          <h3 className="profile-detail-subheading">Failed Call Retries</h3>
          <div className="profile-detail-box">
            {/* How Many Times to Retry */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>How Many Times to Retry</span>
                <span className="profile-detail-hint">How many times should we try calling if first call fails? (0-10)</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="number"
                  className="profile-detail-input"
                  min="0"
                  max="10"
                  value={retrySettings.maxRetries}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                    if (!isNaN(value)) {
                      setRetrySettings({ ...retrySettings, maxRetries: value });
                    }
                  }}
                />
              </div>
            </div>
            
            <hr className="profile-detail-divider" />
            
            {/* Wait Time Between Retries */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Wait Time Between Retries</span>
                <span className="profile-detail-hint">How long to wait before trying again (in minutes)</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="number"
                  className="profile-detail-input"
                  min="2"
                  max="1440"
                  value={retrySettings.retryIntervalMinutes}
                  onChange={(e) => setRetrySettings({ ...retrySettings, retryIntervalMinutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Auto-Cancel Section */}
        <div className="profile-detail-section">
          <h3 className="profile-detail-subheading">Auto-Cancel</h3>
          <div className="profile-detail-box">
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Auto cancel in Shopify after max retries</span>
                <span className="profile-detail-hint">Automatically cancel order in Shopify when we've tried calling the maximum number of times</span>
              </div>
              <div className="profile-detail-action">
                <label className="profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={retrySettings.autoCancelOnMaxRetries}
                    onChange={(e) => setRetrySettings({ ...retrySettings, autoCancelOnMaxRetries: e.target.checked })}
                  />
                  <span className="profile-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Retry Outcome Section */}
        <div className="profile-detail-section">
          <h3 className="profile-detail-subheading">Retry Outcome</h3>
          <div className="profile-detail-box">
            {/* Max Outcome Retries */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Max Outcome Retries</span>
                <span className="profile-detail-hint">Maximum number of retries allowed for orders that match retry criteria (leave empty for no limit)</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="number"
                  className="profile-detail-input"
                  min="0"
                  max="100"
                  value={retrySettings.maxOutcomeRetries !== null && retrySettings.maxOutcomeRetries !== undefined ? retrySettings.maxOutcomeRetries : ''}
                  placeholder="No limit"
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value);
                    if (e.target.value === '' || (!isNaN(value) && value >= 0)) {
                      setRetrySettings({ ...retrySettings, maxOutcomeRetries: value });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* When to Make Calls Section */}
        <div className="profile-detail-section">
          <h3 className="profile-detail-subheading">When to Make Calls</h3>
          <div className="profile-detail-box">
            {/* Start Time */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Start Time</span>
                <span className="profile-detail-hint">Earliest time we can start calling</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="time"
                  className="profile-detail-input"
                  value={retrySettings.allowedTimeStart}
                  onChange={(e) => setRetrySettings({ ...retrySettings, allowedTimeStart: e.target.value })}
                />
              </div>
            </div>
            
            <hr className="profile-detail-divider" />
            
            {/* End Time */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>End Time</span>
                <span className="profile-detail-hint">Latest time we can make calls</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="time"
                  className="profile-detail-input"
                  value={retrySettings.allowedTimeEnd}
                  onChange={(e) => setRetrySettings({ ...retrySettings, allowedTimeEnd: e.target.value })}
                />
              </div>
            </div>
            
            <hr className="profile-detail-divider" />
            
            {/* Timezone */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Timezone</span>
                <span className="profile-detail-hint">Your local timezone</span>
              </div>
              <div className="profile-detail-action">
                <select
                  className="profile-detail-input"
                  value={retrySettings.timezone}
                  onChange={(e) => setRetrySettings({ ...retrySettings, timezone: e.target.value })}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Automation Section */}
        <div className="profile-detail-section">
          <h3 className="profile-detail-subheading">Automation</h3>
          <div className="profile-detail-box">
            {/* Automatically call new orders */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Automatically call new orders</span>
                <span className="profile-detail-hint">Start calling new orders automatically as soon as they come in</span>
              </div>
              <div className="profile-detail-action">
                <label className="profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoCallSettings.autoCallEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAutoCallSettings({ ...autoCallSettings, autoCallEnabled: enabled });
                    }}
                  />
                  <span className="profile-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="profile-save-container">
        <button className="profile-save-button-new" onClick={saveAllSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Inbound Settings Card */}
      <div className="settings-card">
        <h3 className="card-heading">Inbound Call Settings</h3>
        
        <div className="profile-detail-section">
          <h3 className="profile-detail-subheading">Inbound Call Routing</h3>
          <div className="profile-detail-box">
            {/* Enable Inbound Calls */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Enable Inbound Calls</span>
              </div>
              <div className="profile-detail-action">
                <label className="profile-toggle-switch">
                  <input
                    type="checkbox"
                    checked={inboundSettings.inboundEnabled}
                    onChange={(e) => setInboundSettings({ ...inboundSettings, inboundEnabled: e.target.checked })}
                  />
                  <span className="profile-toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <hr className="profile-detail-divider" />
            
            {/* Inbound Phone Number */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Inbound Phone Number</span>
                <span className="profile-detail-hint">This number will be used for inbound calls</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="text"
                  className="profile-detail-input"
                  value={inboundSettings.phoneNumber}
                  onChange={(e) => setInboundSettings({ ...inboundSettings, phoneNumber: e.target.value })}
                  placeholder="Enter inbound phone number"
                />
              </div>
            </div>
            
            <hr className="profile-detail-divider" />
            
            {/* Inbound Lookback */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Inbound Lookback Period</span>
                <span className="profile-detail-hint">How many hours to look back for inbound calls</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="number"
                  className="profile-detail-input"
                  min="1"
                  max="168"
                  value={inboundSettings.inboundLookback || ''}
                  onChange={(e) => setInboundSettings({ ...inboundSettings, inboundLookback: parseInt(e.target.value) || 1 })}
                  placeholder="24"
                />
              </div>
            </div>
            
            <hr className="profile-detail-divider" />
            
            {/* Default Inbound Script */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Default Inbound Script</span>
                <span className="profile-detail-hint">Script to use for inbound calls</span>
              </div>
              <div className="profile-detail-action">
                <select
                  className="profile-detail-input"
                  value={inboundSettings.defaultInboundScriptId || ''}
                  onChange={(e) => setInboundSettings({ ...inboundSettings, defaultInboundScriptId: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Select default script...</option>
                  {scripts.map(script => (
                    <option key={script.id} value={script.id}>{script.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSettings;
