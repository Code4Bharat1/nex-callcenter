import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Search, Phone } from 'lucide-react';
import './Ndr.css';

const Ndr = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shop = shopProp || searchParams.get('shop');
  
  const [ndrList, setNdrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttempts, setFilterAttempts] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAggregator, setSelectedAggregator] = useState('nimbuspost'); // 'nimbuspost' or 'shiprocket'
  const [nimbuspostConnected, setNimbuspostConnected] = useState(false);
  const [shiprocketConnected, setShiprocketConnected] = useState(false);
  
  // Bulk AI Call state
  const [selectedNdrs, setSelectedNdrs] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [callingOrders, setCallingOrders] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [ndrFoundCount, setNdrFoundCount] = useState(null);

  const parsePriceValue = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const goodsValueInfo = useMemo(() => {
    let total = 0;
    let currency = null;
    ndrList.forEach((ndr) => {
      const price = parsePriceValue(
        ndr.order_total_price ||
        ndr.orderTotalPrice ||
        ndr.total_price ||
        ndr.order_value ||
        ndr.value
      );
      if (price > 0) {
        total += price;
        if (!currency) {
          const detectedCurrency = (ndr.order_currency || ndr.currency || '').toString().trim();
          currency = detectedCurrency || 'INR';
        }
      }
    });
    return { total, currency };
  }, [ndrList]);

  const formatGoodsValue = (amount, currencyCode) => {
    if (!amount || amount <= 0) return '';
    const code = currencyCode && currencyCode.length === 3 ? currencyCode : 'INR';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (err) {
      const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
      const symbol = currencyCode && currencyCode.length !== 3 ? currencyCode : '₹';
      return `${symbol} ${formatter.format(amount)}`;
    }
  };
  
  // NDR Action state
  const [showActionOptionsModal, setShowActionOptionsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('re-attempt'); // 're-attempt', 'change_address', 'change_phone'
  const [actionData, setActionData] = useState({
    re_attempt_date: '',
    name: '',
    address_1: '',
    address_2: '',
    phone: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionContextNdr, setActionContextNdr] = useState(null);

  // Get unique reasons for filter dropdown
  const uniqueReasons = useMemo(() => {
    const reasons = new Set();
    ndrList.forEach(ndr => {
      const reason = ndr.courier_remarks || ndr.reason || '';
      if (reason && reason !== 'N/A') {
        reasons.add(reason);
      }
    });
    return Array.from(reasons).sort();
  }, [ndrList]);

  // Get unique attempt counts for filter dropdown
  const uniqueAttempts = useMemo(() => {
    const attempts = new Set();
    ndrList.forEach(ndr => {
      const attempt = ndr.total_attempts || ndr.attempts || '';
      if (attempt && attempt !== 'N/A') {
        attempts.add(String(attempt));
      }
    });
    return Array.from(attempts).sort((a, b) => parseInt(a) - parseInt(b));
  }, [ndrList]);

  // Filter NDR list
  const filteredList = useMemo(() => {
    return ndrList.filter(ndr => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const awb = (ndr.awb_number || ndr.awb || '').toString().toLowerCase();
        const orderNumber = (ndr.order_number || ndr.orderNumber || ndr.order_id || '').toString().toLowerCase();
        const customerName = (ndr.customer_name || ndr.customerName || ndr.name || '').toLowerCase();
        const phone = (ndr.phone || ndr.customer_phone || ndr.phoneNumber || '').toString().toLowerCase();
        const address = (ndr.address || ndr.customer_address || ndr.delivery_address || '').toLowerCase();
        const reason = (ndr.courier_remarks || ndr.reason || '').toLowerCase();
        
        const matchesSearch = awb.includes(query) || 
               orderNumber.includes(query) || 
               customerName.includes(query) || 
               phone.includes(query) || 
               address.includes(query) || 
               reason.includes(query);
        
        if (!matchesSearch) return false;
      }

      // Attempts filter
      if (filterAttempts !== 'all') {
        const attempt = String(ndr.total_attempts || ndr.attempts || '');
        if (attempt !== filterAttempts) return false;
      }

      // Reason filter
      if (filterReason !== 'all') {
        const reason = ndr.courier_remarks || ndr.reason || '';
        if (reason !== filterReason) return false;
      }

      return true;
    });
  }, [ndrList, searchQuery, filterAttempts, filterReason]);

  // Sync selectAll state with filteredList
  useEffect(() => {
    if (filteredList.length > 0) {
      setSelectAll(selectedNdrs.size === filteredList.length);
    } else {
      setSelectAll(false);
    }
  }, [filteredList.length, selectedNdrs.size]);

  const getNdrId = (ndr, index = 0) => {
    const awb = ndr.awb_number || ndr.awb || 'N/A';
    return awb !== 'N/A' ? awb : index;
  };

  // Check connection status for both aggregators
  useEffect(() => {
    const checkConnections = async () => {
      try {
        console.log('[NDR] Checking aggregator connections...');
        
        // Check NimbusPost
        let nimbuspostConnected = false;
        try {
          const nimbuspostResponse = await fetch('/api/nimbuspost/status', {
            credentials: 'include'
          });
          if (nimbuspostResponse.ok) {
            const nimbuspostData = await nimbuspostResponse.json();
            nimbuspostConnected = nimbuspostData.connected || false;
            setNimbuspostConnected(nimbuspostConnected);
            console.log('[NDR] NimbusPost connected:', nimbuspostConnected);
          }
        } catch (err) {
          console.error('Error checking NimbusPost:', err);
        }
        
        // Check Shiprocket
        let shiprocketConnected = false;
        try {
          const shiprocketResponse = await fetch('/api/shiprocket/status', {
            credentials: 'include'
          });
          if (shiprocketResponse.ok) {
            const shiprocketData = await shiprocketResponse.json();
            shiprocketConnected = shiprocketData.connected || false;
            setShiprocketConnected(shiprocketConnected);
            console.log('[NDR] Shiprocket connected:', shiprocketConnected);
          }
        } catch (err) {
          console.error('Error checking Shiprocket:', err);
        }
        
        console.log('[NDR] Connection status - NimbusPost:', nimbuspostConnected, 'Shiprocket:', shiprocketConnected);
        
        // Set overall connection status
        const anyConnected = nimbuspostConnected || shiprocketConnected;
        setIsConnected(anyConnected);
        
        // Load NDR from selected aggregator if connected
        if (anyConnected) {
          // Auto-select first connected aggregator (prefer NimbusPost if both connected)
          if (nimbuspostConnected && (!shiprocketConnected || selectedAggregator === 'nimbuspost')) {
            setSelectedAggregator('nimbuspost');
            loadNdrList('nimbuspost');
          } else if (shiprocketConnected) {
            setSelectedAggregator('shiprocket');
            loadNdrList('shiprocket');
          }
        } else {
          setLoading(false);
          setError('No aggregator connected. Please connect NimbusPost or Shiprocket in Settings.');
        }
      } catch (err) {
        console.error('Error checking connections:', err);
        setLoading(false);
        setIsConnected(false);
        setError('Failed to check connection status.');
      }
    };
    
    checkConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  // Load NDR list from selected aggregator
  const loadNdrList = async (aggregator = selectedAggregator) => {
    setLoading(true);
    setError('');
    setLoadingProgress(5);
    setLoadingStage('Initializing');
    setNdrFoundCount(null);
    
    try {
      const endpoint = aggregator === 'shiprocket' ? '/api/shiprocket/ndr-list' : '/api/nimbuspost/ndr-list';
      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setLoadingStage('Counting orders');
      setLoadingProgress(12);

      const contentLengthHeader = response.headers.get('content-length');
      const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;
      let data;

      if (response.body && (contentLength || response.body.getReader)) {
        setLoadingStage('Fetching orders');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let receivedLength = 0;
        let chunks = '';
        let lastUpdate = performance.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedLength += value.length;
          chunks += decoder.decode(value, { stream: true });

          const now = performance.now();
          if (now - lastUpdate > 120) {
            if (contentLength) {
              const percent = 12 + Math.min(receivedLength / contentLength, 1) * 70;
              setLoadingProgress(percent);
            } else {
              setLoadingProgress(prev => Math.min(prev + 5, 80));
            }
            lastUpdate = now;
          }
        }

        chunks += decoder.decode();
        data = JSON.parse(chunks);
      } else {
        // Fallback if streaming unsupported
        setLoadingStage('Fetching orders');
        setLoadingProgress(60);
        data = await response.json();
      }

      setLoadingProgress(prev => Math.max(prev, 85));
      setLoadingStage('Storing orders');
      
      if (data.success && Array.isArray(data.ndrList)) {
        console.log('NDR List received:', data.ndrList.length, 'records');
        console.log('First record (full):', JSON.stringify(data.ndrList[0], null, 2));
        console.log('First record order_number:', data.ndrList[0]?.order_number);
        console.log('First record customer_name:', data.ndrList[0]?.customer_name);
        console.log('First record phone:', data.ndrList[0]?.phone);
        console.log('First record address:', data.ndrList[0]?.address);
        setNdrList(data.ndrList);
        setNdrFoundCount(data.ndrList.length || 0);
        setLoadingProgress(100);
        setLoadingStage('Done');
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('Error loading NDR list:', err);
      setError(err.message || 'Failed to load NDR list');
      setNdrList([]);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingStage('');
        setLoadingProgress(0);
      }, 300);
    }
  };

  // Handle aggregator switch
  const handleAggregatorChange = async (aggregator) => {
    console.log('🔄 Switching aggregator to:', aggregator);
    setSelectedAggregator(aggregator);
    await loadNdrList(aggregator);
  };

  const handleRefresh = async () => {
    await loadNdrList(selectedAggregator);
  };

  // Selection handlers
  const handleSelectNdr = (ndrId) => {
    const newSelected = new Set(selectedNdrs);
    if (newSelected.has(ndrId)) {
      newSelected.delete(ndrId);
    } else {
      newSelected.add(ndrId);
    }
    setSelectedNdrs(newSelected);
    setSelectAll(newSelected.size === filteredList.length && filteredList.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNdrs(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredList.map((ndr, index) => {
        const awb = ndr.awb_number || ndr.awb || 'N/A';
        return awb !== 'N/A' ? awb : index;
      }));
      setSelectedNdrs(allIds);
      setSelectAll(true);
    }
  };

  const handleSingleCall = async (ndr) => {
    await handleBulkCall([ndr]);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setActionContextNdr(null);
  };

  // Bulk AI Call handlers - Create campaign and navigate
  const handleBulkCall = async (customNdrs = null) => {
    if (!customNdrs && selectedNdrs.size === 0) {
      alert('Please select at least one NDR item to call');
      return;
    }

    setCallingOrders(true);

    try {
      // Get selected NDR items
      const selectedItems = customNdrs || filteredList.filter((ndr, index) => selectedNdrs.has(getNdrId(ndr, index)));

      // Extract order IDs from selected NDR items
      const orderIds = [];
      
      selectedItems.forEach(ndr => {
        // Use order_id if available (from bulk tracking)
        if (ndr.order_id && ndr.order_id !== 'N/A') {
          orderIds.push(String(ndr.order_id));
        }
        // Otherwise try order_number (will need to be mapped to order_id)
        else if (ndr.order_number && ndr.order_number !== 'N/A') {
          // For now, try using order_number directly - the backend should handle it
          // If it doesn't work, we'll need to create a mapping endpoint
          orderIds.push(ndr.order_number);
        }
      });

      if (orderIds.length === 0) {
        alert('❌ Could not find order IDs for selected NDR items. Please ensure orders have order_id or order_number from bulk tracking.');
        setCallingOrders(false);
        return;
      }

      // Create CSV file with order IDs
      const csvContent = 'Order ID\n' + orderIds.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], `ndr-campaign-${Date.now()}.csv`, { type: 'text/csv' });

      // Upload CSV to create campaign
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('shop', shop);

      const response = await fetch(`/api/upload-csv?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Clear selection
        setSelectedNdrs(new Set());
        setSelectAll(false);
        
        // Navigate to campaigns tab
        navigate(`/campaigns?shop=${encodeURIComponent(shop || '')}`);
      } else {
        alert(`❌ Failed to create campaign: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(`❌ Error creating campaign: ${error.message}`);
    } finally {
      setCallingOrders(false);
    }
  };

  // NDR Action handlers
  const handleOpenActionOptionsModal = (contextNdr = null, contextId = null) => {
    if (!contextNdr && selectedNdrs.size === 0) {
      alert('Please select at least one NDR item');
      return;
    }
    if (selectedAggregator !== 'nimbuspost') {
      alert('NDR actions are only available for NimbusPost at this time.');
      return;
    }
    if (contextNdr && contextId !== null) {
      setSelectedNdrs(new Set([contextId]));
      setSelectAll(false);
      setActionContextNdr(contextNdr);
    } else {
      setActionContextNdr(null);
    }
    setShowActionOptionsModal(true);
  };

  const handleSelectActionType = (actionType, singleNdr = null) => {
    setShowActionOptionsModal(false);
    setActionType(actionType);
    const context = singleNdr || actionContextNdr;
    // Pre-fill with NDR data if single action
    if (context) {
      setActionData({
        re_attempt_date: '',
        name: context.customer_name || context.customerName || '',
        address_1: (context.address || context.customer_address || '').split(',')[0] || '',
        address_2: (context.address || context.customer_address || '').split(',').slice(1).join(',') || '',
        phone: context.phone || context.customer_phone || ''
      });
    } else {
      setActionData({
        re_attempt_date: '',
        name: '',
        address_1: '',
        address_2: '',
        phone: ''
      });
    }
    setShowActionModal(true);
  };

  const handleSubmitNdrAction = async () => {
    if (selectedAggregator !== 'nimbuspost') {
      alert('NDR actions are only available for NimbusPost at this time.');
      return;
    }

    setSubmittingAction(true);

    try {
      // Get selected NDR items (or single item if called from row)
      const selectedItems = filteredList.filter((ndr, index) => {
        const awb = ndr.awb_number || ndr.awb || 'N/A';
        const ndrId = awb !== 'N/A' ? awb : index;
        return selectedNdrs.has(ndrId);
      });

      if (selectedItems.length === 0) {
        alert('Please select at least one NDR item');
        setSubmittingAction(false);
        return;
      }

      // Build action payload
      const actions = selectedItems.map(ndr => {
        const awb = ndr.awb_number || ndr.awb;
        if (!awb || awb === 'N/A') return null;

        const actionPayload = { awb };

        if (actionType === 're-attempt') {
          if (!actionData.re_attempt_date) {
            alert('Please enter a re-attempt date');
            setSubmittingAction(false);
            return null;
          }
          actionPayload.action = 're-attempt';
          actionPayload.action_data = {
            re_attempt_date: actionData.re_attempt_date
          };
        } else if (actionType === 'change_address') {
          if (!actionData.name || !actionData.address_1) {
            alert('Please enter customer name and address');
            setSubmittingAction(false);
            return null;
          }
          actionPayload.action = 'change_address';
          actionPayload.action_data = {
            name: actionData.name,
            address_1: actionData.address_1,
            address_2: actionData.address_2 || ''
          };
        } else if (actionType === 'change_phone') {
          if (!actionData.phone) {
            alert('Please enter a phone number');
            setSubmittingAction(false);
            return null;
          }
          actionPayload.action = 'change_phone';
          actionPayload.action_data = {
            phone: actionData.phone
          };
        }

        return actionPayload;
      }).filter(Boolean);

      if (actions.length === 0) {
        setSubmittingAction(false);
        return;
      }

      // Call backend API
      const response = await fetch('/api/nimbuspost/ndr-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        const results = data.results || [];
        const successCount = results.filter(r => r.status === true).length;
        const failCount = results.filter(r => r.status === false).length;
        
        let message = `✅ NDR Action submitted!\n\n📊 Results:\n• Successful: ${successCount}\n• Failed: ${failCount}`;
        
        if (failCount > 0) {
          const failures = results.filter(r => r.status === false).map(r => `  • ${r.awb}: ${r.message}`).join('\n');
          message += `\n\n❌ Failures:\n${failures}`;
        }
        
        alert(message);
        
        // Refresh NDR list
        await loadNdrList(selectedAggregator);
        
        // Clear selection and close modal
        setSelectedNdrs(new Set());
        setSelectAll(false);
        setActionContextNdr(null);
        setShowActionModal(false);
      } else {
        alert(`❌ NDR Action failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting NDR action:', error);
      alert(`❌ Error submitting NDR action: ${error.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="ndr-page">
        <div className="ndr-container">
          <div className="ndr-error-state">
            <h2>No Aggregator Connected</h2>
            <p>{error || 'Please connect NimbusPost or Shiprocket account in Settings to view NDR list.'}</p>
            <button 
              className="ndr-btn-primary"
              onClick={() => window.location.href = `/settings?shop=${encodeURIComponent(shop || '')}&card=nimbuspost`}
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ndr-page">
      <div className="ndr-container">
        {/* Header */}
        <div className="ndr-header">
          <div>
            <h1 className="ndr-title">NDR Orders</h1>
          </div>
          <div className="ndr-header-actions">
            {(nimbuspostConnected || shiprocketConnected) && (
              <select
                className="ndr-aggregator-select"
                value={selectedAggregator}
                onChange={(e) => handleAggregatorChange(e.target.value)}
                disabled={loading}
              >
                {nimbuspostConnected && <option value="nimbuspost">NimbusPost</option>}
                {shiprocketConnected && <option value="shiprocket">Shiprocket</option>}
              </select>
            )}
            <button 
              className="ndr-btn-refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Card - Total Action Pending */}
        {!loading && !error && ndrList.length > 0 && (
          <div className="ndr-stats-card">
            <div className="ndr-stat-value">{filteredList.length}</div>
            <div className="ndr-stat-label">Action Pending</div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="ndr-filters-section">
          <div className="ndr-search-wrapper">
            <Search size={16} className="ndr-search-icon" />
            <input
              type="text"
              className="ndr-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ndr-filters-row">
            <select
              className="ndr-filter-select"
              value={filterAttempts}
              onChange={(e) => setFilterAttempts(e.target.value)}
            >
              <option value="all">All Attempts</option>
              {uniqueAttempts.map(attempt => (
                <option key={attempt} value={attempt}>{attempt} {attempt === '1' ? 'Attempt' : 'Attempts'}</option>
              ))}
            </select>

            <select
              className="ndr-filter-select"
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
            >
              <option value="all">All Reasons</option>
              {uniqueReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>

            {(filterAttempts !== 'all' || filterReason !== 'all' || searchQuery.trim()) && (
              <button
                className="ndr-clear-filters"
                onClick={() => {
                  setFilterAttempts('all');
                  setFilterReason('all');
                  setSearchQuery('');
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="ndr-error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="ndr-progress-card">
            <div className="ndr-progress-header">
              <span>Preparing NDR list</span>
              <span>{Math.min(100, Math.round(loadingProgress))}%</span>
            </div>
            <div className="ndr-progress-bar">
              <div 
                className="ndr-progress-fill" 
                style={{ width: `${Math.min(100, Math.round(loadingProgress))}%` }}
              ></div>
            </div>
            <div className="ndr-progress-stage">
              {loadingStage || 'Starting...'}
            </div>
            <div className="ndr-progress-steps">
              {['Counting orders', 'Fetching orders', 'Storing orders'].map((step) => {
                const steps = ['Counting orders', 'Fetching orders', 'Storing orders'];
                const activeIndex = steps.indexOf(loadingStage);
                const stepIndex = steps.indexOf(step);
                const isActive = step === loadingStage;
                const isCompleted = loadingStage === 'Done' || (activeIndex > stepIndex && activeIndex !== -1);
                return (
                  <span 
                    key={step} 
                    className={`ndr-progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  >
                    {step}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {!loading && !error && ndrFoundCount !== null && (
          <div className="ndr-info-row">
            <div className="ndr-found-indicator">
              <div className="ndr-found-count">{ndrFoundCount} NDR found</div>
              <div className="ndr-found-text">Fetching complete. Ready for actions.</div>
            </div>
            {goodsValueInfo.total > 0 && (
              <div className="ndr-value-indicator">
                <div className="ndr-value-title">Total Goods Value</div>
                <div className="ndr-value-amount">
                  {formatGoodsValue(goodsValueInfo.total, goodsValueInfo.currency)}
                </div>
                <div className="ndr-value-caption">Based on matched orders</div>
              </div>
            )}
          </div>
        )}


        {/* Bulk Actions Panel */}
        {!loading && !error && selectedNdrs.size > 0 && (
          <div className="ndr-bulk-actions">
            <span className="ndr-selected-count">
              {selectedNdrs.size} selected
            </span>
            <div className="ndr-bulk-buttons">
              <button 
                className="ndr-btn-bulk-call"
                onClick={handleBulkCall}
                disabled={callingOrders}
              >
                <Phone size={16} />
                <span>{callingOrders ? 'Processing...' : 'AI Call'}</span>
              </button>
              {selectedAggregator === 'nimbuspost' && (
                <button 
                  className="ndr-btn-action"
                  onClick={() => handleOpenActionOptionsModal()}
                  disabled={submittingAction}
                >
                  Submit Action
                </button>
              )}
              <button 
                className="ndr-btn-clear"
                onClick={() => {
                  setSelectedNdrs(new Set());
                  setSelectAll(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Action Options Modal */}
        {showActionOptionsModal && (
          <div className="ndr-modal-overlay" onClick={() => setShowActionOptionsModal(false)}>
            <div className="ndr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ndr-modal-header">
                <h3>Select Action</h3>
                <button className="ndr-modal-close" onClick={() => setShowActionOptionsModal(false)}>×</button>
              </div>
              <div className="ndr-modal-body">
                <div className="ndr-action-options">
                  <button
                    className="ndr-action-option-btn"
                    onClick={() => handleSelectActionType('re-attempt')}
                  >
                    <div className="ndr-action-option-title">Re-Attempt Delivery</div>
                    <div className="ndr-action-option-desc">Schedule a new delivery attempt</div>
                  </button>
                  <button
                    className="ndr-action-option-btn"
                    onClick={() => handleSelectActionType('change_address')}
                  >
                    <div className="ndr-action-option-title">Change Address</div>
                    <div className="ndr-action-option-desc">Update customer delivery address</div>
                  </button>
                  <button
                    className="ndr-action-option-btn"
                    onClick={() => handleSelectActionType('change_phone')}
                  >
                    <div className="ndr-action-option-title">Change Phone</div>
                    <div className="ndr-action-option-desc">Update customer phone number</div>
                  </button>
                      </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            {filteredList.length === 0 ? (
              <div className="ndr-empty">
                <p>No NDR records found{searchQuery ? ' matching your search' : ''}.</p>
              </div>
            ) : (
              <div className="ndr-table-wrapper">
                <table className="ndr-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th>Aggregator</th>
                      <th>AWB Number</th>
                      <th>Order Number</th>
                      <th>Customer Name</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Attempts</th>
                      {selectedAggregator === 'nimbuspost' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((ndr, index) => {
                      const awb = ndr.awb_number || ndr.awb || 'N/A';
                      const ndrId = awb !== 'N/A' ? awb : index;
                      const orderNumber = ndr.order_number || ndr.orderNumber || ndr.order_id || 'N/A';
                      const customerName = ndr.customer_name || ndr.customerName || ndr.name || ndr.customer || 'N/A';
                      const phone = ndr.phone || ndr.customer_phone || ndr.phoneNumber || ndr.phone_number || ndr.mobile || 'N/A';
                      const address = ndr.address || ndr.customer_address || ndr.delivery_address || ndr.address_line || ndr.shipping_address || 'N/A';
                      const reason = ndr.courier_remarks || ndr.reason || 'N/A';
                      const date = ndr.event_date || ndr.date || 'N/A';
                      const attempts = ndr.total_attempts || 'N/A';
                      const isSelected = selectedNdrs.has(ndrId);
                      
                      const aggregator = ndr.aggregator || selectedAggregator;
                      const aggregatorName = aggregator === 'shiprocket' ? 'Shiprocket' : 'NimbusPost';
                      
                      return (
                        <tr key={ndrId} className={isSelected ? 'ndr-row-selected' : ''}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectNdr(ndrId)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td className="ndr-aggregator">
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              background: aggregator === 'shiprocket' ? '#fef3c7' : '#dbeafe',
                              color: aggregator === 'shiprocket' ? '#92400e' : '#1e40af'
                            }}>
                              {aggregatorName}
                            </span>
                          </td>
                          <td className="ndr-awb">{awb}</td>
                          <td className="ndr-order">{orderNumber}</td>
                          <td className="ndr-customer">{customerName}</td>
                          <td className="ndr-phone">{phone}</td>
                          <td className="ndr-address">{address}</td>
                          <td className="ndr-reason">{reason}</td>
                          <td className="ndr-date">{date}</td>
                          <td className="ndr-attempts">Attempt {attempts}</td>
                          {selectedAggregator === 'nimbuspost' && (
                            <td className="ndr-row-actions">
                              <button
                                className="ndr-row-action-btn"
                                onClick={() => handleOpenActionOptionsModal(ndr, ndrId)}
                                title="Submit Action"
                              >
                                Submit Action
                              </button>
                              <button
                                className="ndr-row-action-btn"
                                onClick={() => handleSingleCall(ndr)}
                                title="AI Call"
                              >
                                AI Call
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
          </>
        )}

        {/* NDR Action Modal */}
        {showActionModal && (
          <div className="ndr-modal-overlay" onClick={handleCloseActionModal}>
            <div className="ndr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ndr-modal-header">
                <h3>
                  {actionType === 're-attempt' && 'Re-Attempt Delivery'}
                  {actionType === 'change_address' && 'Change Address'}
                  {actionType === 'change_phone' && 'Change Phone'}
                </h3>
                <button className="ndr-modal-close" onClick={handleCloseActionModal}>×</button>
              </div>
              <div className="ndr-modal-body">
                {actionType === 're-attempt' && (
                  <div className="ndr-action-form">
                    <div className="ndr-form-group">
                      <label>Re-Attempt Date <span className="required">*</span></label>
                      <input
                        type="date"
                        value={actionData.re_attempt_date}
                        onChange={(e) => setActionData({ ...actionData, re_attempt_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                {actionType === 'change_address' && (
                  <div className="ndr-action-form">
                    <div className="ndr-form-group">
                      <label>Customer Name <span className="required">*</span></label>
                      <input
                        type="text"
                        value={actionData.name}
                        onChange={(e) => setActionData({ ...actionData, name: e.target.value })}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>
                    <div className="ndr-form-group">
                      <label>Address Line 1 <span className="required">*</span></label>
                      <input
                        type="text"
                        value={actionData.address_1}
                        onChange={(e) => setActionData({ ...actionData, address_1: e.target.value })}
                        placeholder="Enter address line 1"
                        required
                      />
                    </div>
                    <div className="ndr-form-group">
                      <label>Address Line 2</label>
                      <input
                        type="text"
                        value={actionData.address_2}
                        onChange={(e) => setActionData({ ...actionData, address_2: e.target.value })}
                        placeholder="Enter address line 2 (optional)"
                      />
                    </div>
                  </div>
                )}

                {actionType === 'change_phone' && (
                  <div className="ndr-action-form">
                    <div className="ndr-form-group">
                      <label>Phone Number <span className="required">*</span></label>
                      <input
                        type="tel"
                        value={actionData.phone}
                        onChange={(e) => setActionData({ ...actionData, phone: e.target.value })}
                        placeholder="Enter 10-digit phone number"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="ndr-modal-footer">
                  <button
                    className="ndr-btn-cancel"
                    onClick={handleCloseActionModal}
                    disabled={submittingAction}
                  >
                    Cancel
                  </button>
                  <button
                    className="ndr-btn-submit"
                    onClick={handleSubmitNdrAction}
                    disabled={submittingAction}
                  >
                    {submittingAction ? 'Submitting...' : 'Submit Action'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ndr;

