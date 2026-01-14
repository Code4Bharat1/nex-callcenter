import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import './Integrations.css';

const Integrations = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  const [activeTab, setActiveTab] = useState('shopify');
  const [connected, setConnected] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    shopDomain: '',
    clientId: '',
    clientSecret: ''
  });

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await window.fetch('/api/integrations/status', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.connected && data.shop) {
        setConnected(true);
        setShopData(data.shop);
      } else {
        setConnected(false);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setConnecting(true);

    try {
      // Validate shop domain
      if (!formData.shopDomain.endsWith('.myshopify.com')) {
        throw new Error('Shop domain must end with .myshopify.com');
      }

      // For OAuth flow, we'll redirect to Shopify authorize
      // But for now, we'll use the direct token method as fallback
      const response = await window.fetch('/api/shopify/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopUrl: formData.shopDomain,
          accessToken: formData.clientSecret // Using clientSecret as accessToken for direct method
        })
      });

      const data = await response.json();

      if (data.success) {
        setConnected(true);
        setShopData({ shopDomain: formData.shopDomain });
        setFormData({ shopDomain: '', clientId: '', clientSecret: '' });
      } else {
        throw new Error(data.error || 'Failed to connect');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect store');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this store?')) {
      return;
    }

    try {
      const response = await window.fetch('/api/integrations/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setConnected(false);
        setShopData(null);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      setError(err.message || 'Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="integrations-container">
        <div className="loading-message">Loading integration status...</div>
      </div>
    );
  }

  const renderShopifyContent = () => (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-title">
          <div className="integration-logo">
            <img src="/images/shopify-logo-svg-vector.svg" alt="Shopify" style={{ width: '24px', height: '24px' }} />
          </div>
          <span>Shopify</span>
        </div>
        <div className={`status-badge ${connected ? 'status-connected' : 'status-not-connected'}`}>
          {connected ? 'Connected' : 'Not Connected'}
        </div>
      </div>

      <p className="integration-description">
        Connect your Shopify store to enable automated order management, customer calls, and RTO tracking.
        Once connected, you'll be able to upload CSV files, manage call scripts, and track order statuses.
      </p>

      {connected && shopData ? (
        <div className="connected-info">
          <div className="connected-info-title">✅ Connected</div>
          <div className="connected-info-detail">Shop: {shopData.shopDomain}</div>
          {shopData.connectedAt && (
            <div className="connected-info-detail">
              Connected: {new Date(shopData.connectedAt).toLocaleDateString()}
            </div>
          )}
          <button className="btn btn-secondary disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className="connection-form">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleConnect}>
            <div className="form-group">
              <label className="form-label" htmlFor="shopDomain">Shop Domain</label>
              <input
                type="text"
                id="shopDomain"
                name="shopDomain"
                className="form-input"
                placeholder="example.myshopify.com"
                value={formData.shopDomain}
                onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                required
              />
              <div className="form-hint">Use your myshopify.com domain</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="clientId">Client ID</label>
              <input
                type="text"
                id="clientId"
                name="clientId"
                className="form-input"
                placeholder="App client ID"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="clientSecret">Access Token</label>
              <input
                type="password"
                id="clientSecret"
                name="clientSecret"
                className="form-input"
                placeholder="Shopify access token"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                required
              />
              <div className="form-hint">Your Shopify private app access token</div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect Store'}
            </button>
          </form>
        </div>
      )}
    </div>
  );

  const renderNdrContent = () => (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-title">
          <div className="integration-logo">📦</div>
          <span>NDR (Non-Delivery Report)</span>
        </div>
        <div className="status-badge status-not-connected">
          Not Connected
        </div>
      </div>

      <p className="integration-description">
        Connect your NDR (Non-Delivery Report) service to automatically track failed delivery attempts and manage return-to-origin (RTO) orders. 
        This integration helps you identify delivery issues early and take proactive action to recover orders.
      </p>

      <div className="connection-form">
        <div className="form-group">
          <label className="form-label" htmlFor="ndrProvider">NDR Provider</label>
          <select id="ndrProvider" className="form-input">
            <option value="">Select NDR Provider</option>
            <option value="shiprocket">Shiprocket</option>
            <option value="delhivery">Delhivery</option>
            <option value="pickrr">Pickrr</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ndrApiKey">API Key</label>
          <input
            type="password"
            id="ndrApiKey"
            name="ndrApiKey"
            className="form-input"
            placeholder="Enter your NDR provider API key"
          />
          <div className="form-hint">Your NDR provider API key for authentication</div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ndrApiSecret">API Secret</label>
          <input
            type="password"
            id="ndrApiSecret"
            name="ndrApiSecret"
            className="form-input"
            placeholder="Enter your NDR provider API secret"
          />
          <div className="form-hint">Your NDR provider API secret (if required)</div>
        </div>
        <button type="button" className="btn btn-primary" disabled>
          Connect NDR Service
        </button>
        <div className="form-hint" style={{ marginTop: '12px', color: '#6b7280', fontSize: '13px' }}>
          NDR integration is coming soon. This feature will allow automatic tracking of failed delivery attempts and RTO orders.
        </div>
      </div>
    </div>
  );

  const renderOthersContent = () => (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-title">
          <div className="integration-logo">🔌</div>
          <span>Other Integrations</span>
        </div>
      </div>

      <p className="integration-description">
        Additional integrations are coming soon. We're constantly working on adding new integrations to help you streamline your workflow.
      </p>

      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        <p>More integrations will be available here in the future.</p>
        <p style={{ marginTop: '12px', fontSize: '14px' }}>
          Have a specific integration in mind? Contact our support team to request it.
        </p>
      </div>
    </div>
  );

  return (
    <div className="integrations-container">
      <div className="page-header">
        <p className="page-subtitle">Connect your services to get started</p>
      </div>

      {/* Integration Navbar */}
      <div className="integrations-navbar">
        <button
          className={`integration-nav-item ${activeTab === 'shopify' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopify')}
        >
          Shopify
        </button>
        <button
          className={`integration-nav-item ${activeTab === 'ndr' ? 'active' : ''}`}
          onClick={() => setActiveTab('ndr')}
        >
          NDR
        </button>
        <button
          className={`integration-nav-item ${activeTab === 'others' ? 'active' : ''}`}
          onClick={() => setActiveTab('others')}
        >
          Others
        </button>
      </div>

      {/* Integration Content */}
      <div className="integration-content">
        {activeTab === 'shopify' && renderShopifyContent()}
        {activeTab === 'ndr' && renderNdrContent()}
        {activeTab === 'others' && renderOthersContent()}
      </div>
    </div>
  );
};

export default Integrations;


