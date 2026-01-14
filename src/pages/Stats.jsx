import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import { parseTranscript } from '../utils/transcriptParser';
import './Stats.css';
import './CampaignDetails.css';

const Stats = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  // State
  const [dailyStats, setDailyStats] = useState(null);
  const [callBreakdown, setCallBreakdown] = useState(null);
  const [allCalls, setAllCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range filter
  const getToday = () => new Date().toISOString().split('T')[0];
  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };
  const getLast7Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().split('T')[0];
  };
  const getLast30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [selectedPreset, setSelectedPreset] = useState('today');
  
  // Order details modal state
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCalls, setOrderCalls] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Handle preset selection
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    const today = getToday();
    
    switch(preset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = getYesterday();
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'last7days':
        setStartDate(getLast7Days());
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(getLast30Days());
        setEndDate(today);
        break;
      default:
        break;
    }
  };

  // Handle custom date changes
  const handleStartDateChange = (date) => {
    setStartDate(date);
    setSelectedPreset('custom');
    if (date > endDate) {
      setEndDate(date);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setSelectedPreset('custom');
    if (date < startDate) {
      setStartDate(date);
    }
  };

  useEffect(() => {
    if (!shop) {
      setError('No shop parameter found');
      setLoading(false);
      return;
    }

    loadData();
  }, [shop, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load daily billing stats and breakdown for selected date range
      const [statsResponse, breakdownResponse] = await Promise.all([
        api.getDailyBillingStats(shop, startDate, endDate),
        api.getBillingBreakdown(shop, startDate, endDate)
      ]);

      if (statsResponse.success && statsResponse.stats) {
        setDailyStats(statsResponse.stats);
      }

      if (breakdownResponse.success && breakdownResponse.breakdown) {
        setCallBreakdown(breakdownResponse.breakdown);
        
        // Combine all calls from dashboard and CSV uploads
        const combinedCalls = [];
        
        // Add dashboard calls
        if (breakdownResponse.breakdown.dashboardCalls) {
          breakdownResponse.breakdown.dashboardCalls.forEach(call => {
            combinedCalls.push({
              ...call,
              source: 'Dashboard',
              type: 'dashboard'
            });
          });
        }
        
        // Add CSV calls
        if (breakdownResponse.breakdown.csvUploads) {
          breakdownResponse.breakdown.csvUploads.forEach(upload => {
            if (upload.calls && upload.calls.length > 0) {
              upload.calls.forEach(call => {
                combinedCalls.push({
                  ...call,
                  source: upload.filename,
                  type: 'csv'
                });
              });
            }
          });
        }
        
        // Add token usage entries (including plan usage and voice previews)
        if (breakdownResponse.breakdown.tokenUsages) {
          breakdownResponse.breakdown.tokenUsages.forEach(usage => {
            // Determine source label based on service type
            let sourceLabel = 'Token Usage';
            if (usage.type === 'plan_usage') {
              if (usage.service === 'write_with_ai') {
                sourceLabel = 'Write with AI';
              } else if (usage.service === 'chat_completions') {
                sourceLabel = 'Chat Completions';
              } else if (usage.service === 'voice_cloning') {
                sourceLabel = 'Voice Cloning';
              }
            } else if (usage.type === 'voice_preview' || usage.service === 'voice_preview_cartesia' || usage.service === 'voice_preview_sarvam') {
              // Voice preview usage (live generation)
              const provider = usage.service === 'voice_preview_sarvam' ? 'Sarvam' : 'Cartesia';
              sourceLabel = `Voice Preview (${provider})`;
            }
            
            combinedCalls.push({
              service: usage.service,
              tokensUsed: usage.tokensUsed || 0,
              amountCharged: usage.cost || 0, // ₹0 for included usage
              cost: usage.cost || 0,
              billingDate: usage.createdAt,
              timestamp: usage.createdAt,
              source: sourceLabel,
              type: usage.type === 'plan_usage' ? 'plan_usage' : (usage.type === 'voice_preview' ? 'voice_preview' : 'token'),
              description: usage.description,
              orderNumber: null, // Token usage doesn't have order numbers
              isIncluded: usage.isIncluded || false // Flag to show if it's included in plan
            });
          });
        }
        
        // Sort by billing date (most recent first)
        combinedCalls.sort((a, b) => {
          const dateA = new Date(a.billingDate || a.timestamp || 0);
          const dateB = new Date(b.billingDate || b.timestamp || 0);
          return dateB - dateA;
        });
        
        setAllCalls(combinedCalls);
      }

    } catch (err) {
      console.error('[Stats] Error loading data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatISTDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      
      // Use timeZone option to properly convert to IST
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatServiceName = (service) => {
    if (!service) return 'LLM Usage';
    
    // Map service names to user-friendly display names
    const serviceMap = {
      'write_with_ai': 'Write with AI',
      'chat_completions': 'Chat Completions',
      'voice_cloning': 'Voice Cloning',
      'claude_script_generation': 'Script Generation',
      'claude_script_rewrite': 'Script Rewrite',
      'groq_chat': 'Script Chat',
      'voice_preview_cartesia': 'Voice Preview (Cartesia)',
      'voice_preview_sarvam': 'Voice Preview (Sarvam)',
      'groq_evaluation_agent_response': 'Success',
      'groq_test_agent_response': 'Success',
      'azure_evaluation_extract_rules': 'Azure - Extract Rules',
      'azure_evaluation_customer_response': 'Azure - Evaluation (Customer)',
      'azure_evaluation_conversation': 'Azure - Evaluate Conversation',
      'azure_script_refinement': 'Azure - Script Refinement'
    };
    
    // If exact match found, return formatted name
    if (serviceMap[service]) {
      return serviceMap[service];
    }
    
    // Check if service contains "groq" and "test" and "agent" to catch variations
    if (service.toLowerCase().includes('groq') && service.toLowerCase().includes('test') && service.toLowerCase().includes('agent')) {
      return 'Success';
    }
    
    // Otherwise, format the service name nicely
    return service
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusText = (status) => {
    if (!status) return 'N/A';
    const statusMap = {
      'pending': 'Pending',
      'queued': 'Queued',
      'calling': 'Calling',
      'completed': 'Completed',
      'failed': 'Failed',
      'no_answer': 'No Answer'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const handleShowOrderDetails = async (orderIdOrNumber) => {
    if (!orderIdOrNumber) return;
    
    setLoadingOrderDetails(true);
    setShowOrderDetails(true);
    
    try {
      // Try as orderNumber first (since billing breakdown provides orderNumber)
      // The API will handle looking up orderId from orderNumber if needed
      const response = await fetch(`/api/order-details?orderNumber=${encodeURIComponent(orderIdOrNumber)}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // If orderNumber lookup fails, try as orderId
        if (response.status === 404) {
          const retryResponse = await fetch(`/api/order-details?orderId=${encodeURIComponent(orderIdOrNumber)}&shop=${encodeURIComponent(shop)}`, {
            credentials: 'include'
          });
          if (!retryResponse.ok) {
            throw new Error('Order not found');
          }
          const retryData = await retryResponse.json();
          if (retryData.success) {
            setSelectedOrder(retryData.order);
            setOrderCalls(retryData.calls || []);
          } else {
            throw new Error(retryData.error || 'Failed to load order details');
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        const data = await response.json();
        if (data.success) {
          setSelectedOrder(data.order);
          setOrderCalls(data.calls || []);
        } else {
          throw new Error(data.error || 'Failed to load order details');
        }
      }
    } catch (error) {
      console.error('[Stats] Error loading order details:', error);
      alert(`Failed to load order details: ${error.message || 'Unknown error'}`);
      setShowOrderDetails(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const getCallStatusBadge = (call) => {
    // For token usage entries, show a different status
    if (call.type === 'token') {
      return { label: 'LLM Usage', color: '#8b5cf6', bg: '#f3e8ff' };
    }
    
    const duration = call.durationSeconds || call.duration || 0;
    const outcome = call.callOutcome || call.outcome || '';
    
    if (duration > 0) {
      return { label: 'Connected', color: '#10b981', bg: '#ecfdf5' };
    } else if (outcome.toLowerCase().includes('unanswered') || outcome.toLowerCase().includes('no_answer')) {
      return { label: 'No Answer', color: '#f59e0b', bg: '#fef3c7' };
    } else {
      return { label: 'Failed', color: '#ef4444', bg: '#fef2f2' };
    }
  };

  if (!shop) {
    return (
      <div className="stats-container">
        <div className="error-message">
          <p>No shop parameter found. Please select a shop.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stats-container">
        <div className="loading-message">
          <Loading size="large" text="Loading call analytics..." />
        </div>
      </div>
    );
  }

  const stats = dailyStats || {};
  const tokenCost = stats.totalTokenCost || 0;
  const totalBillingWithTokens = (stats.totalAmount || 0) + tokenCost;
  const metrics = {
    callsConnected: stats.totalConnectedCalls || 0,
    callsInitiated: stats.callsInitiated || stats.totalCallsMade || 0,
    totalTalkTime: stats.totalDuration || 0,
    pickupRate: stats.pickupRate || 0,
    totalBillingAmount: totalBillingWithTokens,
    tokenCost: tokenCost,
    tokensUsed: stats.totalTokensUsed || 0
  };

  return (
    <div className="stats-container">
      {/* Header with Date Filter on Right */}
      <div className="stats-header-compact">
        <div>
          <h1>Billing</h1>
          <p className="stats-subtitle">View detailed call history, token usage, and billing breakdown by day</p>
        </div>
        <div className="stats-header-actions">
          {/* Quick Select Presets */}
          <div className="billing-date-presets">
            <button
              className={`billing-preset-btn ${selectedPreset === 'today' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('today')}
            >
              Today
            </button>
            <button
              className={`billing-preset-btn ${selectedPreset === 'yesterday' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('yesterday')}
            >
              Yesterday
            </button>
            <button
              className={`billing-preset-btn ${selectedPreset === 'last7days' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('last7days')}
            >
              Last 7 days
            </button>
            <button
              className={`billing-preset-btn ${selectedPreset === 'last30days' ? 'active' : ''}`}
              onClick={() => handlePresetSelect('last30days')}
            >
              Last 30 days
            </button>
          </div>
          
          {/* Date Range Inputs */}
          <div className="billing-date-range">
            <div className="billing-date-input-group">
              <label className="billing-date-label">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                max={endDate}
                className="billing-date-input"
              />
            </div>
            <div className="billing-date-separator">to</div>
            <div className="billing-date-input-group">
              <label className="billing-date-label">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={startDate}
                max={getToday()}
                className="billing-date-input"
              />
            </div>
          </div>
          
          <button onClick={loadData} className="refresh-btn-compact">
            Load History
          </button>
        </div>
      </div>

      {/* Metrics Cards - Dashboard Tile Style */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Calls Connected</div>
            <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{metrics.callsConnected}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Calls Initiated</div>
            <div className="metric-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{metrics.callsInitiated}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Total Talk Time</div>
            <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{formatTime(metrics.totalTalkTime)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Pickup Rate</div>
            <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{metrics.pickupRate}%</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Total Billing Amount</div>
            <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{formatCurrency(metrics.totalBillingAmount)}</div>
          {metrics.tokenCost > 0 && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              (Calls: {formatCurrency(stats.totalAmount || 0)} + Tokens: {formatCurrency(metrics.tokenCost)})
            </div>
          )}
        </div>
        
        {metrics.tokensUsed > 0 && (
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-label">Tokens Used</div>
              <div className="metric-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <div className="metric-value">{metrics.tokensUsed.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Cost: {formatCurrency(metrics.tokenCost)}
            </div>
          </div>
        )}
      </div>

      {/* Call History List - Premium Design */}
      <div className="call-history-section">
        <div className="call-history-header">
          <h2 className="call-history-title">Call Breakdown</h2>
          <div className="call-history-subtitle">Dashboard Calls</div>
        </div>
        
        {allCalls.length === 0 ? (
          <div className="no-calls-message">
            <p>No calls found for the selected date range.</p>
          </div>
        ) : (
          <div className="calls-table-wrapper">
            <table className="calls-table-premium">
              <thead>
                <tr>
                  <th className="col-order">Order Number</th>
                  <th className="col-customer">Customer Name / Service</th>
                  <th className="col-phone">Phone Number</th>
                  <th className="col-duration">Duration / Tokens</th>
                  <th className="col-status">Status</th>
                  <th className="col-outcome">Outcome</th>
                  <th className="col-cost">Cost</th>
                  <th className="col-source">Source</th>
                  <th className="col-time">Time</th>
                </tr>
              </thead>
              <tbody>
                {allCalls.map((call, index) => {
                  const statusBadge = getCallStatusBadge(call);
                  // Use orderNumber since billing breakdown doesn't include orderId
                  const orderNumber = call.orderNumber;
                  return (
                    <tr 
                      key={index} 
                      className="call-row-premium"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (orderNumber && orderNumber !== 'N/A') {
                          // Remove # if present
                          const cleanOrderNumber = orderNumber.toString().replace(/^#/, '');
                          handleShowOrderDetails(cleanOrderNumber);
                        }
                      }}
                      style={{ cursor: (orderNumber && orderNumber !== 'N/A') ? 'pointer' : 'default' }}
                    >
                      <td className="cell-order">
                        <span className="order-number-value">
                          {call.type === 'token' || call.type === 'plan_usage' ? '—' : `#${orderNumber || 'N/A'}`}
                        </span>
                      </td>
                      <td className="cell-customer">
                        <span className="customer-name-value">
                          {call.type === 'token' || call.type === 'plan_usage' ? (call.description || formatServiceName(call.service) || 'LLM Usage') : (call.customerName || 'N/A')}
                        </span>
                      </td>
                      <td className="cell-phone">
                        <span className="phone-value">{call.phoneNumber || 'N/A'}</span>
                      </td>
                      <td className="cell-duration">
                        {call.type === 'token' || call.type === 'plan_usage' ? (
                          <span className="duration-value">{call.tokensUsed?.toLocaleString() || 0} tokens</span>
                        ) : (
                          <span className="duration-value">{formatTime(call.durationSeconds || call.duration || 0)}</span>
                        )}
                      </td>
                      <td className="cell-status">
                        <span 
                          className="status-badge-premium"
                          style={{ 
                            color: statusBadge.color, 
                            backgroundColor: statusBadge.bg 
                          }}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="cell-outcome">
                        <span className="outcome-value">
                          {call.type === 'token' || call.type === 'plan_usage' ? formatServiceName(call.service) : (call.callOutcome || call.outcome || 'N/A')}
                        </span>
                      </td>
                      <td className="cell-cost">
                        <span className="cost-value">{formatCurrency(call.amountCharged || call.cost || 0)}</span>
                      </td>
                      <td className="cell-source">
                        <span className="source-value">{call.source || 'Dashboard'}</span>
                      </td>
                      <td className="cell-time">
                        <span className="time-value">{formatDateTime(call.billingDate || call.timestamp)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="campaigns-modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="campaigns-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="campaigns-modal-header">
              <h3 className="campaigns-modal-title">
                {loadingOrderDetails 
                  ? 'Loading...' 
                  : `Order Details - ${selectedOrder?.orderNumber ? `#${selectedOrder.orderNumber}` : 'N/A'}`}
              </h3>
              <button 
                className="campaigns-modal-close"
                onClick={() => setShowOrderDetails(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            {loadingOrderDetails ? (
              <div className="order-details-loading">
                <Loading size="medium" text="Loading order details..." />
              </div>
            ) : selectedOrder && (
              <div className="campaigns-modal-body">
                {/* Customer Information Section */}
                <div className="campaigns-info-section">
                  <h4 className="campaigns-info-section-title">Customer Information</h4>
                  <div className="campaigns-info-grid-two-col">
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Name</span>
                      <span className="campaigns-info-value">{selectedOrder.customerName || 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Phone</span>
                      <span className="campaigns-info-value">{selectedOrder.customerPhone || 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Email</span>
                      <span className="campaigns-info-value">{selectedOrder.customerEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="campaigns-info-divider"></div>

                {/* Order Information Section */}
                <div className="campaigns-info-section">
                  <h4 className="campaigns-info-section-title">Order Information</h4>
                  <div className="campaigns-info-grid-two-col">
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Order Number</span>
                      <span className="campaigns-info-value">{selectedOrder.orderNumber ? `#${selectedOrder.orderNumber}` : 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Amount</span>
                      <span className="campaigns-info-value">
                        {selectedOrder.totalPrice 
                          ? `${selectedOrder.totalPrice} ${selectedOrder.currency || ''}`.trim()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Date</span>
                      <span className="campaigns-info-value">{selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) : 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Status</span>
                      <span className="campaigns-info-value">{getStatusText(selectedOrder.callStatus)}</span>
                    </div>
                  </div>
                </div>

                {orderCalls.length > 0 && (
                  <>
                    <div className="campaigns-info-divider"></div>
                    {/* Call History Section */}
                    <div className="campaigns-info-section">
                      <h4 className="campaigns-info-section-title">Call History ({orderCalls.length} {orderCalls.length === 1 ? 'call' : 'calls'})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orderCalls.map((call, index) => (
                          <div key={call.id || index} style={{ 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px', 
                            padding: '16px',
                            background: '#f9fafb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                  Call #{index + 1}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <span>{formatISTDateTime(call.createdAt || call.startedAt)}</span>
                                  <span>•</span>
                                  <span>Duration: {call.callDuration ? call.callDuration + 's' : 'N/A'}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                                {call.callStatus || 'Unknown'}
                              </span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: '12px' }}>
                              {selectedOrder.script && (
                                <div className="campaigns-info-row">
                                  <span className="campaigns-info-label">Script</span>
                                  <span className="campaigns-info-value">{selectedOrder.script.name || 'N/A'}</span>
                                </div>
                              )}
                              {call.callOutcomeCategory && (
                                <div className="campaigns-info-row">
                                  <span className="campaigns-info-label">Outcome</span>
                                  <span className="campaigns-info-value">{call.callOutcomeCategory}</span>
                                </div>
                              )}
                              {call.callInterestScore && (
                                <div className="campaigns-info-row">
                                  <span className="campaigns-info-label">Interest Score</span>
                                  <span className="campaigns-info-value campaigns-info-value-emphasis">{call.callInterestScore}</span>
                                </div>
                              )}
                            </div>

                            {call.audioUrl && call.audioUrl.startsWith('https://') && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '8px' }}>Audio</span>
                                <audio controls style={{ width: '100%', height: '32px', marginBottom: '8px' }}>
                                  <source src={call.audioUrl} type="audio/mpeg" />
                                </audio>
                                <button
                                  className="campaigns-btn-unified campaigns-btn-secondary-unified"
                                  onClick={() => window.open(call.audioUrl, '_blank')}
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  Download Audio
                                </button>
                              </div>
                            )}
                            
                            {call.transcript && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '12px' }}>Transcript</span>
                                <div style={{ 
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  padding: '8px',
                                  background: '#f9fafb',
                                  borderRadius: '8px'
                                }}>
                                  {parseTranscript(call.transcript).map((msg, msgIndex) => (
                                    <div
                                      key={msgIndex}
                                      style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        alignItems: 'flex-start',
                                        gap: '8px'
                                      }}
                                    >
                                      <div
                                        style={{
                                          maxWidth: '75%',
                                          padding: '10px 14px',
                                          borderRadius: '12px',
                                          fontSize: '13px',
                                          lineHeight: '1.5',
                                          wordBreak: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          background: msg.role === 'user' ? '#4B5CFF' : '#ffffff',
                                          color: msg.role === 'user' ? '#ffffff' : '#111827',
                                          border: msg.role === 'agent' ? '1px solid #e5e7eb' : 'none',
                                          boxShadow: msg.role === 'agent' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                      >
                                        {msg.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {call.callSummary && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '8px' }}>Summary</span>
                                <div style={{ 
                                  padding: '12px', 
                                  background: 'white', 
                                  borderRadius: '6px', 
                                  fontSize: '13px', 
                                  lineHeight: '1.6',
                                  color: '#374151',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {call.callSummary}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {orderCalls.length === 0 && (
                  <>
                    <div className="campaigns-info-divider"></div>
                    <div className="campaigns-info-section">
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <p style={{ margin: 0 }}>No call history available for this order yet.</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Calls will appear here once the AI agent attempts this order.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="campaigns-modal-footer">
              <button 
                className="campaigns-btn-unified campaigns-btn-primary-unified"
                onClick={() => setShowOrderDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
