import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Table2, ChevronDown, ChevronUp, Download, ArrowUpDown, Settings } from 'lucide-react';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import { parseTranscript } from '../utils/transcriptParser';
import './CampaignDetails.css';
import './Settings.css';

const InfoField = ({ label, value, placeholder = '—', full = false, allowEmpty = false }) => {
  if (!allowEmpty && (!value || value === 'N/A')) return null;
  return (
    <div className={`order-details-field-pill ${full ? 'full' : ''}`}>
      <span className="order-details-label">{label}</span>
      <span className="order-details-value">{value && value !== 'N/A' ? value : placeholder}</span>
    </div>
  );
};

const CampaignDetails = ({ shop: shopProp }) => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  const [upload, setUpload] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingOrderStats, setLoadingOrderStats] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter state - multi-select
  const [filterTotalCallsMin, setFilterTotalCallsMin] = useState('');
  const [filterTotalCallsMax, setFilterTotalCallsMax] = useState('');
  const [filterStatuses, setFilterStatuses] = useState(new Set(['all']));
  const [filterSentiments, setFilterSentiments] = useState(new Set(['all']));
  const [filterOutcomes, setFilterOutcomes] = useState(new Set(['all']));
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sentimentDropdownOpen, setSentimentDropdownOpen] = useState(false);
  const [outcomeDropdownOpen, setOutcomeDropdownOpen] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.campaign-details-filter-dropdown')) {
        setStatusDropdownOpen(false);
        setSentimentDropdownOpen(false);
        setOutcomeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [pendingOrderIds, setPendingOrderIds] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCalls, setOrderCalls] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);
  const [showOtherDetails, setShowOtherDetails] = useState(false);
  
  // Tagging state
  const [showTagModal, setShowTagModal] = useState(false);
  const [taggingOrderIds, setTaggingOrderIds] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [tagging, setTagging] = useState(false);

  // Campaign-specific rules state
  const [showCampaignSettings, setShowCampaignSettings] = useState(false);
  const [campaignOutcomes, setCampaignOutcomes] = useState([]);
  const [loadingCampaignOutcomes, setLoadingCampaignOutcomes] = useState(false);
  const [campaignRules, setCampaignRules] = useState([]); // Array of {outcome, enabled, retrySettings}
  const [savingCampaignRules, setSavingCampaignRules] = useState(false);
  const [expandedOutcomes, setExpandedOutcomes] = useState(new Set()); // Track which outcomes have expanded retry settings
  const [defaultRetrySettings, setDefaultRetrySettings] = useState({
    maxRetries: 3,
    retryIntervalMinutes: 60,
    autoCancelOnMaxRetries: false,
    allowedTimeStart: '09:00',
    allowedTimeEnd: '18:00',
    timezone: 'Asia/Kolkata',
    allowedDays: [1, 2, 3, 4, 5]
  });

  useEffect(() => {
    if (shop && campaignId) {
      loadCampaignData();
      loadScripts();
      loadUserTags();
      loadDefaultRetrySettings();
    }
  }, [shop, campaignId]);

  const loadDefaultRetrySettings = async () => {
    if (!shop) return;
    try {
      const response = await fetch(`/api/user-retry-settings?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.settings) {
        setDefaultRetrySettings({
          maxRetries: data.settings.maxRetries !== undefined ? data.settings.maxRetries : 3,
          retryIntervalMinutes: data.settings.retryIntervalMinutes || 60,
          autoCancelOnMaxRetries: data.settings.autoCancelOnMaxRetries || false,
          allowedTimeStart: data.settings.allowedTimeStart || '09:00',
          allowedTimeEnd: data.settings.allowedTimeEnd || '18:00',
          timezone: data.settings.timezone || 'Asia/Kolkata',
          allowedDays: data.settings.allowedDays ? data.settings.allowedDays.split(',').map(Number) : [1, 2, 3, 4, 5]
        });
      }
    } catch (error) {
      console.error('Error loading default retry settings:', error);
    }
  };

  const loadUserTags = async () => {
    try {
      const response = await fetch('/api/user-tags', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.tags) {
        setCustomTags(data.tags);
      }
    } catch (error) {
      console.error('Error loading user tags:', error);
    }
  };

  const handleBulkTag = (orderIds) => {
    setTaggingOrderIds(orderIds);
    setShowTagModal(true);
  };

  const handleTagOrders = async (tag) => {
    if (!tag || !tag.trim()) {
      alert('Please enter or select a tag');
      return;
    }

    try {
      setTagging(true);
      
      // Get Shopify order IDs from database order IDs
      const orderRecords = orders.filter(o => taggingOrderIds.includes(o.orderId || o.id));
      const shopifyOrderIds = orderRecords.map(o => {
        const orderId = o.orderId;
        if (orderId && orderId.startsWith('gid://shopify/Order/')) {
          return orderId;
        }
        return `gid://shopify/Order/${orderId}`;
      });

      const response = await fetch('/api/tag-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderIds: shopifyOrderIds, 
          tag: tag.trim(), 
          shop 
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        const successCount = data.results.filter(r => r.success).length;
        const failCount = data.results.filter(r => !r.success).length;
        alert(`✅ Tagging completed!\n\n📊 Results:\n• Successfully tagged: ${successCount}\n• Failed: ${failCount}`);
        
        // Save tag to user's custom tags if it's new
        if (!customTags.includes(tag.trim())) {
          try {
            await fetch('/api/user-tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag: tag.trim() }),
              credentials: 'include'
            });
            setCustomTags([...customTags, tag.trim()]);
          } catch (err) {
            console.error('Error saving tag:', err);
          }
        }
        
        setShowTagModal(false);
        setSelectedTag('');
        setNewTagInput('');
        setTaggingOrderIds([]);
      } else {
        alert(`❌ Tagging failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error tagging orders:', error);
      alert('Error tagging orders');
    } finally {
      setTagging(false);
    }
  };

  useEffect(() => {
    if (showOrderDetails) {
      document.body.classList.add('order-details-open');
    } else {
      document.body.classList.remove('order-details-open');
    }
    return () => document.body.classList.remove('order-details-open');
  }, [showOrderDetails]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      console.log('[CampaignDetails] Loading campaign data for ID:', campaignId, 'shop:', shop);
      
      // FAST: Direct lookup by ID - no need to search through pages!
      const response = await fetch(`/api/csv-upload/${campaignId}?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error('[CampaignDetails] Campaign not found with ID:', campaignId);
          setUpload(null);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const foundUpload = data.data;
        console.log('[CampaignDetails] Found upload:', foundUpload);
        setUpload(foundUpload);
        
        // Load orders, stats, and order stats in parallel for faster loading
        Promise.all([
          loadCsvOrders(foundUpload.id),
          loadCsvStats(foundUpload.id),
          loadCsvOrderStats(foundUpload.id)
        ]).catch(error => {
          console.error('[CampaignDetails] Error loading data:', error);
        });
      } else {
        console.error('[CampaignDetails] Campaign not found with ID:', campaignId);
        setUpload(null);
      }
    } catch (error) {
      console.error('[CampaignDetails] Error loading campaign data:', error);
      setUpload(null);
    } finally {
      setLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const response = await api.getScripts(shop);
      const scriptsArray = response?.scripts || response || [];
      setScripts(scriptsArray);
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  };

  const loadCsvOrders = async (uploadId) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`/api/csv-results?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        determineScriptFromOrders(data.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const determineScriptFromOrders = (orders) => {
    const scriptCounts = {};
    orders.forEach(order => {
      if (order.script && order.script.id) {
        const scriptId = order.script.id;
        scriptCounts[scriptId] = (scriptCounts[scriptId] || 0) + 1;
      }
    });

    const mostUsedScriptId = Object.entries(scriptCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (mostUsedScriptId) {
      const foundScript = scripts.find(s => s.id === parseInt(mostUsedScriptId)) ||
                         orders.find(o => o.script && o.script.id === parseInt(mostUsedScriptId))?.script;
      
      if (foundScript) {
        setScript(foundScript);
      }
    }
  };

  const loadCsvStats = async (uploadId) => {
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/csv-stats?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadCsvOrderStats = async (uploadId) => {
    setLoadingOrderStats(true);
    try {
      const response = await fetch(`/api/csv-order-stats?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading order stats:', error);
    } finally {
      setLoadingOrderStats(false);
    }
  };

  const calculateDynamicStats = () => {
    // Stats can be displayed even without script - use stats data first, fallback to script
    if (!stats) return null;

    const successCriteria = stats.successCriteria || script?.successCriteria || [];
    const otherCriteria = stats.otherCriteria || script?.otherCriteria || [];
    const successCounts = stats.successCounts || {};
    const otherCounts = stats.otherCounts || {};
    const disableUnder35 = (stats.script?.disableUnder35Retries === false) || (script?.disableUnder35Retries === false);

    const totalSuccess = Object.values(successCounts).reduce((sum, count) => sum + (count || 0), 0);
    const totalOther = Object.values(otherCounts).reduce((sum, count) => sum + (count || 0), 0);
    
    const addressChange = stats.addressChange || 0;
    const cancellationRequest = stats.cancellationRequest || 0;
    const handleManually = stats.handleManually || 0;
    
    const completedTotal = totalSuccess + totalOther + addressChange + cancellationRequest + handleManually + 
                          (stats.under35sMaxRetries || 0) + (stats.notPickedUpMaxRetries || 0) + (stats.invalid || 0);
    const queuedTotal = (stats.notCalledQueued || 0) + (stats.under35sQueued || 0) + 
                       (stats.notPickedUpQueued || 0);
    const customerPickedUp = totalSuccess + totalOther + addressChange + cancellationRequest + handleManually + 
                            (stats.under35sMaxRetries || 0) + (stats.under35sQueued || 0);
    const progress = completedTotal + (stats.under35sQueued || 0) + (stats.notPickedUpQueued || 0);
    const overallConversionRate = progress > 0 
      ? Math.round((totalSuccess / progress) * 100 * 10) / 10 
      : 0;

    return {
      successCriteria,
      otherCriteria,
      successCounts,
      otherCounts,
      disableUnder35,
      addressChange,
      cancellationRequest,
      handleManually,
      totalSuccess,
      totalOther,
      totalOrders: stats.uploadedOrders || 0,
      completedTotal,
      queuedTotal,
      customerPickedUp: `${customerPickedUp} (${Math.round((customerPickedUp / (completedTotal + queuedTotal)) * 100) || 0}%)`,
      avgDuration: stats.avgDuration || 0,
      conversionRate: stats.conversionRate || 0,
      overallConversionRate: `${totalSuccess}/${progress} (${overallConversionRate}%)`,
      totalConnected: stats.totalConnected || 0,
      ordersWithCalls: stats.ordersWithCalls || 0,
      ongoing: stats.ongoing || 0,
      callNotBooked: stats.callNotBooked || 0,
      earlyDisconnectMaxRetries: stats.under35sMaxRetries || 0,
      notPickedUpMaxRetries: stats.notPickedUpMaxRetries || 0,
      invalid: stats.invalid || 0,
      notCalledQueued: stats.notCalledQueued || 0,
      earlyDisconnectQueued: stats.under35sQueued || 0,
      notPickedUpQueued: stats.notPickedUpQueued || 0,
    };
  };

  const handleBulkCall = (orderIds) => {
    setPendingOrderIds(orderIds);
    setShowScriptModal(true);
  };

  const handleSelectScript = async (scriptId, scriptName) => {
    setShowScriptModal(false);
    try {
      const response = await fetch('/api/set-queue-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: pendingOrderIds, shop, scriptId }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        const successCount = data.updated || 0;
        const errorCount = data.failed?.length || 0;
        alert(`✅ Bulk AI Call completed!\n\n📊 Results:\n• Successfully queued: ${successCount}\n• Failed: ${errorCount}`);
        loadCsvOrders(upload.id);
      } else {
        alert(`❌ Bulk AI Call failed: ${data.error || 'Unknown error'}`);
      }
      
      setPendingOrderIds([]);
    } catch (error) {
      console.error('Error in bulk call:', error);
      alert('Error processing bulk call');
    }
  };

  const handleBulkUpdateAddresses = async () => {
    if (!confirm('Are you sure you want to update ALL addresses with new addresses in Shopify? This will change the actual order addresses for all orders that have updated addresses.')) {
      return;
    }

    try {
      const loadingMsg = document.createElement('div');
      loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
      `;
      loadingMsg.textContent = 'Updating addresses in Shopify...';
      document.body.appendChild(loadingMsg);
      
      const response = await fetch('/api/bulk-update-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: upload.id, shop: shop })
      });

      const data = await response.json();
      loadingMsg.remove();
      
      if (data.success) {
        const { updated, failed, total } = data.results;
        let message = `✅ Bulk update completed!\n\n`;
        message += `📊 Results:\n`;
        message += `• Total orders processed: ${total}\n`;
        message += `• Successfully updated: ${updated}\n`;
        message += `• Failed: ${failed}\n`;
        alert(message);
        loadCsvOrders(upload.id);
      } else {
        alert('❌ Bulk update failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in bulk address update:', error);
      alert('❌ Error in bulk address update: ' + error.message);
    }
  };

  const handleShowOrderDetails = async (orderId) => {
    setLoadingOrderDetails(true);
    setShowOrderDetails(true);
    
    try {
      const response = await fetch(`/api/order-details?orderId=${orderId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedOrder(data.order);
        setOrderCalls(data.calls || []);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const loadCampaignOutcomes = async () => {
    if (!upload || !upload.id) return;
    
    setLoadingCampaignOutcomes(true);
    try {
      const response = await fetch(`/api/campaign-outcomes?shop=${encodeURIComponent(shop)}&csvUploadId=${upload.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setCampaignOutcomes(data.outcomes || []);
        // Load existing rules for this campaign
        if (data.rules && Array.isArray(data.rules)) {
          setCampaignRules(data.rules);
        } else {
          setCampaignRules([]);
        }
      }
    } catch (error) {
      console.error('Error loading campaign outcomes:', error);
    } finally {
      setLoadingCampaignOutcomes(false);
    }
  };

  const saveCampaignRules = async () => {
    if (!upload || !upload.id) return;
    
    setSavingCampaignRules(true);
    try {
      const response = await fetch(`/api/campaign-rules?shop=${encodeURIComponent(shop)}&csvUploadId=${upload.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          csvUploadId: upload.id,
          rules: campaignRules
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Campaign rules saved successfully');
        setShowCampaignSettings(false);
      } else {
        alert('Failed to save campaign rules: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving campaign rules:', error);
      alert('Error saving campaign rules: ' + error.message);
    } finally {
      setSavingCampaignRules(false);
    }
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

  const handleUpdateAddressInShopify = async (orderId, newAddress) => {
    if (!confirm('Are you sure you want to update the address in Shopify? This will change the actual order address.')) {
      return;
    }

    try {
      const response = await fetch('/api/update-order-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          shop: shop,
          newAddress: newAddress
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Address updated successfully in Shopify!');
        if (selectedOrder) {
          handleShowOrderDetails(selectedOrder.orderId || selectedOrder.id);
        }
      } else {
        alert('❌ Failed to update address: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[CampaignDetails] Error updating address:', error);
      alert('❌ Error updating address: ' + error.message);
    }
  };

  const handleEditNewAddress = (callId, oldAddress, currentNewAddress) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Inter, system-ui, -apple-system, sans-serif;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 620px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    `;
    
    modalContent.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 20px;">Review New Address</h2>
      <div style="display: grid; gap: 16px;">
        <div>
          <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 6px;">Original Address</label>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">${oldAddress || 'N/A'}</div>
        </div>
        <div>
          <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 6px;">New Address</label>
          <textarea id="new-address-input" style="width: 100%; min-height: 120px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 14px;">${currentNewAddress || ''}</textarea>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
        <button id="cancel-edit-address" style="padding: 10px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer;">Cancel</button>
        <button id="save-edit-address" style="padding: 10px 16px; border: none; border-radius: 8px; background: #4B5CFF; color: white; cursor: pointer;">Save Changes</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    modal.querySelector('#cancel-edit-address').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#save-edit-address').addEventListener('click', async () => {
      const newAddress = modal.querySelector('#new-address-input').value.trim();
      if (!newAddress) {
        alert('Please enter a new address');
        return;
      }
      
      try {
        const response = await fetch('/api/update-call-address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callId,
            newAddress
          })
        });
        
        const data = await response.json();
        if (data.success) {
          alert('✅ Address updated successfully!');
          if (selectedOrder) {
            handleShowOrderDetails(selectedOrder.orderId || selectedOrder.id);
          }
          document.body.removeChild(modal);
        } else {
          alert('❌ Failed to update address: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('[CampaignDetails] Error updating call address:', error);
        alert('❌ Error updating address: ' + error.message);
      }
    });
  };

  const getCampaignStatus = () => {
    if (!upload) return { label: 'Unknown', dotColor: '#9ca3af', badgeBg: '#f3f4f6', badgeColor: '#4b5563' };
    
    const status = upload.status?.toLowerCase() || '';
    const isCompleted = upload.etaStatus === 'completed' || 
                       status === 'completed' || 
                       status === 'finished' ||
                       (upload.progress >= 100);
    
    if (isCompleted) {
      return { 
        isActive: false, 
        label: 'Completed', 
        dotColor: '#fbbf24',
        badgeBg: '#fef9c3',
        badgeColor: '#92400e'
      };
    } else {
      return { 
        isActive: true, 
        label: 'Running', 
        dotColor: '#10b981',
        badgeBg: '#ecfdf5',
        badgeColor: '#059669'
      };
    }
  };

  const getSentimentDisplay = (interestScore, transcriptLength = 0) => {
    // If no interest score, return null to show blank
    if (interestScore === null || interestScore === undefined || interestScore === '') {
      return null;
    }
    
    // Parse interest score
    const score = parseFloat(interestScore);
    if (isNaN(score)) {
      return null; // Invalid score, show blank
    }
    
    // New sentiment categorization based on interest score + transcript length
    // Threshold: 1400 characters
    // Bar order: Angry (1), Not Interested (2), Neutral (3), Interested (4), Very Happy (5)
    const TRANSCRIPT_THRESHOLD = 1400;
    
    // Score 0: Not Interested (2 bars)
    if (score === 0) {
      return { filledBars: 2, totalBars: 5, label: 'Not Interested', color: '#fee2e2', barColor: '#ef4444' };
    }
    
    // Score 1-5: Neutral (small transcript - 3 bars) or Angry (large transcript - 1 bar)
    if (score >= 1 && score < 5) {
      if (transcriptLength < TRANSCRIPT_THRESHOLD) {
        return { filledBars: 3, totalBars: 5, label: 'Neutral', color: '#fef3c7', barColor: '#f59e0b' };
      } else {
        return { filledBars: 1, totalBars: 5, label: 'Angry', color: '#fee2e2', barColor: '#dc2626' };
      }
    }
    
    // Score 5-10: Interested (small transcript - 4 bars) or Very Happy (large transcript - 5 bars)
    if (score >= 5 && score <= 10) {
      if (transcriptLength < TRANSCRIPT_THRESHOLD) {
        return { filledBars: 4, totalBars: 5, label: 'Interested', color: '#dbeafe', barColor: '#3b82f6' };
      } else {
        return { filledBars: 5, totalBars: 5, label: 'Very Happy', color: '#d1fae5', barColor: '#10b981' };
      }
    }
    
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return `${dateStr} at ${timeStr}`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    
    // Apply substitutions
    const statusLower = status.toLowerCase();
    if (statusLower === 'max_retries_reached' || statusLower === 'max retries reached') {
      return 'Not picked up';
    }
    if (statusLower === 'queued') {
      return 'In queue';
    }
    if (statusLower === 'completed') {
      return 'Picked Up';
    }
    
    // Default: format the status
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const toggleOrderSelection = (order) => {
    const orderId = order.orderId || order.id;
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    // Use filteredOrders as base - sorting is just for display
    const ordersToSelect = filteredOrders;
    if (selectAll) {
      setSelectedOrders(new Set());
      setSelectAll(false);
    } else {
      const allIds = ordersToSelect.map(o => o.orderId || o.id);
      setSelectedOrders(new Set(allIds));
      setSelectAll(true);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getCallOutcome = (order) => {
    const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
    return latestCall?.callOutcomeCategory || 'N/A';
  };

  // Helper function to normalize strings for matching (same as database.js)
  const normalizeOutcome = (str) => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  // Helper to find matching criteria and return the criteria name (same as database.js)
  const findMatchingCriteria = (outcomeCategory, criteriaList) => {
    if (!outcomeCategory || !criteriaList || criteriaList.length === 0) return null;
    const normalizedOutcome = normalizeOutcome(outcomeCategory);
    for (const criteria of criteriaList) {
      const normalizedCriteria = normalizeOutcome(criteria);
      if (normalizedOutcome.includes(normalizedCriteria) || normalizedCriteria.includes(normalizedOutcome)) {
        return criteria; // Return the actual criteria name from the script
      }
    }
    return null;
  };

  const getOutcomeDisplay = (outcome, callDuration = null, order = null) => {
    if (!outcome || outcome === 'N/A') {
      return { text: 'N/A', color: null, borderColor: null };
    }

    // Get script from order (or use stats/script state as fallback)
    const orderScript = order?.script;
    const successCriteria = orderScript?.successCriteria || script?.successCriteria || stats?.successCriteria || [];
    const otherCriteria = orderScript?.otherCriteria || script?.otherCriteria || stats?.otherCriteria || [];

    // Normalize the outcome for matching
    const outcomeNormalized = outcome.trim().toLowerCase();

    // Replace "failed" with "not picked" (case insensitive)
    if (outcomeNormalized.includes('failed')) {
      const replacedOutcome = outcome.replace(/failed/gi, 'not picked');
      // Continue processing with replaced outcome
      const replacedNormalized = replacedOutcome.trim().toLowerCase();
      
      // Check for "unclear" (case insensitive) - keep as is, blue
      if (replacedNormalized === 'unclear') {
        return { text: 'unclear', color: '#dbeafe', borderColor: '#3b82f6' }; // blue
      }

      // Check for "handle manually" (case insensitive) - rename to Special Request, purple
      if (replacedNormalized.includes('handle') && replacedNormalized.includes('manually')) {
        return { text: 'Special Request', color: '#f3e8ff', borderColor: '#a855f7' }; // purple
      }

      // Check for "Early Disconnection" (for under 35 seconds) - yellow
      if (callDuration !== null && callDuration < 35) {
        if (replacedNormalized.includes('early') || replacedNormalized.includes('disconnect') || replacedNormalized.includes('under35') || replacedNormalized.includes('under 35')) {
          return { text: 'Early Disconnection', color: '#fef9c3', borderColor: '#eab308' }; // yellow
        }
      }

      // Check if outcome matches success criteria from script - green
      const matchingSuccessCriteria = findMatchingCriteria(replacedOutcome, successCriteria);
      if (matchingSuccessCriteria) {
        return { text: matchingSuccessCriteria, color: '#d1fae5', borderColor: '#10b981' }; // green
      }

      // Check if outcome matches other criteria from script (but not success) - red
      const matchingOtherCriteria = findMatchingCriteria(replacedOutcome, otherCriteria);
      if (matchingOtherCriteria) {
        return { text: matchingOtherCriteria, color: '#fee2e2', borderColor: '#ef4444' }; // red
      }

      // Default: return replaced outcome
      return { text: replacedOutcome, color: null, borderColor: null };
    }

    // Check for "unclear" (case insensitive) - keep as is, blue
    if (outcomeNormalized === 'unclear') {
      return { text: 'unclear', color: '#dbeafe', borderColor: '#3b82f6' }; // blue
    }

    // Check for "handle manually" (case insensitive) - rename to Special Request, purple
    if (outcomeNormalized.includes('handle') && outcomeNormalized.includes('manually')) {
      return { text: 'Special Request', color: '#f3e8ff', borderColor: '#a855f7' }; // purple
    }

    // Check for "Early Disconnection" (for under 35 seconds) - yellow
    // If duration is under 35 and outcome suggests early disconnect, show as "Early Disconnection"
    if (callDuration !== null && callDuration < 35) {
      if (outcomeNormalized.includes('early') || outcomeNormalized.includes('disconnect') || outcomeNormalized.includes('under35') || outcomeNormalized.includes('under 35')) {
        return { text: 'Early Disconnection', color: '#fef9c3', borderColor: '#eab308' }; // yellow
      }
    }

    // Check if outcome matches success criteria from script - green
    const matchingSuccessCriteria = findMatchingCriteria(outcome, successCriteria);
    if (matchingSuccessCriteria) {
      return { text: matchingSuccessCriteria, color: '#d1fae5', borderColor: '#10b981' }; // green
    }

    // Check if outcome matches other criteria from script (but not success) - red
    const matchingOtherCriteria = findMatchingCriteria(outcome, otherCriteria);
    if (matchingOtherCriteria) {
      return { text: matchingOtherCriteria, color: '#fee2e2', borderColor: '#ef4444' }; // red
    }

    // Default: return as-is with no color
    return { text: outcome, color: null, borderColor: null };
  };

  const exportToCSV = () => {
    // Apply same filtering and sorting as displayed table
    // Filter orders (same logic as filteredOrders)
    const filtered = orders.filter(order => {
      // Search filter
      if (ordersSearch.trim()) {
        const searchLower = ordersSearch.toLowerCase();
        const orderNumber = (order.orderNumber || order.id || '').toString().toLowerCase();
        const customerName = (order.customerName || '').toLowerCase();
        const phone = (order.customerPhone || '').toLowerCase();
        const address = (order.customerAddress || '').toLowerCase();
        const matchesSearch = orderNumber.includes(searchLower) ||
                             customerName.includes(searchLower) ||
                             phone.includes(searchLower) ||
                             address.includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Total calls filter
      if (filterTotalCallsMin || filterTotalCallsMax) {
        const totalCalls = order.totalCallCount || 0;
        const min = filterTotalCallsMin ? parseInt(filterTotalCallsMin) : 0;
        const max = filterTotalCallsMax ? parseInt(filterTotalCallsMax) : Infinity;
        if (totalCalls < min || totalCalls > max) return false;
      }

      // Status filter - match by actual status text
      if (!filterStatuses.has('all') && filterStatuses.size > 0) {
        const statusText = getStatusText(order.callStatus);
        const statusLower = statusText.toLowerCase();
        
        let matches = false;
        filterStatuses.forEach(filterStatus => {
          if (filterStatus === 'all') return;
          // Match by checking if the status text includes the filter or vice versa
          const filterLower = filterStatus.toLowerCase().replace(/_/g, ' ');
          if (statusLower.includes(filterLower) || filterLower.includes(statusLower)) {
            matches = true;
          }
        });
        
        if (!matches) return false;
      }

      // Sentiment filter
      if (!filterSentiments.has('all') && filterSentiments.size > 0) {
        const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
        const interestScore = latestCall?.callInterestScore ?? latestCall?.onehotscore ?? order.onehotscore ?? null;
        const transcriptLength = latestCall?.transcript ? latestCall.transcript.length : 0;
        const sentimentDisplay = getSentimentDisplay(interestScore, transcriptLength);
        const sentimentLabel = sentimentDisplay ? sentimentDisplay.label.toLowerCase() : '';
        let matches = false;
        if (filterSentiments.has('not_interested') && sentimentLabel === 'not interested') matches = true;
        if (filterSentiments.has('neutral') && sentimentLabel === 'neutral') matches = true;
        if (filterSentiments.has('angry') && sentimentLabel === 'angry') matches = true;
        if (filterSentiments.has('interested') && sentimentLabel === 'interested') matches = true;
        if (filterSentiments.has('very_happy') && sentimentLabel === 'very happy') matches = true;
        if (!sentimentDisplay && filterSentiments.has('blank')) matches = true;
        if (!matches) return false;
      }

      // Call Outcome filter
      if (!filterOutcomes.has('all') && filterOutcomes.size > 0) {
        const outcome = getCallOutcome(order);
        const outcomeLower = outcome ? outcome.toLowerCase() : 'n/a';
        let matches = false;
        filterOutcomes.forEach(filterOutcome => {
          if (filterOutcome === 'n/a' && (outcome === 'N/A' || !outcome)) {
            matches = true;
          } else if (outcomeLower.includes(filterOutcome.toLowerCase())) {
            matches = true;
          }
        });
        if (!matches) return false;
      }

      return true;
    });

    // Apply sorting (same logic as sortedOrders)
    const sorted = [...filtered].sort((a, b) => {
      if (!sortField) return 0;

      let aValue, bValue;

      switch (sortField) {
        case 'totalCalls':
          aValue = a.totalCallCount || 0;
          bValue = b.totalCallCount || 0;
          break;
        case 'status':
          aValue = getStatusText(a.callStatus).toLowerCase();
          bValue = getStatusText(b.callStatus).toLowerCase();
          break;
        case 'sentiment':
          const aLatestCall = a.calls && a.calls.length > 0 ? a.calls[0] : null;
          const bLatestCall = b.calls && b.calls.length > 0 ? b.calls[0] : null;
          const aInterestScore = aLatestCall?.callInterestScore ?? aLatestCall?.onehotscore ?? a.onehotscore ?? null;
          const bInterestScore = bLatestCall?.callInterestScore ?? bLatestCall?.onehotscore ?? b.onehotscore ?? null;
          const aTranscriptLength = aLatestCall?.transcript ? aLatestCall.transcript.length : 0;
          const bTranscriptLength = bLatestCall?.transcript ? bLatestCall.transcript.length : 0;
          const aSentiment = getSentimentDisplay(aInterestScore, aTranscriptLength);
          const bSentiment = getSentimentDisplay(bInterestScore, bTranscriptLength);
          aValue = aSentiment ? aSentiment.label.toLowerCase() : 'zzz';
          bValue = bSentiment ? bSentiment.label.toLowerCase() : 'zzz';
          break;
        case 'outcome':
          aValue = getCallOutcome(a).toLowerCase();
          bValue = getCallOutcome(b).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // CSV header
    const headers = [
      'Serial Number',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Phone',
      'Address',
      'Script',
      'Total Calls',
      'Status',
      'Sentiment',
      'Call Outcome'
    ];

    // CSV rows
    const rows = sorted.map((order, index) => {
      const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
      const interestScore = latestCall?.callInterestScore ?? latestCall?.onehotscore ?? order.onehotscore ?? null;
      const transcriptLength = latestCall?.transcript ? latestCall.transcript.length : 0;
      const sentimentDisplay = getSentimentDisplay(interestScore, transcriptLength);
      const sentimentLabel = sentimentDisplay ? sentimentDisplay.label : 'N/A';
      const callOutcome = getCallOutcome(order);
      const callDuration = latestCall?.callDuration || latestCall?.durationSeconds || null;
      const outcomeDisplay = getOutcomeDisplay(callOutcome, callDuration, order);

      // Escape CSV values
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        index + 1, // Serial number
        escapeCSV(order.orderNumber || order.id),
        escapeCSV(order.customerName || 'N/A'),
        escapeCSV(order.customerEmail || 'N/A'),
        escapeCSV(order.customerPhone || 'N/A'),
        escapeCSV(order.customerAddress || 'N/A'),
        escapeCSV(order.script?.name || 'N/A'),
        escapeCSV(order.totalCallCount || 0),
        escapeCSV(getStatusText(order.callStatus)),
        escapeCSV(sentimentLabel),
        escapeCSV(outcomeDisplay.text)
      ].join(',');
    });

    // Combine header and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign_${upload.filename || campaignId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="campaign-details-page">
        <div className="campaign-details-loading">Loading campaign details...</div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="campaign-details-page">
        <div className="campaign-details-error">Campaign not found</div>
      </div>
    );
  }

  const dynamicStats = calculateDynamicStats();
  const campaignStatus = getCampaignStatus();
  
  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    if (ordersSearch.trim()) {
      const searchLower = ordersSearch.toLowerCase();
      const orderNumber = (order.orderNumber || order.id || '').toString().toLowerCase();
      const customerName = (order.customerName || '').toLowerCase();
      const phone = (order.customerPhone || '').toLowerCase();
      const address = (order.customerAddress || '').toLowerCase();
      // Search in summary from latest call
      const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
      const summary = (latestCall?.summary || latestCall?.callSummary || order.summary || '').toLowerCase();
      const matchesSearch = orderNumber.includes(searchLower) ||
                           customerName.includes(searchLower) ||
                           phone.includes(searchLower) ||
                           address.includes(searchLower) ||
                           summary.includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Total calls filter (range)
    if (filterTotalCallsMin || filterTotalCallsMax) {
      const totalCalls = order.totalCallCount || 0;
      const min = filterTotalCallsMin ? parseInt(filterTotalCallsMin) : 0;
      const max = filterTotalCallsMax ? parseInt(filterTotalCallsMax) : Infinity;
      if (totalCalls < min || totalCalls > max) return false;
    }

    // Status filter (multi-select) - match by actual status text
    if (!filterStatuses.has('all') && filterStatuses.size > 0) {
      const statusText = getStatusText(order.callStatus);
      const statusLower = statusText.toLowerCase();
      
      let matches = false;
      filterStatuses.forEach(filterStatus => {
        if (filterStatus === 'all') return;
        // Match by checking if the status text includes the filter or vice versa
        const filterLower = filterStatus.toLowerCase().replace(/_/g, ' ');
        if (statusLower.includes(filterLower) || filterLower.includes(statusLower)) {
          matches = true;
        }
      });
      
      if (!matches) return false;
    }

    // Sentiment filter (multi-select) - based on interest score + transcript length
    if (!filterSentiments.has('all') && filterSentiments.size > 0) {
      const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
      const interestScore = latestCall?.callInterestScore ?? latestCall?.onehotscore ?? order.onehotscore ?? null;
      const transcriptLength = latestCall?.transcript ? latestCall.transcript.length : 0;
      const sentimentDisplay = getSentimentDisplay(interestScore, transcriptLength);
      const sentimentLabel = sentimentDisplay ? sentimentDisplay.label.toLowerCase() : '';
      
      let matches = false;
      if (filterSentiments.has('not_interested') && sentimentLabel === 'not interested') matches = true;
      if (filterSentiments.has('neutral') && sentimentLabel === 'neutral') matches = true;
      if (filterSentiments.has('angry') && sentimentLabel === 'angry') matches = true;
      if (filterSentiments.has('interested') && sentimentLabel === 'interested') matches = true;
      if (filterSentiments.has('very_happy') && sentimentLabel === 'very happy') matches = true;
      // Also handle blank/no score
      if (!sentimentDisplay && filterSentiments.has('blank')) matches = true;
      
      if (!matches) return false;
    }

    // Call Outcome filter (multi-select)
    if (!filterOutcomes.has('all') && filterOutcomes.size > 0) {
      const outcome = getCallOutcome(order);
      const outcomeLower = outcome ? outcome.toLowerCase() : 'n/a';
      
      let matches = false;
      filterOutcomes.forEach(filterOutcome => {
        if (filterOutcome === 'n/a' && (outcome === 'N/A' || !outcome)) {
          matches = true;
        } else if (outcomeLower.includes(filterOutcome.toLowerCase())) {
          matches = true;
        }
      });
      
      if (!matches) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    switch (sortField) {
      case 'totalCalls':
        aValue = a.totalCallCount || 0;
        bValue = b.totalCallCount || 0;
        break;
      case 'status':
        aValue = getStatusText(a.callStatus).toLowerCase();
        bValue = getStatusText(b.callStatus).toLowerCase();
        break;
      case 'sentiment':
        const aLatestCall = a.calls && a.calls.length > 0 ? a.calls[0] : null;
        const bLatestCall = b.calls && b.calls.length > 0 ? b.calls[0] : null;
        const aInterestScore = aLatestCall?.callInterestScore ?? aLatestCall?.onehotscore ?? a.onehotscore ?? null;
        const bInterestScore = bLatestCall?.callInterestScore ?? bLatestCall?.onehotscore ?? b.onehotscore ?? null;
        const aTranscriptLength = aLatestCall?.transcript ? aLatestCall.transcript.length : 0;
        const bTranscriptLength = bLatestCall?.transcript ? bLatestCall.transcript.length : 0;
        const aSentiment = getSentimentDisplay(aInterestScore, aTranscriptLength);
        const bSentiment = getSentimentDisplay(bInterestScore, bTranscriptLength);
        aValue = aSentiment ? aSentiment.label.toLowerCase() : 'zzz'; // Put blank at end
        bValue = bSentiment ? bSentiment.label.toLowerCase() : 'zzz';
        break;
      case 'outcome':
        aValue = getCallOutcome(a).toLowerCase();
        bValue = getCallOutcome(b).toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const updatedAddressCall = orderCalls.find(call => call.newAddress);
  const hasOriginalAddress = selectedOrder?.customerAddress && selectedOrder.customerAddress !== 'N/A';
  const showAddressSection = hasOriginalAddress || !!updatedAddressCall?.newAddress;

  return (
    <div className="campaign-details-page">
      <div className="campaign-details-container">
        {/* Header Section */}
        <div className="campaign-details-header-section">
          <button 
            className="campaign-details-back-btn"
            onClick={() => navigate(`/campaigns?shop=${encodeURIComponent(shop)}`)}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          
          <div className="campaign-details-header-content">
            <div className="campaign-details-header-main">
              <h1 className="campaign-details-title">{upload.filename}</h1>
              <div className="campaign-details-meta-row">
                <span 
                  className="campaign-details-status-badge"
                  style={{ 
                    backgroundColor: campaignStatus.badgeBg,
                    color: campaignStatus.badgeColor
                  }}
                >
                  {campaignStatus.label}
                </span>
                <span className="campaign-details-meta-separator">•</span>
                <span className="campaign-details-meta-text">{upload.shop}</span>
                <span className="campaign-details-meta-separator">•</span>
                <span className="campaign-details-meta-text">{formatDate(upload.createdAt)}</span>
              </div>
            </div>
            
            <div className="campaign-details-header-actions">
              <button 
                className="campaigns-btn-unified campaigns-btn-secondary-unified"
                onClick={async () => {
                  setShowCampaignSettings(true);
                  await loadCampaignOutcomes();
                }}
                title="Campaign Settings"
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button 
                className="campaigns-btn-unified campaigns-btn-primary-unified"
                onClick={exportToCSV}
                title="Export filtered orders to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button 
                className="campaigns-btn-unified campaigns-btn-secondary-unified"
                onClick={() => loadCsvOrders(upload.id)}
              >
                <Table2 size={14} />
                <span>Table View</span>
              </button>
              <button 
                className="campaigns-btn-unified campaigns-btn-secondary-unified"
                onClick={handleBulkUpdateAddresses}
              >
                <RefreshCw size={14} />
                <span>Bulk Update</span>
              </button>
              {selectedOrders.size > 0 && (
                <button 
                  className="campaigns-btn-unified campaigns-btn-secondary-unified"
                  onClick={() => handleBulkTag(Array.from(selectedOrders))}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  <span>Tag ({selectedOrders.size})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters Bar - Compact Horizontal Row */}
        <div className="campaign-details-filters-section">
          {/* Search */}
          <div className="campaign-details-search-wrapper">
            <Search size={14} className="campaigns-search-icon-unified" />
            <input
              type="text"
              className="campaigns-input-unified"
              placeholder="Search orders..."
              value={ordersSearch}
              onChange={(e) => setOrdersSearch(e.target.value)}
            />
          </div>

          {/* Total Calls Range */}
          <div className="campaign-details-filter-inline">
            <span className="campaign-details-filter-label-inline">Total Calls:</span>
            <div className="campaign-details-range-inputs">
              <input
                type="number"
                className="campaign-details-range-input"
                placeholder="Min"
                value={filterTotalCallsMin}
                onChange={(e) => setFilterTotalCallsMin(e.target.value)}
                min="0"
              />
              <span className="campaign-details-range-separator">–</span>
              <input
                type="number"
                className="campaign-details-range-input"
                placeholder="Max"
                value={filterTotalCallsMax}
                onChange={(e) => setFilterTotalCallsMax(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="campaign-details-filter-dropdown-wrapper">
            <span className="campaign-details-filter-label-inline">Status:</span>
            <div className="campaign-details-filter-dropdown">
              <button
                className="campaign-details-filter-dropdown-button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                type="button"
              >
                <span>
                  {filterStatuses.has('all') 
                    ? 'All' 
                    : Array.from(filterStatuses).map(s => {
                        // Convert key back to display name
                        return s.replace(/_/g, ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                      }).join(', ')}
                </span>
                <ChevronDown size={14} />
              </button>
              {statusDropdownOpen && (
                <div className="campaign-details-filter-dropdown-menu">
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterStatuses.has('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterStatuses(new Set(['all']));
                        } else {
                          setFilterStatuses(new Set());
                        }
                      }}
                    />
                    <span>All</span>
                  </label>
                  {(() => {
                    // Get unique statuses from orders
                    const uniqueStatuses = new Set();
                    orders.forEach(order => {
                      const statusText = getStatusText(order.callStatus);
                      if (statusText && statusText !== 'N/A') {
                        uniqueStatuses.add(statusText);
                      }
                    });
                    const sortedStatuses = Array.from(uniqueStatuses).sort();
                    
                    return sortedStatuses.map(status => {
                      // Create a key from the status (lowercase, replace spaces with underscores)
                      const statusKey = status.toLowerCase().replace(/\s+/g, '_');
                      
                      return (
                        <label key={status} className="campaign-details-filter-dropdown-item">
                          <input
                            type="checkbox"
                            checked={filterStatuses.has(statusKey)}
                            onChange={(e) => {
                              const newSet = new Set(filterStatuses);
                              if (e.target.checked) {
                                newSet.delete('all');
                                newSet.add(statusKey);
                              } else {
                                newSet.delete(statusKey);
                                if (newSet.size === 0) newSet.add('all');
                              }
                              setFilterStatuses(newSet);
                            }}
                          />
                          <span>{status}</span>
                        </label>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Sentiment Dropdown */}
          <div className="campaign-details-filter-dropdown-wrapper">
            <span className="campaign-details-filter-label-inline">Sentiment:</span>
            <div className="campaign-details-filter-dropdown">
              <button
                className="campaign-details-filter-dropdown-button"
                onClick={() => setSentimentDropdownOpen(!sentimentDropdownOpen)}
                type="button"
              >
                <span>
                  {filterSentiments.has('all') 
                    ? 'All' 
                    : Array.from(filterSentiments).map(s => {
                        if (s === 'not_interested') return 'Not Interested';
                        if (s === 'neutral') return 'Neutral';
                        if (s === 'angry') return 'Angry';
                        if (s === 'interested') return 'Interested';
                        if (s === 'very_happy') return 'Very Happy';
                        if (s === 'blank') return 'No Score';
                        return s.charAt(0).toUpperCase() + s.slice(1);
                      }).join(', ')}
                </span>
                <ChevronDown size={14} />
              </button>
              {sentimentDropdownOpen && (
                <div className="campaign-details-filter-dropdown-menu">
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterSentiments(new Set(['all']));
                        } else {
                          setFilterSentiments(new Set());
                        }
                      }}
                    />
                    <span>All</span>
                  </label>
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('not_interested')}
                      onChange={(e) => {
                        const newSet = new Set(filterSentiments);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('not_interested');
                        } else {
                          newSet.delete('not_interested');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterSentiments(newSet);
                      }}
                    />
                    <span>Not Interested</span>
                  </label>
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('neutral')}
                      onChange={(e) => {
                        const newSet = new Set(filterSentiments);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('neutral');
                        } else {
                          newSet.delete('neutral');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterSentiments(newSet);
                      }}
                    />
                    <span>Neutral</span>
                  </label>
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('angry')}
                      onChange={(e) => {
                        const newSet = new Set(filterSentiments);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('angry');
                        } else {
                          newSet.delete('angry');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterSentiments(newSet);
                      }}
                    />
                    <span>Angry</span>
                  </label>
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('interested')}
                      onChange={(e) => {
                        const newSet = new Set(filterSentiments);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('interested');
                        } else {
                          newSet.delete('interested');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterSentiments(newSet);
                      }}
                    />
                    <span>Interested</span>
                  </label>
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('very_happy')}
                      onChange={(e) => {
                        const newSet = new Set(filterSentiments);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('very_happy');
                        } else {
                          newSet.delete('very_happy');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterSentiments(newSet);
                      }}
                    />
                    <span>Very Happy</span>
                  </label>
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterSentiments.has('blank')}
                      onChange={(e) => {
                        const newSet = new Set(filterSentiments);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('blank');
                        } else {
                          newSet.delete('blank');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterSentiments(newSet);
                      }}
                    />
                    <span>No Score</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Call Outcome Dropdown */}
          <div className="campaign-details-filter-dropdown-wrapper">
            <span className="campaign-details-filter-label-inline">Outcome:</span>
            <div className="campaign-details-filter-dropdown">
              <button
                className="campaign-details-filter-dropdown-button"
                onClick={() => setOutcomeDropdownOpen(!outcomeDropdownOpen)}
                type="button"
              >
                <span>
                  {filterOutcomes.has('all') 
                    ? 'All' 
                    : Array.from(filterOutcomes).map(s => {
                        if (s === 'n/a') return 'N/A';
                        return s;
                      }).join(', ')}
                </span>
                <ChevronDown size={14} />
              </button>
              {outcomeDropdownOpen && (
                <div className="campaign-details-filter-dropdown-menu">
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterOutcomes.has('all')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterOutcomes(new Set(['all']));
                        } else {
                          setFilterOutcomes(new Set());
                        }
                      }}
                    />
                    <span>All</span>
                  </label>
                  {(() => {
                    // Get unique outcomes from orders with their display names
                    const outcomeMap = new Map(); // original -> display
                    orders.forEach(order => {
                      const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
                      const outcome = getCallOutcome(order);
                      if (outcome && outcome !== 'N/A') {
                        const callDuration = latestCall?.callDuration || latestCall?.durationSeconds || null;
                        const outcomeDisplay = getOutcomeDisplay(outcome, callDuration);
                        // Store original -> display mapping
                        if (!outcomeMap.has(outcome)) {
                          outcomeMap.set(outcome, outcomeDisplay.text);
                        }
                      }
                    });
                    
                    // Sort by display name
                    const sortedOutcomes = Array.from(outcomeMap.entries()).sort((a, b) => 
                      a[1].localeCompare(b[1])
                    );
                    
                    return sortedOutcomes.map(([originalOutcome, displayText]) => (
                      <label key={originalOutcome} className="campaign-details-filter-dropdown-item">
                        <input
                          type="checkbox"
                          checked={filterOutcomes.has(originalOutcome.toLowerCase())}
                          onChange={(e) => {
                            const newSet = new Set(filterOutcomes);
                            if (e.target.checked) {
                              newSet.delete('all');
                              newSet.add(originalOutcome.toLowerCase());
                            } else {
                              newSet.delete(originalOutcome.toLowerCase());
                              if (newSet.size === 0) newSet.add('all');
                            }
                            setFilterOutcomes(newSet);
                          }}
                        />
                        <span>{displayText}</span>
                      </label>
                    ));
                  })()}
                  <label className="campaign-details-filter-dropdown-item">
                    <input
                      type="checkbox"
                      checked={filterOutcomes.has('n/a')}
                      onChange={(e) => {
                        const newSet = new Set(filterOutcomes);
                        if (e.target.checked) {
                          newSet.delete('all');
                          newSet.add('n/a');
                        } else {
                          newSet.delete('n/a');
                          if (newSet.size === 0) newSet.add('all');
                        }
                        setFilterOutcomes(newSet);
                      }}
                    />
                    <span>N/A</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        {dynamicStats && !loadingStats && (
          <div className="campaign-details-metrics-section">
            <div className="campaign-details-metrics-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h2 className="campaign-details-metrics-title">Metrics</h2>
                  <p className="campaign-details-metrics-subtitle">Small summary of campaign performance.</p>
                </div>
                {/* Primary Metrics - 3 KPIs as compact chips */}
                <div className="campaign-details-stats-primary">
                <div className="campaign-details-stat-chip">
                  <span className="campaign-details-stat-chip-value">{dynamicStats.totalOrders || 0}</span>
                  <span className="campaign-details-stat-chip-label">Orders</span>
                </div>
                <div className="campaign-details-stat-chip">
                  <span className="campaign-details-stat-chip-value">{dynamicStats.totalConnected || 0}</span>
                  <span className="campaign-details-stat-chip-label">Connected</span>
                </div>
                <div className="campaign-details-stat-chip">
                  <span className="campaign-details-stat-chip-value">{dynamicStats.conversionRate || 0}%</span>
                  <span className="campaign-details-stat-chip-label">Converted</span>
                </div>
                </div>
              </div>
            </div>

            <div className="campaign-details-metrics-content">
              {/* Order-Based Stats - 3 new stats */}
              {orderStats && !loadingOrderStats && (
                <div className="campaign-details-order-stats" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '16px', 
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {orderStats.pickupRate.toFixed(1)}%
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      textAlign: 'center',
                      fontWeight: 500
                    }}>
                      Pickup Rate
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af', 
                      marginTop: '4px'
                    }}>
                      {orderStats.pickedUpCalls || 0} / {orderStats.isTestCallsCampaign ? (orderStats.totalOrders || 0) : (orderStats.totalCalls || 0)} {orderStats.isTestCallsCampaign ? 'orders' : 'calls'}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: '#10b981',
                      marginBottom: '4px'
                    }}>
                      {orderStats.successRate.toFixed(1)}%
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      textAlign: 'center',
                      fontWeight: 500
                    }}>
                      Confirmation Rate
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af', 
                      marginTop: '4px'
                    }}>
                      {orderStats.successfulCriteriaOrders || 0} / {orderStats.pickedUpCalls || 0} {orderStats.isTestCallsCampaign ? 'orders' : 'picked up'}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ 
                      fontSize: '32px', 
                      fontWeight: 700, 
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {orderStats.earlyDisconnectRate.toFixed(1)}%
                    </span>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      textAlign: 'center',
                      fontWeight: 500
                    }}>
                      Early Disconnects
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af', 
                      marginTop: '4px'
                    }}>
                      {orderStats.earlyDisconnectOrders || 0} / {orderStats.pickedUpCalls || 0} {orderStats.isTestCallsCampaign ? 'orders' : 'picked up'}
                    </span>
                  </div>
                </div>
              )}

              {/* Secondary Metrics - Collapsible 5-grid */}
              <div className="campaign-details-stats-secondary">
                <button 
                  className="campaign-details-stats-toggle"
                  onClick={() => setShowMoreMetrics(!showMoreMetrics)}
                >
                  <span>More Metrics (5)</span>
                  <ChevronDown size={16} className={showMoreMetrics ? 'rotated' : ''} />
                </button>
                {showMoreMetrics && (
                  <div className="campaign-details-stats-grid">
                    <div className="campaign-details-stat-grid-item">
                      <span className="campaign-details-stat-grid-label">Tribe:</span>
                      <span className="campaign-details-stat-grid-value">{dynamicStats.completedTotal || 0}</span>
                    </div>
                    <div className="campaign-details-stat-grid-item">
                      <span className="campaign-details-stat-grid-label">Pick:</span>
                      <span className="campaign-details-stat-grid-value">{dynamicStats.totalSuccess || 0}</span>
                    </div>
                    <div className="campaign-details-stat-grid-item">
                      <span className="campaign-details-stat-grid-label">Duration:</span>
                      <span className="campaign-details-stat-grid-value">{dynamicStats.avgDuration || 0}s</span>
                    </div>
                    <div className="campaign-details-stat-grid-item">
                      <span className="campaign-details-stat-grid-label">Not Booked:</span>
                      <span className="campaign-details-stat-grid-value">{dynamicStats.callNotBooked || 0}</span>
                    </div>
                    <div className="campaign-details-stat-grid-item">
                      <span className="campaign-details-stat-grid-label">With Calls:</span>
                      <span className="campaign-details-stat-grid-value">{dynamicStats.ordersWithCalls || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Details - Collapsible text list */}
              <div className="campaign-details-stats-other">
                <button 
                  className="campaign-details-stats-toggle"
                  onClick={() => setShowOtherDetails(!showOtherDetails)}
                >
                  <span>Other Details</span>
                  <ChevronDown size={16} className={showOtherDetails ? 'rotated' : ''} />
                </button>
                {showOtherDetails && (
                  <ul className="campaign-details-stats-other-list">
                    <li>Address Change: {dynamicStats.addressChange || 0}</li>
                    <li>Cancellation Request: {dynamicStats.cancellationRequest || 0}</li>
                    <li>Handle Manually: {dynamicStats.handleManually || 0}</li>
                    <li>Invalid: {dynamicStats.invalid || 0}</li>
                    <li>Under 35s Retries: {dynamicStats.earlyDisconnectMaxRetries || 0}</li>
                    <li>Not Picked Up (Retries): {dynamicStats.notPickedUpMaxRetries || 0}</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && (
          <div className="campaigns-modal-overlay" onClick={() => setShowOrderDetails(false)}>
            <div className="campaigns-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="campaigns-modal-header">
                <h3 className="campaigns-modal-title">Order Details</h3>
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
                  {/* Customer Information Section - Consolidated */}
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
                      {showAddressSection && (
                        <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                          <span className="campaigns-info-label">Address</span>
                          <span className="campaigns-info-value">{hasOriginalAddress ? selectedOrder.customerAddress : 'Not provided'}</span>
                        </div>
                      )}
                      {updatedAddressCall?.newAddress && (
                        <>
                          <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                            <span className="campaigns-info-label">Updated Address</span>
                            <span className="campaigns-info-value">{updatedAddressCall.newAddress}</span>
                          </div>
                          <div className="campaigns-info-row" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <button
                                className="campaigns-btn-unified campaigns-btn-secondary-unified"
                                onClick={() => handleEditNewAddress(
                                  updatedAddressCall.id,
                                  selectedOrder.customerAddress,
                                  updatedAddressCall.newAddress
                                )}
                                style={{ padding: '8px 16px', fontSize: '13px' }}
                              >
                                View / Edit
                              </button>
                              <button
                                className="campaigns-btn-unified campaigns-btn-primary-unified"
                                onClick={() => handleUpdateAddressInShopify(
                                  selectedOrder.orderId || selectedOrder.id,
                                  updatedAddressCall.newAddress
                                )}
                                style={{ padding: '8px 16px', fontSize: '13px' }}
                              >
                                Push to Shopify
                              </button>
                            </div>
                          </div>
                        </>
                      )}
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
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <button
                        className="campaigns-btn-unified campaigns-btn-secondary-unified"
                        onClick={() => handleBulkTag([selectedOrder.orderId || selectedOrder.id])}
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                          <line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                        Tag Order
                      </button>
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
                                {call.addressChangeRequested && (
                                  <div className="campaigns-info-row">
                                    <span className="campaigns-info-label">Address Change</span>
                                    <span className="campaigns-info-value">Requested</span>
                                  </div>
                                )}
                                {call.newAddress && (
                                  <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                                    <span className="campaigns-info-label">New Address</span>
                                    <span className="campaigns-info-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                      {call.newAddress}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {call.newAddress && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <button
                                      className="campaigns-btn-unified campaigns-btn-secondary-unified"
                                      onClick={() => handleEditNewAddress(
                                        call.id,
                                        selectedOrder.customerAddress,
                                        call.newAddress
                                      )}
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                    >
                                      Review GPT Address
                                    </button>
                                    <button
                                      className="campaigns-btn-unified campaigns-btn-primary-unified"
                                      onClick={() => handleUpdateAddressInShopify(
                                        selectedOrder.orderId || selectedOrder.id,
                                        call.newAddress
                                      )}
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                    >
                                      Push to Shopify
                                    </button>
                                  </div>
                                </div>
                              )}

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

        {/* Orders Table */}
        {loadingOrders ? (
          <div className="campaign-details-loading">Loading orders...</div>
        ) : (
          <div className="campaign-details-orders-section">
            <div className="campaigns-table-wrapper-unified">
              <table className="csv-history-table-unified">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ textAlign: 'center', minWidth: '60px' }}>#</th>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Script</th>
                    <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('totalCalls')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Total Calls
                        {sortField === 'totalCalls' ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Status
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('sentiment')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Sentiment
                        {sortField === 'sentiment' ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('outcome')}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        Call Outcome
                        {sortField === 'outcome' ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                        )}
                      </div>
                    </th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order, index) => (
                    <tr 
                      key={order.id}
                      onClick={() => handleShowOrderDetails(order.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.orderId || order.id)}
                          onChange={() => toggleOrderSelection(order)}
                        />
                      </td>
                      <td style={{ textAlign: 'center', color: '#6b7280', fontWeight: 500 }}>
                        {index + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: '#111827' }}>
                        #{order.orderNumber || order.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#111827' }}>
                          {order.customerName || 'N/A'}
                        </div>
                        {order.customerEmail && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {order.customerEmail}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#6b7280' }}>
                        {order.customerPhone || 'N/A'}
                      </td>
                      <td style={{ color: '#111827', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.customerAddress || 'N/A'}
                      </td>
                      <td style={{ color: '#111827', fontWeight: 500 }}>
                        {order.script?.name || 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="call-count-badge">
                          {order.totalCallCount || 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-badge">
                          {getStatusText(order.callStatus)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
                          // Get interest score from call or order (onehotscore or callInterestScore)
                          const interestScore = latestCall?.callInterestScore ?? latestCall?.onehotscore ?? order.onehotscore ?? null;
                          // Get transcript length
                          const transcriptLength = latestCall?.transcript ? latestCall.transcript.length : 0;
                          const sentimentDisplay = getSentimentDisplay(interestScore, transcriptLength);
                          
                          // If no interest score, show blank
                          if (!sentimentDisplay) {
                            return <span style={{ color: '#9ca3af' }}>—</span>;
                          }
                          
                          return (
                            <span className="sentiment-tag" style={{ backgroundColor: sentimentDisplay.color }}>
                              <span className="sentiment-bars-container">
                                {Array.from({ length: sentimentDisplay.totalBars }).map((_, index) => (
                                  <span
                                    key={index}
                                    className={`sentiment-bar ${index < sentimentDisplay.filledBars ? 'filled' : ''}`}
                                    style={{
                                      backgroundColor: index < sentimentDisplay.filledBars ? sentimentDisplay.barColor : '#e5e7eb'
                                    }}
                                  ></span>
                                ))}
                              </span>
                              <span className="sentiment-label">{sentimentDisplay.label}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ textAlign: 'center', color: '#111827' }}>
                        {(() => {
                          const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
                          const outcome = getCallOutcome(order);
                          const callDuration = latestCall?.callDuration || latestCall?.durationSeconds || null;
                          const outcomeDisplay = getOutcomeDisplay(outcome, callDuration, order);
                          
                          if (outcomeDisplay.text === 'N/A' || !outcomeDisplay.text) {
                            return <span style={{ color: '#9ca3af' }}>—</span>;
                          }
                          
                          // Render with colored pill if color is specified (matching sentiment pill style)
                          if (outcomeDisplay.color && outcomeDisplay.borderColor) {
                            return (
                              <span 
                                className="sentiment-tag"
                                style={{ 
                                  backgroundColor: outcomeDisplay.color,
                                  borderColor: outcomeDisplay.borderColor,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                  color: '#111827'
                                }}
                              >
                                <span className="sentiment-label">{outcomeDisplay.text}</span>
                              </span>
                            );
                          }
                          
                          return <span style={{ fontWeight: 500 }}>{outcomeDisplay.text}</span>;
                        })()}
                      </td>
                      <td className="csv-table-cell-actions-unified" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="campaigns-btn-unified campaigns-btn-primary-unified campaigns-btn-sm-unified"
                          onClick={() => handleBulkCall([order.orderId || order.id])}
                        >
                          AI Call
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Script Selection Modal */}
        {showScriptModal && (
          <div className="campaigns-modal-overlay" onClick={() => setShowScriptModal(false)}>
            <div className="campaigns-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="campaigns-modal-header">
                <h3 className="campaigns-modal-title">Bulk AI Call - {pendingOrderIds.length} Orders</h3>
                <button 
                  className="campaigns-modal-close"
                  onClick={() => setShowScriptModal(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="campaigns-modal-body">
                <p style={{ marginBottom: '16px', color: '#6b7280' }}>Choose a script to use for the selected orders:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scripts.length > 0 ? (
                    scripts.map(script => (
                      <button
                        key={script.id}
                        className="campaigns-btn-unified campaigns-btn-secondary-unified"
                        onClick={() => handleSelectScript(script.id, script.name)}
                        style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{script.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {script.content ? (script.content.substring(0, 100) + (script.content.length > 100 ? '...' : '')) : 'No content'}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>
                      No scripts available. Please create a script first.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tagging Modal */}
        {showTagModal && (
          <div className="campaigns-modal-overlay" onClick={() => setShowTagModal(false)}>
            <div className="campaigns-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="campaigns-modal-header">
                <h3 className="campaigns-modal-title">Tag Orders - {taggingOrderIds.length} Selected</h3>
                <button 
                  className="campaigns-modal-close"
                  onClick={() => {
                    setShowTagModal(false);
                    setSelectedTag('');
                    setNewTagInput('');
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="campaigns-modal-body">
                <p style={{ marginBottom: '16px', color: '#6b7280' }}>Select an existing tag or enter a new one:</p>
                
                {/* Existing Tags */}
                {customTags.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#111827' }}>
                      Your Tags
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {customTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(tag);
                            setNewTagInput('');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: selectedTag === tag ? '2px solid #4B5CFF' : '1px solid #e5e7eb',
                            background: selectedTag === tag ? '#f0f4ff' : '#ffffff',
                            color: selectedTag === tag ? '#4B5CFF' : '#111827',
                            fontSize: '13px',
                            fontWeight: selectedTag === tag ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Tag Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#111827' }}>
                    {customTags.length > 0 ? 'Or Enter New Tag' : 'Enter Tag Name'}
                  </label>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => {
                      setNewTagInput(e.target.value);
                      setSelectedTag('');
                    }}
                    placeholder="Enter tag name..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && (newTagInput.trim() || selectedTag)) {
                        handleTagOrders(newTagInput.trim() || selectedTag);
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    className="campaigns-btn-unified campaigns-btn-secondary-unified"
                    onClick={() => {
                      setShowTagModal(false);
                      setSelectedTag('');
                      setNewTagInput('');
                    }}
                    disabled={tagging}
                  >
                    Cancel
                  </button>
                  <button
                    className="campaigns-btn-unified campaigns-btn-primary-unified"
                    onClick={() => handleTagOrders(newTagInput.trim() || selectedTag)}
                    disabled={tagging || (!newTagInput.trim() && !selectedTag)}
                  >
                    {tagging ? 'Tagging...' : `Tag ${taggingOrderIds.length} Orders`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Settings Modal */}
        {showCampaignSettings && upload && (
          <div className="campaigns-modal-overlay" onClick={() => setShowCampaignSettings(false)}>
            <div className="campaigns-modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="profile-page-container" style={{ padding: '24px', maxWidth: '100%' }}>
                {/* Header with Close Button */}
                <div className="profile-page-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="profile-back-button" onClick={() => setShowCampaignSettings(false)}>
                    <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
                    Back
                  </button>
                  <button 
                    onClick={() => setShowCampaignSettings(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                
                <h2 className="profile-page-title" style={{ fontSize: '20px', marginBottom: '24px' }}>Campaign Settings</h2>

                {/* Script Info */}
                {script && (
                  <div className="profile-detail-section" style={{ marginBottom: '24px' }}>
                    <div className="profile-detail-box">
                      <div className="profile-detail-item">
                        <div className="profile-detail-label">
                          <span>Script</span>
                        </div>
                        <div className="profile-detail-action">
                          <span style={{ fontSize: '14px', color: '#6B7280' }}>{script.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Load Outcomes Section */}
                <div className="profile-detail-section">
                  <div className="profile-detail-box">
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Call Outcomes</span>
                        <span className="profile-detail-hint">Load unique call outcomes from this campaign</span>
                      </div>
                      <div className="profile-detail-action">
                        <button
                          className="campaigns-btn-unified campaigns-btn-secondary-unified"
                          onClick={loadCampaignOutcomes}
                          disabled={loadingCampaignOutcomes}
                          style={{ fontSize: '14px', padding: '8px 16px' }}
                        >
                          {loadingCampaignOutcomes ? 'Loading...' : campaignOutcomes.length > 0 ? `Refresh (${campaignOutcomes.length})` : 'Load Outcomes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcomes List */}
                {campaignOutcomes.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    {campaignOutcomes.map((outcome, index) => {
                      const existingRule = campaignRules.find(r => r.outcome === outcome);
                      const ruleEnabled = existingRule?.enabled || false;
                      
                      return (
                        <div key={index} className="profile-detail-section">
                          <div className="profile-detail-box">
                            {/* Outcome Name and Enable Toggle */}
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span>{outcome}</span>
                                <span className="profile-detail-hint">Auto-call when this outcome occurs</span>
                              </div>
                              <div className="profile-detail-action">
                                <label className="profile-toggle-switch">
                                  <input
                                    type="checkbox"
                                    checked={ruleEnabled}
                                    onChange={(e) => {
                                      const enabled = e.target.checked;
                                      setCampaignRules(prev => {
                                        const existing = prev.find(r => r.outcome === outcome);
                                        if (existing) {
                                          existing.enabled = enabled;
                                          return [...prev];
                                        } else {
                                          return [...prev, {
                                            outcome,
                                            enabled,
                                            retrySettings: {
                                              maxRetries: defaultRetrySettings.maxRetries,
                                              retryIntervalMinutes: defaultRetrySettings.retryIntervalMinutes,
                                              autoCancelOnMaxRetries: defaultRetrySettings.autoCancelOnMaxRetries,
                                              allowedTimeStart: defaultRetrySettings.allowedTimeStart,
                                              allowedTimeEnd: defaultRetrySettings.allowedTimeEnd,
                                              timezone: defaultRetrySettings.timezone,
                                              allowedDays: [...defaultRetrySettings.allowedDays]
                                            }
                                          }];
                                        }
                                      });
                                    }}
                                  />
                                  <span className="profile-toggle-slider"></span>
                                </label>
                              </div>
                            </div>

                            {/* Retry Settings - Collapsible */}
                            {ruleEnabled && (
                              <>
                                <hr className="profile-detail-divider" />
                                <div className="profile-detail-item" style={{ cursor: 'pointer' }} onClick={() => {
                                  const newExpanded = new Set(expandedOutcomes);
                                  if (newExpanded.has(outcome)) {
                                    newExpanded.delete(outcome);
                                  } else {
                                    newExpanded.add(outcome);
                                  }
                                  setExpandedOutcomes(newExpanded);
                                }}>
                                  <div className="profile-detail-label">
                                    <span>Retry Settings</span>
                                    <span className="profile-detail-hint">Configure retry behavior for this outcome</span>
                                  </div>
                                  <div className="profile-detail-action">
                                    <ChevronDown 
                                      size={16}
                                      style={{ 
                                        transform: expandedOutcomes.has(outcome) ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                        color: '#6B7280'
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {expandedOutcomes.has(outcome) && (
                                  <>
                                    <hr className="profile-detail-divider" />
                                    
                                    {/* Max Retries */}
                                    <div className="profile-detail-item">
                                      <div className="profile-detail-label">
                                        <span>Max Retries</span>
                                        <span className="profile-detail-hint">How many times should we try calling? (0-10)</span>
                                      </div>
                                      <div className="profile-detail-action">
                                        <input
                                          type="number"
                                          className="profile-detail-input"
                                          min="0"
                                          max="10"
                                          value={existingRule?.retrySettings?.maxRetries ?? defaultRetrySettings.maxRetries}
                                          onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            if (!isNaN(value)) {
                                              setCampaignRules(prev => {
                                                const rule = prev.find(r => r.outcome === outcome) || {
                                                  outcome,
                                                  enabled: ruleEnabled,
                                                  retrySettings: { ...defaultRetrySettings }
                                                };
                                                rule.retrySettings = { ...rule.retrySettings, maxRetries: value };
                                                const filtered = prev.filter(r => r.outcome !== outcome);
                                                return [...filtered, rule];
                                              });
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>

                                    <hr className="profile-detail-divider" />

                                    {/* Retry Interval */}
                                    <div className="profile-detail-item">
                                      <div className="profile-detail-label">
                                        <span>Retry Interval (minutes)</span>
                                        <span className="profile-detail-hint">How long to wait before trying again</span>
                                      </div>
                                      <div className="profile-detail-action">
                                        <input
                                          type="number"
                                          className="profile-detail-input"
                                          min="2"
                                          max="1440"
                                          value={existingRule?.retrySettings?.retryIntervalMinutes ?? defaultRetrySettings.retryIntervalMinutes}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            if (!isNaN(value)) {
                                              setCampaignRules(prev => {
                                                const rule = prev.find(r => r.outcome === outcome) || {
                                                  outcome,
                                                  enabled: ruleEnabled,
                                                  retrySettings: { ...defaultRetrySettings }
                                                };
                                                rule.retrySettings = { ...rule.retrySettings, retryIntervalMinutes: value };
                                                const filtered = prev.filter(r => r.outcome !== outcome);
                                                return [...filtered, rule];
                                              });
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>

                                    <hr className="profile-detail-divider" />

                                    {/* Auto Cancel */}
                                    <div className="profile-detail-item">
                                      <div className="profile-detail-label">
                                        <span>Auto cancel after max retries</span>
                                        <span className="profile-detail-hint">Automatically cancel the order in Shopify when we've tried calling the maximum number of times</span>
                                      </div>
                                      <div className="profile-detail-action">
                                        <label className="profile-toggle-switch">
                                          <input
                                            type="checkbox"
                                            checked={existingRule?.retrySettings?.autoCancelOnMaxRetries ?? defaultRetrySettings.autoCancelOnMaxRetries}
                                            onChange={(e) => {
                                              setCampaignRules(prev => {
                                                const rule = prev.find(r => r.outcome === outcome) || {
                                                  outcome,
                                                  enabled: ruleEnabled,
                                                  retrySettings: { ...defaultRetrySettings }
                                                };
                                                rule.retrySettings = { ...rule.retrySettings, autoCancelOnMaxRetries: e.target.checked };
                                                const filtered = prev.filter(r => r.outcome !== outcome);
                                                return [...filtered, rule];
                                              });
                                            }}
                                          />
                                          <span className="profile-toggle-slider"></span>
                                        </label>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {campaignOutcomes.length === 0 && !loadingCampaignOutcomes && (
                  <div className="profile-detail-section">
                    <div className="profile-detail-box">
                      <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                        Click "Load Outcomes" to see unique call outcomes from this campaign
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {campaignOutcomes.length > 0 && (
                  <div className="profile-save-container" style={{ marginTop: '32px' }}>
                    <button
                      className="profile-save-button-new"
                      onClick={saveCampaignRules}
                      disabled={savingCampaignRules}
                    >
                      {savingCampaignRules ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;

