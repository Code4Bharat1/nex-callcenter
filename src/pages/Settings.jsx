import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { SkeletonSettingsCards } from '../components/SkeletonLoader';
import './Settings.css';
import './Info.css';

const Settings = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  
  const [userProfile, setUserProfile] = useState({ email: '', name: '', avatar: '', phone: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [retrySettings, setRetrySettings] = useState({
    maxRetries: 3,
    retryIntervalMinutes: 60,
    autoCancelOnMaxRetries: false,
    maxOutcomeRetries: null,
    allowedTimeStart: '09:00',
    allowedTimeEnd: '18:00',
    timezone: 'Asia/Kolkata',
    allowedDays: [1, 2, 3, 4, 5]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [activeView, setActiveView] = useState('cards'); // 'cards' or specific card view
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [knowledgeBooks, setKnowledgeBooks] = useState([]);
  const [showKnowledgeBookForm, setShowKnowledgeBookForm] = useState(false);
  const [editingKnowledgeBookId, setEditingKnowledgeBookId] = useState(null);
  const [knowledgeBookFormData, setKnowledgeBookFormData] = useState({
    name: '',
    description: '',
    content: '',
    websiteLink: '',
    extraContent: ''
  });
  const [isFetchingWebsite, setIsFetchingWebsite] = useState(false);
  const [channels, setChannels] = useState(() => {
    // Initialize from localStorage or default to 1
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userChannels');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  const [shiftTime, setShiftTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userShiftTime');
      return saved ? parseInt(saved) : 8;
    }
    return 8;
  });
  const [talkTime, setTalkTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userTalkTime');
      return saved ? parseInt(saved) : 120;
    }
    return 120;
  });
  const [autoCallSettings, setAutoCallSettings] = useState({
    autoCallEnabled: false,
    autoCallScriptId: null
  });

  // Inbound Call Settings
  const [inboundSettings, setInboundSettings] = useState({
    inboundEnabled: false,
    phoneNumber: '',
    defaultInboundScriptId: null,
    inboundLookback: 24 // default to 24 hours
  });
    // Fetch inbound settings
    const loadInboundSettings = async () => {
      if (!shop) return;
      try {
        const response = await window.fetch(`/api/user-retry-settings?shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.settings) {
          setInboundSettings({
            inboundEnabled: data.settings.inboundEnabled || false,
            phoneNumber: data.settings.phoneNumber || '',
            defaultInboundScriptId: data.settings.defaultInboundScriptId || null,
            inboundLookback: data.settings.inboundLookback !== undefined && data.settings.inboundLookback !== null ? data.settings.inboundLookback : 24
          });
        }
      } catch (err) {
        // Silent fail
      }
    };

    // Save inbound settings
    const saveInboundSettings = async () => {
      try {
        setSaving(true);
        const response = await window.fetch(`/api/user-retry-settings?shop=${encodeURIComponent(shop)}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop,
            settings: {
              inboundEnabled: inboundSettings.inboundEnabled,
              phoneNumber: inboundSettings.phoneNumber,
              defaultInboundScriptId: inboundSettings.defaultInboundScriptId,
              inboundLookback: inboundSettings.inboundLookback
            }
          })
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to save inbound settings');
        }
        setStatusMessage({ type: 'success', text: 'Inbound settings saved successfully' });
      } catch (error) {
        setStatusMessage({ type: 'error', text: error.message || 'Failed to save inbound settings' });
      } finally {
        setSaving(false);
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      }
    };
  const [googleSheetsSettings, setGoogleSheetsSettings] = useState({
    googleSheetsEnabled: false,
    googleSheetsUrl: '',
    googleSheetsPhoneColumn: '',
    googleSheetsNameColumn: '',
    googleSheetsAutoQueue: false,
    googleSheetsScriptId: null,
    googleSheetsKnowledgeColumns: [] // Array of {column: 'C', title: 'interest'}
  });
  const [scripts, setScripts] = useState([]);
  const [accountSettings, setAccountSettings] = useState({
    accountType: 'standard',
    freeTokenLimit: 10000,
    remainingFreeTokens: 10000
  });
  // Account Health Metrics State
  const [accountHealthMetrics, setAccountHealthMetrics] = useState({
    status: null, // Will be set from API
    speedOrdersPerHour: 0,
    inQueue: 0
  });
  const [accountHealthLoading, setAccountHealthLoading] = useState(false);
  const [callsPerHourData, setCallsPerHourData] = useState([]);
  const [logsViewType, setLogsViewType] = useState('time-based'); // 'time-based' or 'calls-based'
  const [logsPage, setLogsPage] = useState(1);
  const logsPerPage = 10;

  // App Info state
  const [infoSearchQuery, setInfoSearchQuery] = useState('');
  const [activeInfoSection, setActiveInfoSection] = useState('script-variables');
  
  // Widget visibility state - disabled by default for all accounts
  const [floatingWidgetVisible, setFloatingWidgetVisible] = useState(() => {
    const saved = localStorage.getItem('floatingWidgetVisible');
    return saved !== null ? saved === 'true' : false;
  });

  // Global settings search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Custom Campaign Rules state
  const [customCampaignRules, setCustomCampaignRules] = useState([]); // Array of {scriptId, scriptName, rules: [{outcome, enabled, retrySettings}]}
  const [loadingCampaignRules, setLoadingCampaignRules] = useState(false);
  const [campaignOutcomes, setCampaignOutcomes] = useState({}); // {scriptId: [outcomes]}
  const [loadingOutcomes, setLoadingOutcomes] = useState({});
  
  // Email Updates state
  const [emailUpdateSettings, setEmailUpdateSettings] = useState({
    enabled: false,
    email: '',
    dailySummaryEmailTime: '18:00'
  });
  
  // Channel Status state
  const [channelStatus, setChannelStatus] = useState({
    channels: 1,
    shopifyOrdersPerHour: 0,
    callsInitiatedPerHour: 0,
    loading: false
  });

  // Plan state
  const [currentPlan, setCurrentPlan] = useState('base'); // 'base', 'pro', 'pro-plus', 'enterprise'
  const [expandedPlanCard, setExpandedPlanCard] = useState(null); // Which plan card is currently expanded (null = none, or plan name)
  
  // Plan usage tracking state
  const [planUsageData, setPlanUsageData] = useState(null);
  const [planUsageLoading, setPlanUsageLoading] = useState(false);
  const [usageDateFilter, setUsageDateFilter] = useState('lifetime'); // 'today', 'lifetime', or 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // FAQ accordion state for Channel Status
  const [expandedFAQ, setExpandedFAQ] = useState(null); // Which FAQ item is expanded (null = none, or index)
  
  const infoSections = {
    'script-variables': {
      title: 'Script Variables',
      content: `Script variables allow you to personalize your call scripts with dynamic information from each order. Use these variables in your script content, and they will be automatically replaced with actual order data when making calls.

Available Variables:
• [ORDER_NUMBER] - The order number (e.g., #1038)
• [ORDER_AMOUNT] - The total order amount with currency
• [CUSTOMER_NAME] - The customer's full name
• [CUSTOMER_ADDRESS] - The complete delivery address
• [DELIVERY_DATE] - The expected or actual delivery date

Usage Example:
"Hello [CUSTOMER_NAME], this is regarding your order [ORDER_NUMBER] for [ORDER_AMOUNT]. We wanted to confirm your delivery address: [CUSTOMER_ADDRESS]."

The system will automatically replace these variables with the actual values from the order when the call is made.`
    },
    'clone-voice': {
      title: 'How to Mirror Your Voice',
      content: `Voice cloning allows you to create a custom AI voice that sounds like you. This feature uses advanced AI technology to replicate your voice characteristics.

Steps to Clone Your Voice:

1. Navigate to the Clone Voice page
2. Choose your input method:
   - Record directly using your microphone
   - Upload an audio file (WAV, MP3, or WebM format)

3. For Recording:
   - Click "Start Recording" and speak clearly
   - Read the sample text provided or use your own
   - Click "Stop Recording" when finished
   - Minimum recommended: 10-15 seconds of clear audio

4. For File Upload:
   - Click "Upload Audio File"
   - Select a high-quality audio file
   - Ensure the audio is clear with minimal background noise

5. Review Your Audio:
   - Listen to the recording/upload
   - Use the waveform to select specific portions if needed
   - Adjust noise suppression if necessary

6. Enter Voice Details:
   - Voice Name: Give your cloned voice a name
   - Description: Optional description
   - Language: Select the primary language

7. Click "Clone" to create your voice
   - Processing typically takes 1-2 minutes
   - You'll receive a notification when complete

Best Practices:
• Use a quiet environment with minimal background noise
• Speak clearly and at a normal pace
• Ensure good microphone quality
• Record at least 10-15 seconds for best results
• Use consistent tone and volume throughout

Your cloned voice will be available in the Voices tab and can be assigned to any agent.`
    }
  };

  // Filtered content for App Info - moved to top level to fix hooks violation
  const filteredInfoContent = useMemo(() => {
    if (!infoSections[activeInfoSection]) return '';
    if (!infoSearchQuery.trim()) {
      return infoSections[activeInfoSection].content;
    }
    
    const query = infoSearchQuery.toLowerCase();
    const content = infoSections[activeInfoSection].content;
    const lines = content.split('\n');
    
    return lines.map(line => {
      if (line.toLowerCase().includes(query)) {
        return `**${line}**`;
      }
      return line;
    }).join('\n');
  }, [infoSearchQuery, activeInfoSection]);

  // Phone Numbers state
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [phoneNumberStats, setPhoneNumberStats] = useState({}); // { phoneNumber: { calls: 0, type: 'landline', region: 'Jammu' } }

  // Integrations state
  const [connected, setConnected] = useState(false);
  const [shopData, setShopData] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    shopDomain: '',
    clientId: '',
    clientSecret: ''
  });

  // NimbusPost state
  const [nimbuspostConnected, setNimbuspostConnected] = useState(false);
  const [nimbuspostConnecting, setNimbuspostConnecting] = useState(false);
  const [nimbuspostError, setNimbuspostError] = useState('');
  const [nimbuspostFormData, setNimbuspostFormData] = useState({
    email: '',
    password: ''
  });

  // Shiprocket state
  const [shiprocketConnected, setShiprocketConnected] = useState(false);
  const [shiprocketConnecting, setShiprocketConnecting] = useState(false);
  const [shiprocketError, setShiprocketError] = useState('');
  const [shiprocketFormData, setShiprocketFormData] = useState({
    email: '',
    password: ''
  });

  // NDR Integration state
  const [selectedNDRProvider, setSelectedNDRProvider] = useState(null); // 'nimbuspost' or 'shiprocket'

  useEffect(() => {
    loadSettings();
    loadInboundSettings();
    if (shop) {
      loadKnowledgeBooks();
      loadPhoneNumbers();
      loadTotalCalls();
      checkConnectionStatus();
      checkNimbuspostConnection();
      checkShiprocketConnection();
    }
    // Handle card parameter from URL to open specific card view
    const cardParam = searchParams.get('card');
    if (cardParam) {
      console.log('🔍 Opening card from URL parameter:', cardParam);
      setSelectedCard(cardParam);
      setActiveView(cardParam);
    }
    // Handle pre-filled values from TourSetup (fromSetup=true)
    const fromSetup = searchParams.get('fromSetup');
    const shopParam = searchParams.get('shop');
    const clientIdParam = searchParams.get('clientId');
    const clientSecretParam = searchParams.get('clientSecret');
    if (fromSetup === 'true' && (shopParam || clientIdParam || clientSecretParam)) {
      console.log('🔍 Pre-filling Shopify connection data from TourSetup:', { shopParam, hasClientId: !!clientIdParam, hasClientSecret: !!clientSecretParam });
      setFormData({
        shopDomain: shopParam || '',
        clientId: clientIdParam || '',
        clientSecret: clientSecretParam || ''
      });
    }
  }, [shop, searchParams]);

  // Set expanded plan card to current plan when plan view is opened
  useEffect(() => {
    if (selectedCard === 'plan' && currentPlan && expandedPlanCard === null) {
      setExpandedPlanCard(currentPlan);
    }
  }, [selectedCard, currentPlan]);

  // Load plan usage data when plan view is opened
  const loadPlanUsage = async (filter = 'lifetime', startDate = null, endDate = null) => {
    if (!shop) return;
    
    try {
      setPlanUsageLoading(true);
      let start = null;
      let end = null;

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start = today.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
      } else if (filter === 'custom' && startDate && endDate) {
        start = startDate;
        end = endDate;
      }

      const response = await api.getPlanUsage(shop, start, end);
      if (response.success && response.data) {
        setPlanUsageData(response.data);
      } else {
        setPlanUsageData(null);
      }
    } catch (error) {
      console.error('Error loading plan usage:', error);
      setPlanUsageData(null);
    } finally {
      setPlanUsageLoading(false);
    }
  };

  // Load usage data when plan card is selected
  useEffect(() => {
    if (selectedCard === 'plan' && shop) {
      loadPlanUsage('lifetime');
    }
  }, [selectedCard, shop]);

  // Load channel status when channel-status card is selected
  useEffect(() => {
    if (selectedCard !== 'channel-status' || !shop) {
      return;
    }

    const loadChannelStatus = async () => {
      try {
        setChannelStatus(prev => ({ ...prev, loading: true }));
        
        // Get shop balance to get channels
        const balanceResponse = await api.getShopBalance(shop);
        if (balanceResponse.success && balanceResponse.data) {
          const channels = balanceResponse.data.channels || 1;
          
          // Calculate orders per hour (last 24 hours)
          try {
            const ordersResponse = await window.fetch(`/api/orders?shop=${encodeURIComponent(shop)}&limit=1000`, {
              credentials: 'include'
            });
            const ordersData = await ordersResponse.json();
            const orders = ordersData.success ? (ordersData.orders || []) : [];
            
            // Filter orders from last 24 hours
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentOrders = orders.filter(order => {
              const orderDate = new Date(order.createdAt || order.created_at);
              return orderDate >= oneDayAgo;
            });
            const shopifyOrdersPerHour = Math.round(recentOrders.length / 24);
            
            // Calculate calls initiated per hour based on channels (36 calls per hour per channel)
            const callsPerHour = channels * 36;
            
            setChannelStatus({
              channels,
              shopifyOrdersPerHour,
              callsInitiatedPerHour: callsPerHour,
              loading: false
            });
          } catch (err) {
            console.error('Error calculating orders per hour:', err);
            // Fallback to just showing channels and calculated calls per hour
            setChannelStatus({
              channels,
              shopifyOrdersPerHour: 0,
              callsInitiatedPerHour: channels * 36,
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Error loading channel status:', error);
        setChannelStatus(prev => ({ ...prev, loading: false }));
      }
    };

    loadChannelStatus();
  }, [selectedCard, shop]);

  // Fetch Account Health metrics when account-settings is selected
  useEffect(() => {
    if (selectedCard !== 'account-settings' || !shop) {
      return;
    }

    const fetchAccountHealth = async () => {
      try {
        setAccountHealthLoading(true);
        
        // Fetch all Account Health data in parallel
        const [statusResponse, callsPerHourResponse] = await Promise.all([
          api.getSystemStatus(shop).catch(err => ({ success: false, error: err.message })),
          api.getCallsPerHour(shop, 24).catch(err => ({ success: false, error: err.message }))
        ]);

        // Update system status and queue count
        if (statusResponse.success) {
          const status = statusResponse.status || 'inactive';
          const queuedCount = statusResponse.queuedOrdersCount || 0;
          
          setAccountHealthMetrics(prev => ({
            ...prev,
            status: status === 'active' ? 'active' : 'inactive',
            inQueue: queuedCount
          }));
        }

        // Update calls per hour data and calculate speed
        if (callsPerHourResponse.success && callsPerHourResponse.callsPerHour) {
          const callsData = callsPerHourResponse.callsPerHour;
          setCallsPerHourData(callsData);
          
          // Calculate average calls per hour (speed) from last 24 hours
          if (callsData.length > 0) {
            const totalCalls = callsData.reduce((sum, item) => sum + (item.count || 0), 0);
            const avgCallsPerHour = Math.round(totalCalls / callsData.length);
            
            setAccountHealthMetrics(prev => ({
              ...prev,
              speedOrdersPerHour: avgCallsPerHour
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching account health:', error);
      } finally {
        setAccountHealthLoading(false);
      }
    };

    // Fetch immediately
    fetchAccountHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAccountHealth, 30000);

    return () => clearInterval(interval);
  }, [selectedCard, shop]);

      {/* Inbound Call Settings View */}
      {selectedCard === 'inbound-settings' && shop && (
        <div className="profile-page-container">
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Inbound Call Settings</h2>
          <div>
            {(!inboundSettings || Object.keys(inboundSettings).length === 0) ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                No inbound settings found. Please check your shop configuration or contact support.
              </div>
            ) : (
              <>
                <div className="profile-detail-section">
                  <h3 className="profile-detail-subheading">Inbound Call Routing</h3>
                  <div className="profile-detail-box">
                    {/* Enable Inbound Calls */}
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Enable Inbound Calls</span>
                        <span className="profile-detail-hint">Allow customers to call your shop's number</span>
                      </div>
                      <div className="profile-detail-action">
                        <label className="profile-toggle-switch">
                          <input
                            type="checkbox"
                            checked={inboundSettings.inboundEnabled}
                            onChange={e => setInboundSettings({ ...inboundSettings, inboundEnabled: e.target.checked })}
                          />
                          <span className="profile-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    <hr className="profile-detail-divider" />
                    {/* Phone Number */}
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
                          onChange={e => setInboundSettings({ ...inboundSettings, phoneNumber: e.target.value })}
                          placeholder="Enter inbound phone number"
                        />
                      </div>
                    </div>
                    <hr className="profile-detail-divider" />
                    {/* Lookback Hours */}
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Lookback Hours</span>
                        <span className="profile-detail-hint">How many hours to look back for inbound calls</span>
                      </div>
                      <div className="profile-detail-action">
                        <input
                          type="number"
                          className="profile-detail-input"
                          min={1}
                          value={inboundSettings.inboundLookback || ''}
                          onChange={e => setInboundSettings({ ...inboundSettings, inboundLookback: parseInt(e.target.value) || 1 })}
                          placeholder="Enter lookback hours"
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
                          onChange={e => setInboundSettings({ ...inboundSettings, defaultInboundScriptId: e.target.value ? parseInt(e.target.value) : null })}
                        >
                          <option value="">-- Select a script --</option>
                          {scripts.map(script => (
                            <option key={script.id} value={script.id}>{script.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profile-save-container">
                  <button className="profile-save-button-new" onClick={saveInboundSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Inbound Settings'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
  const loadPhoneNumbers = async () => {
    if (!shop) return;
    
    try {
      // TODO: Replace with actual API call to fetch phone numbers
      // For now, use hardcoded number - later can fetch from API
      const numbers = [{
      number: '1913528324',
      category: 'Base',
      country: 'IN'
      }];
      setPhoneNumbers(numbers);
      
      // Load stats for each phone number from API
      const stats = {};
      for (const phone of numbers) {
        try {
          // TODO: Replace with actual API call to get phone number stats
          // Example: const response = await fetch(`/api/phone-number-stats?shop=${shop}&number=${phone.number}`);
          // const data = await response.json();
          // stats[phone.number] = { calls: data.calls, type: data.type, region: data.region };
          
          // For now, use 0 as default until API is ready
          stats[phone.number] = {
            calls: 0, // Will be replaced with actual API data
            type: phone.number.length <= 10 ? 'Mobile' : 'Landline',
            region: phone.number.startsWith('191') ? 'Jammu' : 'Mumbai'
          };
        } catch (error) {
          console.error(`Error loading stats for ${phone.number}:`, error);
          stats[phone.number] = { calls: 0, type: 'N/A', region: 'N/A' };
        }
      }
      setPhoneNumberStats(stats);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      setPhoneNumbers([]);
      setPhoneNumberStats({});
    }
  };

  const loadTotalCalls = async () => {
    if (!shop) return;
    try {
      const response = await fetch(`/api/total-calls?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.totalCalls) {
        setTotalCalls(data.totalCalls);
      }
    } catch (error) {
      console.error('Error loading total calls:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
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
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setConnecting(true);

    try {
      if (!formData.shopDomain.endsWith('.myshopify.com')) {
        throw new Error('Shop domain must end with .myshopify.com');
      }

      if (!formData.clientId || !formData.clientSecret) {
        throw new Error('Client ID and Client Secret are required');
      }

      // Store credentials via API call
      const response = await window.fetch('/connect-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams({
          shopDomain: formData.shopDomain,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to store credentials' }));
        throw new Error(errorData.error || 'Failed to store credentials');
      }

      const data = await response.json();
      
      if (data.success) {
        // Show success message with instructions
        setStatusMessage({ 
          type: 'success', 
          text: data.message || 'Credentials stored successfully! Please go to your Shopify Partner Dashboard → Distributions → Get the install link and click Install.' 
        });
        
        // Clear form
        setFormData({ shopDomain: '', clientId: '', clientSecret: '' });
        setConnecting(false);
        
        // Auto-hide message after 10 seconds (longer for important instructions)
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 10000);
      } else {
        throw new Error(data.error || 'Failed to store credentials');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect store');
      setStatusMessage({ type: 'error', text: err.message || 'Failed to connect store' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
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
        setStatusMessage({ type: 'success', text: 'Store disconnected successfully' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disconnect' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    }
  };

  const checkNimbuspostConnection = async () => {
    try {
      const response = await window.fetch('/api/nimbuspost/status', {
        credentials: 'include'
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // API endpoint doesn't exist yet, silently fail
        setNimbuspostConnected(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.connected) {
        setNimbuspostConnected(true);
        if (data.email) {
          setNimbuspostFormData({ email: data.email, password: '' });
        }
      } else {
        setNimbuspostConnected(false);
        // Reset to empty values if not connected
        setNimbuspostFormData({ email: '', password: '' });
      }
    } catch (err) {
      // Silently fail if endpoint doesn't exist
      console.error('Error checking NimbusPost connection status:', err);
      setNimbuspostConnected(false);
    }
  };

  const handleNimbuspostConnect = async (e) => {
    e.preventDefault();
    setNimbuspostError('');
    setNimbuspostConnecting(true);

    try {
      if (!nimbuspostFormData.email || !nimbuspostFormData.password) {
        throw new Error('Email and password are required');
      }

      const response = await window.fetch('/api/nimbuspost/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: nimbuspostFormData.email,
          password: nimbuspostFormData.password
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. The API endpoint may not be implemented yet.`);
      }

      const data = await response.json();

      if (data.success) {
        setNimbuspostConnected(true);
        setStatusMessage({ type: 'success', text: 'NimbusPost connected successfully' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(data.error || 'Failed to connect');
      }
    } catch (err) {
      let errorMessage = err.message || 'Failed to connect NimbusPost';
      
      // Handle JSON parse errors more gracefully
      if (err.message && err.message.includes('JSON')) {
        errorMessage = 'Backend API endpoint not found. Please implement the /api/nimbuspost/connect endpoint on the server.';
      }
      
      setNimbuspostError(errorMessage);
      setStatusMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } finally {
      setNimbuspostConnecting(false);
    }
  };

  const handleNimbuspostDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect NimbusPost?')) {
      return;
    }

    try {
      const response = await window.fetch('/api/nimbuspost/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setNimbuspostConnected(false);
        // Reset to empty values after disconnect
        setNimbuspostFormData({ email: '', password: '' });
        setStatusMessage({ type: 'success', text: 'NimbusPost disconnected successfully' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disconnect' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    }
  };

  const checkShiprocketConnection = async () => {
    try {
      const response = await window.fetch('/api/shiprocket/status', {
        credentials: 'include'
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setShiprocketConnected(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.connected) {
        setShiprocketConnected(true);
        if (data.email) {
          setShiprocketFormData({ email: data.email, password: '' });
        }
      } else {
        setShiprocketConnected(false);
        setShiprocketFormData({ email: '', password: '' });
      }
    } catch (err) {
      console.error('Error checking Shiprocket connection status:', err);
      setShiprocketConnected(false);
    }
  };

  const handleShiprocketConnect = async (e) => {
    e.preventDefault();
    setShiprocketError('');
    setShiprocketConnecting(true);

    try {
      if (!shiprocketFormData.email || !shiprocketFormData.password) {
        throw new Error('Email and password are required');
      }

      const response = await window.fetch('/api/shiprocket/connect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shiprocketFormData.email,
          password: shiprocketFormData.password
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. The API endpoint may not be implemented yet.`);
      }

      const data = await response.json();

      if (data.success) {
        setShiprocketConnected(true);
        setStatusMessage({ type: 'success', text: 'Shiprocket connected successfully' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(data.error || 'Failed to connect');
      }
    } catch (err) {
      let errorMessage = err.message || 'Failed to connect Shiprocket';
      
      if (err.message && err.message.includes('JSON')) {
        errorMessage = 'Backend API endpoint not found. Please implement the /api/shiprocket/connect endpoint on the server.';
      }
      
      setShiprocketError(errorMessage);
      setStatusMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } finally {
      setShiprocketConnecting(false);
    }
  };

  const handleShiprocketDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Shiprocket?')) {
      return;
    }

    try {
      const response = await window.fetch('/api/shiprocket/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setShiprocketConnected(false);
        setShiprocketFormData({ email: '', password: '' });
        setStatusMessage({ type: 'success', text: 'Shiprocket disconnected successfully' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disconnect' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    }
  };

  const loadKnowledgeBooks = async () => {
    try {
      const response = await api.getKnowledgeBooks(shop);
      const books = response?.knowledgeBooks || response || [];
      setKnowledgeBooks(Array.isArray(books) ? books.filter(book => book && book.id) : []);
    } catch (error) {
      console.error('Error loading knowledge books:', error);
      setKnowledgeBooks([]);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const profile = await api.getUserProfile();
      if (profile.success) {
        setUserProfile({
          email: profile.data?.email || '',
          name: profile.data?.name || '',
          avatar: profile.data?.avatar || '',
          phone: profile.data?.phone || ''
        });
        setAvatarPreview(profile.data?.avatar || '');
      }

      if (shop) {
        try {
          // Load retry settings
          const response = await window.fetch(`/api/user-retry-settings?shop=${encodeURIComponent(shop)}`, {
            credentials: 'include'
          });
          const data = await response.json();
          if (data.success && data.settings) {
            setRetrySettings({
              maxRetries: data.settings.maxRetries !== undefined ? data.settings.maxRetries : 3,
              retryIntervalMinutes: data.settings.retryIntervalMinutes || 60,
              autoCancelOnMaxRetries: data.settings.autoCancelOnMaxRetries || false,
              maxOutcomeRetries: data.settings.maxOutcomeRetries !== undefined && data.settings.maxOutcomeRetries !== null ? data.settings.maxOutcomeRetries : null,
              allowedTimeStart: data.settings.allowedTimeStart || '09:00',
              allowedTimeEnd: data.settings.allowedTimeEnd || '18:00',
              timezone: data.settings.timezone || 'Asia/Kolkata',
              allowedDays: data.settings.allowedDays ? data.settings.allowedDays.split(',').map(Number) : [1, 2, 3, 4, 5]
            });
          }
          
          // Load auto call settings
          const autoCallResponse = await window.fetch(`/api/auto-call-settings?shop=${encodeURIComponent(shop)}`, {
            credentials: 'include'
          });
          const autoCallData = await autoCallResponse.json();
          if (autoCallData.success && autoCallData.settings) {
            setAutoCallSettings({
              autoCallEnabled: autoCallData.settings.autoCallEnabled || false,
              autoCallScriptId: autoCallData.settings.autoCallScriptId || null
            });
          }
          
          // Load Google Sheets settings
          const googleSheetsResponse = await window.fetch(`/api/google-sheets-settings?shop=${encodeURIComponent(shop)}`, {
            credentials: 'include'
          });
          const googleSheetsData = await googleSheetsResponse.json();
          if (googleSheetsData.success && googleSheetsData.settings) {
            setGoogleSheetsSettings({
              googleSheetsEnabled: googleSheetsData.settings.googleSheetsEnabled || false,
              googleSheetsUrl: googleSheetsData.settings.googleSheetsUrl || '',
              googleSheetsPhoneColumn: googleSheetsData.settings.googleSheetsPhoneColumn || '',
              googleSheetsNameColumn: googleSheetsData.settings.googleSheetsNameColumn || '',
              googleSheetsAutoQueue: googleSheetsData.settings.googleSheetsAutoQueue || false,
              googleSheetsScriptId: googleSheetsData.settings.googleSheetsScriptId || null,
              googleSheetsKnowledgeColumns: googleSheetsData.settings.googleSheetsKnowledgeColumns || []
            });
          }
          
          // Load email update settings
          try {
            const emailResponse = await window.fetch(`/api/email-update-settings?shop=${encodeURIComponent(shop)}`, {
              credentials: 'include'
            });
            const emailData = await emailResponse.json();
            if (emailData.success && emailData.settings) {
              setEmailUpdateSettings({
                enabled: emailData.settings.enabled || false,
                email: emailData.settings.email || '',
                dailySummaryEmailTime: emailData.settings.dailySummaryEmailTime || '18:00'
              });
            }
          } catch (err) {
            console.error('Error loading email update settings:', err);
          }
          
          // Load scripts for dropdown
          const scriptsResponse = await api.getScripts(shop);
          const scriptsArray = scriptsResponse?.scripts || scriptsResponse || [];
          setScripts(scriptsArray);
          
          // Load custom campaign rules
          try {
            const rulesResponse = await window.fetch(`/api/custom-campaign-rules?shop=${encodeURIComponent(shop)}`, {
              credentials: 'include'
            });
            const rulesData = await rulesResponse.json();
            if (rulesData.success && rulesData.rules) {
              setCustomCampaignRules(rulesData.rules || []);
            }
          } catch (err) {
            console.error('Error loading custom campaign rules:', err);
          }
          
          // Load account settings
          const balanceResponse = await api.getShopBalance(shop);
          if (balanceResponse.success && balanceResponse.data) {
            setAccountSettings({
              accountType: balanceResponse.data.accountType || 'standard',
              freeTokenLimit: balanceResponse.data.freeTokenLimit || 10000,
              remainingFreeTokens: balanceResponse.data.remainingFreeTokens || 10000
            });
            // Set current plan
            if (balanceResponse.data.plan) {
              const plan = balanceResponse.data.plan.toLowerCase();
              // Normalize plan name: handle variations like 'proplus', 'pro_plus', 'pro-plus'
              let normalizedPlan = plan.replace(/[_\s]/g, '-');
              if (normalizedPlan === 'proplus') {
                normalizedPlan = 'pro-plus';
              }
              setCurrentPlan(normalizedPlan);
              // Only set expandedPlanCard if it's not already set (to avoid overriding user interaction)
              if (expandedPlanCard === null) {
                setExpandedPlanCard(normalizedPlan); // Default to user's current plan
              }
            }
            // Also set channels for channel status
            if (balanceResponse.data.channels !== undefined) {
              setChannelStatus(prev => ({
                ...prev,
                channels: balanceResponse.data.channels || 1
              }));
            }
          }
        } catch (err) {
          console.error('Error loading settings:', err);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setStatusMessage({ type: 'error', text: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setStatusMessage({ type: 'error', text: 'Please select an image file' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Image size must be less than 2MB' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarPreview(base64String);
        setUserProfile({ ...userProfile, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveUserProfile = async () => {
    try {
      setSaving(true);
      const result = await api.updateUserProfile(userProfile.name, userProfile.avatar, userProfile.phone);
      if (result.success) {
        setStatusMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    }
  };

  const saveRetrySettings = async () => {
    try {
      setSaving(true);
      
      // Save retry settings
      const response = await window.fetch(`/api/user-retry-settings?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          settings: {
            ...retrySettings,
            allowedDays: retrySettings.allowedDays.join(',')
          }
        })
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save retry settings');
      }
      
      // Save auto call settings
      const autoCallResponse = await window.fetch(`/api/auto-call-settings?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          autoCallEnabled: autoCallSettings.autoCallEnabled,
          autoCallScriptId: autoCallSettings.autoCallScriptId
        })
      });
      const autoCallData = await autoCallResponse.json();
      
      if (!autoCallData.success) {
        throw new Error(autoCallData.error || 'Failed to save auto call settings');
      }
      
      // Save Google Sheets settings
      const googleSheetsResponse = await window.fetch(`/api/google-sheets-settings?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          ...googleSheetsSettings
        })
      });
      const googleSheetsData = await googleSheetsResponse.json();
      
      if (!googleSheetsData.success) {
        throw new Error(googleSheetsData.error || 'Failed to save Google Sheets settings');
      }
      
      setStatusMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    }
  };

  const saveEmailUpdateSettings = async () => {
    try {
      setSaving(true);
      const response = await window.fetch(`/api/email-update-settings?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          settings: emailUpdateSettings
        })
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save email update settings');
      }
      
      setStatusMessage({ type: 'success', text: 'Email update settings saved successfully' });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to save email update settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    }
  };

  const toggleDay = (day) => {
    setRetrySettings(prev => ({
      ...prev,
      allowedDays: prev.allowedDays.includes(day)
        ? prev.allowedDays.filter(d => d !== day)
        : [...prev.allowedDays, day].sort()
    }));
  };

  const handleKnowledgeBookSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingKnowledgeBookId) {
        await api.updateKnowledgeBook(editingKnowledgeBookId, shop, knowledgeBookFormData);
      } else {
        await api.createKnowledgeBook(shop, knowledgeBookFormData);
      }
      setShowKnowledgeBookForm(false);
      setEditingKnowledgeBookId(null);
      setKnowledgeBookFormData({ name: '', description: '', content: '', websiteLink: '', extraContent: '' });
      await loadKnowledgeBooks();
      setStatusMessage({ type: 'success', text: editingKnowledgeBookId ? 'Knowledge book updated successfully' : 'Knowledge book created successfully' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to save knowledge book' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKnowledgeBook = async (id) => {
    if (!confirm('Are you sure you want to delete this knowledge book?')) return;
    try {
      setSaving(true);
      await api.deleteKnowledgeBook(id, shop);
      await loadKnowledgeBooks();
      setStatusMessage({ type: 'success', text: 'Knowledge book deleted successfully' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to delete knowledge book' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFetchWebsite = async () => {
    if (!knowledgeBookFormData.websiteLink || !knowledgeBookFormData.websiteLink.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a website URL' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      setIsFetchingWebsite(true);
      setStatusMessage({ type: 'info', text: 'Fetching website content...' });
      
      const response = await api.fetchWebsiteContent(knowledgeBookFormData.websiteLink.trim());
      
      if (response && response.success && response.content) {
        setKnowledgeBookFormData(prev => ({
          ...prev,
          content: response.content
        }));
        setStatusMessage({ type: 'success', text: 'Website content fetched successfully!' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
      } else {
        const errorMsg = response?.error || response?.details || 'No content received from API';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error fetching website:', error);
      let errorMessage = 'Failed to fetch website content';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setStatusMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
    } finally {
      setIsFetchingWebsite(false);
    }
  };

  const handleCardClick = (cardId) => {
    setSelectedCard(cardId);
    setActiveView(cardId);
    setActiveTab('profile'); // Reset to first tab
  };

  const handleBackToCards = () => {
    setActiveView('cards');
    setSelectedCard(null);
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="settings-container">
        <SkeletonSettingsCards />
      </div>
    );
  }

  // Card-based view
  if (activeView === 'cards') {
    return (
      <div className="settings-container">
        {statusMessage.text && (
          <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        {/* System Overview Section */}
        <h2 className="settings-section-heading">System Overview</h2>
        <div className="settings-profile-section">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" />
              ) : (
                <div className="avatar-initials">
                  {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{userProfile.name || 'User'}</h2>
              <p className="profile-role">Owner</p>
              <div className="profile-outgoing-tag">
                <span className="outgoing-tag">
                  {currentPlan === 'base' ? 'Base (₹2,800/mo)' :
                   currentPlan === 'pro' ? 'Pro (₹4,900/mo)' :
                   currentPlan === 'pro-plus' ? 'Pro Plus (10 Channels)' :
                   currentPlan === 'enterprise' ? 'Enterprise (Custom)' :
                   'Base (₹2,800/mo)'}
                </span>
              </div>
            </div>
          </div>
          <div className="profile-contact-section">
            <div className="contact-item">
              <span className="contact-label">Phone number</span>
              <span className="contact-value">
                {phoneNumbers.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🇮🇳</span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>IN</span>
                    <a
                      href={`https://www.truecaller.com/search/in/${phoneNumbers[0].number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#4B5CFF', textDecoration: 'none' }}
                    >
                      {phoneNumbers[0].number}
                    </a>
                  </div>
                ) : userProfile.phone ? (
                  userProfile.phone
                ) : (
                  'Not provided'
                )}
              </span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Login email</span>
              <span className="contact-value">{userProfile.email}</span>
              <button className="edit-link" onClick={() => handleCardClick('profile')}>Edit</button>
            </div>
            <div className="contact-item">
              <span className="contact-label">Password</span>
              <span className="contact-value">...........</span>
              <button className="edit-link" onClick={() => handleCardClick('profile')}>Edit</button>
            </div>
            <div className="contact-item">
              <div className="current-limit-box">
                <span>
                  {currentPlan === 'base' ? '20 Initiated Calls/hour' :
                   currentPlan === 'pro' ? '60 Initiated Calls/hour' :
                   currentPlan === 'pro-plus' ? '200 Initiated Calls/hour' :
                   currentPlan === 'enterprise' ? 'Custom Initiated Calls/hour' :
                   '20 Initiated Calls/hour'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Separator */}
        <hr className="settings-separator" />

        {/* Account Settings Section */}
        <h2 className="settings-section-heading">Account Settings</h2>
        <div className="settings-cards-section">
          <div className="settings-group">
            <div className="settings-cards-grid">
            {/* 1. Profile - First */}
            <div className="settings-card" onClick={() => handleCardClick('profile')}>
              <div className="card-header">
                <div className="card-icon">
                  <img src="/images/Raycons Icons Pack (Community)/profile-tick-8535312.svg" alt="Profile" />
                </div>
                <h4 className="card-title">Profile</h4>
              </div>
              <div className="card-content">
                <ul className="card-items">
                  <li>Name & Email</li>
                  <li>Avatar</li>
                  <li>Account details</li>
                </ul>
              </div>
            </div>

            {/* 2. Plan */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('plan')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" alt="Plan" />
                  </div>
                  <h4 className="card-title">Plan</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Current plan details</li>
                    <li>Plan features & limits</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3. Channel Status */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('channel-status')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/call-2198440.svg" alt="Channel Status" />
                  </div>
                  <h4 className="card-title">Channel Status</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Channel capacity</li>
                    <li>Orders & calls per hour</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. Retry Settings */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('retry')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/refresh-8532481.svg" alt="Retry Settings" />
                  </div>
                  <h4 className="card-title">Retry Settings</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Max retries</li>
                    <li>Time window</li>
                    <li>Allowed days</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. Custom Campaign Rules */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('custom-campaign-rules')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Custom Campaign Rules" />
                  </div>
                  <h4 className="card-title">Custom Campaign Rules</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Script-based rules</li>
                    <li>Auto-call on outcomes</li>
                    <li>Per-script retry settings</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Inbound Call Settings Card */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('inbound-settings')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/call-2198440.svg" alt="Inbound Call Settings" />
                  </div>
                  <h4 className="card-title">Inbound Call Settings</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Enable inbound calls</li>
                    <li>Inbound phone number</li>
                    <li>Default inbound script</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 5. Phone Numbers */}
            <div className="settings-card" onClick={() => handleCardClick('phone-numbers')}>
              <div className="card-header">
                <div className="card-icon">
                  <img src="/images/Raycons Icons Pack (Community)/call-2198440.svg" alt="Phone Numbers" />
                </div>
                <h4 className="card-title">Phone Numbers</h4>
              </div>
              <div className="card-content">
                <ul className="card-items">
                  <li>Manage phone numbers</li>
                  <li>View call statistics</li>
                </ul>
              </div>
            </div>

            {/* 6. Knowledge Books */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('knowledge-books')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/book-8535533.svg" alt="Knowledge Books" />
                  </div>
                  <h4 className="card-title">Knowledge Books</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Create & manage</li>
                    <li>Content library</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 7. Account Settings */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('account-settings')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/setting-8532400.svg" alt="Account Settings" />
                  </div>
                  <h4 className="card-title">Account Settings</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Account health</li>
                    <li>Speed metrics</li>
                    <li>Call logs & analytics</li>
                  </ul>
                </div>
              </div>
            )}

                </div>
          </div>
        </div>

        {/* Horizontal Separator */}
        <hr className="settings-separator" />

        {/* Integrations Section */}
        <h2 className="settings-section-heading">Integrations</h2>
        <div className="settings-cards-section">
          <div className="settings-group">
            <div className="settings-cards-grid">
            {/* Shopify Integration */}
            <div className="settings-card" onClick={() => handleCardClick('integrations')}>
              <div className="card-header">
                <div className="card-icon">
                  <img src="/images/Raycons Icons Pack (Community)/link-8535459.svg" alt="Integrations" />
                </div>
                <h4 className="card-title">Integrations</h4>
              </div>
              <div className="card-content">
                <ul className="card-items">
                  <li>Shopify</li>
                  <li>API keys</li>
                  <li>Webhooks</li>
                </ul>
              </div>
            </div>

            {/* NDR Integration */}
            <div className="settings-card" onClick={() => handleCardClick('ndr-integration')}>
              <div className="card-header">
                <div className="card-icon">
                  <img src="/images/Raycons Icons Pack (Community)/link-8535459.svg" alt="NDR Integration" />
                </div>
                <h4 className="card-title">NDR Integration</h4>
              </div>
              <div className="card-content">
                <ul className="card-items">
                  <li>NimbusPost / Shiprocket</li>
                  <li>Manage NDR list</li>
                </ul>
              </div>
            </div>

            {/* Google Sheets Integration */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('google-sheets')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/grid-8535417.svg" alt="Google Sheets" />
                  </div>
                  <h4 className="card-title">Google Sheets</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Import leads from Google Sheets</li>
                    <li>Auto-queue new orders</li>
                  </ul>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Horizontal Separator */}
        <hr className="settings-separator" />

        {/* Support & Resources Section */}
        <h2 className="settings-section-heading">Support & Resources</h2>
        <div className="settings-cards-section">
          <div className="settings-group">
            <div className="settings-cards-grid">
            {/* 9. App Info */}
            <div className="settings-card" onClick={() => handleCardClick('app-info')}>
              <div className="card-header">
                <div className="card-icon">
                  <img src="/images/Raycons Icons Pack (Community)/message-question-8535294.svg" alt="App Info" />
                </div>
                <h4 className="card-title">App Info</h4>
              </div>
              <div className="card-content">
                <ul className="card-items">
                  <li>Documentation</li>
                  <li>Guides & tutorials</li>
                  <li>Script variables</li>
                </ul>
              </div>
            </div>

            {/* 10. Customer Support */}
            <div className="settings-card" onClick={() => handleCardClick('customer-support')}>
              <div className="card-header">
                <div className="card-icon">
                  <img src="/images/Raycons Icons Pack (Community)/message-2198428.svg" alt="Customer Support" />
                </div>
                <h4 className="card-title">Customer Support</h4>
              </div>
              <div className="card-content">
                <ul className="card-items">
                  <li>Contact support</li>
                  <li>Get help & assistance</li>
                </ul>
              </div>
            </div>

            {/* 11. Email Updates */}
            {shop && (
              <div className="settings-card" onClick={() => handleCardClick('email-updates')}>
                <div className="card-header">
                  <div className="card-icon">
                    <img src="/images/Raycons Icons Pack (Community)/message-2198427.svg" alt="Email Updates" />
            </div>
                  <h4 className="card-title">Email Updates</h4>
                </div>
                <div className="card-content">
                  <ul className="card-items">
                    <li>Daily summary email</li>
                    <li>Automatic email scheduling</li>
                  </ul>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detailed view with tabs
  // Show skeleton while loading
  if (loading) {
    return (
      <div className="settings-container">
        <SkeletonSettingsCards />
      </div>
    );
  }

  return (
    <div className="settings-container">
      {statusMessage.text && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Back button - Only show for views that don't have their own back button */}
      {selectedCard !== 'profile' && selectedCard !== 'retry' && selectedCard !== 'google-sheets' && selectedCard !== 'phone-numbers' && selectedCard !== 'ndr-integration' && selectedCard !== 'knowledge-books' && selectedCard !== 'account-settings' && selectedCard !== 'integrations' && selectedCard !== 'app-info' && selectedCard !== 'customer-support' && selectedCard !== 'custom-campaign-rules' && selectedCard !== 'email-updates' && selectedCard !== 'channel-status' && selectedCard !== 'plan' && (
        <button className="back-button" onClick={handleBackToCards}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Settings
        </button>
      )}

      {/* Inbound Call Settings View */}
      {selectedCard === 'inbound-settings' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Inbound Call Settings</h2>
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Inbound Call Routing</h3>
            <div className="profile-detail-box">
              {/* Enable Inbound Calls */}
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Enable Inbound Calls</span>
                  <span className="profile-detail-hint">Allow customers to call your shop's number</span>
                </div>
                <div className="profile-detail-action">
                  <label className="profile-toggle-switch">
                    <input
                      type="checkbox"
                      checked={inboundSettings.inboundEnabled}
                      onChange={e => setInboundSettings({ ...inboundSettings, inboundEnabled: e.target.checked })}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
              </div>
              <hr className="profile-detail-divider" />
              {/* Phone Number */}
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
                    onChange={e => setInboundSettings({ ...inboundSettings, phoneNumber: e.target.value })}
                    placeholder="Enter inbound phone number"
                  />
                </div>
              </div>
              <hr className="profile-detail-divider" />
              {/* Lookback Hours */}
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Lookback Hours</span>
                  <span className="profile-detail-hint">How many hours to look back for inbound calls</span>
                </div>
                <div className="profile-detail-action">
                  <input
                    type="number"
                    className="profile-detail-input"
                    min={1}
                    value={inboundSettings.inboundLookback || ''}
                    onChange={e => setInboundSettings({ ...inboundSettings, inboundLookback: parseInt(e.target.value) || 1 })}
                    placeholder="Enter lookback hours"
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
                    onChange={e => setInboundSettings({ ...inboundSettings, defaultInboundScriptId: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">-- Select a script --</option>
                    {scripts.map(script => (
                      <option key={script.id} value={script.id}>{script.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Save Button - Outside Box */}
          <div className="profile-save-container">
            <button className="profile-save-button-new" onClick={saveInboundSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Inbound Settings'}
            </button>
          </div>
        </div>
      )}
      {/* Phone Numbers View */}
      {selectedCard === 'phone-numbers' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">My Phone Numbers</h2>

          {/* My Phone Numbers Section */}
          <div className="profile-detail-section">
            <div className="profile-detail-box">
              {(() => {
                // Get plan-based phone number slots
                const slotsCount = currentPlan === 'base' ? 2 : currentPlan === 'pro' ? 6 : currentPlan === 'pro-plus' ? 20 : 2;
                
                // Helper function to get region from phone number (e.g., +191 = Jammu)
                const getRegionFromNumber = (number) => {
                  if (!number) return 'N/A';
                  // Extract area code or use first digits to determine region
                  // +191 = Jammu, etc.
                  if (number.startsWith('+191') || number.startsWith('191')) return 'Jammu';
                  // Add more region mappings as needed
                  return 'Mumbai'; // Default
                };

                // Helper function to detect number type
                const getNumberType = (number) => {
                  if (!number) return 'N/A';
                  // Simple detection - can be enhanced
                  if (number.length <= 10) return 'Mobile';
                  return 'Landline';
                };

                // Create array of slots
                const slots = Array.from({ length: slotsCount }, (_, index) => {
                  const phoneNumber = phoneNumbers[index] || null;
                  return {
                    index,
                    number: phoneNumber?.number || null,
                    assigned: !!phoneNumber,
                    stats: phoneNumber ? (phoneNumberStats[phoneNumber.number] || { calls: 0, type: getNumberType(phoneNumber.number), region: getRegionFromNumber(phoneNumber.number) }) : null
                  };
                });

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {slots.map((slot, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          cursor: slot.assigned ? 'pointer' : 'default',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (slot.assigned) {
                            e.currentTarget.style.borderColor = '#4B5CFF';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(75, 92, 255, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          if (slot.assigned && slot.number) {
                            window.open(`https://www.truecaller.com/search/in/${slot.number}`, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        {slot.assigned ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '20px' }}>🇮🇳</span>
                                  <a
                                    href={`https://www.truecaller.com/search/in/${slot.number}`}
                                    onClick={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: '#4B5CFF',
                                      textDecoration: 'none',
                                      fontSize: '16px',
                                      fontWeight: '600'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.textDecoration = 'none';
                                    }}
                                  >
                                    {slot.number}
                                  </a>
                    </div>
                    </div>
                  </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Stats</span>
                                <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{slot.stats?.calls || 0} calls</span>
                    </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Number Type</span>
                                <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{slot.stats?.type || 'N/A'}</span>
                    </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Region</span>
                                <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>{slot.stats?.region || 'N/A'}</span>
                  </div>
                    </div>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              background: '#FEF3C7',
                              color: '#92400E',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              Need to be assigned
                    </div>
                  </div>
                        )}
                </div>
              ))}
              </div>
                );
              })()}
              </div>
            </div>
        </div>
      )}

      {/* Integrations View */}
      {selectedCard === 'integrations' && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Integrations</h2>

          {/* Shopify Integration Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Shopify Integration</h3>
            <div className="profile-detail-box">
              {connected && shopData ? (
                <>
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Status</span>
                    </div>
                    <div className="profile-detail-action">
                      <span style={{ color: '#10B981', fontWeight: '500' }}>Connected</span>
                    </div>
                  </div>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Shop Domain</span>
                    </div>
                    <div className="profile-detail-action">
                      <span className="profile-detail-value">{shopData.shopDomain}</span>
                    </div>
                  </div>
                  {shopData.connectedAt && (
                    <>
                      <hr className="profile-detail-divider" />
                      <div className="profile-detail-item">
                        <div className="profile-detail-label">
                          <span>Connected On</span>
                        </div>
                        <div className="profile-detail-action">
                          <span className="profile-detail-value">{new Date(shopData.connectedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span></span>
                    </div>
                    <div className="profile-detail-action">
                      <button className="profile-save-button-new" onClick={handleDisconnect} style={{ background: '#DC2626' }}>
                        <img src="/images/Raycons Icons Pack (Community)/logout-8532474.svg" alt="Disconnect" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)', marginRight: '8px' }} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {error && (
                    <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleConnect}>
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Shop Domain</span>
                        <span className="profile-detail-hint">Use your myshopify.com domain</span>
                      </div>
                      <div className="profile-detail-action">
                        <input
                          type="text"
                          className="profile-detail-input"
                          placeholder="example.myshopify.com"
                          value={formData.shopDomain}
                          onChange={(e) => setFormData({ ...formData, shopDomain: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <hr className="profile-detail-divider" />
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Client ID</span>
                      </div>
                      <div className="profile-detail-action">
                        <input
                          type="text"
                          className="profile-detail-input"
                          placeholder="App client ID"
                          value={formData.clientId}
                          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <hr className="profile-detail-divider" />
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Access Token</span>
                        <span className="profile-detail-hint">Your Shopify private app access token</span>
                      </div>
                      <div className="profile-detail-action">
                        <input
                          type="password"
                          className="profile-detail-input"
                          placeholder="Shopify access token"
                          value={formData.clientSecret}
                          onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <hr className="profile-detail-divider" />
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span></span>
                      </div>
                      <div className="profile-detail-action">
                        <button type="submit" className="profile-save-button-new" disabled={connecting}>
                          {connecting ? 'Connecting...' : 'Connect Shopify'}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile View - Redesigned */}
      {selectedCard === 'profile' && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Profile</h2>

          {/* Single Profile Box with All Items */}
          <div className="profile-detail-box">
            {/* Profile Picture */}
            <label htmlFor="userAvatar" className="profile-detail-item profile-picture-item-wrapper">
              <div className="profile-detail-label">
                <span>Profile picture</span>
              </div>
              <div className="profile-detail-action">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-circle">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile" />
                    ) : (
                      <div className="profile-avatar-initials">
                        {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                      </div>
                    )}
                  </div>
                  <div className="profile-avatar-edit-overlay">
                    <img src="/images/Raycons Icons Pack (Community)/edit-8535505.svg" alt="Edit" />
                  </div>
                </div>
              </div>
              <input
                type="file"
                id="userAvatar"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>

            <hr className="profile-detail-divider" />

            {/* Name */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Name</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="text"
                  className="profile-detail-input"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <hr className="profile-detail-divider" />

            {/* Email */}
            <div className="profile-detail-item">
              <div className="profile-detail-label">
                <span>Email</span>
                <span className="profile-detail-hint">Email cannot be changed</span>
              </div>
              <div className="profile-detail-action">
                <input
                  type="email"
                  className="profile-detail-input profile-detail-input-disabled"
                  value={userProfile.email}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Save Button - Outside Box */}
          <div className="profile-save-container">
            <button className="profile-save-button-new" onClick={saveUserProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Retry Settings View */}
      {selectedCard === 'retry' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Retry Settings</h2>

          {/* Failed Call Retries Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Failed Call Retries</h3>
            <div className="profile-detail-box">
              {/* How Many Times to Retry */}
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>How Many Times to Retry</span>
                  <span className="profile-detail-hint">How many times should we try calling if the first call fails? (0-10)</span>
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
                  <span className="profile-detail-hint">Automatically cancel the order in Shopify when we've tried calling the maximum number of times</span>
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
                        setAutoCallSettings({
                          ...autoCallSettings,
                          autoCallEnabled: enabled,
                          autoCallScriptId: enabled ? autoCallSettings.autoCallScriptId : null
                        });
                      }}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
              </div>

              {autoCallSettings.autoCallEnabled && (
                <>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Select Script</span>
                    </div>
                    <div className="profile-detail-action">
                      <select
                        className="profile-detail-input"
                        value={autoCallSettings.autoCallScriptId || ''}
                        onChange={(e) => setAutoCallSettings({
                          ...autoCallSettings,
                          autoCallScriptId: e.target.value ? parseInt(e.target.value) : null
                        })}
                      >
                        <option value="">-- Select a script --</option>
                        {scripts.map((script) => (
                          <option key={script.id} value={script.id}>
                            {script.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Days to Make Calls Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Days to Make Calls</h3>
            <div className="profile-detail-box">
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Days to Make Calls</span>
                  <span className="profile-detail-hint">Select which days of the week we can make calls</span>
                </div>
                <div className="profile-detail-action">
                  <div className="profile-days-display-text">
                    {retrySettings.allowedDays.length > 0 
                      ? `${retrySettings.allowedDays.length} day${retrySettings.allowedDays.length > 1 ? 's' : ''} selected`
                      : 'Select days'}
                  </div>
                </div>
              </div>
              <hr className="profile-detail-divider" />
              <div className="profile-days-horizontal">
                {[
                  { value: 1, label: 'Mon' },
                  { value: 2, label: 'Tue' },
                  { value: 3, label: 'Wed' },
                  { value: 4, label: 'Thu' },
                  { value: 5, label: 'Fri' },
                  { value: 6, label: 'Sat' },
                  { value: 0, label: 'Sun' }
                ].map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`profile-day-box ${retrySettings.allowedDays.includes(day.value) ? 'profile-day-box-selected' : ''}`}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button - Outside Box */}
          <div className="profile-save-container">
            <button className="profile-save-button-new" onClick={saveRetrySettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Google Sheets Settings View */}
      {selectedCard === 'google-sheets' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Google Sheets Integration</h2>

          {/* Configuration Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Configuration</h3>
            <div className="profile-detail-box">
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Import from Google Sheets</span>
                  <span className="profile-detail-hint">Automatically get new customers from your Google Sheet and add them for calling</span>
                </div>
                <div className="profile-detail-action">
                  <label className="profile-toggle-switch">
                    <input
                      type="checkbox"
                      checked={googleSheetsSettings.googleSheetsEnabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setGoogleSheetsSettings({
                          ...googleSheetsSettings,
                          googleSheetsEnabled: enabled
                        });
                      }}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Google Sheets Configuration - Only show when enabled */}
          {googleSheetsSettings.googleSheetsEnabled && (
            <>
              {/* Sheet Setup Section */}
              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">Sheet Setup</h3>
                <div className="profile-detail-box">
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Google Sheet Link</span>
                      <span className="profile-detail-hint">Paste the full link to your Google Sheet (make sure it's set to "Anyone with the link can view")</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="text"
                        className="profile-detail-input"
                        value={googleSheetsSettings.googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsSettings({
                          ...googleSheetsSettings,
                          googleSheetsUrl: e.target.value
                        })}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column Configuration Section */}
              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">Column Configuration</h3>
                <div className="profile-detail-box">
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Phone Number Column</span>
                      <span className="profile-detail-hint">Which column has phone numbers? (Enter the letter like A, B, C)</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="text"
                        className="profile-detail-input"
                        value={googleSheetsSettings.googleSheetsPhoneColumn}
                        onChange={(e) => setGoogleSheetsSettings({
                          ...googleSheetsSettings,
                          googleSheetsPhoneColumn: e.target.value
                        })}
                        placeholder="A, B, C, etc."
                      />
                    </div>
                  </div>

                  <hr className="profile-detail-divider" />

                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Customer Name Column</span>
                      <span className="profile-detail-hint">Which column has customer names? (Enter the letter like A, B, C)</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="text"
                        className="profile-detail-input"
                        value={googleSheetsSettings.googleSheetsNameColumn}
                        onChange={(e) => setGoogleSheetsSettings({
                          ...googleSheetsSettings,
                          googleSheetsNameColumn: e.target.value
                        })}
                        placeholder="A, B, C, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">Additional Information</h3>
                <div className="profile-detail-box">
                  {googleSheetsSettings.googleSheetsKnowledgeColumns.length > 0 ? (
                    <>
                      {googleSheetsSettings.googleSheetsKnowledgeColumns.map((col, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <hr className="profile-detail-divider" />}
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span>Knowledge Column {index + 1}</span>
                              <span className="profile-detail-hint">Add extra columns from your sheet that should be included in the call</span>
                            </div>
                            <div className="profile-detail-action" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="profile-detail-input"
                                style={{ width: '80px' }}
                                value={col.column}
                                onChange={(e) => {
                                  const newCols = [...googleSheetsSettings.googleSheetsKnowledgeColumns];
                                  newCols[index].column = e.target.value.toUpperCase();
                                  setGoogleSheetsSettings({
                                    ...googleSheetsSettings,
                                    googleSheetsKnowledgeColumns: newCols
                                  });
                                }}
                                placeholder="Column"
                              />
                              <input
                                type="text"
                                className="profile-detail-input"
                                style={{ width: '150px' }}
                                value={col.title}
                                onChange={(e) => {
                                  const newCols = [...googleSheetsSettings.googleSheetsKnowledgeColumns];
                                  newCols[index].title = e.target.value;
                                  setGoogleSheetsSettings({
                                    ...googleSheetsSettings,
                                    googleSheetsKnowledgeColumns: newCols
                                  });
                                }}
                                placeholder="Title"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newCols = googleSheetsSettings.googleSheetsKnowledgeColumns.filter((_, i) => i !== index);
                                  setGoogleSheetsSettings({
                                    ...googleSheetsSettings,
                                    googleSheetsKnowledgeColumns: newCols
                                  });
                                }}
                                className="profile-edit-button"
                                style={{ width: 'auto', padding: '8px 12px' }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                      <hr className="profile-detail-divider" />
                    </>
                  ) : null}
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span></span>
                    </div>
                    <div className="profile-detail-action">
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleSheetsSettings({
                            ...googleSheetsSettings,
                            googleSheetsKnowledgeColumns: [
                              ...googleSheetsSettings.googleSheetsKnowledgeColumns,
                              { column: '', title: '' }
                            ]
                          });
                        }}
                        className="profile-save-button-new"
                        style={{ background: 'transparent', border: '1px solid #D1D5DB', color: '#111827' }}
                      >
                        <img src="/images/Raycons Icons Pack (Community)/add-8535609.svg" alt="Add" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                        Add Knowledge Column
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automation Section */}
              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">Automation</h3>
                <div className="profile-detail-box">
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Automatically call when new order found</span>
                      <span className="profile-detail-hint">Start calling customers automatically when new orders are found in your Google Sheet</span>
                    </div>
                    <div className="profile-detail-action">
                      <label className="profile-toggle-switch">
                        <input
                          type="checkbox"
                          checked={googleSheetsSettings.googleSheetsAutoQueue}
                          onChange={(e) => setGoogleSheetsSettings({
                            ...googleSheetsSettings,
                            googleSheetsAutoQueue: e.target.checked
                          })}
                        />
                        <span className="profile-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  {googleSheetsSettings.googleSheetsAutoQueue && (
                    <>
                      <hr className="profile-detail-divider" />
                      <div className="profile-detail-item">
                        <div className="profile-detail-label">
                          <span>Select Script</span>
                          <span className="profile-detail-hint">Choose which script to use when calling customers from Google Sheets</span>
                        </div>
                        <div className="profile-detail-action">
                          <select
                            className="profile-detail-input"
                            value={googleSheetsSettings.googleSheetsScriptId || ''}
                            onChange={(e) => setGoogleSheetsSettings({
                              ...googleSheetsSettings,
                              googleSheetsScriptId: e.target.value ? parseInt(e.target.value) : null
                            })}
                          >
                            <option value="">-- Choose a script --</option>
                            {scripts.map((script) => (
                              <option key={script.id} value={script.id}>
                                {script.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Save Button - Outside Box */}
          <div className="profile-save-container">
            <button className="profile-save-button-new" onClick={saveRetrySettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Email Updates View */}
      {selectedCard === 'email-updates' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Email Updates</h2>

          {/* Daily Summary Email Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Daily Summary Email</h3>
            <div className="profile-detail-box">
              {/* Enable Email Updates */}
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Enable Email Updates</span>
                  <span className="profile-detail-hint">Receive daily summary emails</span>
                </div>
                <div className="profile-detail-action">
                  <label className="profile-toggle-switch">
                    <input
                      type="checkbox"
                      checked={emailUpdateSettings.enabled}
                      onChange={(e) => setEmailUpdateSettings({ ...emailUpdateSettings, enabled: e.target.checked })}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
              </div>

              {emailUpdateSettings.enabled && (
                <>
                  <hr className="profile-detail-divider" />

                  {/* Email Address */}
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Email Address</span>
                      <span className="profile-detail-hint">Enter the email address to receive daily summaries</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="email"
                        className="profile-detail-input"
                        value={emailUpdateSettings.email}
                        onChange={(e) => setEmailUpdateSettings({ ...emailUpdateSettings, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>

                  <hr className="profile-detail-divider" />

                  {/* Send Time */}
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Send automatic summary email at</span>
                      <span className="profile-detail-hint">Set the time when you want to receive your daily summary email</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="time"
                        className="profile-detail-input"
                        value={emailUpdateSettings.dailySummaryEmailTime}
                        onChange={(e) => setEmailUpdateSettings({ ...emailUpdateSettings, dailySummaryEmailTime: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save Button - Outside Box */}
          <div className="profile-save-container">
            <button className="profile-save-button-new" onClick={saveEmailUpdateSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Plan View */}
      {selectedCard === 'plan' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Plan</h2>

          {/* Plan Cards - Collapsible Sections */}
          <div className="profile-detail-section">
            {/* Base Plan Card */}
            <div className="profile-detail-box" style={{ marginBottom: '16px' }}>
              <div 
                className="profile-detail-item" 
                style={{ cursor: 'pointer', padding: '16px' }}
                onClick={() => setExpandedPlanCard(expandedPlanCard === 'base' ? null : 'base')}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" 
                      alt="Base" 
                      style={{ width: '24px', height: '24px' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      Base Plan (₹2,800/mo)
                    </span>
                    {currentPlan === 'base' && (
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#10B981', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500' 
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <img 
                    src="/images/Raycons Icons Pack (Community)/arrow-down-8532505.svg" 
                    alt={expandedPlanCard === 'base' ? 'Collapse' : 'Expand'}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      transform: expandedPlanCard === 'base' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>
              </div>
              
              {expandedPlanCard === 'base' && (
                <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Base Plan Features:</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>1 Channel (Upto 20 Initiated Calls/Hour) (Flexible time range) (8 Hour = 160 Initiated Calls Per day)</li>
                        <li>2 FREE numbers (+₹800/mo rental for new number)</li>
                        <li>Unlimited Sentiment Tagging</li>
                        <li>8 FREE write with AI credits (scripting)</li>
                        <li>10 FREE Chat Completions Of Edit Script Per day</li>
                        <li>2 Times Voice Cloning Limit</li>
                        <li>50 GB cloud storage/mo for Recordings FREE</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                        Usage From Wallet (Cuts according to wallet):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>Chat Widget</li>
                        <li>Test Call Agent</li>
                        <li>Web Call</li>
                        <li>Real Call</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pro Plan Card */}
            <div className="profile-detail-box" style={{ marginBottom: '16px' }}>
              <div 
                className="profile-detail-item" 
                style={{ cursor: 'pointer', padding: '16px' }}
                onClick={() => setExpandedPlanCard(expandedPlanCard === 'pro' ? null : 'pro')}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" 
                      alt="Pro" 
                      style={{ width: '24px', height: '24px' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      Pro Plan (₹4,900/mo)
                    </span>
                    {currentPlan === 'pro' && (
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#10B981', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500' 
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <img 
                    src="/images/Raycons Icons Pack (Community)/arrow-down-8532505.svg" 
                    alt={expandedPlanCard === 'pro' ? 'Collapse' : 'Expand'}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      transform: expandedPlanCard === 'pro' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>
              </div>
              
              {expandedPlanCard === 'pro' && (
                <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Pro Plan Features (3x Base):</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>2 Channels (Upto 60 Initiated Calls/Hour) (Flexible time range) (8 Hour = 480 Initiated Calls Per day)</li>
                        <li>6 FREE numbers (+₹650/mo rental for new number)</li>
                        <li>Unlimited Sentiment Tagging</li>
                        <li>24 FREE write with AI credits (scripting) (3x Base)</li>
                        <li>30 FREE Chat Completions Of Edit Script Per day (3x Base)</li>
                        <li>6 Times Voice Cloning Limit (3x Base)</li>
                        <li>150 GB cloud storage/mo for Recordings FREE</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                        Usage From Wallet (Cuts according to wallet):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>Chat Widget</li>
                        <li>Test Call Agent</li>
                        <li>Web Call</li>
                        <li>Real Call</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pro Plus Plan Card */}
            <div className="profile-detail-box" style={{ marginBottom: '16px' }}>
              <div 
                className="profile-detail-item" 
                style={{ cursor: 'pointer', padding: '16px' }}
                onClick={() => setExpandedPlanCard(expandedPlanCard === 'pro-plus' ? null : 'pro-plus')}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" 
                      alt="Pro Plus" 
                      style={{ width: '24px', height: '24px' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      Pro Plus Plan (10 Channels)
                    </span>
                    {currentPlan === 'pro-plus' && (
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#10B981', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500' 
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <img 
                    src="/images/Raycons Icons Pack (Community)/arrow-down-8532505.svg" 
                    alt={expandedPlanCard === 'pro-plus' ? 'Collapse' : 'Expand'}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      transform: expandedPlanCard === 'pro-plus' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>
              </div>
              
              {expandedPlanCard === 'pro-plus' && (
                <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Pro Plus Plan Features (10x Base):</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>10 Channels (Upto 200 Initiated Calls/Hour) (Flexible time range) (8 Hour = 1600 Initiated Calls Per day)</li>
                        <li>20 FREE numbers (+₹590/mo rental for new number)</li>
                        <li>Unlimited Sentiment Tagging</li>
                        <li>80 FREE write with AI credits (scripting) (10x Base)</li>
                        <li>100 FREE Chat Completions Of Edit Script Per day (10x Base)</li>
                        <li>Unlimited Voice Cloning</li>
                        <li>250 GB cloud storage/mo for Recordings FREE</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                        Usage From Wallet (Cuts according to wallet):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>Chat Widget</li>
                        <li>Test Call Agent</li>
                        <li>Web Call</li>
                        <li>Real Call</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enterprise Plan Card */}
            <div className="profile-detail-box" style={{ marginBottom: '16px' }}>
              <div 
                className="profile-detail-item" 
                style={{ cursor: 'pointer', padding: '16px' }}
                onClick={() => setExpandedPlanCard(expandedPlanCard === 'enterprise' ? null : 'enterprise')}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src="/images/Raycons Icons Pack (Community)/card-coin-8532167.svg" 
                      alt="Enterprise" 
                      style={{ width: '24px', height: '24px' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      Enterprise Plan (Custom)
                    </span>
                    {currentPlan === 'enterprise' && (
                      <span style={{ 
                        padding: '4px 8px', 
                        background: '#10B981', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500' 
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <img 
                    src="/images/Raycons Icons Pack (Community)/arrow-down-8532505.svg" 
                    alt={expandedPlanCard === 'enterprise' ? 'Collapse' : 'Expand'}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      transform: expandedPlanCard === 'enterprise' ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>
              </div>
              
              {expandedPlanCard === 'enterprise' && (
                <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #E5E7EB', marginTop: '16px', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Enterprise Plan Features:</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>Custom Channel Configuration</li>
                        <li>Custom numbers (Contact for pricing)</li>
                        <li>Unlimited Sentiment Tagging</li>
                        <li>Unlimited write with AI credits (scripting)</li>
                        <li>Unlimited Chat Completions Of Edit Script</li>
                        <li>Unlimited Voice Cloning</li>
                        <li>Priority Support</li>
                        <li>Custom Integration Options</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                        Usage From Wallet (Cuts according to wallet):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                        <li>Chat Widget</li>
                        <li>Test Call Agent</li>
                        <li>Web Call</li>
                        <li>Real Call</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage Tracking Section */}
          <div className="profile-detail-section" style={{ marginTop: '32px' }}>
            <h3 className="profile-detail-subheading" style={{ marginBottom: '16px' }}>Usage Tracking</h3>
            
            {/* Date Filter */}
            <div className="profile-detail-box" style={{ marginBottom: '16px' }}>
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Filter by Date</span>
                </div>
                <div className="profile-detail-action" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUsageDateFilter('today');
                      loadPlanUsage('today');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: usageDateFilter === 'today' ? '#4B5CFF' : 'white',
                      color: usageDateFilter === 'today' ? 'white' : '#374151',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: usageDateFilter === 'today' ? '600' : '400'
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsageDateFilter('lifetime');
                      loadPlanUsage('lifetime');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: usageDateFilter === 'lifetime' ? '#4B5CFF' : 'white',
                      color: usageDateFilter === 'lifetime' ? 'white' : '#374151',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: usageDateFilter === 'lifetime' ? '600' : '400'
                    }}
                  >
                    Lifetime
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsageDateFilter('custom')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: usageDateFilter === 'custom' ? '#4B5CFF' : 'white',
                      color: usageDateFilter === 'custom' ? 'white' : '#374151',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: usageDateFilter === 'custom' ? '600' : '400'
                    }}
                  >
                    Custom
                  </button>
                </div>
              </div>
              
              {usageDateFilter === 'custom' && (
                <>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Start Date</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="date"
                        className="profile-detail-input"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>End Date</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="date"
                        className="profile-detail-input"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span></span>
                    </div>
                    <div className="profile-detail-action">
                      <button
                        type="button"
                        onClick={() => loadPlanUsage('custom', customStartDate, customEndDate)}
                        className="profile-edit-button"
                        style={{ width: 'auto', padding: '8px 16px' }}
                      >
                        Apply Filter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Usage Stats */}
            {planUsageLoading ? (
              <div className="profile-detail-box" style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                Loading usage data...
              </div>
            ) : planUsageData ? (
              <>
                {/* Plan Limits Definition */}
                {(() => {
                  const planLimits = {
                    base: { writeAI: 8, chatCompletions: 10, voiceCloning: 2 },
                    pro: { writeAI: 24, chatCompletions: 30, voiceCloning: 6 },
                    'pro-plus': { writeAI: 80, chatCompletions: 100, voiceCloning: Infinity },
                    enterprise: { writeAI: Infinity, chatCompletions: Infinity, voiceCloning: Infinity }
                  };
                  const limits = planLimits[currentPlan] || planLimits.base;
                  
                  const remainingWriteAI = limits.writeAI === Infinity ? 'Unlimited' : Math.max(0, limits.writeAI - planUsageData.totals.writeAI);
                  const remainingChatCompletions = limits.chatCompletions === Infinity ? 'Unlimited' : Math.max(0, limits.chatCompletions - planUsageData.totals.chatCompletions);
                  const remainingVoiceCloning = limits.voiceCloning === Infinity ? 'Unlimited' : Math.max(0, limits.voiceCloning - planUsageData.totals.voiceCloning);

                  return null;
                })()}

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {/* Write with AI */}
                  <div className="profile-detail-box">
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Write with AI</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
                          {(() => {
                            const planLimits = {
                              base: 8, pro: 24, 'pro-plus': 80, enterprise: Infinity
                            };
                            const limit = planLimits[currentPlan] || 8;
                            const remaining = limit === Infinity ? 'Unlimited' : Math.max(0, limit - planUsageData.totals.writeAI);
                            return remaining;
                          })()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                          / {(() => {
                            const planLimits = {
                              base: 8, pro: 24, 'pro-plus': 80, enterprise: Infinity
                            };
                            return (planLimits[currentPlan] || 8) === Infinity ? 'Unlimited' : (planLimits[currentPlan] || 8);
                          })()} left
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        Used: {planUsageData.totals.writeAI} {usageDateFilter === 'today' ? 'today' : usageDateFilter === 'lifetime' ? 'lifetime' : 'this period'}
                      </div>
                    </div>
                  </div>

                  {/* Chat Completions */}
                  <div className="profile-detail-box">
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Chat Completions</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
                          {(() => {
                            const planLimits = {
                              base: 10, pro: 30, 'pro-plus': 100, enterprise: Infinity
                            };
                            const limit = planLimits[currentPlan] || 10;
                            const remaining = limit === Infinity ? 'Unlimited' : Math.max(0, limit - planUsageData.totals.chatCompletions);
                            return remaining;
                          })()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                          / {(() => {
                            const planLimits = {
                              base: 10, pro: 30, 'pro-plus': 100, enterprise: Infinity
                            };
                            return (planLimits[currentPlan] || 10) === Infinity ? 'Unlimited' : (planLimits[currentPlan] || 10);
                          })()} left
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        Used: {planUsageData.totals.chatCompletions} {usageDateFilter === 'today' ? 'today' : usageDateFilter === 'lifetime' ? 'lifetime' : 'this period'}
                      </div>
                    </div>
                  </div>

                  {/* Voice Cloning */}
                  <div className="profile-detail-box">
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Voice Cloning</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
                          {(() => {
                            const planLimits = {
                              base: 2, pro: 6, 'pro-plus': Infinity, enterprise: Infinity
                            };
                            const limit = planLimits[currentPlan] || 2;
                            const remaining = limit === Infinity ? 'Unlimited' : Math.max(0, limit - planUsageData.totals.voiceCloning);
                            return remaining;
                          })()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
                          / {(() => {
                            const planLimits = {
                              base: 2, pro: 6, 'pro-plus': Infinity, enterprise: Infinity
                            };
                            return (planLimits[currentPlan] || 2) === Infinity ? 'Unlimited' : (planLimits[currentPlan] || 2);
                          })()} left
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        Used: {planUsageData.totals.voiceCloning} {usageDateFilter === 'today' ? 'today' : usageDateFilter === 'lifetime' ? 'lifetime' : 'this period'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Write with AI Details */}
                {planUsageData.allWriteAIUsages && planUsageData.allWriteAIUsages.length > 0 && (
                  <div className="profile-detail-box" style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                        Write with AI Usage Details
                      </h4>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '0' }}>
                        Shows each write with AI action with script name and time
                      </div>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {planUsageData.allWriteAIUsages.map((usage, index) => (
                        <div key={usage.id} style={{ padding: '12px 16px', borderBottom: index < planUsageData.allWriteAIUsages.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                {usage.scriptName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                Time: {new Date(usage.createdAt).toLocaleString('en-IN', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </div>
                              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                                Action: {usage.service === 'claude_script_generation' ? 'Generate Script' : 'Rewrite Script'}
                              </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6B7280', textAlign: 'right', minWidth: '80px' }}>
                              {usage.tokensUsed.toLocaleString()} tokens
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Breakdown */}
                {planUsageData.dailyStats && planUsageData.dailyStats.length > 0 && (
                  <div className="profile-detail-box">
                    <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                        Daily Breakdown
                      </h4>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {planUsageData.dailyStats.map((day, index) => (
                        <div key={day.date} style={{ padding: '12px 16px', borderBottom: index < planUsageData.dailyStats.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
                            <div>Write with AI: {day.writeAI}</div>
                            <div>Chat Completions: {day.chatCompletions}</div>
                            <div>Voice Cloning: {day.voiceCloning}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="profile-detail-box" style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                No usage data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Channel Status View */}
      {selectedCard === 'channel-status' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Channel Status</h2>

          {(() => {
            // Get plan-based assigned channels and calling limit
            const assignedChannels = currentPlan === 'base' ? 1 : currentPlan === 'pro' ? 2 : currentPlan === 'pro-plus' ? 10 : 1;
            const callingLimitPerHour = currentPlan === 'base' ? 20 : currentPlan === 'pro' ? 60 : currentPlan === 'pro-plus' ? 200 : 20;
            
            return (
              <>
                {/* Channel Information */}
                <div className="profile-detail-section">
                  <div className="profile-detail-box">
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Assigned Channels</span>
                      </div>
                      <div className="profile-detail-action">
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                          {assignedChannels}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Boxes */}
                <div className="profile-detail-section" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {/* Shopify Orders Per Hour Box */}
                    <div className="profile-detail-box">
                      <div className="profile-detail-item">
                        <div className="profile-detail-label">
                          <span>Shopify Orders Per Hour</span>
                          <span className="profile-detail-hint">Average orders received per hour (last 24 hours)</span>
                        </div>
                        <div className="profile-detail-action" style={{ marginTop: '12px' }}>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#111827',
                            textAlign: 'center',
                            padding: '16px',
                            background: '#F9FAFB',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB'
                          }}>
                            {channelStatus.shopifyOrdersPerHour || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calling Limit Per Hour Box */}
                    <div className="profile-detail-box">
                      <div className="profile-detail-item">
                        <div className="profile-detail-label">
                          <span>Calling Limit Per Hour</span>
                          <span className="profile-detail-hint">Initiated calls limit per hour</span>
                        </div>
                        <div className="profile-detail-action" style={{ marginTop: '12px' }}>
                          <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#111827',
                            textAlign: 'center',
                            padding: '16px',
                            background: '#F9FAFB',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB'
                          }}>
                            {callingLimitPerHour}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="profile-detail-section" style={{ marginTop: '24px' }}>
                  <div className="profile-detail-box">
                    <div style={{ padding: '20px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                        Frequently Asked Questions
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          {
                            question: 'What is a Channel?',
                            answer: 'A channel lets you make phone calls at the same time. Think of it like lanes on a road. One channel means one call at a time. More channels mean more calls happening together.'
                          },
                          {
                            question: 'What is Calling Limit Per Hour?',
                            answer: 'This is the biggest number of calls you can start in one hour. Your plan decides this number. It helps make sure everything works well.'
                          },
                          {
                            question: 'How does Channel Speed work?',
                            answer: 'Channel speed means how fast you can start calls. If you have more channels, you can start more calls in one hour. This makes your calling faster.'
                          },
                          {
                            question: 'How many channels do I have?',
                            answer: 'Look at the number shown above. It depends on your plan. Base plan gives 1 channel. Pro plan gives 2 channels. Pro Plus plan gives 10 channels.'
                          }
                        ].map((faq, index) => (
                          <div
                            key={index}
                            style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <button
                              onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                              style={{
                                width: '100%',
                                padding: '16px',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#111827'
                              }}
                            >
                              <span>{faq.question}</span>
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                  transform: expandedFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease',
                                  flexShrink: 0,
                                  marginLeft: '12px'
                                }}
                              >
                                <path d="M6 9L12 15L18 9" />
                              </svg>
                            </button>
                            <div
                              style={{
                                maxHeight: expandedFAQ === index ? '500px' : '0',
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease',
                                padding: expandedFAQ === index ? '0 16px 16px 16px' : '0 16px',
                                fontSize: '14px',
                                color: '#6B7280',
                                lineHeight: '1.6'
                              }}
                            >
                              {faq.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Custom Campaign Rules View */}
      {selectedCard === 'custom-campaign-rules' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Custom Campaign Rules</h2>

          {/* Info Message */}
          <div className="profile-detail-section">
            <div className="profile-detail-box">
              <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '14px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px', fontWeight: '500', color: '#111827' }}>
                  Campaign-specific rules are managed within each campaign
                </p>
                <p>
                  To set up custom rules for a specific campaign, navigate to that campaign's page and click the settings icon in the header.
                  <br />
                  There you can load unique outcomes for that campaign and map them to auto-call with retry settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Info View */}
      {selectedCard === 'app-info' && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">App Info</h2>

          {/* Search Bar */}
          <div className="profile-detail-section">
            <div className="profile-detail-box">
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Search Documentation</span>
                </div>
                <div className="profile-detail-action">
                  <div style={{ position: 'relative', width: '100%' }}>
                    <img src="/images/Raycons Icons Pack (Community)/search-normal-8532441.svg" alt="Search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', opacity: 0.5 }} />
                    <input
                      type="text"
                      className="profile-detail-input"
                      placeholder="Search documentation..."
                      value={infoSearchQuery}
                      onChange={(e) => setInfoSearchQuery(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Content */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
            {/* Sidebar Navigation */}
            <div className="profile-detail-box" style={{ minWidth: '200px', flexShrink: 0, padding: '20px' }}>
              <h3 className="profile-detail-subheading" style={{ marginBottom: '16px', fontSize: '14px' }}>Topics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.keys(infoSections).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveInfoSection(key);
                      setInfoSearchQuery('');
                    }}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: activeInfoSection === key ? '#F3F4F6' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: activeInfoSection === key ? '600' : '400',
                      color: activeInfoSection === key ? '#111827' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (activeInfoSection !== key) {
                        e.currentTarget.style.background = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeInfoSection !== key) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {infoSections[key].title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="profile-detail-box" style={{ flex: 1, padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                {infoSections[activeInfoSection]?.title || ''}
              </h3>
              <div style={{ lineHeight: '1.6', color: '#374151' }}>
                {filteredInfoContent.split('\n').map((line, index) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={index} style={{ fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                        {line.slice(2, -2)}
                      </p>
                    );
                  }
                  if (line.startsWith('•')) {
                    return (
                      <li key={index} style={{ marginBottom: '8px', marginLeft: '20px' }}>
                        {line.substring(1).trim()}
                      </li>
                    );
                  }
                  if (line.trim() === '') {
                    return <br key={index} />;
                  }
                  return (
                    <p key={index} style={{ marginBottom: '12px', lineHeight: '1.6', color: '#374151' }}>
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Customer Support View */}
      {selectedCard === 'customer-support' && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Customer Support</h2>

          {/* Support Contact Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Contact Information</h3>
            <div className="profile-detail-box">
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Name</span>
                </div>
                <div className="profile-detail-action">
                  <span className="profile-detail-value">Hassan Shafqat</span>
                </div>
              </div>
              <hr className="profile-detail-divider" />
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Role</span>
                </div>
                <div className="profile-detail-action">
                  <span className="profile-detail-value">Customer Support Representative</span>
                </div>
              </div>
              <hr className="profile-detail-divider" />
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Email</span>
                </div>
                <div className="profile-detail-action">
                  <span className="profile-detail-value">contact@scalysis.com</span>
                </div>
              </div>
              <hr className="profile-detail-divider" />
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Phone Number</span>
                </div>
                <div className="profile-detail-action">
                  <span className="profile-detail-value">9682165725</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget Visibility Section */}
          <div className="profile-detail-section">
            <h3 className="profile-detail-subheading">Widget Settings</h3>
            <div className="profile-detail-box">
              <div className="profile-detail-item">
                <div className="profile-detail-label">
                  <span>Show Widget</span>
                  <span className="profile-detail-hint">Show the floating widget in the bottom right corner</span>
                </div>
                <div className="profile-detail-action">
                  <label className="profile-toggle-switch">
                    <input
                      type="checkbox"
                      checked={floatingWidgetVisible}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setFloatingWidgetVisible(newValue);
                        localStorage.setItem('floatingWidgetVisible', String(newValue));
                        // Dispatch event to notify other components
                        window.dispatchEvent(new Event('floatingWidgetVisibilityChanged'));
                      }}
                    />
                    <span className="profile-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined NDR Integration View */}
      {selectedCard === 'ndr-integration' && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">NDR Integration</h2>

          {!selectedNDRProvider ? (
            <div className="profile-detail-section">
              <h3 className="profile-detail-subheading">Select Provider</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div 
                  className="profile-detail-box"
                  onClick={() => setSelectedNDRProvider('nimbuspost')}
                  style={{ cursor: 'pointer', padding: '24px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <img src="/images/Raycons Icons Pack (Community)/link-8535459.svg" alt="NimbusPost" style={{ width: '32px', height: '32px' }} />
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>NimbusPost</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Connect your NimbusPost account</p>
                </div>
                
                <div 
                  className="profile-detail-box"
                  onClick={() => setSelectedNDRProvider('shiprocket')}
                  style={{ cursor: 'pointer', padding: '24px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <img src="/images/Raycons Icons Pack (Community)/link-8535459.svg" alt="Shiprocket" style={{ width: '32px', height: '32px' }} />
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Shiprocket</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Connect your Shiprocket account</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-detail-section">
                <div className="profile-detail-box">
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Provider</span>
                    </div>
                    <div className="profile-detail-action">
                      <button 
                        onClick={() => setSelectedNDRProvider(null)}
                        className="profile-back-button"
                        style={{ margin: 0, padding: '6px 12px' }}
                      >
                        <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
                        Change Provider
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {selectedNDRProvider === 'nimbuspost' && (
                  <div className="profile-detail-section">
                    <h3 className="profile-detail-subheading">NimbusPost Connection</h3>
                    <div className="profile-detail-box">
                      {nimbuspostConnected ? (
                        <>
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span>Status</span>
                            </div>
                            <div className="profile-detail-action">
                              <span style={{ color: '#10B981', fontWeight: '500' }}>Connected</span>
                            </div>
                          </div>
                          <hr className="profile-detail-divider" />
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span>Email</span>
                            </div>
                            <div className="profile-detail-action">
                              <span className="profile-detail-value">{nimbuspostFormData.email}</span>
                            </div>
                          </div>
                          <hr className="profile-detail-divider" />
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span></span>
                            </div>
                            <div className="profile-detail-action">
                              <button className="profile-save-button-new" onClick={handleNimbuspostDisconnect} style={{ background: '#DC2626' }}>
                                Disconnect
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {nimbuspostError && (
                            <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                              {nimbuspostError}
                            </div>
                          )}
                          <form onSubmit={handleNimbuspostConnect}>
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span>Email</span>
                                <span className="profile-detail-hint">Enter your NimbusPost account email</span>
                              </div>
                              <div className="profile-detail-action">
                                <input
                                  type="email"
                                  className="profile-detail-input"
                                  placeholder="Enter your NimbusPost email"
                                  value={nimbuspostFormData.email}
                                  onChange={(e) => setNimbuspostFormData({ ...nimbuspostFormData, email: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <hr className="profile-detail-divider" />
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span>Password</span>
                                <span className="profile-detail-hint">Enter your NimbusPost account password</span>
                              </div>
                              <div className="profile-detail-action">
                                <input
                                  type="password"
                                  className="profile-detail-input"
                                  placeholder="Enter your password"
                                  value={nimbuspostFormData.password}
                                  onChange={(e) => setNimbuspostFormData({ ...nimbuspostFormData, password: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <hr className="profile-detail-divider" />
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span></span>
                              </div>
                              <div className="profile-detail-action">
                                <button type="submit" className="profile-save-button-new" disabled={nimbuspostConnecting}>
                                  {nimbuspostConnecting ? 'Connecting...' : 'Connect NimbusPost'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedNDRProvider === 'shiprocket' && (
                  <div className="profile-detail-section">
                    <h3 className="profile-detail-subheading">Shiprocket Connection</h3>
                    <div className="profile-detail-box">
                      {shiprocketConnected ? (
                        <>
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span>Status</span>
                            </div>
                            <div className="profile-detail-action">
                              <span style={{ color: '#10B981', fontWeight: '500' }}>Connected</span>
                            </div>
                          </div>
                          <hr className="profile-detail-divider" />
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span>Email</span>
                            </div>
                            <div className="profile-detail-action">
                              <span className="profile-detail-value">{shiprocketFormData.email}</span>
                            </div>
                          </div>
                          <hr className="profile-detail-divider" />
                          <div className="profile-detail-item">
                            <div className="profile-detail-label">
                              <span></span>
                            </div>
                            <div className="profile-detail-action">
                              <button className="profile-save-button-new" onClick={handleShiprocketDisconnect} style={{ background: '#DC2626' }}>
                                Disconnect
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {shiprocketError && (
                            <div style={{ padding: '12px', background: '#FEE2E2', color: '#DC2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                              {shiprocketError}
                            </div>
                          )}
                          <form onSubmit={handleShiprocketConnect}>
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span>Email</span>
                                <span className="profile-detail-hint">Enter your Shiprocket account email</span>
                              </div>
                              <div className="profile-detail-action">
                                <input
                                  type="email"
                                  className="profile-detail-input"
                                  placeholder="Enter your Shiprocket email"
                                  value={shiprocketFormData.email}
                                  onChange={(e) => setShiprocketFormData({ ...shiprocketFormData, email: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <hr className="profile-detail-divider" />
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span>Password</span>
                                <span className="profile-detail-hint">Enter your Shiprocket account password</span>
                              </div>
                              <div className="profile-detail-action">
                                <input
                                  type="password"
                                  className="profile-detail-input"
                                  placeholder="Enter your password"
                                  value={shiprocketFormData.password}
                                  onChange={(e) => setShiprocketFormData({ ...shiprocketFormData, password: e.target.value })}
                                  required
                                />
                              </div>
                            </div>
                            <hr className="profile-detail-divider" />
                            <div className="profile-detail-item">
                              <div className="profile-detail-label">
                                <span></span>
                              </div>
                              <div className="profile-detail-action">
                                <button type="submit" className="profile-save-button-new" disabled={shiprocketConnecting}>
                                  {shiprocketConnecting ? 'Connecting...' : 'Connect Shiprocket'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
        </div>
      )}

      {/* NimbusPost View - Keep for backward compatibility */}
      {selectedCard === 'nimbuspost' && (
        <>
          <h2 className="settings-page-title">NimbusPost NDR Integration</h2>
          <div className="settings-section">
            <p className="section-subtitle">Connect your NimbusPost shipping aggregator account to manage NDR list</p>
            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-title">
                  <div className="integration-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>NimbusPost</span>
                </div>
                <div className={`status-badge ${nimbuspostConnected ? 'status-connected' : 'status-not-connected'}`}>
                  {nimbuspostConnected ? 'Connected' : 'Not Connected'}
                </div>
              </div>

              <p className="integration-description">
                Connect your NimbusPost shipping aggregator account to access and manage your NDR (Non-Delivery Report) list. 
                Create credentials from your NimbusPost account and enter them below.
              </p>

              {nimbuspostConnected ? (
                <div className="connected-info">
                  <div className="connected-info-title">✅ Connected</div>
                  <div className="connected-info-detail">Email: {nimbuspostFormData.email}</div>
                  <button className="btn btn-secondary disconnect-btn" onClick={handleNimbuspostDisconnect}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="connection-form">
                  {nimbuspostError && <div className="error-message">{nimbuspostError}</div>}
                  <form onSubmit={handleNimbuspostConnect}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="nimbuspostEmail">Email</label>
                      <input
                        type="email"
                        id="nimbuspostEmail"
                        name="email"
                        className="form-input"
                        placeholder="Enter your NimbusPost email"
                        value={nimbuspostFormData.email}
                        onChange={(e) => setNimbuspostFormData({ ...nimbuspostFormData, email: e.target.value })}
                        required
                      />
                      <div className="form-hint">Enter your NimbusPost account email</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="nimbuspostPassword">Password</label>
                      <input
                        type="password"
                        id="nimbuspostPassword"
                        name="password"
                        className="form-input"
                        placeholder="Enter your password"
                        value={nimbuspostFormData.password}
                        onChange={(e) => setNimbuspostFormData({ ...nimbuspostFormData, password: e.target.value })}
                        required
                      />
                      <div className="form-hint">Enter your NimbusPost account password</div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={nimbuspostConnecting}>
                      {nimbuspostConnecting ? 'Connecting...' : 'Connect NimbusPost'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Shiprocket View */}
      {selectedCard === 'shiprocket' && (
        <>
          <h2 className="settings-page-title">Shiprocket NDR Integration</h2>
          <div className="settings-section">
            <p className="section-subtitle">Connect your Shiprocket shipping aggregator account to manage NDR list</p>
            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-title">
                  <div className="integration-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 14H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Shiprocket</span>
                </div>
                <div className={`status-badge ${shiprocketConnected ? 'status-connected' : 'status-not-connected'}`}>
                  {shiprocketConnected ? 'Connected' : 'Not Connected'}
                </div>
              </div>

              <p className="integration-description">
                Connect your Shiprocket shipping aggregator account to access and manage your NDR (Non-Delivery Report) list. 
                Create credentials from your Shiprocket account and enter them below.
              </p>

              {shiprocketConnected ? (
                <div className="connected-info">
                  <div className="connected-info-title">✅ Connected</div>
                  <div className="connected-info-detail">Email: {shiprocketFormData.email}</div>
                  <button className="btn btn-secondary disconnect-btn" onClick={handleShiprocketDisconnect}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="connection-form">
                  {shiprocketError && <div className="error-message">{shiprocketError}</div>}
                  <form onSubmit={handleShiprocketConnect}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="shiprocketEmail">Email</label>
                      <input
                        type="email"
                        id="shiprocketEmail"
                        name="email"
                        className="form-input"
                        placeholder="Enter your Shiprocket email"
                        value={shiprocketFormData.email}
                        onChange={(e) => setShiprocketFormData({ ...shiprocketFormData, email: e.target.value })}
                        required
                      />
                      <div className="form-hint">Enter your Shiprocket account email</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="shiprocketPassword">Password</label>
                      <input
                        type="password"
                        id="shiprocketPassword"
                        name="password"
                        className="form-input"
                        placeholder="Enter your password"
                        value={shiprocketFormData.password}
                        onChange={(e) => setShiprocketFormData({ ...shiprocketFormData, password: e.target.value })}
                        required
                      />
                      <div className="form-hint">Enter your Shiprocket account password</div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={shiprocketConnecting}>
                      {shiprocketConnecting ? 'Connecting...' : 'Connect Shiprocket'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Account Settings View */}
      {selectedCard === 'account-settings' && shop && (() => {
        // Generate logs from real calls per hour data
        const generateTimeBasedLogs = () => {
          if (!callsPerHourData || callsPerHourData.length === 0) {
            return [];
          }
          
          return callsPerHourData.map(item => {
            const hourDate = new Date(item.hour);
            const nextHour = new Date(hourDate.getTime() + 60 * 60 * 1000);
            const hourStr = hourDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const nextHourStr = nextHour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            // For now, we'll show call count. Pickup rate and conversion rate would need additional API data
            const callCount = item.count || 0;
            // Placeholder for pickup/conversion rates (would need additional API endpoint)
            const pickupRate = 'N/A'; // Would need call outcome data
            const conversionRate = 'N/A'; // Would need call outcome data
            
            return {
              timing: `${hourStr} - ${nextHourStr}`,
              pickupRate: pickupRate,
              conversionRate: conversionRate,
              callCount: callCount
            };
          });
        };

        const generateCallsBasedLogs = () => {
          if (!callsPerHourData || callsPerHourData.length === 0) {
            return [{ timing: 'All Call Logs', pickupRate: 'N/A', conversionRate: 'N/A' }];
          }
          
          const totalCalls = callsPerHourData.reduce((sum, item) => sum + (item.count || 0), 0);
          return [
            { timing: 'All Call Logs', pickupRate: 'N/A', conversionRate: 'N/A', callCount: totalCalls }
          ];
        };

        const allTimeBasedLogs = generateTimeBasedLogs();
        const allCallsBasedLogs = generateCallsBasedLogs();
        const currentLogs = logsViewType === 'time-based' ? allTimeBasedLogs : allCallsBasedLogs;
        const totalPages = Math.ceil(currentLogs.length / logsPerPage);
        const paginatedLogs = currentLogs.slice((logsPage - 1) * logsPerPage, logsPage * logsPerPage);

        // Generate graph data from real calls per hour data (last 12 data points for graph)
        const getGraphData = (dataArray, maxValue) => {
          if (!dataArray || dataArray.length === 0) {
            return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
          const last12 = dataArray.slice(-12);
          const values = last12.map(item => item.count || 0);
          // Normalize to 0-100 scale
          const max = Math.max(...values, 1);
          return values.map(val => (val / max) * 100);
        };

        const speedGraphData = getGraphData(callsPerHourData, 20);
        const queueGraphData = Array(12).fill((accountHealthMetrics.inQueue / 30) * 100).map(val => Math.min(100, val));
        const healthGraphData = speedGraphData; // Use speed data as health indicator

        return (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Account Settings</h2>

            {/* Metrics Tabs - Always Visible */}
            <div className="account-metrics-section">
              <div className="account-metrics-grid">
                {/* Account Health Tab */}
                <div className="account-metric-card">
                  <div className="account-metric-header">
                    <img src="/images/Raycons Icons Pack (Community)/health-8532162.svg" alt="Health" className="account-metric-icon" />
                    <h3 className="account-metric-title">Account Health</h3>
                </div>
                  <div className="account-metric-content">
                    {accountHealthLoading ? (
                      <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading...</div>
                    ) : (
                      <div className="account-metric-status">
                        <span className={`account-status-badge ${
                          accountHealthMetrics.status === 'active' ? 'active' : 
                          accountHealthMetrics.status === 'inactive' ? 'inactive' :
                          'inactive'
                        }`}>
                          {accountHealthMetrics.status === 'active' ? 'Active' : 
                           accountHealthMetrics.status === 'inactive' ? 'Inactive' :
                           accountHealthMetrics.status || 'Loading...'}
                        </span>
                </div>
                    )}
                    <div className="account-metric-graph">
                      <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none">
                        <polyline
                          points={healthGraphData.map((val, i) => `${(i * 10)},${40 - (val / 100) * 40}`).join(' ')}
                          fill="none"
                          stroke="#111827"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
              </div>
            </div>
          </div>

                {/* Speed Orders/hr Tab */}
                <div className="account-metric-card">
                  <div className="account-metric-header">
                    <img src="/images/Raycons Icons Pack (Community)/speedometer-8535820.svg" alt="Speed" className="account-metric-icon" />
                    <h3 className="account-metric-title">Speed Orders/hr</h3>
                </div>
                  <div className="account-metric-content">
                    {accountHealthLoading ? (
                      <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading...</div>
                    ) : (
                      <div className="account-metric-value">
                        <span className="account-metric-number">{accountHealthMetrics.speedOrdersPerHour}</span>
                        <span className="account-metric-unit">orders/hr</span>
                      </div>
                    )}
                    <div className="account-metric-graph">
                      <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none">
                        <polyline
                          points={speedGraphData.map((val, i) => `${(i * 10)},${40 - (val / 20) * 40}`).join(' ')}
                          fill="none"
                          stroke="#111827"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
              </div>
            </div>
          </div>

                {/* In Queue Tab */}
                <div className="account-metric-card">
                  <div className="account-metric-header">
                    <img src="/images/Raycons Icons Pack (Community)/activity-8532257.svg" alt="Queue" className="account-metric-icon" />
                    <h3 className="account-metric-title">In Queue</h3>
                </div>
                  <div className="account-metric-content">
                    {accountHealthLoading ? (
                      <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading...</div>
                    ) : (
                      <div className="account-metric-value">
                        <span className="account-metric-number">{accountHealthMetrics.inQueue}</span>
                        <span className="account-metric-unit">items</span>
                      </div>
                    )}
                    <div className="account-metric-graph">
                      <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none">
                        <polyline
                          points={queueGraphData.map((val, i) => `${(i * 10)},${40 - (val / 30) * 40}`).join(' ')}
                          fill="none"
                          stroke="#111827"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                </div>
              </div>
                </div>
                </div>
              </div>

            {/* Logs Table Section */}
            <div className="profile-detail-section">
              <div className="account-logs-header">
                <h3 className="profile-detail-subheading">Call Logs</h3>
                <div className="account-logs-toggle">
                  <button
                    className={`account-logs-toggle-btn ${logsViewType === 'time-based' ? 'active' : ''}`}
                    onClick={() => {
                      setLogsViewType('time-based');
                      setLogsPage(1);
                    }}
                  >
                    Time Based
                  </button>
                  <button
                    className={`account-logs-toggle-btn ${logsViewType === 'calls-based' ? 'active' : ''}`}
                    onClick={() => {
                      setLogsViewType('calls-based');
                      setLogsPage(1);
                    }}
                  >
                    Calls Based
                  </button>
                </div>
              </div>
              <div className="profile-detail-box">
                <table className="account-logs-table">
                  <thead>
                    <tr>
                      <th>Timing</th>
                      <th>Calls</th>
                      <th>Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountHealthLoading ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                          Loading...
                        </td>
                      </tr>
                    ) : paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log, index) => (
                        <tr key={index}>
                          <td>{log.timing}</td>
                          <td>{log.callCount !== undefined ? `${log.callCount} calls` : log.pickupRate}</td>
                          <td>{log.conversionRate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                          No logs available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="account-logs-footer">
                  {totalPages > 1 && (
                    <div className="account-logs-pagination">
                      <button
                        className="account-pagination-btn"
                        onClick={() => setLogsPage(Math.max(1, logsPage - 1))}
                        disabled={logsPage === 1}
                      >
                        <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Previous" />
                        Previous
                      </button>
                      <span className="account-pagination-info">
                        Page {logsPage} of {totalPages}
                  </span>
                      <button
                        className="account-pagination-btn"
                        onClick={() => setLogsPage(Math.min(totalPages, logsPage + 1))}
                        disabled={logsPage === totalPages}
                      >
                        Next
                        <img src="/images/Raycons Icons Pack (Community)/arrow-right-8532512.svg" alt="Next" />
                      </button>
                </div>
                  )}
                  <div className="account-logs-export">
                    <button
                      className="account-export-btn"
                      onClick={() => {
                        // Export functionality - convert table data to CSV
                        const csvHeaders = ['Timing', 'Calls', 'Conversion Rate'];
                        const csvRows = currentLogs.map(log => [
                          log.timing,
                          log.callCount !== undefined ? log.callCount : log.pickupRate,
                          log.conversionRate
                        ]);
                        const csvContent = [
                          csvHeaders.join(','),
                          ...csvRows.map(row => row.join(','))
                        ].join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `call-logs-${logsViewType}-${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <img src="/images/Raycons Icons Pack (Community)/export-8532464.svg" alt="Export" />
                      Export CSV
                    </button>
              </div>
            </div>
          </div>
        </div>
          </div>
        );
      })()}

      {/* Knowledge Books View */}
      {selectedCard === 'knowledge-books' && shop && (
        <div className="profile-page-container">
          {/* Header with Back Button and Title */}
          <div className="profile-page-header">
            <button className="profile-back-button" onClick={handleBackToCards}>
              <img src="/images/Raycons Icons Pack (Community)/arrow-left-8532508.svg" alt="Back" />
              Back to Settings
            </button>
          </div>
          <h2 className="profile-page-title">Knowledge Books</h2>

          {/* Create Button */}
          {!showKnowledgeBookForm && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button
                onClick={() => {
                  setEditingKnowledgeBookId(null);
                  setKnowledgeBookFormData({ name: '', description: '', content: '', websiteLink: '', extraContent: '' });
                  setShowKnowledgeBookForm(true);
                }}
                className="profile-save-button-new"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <img src="/images/Raycons Icons Pack (Community)/add-8535609.svg" alt="Add" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                Create Knowledge Book
              </button>
            </div>
          )}

          {/* Knowledge Book Form */}
          {showKnowledgeBookForm && (
            <form onSubmit={handleKnowledgeBookSubmit}>
              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">{editingKnowledgeBookId ? 'Edit Knowledge Book' : 'Create Knowledge Book'}</h3>
                <div className="profile-detail-box">
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Name *</span>
                      <span className="profile-detail-hint">e.g., Product Catalog, Brand Guidelines</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="text"
                        className="profile-detail-input"
                        value={knowledgeBookFormData.name}
                        onChange={(e) => setKnowledgeBookFormData({ ...knowledgeBookFormData, name: e.target.value })}
                        required
                        placeholder="Enter knowledge book name"
                      />
                    </div>
                  </div>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Description</span>
                      <span className="profile-detail-hint">Brief description of this knowledge book</span>
                    </div>
                    <div className="profile-detail-action">
                      <input
                        type="text"
                        className="profile-detail-input"
                        value={knowledgeBookFormData.description}
                        onChange={(e) => setKnowledgeBookFormData({ ...knowledgeBookFormData, description: e.target.value })}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">Website Link</h3>
                <div className="profile-detail-box">
                  <div className="profile-detail-item">
                    <div className="profile-detail-label">
                      <span>Brand/Website Link</span>
                      <span className="profile-detail-hint">Enter your website URL and click Fetch to automatically extract brand information using AI</span>
                    </div>
                    <div className="profile-detail-action" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="url"
                        className="profile-detail-input"
                        value={knowledgeBookFormData.websiteLink}
                        onChange={(e) => setKnowledgeBookFormData({ ...knowledgeBookFormData, websiteLink: e.target.value })}
                        placeholder="https://example.com"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleFetchWebsite}
                        disabled={isFetchingWebsite || !knowledgeBookFormData.websiteLink.trim()}
                        className="profile-save-button-new"
                        style={{ whiteSpace: 'nowrap', opacity: isFetchingWebsite || !knowledgeBookFormData.websiteLink.trim() ? 0.6 : 1 }}
                      >
                        {isFetchingWebsite ? 'Fetching...' : 'Fetch'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-detail-section">
                <h3 className="profile-detail-subheading">Content</h3>
                <div className="profile-detail-box">
                  <div className="profile-detail-item" style={{ alignItems: 'flex-start', padding: '16px 20px' }}>
                    <div className="profile-detail-label">
                      <span>Content (Fetched From Website) *</span>
                      <span className="profile-detail-hint">Or you can add manually too if no website</span>
                    </div>
                    <div className="profile-detail-action" style={{ flex: 1, maxWidth: '60%' }}>
                      <textarea
                        rows="10"
                        className="profile-detail-input"
                        value={knowledgeBookFormData.content}
                        onChange={(e) => setKnowledgeBookFormData({ ...knowledgeBookFormData, content: e.target.value })}
                        required
                        placeholder="Enter knowledge book content..."
                        style={{ width: '100%', resize: 'vertical', minHeight: '200px' }}
                      />
                    </div>
                  </div>
                  <hr className="profile-detail-divider" />
                  <div className="profile-detail-item" style={{ alignItems: 'flex-start', padding: '16px 20px' }}>
                    <div className="profile-detail-label">
                      <span>Add FAQs, Information..</span>
                      <span className="profile-detail-hint">Optional: Add supplementary information, FAQs, or specific guidelines</span>
                    </div>
                    <div className="profile-detail-action" style={{ flex: 1, maxWidth: '60%' }}>
                      <textarea
                        rows="6"
                        className="profile-detail-input"
                        value={knowledgeBookFormData.extraContent}
                        onChange={(e) => setKnowledgeBookFormData({ ...knowledgeBookFormData, extraContent: e.target.value })}
                        placeholder="Add any additional details..."
                        style={{ width: '100%', resize: 'vertical', minHeight: '120px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="profile-save-container">
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowKnowledgeBookForm(false);
                      setEditingKnowledgeBookId(null);
                      setKnowledgeBookFormData({ name: '', description: '', content: '', websiteLink: '', extraContent: '' });
                    }}
                    className="profile-save-button-new"
                    style={{ background: 'transparent', border: '1px solid #D1D5DB', color: '#111827' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-save-button-new"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingKnowledgeBookId ? 'Update Knowledge Book' : 'Create Knowledge Book'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Knowledge Books List */}
          {!showKnowledgeBookForm && (
            <>
              {knowledgeBooks.length === 0 ? (
                <div className="profile-detail-box">
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    <img src="/images/Raycons Icons Pack (Community)/book-8535533.svg" alt="Book" style={{ width: '48px', height: '48px', opacity: 0.5, marginBottom: '16px' }} />
                    <p>No knowledge books yet. Create one to get started.</p>
                  </div>
                </div>
              ) : (
                knowledgeBooks.map((kb, index) => (
                  <div key={kb.id} className="profile-detail-box" style={{ marginTop: index > 0 ? '32px' : '0' }}>
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span>Name</span>
                      </div>
                      <div className="profile-detail-action">
                        <span className="profile-detail-value">{kb.name}</span>
                      </div>
                    </div>
                    {kb.description && (
                      <>
                        <hr className="profile-detail-divider" />
                        <div className="profile-detail-item">
                          <div className="profile-detail-label">
                            <span>Description</span>
                          </div>
                          <div className="profile-detail-action">
                            <span className="profile-detail-value">{kb.description}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <hr className="profile-detail-divider" />
                    <div className="profile-detail-item" style={{ alignItems: 'flex-start' }}>
                      <div className="profile-detail-label">
                        <span>Content Preview</span>
                      </div>
                      <div className="profile-detail-action" style={{ flex: 1, maxWidth: '60%' }}>
                        <div style={{
                          padding: '12px',
                          background: '#F9FAFB',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#374151',
                          maxHeight: '150px',
                          overflowY: 'auto'
                        }}>
                          {kb.content?.substring(0, 200)}{kb.content?.length > 200 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                    <hr className="profile-detail-divider" />
                    <div className="profile-detail-item">
                      <div className="profile-detail-label">
                        <span></span>
                      </div>
                      <div className="profile-detail-action" style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingKnowledgeBookId(kb.id);
                            setKnowledgeBookFormData({
                              name: kb.name,
                              description: kb.description || '',
                              content: kb.content || '',
                              websiteLink: kb.websiteLink || '',
                              extraContent: kb.extraContent || ''
                            });
                            setShowKnowledgeBookForm(true);
                          }}
                          className="profile-save-button-new"
                          style={{ background: 'transparent', border: '1px solid #D1D5DB', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <img src="/images/Raycons Icons Pack (Community)/edit-8535505.svg" alt="Edit" style={{ width: '16px', height: '16px' }} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteKnowledgeBook(kb.id)}
                          className="profile-save-button-new"
                          style={{ background: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <img src="/images/Raycons Icons Pack (Community)/minus-cirlce-8535602-10.svg" alt="Delete" style={{ width: '16px', height: '16px', filter: 'brightness(0) invert(1)' }} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;