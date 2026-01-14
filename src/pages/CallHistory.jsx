import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import './CallHistory.css';

const CallHistory = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shop = shopProp || searchParams.get('shop');
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyStats, setDailyStats] = useState(null);
  const [callBreakdown, setCallBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isTestShop, setIsTestShop] = useState(false);

  useEffect(() => {
    // Set default date to today (IST)
    const getISTToday = () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffset);
      return istNow.toISOString().split('T')[0];
    };

    const urlDate = searchParams.get('date');
    setSelectedDate(urlDate || getISTToday());
  }, [searchParams]);

  useEffect(() => {
    if (shop && selectedDate) {
      loadCallHistory();
      checkTestShop();
    }
  }, [shop, selectedDate]);

  const checkTestShop = async () => {
    if (!shop) return;
    try {
      const balanceData = await api.getShopBalance(shop);
      if (balanceData.success && balanceData.data) {
        setIsTestShop(balanceData.data.isTestShop === true);
      }
    } catch (e) {
      console.error('Error checking shop:', e);
      setIsTestShop(false);
    }
  };

  const loadCallHistory = async () => {
    if (!shop || !selectedDate) return;

    try {
      setLoading(true);
      const [statsResponse, breakdownResponse] = await Promise.all([
        api.getDailyBillingStats(shop, selectedDate),
        api.getBillingBreakdown(shop, selectedDate)
      ]);

      if (statsResponse.success) {
        setDailyStats(statsResponse.stats);
      }

      if (breakdownResponse.success) {
        setCallBreakdown(breakdownResponse.breakdown);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (rowId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const calculateCallStats = (calls) => {
    const totalCalls = calls.length;
    const connectedCalls = calls.filter(c => c.status === 'completed' || c.status === 'connected').length;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
    const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);
    return { totalCalls, connectedCalls, totalDuration, totalCost };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!shop) {
    return (
      <div className="call-history-page">
        <div className="error-message">No shop parameter found. Please select a shop.</div>
      </div>
    );
  }

  return (
    <div className="call-history-page">
      {isTestShop && (
        <div className="blur-overlay">
          <div className="overlay-content">
            <h2>Connect Your Shopify Store</h2>
            <p>Connect your store to view call history and billing data.</p>
            <button className="connect-btn" onClick={() => navigate('/integrations')}>
              Connect to Shopify
            </button>
          </div>
        </div>
      )}

      {/* Compact Header with Date Filter on Right */}
      <div className="call-history-header-compact">
        <div>
          <h1>Call History</h1>
          <p className="call-history-subtitle">View detailed call history and billing breakdown by day</p>
        </div>
        <div className="call-history-header-actions">
          <input
            type="date"
            id="datePicker"
            className="filter-date-compact"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              navigate(`/call-history?shop=${encodeURIComponent(shop)}&date=${e.target.value}`);
            }}
          />
          <button
            className="refresh-btn-compact"
            onClick={loadCallHistory}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loading inline size="small" />
                Loading...
              </>
            ) : (
              'Load History'
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid - Only 5 Metrics as Requested */}
      {dailyStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-top-right" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="stat-label">Calls Connected</div>
            <div className="stat-value">{dailyStats.totalConnectedCalls || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-top-right" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div className="stat-label">Calls Initiated</div>
            <div className="stat-value">{dailyStats.callsInitiated || dailyStats.totalCallsMade || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-top-right" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-label">Total Talk Time</div>
            <div className="stat-value">
              {(() => {
                const seconds = dailyStats.totalDuration || 0;
                if (seconds === 0) return '0s';
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                if (mins > 0) {
                  return `${mins}m ${secs}s`;
                }
                return `${secs}s`;
              })()}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-top-right" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div className="stat-label">Pickup Rate</div>
            <div className="stat-value">{dailyStats.pickupRate || 0}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-top-right" style={{ background: '#dbeafe', color: '#3b82f6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6"/>
              </svg>
            </div>
            <div className="stat-label">Total Billing Amount</div>
            <div className="stat-value">₹{(dailyStats.totalAmount || 0).toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="call-history-table">
        <div className="table-header">
          <h3>Call Breakdown</h3>
        </div>
        <div className="call-history-content">
          {!callBreakdown ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📞</div>
              <div>No call data available for this date</div>
            </div>
          ) : (
            <>
              {callBreakdown.dashboardCalls && callBreakdown.dashboardCalls.length > 0 && (
                <CallRow
                  type="Dashboard Calls"
                  calls={callBreakdown.dashboardCalls}
                  calculateStats={calculateCallStats}
                  expanded={expandedRows.has('dashboard')}
                  onToggle={() => toggleExpand('dashboard')}
                  formatDate={formatDate}
                />
              )}
              {callBreakdown.csvCalls && Object.entries(callBreakdown.csvCalls).map(([csvName, calls]) => (
                <CallRow
                  key={csvName}
                  type={csvName}
                  calls={calls}
                  calculateStats={calculateCallStats}
                  expanded={expandedRows.has(`csv-${csvName}`)}
                  onToggle={() => toggleExpand(`csv-${csvName}`)}
                  formatDate={formatDate}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CallRow = ({ type, calls, calculateStats, expanded, onToggle, formatDate }) => {
  const stats = calculateStats(calls);

  return (
    <>
      <div className="table-row" onClick={onToggle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="call-type">{type}</div>
            <div className="call-stats">
              {stats.totalCalls} calls ({stats.connectedCalls} connected) • {stats.totalDuration}s • ₹{stats.totalCost.toFixed(2)}
            </div>
          </div>
          <div className="cost-info">₹{stats.totalCost.toFixed(2)}</div>
        </div>
      </div>
      {expanded && (
        <div className="expandable-content show">
          <table className="order-details-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Call Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call, idx) => (
                <tr key={idx}>
                  <td>{call.orderNumber || '-'}</td>
                  <td>{call.customerName || '-'}</td>
                  <td>{call.customerPhone || '-'}</td>
                  <td>{formatDate(call.startedAt || call.createdAt)}</td>
                  <td>{call.duration || 0}s</td>
                  <td>{call.status || 'unknown'}</td>
                  <td>₹{(call.cost || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default CallHistory;
