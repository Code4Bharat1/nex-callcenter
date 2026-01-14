import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Pencil, Trash2, Table2, RefreshCw, Search, Info } from 'lucide-react';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import { parseTranscript } from '../utils/transcriptParser';
import RetryStatusBars from '../components/RetryStatusBars';
import './Campaigns.css';

const Campaigns = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  
  // Clips state
  const [clips, setClips] = useState([]);
  const [allClips, setAllClips] = useState([]);
  const [loadingClips, setLoadingClips] = useState(false);
  const [showAllClipsModal, setShowAllClipsModal] = useState(false);
  const [currentClipName, setCurrentClipName] = useState(null);
  
  // Campaign filter state
  const [campaignFilter, setCampaignFilter] = useState('all');
  
  // Upload info modal state
  const [showUploadInfoModal, setShowUploadInfoModal] = useState(false);
  const [selectedUploadInfo, setSelectedUploadInfo] = useState(null);

  // Add Orders to Store modal state
  const [showAddOrdersModal, setShowAddOrdersModal] = useState(false);
  const [selectedOrdersFile, setSelectedOrdersFile] = useState(null);
  const [selectedOrdersScript, setSelectedOrdersScript] = useState(null);
  const [uploadingOrders, setUploadingOrders] = useState(false);

  // Non-Campaign Orders state
  const [nonCampaignOrdersCount, setNonCampaignOrdersCount] = useState(null);
  const [loadingNonCampaignCount, setLoadingNonCampaignCount] = useState(false);
  const [nonCampaignOrdersByDay, setNonCampaignOrdersByDay] = useState([]);
  const [loadingNonCampaignByDay, setLoadingNonCampaignByDay] = useState(false);

  // Test Calls state
  const [testCallsByDay, setTestCallsByDay] = useState([]);
  const [loadingTestCallsByDay, setLoadingTestCallsByDay] = useState(false);
  const [testCsvUploads, setTestCsvUploads] = useState([]);
  const [loadingTestCsvUploads, setLoadingTestCsvUploads] = useState(false);

  // Auto call settings state
  const [autoCallSettings, setAutoCallSettings] = useState(null);
  const [loadingAutoCallSettings, setLoadingAutoCallSettings] = useState(false);

  // Call-wise stats state
  const [callWiseStats, setCallWiseStats] = useState({ data: [], labels: [] });
  const [loadingCallWiseStats, setLoadingCallWiseStats] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  // Create dropdown state
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  // Load scripts and history on mount
  useEffect(() => {
    if (shop) {
      loadScripts();
      loadCsvHistory(1);
      loadClips();
      loadNonCampaignOrdersCount();
      loadNonCampaignOrdersByDay();
      loadAutoCallSettings();
    }
  }, [shop]);

  // Reload clips when clips tab is selected
  useEffect(() => {
    if (shop && campaignFilter === 'clips') {
      loadClips();
    }
  }, [shop, campaignFilter]);

  // Reload test calls when test calls tab is selected
  useEffect(() => {
    if (shop && campaignFilter === 'test-calls') {
      loadTestCallsByDay();
      loadTestCsvUploads();
    }
  }, [shop, campaignFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreateDropdown && !event.target.closest('.create-button-wrapper')) {
        setShowCreateDropdown(false);
      }
    };

    if (showCreateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCreateDropdown]);

  const loadNonCampaignOrdersCount = async () => {
    if (!shop) return;
    
    setLoadingNonCampaignCount(true);
    try {
      const response = await fetch(`/api/non-campaign-orders?shop=${encodeURIComponent(shop)}&page=1&limit=1`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.pagination) {
        setNonCampaignOrdersCount(data.pagination.totalCount || 0);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading non-campaign orders count:', error);
    } finally {
      setLoadingNonCampaignCount(false);
    }
  };

  const loadNonCampaignOrdersByDay = async () => {
    if (!shop) return;
    
    setLoadingNonCampaignByDay(true);
    try {
      const response = await fetch(`/api/non-campaign-orders-by-day?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.dayGroups) {
        setNonCampaignOrdersByDay(data.dayGroups || []);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading non-campaign orders by day:', error);
      setNonCampaignOrdersByDay([]);
    } finally {
      setLoadingNonCampaignByDay(false);
    }
  };

  const loadScripts = async () => {
    try {
      const response = await api.getScripts(shop);
      const scriptsArray = response?.scripts || response || [];
      setScripts(scriptsArray);
    } catch (error) {
      console.error('[Campaigns] Error loading scripts:', error);
    }
  };

  const loadClips = async () => {
    if (!shop) return;
    
    setLoadingClips(true);
    try {
      const response = await fetch(`/api/clips/all?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setClips(data.clips || []);
      } else {
        console.error('[Campaigns] Failed to load clips:', data.error);
        setClips([]);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading clips:', error);
      setClips([]);
    } finally {
      setLoadingClips(false);
    }
  };

  const loadAllClips = async () => {
    if (!shop) return;
    
    try {
      const response = await fetch(`/api/clips/all?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAllClips(data.clips || []);
      } else {
        console.error('[Campaigns] Failed to load all clips:', data.error);
        setAllClips([]);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading all clips:', error);
      setAllClips([]);
    }
  };

  const loadAutoCallSettings = async () => {
    if (!shop) return;
    
    setLoadingAutoCallSettings(true);
    try {
      const response = await fetch(`/api/auto-call-settings?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAutoCallSettings(data.settings);
      } else {
        console.error('[Campaigns] Failed to load auto call settings:', data.error);
        setAutoCallSettings(null);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading auto call settings:', error);
      setAutoCallSettings(null);
    } finally {
      setLoadingAutoCallSettings(false);
    }
  };

  const loadCallWiseStats = async (campaignId) => {
    if (!shop || !campaignId) return;

    setLoadingCallWiseStats(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/call-wise-stats?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setCallWiseStats({ data: data.data || [], labels: data.labels || [] });
      } else {
        console.error('[Campaigns] Failed to load call-wise stats:', data.error);
        setCallWiseStats({ data: [], labels: [] });
      }
    } catch (error) {
      console.error('[Campaigns] Error loading call-wise stats:', error);
      setCallWiseStats({ data: [], labels: [] });
    } finally {
      setLoadingCallWiseStats(false);
    }
  };

  const loadTestCallsByDay = async () => {
    if (!shop) return;
    
    setLoadingTestCallsByDay(true);
    try {
      const response = await fetch(`/api/test-calls-by-day?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTestCallsByDay(data.dayGroups || []);
      } else {
        console.error('[Campaigns] Failed to load test calls:', data.error);
        setTestCallsByDay([]);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading test calls:', error);
      setTestCallsByDay([]);
    } finally {
      setLoadingTestCallsByDay(false);
    }
  };

  const loadTestCsvUploads = async () => {
    if (!shop) return;
    
    setLoadingTestCsvUploads(true);
    try {
      const response = await fetch(`/api/test-csv-uploads?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTestCsvUploads(data.csvUploads || []);
        console.log('[Campaigns] Loaded test CSV uploads:', data.csvUploads?.length || 0);
      } else {
        console.error('[Campaigns] Failed to load test CSV uploads:', data.error);
        setTestCsvUploads([]);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading test CSV uploads:', error);
      setTestCsvUploads([]);
    } finally {
      setLoadingTestCsvUploads(false);
    }
  };

  const handleLoadClipOrders = async (clipId) => {
    if (!shop) {
      console.error('[Campaigns] No shop found, cannot load clip orders');
      return;
    }
    
    console.log('[Campaigns] Loading clip orders, creating CSV upload:', { clipId, shop });
    
    try {
      // Get clip name first
      const clip = clips.find(c => c.id === clipId) || allClips.find(c => c.id === clipId);
      if (clip) {
        setCurrentClipName(clip.name);
      }
      
      // Create CSV upload from clip (so it appears in CSV history)
      const response = await fetch(`/api/clips/${clipId}/create-csv-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ shop })
      });
      
      console.log('[Campaigns] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Campaigns] Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Campaigns] Response data:', data);
      
      if (data.success) {
        console.log('[Campaigns] Clip converted to CSV upload:', data.csvUploadId);
        console.log('[Campaigns] Orders received:', data.orders?.length || 0);
        
        // Set as current upload orders (same as regular CSV upload)
        const newUploadId = data.csvUploadId;
        const orders = data.orders || [];
        
        setCurrentUploadId(newUploadId);
        setCurrentUploadOrders(orders);
        setFilteredCurrentUploadOrders([]); // Reset filter
        setCurrentUploadStats(null);
        setCurrentUploadScript(null);
        
        // Determine script from orders and load stats (same as regular CSV upload)
        if (orders.length > 0) {
          determineScriptFromOrders(newUploadId, orders);
          loadCsvStatsForCurrentUpload(newUploadId);
        }
        
        // Reload CSV history from page 1 to show the new upload (new uploads appear on first page)
        // Add small delay to ensure CSV upload is fully created
        setTimeout(() => {
          console.log('[Campaigns] Reloading CSV history to show new upload');
          loadCsvHistory(1);
        }, 500);
        
        // Scroll to orders section
        setTimeout(() => {
          const ordersSection = document.querySelector('.current-upload-section');
          if (ordersSection) {
            ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        alert('❌ Failed to create CSV upload from clip: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[Campaigns] Error loading clip orders:', error);
      alert('❌ Error loading clip orders: ' + error.message);
    }
  };

  const handleDeleteClip = async (clipId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
      return;
    }
    
    if (!shop) return;
    
    try {
      const response = await fetch(`/api/clips/${clipId}?shop=${encodeURIComponent(shop)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Clip deleted successfully');
        loadClips();
        if (showAllClipsModal) {
          loadAllClips();
        }
      } else {
        alert('❌ Error deleting clip: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[Campaigns] Error deleting clip:', error);
      alert('❌ Error deleting clip: ' + error.message);
    }
  };

  const handleShowAllClips = () => {
    setShowAllClipsModal(true);
    loadAllClips();
  };

  const loadCsvHistory = async (page = 1) => {
    if (!shop) return;
    
    setLoadingHistory(true);
    try {
      console.log('[Campaigns] Loading CSV history for shop:', shop, 'page:', page);
      const response = await fetch(`/api/csv-history?shop=${encodeURIComponent(shop)}&page=${page}&limit=10&isRtoAnalysis=false`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('[Campaigns] CSV history response:', data);
      
      if (data.success) {
        const uploads = data.data.uploads || [];
        console.log('[Campaigns] Setting CSV history with', uploads.length, 'uploads');
        console.log('[Campaigns] Upload IDs:', uploads.map(u => u.id));
        setCsvHistory(uploads);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      } else {
        console.error('[Campaigns] Failed to load CSV history:', data.error);
      }
    } catch (error) {
      console.error('[Campaigns] Error loading CSV history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-upload the file when selected
      await handleUploadWithFile(file);
    }
  };

  const handleUploadOrders = async () => {
    if (!selectedOrdersFile) {
      alert('Please select a CSV file');
      return;
    }

    if (!shop) {
      alert('Please select a store first');
      return;
    }

    setUploadingOrders(true);
    const formData = new FormData();
    formData.append('csvFile', selectedOrdersFile);
    formData.append('shop', shop);
    if (selectedOrdersScript) {
      formData.append('scriptId', selectedOrdersScript);
    }

    try {
      const response = await fetch(`/api/upload-orders?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Successfully uploaded ${data.created} orders${data.errors.length > 0 ? `\n⚠️ ${data.errors.length} errors occurred` : ''}`);
        setShowAddOrdersModal(false);
        setSelectedOrdersFile(null);
        setSelectedOrdersScript(null);
        // Reload CSV history to show new campaign
        if (shop) {
          await loadCsvHistory(1);
          // If csvUploadId is returned, we could optionally navigate to that campaign
          if (data.csvUploadId) {
            console.log(`✅ Created CSV upload campaign: ${data.csvUploadId}`);
          }
        }
      } else {
        alert(`❌ Failed to upload orders: ${data.error || 'Unknown error'}\n${data.errors?.length > 0 ? `Errors: ${data.errors.map(e => `Row ${e.row}: ${e.error}`).join('\n')}` : ''}`);
      }
    } catch (error) {
      console.error('[Campaigns] Error uploading orders:', error);
      alert('❌ Error uploading orders: ' + error.message);
    } finally {
      setUploadingOrders(false);
    }
  };

  const handleDownloadOrdersSample = () => {
    // Note: orderNumber is optional - if not provided, will be auto-generated with scalysis_ prefix
    const csvContent = 'customerPhone,customerName,customerAddress,totalPrice,currency,orderNumber\n9876543210,John Doe,123 Main St,1000,INR,\n9876543211,Jane Smith,456 Oak Ave,2000,INR,';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_orders.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUploadWithFile = async (file) => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    if (!shop) {
      alert('Please select a store first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('shop', shop);

    try {
      const response = await fetch(`/api/upload-csv?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        console.log('[Campaigns] CSV upload successful:', data);
        console.log('[Campaigns] CSV upload ID:', data.csvUploadId);
        console.log('[Campaigns] Orders received:', data.orders?.length || 0);
        
        // Reset file input
        setSelectedFile(null);
        const fileInput = document.getElementById('campaigns-csv-file-header');
        if (fileInput) fileInput.value = '';
        
        // Display orders immediately (like CSV upload page)
        const newUploadId = data.csvUploadId;
        const orders = data.orders || [];
        
        console.log('[Campaigns] Setting current upload orders:', orders.length);
        setCurrentUploadOrders(orders);
        setCurrentUploadId(newUploadId);
        setCurrentUploadStats(data.stats || null);
        setCurrentUploadScript(data.script || null);
        setCurrentClipName(null); // Reset clip name for regular CSV uploads
        
        // Reload CSV history to show the new upload
        await loadCsvHistory(1);
        
        alert('CSV uploaded successfully!');
      } else {
        alert(data.error || 'Failed to upload CSV');
      }
    } catch (error) {
      console.error('[Campaigns] Error uploading CSV:', error);
      alert('Error uploading CSV. Please try again.');
    } finally {
      setUploading(false);
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

    try {
      const response = await fetch(`/api/upload-csv?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        console.log('[Campaigns] CSV upload successful:', data);
        console.log('[Campaigns] CSV upload ID:', data.csvUploadId);
        console.log('[Campaigns] Orders received:', data.orders?.length || 0);
        console.log('[Campaigns] Full response data:', JSON.stringify(data, null, 2));
        
        // Reset file input
        setSelectedFile(null);
        const fileInput = document.getElementById('campaigns-csv-file');
        if (fileInput) fileInput.value = '';
        
        // Display orders immediately (like CSV upload page)
        const newUploadId = data.csvUploadId;
        const orders = data.orders || [];
        
        console.log('[Campaigns] Setting current upload orders:', orders.length);
        console.log('[Campaigns] First order sample:', orders[0]);
        
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
          console.log('[Campaigns] Orders to display:', orders.length);
          const ordersSection = document.querySelector('.current-upload-section');
          console.log('[Campaigns] Orders section element:', ordersSection);
          if (ordersSection) {
            ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            console.warn('[Campaigns] Orders section not found in DOM, retrying...');
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
      setSelectedCampaignId(null);
    } else {
      setExpandedUploadId(uploadId);
      setSelectedCampaignId(uploadId);
      // Load orders and stats when expanding
      if (!expandedOrders[uploadId]) {
        loadCsvOrders(uploadId);
      }
      // Load call-wise stats for this campaign
      loadCallWiseStats(uploadId);
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
      console.error(`[Campaigns] Error loading orders for ${uploadId}:`, error);
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
      console.error(`[Campaigns] Error loading stats for ${uploadId}:`, error);
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
      console.error(`[Campaigns] Error loading stats for current upload:`, error);
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
      console.error('[Campaigns] Error loading order details:', error);
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

  // Address management handlers
  const handleUpdateAddressInShopify = async (orderId, newAddress) => {
    if (!confirm('Are you sure you want to update the address in Shopify? This will change the actual order address.')) {
      return;
    }

    try {
      console.log('[Campaigns] Updating address in Shopify:', { orderId, shop, newAddress });
      
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
      console.error('[Campaigns] Error updating address:', error);
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
        console.error('[Campaigns] Error saving new address:', error);
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
      console.error('[Campaigns] Error renaming CSV:', error);
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
      console.error('[Campaigns] Error deleting CSV:', error);
      alert('❌ Error deleting CSV upload: ' + error.message);
    }
  };

  const handleDownloadAudio = (audioUrl, callId) => {
    try {
      console.log('[Campaigns] Downloading audio from URL:', audioUrl);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `call_${callId || 'audio'}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('[Campaigns] Error downloading audio:', error);
      alert('Error downloading audio: ' + error.message);
    }
  };

  const handleBulkUpdateAddresses = async (uploadId) => {
    if (!confirm('Are you sure you want to update ALL addresses with new addresses in Shopify? This will change the actual order addresses for all orders that have updated addresses.')) {
      return;
    }

    try {
      console.log('[Campaigns] Starting bulk address update for upload:', uploadId);
      
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
          console.error('[Campaigns] Bulk update errors:', data.results.errors);
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
      console.error('[Campaigns] Error in bulk address update:', error);
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

  // Get sentiment display with filled bars and label
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

  // Get campaign status indicator (active or finished)
  // Status is based on queued orders: if any orders are queued, it's "Active", otherwise "Completed"
  const getCampaignStatus = (upload) => {
    // Check if there are any queued orders
    const queuedOrders = upload.queuedOrders || 0;
    const isCompleted = queuedOrders === 0;
    
    if (isCompleted) {
      return { 
        isActive: false, 
        label: 'Completed', 
        dotColor: '#ef4444' // Red for completed
      };
    } else {
      return { 
        isActive: true, 
        label: 'Active', 
        dotColor: '#10b981' // Green for active
      };
    }
  };

  // Get status for day-based campaigns
  // A campaign is "Active" if there are any queued calls, otherwise "Completed"
  const getDayCampaignStatus = (dayGroup) => {
    // Check if there are any queued calls - if yes, campaign is still active
    const hasQueuedCalls = (dayGroup.queuedCalls || 0) > 0;
    
    if (hasQueuedCalls) {
      return {
        isActive: true,
        label: 'Active',
        dotColor: '#10b981'
      };
    } else {
      return {
        isActive: false,
        label: 'Completed',
        dotColor: '#ef4444'
      };
    }
  };

  // Filter campaigns based on the selected filter tab
  const filterCampaigns = (campaigns) => {
    if (campaignFilter === 'all') {
      return campaigns;
    } else if (campaignFilter === 'clips') {
      // For clips, we'll show clips in a separate section
      return [];
    } else if (campaignFilter === 'test-calls') {
      // For test calls, we'll show test calls in a separate section
      return [];
    } else if (campaignFilter === 'scheduled') {
      // Scheduled campaigns - for now, return empty as we don't have scheduled campaigns
      return [];
    } else if (campaignFilter === 'active') {
      return campaigns.filter(campaign => {
        if (campaign.type === 'day') {
          return getDayCampaignStatus(campaign.data).isActive;
        } else {
          return getCampaignStatus(campaign.data).isActive;
        }
      });
    } else if (campaignFilter === 'completed') {
      return campaigns.filter(campaign => {
        if (campaign.type === 'day') {
          return !getDayCampaignStatus(campaign.data).isActive;
        } else {
          return !getCampaignStatus(campaign.data).isActive;
        }
      });
    }
    return campaigns;
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

  return (
    <div className="campaigns-page-container">
      {/* Clean Header */}
      <div className="campaigns-page-header">
        <div className="campaigns-header-content">
          <div className="campaigns-title-section">
            <div className="campaigns-title-row">
              <h1 className="campaigns-page-title">Campaign</h1>
        <button 
                className="campaigns-btn-info-compact"
          onClick={() => {
                  alert('Campaigns help you organize and manage your call campaigns. Create clips, upload CSVs, and track their progress.');
                }}
                title="How it works"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
        </button>
      </div>

            {/* Filter Tabs */}
            <div className="campaigns-tabs-wrapper">
              <div className="campaigns-filter-tabs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'scheduled', label: 'Scheduled' },
                  { id: 'active', label: 'Active' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'clips', label: 'Clips' },
                  { id: 'test-calls', label: 'Test Calls' }
                ].map((tab) => {
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`campaigns-filter-tab ${campaignFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setCampaignFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
                    </div>
                    </div>
                    </div>
          <div className="campaigns-header-actions">
            {/* Auto Call Settings Indicator */}
            {autoCallSettings && autoCallSettings.autoCallEnabled && (
              <div 
                className="auto-call-indicator"
                title={
                  autoCallSettings.autoCallScriptName 
                    ? `Auto Call Enabled - Script: ${autoCallSettings.autoCallScriptName}`
                    : 'Auto Call Enabled - Using Default Script'
                }
                style={{ position: 'relative' }}
              >
                <img 
                  src="/images/Raycons Icons Pack (Community)/call-2198440.svg" 
                  alt={
                    autoCallSettings.autoCallScriptName 
                      ? `Auto Call Enabled - Script: ${autoCallSettings.autoCallScriptName}`
                      : 'Auto Call Enabled - Using Default Script'
                  }
                  title={
                    autoCallSettings.autoCallScriptName 
                      ? `Auto Call Enabled - Script: ${autoCallSettings.autoCallScriptName}`
                      : 'Auto Call Enabled - Using Default Script'
                  }
                  style={{ width: '20px', height: '20px', display: 'block' }}
                />
              </div>
            )}
            
            {/* Create Button with Dropdown */}
            <div className="create-button-wrapper">
              <button 
                className="campaigns-btn campaigns-btn-primary"
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Create
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px', transform: showCreateDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {showCreateDropdown && (
                <>
                  <div 
                    className="dropdown-overlay"
                    onClick={() => setShowCreateDropdown(false)}
                  />
                  <div className="create-dropdown-menu">
                    <button
                      className="dropdown-menu-item"
                      onClick={() => {
                        const fileInput = document.getElementById('campaigns-csv-file-header');
                        if (fileInput) {
                          fileInput.click();
                        }
                        setShowCreateDropdown(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>Upload CSV</span>
                    </button>
                    <button
                      className="dropdown-menu-item"
                      onClick={() => {
                        const csvContent = 'orderName\n#1001\n#1002\n#1003';
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sample_orders.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        setShowCreateDropdown(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>Download Sample CSV</span>
                    </button>
                    <button
                      className="dropdown-menu-item"
                      onClick={() => {
                        setShowAddOrdersModal(true);
                        setShowCreateDropdown(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      <span>Add Orders to Store</span>
                    </button>
                    <button
                      className="dropdown-menu-item"
                      onClick={() => {
                        handleDownloadOrdersSample();
                        setShowCreateDropdown(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>Download Sample</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <input
              type="file"
              id="campaigns-csv-file-header"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {/* Current Upload Orders Table (shown immediately after upload) */}
      {currentUploadOrders.length > 0 && (
        <div className="current-upload-section" style={{ marginTop: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>
              {currentClipName 
                ? `Orders from Clip: ${currentClipName} (${currentUploadOrders.length} orders)`
                : `Orders from Latest Upload (${currentUploadOrders.length} orders)`}
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search orders..."
                value={currentUploadSearch}
                onChange={(e) => setCurrentUploadSearch(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '300px'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <span style={{ fontSize: '14px', color: '#6D7175' }}>Call Count:</span>
                <input
                  id="currentUploadCallCountFrom"
                  type="number"
                  placeholder="From"
                  min="0"
                  onChange={updateCurrentUploadCallCountFilter}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '80px'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#6D7175' }}>-</span>
                <input
                  id="currentUploadCallCountTo"
                  type="number"
                  placeholder="To"
                  min="0"
                  onChange={updateCurrentUploadCallCountFilter}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '80px'
                  }}
                />
                <span id="currentUploadCallCountRangeResult" style={{ fontSize: '14px', fontWeight: 600, color: '#4B5CFF', minWidth: '30px', textAlign: 'center' }}>
                  {filteredCurrentUploadOrders.length > 0 ? filteredCurrentUploadOrders.length : currentUploadOrders.length}
                </span>
                {filteredCurrentUploadOrders.length > 0 && (
                  <button
                    onClick={clearCurrentUploadCallCountFilter}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #EF4444',
                      background: '#FFFFFF',
                      color: '#EF4444',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="orders-table-container">
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
                  <th>Amount</th>
                  <th>Total Calls</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Sentiment</th>
                  <th>Script</th>
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
                    key={order.id || order.orderId}
                    onClick={() => handleShowOrderDetails(order.orderId || order.id)}
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
                    <td>
                      {order.totalPrice ? `${order.totalPrice} ${order.currency || ''}` : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="call-count-badge" style={{ background: '#f5f5f5', color: '#202223', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                        {order.totalCallCount || 0}
                      </span>
                    </td>
                    <td>
                      {formatISTDate(order.createdAt)}
                    </td>
                    <td>
                      <span className={`address-score score-${Math.floor(order.onehotscore || 0)}`}>
                        {order.onehotscore || 'N/A'}
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
                    <td>
                      {order.script ? order.script.name : 'No Script'}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleBulkCall([order.orderId || order.id])}
                      >
                        AI Call
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowOrderDetails(order.orderId || order.id);
                        }}
                        style={{ marginLeft: '8px' }}
                      >
                        View Calls
                      </button>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV History Card - Hide when Clips filter is selected */}
      {campaignFilter !== 'clips' && (
        <div className="campaigns-card-unified">
          <div className="campaigns-section-header">
            <h2 className="campaigns-section-title">CSV Upload History</h2>
          <div className="campaigns-section-controls">
            <div className="campaigns-search-unified">
              <Search size={14} className="campaigns-search-icon-unified" />
            <input
              type="text"
                className="campaigns-input-unified"
              placeholder="Search by filename..."
              value={csvHistorySearch}
              onChange={(e) => setCsvHistorySearch(e.target.value)}
              />
            </div>
            <select
              className="campaigns-select-unified"
              value={csvHistoryStatusFilter}
              onChange={(e) => setCsvHistoryStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="uploaded">Uploaded</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Not Picked</option>
            </select>
            <button 
              className="campaigns-btn-unified campaigns-btn-icon-unified"
              onClick={() => loadCsvHistory(currentPage)}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="campaigns-card-body-unified">
        {loadingHistory ? (
          <div className="campaigns-loading-unified">Loading CSV history...</div>
        ) : csvHistory.length === 0 ? (
          <div className="campaigns-empty-unified">No CSV uploads found.</div>
        ) : (
          <div className="campaigns-table-wrapper-unified">
          <table className="csv-history-table-unified">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Total Orders</th>
                  <th style={{ textAlign: 'center' }}>Progress</th>
                  <th style={{ textAlign: 'center' }}>Speed</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Merge day-based campaigns with CSV campaigns and sort by date
                  const dayCampaigns = nonCampaignOrdersByDay.map(dayGroup => ({
                    type: 'day',
                    date: new Date(dayGroup.date),
                    data: dayGroup
                  }));
                  
                  const csvCampaigns = csvHistory.filter(upload => {
                    // Apply search filter
                    const searchLower = csvHistorySearch.toLowerCase();
                    const matchesSearch = !searchLower || 
                      (upload.filename && upload.filename.toLowerCase().includes(searchLower)) ||
                      (upload.shop && upload.shop.toLowerCase().includes(searchLower));
                    
                    // Apply status filter
                    const matchesStatus = csvHistoryStatusFilter === 'all' || 
                      (upload.status && upload.status.toLowerCase() === csvHistoryStatusFilter.toLowerCase());
                    
                    return matchesSearch && matchesStatus;
                  }).map(upload => ({
                    type: 'csv',
                    date: upload.createdAt ? new Date(upload.createdAt) : new Date(0),
                    data: upload
                  }));
                  
                  // Merge and sort by date (newest first)
                  let allCampaigns = [...dayCampaigns, ...csvCampaigns].sort((a, b) => {
                    return b.date - a.date; // Newest first
                  });
                  
                  // Apply campaign filter
                  allCampaigns = filterCampaigns(allCampaigns);
                  
                  if (loadingNonCampaignByDay || loadingHistory) {
                    return (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                          Loading...
                        </td>
                      </tr>
                    );
                  }
                  
                  if (allCampaigns.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                          No campaigns found
                        </td>
                      </tr>
                    );
                  }
                  
                  return allCampaigns.map((campaign) => {
                    if (campaign.type === 'day') {
                      const dayGroup = campaign.data;
                      // Check if this is today's campaign
                      const today = new Date();
                      const campaignDate = new Date(dayGroup.date);
                      const isToday = today.toDateString() === campaignDate.toDateString();
                      const statusLabel = isToday ? 'Ongoing' : 'Completed';
                      const statusColor = isToday ? '#10b981' : '#ef4444';
                      
                      return (
                        <tr 
                          key={`day-${dayGroup.date}`}
                          className="csv-row non-campaign-row"
                          onClick={() => navigate(`/non-campaign-orders?shop=${encodeURIComponent(shop)}&startDate=${dayGroup.startDate}&endDate=${dayGroup.endDate}`)}
                          style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        >
                          <td className="csv-table-cell-filename">
                            <div className="filename-compact" style={{ fontWeight: '600', color: '#1f2937' }}>
                              {dayGroup.displayName}
                            </div>
                            <div className="shop-name-compact" style={{ fontSize: '12px', color: '#6b7280' }}>
                              auto called orders
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="campaign-status-with-label">
                              <span 
                                className="campaign-status-dot" 
                                style={{ backgroundColor: statusColor }}
                              ></span>
                              <span className="campaign-status-text">{statusLabel}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {dayGroup.orderCount}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="progress-info">
                              {dayGroup.orderCount || 0}
                            </div>
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar"
                                style={{ 
                                  width: '100%',
                                  backgroundColor: isToday ? '#10b981' : '#ef4444'
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="campaign-speed-display" title={`${dayGroup.totalCalls || 0} total calls, ${dayGroup.pickedUpCalls || 0} picked up, ${dayGroup.confirmedOrders || 0} confirmed`}>
                              {dayGroup.confirmationRate || 0}%
                            </span>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                              {dayGroup.confirmedOrders || 0}/{dayGroup.pickedUpCalls || 0} confirmed
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="campaign-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/non-campaign-orders?shop=${encodeURIComponent(shop)}&startDate=${dayGroup.startDate}&endDate=${dayGroup.endDate}`);
                              }}
                              title={`View ${dayGroup.displayName} orders`}
                            >
                              <Table2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    } else {
                      const upload = campaign.data;
                      const isExpanded = expandedUploadId === upload.id;
                      const orders = expandedOrders[upload.id] || [];
                      const stats = expandedStats[upload.id];
                      const script = expandedScript[upload.id];
                      const dynamicStats = calculateDynamicStats(upload.id);
                      const isLoadingOrders = loadingOrders[upload.id];
                      const isLoadingStats = loadingStats[upload.id];

                      return (
                        <React.Fragment key={upload.id}>
                          <tr 
                            className="csv-row"
                            data-upload-id={upload.id}
                            onClick={() => navigate(`/campaigns/${upload.id}?shop=${encodeURIComponent(shop)}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="csv-table-cell-filename">
                              <div className="filename-compact" style={{ fontWeight: '600', color: '#1f2937' }}>
                                {upload.filename}
                              </div>
                              <div className="shop-name-compact" style={{ fontSize: '12px', color: '#6b7280' }}>
                                {upload.shop || 'N/A'}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {(() => {
                                const status = getCampaignStatus(upload);
                                return (
                                  <div className="campaign-status-with-label">
                                    <span 
                                      className="campaign-status-dot" 
                                      style={{ backgroundColor: status.dotColor }}
                                    ></span>
                                    <span className="campaign-status-text">{status.label}</span>
                                  </div>
                                );
                              })()}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                              {upload.totalOrders || 0}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="progress-info">
                                {upload.completed || 0} / {upload.totalOrders || 0}
                              </div>
                              <div className="progress-bar-container">
                                <div 
                                  className="progress-bar"
                                  style={{ 
                                    width: `${upload.progress || 0}%`,
                                    backgroundColor: (upload.queuedOrders || 0) === 0 ? '#ef4444' : '#10b981'
                                  }}
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {(() => {
                                let speed = '—';
                                if (upload.createdAt && upload.completed) {
                                  const createdAt = new Date(upload.createdAt);
                                  const now = new Date();
                                  const hoursElapsed = Math.max((now - createdAt) / (1000 * 60 * 60), 0.01);
                                  speed = Math.round((upload.completed || 0) / hoursElapsed);
                                }
                                return (
                                  <span className="campaign-speed-display" title={`${speed} orders/hour`}>
                                    {speed}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="csv-table-cell-actions-unified" onClick={(e) => e.stopPropagation()}>
                              <div className="campaigns-actions-group-unified">
                                <button 
                                  className="campaigns-btn-unified campaigns-btn-text-unified"
                                  onClick={() => {
                                    window.open(`/api/csv-zip?csvUploadId=${upload.id}&shop=${encodeURIComponent(shop)}`, '_blank');
                                  }}
                                  title="Download CSV"
                                >
                                  <Download size={14} />
                                </button>
                                <button 
                                  className="campaigns-btn-unified campaigns-btn-text-unified"
                                  onClick={() => handleRenameCsv(upload.id, upload.filename)}
                                  title="Rename"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  className="campaigns-btn-unified campaigns-btn-text-unified"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUploadInfo(upload);
                                    setShowUploadInfoModal(true);
                                  }}
                                  title="View Details"
                                >
                                  <Info size={14} />
                                </button>
                                <button 
                                  className="campaigns-btn-unified campaigns-btn-text-unified campaigns-btn-danger-unified"
                                  onClick={() => handleDeleteCsv(upload.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} style={{ padding: 0, backgroundColor: '#f9fafb' }}>
                                <div style={{ padding: '20px' }}>
                                  {isLoadingOrders || isLoadingStats || loadingCallWiseStats ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
                                  ) : (
                                    <div>
                                      {/* Call-wise Stats */}
                                      {callWiseStats.data.length > 0 && selectedCampaignId === upload.id && (
                                        <div style={{ marginBottom: '24px' }}>
                                          <RetryStatusBars 
                                            data={callWiseStats.data}
                                            labels={callWiseStats.labels}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }
                  });
                })()}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn-secondary"
              onClick={() => loadCsvHistory(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button 
              className="btn btn-secondary"
              onClick={() => loadCsvHistory(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </button>
          </div>
        )}
          </div>
        </div>
      )}

      {/* Test Calls Section - shown when test-calls tab is selected */}
      {campaignFilter === 'test-calls' && (
        <div className="campaigns-card-unified" style={{ marginTop: '32px' }}>
          <div className="campaigns-section-header">
            <h2 className="campaigns-section-title">Test Calls</h2>
            <div className="campaigns-section-controls">
              <button 
                className="campaigns-btn-unified campaigns-btn-icon-unified"
                onClick={() => {
                  loadTestCallsByDay();
                  loadTestCsvUploads();
                }}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div className="campaigns-card-body-unified">
            {(loadingTestCallsByDay || loadingTestCsvUploads) ? (
              <div className="campaigns-loading-unified">Loading test calls...</div>
            ) : (testCallsByDay.length === 0 && testCsvUploads.length === 0) ? (
              <div className="campaigns-empty-unified">No test calls found.</div>
            ) : (
              <div className="campaigns-table-container">
                <table className="campaigns-table">
                  <thead>
                    <tr>
                      <th>Filename / Date</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Test Orders</th>
                      <th style={{ textAlign: 'center' }}>Total Calls</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Show CSV uploads with test orders first */}
                    {testCsvUploads.map((upload) => {
                      const status = getCampaignStatus(upload);
                      return (
                        <tr 
                          key={`test-csv-${upload.id}`}
                          className="csv-row"
                          onClick={() => navigate(`/campaigns/${upload.id}?shop=${encodeURIComponent(shop)}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="csv-table-cell-filename">
                            <div className="filename-compact" style={{ fontWeight: '600', color: '#1f2937' }}>
                              {upload.filename}
                            </div>
                            <div className="shop-name-compact" style={{ fontSize: '12px', color: '#6b7280' }}>
                              test campaign
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="campaign-status-with-label">
                              <span 
                                className="campaign-status-dot" 
                                style={{ backgroundColor: status.dotColor }}
                              ></span>
                              <span className="campaign-status-text">{status.label}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {upload.testOrderCount || 0}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {upload.testCallsCount || 0}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="campaign-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/campaigns/${upload.id}?shop=${encodeURIComponent(shop)}`);
                              }}
                              title={`View ${upload.filename}`}
                            >
                              <Table2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Show day-grouped test calls */}
                    {testCallsByDay.map((dayGroup) => (
                      <tr 
                        key={`test-${dayGroup.date}`}
                        className="csv-row"
                        onClick={() => navigate(`/all-orders?shop=${encodeURIComponent(shop)}&isTestOrder=true&startDate=${dayGroup.startDate}&endDate=${dayGroup.endDate}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="csv-table-cell-filename">
                          <div className="filename-compact" style={{ fontWeight: '600', color: '#1f2937' }}>
                            {dayGroup.displayName}
                          </div>
                          <div className="shop-name-compact" style={{ fontSize: '12px', color: '#6b7280' }}>
                            test calls
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="campaign-status-with-label">
                            <span 
                              className="campaign-status-dot" 
                              style={{ backgroundColor: '#10b981' }}
                            ></span>
                            <span className="campaign-status-text">Active</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                          {dayGroup.orderCount}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {dayGroup.totalCalls || 0}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="campaign-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/all-orders?shop=${encodeURIComponent(shop)}&isTestOrder=true&startDate=${dayGroup.startDate}&endDate=${dayGroup.endDate}`);
                            }}
                            title={`View ${dayGroup.displayName} test calls`}
                          >
                            <Table2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clips Section - shown when clips tab is selected */}
      {campaignFilter === 'clips' && (
        <div className="campaigns-card-unified" style={{ marginTop: '32px' }}>
          <div className="campaigns-section-header">
            <h2 className="campaigns-section-title">Clips</h2>
            <div className="campaigns-section-controls">
              <button 
                className="campaigns-btn-unified campaigns-btn-icon-unified"
                onClick={() => loadClips()}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div className="campaigns-card-body-unified">
            {loadingClips ? (
              <div className="campaigns-loading-unified">Loading clips...</div>
            ) : clips.length === 0 ? (
              <div className="campaigns-empty-unified">No clips found. Create clips from the All Orders tab.</div>
            ) : (
              <div className="campaigns-clips-grid">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="campaigns-clip-card"
                    onClick={() => handleLoadClipOrders(clip.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1f2937' }}>
                          {clip.name}
                        </div>
                        {clip.description && (
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                            {clip.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id, e);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#EF4444',
                          padding: '4px',
                          borderRadius: '4px',
                          marginLeft: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                        title="Delete clip"
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '4px' }}>
                      {clip.orderCount || 0} orders
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Info Modal */}
      {showUploadInfoModal && selectedUploadInfo && (
        <div className="campaigns-modal-overlay" onClick={() => setShowUploadInfoModal(false)}>
          <div className="campaigns-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="campaigns-modal-header">
              <h3 className="campaigns-modal-title">Upload Details</h3>
              <button 
                className="campaigns-modal-close"
                onClick={() => setShowUploadInfoModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
                                    </div>
            <div className="campaigns-modal-body">
              {/* File Information Section */}
              <div className="campaigns-info-section">
                <h4 className="campaigns-info-section-title">File Information</h4>
                <div className="campaigns-info-grid-two-col">
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Filename</span>
                    <span className="campaigns-info-value">{selectedUploadInfo.filename || 'N/A'}</span>
                                    </div>
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Shop</span>
                    <span className="campaigns-info-value">{selectedUploadInfo.shop || 'N/A'}</span>
                                    </div>
                                    </div>
                                  </div>

              <div className="campaigns-info-divider"></div>

              {/* Status Information Section */}
              <div className="campaigns-info-section">
                <h4 className="campaigns-info-section-title">Status</h4>
                <div className="campaigns-info-grid-two-col">
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Status</span>
                    <span className="campaigns-info-value">
                      {(() => {
                        const status = getCampaignStatus(selectedUploadInfo);
                        return (
                          <span 
                            className="campaigns-status-badge"
                            style={{ 
                              backgroundColor: status.dotColor === '#10b981' ? '#ecfdf5' : '#fef2f2',
                              color: status.dotColor === '#10b981' ? '#059669' : '#dc2626'
                            }}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </span>
                                            </div>
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Upload Date</span>
                    <span className="campaigns-info-value">{formatDate(selectedUploadInfo.createdAt)}</span>
                                          </div>
                                      </div>
                                    </div>

              <div className="campaigns-info-divider"></div>

              {/* Progress Information Section */}
              <div className="campaigns-info-section">
                <h4 className="campaigns-info-section-title">Progress</h4>
                <div className="campaigns-info-grid-two-col">
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Total Orders</span>
                    <span className="campaigns-info-value campaigns-info-value-emphasis">{selectedUploadInfo.totalOrders || 0}</span>
                                          </div>
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Progress</span>
                    <span className="campaigns-info-value">
                      {selectedUploadInfo.completed || 0} / {selectedUploadInfo.total || selectedUploadInfo.totalOrders || 0}
                    </span>
                                        </div>
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Progress Percentage</span>
                    <span className="campaigns-info-value campaigns-info-value-emphasis">{selectedUploadInfo.progress || 0}%</span>
                                        </div>
                  <div className="campaigns-info-row">
                    <span className="campaigns-info-label">Speed</span>
                    <span className="campaigns-info-value">
                      {(() => {
                        let speed = 0;
                        if (selectedUploadInfo.createdAt && selectedUploadInfo.completed) {
                          const createdAt = new Date(selectedUploadInfo.createdAt);
                          const now = new Date();
                          const hoursElapsed = Math.max((now - createdAt) / (1000 * 60 * 60), 0.01);
                          speed = Math.round((selectedUploadInfo.completed || 0) / hoursElapsed);
                        }
                        return speed > 0 ? `${speed} orders/hour` : '—';
                      })()}
                    </span>
                                      </div>
                                    </div>
                                  </div>

              {(selectedUploadInfo.etaStatus || (selectedUploadInfo.eta && selectedUploadInfo.etaStatus !== 'completed')) && (
                <>
                  <div className="campaigns-info-divider"></div>
                  {/* System Information Section */}
                  <div className="campaigns-info-section">
                    <h4 className="campaigns-info-section-title">System Information</h4>
                    <div className="campaigns-info-grid-two-col">
                      {selectedUploadInfo.etaStatus && (
                        <div className="campaigns-info-row">
                          <span className="campaigns-info-label">ETA Status</span>
                          <span className="campaigns-info-value">{selectedUploadInfo.etaStatus}</span>
                                        </div>
                                      )}
                      {selectedUploadInfo.eta && selectedUploadInfo.etaStatus !== 'completed' && (
                        <div className="campaigns-info-row">
                          <span className="campaigns-info-label">Estimated Time</span>
                          <span className="campaigns-info-value">{selectedUploadInfo.eta}</span>
                                </div>
                              )}
                                            </div>
                                              </div>
                </>
              )}
                                            </div>
            <div className="campaigns-modal-footer">
                                            <button 
                className="campaigns-btn-unified campaigns-btn-primary-unified"
                onClick={() => setShowUploadInfoModal(false)}
                                            >
                Close
                                            </button>
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
              <Loading size="medium" />
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="campaigns-modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="campaigns-modal-content order-details-modal-wide" onClick={(e) => e.stopPropagation()}>
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

                {/* Address Information Section */}
                <div className="campaigns-info-section">
                  <h4 className="campaigns-info-section-title">Address Information</h4>
                  <div className="campaigns-info-grid-two-col">
                    <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                      <span className="campaigns-info-label">Current Address</span>
                      <span className="campaigns-info-value">{selectedOrder.customerAddress || 'N/A'}</span>
                    </div>
                    {orderCalls.some(call => call.newAddress) && (
                      <>
                        <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                          <span className="campaigns-info-label">Updated Address</span>
                          <span className="campaigns-info-value">{orderCalls.find(call => call.newAddress)?.newAddress || 'N/A'}</span>
                        </div>
                        <div className="campaigns-info-row" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                              className="campaigns-btn-unified campaigns-btn-secondary-unified"
                              onClick={() => handleEditNewAddress(
                                orderCalls.find(call => call.newAddress)?.id,
                                selectedOrder.customerAddress,
                                orderCalls.find(call => call.newAddress)?.newAddress
                              )}
                              style={{ padding: '8px 16px', fontSize: '13px' }}
                            >
                              Edit Address
                            </button>
                            <button
                              className="campaigns-btn-unified campaigns-btn-primary-unified"
                              onClick={() => handleUpdateAddressInShopify(
                                selectedOrder.orderId || selectedOrder.id,
                                orderCalls.find(call => call.newAddress)?.newAddress
                              )}
                              style={{ padding: '8px 16px', fontSize: '13px' }}
                            >
                              Update in Shopify
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="campaigns-info-divider"></div>

                {/* Order Information Section */}
                <div className="campaigns-info-section">
                  <h4 className="campaigns-info-section-title">Order Information</h4>
                  <div className="campaigns-info-grid-two-col">
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Order Number</span>
                      <span className="campaigns-info-value">#{selectedOrder.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Amount</span>
                      <span className="campaigns-info-value">
                        {selectedOrder.totalPrice 
                          ? `${selectedOrder.totalPrice} ${selectedOrder.currency || ''}` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Date</span>
                      <span className="campaigns-info-value">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="campaigns-info-row">
                      <span className="campaigns-info-label">Status</span>
                      <span className="campaigns-info-value">
                        <span 
                          className="campaigns-status-badge"
                          style={{ 
                            backgroundColor: '#fef2f2',
                            color: '#dc2626'
                          }}
                        >
                          {getStatusText(selectedOrder.callStatus)}
                        </span>
                      </span>
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
                              <span 
                                className="campaigns-status-badge"
                                style={{ 
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                  fontSize: '12px'
                                }}
                              >
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

                            {call.audioUrl && call.audioUrl.startsWith('https://') && (
                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <span className="campaigns-info-label" style={{ display: 'block', marginBottom: '8px' }}>Audio</span>
                                <audio controls style={{ width: '100%', height: '32px', marginBottom: '8px' }}>
                                  <source src={call.audioUrl} type="audio/mpeg" />
                                </audio>
                                <button
                                  className="campaigns-btn-unified campaigns-btn-secondary-unified"
                                  onClick={() => handleDownloadAudio(call.audioUrl, call.callId || call.id)}
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
                        <p style={{ margin: 0 }}>No calls made for this order yet.</p>
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

      {/* All Clips Modal */}
      {showAllClipsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>All Clips</h3>
              <button
                onClick={() => {
                  setShowAllClipsModal(false);
                  setAllClips([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}>
              {allClips.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  {allClips.map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => {
                        handleLoadClipOrders(clip.id);
                        setShowAllClipsModal(false);
                        setAllClips([]);
                      }}
                      style={{
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid #E5E7EB',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <button
                        onClick={(e) => handleDeleteClip(clip.id, e)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#EF4444',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        ×
                      </button>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', paddingRight: '24px' }}>
                        {clip.name}
                      </div>
                      {clip.description && (
                        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                          {clip.description}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        {clip.orderCount || 0} orders
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                        {clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                  No clips found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Orders to Store Modal */}
      {showAddOrdersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Add Orders to Store</h2>
              <button
                onClick={() => {
                  setShowAddOrdersModal(false);
                  setSelectedOrdersFile(null);
                  setSelectedOrdersScript(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedOrdersFile(e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                Required columns: customerPhone (10-14 digits), customerName, customerAddress, totalPrice, currency, orderNumber (optional)
              </p>
              <button
                onClick={handleDownloadOrdersSample}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Download Sample CSV
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
                Select Script (Optional - orders will be queued if selected)
              </label>
              <select
                value={selectedOrdersScript || ''}
                onChange={(e) => setSelectedOrdersScript(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">No script (orders will not be queued)</option>
                {scripts.map(script => (
                  <option key={script.id} value={script.id}>{script.name}</option>
                ))}
              </select>
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
                If a script is selected, orders will be automatically queued for calling
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddOrdersModal(false);
                  setSelectedOrdersFile(null);
                  setSelectedOrdersScript(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#374151'
                }}
                disabled={uploadingOrders}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadOrders}
                disabled={!selectedOrdersFile || uploadingOrders}
                style={{
                  padding: '10px 20px',
                  background: uploadingOrders ? '#9CA3AF' : '#2563EB',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: uploadingOrders ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: 500
                }}
              >
                {uploadingOrders ? 'Uploading...' : 'Upload Orders'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
