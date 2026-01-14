import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import './RtoAnalysis.css';

const RtoAnalysis = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Current upload orders (shown immediately after upload)
  const [currentUploadOrders, setCurrentUploadOrders] = useState([]);
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [currentUploadStats, setCurrentUploadStats] = useState(null);
  const [currentUploadScript, setCurrentUploadScript] = useState(null);
  
  // CSV History state
  const [csvHistory, setCsvHistory] = useState([]);
  const [expandedUploadId, setExpandedUploadId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // Expanded row state
  const [expandedOrders, setExpandedOrders] = useState({});
  const [expandedStats, setExpandedStats] = useState({});
  const [expandedScript, setExpandedScript] = useState({});
  const [loadingOrders, setLoadingOrders] = useState({});
  const [loadingStats, setLoadingStats] = useState({});
  
  // Scripts state
  const [scripts, setScripts] = useState([]);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [pendingOrderIds, setPendingOrderIds] = useState([]);
  const [callingOrders, setCallingOrders] = useState(false);
  
  // Order details modal state
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCalls, setOrderCalls] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  // Order selection state
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Call count filter state for current upload
  const [filteredCurrentUploadOrders, setFilteredCurrentUploadOrders] = useState([]);
  
  // Search and filter state
  const [csvHistorySearch, setCsvHistorySearch] = useState('');
  const [csvHistoryStatusFilter, setCsvHistoryStatusFilter] = useState('all');
  const [currentUploadSearch, setCurrentUploadSearch] = useState('');
  const [expandedOrdersSearch, setExpandedOrdersSearch] = useState({});
  
  // Load scripts and history on mount
  useEffect(() => {
    if (shop) {
      loadScripts();
      loadCsvHistory(1);
    }
  }, [shop]);

  const loadScripts = async () => {
    try {
      const response = await api.getScripts(shop);
      const scriptsArray = response?.scripts || response || [];
      setScripts(scriptsArray);
    } catch (error) {
      console.error('[RtoAnalysis] Error loading scripts:', error);
    }
  };

  const navigate = useNavigate();

  const loadCsvHistory = async (page = 1) => {
    if (!shop) return;
    
    setLoadingHistory(true);
    try {
      console.log('[RtoAnalysis] Loading CSV history for shop:', shop, 'page:', page);
      const response = await fetch(`/api/csv-history?shop=${encodeURIComponent(shop)}&page=${page}&limit=10&isRtoAnalysis=true`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('[RtoAnalysis] CSV history response:', data);
      
      if (data.success) {
        const uploads = data.data.uploads || [];
        console.log('[RtoAnalysis] Setting CSV history with', uploads.length, 'uploads');
        console.log('[RtoAnalysis] Upload IDs:', uploads.map(u => u.id));
        setCsvHistory(uploads);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      } else {
        console.error('[RtoAnalysis] Failed to load CSV history:', data.error);
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error loading CSV history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!shop) {
      alert('Please select a store first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csvFile', selectedFile);
    formData.append('shop', shop);
    formData.append('isRtoAnalysis', 'true'); // Mark as RTO analysis upload

    try {
      const response = await fetch(`/api/upload-csv?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        console.log('[RtoAnalysis] CSV upload successful:', data);
        console.log('[RtoAnalysis] CSV upload ID:', data.csvUploadId);
        console.log('[RtoAnalysis] Orders received:', data.orders?.length || 0);
        console.log('[RtoAnalysis] Full response data:', JSON.stringify(data, null, 2));
        
        // Reset file input
        setSelectedFile(null);
        const fileInput = document.getElementById('campaigns-csv-file');
        if (fileInput) fileInput.value = '';
        
        // Display orders immediately (like CSV upload page)
        const newUploadId = data.csvUploadId;
        const orders = data.orders || [];
        
        console.log('[RtoAnalysis] Setting current upload orders:', orders.length);
        console.log('[RtoAnalysis] First order sample:', orders[0]);
        
        setCurrentUploadId(newUploadId);
        setCurrentUploadOrders(orders);
        setFilteredCurrentUploadOrders([]); // Reset filter
        
        // Determine script from orders and load stats
        if (orders.length > 0) {
          determineScriptFromOrders(newUploadId, orders);
          loadCsvStatsForCurrentUpload(newUploadId);
        }
        
        // Scroll to orders table after state update
        // Use the orders variable directly since state is async
        setTimeout(() => {
          console.log('[RtoAnalysis] Orders to display:', orders.length);
          const ordersSection = document.querySelector('.current-upload-section');
          console.log('[RtoAnalysis] Orders section element:', ordersSection);
          if (ordersSection) {
            ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            console.warn('[RtoAnalysis] Orders section not found in DOM, retrying...');
            // Retry once more after state has updated
            setTimeout(() => {
              const retrySection = document.querySelector('.current-upload-section');
              if (retrySection) {
                retrySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 200);
          }
        }, 300);
      } else {
        alert(`Error: ${data.error || 'Failed to process CSV'}`);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error processing CSV');
    } finally {
      setUploading(false);
    }
  };

  const toggleCsvDetails = (uploadId) => {
    if (expandedUploadId === uploadId) {
      setExpandedUploadId(null);
    } else {
      setExpandedUploadId(uploadId);
      // Load orders and stats when expanding
      if (!expandedOrders[uploadId]) {
        loadCsvOrders(uploadId);
      }
    }
  };

  const loadCsvOrders = async (uploadId) => {
    setLoadingOrders(prev => ({ ...prev, [uploadId]: true }));
    try {
      const response = await fetch(`/api/csv-results?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setExpandedOrders(prev => ({ ...prev, [uploadId]: data.orders || [] }));
        
        // Determine script from orders
        determineScriptFromOrders(uploadId, data.orders);
        
        // Load stats
        loadCsvStats(uploadId);
      }
    } catch (error) {
      console.error(`[RtoAnalysis] Error loading orders for ${uploadId}:`, error);
    } finally {
      setLoadingOrders(prev => ({ ...prev, [uploadId]: false }));
    }
  };

  const determineScriptFromOrders = (uploadId, orders) => {
    // Count scripts used in orders
    const scriptCounts = {};
    orders.forEach(order => {
      if (order.script && order.script.id) {
        const scriptId = order.script.id;
        scriptCounts[scriptId] = (scriptCounts[scriptId] || 0) + 1;
      }
    });

    // Find script with most calls
    const mostUsedScriptId = Object.entries(scriptCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (mostUsedScriptId) {
      const script = scripts.find(s => s.id === parseInt(mostUsedScriptId)) ||
                     orders.find(o => o.script && o.script.id === parseInt(mostUsedScriptId))?.script;
      
      if (script) {
        setExpandedScript(prev => ({ ...prev, [uploadId]: script }));
      }
    } else {
      // Use default "House directions" script
      const defaultScript = scripts.find(s => {
        const nameLower = s.name.toLowerCase();
        return (nameLower.includes('house') && nameLower.includes('direction')) ||
               nameLower.includes('house dir') ||
               (nameLower.includes('address') && nameLower.includes('extraction'));
      });
      
      if (defaultScript) {
        setExpandedScript(prev => ({ ...prev, [uploadId]: defaultScript }));
      }
    }
  };

  const loadCsvStats = async (uploadId) => {
    setLoadingStats(prev => ({ ...prev, [uploadId]: true }));
    try {
      const response = await fetch(`/api/csv-stats?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setExpandedStats(prev => ({ ...prev, [uploadId]: data.stats }));
      }
    } catch (error) {
      console.error(`[RtoAnalysis] Error loading stats for ${uploadId}:`, error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [uploadId]: false }));
    }
  };
  
  const loadCsvStatsForCurrentUpload = async (uploadId) => {
    try {
      const response = await fetch(`/api/csv-stats?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setCurrentUploadStats(data.stats);
      }
    } catch (error) {
      console.error(`[RtoAnalysis] Error loading stats for current upload:`, error);
    }
  };

  const handleBulkCall = (orderIds) => {
    setPendingOrderIds(orderIds);
    setShowScriptModal(true);
  };

  const handleSelectScript = async (scriptId, scriptName) => {
    setShowScriptModal(false);
    setCallingOrders(true);

    try {
      // Use bulk API for multiple orders
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
          } else {
        alert(`❌ Bulk AI Call failed: ${data.error || 'Unknown error'}`);
      }
      
      // Refresh orders if we have an expanded upload or current upload
      if (expandedUploadId) {
        loadCsvOrders(expandedUploadId);
      }
      if (currentUploadId) {
        // Reload current upload orders
        const response = await fetch(`/api/csv-results?csvUploadId=${currentUploadId}&shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          setCurrentUploadOrders(data.orders || []);
        }
      }
      
      setPendingOrderIds([]);
    } catch (error) {
      console.error('Error in bulk call:', error);
      alert('Error processing bulk call');
    } finally {
      setCallingOrders(false);
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
      } else {
        alert('Failed to load order details');
        setShowOrderDetails(false);
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error loading order details:', error);
      alert('Error loading order details');
      setShowOrderDetails(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const formatISTDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(date.getTime() + istOffset);
      
      return istDate.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  // Address management handlers
  const handleUpdateAddressInShopify = async (orderId, newAddress) => {
    if (!confirm('Are you sure you want to update the address in Shopify? This will change the actual order address.')) {
      return;
    }

    try {
      console.log('[RtoAnalysis] Updating address in Shopify:', { orderId, shop, newAddress });
      
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
        // Refresh order details
        if (selectedOrder) {
          handleShowOrderDetails(selectedOrder.orderId || selectedOrder.id);
        }
      } else {
        alert('❌ Failed to update address: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error updating address:', error);
      alert('❌ Error updating address: ' + error.message);
    }
  };

  const handleEditNewAddress = (callId, oldAddress, currentNewAddress) => {
    // Create address comparison/edit modal
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
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;
    
    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #202223; font-size: 18px; font-weight: 600;">Address Comparison</h3>
        <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6d7175; padding: 0; width: 24px; height: 24px;">&times;</button>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="border: 1px solid #e1e3e5; border-radius: 8px; padding: 16px; background: #f8f9fa;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-right: 8px;"></div>
            <h4 style="margin: 0; color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase;">Current Address</h4>
          </div>
          <div style="color: #202223; font-size: 14px; line-height: 1.5; word-wrap: break-word;">${oldAddress || 'N/A'}</div>
        </div>
        
        <div style="border: 1px solid #e1e3e5; border-radius: 8px; padding: 16px; background: #f0f8f0;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
            <h4 style="margin: 0; color: #10b981; font-size: 14px; font-weight: 600; text-transform: uppercase;">New Address</h4>
          </div>
          <textarea id="newAddressEdit" style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; line-height: 1.5; resize: vertical; font-family: inherit;">${currentNewAddress || ''}</textarea>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button onclick="this.closest('.modal-overlay').remove()" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; font-size: 14px; cursor: pointer;">Close</button>
        <button id="saveNewAddressBtn" style="padding: 8px 16px; border: none; background: #10b981; color: white; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500;">Save Changes</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Handle save button click
    const saveBtn = modalContent.querySelector('#saveNewAddressBtn');
    saveBtn.onclick = async () => {
      const textarea = modalContent.querySelector('#newAddressEdit');
      const newAddress = textarea.value.trim();
      
      if (!newAddress) {
        alert('Please enter a new address');
        return;
      }

      try {
        const response = await fetch('/api/update-csv-new-address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callId: callId,
            newAddress: newAddress
          })
        });

        const data = await response.json();
        
        if (data.success) {
          alert('✅ Address updated successfully!');
          modal.remove();
          // Refresh order details
          if (selectedOrder) {
            handleShowOrderDetails(selectedOrder.orderId || selectedOrder.id);
          }
        } else {
          alert('❌ Error updating address: ' + data.error);
        }
      } catch (error) {
        console.error('[RtoAnalysis] Error saving new address:', error);
        alert('❌ Error saving address: ' + error.message);
      }
    };
  };

  const handleRenameCsv = async (csvId, currentFilename) => {
    const newFilename = prompt('Enter new filename:', currentFilename);
    
    if (!newFilename || newFilename.trim() === '' || newFilename === currentFilename) {
      return;
    }

    try {
      const response = await fetch(`/api/csv/${csvId}/rename`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: newFilename.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ CSV upload renamed successfully');
        loadCsvHistory(currentPage);
      } else {
        alert('❌ Failed to rename CSV: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error renaming CSV:', error);
      alert('❌ Error renaming CSV upload: ' + error.message);
    }
  };

  const handleDeleteCsv = async (csvId) => {
    if (!confirm('Are you sure you want to delete this CSV upload? The usage data will be preserved.')) {
      return;
    }

    try {
      const response = await fetch(`/api/csv/${csvId}/delete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ CSV upload deleted successfully');
        loadCsvHistory(currentPage);
      } else {
        alert('❌ Failed to delete CSV: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error deleting CSV:', error);
      alert('❌ Error deleting CSV upload: ' + error.message);
    }
  };

  const handleDownloadAudio = (audioUrl, callId) => {
    try {
      console.log('[RtoAnalysis] Downloading audio from URL:', audioUrl);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `call_${callId || 'audio'}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('[RtoAnalysis] Error downloading audio:', error);
      alert('Error downloading audio: ' + error.message);
    }
  };

  const handleBulkUpdateAddresses = async (uploadId) => {
    if (!confirm('Are you sure you want to update ALL addresses with new addresses in Shopify? This will change the actual order addresses for all orders that have updated addresses.')) {
      return;
    }

    try {
      console.log('[RtoAnalysis] Starting bulk address update for upload:', uploadId);
      
      // Show loading indicator
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadId: uploadId,
          shop: shop
        })
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
        
        if (failed > 0 && data.results.errors) {
          console.error('[RtoAnalysis] Bulk update errors:', data.results.errors);
        }
        
        alert(message);
        
        // Refresh orders if viewing current upload
        if (uploadId === currentUploadId) {
          // Reload current upload orders
          const uploadResponse = await fetch(`/api/csv-results?csvUploadId=${uploadId}&shop=${encodeURIComponent(shop)}`, {
            credentials: 'include'
          });
          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            setCurrentUploadOrders(uploadData.orders || []);
          }
        } else {
          // Refresh expanded orders for this upload
          loadCsvOrders(uploadId);
        }
      } else {
        alert('❌ Bulk update failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error in bulk address update:', error);
      alert('❌ Error in bulk address update: ' + error.message);
    }
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
  
  const formatDateOld = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };
  
  const formatISTDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(date.getTime() + istOffset);
      
      return istDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getSentimentDisplay = (sentiment) => {
    if (!sentiment) return { filledBars: 2, totalBars: 4, label: 'Neutral', color: '#fef3c7', barColor: '#f59e0b' };
    
    const sentimentLower = sentiment.toLowerCase();
    
    // Map sentiment to display format with filled bars
    if (sentimentLower.includes('very happy') || sentimentLower.includes('very_happy') || sentimentLower === 'veryhappy') {
      return { filledBars: 4, totalBars: 4, label: 'Very happy', color: '#d1fae5', barColor: '#10b981' }; // All bars filled, green
    } else if (sentimentLower.includes('happy') || sentimentLower === 'positive') {
      return { filledBars: 3, totalBars: 4, label: 'Happy', color: '#dbeafe', barColor: '#3b82f6' }; // 3 bars filled, blue
    } else if (sentimentLower.includes('unhappy') || sentimentLower.includes('negative') || sentimentLower === 'sad' || sentimentLower === 'angry') {
      return { filledBars: 1, totalBars: 4, label: 'Unhappy', color: '#fce7f3', barColor: '#ec4899' }; // 1 bar filled, pink
    } else {
      return { filledBars: 2, totalBars: 4, label: 'Neutral', color: '#fef3c7', barColor: '#f59e0b' }; // 2 bars filled, yellow
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const toggleOrderSelection = (order) => {
    // Use orderId (Shopify ID) if available, otherwise fall back to id (database ID)
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
    const ordersToUse = filteredCurrentUploadOrders.length > 0 ? filteredCurrentUploadOrders : currentUploadOrders;
    if (selectAll) {
      setSelectedOrders(new Set());
      setSelectAll(false);
    } else {
      // Use orderId (Shopify ID) instead of id (database ID) for backend compatibility
      const allIds = ordersToUse.map(o => o.orderId || o.id);
      setSelectedOrders(new Set(allIds));
      setSelectAll(true);
    }
  };
  
  const clearSelection = () => {
    setSelectedOrders(new Set());
    setSelectAll(false);
  };
  
  const updateCurrentUploadCallCountFilter = () => {
    const fromInput = document.getElementById('currentUploadCallCountFrom');
    const toInput = document.getElementById('currentUploadCallCountTo');
    const resultDisplay = document.getElementById('currentUploadCallCountRangeResult');
    
    if (!fromInput || !toInput || !resultDisplay) return;
    
    const fromValue = fromInput.value;
    const toValue = toInput.value;
    
    // Parse values, default to min/max if empty
    const from = fromValue === '' ? 0 : parseInt(fromValue) || 0;
    const to = toValue === '' ? Infinity : parseInt(toValue) || Infinity;
    
    // Validate range
    if (from > to && toValue !== '') {
      resultDisplay.textContent = '0';
      resultDisplay.style.color = '#EF4444';
      setFilteredCurrentUploadOrders([]);
      return;
    } else {
      resultDisplay.style.color = '#4B5CFF';
    }
    
    // Filter orders in range (inclusive)
    const filtered = currentUploadOrders.filter(order => {
      const callCount = order.totalCallCount || 0;
      return callCount >= from && callCount <= to;
    });
    
    // Update count display
    resultDisplay.textContent = filtered.length;
    setFilteredCurrentUploadOrders(filtered);
  };
  
  const clearCurrentUploadCallCountFilter = () => {
    const fromInput = document.getElementById('currentUploadCallCountFrom');
    const toInput = document.getElementById('currentUploadCallCountTo');
    if (fromInput) fromInput.value = '';
    if (toInput) toInput.value = '';
    setFilteredCurrentUploadOrders([]);
    const resultDisplay = document.getElementById('currentUploadCallCountRangeResult');
    if (resultDisplay) {
      resultDisplay.textContent = currentUploadOrders.length;
      resultDisplay.style.color = '#4B5CFF';
    }
  };

  // Calculate dynamic stats based on script criteria
  const calculateDynamicStats = (uploadId) => {
    const stats = expandedStats[uploadId];
    const script = expandedScript[uploadId];
    
    if (!stats || !script) return null;

    // Use backend-mapped stats if available (from /api/csv-stats)
    const successCriteria = stats.successCriteria || script.successCriteria || [];
    const otherCriteria = stats.otherCriteria || script.otherCriteria || [];
    const successCounts = stats.successCounts || {};
    const otherCounts = stats.otherCounts || {};
    const disableUnder35 = (stats.script?.disableUnder35Retries === false) || (script.disableUnder35Retries === false);

    // Calculate totals for success and other criteria
    const totalSuccess = Object.values(successCounts).reduce((sum, count) => sum + (count || 0), 0);
    const totalOther = Object.values(otherCounts).reduce((sum, count) => sum + (count || 0), 0);
    
    // Get legacy stats (addressChange, cancellationRequest, handleManually)
    // Only use legacy stats if they're NOT already in dynamic criteria with counts
    const normalizeCriteria = (str) => str ? str.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '';
    
    // Check if legacy stats are already covered by dynamic criteria
    // We check both the criteria names AND if they have actual counts
    const allCriteriaNames = [...successCriteria, ...otherCriteria];
    const allCriteriaNormalized = allCriteriaNames.map(normalizeCriteria);
    
    // Check if any criteria matches legacy stat patterns AND has a count > 0
    // Use exact or very close matching to avoid false positives
    const addressChangeInCriteria = allCriteriaNames.some((criteriaName, idx) => {
      const normalized = allCriteriaNormalized[idx];
      const hasCount = (successCounts[criteriaName] || 0) > 0 || (otherCounts[criteriaName] || 0) > 0;
      if (!hasCount) return false;
      // Only match if criteria name is exactly "Address Change" or very close variations
      // This prevents false positives from criteria like "Address Extraction" or "Change Request"
      const legacyNormalized = 'addresschange';
      return normalized === legacyNormalized || 
             normalized === 'changeaddress' ||
             (normalized.startsWith(legacyNormalized) && normalized.length <= legacyNormalized.length + 2) ||
             (normalized.startsWith('changeaddress') && normalized.length <= 'changeaddress'.length + 2);
    });
    
    const cancellationInCriteria = allCriteriaNames.some((criteriaName, idx) => {
      const normalized = allCriteriaNormalized[idx];
      const hasCount = (successCounts[criteriaName] || 0) > 0 || (otherCounts[criteriaName] || 0) > 0;
      if (!hasCount) return false;
      // Only match if criteria name is very close to "Cancellation Request" or "Cancelled"
      return normalized === 'cancellationrequest' || 
             normalized === 'cancelled' ||
             normalized === 'cancellation' ||
             (normalized.includes('cancellation') && normalized.length <= 20);
    });
    
    const handleManuallyInCriteria = allCriteriaNames.some((criteriaName, idx) => {
      const normalized = allCriteriaNormalized[idx];
      const hasCount = (successCounts[criteriaName] || 0) > 0 || (otherCounts[criteriaName] || 0) > 0;
      if (!hasCount) return false;
      // Only match if criteria name is very close to "Handle Manually"
      return normalized === 'handlemanually' || 
             normalized === 'manuallyhandle' ||
             (normalized.includes('handlemanually') && normalized.length <= 15) ||
             (normalized.includes('manuallyhandle') && normalized.length <= 15);
    });
    
    // Only show legacy stats if they're not in dynamic criteria with counts
    const addressChange = (!addressChangeInCriteria && (stats.addressChange || 0)) || 0;
    const cancellationRequest = (!cancellationInCriteria && (stats.cancellationRequest || 0)) || 0;
    const handleManually = (!handleManuallyInCriteria && (stats.handleManually || 0)) || 0;
    
    // Calculate totals (use dynamic stats if available, otherwise fall back to legacy stats)
    // Include addressChange, cancellationRequest, handleManually in completedTotal only if not in criteria
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
    const pickupPercentage = (completedTotal + queuedTotal) > 0 
      ? Math.round((customerPickedUp / (completedTotal + queuedTotal)) * 100) 
      : 0;

    return {
      successCriteria,
      otherCriteria,
      successCounts,
      otherCounts,
      disableUnder35,
      // Legacy stats
      addressChange,
      cancellationRequest,
      handleManually,
      // Totals
      totalSuccess,
      totalOther,
      totalTerminations: (stats.under35sMaxRetries || 0) + (stats.notPickedUpMaxRetries || 0) + (stats.invalid || 0),
      totalOngoing: (stats.notCalledQueued || 0) + (stats.under35sQueued || 0) + (stats.notPickedUpQueued || 0),
      // Standard terminations
      earlyDisconnectMaxRetries: stats.under35sMaxRetries || 0,
      notPickedUpMaxRetries: stats.notPickedUpMaxRetries || 0,
      invalid: stats.invalid || 0,
      // Ongoing
      notCalledQueued: stats.notCalledQueued || 0,
      earlyDisconnectQueued: stats.under35sQueued || 0,
      notPickedUpQueued: stats.notPickedUpQueued || 0,
      // Totals
      totalOrders: stats.uploadedOrders || 0,
      completedTotal,
      queuedTotal,
      customerPickedUp: `${customerPickedUp} (${pickupPercentage}%)`,
      // Performance metrics
      avgDuration: stats.avgDuration || 0,
      conversionRate: stats.conversionRate || 0,
      overallConversionRate: `${totalSuccess}/${progress} (${overallConversionRate}%)`,
      totalConnected: stats.totalConnected || 0,
      ordersWithCalls: stats.ordersWithCalls || 0,
      ongoing: stats.ongoing || 0,
      callNotBooked: stats.callNotBooked || 0,
    };
  };

  // Format date for agent name (e.g., "9 Nov 25")
  const formatDateForAgent = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  // Handle Create RTO Agent button
  const handleCreateRtoAgent = (language = 'hinglish') => {
    const dateStr = formatDateForAgent();
    const agentName = `RTO analysis agent ${dateStr}`;
    
    // Pre-fill success criteria
    const successCriteria = [
      'delivery too late',
      'got somewhere else',
      'delivery boy didnt call',
      'didnt want anymore',
      'other reason - here we put reason in summary'
    ];
    
    // Pre-fill other criteria
    const otherCriteria = [
      'unclear reason',
      'user not responsive'
    ];
    
    // Pre-fill custom analysis prompt
    const customAnalysisPrompt = `Analyze the call to determine the RTO reason. The success criteria are: ${successCriteria.join(', ')}. The other criteria are: ${otherCriteria.join(', ')}. If the reason doesn't fall into any of these categories, use "other reason" and put the actual reason in the summary.`;
    
    // Pre-fill script based on language
    const hinglishScript = `Namaste, main ${agentName} se bol raha hoon. Aapka order RTO ho gaya hai, iska reason pata karna hai.

Pehle main aapko order details batata hoon:
- Order Number: {orderNumber}
- Customer Name: {customerName}
- Address: {customerAddress}

Ab main aapse reason puchta hoon:
Kya aapko delivery wale ka call aaya tha? Agar haan, to kya hua? Agar nahi, to kya reason hai?

Agar reason unclear hai, to main follow-up questions puchunga:
1. Kya delivery boy ne aapko call kiya tha?
2. Kya aapko order mil gaya ya nahi?
3. Kya aapko order chahiye tha ya cancel karna hai?
4. Koi aur reason hai to bataiye.

Please mujhe clear reason batayein.`;

    const englishScript = `Hello, this is ${agentName}. Your order has been RTO'd, and I need to find out the reason.

First, let me tell you the order details:
- Order Number: {orderNumber}
- Customer Name: {customerName}
- Address: {customerAddress}

Now I'll ask you about the reason:
Did the delivery person call you? If yes, what happened? If no, what's the reason?

If the reason is unclear, I'll ask follow-up questions:
1. Did the delivery boy call you?
2. Did you receive the order or not?
3. Did you want the order or want to cancel it?
4. Is there any other reason, please tell me.

Please give me a clear reason.`;

    const script = language === 'hinglish' ? hinglishScript : englishScript;
    
    // Navigate to playground with pre-filled data
    const params = new URLSearchParams({
      agent: 'new',
      name: agentName,
      successCriteria: JSON.stringify(successCriteria),
      otherCriteria: JSON.stringify(otherCriteria),
      customAnalysisPrompt: customAnalysisPrompt,
      script: script,
      useCustomAnalysis: 'true',
      language: language
    });
    
    navigate(`/playground?${params.toString()}${shop ? `&shop=${encodeURIComponent(shop)}` : ''}`);
  };

  // Load RTO analysis stats for charts
  const [rtoChartData, setRtoChartData] = useState(null);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const chartRef = React.useRef(null);
  const chartInstanceRef = React.useRef(null);

  // Sample data for bar chart
  const sampleRtoReasons = [
    { reason: 'Wrong address provided', percentage: 47 },
    { reason: 'Customer not available', percentage: 46 },
    { reason: 'Address not found', percentage: 44 },
    { reason: 'Customer refused delivery', percentage: 43 },
    { reason: 'Incomplete address', percentage: 41 },
    { reason: 'Customer moved', percentage: 39 },
    { reason: 'Phone number incorrect', percentage: 35 },
    { reason: 'Delivery location inaccessible', percentage: 34 },
    { reason: 'Customer requested reschedule', percentage: 33 },
    { reason: 'Other reasons', percentage: 28 }
  ];

  const loadRtoChartData = async () => {
    if (!shop) return;
    
    setLoadingCharts(true);
    try {
      // Get all RTO analysis uploads
      const response = await fetch(`/api/csv-history?shop=${encodeURIComponent(shop)}&page=1&limit=100&isRtoAnalysis=true`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.data.uploads) {
        const uploads = data.data.uploads;
        
        // Group by date and calculate reasons distribution
        const dateMap = {};
        const reasonsMap = {};
        
        uploads.forEach(upload => {
          const date = new Date(upload.createdAt).toISOString().split('T')[0];
          if (!dateMap[date]) {
            dateMap[date] = { date, total: 0, reasons: {} };
          }
          dateMap[date].total += upload.totalOrders || 0;
        });
        
        // Get stats for each upload to get reasons
        for (const upload of uploads) {
          try {
            const statsResponse = await fetch(`/api/csv-stats?csvUploadId=${upload.id}&shop=${encodeURIComponent(shop)}`, {
              credentials: 'include'
            });
            const statsData = await statsResponse.json();
            
            if (statsData.success && statsData.stats) {
              const stats = statsData.stats;
              const successCounts = stats.successCounts || {};
              
              Object.keys(successCounts).forEach(reason => {
                if (!reasonsMap[reason]) {
                  reasonsMap[reason] = 0;
                }
                reasonsMap[reason] += successCounts[reason] || 0;
              });
            }
          } catch (err) {
            console.error(`Error loading stats for upload ${upload.id}:`, err);
          }
        }
        
        setRtoChartData({
          dates: Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date)),
          reasons: reasonsMap
        });
      }
    } catch (error) {
      console.error('[RtoAnalysis] Error loading chart data:', error);
    } finally {
      setLoadingCharts(false);
    }
  };

  useEffect(() => {
    if (shop) {
      loadRtoChartData();
    }
  }, [shop]);

  // Render charts
  useEffect(() => {
    if (!rtoChartData || !chartRef.current) return;
    
    // Load Chart.js if not available
    if (typeof window.Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      script.onload = () => renderCharts();
      document.head.appendChild(script);
    } else {
      renderCharts();
    }
    
    function renderCharts() {
      if (!chartRef.current || typeof window.Chart === 'undefined') return;
      
      // Destroy existing chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      const { dates, reasons } = rtoChartData;
      
      if (dates.length === 0) return;
      
      // Create chart with dates and reasons distribution
      const labels = dates.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const datasets = [];
      
      // Add line for each reason
      const reasonKeys = Object.keys(reasons);
      const colors = ['#4B5CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      
      reasonKeys.forEach((reason, idx) => {
        datasets.push({
          label: reason,
          data: dates.map(d => {
            // For now, distribute evenly (in real implementation, would need per-upload stats)
            return Math.round((reasons[reason] || 0) / dates.length);
          }),
          borderColor: colors[idx % colors.length],
          backgroundColor: colors[idx % colors.length] + '20',
          tension: 0.4
        });
      });
      
      chartInstanceRef.current = new window.Chart(ctx, {
        type: dates.length === 1 ? 'bar' : 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
    
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [rtoChartData]);

  return (
    <div className="rto-analysis-container">
      {/* Minimal Header */}
      <div className="rto-header">
        <h1 className="rto-title">RTO Insights</h1>
        <div className="rto-header-actions">
          <input
            type="file"
            id="campaigns-csv-file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            className="rto-upload-btn"
            onClick={() => document.getElementById('campaigns-csv-file').click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload CSV
          </button>
        </div>
      </div>

      {/* RTO Reasons Analysis */}
      <div className="rto-card">
          <div className="rto-card-header">
            <h2 className="rto-card-title">RTO Reasons</h2>
            <label className="rto-sample-toggle">
              <input
                type="checkbox"
                checked={showSample}
                onChange={(e) => setShowSample(e.target.checked)}
                className="rto-sample-checkbox"
              />
              <span className="rto-sample-toggle-slider"></span>
              <span className="rto-sample-toggle-label">Sample</span>
            </label>
          </div>
          <div className="rto-card-body">
            {loadingCharts && !showSample ? (
              <div className="rto-empty-state">
                <div className="rto-loading-spinner"></div>
                <p className="rto-empty-text">Loading chart data...</p>
              </div>
            ) : showSample ? (
              <div className="rto-bar-chart-container">
                {sampleRtoReasons.map((item, index) => (
                  <div key={index} className="rto-bar-chart-item">
                    <div className="rto-bar-chart-label">{item.reason}</div>
                    <div className="rto-bar-chart-bar-wrapper">
                      <div 
                        className="rto-bar-chart-bar"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="rto-bar-chart-percentage">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            ) : !rtoChartData || rtoChartData.dates.length === 0 ? (
              <div className="rto-empty-state rto-empty-state-enhanced">
                <div className="rto-empty-illustration">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <h3 className="rto-empty-title">No Analysis Data</h3>
                <p className="rto-empty-description">
                  Upload a CSV file with RTO orders to start analyzing return reasons.
                  Track trends and identify patterns in customer returns.
                </p>
              <button
                  className="rto-btn rto-btn-primary"
                  onClick={() => handleCreateRtoAgent('hinglish')}
              >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create RTO Agent
              </button>
            </div>
            ) : (
              <div className="rto-chart-container">
                <canvas 
                  ref={chartRef}
                  style={{ width: '100%', height: '400px' }}
                ></canvas>
            </div>
          )}
        </div>
      </div>

      {/* Current Upload Orders Table */}
      {currentUploadOrders.length > 0 && (
        <div className="rto-card">
          <div className="rto-card-header">
            <h2 className="rto-card-title">Orders ({currentUploadOrders.length})</h2>
            <input
              type="text"
              className="rto-search-input"
              placeholder="Search orders..."
              value={currentUploadSearch}
              onChange={(e) => setCurrentUploadSearch(e.target.value)}
            />
          </div>
          <div className="rto-card-body">
          <div className="orders-table-container">
            {selectedOrders.size > 0 && (
            <div className="bulk-actions-panel">
              <div className="bulk-actions-content">
                <span className="selected-count">
                  {selectedOrders.size} orders selected
                </span>
                <div className="bulk-buttons">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleBulkCall(Array.from(selectedOrders))}
                    disabled={selectedOrders.size === 0}
                  >
                    Bulk AI Call
                  </button>
                  {currentUploadId && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleBulkUpdateAddresses(currentUploadId)}
                    >
                      Bulk Update Addresses
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={clearSelection}
                    disabled={selectedOrders.size === 0}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
            )}
            <table className="orders-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Total Calls</th>
                  <th>Status</th>
                  <th>Sentiment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Apply call count filter first
                  let ordersToShow = filteredCurrentUploadOrders.length > 0 ? filteredCurrentUploadOrders : currentUploadOrders;
                  
                  // Apply search filter
                  if (currentUploadSearch.trim()) {
                    const searchLower = currentUploadSearch.toLowerCase();
                    ordersToShow = ordersToShow.filter(order => {
                      const orderNumber = (order.orderNumber || order.id || '').toString().toLowerCase();
                      const customerName = (order.customerName || '').toLowerCase();
                      const phone = (order.customerPhone || '').toLowerCase();
                      const address = (order.customerAddress || '').toLowerCase();
                      return orderNumber.includes(searchLower) ||
                             customerName.includes(searchLower) ||
                             phone.includes(searchLower) ||
                             address.includes(searchLower);
                    });
                  }
                  
                  return ordersToShow.map(order => (
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
                    <td style={{ fontWeight: 600, color: '#202223' }}>
                      {order.orderNumber || order.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#202223' }}>
                        {order.customerName || 'N/A'}
                      </div>
                      {order.customerEmail && (
                        <div style={{ fontSize: '12px', color: '#6D7175' }}>
                          {order.customerEmail}
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#6D7175' }}>
                      {order.customerPhone || 'N/A'}
                    </td>
                    <td className="address-cell" style={{ position: 'relative' }}>
                      <div style={{ color: '#202223', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.customerAddress ? (order.customerAddress.length > 30 ? order.customerAddress.substring(0, 30) + '...' : order.customerAddress) : 'N/A'}
                      </div>
                      {order.calls && order.calls.some(call => call.newAddress) && (
                        <div style={{ color: '#50B83C', fontSize: '12px', marginTop: '4px' }}>
                          ✏️ Updated Address Available
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="call-count-badge" style={{ background: '#f5f5f5', color: '#202223', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
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
                        // Get sentiment from the latest call or order
                        const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
                        const sentiment = latestCall?.callSentiment || order.callSentiment || null;
                        const sentimentDisplay = getSentimentDisplay(sentiment);

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
                                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <button 
                                              className="btn btn-primary btn-sm"
                                              onClick={() => handleBulkCall([order.orderId || order.id])}
                                            >
                                              AI Call
                                            </button>
                                          </td>
                                        </tr>
                                        ));
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                                </div>
                            </div>
      )}


      {/* Script Selection Modal */}
      {showScriptModal && (
        <div className="modal-overlay" onClick={() => setShowScriptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk AI Call - {pendingOrderIds.length} Orders</h3>
              <button className="modal-close" onClick={() => setShowScriptModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Choose a script to use for the selected orders:</p>
              <div className="scripts-list">
                {scripts.length > 0 ? (
                  scripts.map(script => (
                    <div
                      key={script.id}
                      className="script-option"
                      onClick={() => handleSelectScript(script.id, script.name)}
                    >
                      <div className="script-name">{script.name}</div>
                      <div className="script-preview">
                        {script.content ? (script.content.substring(0, 100) + (script.content.length > 100 ? '...' : '')) : 'No content'}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#666' }}>
                    No scripts available. Please create a script first.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowScriptModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {callingOrders && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <h3>Processing Bulk AI Call</h3>
              <p>Setting {pendingOrderIds.length} orders in queue...</p>
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {loadingOrderDetails 
                  ? 'Loading...' 
                  : `Order Details - ${selectedOrder?.orderNumber || 'N/A'}`}
              </h3>
              <button className="modal-close" onClick={() => setShowOrderDetails(false)}>
                &times;
              </button>
            </div>
            {loadingOrderDetails ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner"></div>
              </div>
            ) : selectedOrder && (
              <div className="modal-body">
                <div className="order-info">
                  <div className="info-section">
                    <h4>Customer Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Name:</label>
                        <span>{selectedOrder.customerName || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Phone:</label>
                        <span>{selectedOrder.customerPhone || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Email:</label>
                        <span>{selectedOrder.customerEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <h4>Address Information</h4>
                    <div className="address-comparison">
                      <div className="address-item">
                        <label>Original Address:</label>
                        <div className="address-text">
                          {selectedOrder.customerAddress || 'N/A'}
                        </div>
                      </div>
                      {orderCalls.some(call => call.newAddress) && (
                        <div className="address-item">
                          <label>Updated Address:</label>
                          <div className="address-text updated">
                            {orderCalls.find(call => call.newAddress)?.newAddress || 'N/A'}
                          </div>
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEditNewAddress(
                                orderCalls.find(call => call.newAddress)?.id,
                                selectedOrder.customerAddress,
                                orderCalls.find(call => call.newAddress)?.newAddress
                              )}
                            >
                              Edit Address
                            </button>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateAddressInShopify(
                                selectedOrder.orderId || selectedOrder.id,
                                orderCalls.find(call => call.newAddress)?.newAddress
                              )}
                            >
                              Update in Shopify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="info-section">
                    <h4>Order Information</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Order Number:</label>
                        <span>{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="info-item">
                        <label>Amount:</label>
                        <span>
                          {selectedOrder.totalPrice 
                            ? `${selectedOrder.totalPrice} ${selectedOrder.currency || ''}` 
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Date:</label>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="info-item">
                        <label>Status:</label>
                        <span className="status-badge">
                          {getStatusText(selectedOrder.callStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="calls-section">
                  <h4>Call History ({orderCalls.length} calls)</h4>
                  {orderCalls.length > 0 ? (
                    <div className="calls-list">
                      {orderCalls.map((call, index) => (
                        <div key={call.id || index} className="call-item">
                          <div className="call-header">
                            <div className="call-info">
                              <div className="call-number">Call #{index + 1}</div>
                              <div className="call-meta">
                                <div className="call-date">
                                  {formatISTDateTime(call.createdAt || call.startedAt)}
                                </div>
                                <div className="call-duration">
                                  Duration: {call.callDuration ? call.callDuration + 's' : 'N/A'}
                                </div>
                              </div>
                            </div>
                            <div className="call-status">
                              <span className="status-badge">
                                {call.callStatus || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="call-content">
                            {call.callOutcomeCategory && (
                              <div className="call-row">
                                <div className="call-label">Outcome:</div>
                                <div className="call-value">{call.callOutcomeCategory}</div>
                              </div>
                            )}
                            
                            {call.callInterestScore && (
                              <div className="call-row">
                                <div className="call-label">Interest Score:</div>
                                <div className="call-value">{call.callInterestScore}</div>
                              </div>
                            )}
                            
                            {call.addressChangeRequested && (
                              <div className="call-row">
                                <div className="call-label">Address Change:</div>
                                <div className="call-value">Requested</div>
                              </div>
                            )}
                            
                            {call.newAddress && (
                              <div className="call-row">
                                <div className="call-label">New Address:</div>
                                <div className="call-value">{call.newAddress}</div>
                              </div>
                            )}
                            
                            {call.audioUrl && call.audioUrl.startsWith('https://') && (
                              <div className="call-audio">
                                <div className="call-label">Audio:</div>
                                <div className="call-value">
                                  <audio controls style={{ width: '100%', height: '40px', margin: '8px 0' }}>
                                    <source src={call.audioUrl} type="audio/mpeg" />
                                  </audio>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleDownloadAudio(call.audioUrl, call.callId || call.id)}
                                    style={{ marginTop: '8px', width: '100%' }}
                                  >
                                    📥 Download Audio
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {call.transcript && (
                              <div className="call-transcript">
                                <div className="call-label">Transcript:</div>
                                <div className="call-value">
                                  <div className="transcript-content">{call.transcript}</div>
                                </div>
                              </div>
                            )}
                            
                            {call.callSummary && (
                              <div className="call-summary">
                                <div className="call-label">Summary:</div>
                                <div className="call-value">
                                  <div className="summary-content">{call.callSummary}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-calls">
                      <p>No calls made for this order yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RtoAnalysis;
