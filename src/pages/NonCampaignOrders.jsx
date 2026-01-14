import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Search, Download, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, Settings } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { api } from '../utils/api';
import Loading from '../components/Loading';
import { parseTranscript } from '../utils/transcriptParser';
import RetryStatusBars from '../components/RetryStatusBars';
import './CampaignDetails.css';
import './Campaigns.css';
import './Settings.css';

const NonCampaignOrders = ({ shop: shopProp }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  // Date filter state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalOrders: 0,
    pickedUpCalls: 0,
    pickedUpOrders: 0,
    confirmedOrders: 0,
    unclearOrders: 0,
    pickupRate: 0,
    confirmationRate: 0,
    unclearRate: 0
  });
  
  // Timeline data state
  const [timelineData, setTimelineData] = useState([]);
  
  // Call-wise stats state
  const [callWiseStats, setCallWiseStats] = useState({ data: [], labels: [] });
  const [loadingCallWiseStats, setLoadingCallWiseStats] = useState(false);
  
  // Settings state (for campaign outcomes)
  const [showCampaignSettings, setShowCampaignSettings] = useState(false);
  const [campaignOutcomes, setCampaignOutcomes] = useState([]);
  const [loadingCampaignOutcomes, setLoadingCampaignOutcomes] = useState(false);
  const [campaignRules, setCampaignRules] = useState([]);
  const [savingCampaignRules, setSavingCampaignRules] = useState(false);
  const [expandedOutcomes, setExpandedOutcomes] = useState(new Set());
  const [defaultRetrySettings, setDefaultRetrySettings] = useState({
    maxRetries: 3,
    retryIntervalMinutes: 60,
    autoCancelOnMaxRetries: false,
    allowedTimeStart: '09:00',
    allowedTimeEnd: '18:00',
    timezone: 'Asia/Kolkata',
    allowedDays: [1, 2, 3, 4, 5]
  });
  
  // Filter state
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
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Scripts for outcome display
  const [scripts, setScripts] = useState([]);
  
  // Order details modal state
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderCalls, setOrderCalls] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  // Tagging state
  const [showTagModal, setShowTagModal] = useState(false);
  const [taggingOrderIds, setTaggingOrderIds] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [tagging, setTagging] = useState(false);
  
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

  // Get URL params as strings for dependency tracking
  const urlStartDate = searchParams.get('startDate');
  const urlEndDate = searchParams.get('endDate');

  // Use a ref to track if we've initialized from URL to prevent double loading
  const initializedFromUrl = useRef(false);
  const hasUrlParams = !!(urlStartDate || urlEndDate);

  // Initialize date filters from URL params on mount and when URL changes
  useEffect(() => {
    if (shop) {
      console.log('[NonCampaignOrders] URL params effect:', { urlStartDate, urlEndDate, hasUrlParams });
      
      // Reset the initialization flag when URL params change
      if (hasUrlParams) {
        initializedFromUrl.current = false;
      }
      
      let newStartDate = null;
      let newEndDate = null;
      
      if (urlStartDate) {
        // Parse date string as local date (YYYY-MM-DD format)
        const [year, month, day] = urlStartDate.split('-').map(Number);
        newStartDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        console.log('[NonCampaignOrders] Parsed startDate:', newStartDate);
      }
      
      if (urlEndDate) {
        // Parse date string as local date (YYYY-MM-DD format)
        const [year, month, day] = urlEndDate.split('-').map(Number);
        newEndDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        console.log('[NonCampaignOrders] Parsed endDate:', newEndDate);
      }
      
      // Update dates - this will trigger the loadOrders useEffect
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      
      // Mark as initialized if we had URL params and now have dates
      if (hasUrlParams && (newStartDate || newEndDate)) {
        // Use setTimeout to ensure state is updated before marking as initialized
        setTimeout(() => {
          initializedFromUrl.current = true;
          console.log('[NonCampaignOrders] Marked as initialized from URL');
        }, 0);
      } else if (!hasUrlParams) {
        // If no URL params, mark as initialized immediately
        initializedFromUrl.current = true;
      }
      
      loadScripts();
      loadUserTags();
    }
  }, [shop, urlStartDate, urlEndDate, hasUrlParams]);

  // Load orders when shop or date filters change
  useEffect(() => {
    if (!shop) return;
    
    // If we have URL params, verify that dates match before loading
    if (hasUrlParams) {
      // Check if dates match URL params
      const startDateMatches = !urlStartDate || (startDate && 
        startDate.getFullYear() === parseInt(urlStartDate.split('-')[0]) &&
        startDate.getMonth() + 1 === parseInt(urlStartDate.split('-')[1]) &&
        startDate.getDate() === parseInt(urlStartDate.split('-')[2])
      );
      
      const endDateMatches = !urlEndDate || (endDate && 
        endDate.getFullYear() === parseInt(urlEndDate.split('-')[0]) &&
        endDate.getMonth() + 1 === parseInt(urlEndDate.split('-')[1]) &&
        endDate.getDate() === parseInt(urlEndDate.split('-')[2])
      );
      
      if (!startDateMatches || !endDateMatches) {
        console.log('[NonCampaignOrders] Waiting for dates to match URL params...', { 
          urlStartDate, 
          urlEndDate, 
          startDate, 
          endDate,
          startDateMatches,
          endDateMatches
        });
        return;
      }
    }
    
    console.log('[NonCampaignOrders] Loading orders with dates:', { startDate, endDate });
    isPageChangeRef.current = false;
    setCurrentPage(1);
    loadOrders(1);
  }, [shop, startDate, endDate, hasUrlParams, urlStartDate, urlEndDate]);

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

  // Use ref to prevent duplicate calls - MUST be declared before useEffect hooks that use them
  const loadingRef = useRef(false);
  const isPageChangeRef = useRef(false);

  const loadScripts = async () => {
    try {
      const response = await api.getScripts(shop);
      const scriptsArray = response?.scripts || response || [];
      setScripts(scriptsArray);
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  };

  const loadOrders = useCallback(async (page = 1) => {
    if (!shop || loadingRef.current) return;
    
    // If we have URL params but dates aren't set yet, don't load
    const hasUrlParams = !!(urlStartDate || urlEndDate);
    if (hasUrlParams) {
      const startDateMatches = !urlStartDate || (startDate && 
        startDate.getFullYear() === parseInt(urlStartDate.split('-')[0]) &&
        startDate.getMonth() + 1 === parseInt(urlStartDate.split('-')[1]) &&
        startDate.getDate() === parseInt(urlStartDate.split('-')[2])
      );
      
      const endDateMatches = !urlEndDate || (endDate && 
        endDate.getFullYear() === parseInt(urlEndDate.split('-')[0]) &&
        endDate.getMonth() + 1 === parseInt(urlEndDate.split('-')[1]) &&
        endDate.getDate() === parseInt(urlEndDate.split('-')[2])
      );
      
      if (!startDateMatches || !endDateMatches) {
        console.log('[NonCampaignOrders] loadOrders: Skipping - dates not initialized from URL yet', {
          urlStartDate,
          urlEndDate,
          startDate,
          endDate,
          startDateMatches,
          endDateMatches
        });
        return;
      }
    }
    
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        shop: shop,
        page: page.toString(),
        limit: '100'
      });
      
      // Validate and add date parameters
      // Format dates as YYYY-MM-DD in local timezone (not UTC)
      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const startDateStr = `${year}-${month}-${day}`;
        params.append('startDate', startDateStr);
        console.log('[NonCampaignOrders] Sending startDate to API:', startDateStr);
      }
      
      if (endDate) {
        // Validate that end date is not before start date
        if (startDate && endDate < startDate) {
          console.warn('End date cannot be before start date');
          setEndDate(null);
          loadingRef.current = false;
          return;
        }
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const endDateStr = `${year}-${month}-${day}`;
        params.append('endDate', endDateStr);
        console.log('[NonCampaignOrders] Sending endDate to API:', endDateStr);
      }
      
      console.log('[NonCampaignOrders] Loading orders with params:', params.toString(), 'startDate:', startDate, 'endDate:', endDate);
      const response = await fetch(`/api/non-campaign-orders?${params.toString()}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setPagination(data.pagination);
        // Only update currentPage if it's not a programmatic page change
        if (!isPageChangeRef.current) {
          setCurrentPage(page);
        }
        isPageChangeRef.current = false;
      } else {
        console.error('Failed to load orders:', data.error);
      }
    } catch (error) {
      console.error('Error loading non-campaign orders:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [shop, startDate, endDate, urlStartDate, urlEndDate]);

  // Load stats for all orders in date range (not paginated)
  const loadStats = useCallback(async () => {
    if (!shop) return;
    
    try {
      const params = new URLSearchParams({
        shop: shop
      });
      
      // Format dates as YYYY-MM-DD in local timezone (not UTC)
      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const startDateStr = `${year}-${month}-${day}`;
        params.append('startDate', startDateStr);
      }
      
      if (endDate) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const endDateStr = `${year}-${month}-${day}`;
        params.append('endDate', endDateStr);
      }
      
      const response = await fetch(`/api/non-campaign-orders-stats?${params.toString()}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats({
          totalCalls: data.stats.totalCalls || 0,
          totalOrders: data.stats.totalOrders || 0,
          pickedUpCalls: data.stats.pickedUpCalls || 0,
          pickedUpOrders: data.stats.pickedUpOrders || 0,
          confirmedOrders: data.stats.confirmedOrders || 0,
          unclearOrders: data.stats.unclearOrders || 0,
          pickupRate: data.stats.pickupRate || 0,
          confirmationRate: data.stats.confirmationRate || 0,
          unclearRate: data.stats.unclearRate || 0
        });
        setTimelineData(data.stats.timeline || []);
      } else {
        // Fallback to empty stats
        setStats({
          totalCalls: 0,
          totalOrders: 0,
          pickedUpCalls: 0,
          pickedUpOrders: 0,
          confirmedOrders: 0,
          unclearOrders: 0,
          pickupRate: 0,
          confirmationRate: 0,
          unclearRate: 0
        });
        setTimelineData([]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        totalCalls: 0,
        pickedUpCalls: 0,
        confirmedOrders: 0,
        unclearOrders: 0,
        pickupRate: 0,
        confirmationRate: 0,
        unclearRate: 0
      });
      setTimelineData([]);
    }
  }, [shop, startDate, endDate, urlStartDate, urlEndDate]);

  // Load call-wise stats for non-campaign orders
  const loadCallWiseStats = useCallback(async () => {
    if (!shop) return;

    setLoadingCallWiseStats(true);
    try {
      const params = new URLSearchParams({ shop });

      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        params.append('startDate', `${year}-${month}-${day}`);
      }

      if (endDate) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        params.append('endDate', `${year}-${month}-${day}`);
      }

      const response = await fetch(`/api/non-campaign-call-wise-stats?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setCallWiseStats({ data: data.data || [], labels: data.labels || [] });
      } else {
        setCallWiseStats({ data: [], labels: [] });
      }
    } catch (error) {
      console.error('Error loading call-wise stats:', error);
      setCallWiseStats({ data: [], labels: [] });
    } finally {
      setLoadingCallWiseStats(false);
    }
  }, [shop, startDate, endDate]);

  // Load call-wise stats when date filters change
  useEffect(() => {
    if (shop) {
      if ((urlStartDate || urlEndDate) && !initializedFromUrl.current) {
        if ((urlStartDate && !startDate) || (urlEndDate && !endDate)) {
          return;
        }
      }
      loadCallWiseStats();
    }
  }, [shop, startDate, endDate, loadCallWiseStats, urlStartDate, urlEndDate]);

  // Load stats when date filters change
  useEffect(() => {
    if (shop) {
      // Wait for URL initialization if needed
      if ((urlStartDate || urlEndDate) && !initializedFromUrl.current) {
        if ((urlStartDate && !startDate) || (urlEndDate && !endDate)) {
          return;
        }
      }
      loadStats();
    }
  }, [shop, startDate, endDate, loadStats, urlStartDate, urlEndDate]);

  // Reload when page changes (but not when dates change)
  // Note: We don't include loadOrders in dependencies to avoid re-triggering when dates change
  // The loadOrders function will use the latest startDate/endDate from closure
  useEffect(() => {
    if (shop && currentPage > 0 && !loadingRef.current) {
      isPageChangeRef.current = true;
      loadOrders(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, currentPage]);

  // Helper functions from CampaignDetails
  const getSentimentDisplay = (interestScore, transcriptLength = 0) => {
    if (interestScore === null || interestScore === undefined || interestScore === '') {
      return null;
    }
    
    const score = parseFloat(interestScore);
    if (isNaN(score)) {
      return null;
    }
    
    const TRANSCRIPT_THRESHOLD = 1400;
    
    if (score === 0) {
      return { filledBars: 2, totalBars: 5, label: 'Not Interested', color: '#fee2e2', barColor: '#ef4444' };
    }
    
    if (score >= 1 && score < 5) {
      if (transcriptLength < TRANSCRIPT_THRESHOLD) {
        return { filledBars: 3, totalBars: 5, label: 'Neutral', color: '#fef3c7', barColor: '#f59e0b' };
      } else {
        return { filledBars: 1, totalBars: 5, label: 'Angry', color: '#fee2e2', barColor: '#dc2626' };
      }
    }
    
    if (score >= 5 && score <= 10) {
      if (transcriptLength < TRANSCRIPT_THRESHOLD) {
        return { filledBars: 4, totalBars: 5, label: 'Interested', color: '#dbeafe', barColor: '#3b82f6' };
      } else {
        return { filledBars: 5, totalBars: 5, label: 'Very Happy', color: '#d1fae5', barColor: '#10b981' };
      }
    }
    
    return null;
  };

  const getStatusText = (status) => {
    if (!status) return 'Pending';
    
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
    
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const normalizeOutcome = (str) => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  const findMatchingCriteria = (outcomeCategory, criteriaList) => {
    if (!outcomeCategory || !criteriaList || criteriaList.length === 0) return null;
    const normalizedOutcome = normalizeOutcome(outcomeCategory);
    for (const criteria of criteriaList) {
      const normalizedCriteria = normalizeOutcome(criteria);
      if (normalizedOutcome.includes(normalizedCriteria) || normalizedCriteria.includes(normalizedOutcome)) {
        return criteria;
      }
    }
    return null;
  };

  const getOutcomeDisplay = (outcome, callDuration = null, order = null) => {
    if (!outcome || outcome === 'N/A') {
      return { text: 'N/A', color: null, borderColor: null };
    }
    
    const outcomeLower = outcome.toLowerCase();
    
    // Replace "failed" with "not picked" (case insensitive)
    let processedOutcome = outcome;
    if (outcomeLower.includes('failed')) {
      processedOutcome = outcome.replace(/failed/gi, 'not picked');
    }
    const processedOutcomeLower = processedOutcome.toLowerCase();
    
    // Check for special cases first
    if (processedOutcomeLower === 'unclear' || processedOutcomeLower.includes('unclear')) {
      return { text: 'unclear', color: '#dbeafe', borderColor: '#3b82f6' };
    }
    
    if (processedOutcomeLower === 'handle manually' || processedOutcomeLower.includes('handle manually')) {
      return { text: 'Special Request', color: '#f3e8ff', borderColor: '#9333ea' };
    }
    
    // Check for early disconnection (< 35 seconds)
    if (callDuration !== null && callDuration < 35) {
      return { text: 'Early Disconnection', color: '#fef3c7', borderColor: '#f59e0b' };
    }
    
    // Check against script criteria if order has script
    if (order && order.script) {
      const successMatch = findMatchingCriteria(processedOutcome, order.script.successCriteria || []);
      if (successMatch) {
        return { text: successMatch, color: '#d1fae5', borderColor: '#10b981' };
      }
      
      const otherMatch = findMatchingCriteria(processedOutcome, order.script.otherCriteria || []);
      if (otherMatch) {
        return { text: otherMatch, color: '#fee2e2', borderColor: '#ef4444' };
      }
    }
    
    // Default: return processed outcome as-is
    return { text: processedOutcome, color: '#f3f4f6', borderColor: '#9ca3af' };
  };

  const getCallOutcome = (order) => {
    const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
    return latestCall?.callOutcomeCategory || 'N/A';
  };

  // Settings functions (similar to CampaignDetails)
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

  const loadCampaignOutcomes = async () => {
    if (!shop) return;
    
    setLoadingCampaignOutcomes(true);
    try {
      // Use shop-only endpoint for non-campaign orders (we'll create this endpoint)
      const response = await fetch(`/api/non-campaign-outcomes?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setCampaignOutcomes(data.outcomes || []);
        // Load existing rules for non-campaign orders
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
    if (!shop) return;
    
    setSavingCampaignRules(true);
    try {
      const response = await fetch(`/api/non-campaign-rules?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
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

  const formatDateOnly = (dateString) => {
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

  const getCallDate = (order) => {
    // Get the date of the first/latest call
    const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
    if (latestCall?.createdAt || latestCall?.startedAt) {
      return latestCall.createdAt || latestCall.startedAt;
    }
    // Fallback to order creation date
    return order.createdAt;
  };


  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Serial Number',
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Phone',
      'Address',
      'Total Calls',
      'Status',
      'Sentiment',
      'Call Outcome'
    ];

    const rows = filteredOrders.map((order, index) => {
      const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
      const interestScore = latestCall?.callInterestScore ?? latestCall?.onehotscore ?? order.onehotscore ?? null;
      const transcriptLength = latestCall?.transcript ? latestCall.transcript.length : 0;
      const sentimentDisplay = getSentimentDisplay(interestScore, transcriptLength);
      const sentimentLabel = sentimentDisplay ? sentimentDisplay.label : 'N/A';
      const callOutcome = getCallOutcome(order);
      const callDuration = latestCall?.callDuration || latestCall?.durationSeconds || null;
      const outcomeDisplay = getOutcomeDisplay(callOutcome, callDuration, order);

      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        (currentPage - 1) * 100 + index + 1,
        escapeCSV(order.orderNumber || order.id),
        escapeCSV(order.customerName || 'N/A'),
        escapeCSV(order.customerEmail || 'N/A'),
        escapeCSV(order.customerPhone || 'N/A'),
        escapeCSV(order.customerAddress || 'N/A'),
        escapeCSV(order.totalCallCount || 0),
        escapeCSV(getStatusText(order.callStatus)),
        escapeCSV(sentimentLabel),
        escapeCSV(outcomeDisplay.text)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `non-campaign-orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter orders
  // Note: Date filtering is handled by the backend, so we don't filter by dates here
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

    // Total calls filter
    if (filterTotalCallsMin || filterTotalCallsMax) {
      const totalCalls = order.totalCallCount || 0;
      const min = filterTotalCallsMin ? parseInt(filterTotalCallsMin) : 0;
      const max = filterTotalCallsMax ? parseInt(filterTotalCallsMax) : Infinity;
      if (totalCalls < min || totalCalls > max) return false;
    }

    // Status filter
    if (!filterStatuses.has('all') && filterStatuses.size > 0) {
      const statusText = getStatusText(order.callStatus);
      const statusLower = statusText.toLowerCase();
      
      let matches = false;
      filterStatuses.forEach(filterStatus => {
        if (filterStatus === 'all') return;
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

    // Outcome filter
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
        aValue = aSentiment ? aSentiment.label.toLowerCase() : 'zzz';
        bValue = bSentiment ? bSentiment.label.toLowerCase() : 'zzz';
        break;
      case 'outcome':
        aValue = getCallOutcome(a).toLowerCase();
        bValue = getCallOutcome(b).toLowerCase();
        break;
      case 'date':
        aValue = getCallDate(a) ? new Date(getCallDate(a)).getTime() : 0;
        bValue = getCallDate(b) ? new Date(getCallDate(b)).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Stats are now loaded from API via loadStats function (removed local calculation)

  if (loading && orders.length === 0) {
    return (
      <div className="campaign-details-page">
        <div className="campaign-details-loading">Loading non-campaign orders...</div>
      </div>
    );
  }

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
              <h1 className="campaign-details-title">Test Calls Campaign</h1>
              <div className="campaign-details-meta-row">
                <span className="campaign-details-meta-text">{shop}</span>
                <span className="campaign-details-meta-separator">•</span>
                <span className="campaign-details-meta-text">
                  {pagination ? `${pagination.totalCount} orders` : 'Loading...'}
                </span>
              </div>
            </div>
            
            <div className="campaign-details-header-actions">
              <button 
                className="campaigns-btn-unified campaigns-btn-secondary-unified"
                onClick={async () => {
                  setShowCampaignSettings(true);
                  await loadDefaultRetrySettings();
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
                onClick={() => loadOrders(currentPage)}
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>Pickup Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{stats.pickupRate}%</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              {stats.pickedUpOrders ?? stats.pickedUpCalls} / {stats.totalOrders ?? stats.totalCalls} orders
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>Confirmation Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{stats.confirmationRate}%</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              {stats.confirmedOrders} / {stats.pickedUpCalls} picked up
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>Unclear Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{stats.unclearRate}%</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              {stats.unclearOrders} / {stats.pickedUpCalls} picked up
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>Total Calls</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>{stats.totalCalls}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              {stats.totalOrders || 0} orders
            </div>
          </div>
        </div>

        {/* Two Column Layout: Filters on Left, RetryStats on Right */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          {/* Left Column - Date Filter (60%) */}
          <div style={{ flex: 3 }}>
            <div className="campaign-details-filters-section" style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Start Date:</label>
                  <div style={{ position: 'relative' }}>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        setCurrentPage(1);
                      }}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={endDate || new Date()}
                      dateFormat="MMM dd, yyyy"
                      placeholderText="Select start date"
                      className="campaigns-input-unified"
                      style={{ paddingLeft: '36px' }}
                      wrapperClassName="date-picker-wrapper"
                    />
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>End Date:</label>
                  <div style={{ position: 'relative' }}>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => {
                        setEndDate(date);
                        setCurrentPage(1);
                      }}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      maxDate={new Date()}
                      dateFormat="MMM dd, yyyy"
                      placeholderText="Select end date"
                      className="campaigns-input-unified"
                      style={{ paddingLeft: '36px' }}
                      wrapperClassName="date-picker-wrapper"
                    />
                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                  </div>
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setCurrentPage(1);
                    }}
                    className="campaigns-btn-unified campaigns-btn-secondary-unified"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    Clear Dates
                  </button>
                )}
              </div>
              
              {/* Timeline View */}
              {timelineData.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Timeline</div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    overflowX: 'auto', 
                    paddingBottom: '8px',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {timelineData.map((entry, idx) => (
                      <div 
                        key={idx}
                        style={{
                          minWidth: '120px',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                          {formatDateOnly(entry.date)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          Calls: {entry.totalCalls}
                        </div>
                        <div style={{ fontSize: '11px', color: '#10b981' }}>
                          Picked: {entry.pickedUp}
                        </div>
                        <div style={{ fontSize: '11px', color: '#3b82f6' }}>
                          Confirmed: {entry.confirmed}
                        </div>
                        {entry.unclear > 0 && (
                          <div style={{ fontSize: '11px', color: '#f59e0b' }}>
                            Unclear: {entry.unclear}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Retry Stats (40%) */}
          <div style={{ flex: 2 }}>
            {callWiseStats.data.length > 0 && (
              <RetryStatusBars 
                data={callWiseStats.data}
                labels={callWiseStats.labels}
              />
            )}
          </div>
        </div>

        {/* Search and Filters Bar */}
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

          {/* Status Dropdown - Same as CampaignDetails */}
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
                    const uniqueStatuses = new Set();
                    orders.forEach(order => {
                      const statusText = getStatusText(order.callStatus);
                      if (statusText && statusText !== 'N/A') {
                        uniqueStatuses.add(statusText);
                      }
                    });
                    const sortedStatuses = Array.from(uniqueStatuses).sort();
                    
                    return sortedStatuses.map(status => {
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

          {/* Sentiment Dropdown - Same as CampaignDetails */}
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

          {/* Call Outcome Dropdown - Same as CampaignDetails */}
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
                    const outcomeMap = new Map();
                    orders.forEach(order => {
                      const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
                      const outcome = getCallOutcome(order);
                      if (outcome && outcome !== 'N/A') {
                        const callDuration = latestCall?.callDuration || latestCall?.durationSeconds || null;
                        const outcomeDisplay = getOutcomeDisplay(outcome, callDuration, order);
                        if (!outcomeMap.has(outcome)) {
                          outcomeMap.set(outcome, outcomeDisplay.text);
                        }
                      }
                    });
                    
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

        {/* Orders Table */}
        <div className="campaign-details-orders-section">
          <div className="campaigns-table-wrapper-unified">
            <table className="csv-history-table-unified">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', minWidth: '60px' }}>#</th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('date')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Date
                      {sortField === 'date' ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Script</th>
                  <th 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleSort('totalCalls')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Total Calls
                      {sortField === 'totalCalls' ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                  <th 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleSort('status')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Status
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                  <th 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleSort('sentiment')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Sentiment
                      {sortField === 'sentiment' ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                  <th 
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleSort('outcome')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      Call Outcome
                      {sortField === 'outcome' ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      {loading ? 'Loading orders...' : 'No orders found'}
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order, index) => {
                    const latestCall = order.calls && order.calls.length > 0 ? order.calls[0] : null;
                    const interestScore = latestCall?.callInterestScore ?? latestCall?.onehotscore ?? order.onehotscore ?? null;
                    const transcriptLength = latestCall?.transcript ? latestCall.transcript.length : 0;
                    const sentimentDisplay = getSentimentDisplay(interestScore, transcriptLength);
                    const callOutcome = getCallOutcome(order);
                    const callDuration = latestCall?.callDuration || latestCall?.durationSeconds || null;
                    const outcomeDisplay = getOutcomeDisplay(callOutcome, callDuration, order);

                    const callDate = getCallDate(order);
                    
                    return (
                      <tr 
                        key={order.id || order.orderId}
                        onClick={() => handleShowOrderDetails(order.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center', color: '#6b7280', fontWeight: 500 }}>
                          {(currentPage - 1) * 100 + index + 1}
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '13px' }}>
                          {formatDateOnly(callDate)}
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
                          {sentimentDisplay ? (
                            <span className="sentiment-tag" style={{ backgroundColor: sentimentDisplay.color }}>
                              <span className="sentiment-bars-container">
                                {Array.from({ length: sentimentDisplay.totalBars }).map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`sentiment-bar ${idx < sentimentDisplay.filledBars ? 'filled' : ''}`}
                                    style={{
                                      backgroundColor: idx < sentimentDisplay.filledBars ? sentimentDisplay.barColor : '#e5e7eb'
                                    }}
                                  ></span>
                                ))}
                              </span>
                              <span className="sentiment-label">{sentimentDisplay.label}</span>
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {outcomeDisplay.color ? (
                            <span 
                              className="sentiment-tag"
                              style={{
                                backgroundColor: outcomeDisplay.color,
                                borderColor: outcomeDisplay.borderColor,
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                display: 'inline-flex'
                              }}
                            >
                              {outcomeDisplay.text}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>{outcomeDisplay.text}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px',
              marginTop: '24px',
              padding: '16px'
            }}>
              <button
                onClick={() => {
                  if (pagination.hasPrev) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={!pagination.hasPrev}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: pagination.hasPrev ? 'white' : '#f3f4f6',
                  cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalCount} total orders)
              </span>
              
              <button
                onClick={() => {
                  if (pagination.hasNext) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={!pagination.hasNext}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: pagination.hasNext ? 'white' : '#f3f4f6',
                  cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

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
                      {selectedOrder.customerAddress && (
                        <div className="campaigns-info-row" style={{ gridColumn: '1 / -1' }}>
                          <span className="campaigns-info-label">Address</span>
                          <span className="campaigns-info-value">{selectedOrder.customerAddress}</span>
                        </div>
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
        {showCampaignSettings && (
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

                {/* Load Outcomes Section */}
                <div className="profile-detail-section">
                  <div className="profile-detail-box">
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Call Outcomes</span>
                        <span className="profile-detail-hint">Load unique call outcomes from test call campaign</span>
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
                        Click "Load Outcomes" to see unique call outcomes from test call campaign
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

export default NonCampaignOrders;

