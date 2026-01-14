import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './TourSetup.css';

const TourSetup = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  const navigate = useNavigate();
  
  // Main step state
  const [activeStep, setActiveStep] = useState('integrate');
  const [activeSubStep, setActiveSubStep] = useState(0);
  
  // Shopify integration form state
  const [adminUrl, setAdminUrl] = useState('');
  const [extractedShopUrl, setExtractedShopUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  
  // Load completed steps from localStorage
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = localStorage.getItem('tour-setup-completed-steps');
    return saved ? JSON.parse(saved) : [];
  });

  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tour-setup-completed-steps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  // Reset sub-step when changing main step
  useEffect(() => {
    setActiveSubStep(0);
  }, [activeStep]);

  // Extract shop URL from admin URL
  const extractShopUrl = (url) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'admin.shopify.com') {
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        const storeIndex = pathParts.indexOf('store');
        if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
          const shopName = pathParts[storeIndex + 1];
          return `${shopName}.myshopify.com`;
        }
      }
      if (urlObj.hostname.endsWith('.myshopify.com')) {
        return urlObj.hostname;
      }
      const match = url.match(/store\/([^\/]+)/);
      if (match && match[1]) {
        return `${match[1]}.myshopify.com`;
      }
    } catch (e) {
      const match = url.match(/([a-zA-Z0-9-]+)\.myshopify\.com/);
      if (match) {
        return match[0];
      }
      const storeMatch = url.match(/store\/([a-zA-Z0-9-]+)/);
      if (storeMatch) {
        return `${storeMatch[1]}.myshopify.com`;
      }
    }
    return '';
  };

  const handleAdminUrlChange = (e) => {
    const url = e.target.value;
    setAdminUrl(url);
    const shopUrl = extractShopUrl(url);
    setExtractedShopUrl(shopUrl);
  };

  const handleVerifyAndInstall = () => {
    if (!extractedShopUrl || !clientId || !clientSecret) {
      alert('Please fill in all required fields: Shop URL, Client ID, and Client Secret');
      return;
    }
    if (!extractedShopUrl.endsWith('.myshopify.com')) {
      alert('Shop URL must end with .myshopify.com');
      return;
    }
    const params = new URLSearchParams({
      card: 'integrations',
      shop: extractedShopUrl,
      clientId: clientId,
      clientSecret: clientSecret,
      fromSetup: 'true'
    });
    navigate(`/settings?${params.toString()}`, { replace: false });
  };

  // Define main steps
  const steps = [
    { id: 'integrate', label: 'Integrate' },
    { id: 'dashboard', label: 'Dashboard View' },
    { id: 'configure-agent', label: 'Configure Agent' },
    { id: 'extra-features', label: 'Extra Features' }
  ];

  // Define sub-steps for Integrate
  const integrateSubSteps = [
    {
      id: 'get-shop-url',
      title: 'Get Your Shop URL from Admin Link',
      content: (
        <div className="tour-content">
          <p><strong>What you need:</strong> Your Shopify admin page URL (e.g., <code>https://admin.shopify.com/store/yourstore</code>)</p>
          <div className="step-image-container">
            <img src="/images/01_admin link.png" alt="Shopify Admin URL" className="step-image" />
          </div>
          <div className="input-group">
            <label htmlFor="adminUrl">Paste your Shopify admin URL:</label>
            <input
              type="text"
              id="adminUrl"
              value={adminUrl}
              onChange={handleAdminUrlChange}
              placeholder="https://admin.shopify.com/store/yourstore"
              className="tour-input"
            />
          </div>
          {extractedShopUrl && (
            <div className="extracted-shop-url">
              <strong>Extracted Shop URL:</strong> <code>{extractedShopUrl}</code>
            </div>
          )}
          <p className="step-note">We'll automatically extract your shop domain from URL. Make sure your admin URL is from <code>admin.shopify.com</code>.</p>
        </div>
      )
    },
    {
      id: 'navigate-app-dev',
      title: 'Navigate to Shopify App Development',
      content: (
        <div className="tour-content">
          <ol>
            <li>Go to your Shopify admin dashboard</li>
            <li>In bottom left corner, click on <strong>"Settings"</strong> (gear icon)</li>
            <li>Scroll down and click on <strong>"Apps and sales channels"</strong></li>
            <li>At top right, click <strong>"Develop apps"</strong> or <strong>"App development"</strong></li>
            <li>If prompted, click <strong>"Allow custom app development"</strong> to enable app development for your store</li>
          </ol>
          <div className="step-image-container">
            <img src="/images/02_01_settings.png" alt="Settings page" className="step-image" />
          </div>
          <p className="step-note"><strong>What you'll see:</strong> A page titled "Apps" with a button to "Create an app"</p>
        </div>
      )
    },
    {
      id: 'create-app',
      title: 'Create a New Custom App',
      content: (
        <div className="tour-content">
          <ol>
            <li>On "Apps" page, click <strong>"Create an app"</strong> button</li>
            <li>Enter an app name (e.g., "Scalysis Integration" or "Scalysis AI Calling")</li>
            <li>Enter an app developer email (your email address)</li>
            <li>Click <strong>"Create app"</strong></li>
          </ol>
          <div className="step-image-container">
            <img src="/images/03_01_create_app.png" alt="Create app button" className="step-image" />
          </div>
          <p className="step-note"><strong>What you'll see:</strong> A new app created with tabs: "Overview", "API credentials", "Configuration", etc.</p>
        </div>
      )
    },
    {
      id: 'configure-scopes',
      title: 'Configure API Scopes (Permissions)',
      content: (
        <div className="tour-content">
          <ol>
            <li>Click on <strong>"Configuration"</strong> tab in your app</li>
            <li>Scroll down to <strong>"Admin API integration"</strong> section</li>
            <li>Click <strong>"Configure"</strong> under Admin API integration</li>
            <li>You'll see a list of API scopes (permissions)</li>
          </ol>
          <div className="step-image-container">
            <img src="/images/04_01_scopes.png" alt="Configure API scopes" className="step-image" />
          </div>
          <p><strong>Copy and paste following scopes:</strong></p>
          <div className="copyable-text" onClick={(e) => {
            navigator.clipboard.writeText('read_all_orders,read_analytics,read_app_proxy,write_app_proxy,read_assigned_fulfillment_orders,write_assigned_fulfillment_orders,read_customer_events,read_custom_fulfillment_services,write_custom_fulfillment_services,read_custom_pixels,write_custom_pixels,read_customers,write_customers,read_customer_data_erasure,write_customer_data_erasure,read_customer_merge,write_customer_merge,read_delivery_customizations,write_delivery_customizations,write_draft_orders,read_draft_orders,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders,write_order_edits,read_order_edits,read_orders,write_orders,read_payment_customizations,write_payment_customizations,read_third_party_fulfillment_orders,write_third_party_fulfillment_orders,customer_read_companies,customer_write_companies,customer_write_customers,customer_read_customers,customer_read_draft_orders,customer_read_markets,customer_read_orders,customer_write_orders,customer_read_quick_sale,customer_write_quick_sale,customer_read_store_credit_account_transactions,customer_read_store_credit_accounts,unauthenticated_write_customers,unauthenticated_read_customers,unauthenticated_read_customer_tags');
            e.target.style.background = '#dcfce7';
            setTimeout(() => { e.target.style.background = '#f9fafb'; }, 1000);
          }}>
            read_all_orders,read_analytics,read_app_proxy,write_app_proxy,read_assigned_fulfillment_orders,write_assigned_fulfillment_orders,read_customer_events,read_custom_fulfillment_services,write_custom_fulfillment_services,read_custom_pixels,write_custom_pixels,read_customers,write_customers,read_customer_data_erasure,write_customer_data_erasure,read_customer_merge,write_customer_merge,read_delivery_customizations,write_delivery_customizations,write_draft_orders,read_draft_orders,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders,write_order_edits,read_order_edits,read_orders,write_orders,read_payment_customizations,write_payment_customizations,read_third_party_fulfillment_orders,write_third_party_fulfillment_orders,customer_read_companies,customer_write_companies,customer_write_customers,customer_read_customers,customer_read_draft_orders,customer_read_markets,customer_read_orders,customer_write_orders,customer_read_quick_sale,customer_write_quick_sale,customer_read_store_credit_account_transactions,customer_read_store_credit_accounts,unauthenticated_write_customers,unauthenticated_read_customers,unauthenticated_read_customer_tags
          </div>
          <p><strong>App URL (click to copy):</strong></p>
          <div className="copyable-text" onClick={(e) => {
            navigator.clipboard.writeText('https://scalysis-app.onrender.com/');
            e.target.style.background = '#dcfce7';
            setTimeout(() => { e.target.style.background = '#f9fafb'; }, 1000);
          }}>
            https://scalysis-app.onrender.com/
          </div>
          <p><strong>Redirect URLs (click to copy):</strong></p>
          <div className="copyable-text" onClick={(e) => {
            navigator.clipboard.writeText('https://scalysis-app.onrender.com/auth/callback');
            e.target.style.background = '#dcfce7';
            setTimeout(() => { e.target.style.background = '#f9fafb'; }, 1000);
          }}>
            https://scalysis-app.onrender.com/auth/callback
          </div>
          <p>After entering scopes and URLs, scroll down and click <strong>"Save"</strong></p>
          <div className="step-image-container">
            <img src="/images/04_02_callback.png" alt="Callback URL configuration" className="step-image" />
          </div>
          <div className="step-image-container">
            <img src="/images/04_03_release_version.png" alt="Release version" className="step-image" />
          </div>
          <p className="step-note"><strong>What you'll see:</strong> A confirmation that scopes have been saved. The app status will show as "Configured".</p>
        </div>
      )
    },
    {
      id: 'get-credentials',
      title: 'Get Your API Credentials',
      content: (
        <div className="tour-content">
          <ol>
            <li>Click on <strong>"API credentials"</strong> tab in your app</li>
            <li>You'll see two important values:</li>
          </ol>
          <div className="step-image-container">
            <img src="/images/05_01_client_secret.png" alt="API credentials" className="step-image" />
          </div>
          <div className="credentials-info">
            <div className="credential-item">
              <h4>Client ID:</h4>
              <ul>
                <li>This is displayed as <strong>"Client ID"</strong> or <strong>"API key"</strong></li>
                <li>Click <strong>"Show"</strong> or <strong>"Reveal"</strong> button to see it</li>
                <li>Copy this value - you'll need it in the next step</li>
              </ul>
            </div>
            <div className="credential-item">
              <h4>Client Secret:</h4>
              <ul>
                <li>This is displayed as <strong>"Client secret"</strong></li>
                <li>Click <strong>"Show"</strong> or <strong>"Reveal"</strong> button to see it</li>
                <li>Copy this value - you'll need it in the next step</li>
              </ul>
            </div>
          </div>
          <div className="step-warning">
            <strong>🔒 Security Note:</strong> Keep these credentials secure. Never share them publicly. If compromised, you can regenerate them from this page.
          </div>
        </div>
      )
    },
    {
      id: 'enter-credentials',
      title: 'Enter Credentials in Scalysis',
      content: (
        <div className="tour-content">
          <p>You should have three pieces of information ready:</p>
          <ul>
            <li><strong>Shop URL</strong> (from Step 1)</li>
            <li><strong>Client ID</strong> (from Step 5)</li>
            <li><strong>Client Secret</strong> (from Step 5)</li>
          </ul>
          <div className="credentials-form">
            <div className="input-group">
              <label htmlFor="shopUrl">Shop URL:</label>
              <input
                type="text"
                id="shopUrl"
                value={extractedShopUrl}
                readOnly
                className="tour-input"
                placeholder="Will be auto-filled from Step 1"
              />
            </div>
            <div className="input-group">
              <label htmlFor="clientId">Client ID:</label>
              <input
                type="text"
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Paste your Client ID"
                className="tour-input"
              />
            </div>
            <div className="input-group">
              <label htmlFor="clientSecret">Client Secret:</label>
              <input
                type="password"
                id="clientSecret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Paste your Client Secret"
                className="tour-input"
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyAndInstall}
              className="verify-install-btn"
              disabled={!extractedShopUrl || !clientId || !clientSecret}
            >
              Verify and Install
            </button>
          </div>
          <p className="step-note"><strong>What happens:</strong> Scalysis will verify your credentials. If valid, you'll be redirected to Integrations page. Your shop will be connected and ready to use.</p>
        </div>
      )
    },
    {
      id: 'complete-installation',
      title: 'Complete Installation',
      content: (
        <div className="tour-content">
          <ol>
            <li>After entering credentials, you'll be redirected to <strong>Integrations</strong> page</li>
            <li>Your shop information will be pre-filled</li>
            <li>Click <strong>"Install"</strong> or <strong>"Connect"</strong> button</li>
            <li>You may be redirected to Shopify to authorize the connection</li>
            <li>Click <strong>"Install app"</strong> on Shopify authorization page</li>
            <li>You'll be redirected back to Scalysis</li>
          </ol>
          <p className="step-note"><strong>What you'll see:</strong> A success message confirming integration. Your shop listed in Integrations page. Status showing as "Connected".</p>
        </div>
      )
    }
  ];

  // Define sub-steps for Dashboard
  const dashboardSubSteps = [
    {
      id: 'analytics-tab',
      title: 'Analytics Tab Overview',
      content: (
        <div className="tour-content">
          <p>The Analytics tab shows comprehensive analytics about your calls:</p>
          <div className="step-image-container">
            <img src="/images/02_01_settings.png" alt="Analytics Tab" className="step-image" />
          </div>
          <ul>
            <li><strong>Daily Calls:</strong> - Bar chart showing call volume over time</li>
            <li><strong>Call Statistics:</strong> - Total calls, successful calls, failed calls, and success rate</li>
            <li><strong>Performance Metrics:</strong> - Average call duration, success rate trends</li>
            <li><strong>Agent Performance:</strong> - See how each agent (script) is performing</li>
            <li><strong>Memoji Cards:</strong> - Visual representation of your agents with their success rates and call counts</li>
          </ul>
          <div className="tour-tip">
            <strong>💡 Tip:</strong> Check analytics regularly to monitor your call performance and identify areas for improvement.
          </div>
        </div>
      )
    },
    {
      id: 'orders-tab',
      title: 'Today\'s Orders Tab',
      content: (
        <div className="tour-content">
          <p>View and manage today's orders with RTO (Return to Origin) analysis:</p>
          <div className="step-image-container">
            <img src="/images/03_01_create_app.png" alt="Today's Orders Tab" className="step-image" />
          </div>
          <ul>
            <li><strong>RTO Buckets:</strong> - Orders categorized by RTO status (Confirmed, Pending, Cancelled, etc.)</li>
            <li><strong>Order Details:</strong> - Click on any order to see full details</li>
            <li><strong>Mini Graphs:</strong> - Visual trends for each RTO bucket</li>
            <li><strong>Quick Actions:</strong> - Filter and search through orders</li>
          </ul>
          <div className="tour-tip">
            <strong>💡 Tip:</strong> Use RTO buckets to quickly identify orders that need attention.
          </div>
        </div>
      )
    },
    {
      id: 'key-features',
      title: 'Dashboard Key Features',
      content: (
        <div className="tour-content">
          <h3>Key Features:</h3>
          <div className="step-image-container">
            <img src="/images/04_01_scopes.png" alt="Dashboard Features" className="step-image" />
          </div>
          <ul>
            <li>
              <strong>Real-time Updates:</strong>
              <p> - The dashboard updates in real-time as calls are made and orders are processed.</p>
            </li>
            <li>
              <strong>Agent Cards:</strong>
              <p> - Each agent is displayed as a card with agent name, total calls, and success rate.</p>
            </li>
            <li>
              <strong>RTO Analysis:</strong>
              <p> - The RTO bucket system helps you understand order statuses.</p>
            </li>
            <li>
              <strong>Blur Overlay for Test Shops:</strong>
              <p> - If your shop isn't connected, dashboard will show a blur overlay with a "Connect to Shopify" button.</p>
            </li>
          </ul>
          <div className="tour-tip">
            <strong>💡 Tip:</strong> The dashboard is your command center. Check it regularly to monitor your call performance.
          </div>
        </div>
      )
    },
    {
      id: 'navigation-tips',
      title: 'Navigation Tips',
      content: (
        <div className="tour-content">
          <p>Navigation Tips for using the dashboard effectively:</p>
          <div className="step-image-container">
            <img src="/images/05_01_client_secret.png" alt="Navigation Tips" className="step-image" />
          </div>
          <ul>
            <li><strong>Use tabs at top:</strong> - Switch between Analytics and Today's Orders</li>
            <li><strong>Click agent card:</strong> - View detailed performance for any agent</li>
            <li><strong>Click RTO buckets:</strong> - Filter orders by status</li>
            <li><strong>Use search and filter:</strong> - Find specific orders quickly</li>
          </ul>
          <div className="tour-tip">
            <strong>💡 Tip:</strong> The dashboard is your command center. Check it regularly to monitor your call performance.
          </div>
        </div>
      )
    }
  ];

  const toggleStepCompletion = (stepId, e) => {
    e.stopPropagation();
    setCompletedSteps(prev => {
      if (prev.includes(stepId)) {
        return prev.filter(id => id !== stepId);
      } else {
        return [...prev, stepId];
      }
    });
  };

  const isStepCompleted = (stepId) => {
    return completedSteps.includes(stepId);
  };

  const handleNextSubStep = () => {
    if (activeStep === 'integrate') {
      if (activeSubStep < integrateSubSteps.length - 1) {
        setActiveSubStep(activeSubStep + 1);
      }
    } else if (activeStep === 'dashboard') {
      if (activeSubStep < dashboardSubSteps.length - 1) {
        setActiveSubStep(activeSubStep + 1);
      }
    } else {
      const currentIndex = steps.findIndex(s => s.id === activeStep);
      if (currentIndex < steps.length - 1) {
        setActiveStep(steps[currentIndex + 1].id);
      }
    }
  };

  const handlePreviousSubStep = () => {
    if (activeStep === 'integrate') {
      if (activeSubStep > 0) {
        setActiveSubStep(activeSubStep - 1);
      }
    } else if (activeStep === 'dashboard') {
      if (activeSubStep > 0) {
        setActiveSubStep(activeSubStep - 1);
      }
    } else {
      const currentIndex = steps.findIndex(s => s.id === activeStep);
      if (currentIndex > 0) {
        setActiveStep(steps[currentIndex - 1].id);
      }
    }
  };

  const canGoNext = () => {
    if (activeStep === 'integrate') {
      return activeSubStep < integrateSubSteps.length - 1;
    } else if (activeStep === 'dashboard') {
      return activeSubStep < dashboardSubSteps.length - 1;
    }
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    return currentIndex < steps.length - 1;
  };

  const canGoPrevious = () => {
    if (activeStep === 'integrate') {
      return activeSubStep > 0;
    } else if (activeStep === 'dashboard') {
      return activeSubStep > 0;
    }
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    return currentIndex > 0;
  };

  const stepContent = {
    integrate: null,
    dashboard: null,
    'configure-agent': (
      <div className="tour-content">
        <h2>Configure Your AI Agent</h2>
        <p>Agents (also called Scripts) are AI-powered callers that interact with your customers. Configure them to match your business needs and communication style.</p>
        
        <h3>Creating a New Agent:</h3>
        <ol>
          <li><strong>Navigate to Call Scripts</strong> - Go to <strong>Call Scripts</strong> page from the sidebar.</li>
          <li><strong>Click "Create New Agent"</strong> - Start by giving your agent a name and basic description.</li>
          <li><strong>Configure Agent Settings</strong> - The agent configuration is organized into tabs.</li>
        </ol>
        
        <h3>Agent Configuration Tabs:</h3>
        
        <h4>📝 Script Tab</h4>
        <ul>
          <li><strong>Script Content:</strong> - Write your call script here. Use variables like <code>{'{{customer_name}}'}</code>, <code>{'{{order_number}}'}</code>, <code>{'{{order_amount}}'}</code> to personalize calls.</li>
          <li><strong>Pre-message:</strong> - Optional message that plays before the main script.</li>
          <li><strong>Content:</strong> - The main conversation flow. This is what AI will say during the call.</li>
          <li><strong>Success Criteria:</strong> - Define what constitutes a successful call.</li>
        </ul>
        
        <h4>🎤 Voice Tab</h4>
        <ul>
          <li><strong>Select Voice:</strong> - Choose from available voices or use your cloned voice.</li>
          <li><strong>Voice Preview:</strong> - Click on a voice card to open the preview modal.</li>
        </ul>
        
        <h4>🌐 Language Tab</h4>
        <ul>
          <li><strong>Language Selection:</strong> - Choose the primary language for your agent. This affects both speech-to-text and text-to-speech.</li>
        </ul>
        
        <h4>⚙️ Config Tab</h4>
        <ul>
          <li><strong>Initial Greeting:</strong> - First thing the agent says when the call connects. Default: "Hello {'{customer_name}'} ji se baat ho rahi hai?"</li>
          <li><strong>Pre-phrase:</strong> - Optional phrase added to responses (e.g., "ji" for politeness). Helps reduce latency and increase natural flow.</li>
          <li><strong>Custom Analysis:</strong> - Enable custom analysis to use your own prompts for call outcome determination.</li>
          <li><strong>35s Retry Logic:</strong> - Enable/disable automatic retries for calls under 35 seconds. Helps catch missed connections.</li>
          <li><strong>Max Retries:</strong> - Maximum number of retry attempts for failed calls.</li>
          <li><strong>Retry Interval:</strong> - Time between retry attempts (in minutes).</li>
        </ul>
        
        <div className="tour-tip">
          <strong>💡 Tip:</strong> Start with a simple script and gradually add complexity.
        </div>
      </div>
    ),
    'extra-features': (
      <div className="tour-content">
        <h2>Extra Features</h2>
        <p>Scalysis offers powerful additional features to enhance your calling experience and improve efficiency.</p>
        
        <h3>🎙️ Voice Cloning</h3>
        <p>Create a custom AI voice that sounds exactly like you or your team members.</p>
        <ul>
          <li><strong>Navigate to Voice Cloning:</strong> - Go to <strong>Voice Cloning</strong> from the sidebar.</li>
          <li><strong>Record or Upload Audio:</strong> - Record directly using your microphone or upload a WAV, MP3, or WebM file.</li>
          <li><strong>Use Your Cloned Voice:</strong> - Once created, your cloned voice will appear in the Voices tab.</li>
        </ul>
        
        <h3>📊 Call Analytics</h3>
        <ul>
          <li><strong>Detailed Statistics:</strong> - View comprehensive analytics about your calls including success rates, duration, and outcomes.</li>
          <li><strong>Agent Performance:</strong> - Compare performance across different agents to identify best practices.</li>
        </ul>
        
        <h3>📞 Call History</h3>
        <ul>
          <li><strong>Complete Call Logs:</strong> - View all calls made, including transcripts and outcomes.</li>
          <li><strong>Search and Filter:</strong> - Search through call history by date, agent, or outcome.</li>
        </ul>
        
        <h3>💰 Billing & Usage</h3>
        <ul>
          <li><strong>Wallet Balance:</strong> - View your current balance and recharge when needed. Balance is displayed in the sidebar footer.</li>
          <li><strong>Usage Tracking:</strong> - Monitor your call usage, costs, and remaining balance.</li>
          <li><strong>Pricing Plans:</strong> - View available pricing plans and choose one that fits your needs.</li>
        </ul>
        
        <div className="tour-tip">
          <strong>💡 Tip:</strong> Explore these features gradually to enhance your calling experience.
        </div>
      </div>
    )
  };

  const getSubStepTitle = () => {
    if (activeStep === 'integrate') {
      const subStep = integrateSubSteps[activeSubStep];
      return subStep ? subStep.title : '';
    } else if (activeStep === 'dashboard') {
      const subStep = dashboardSubSteps[activeSubStep];
      return subStep ? subStep.title : '';
    }
    return steps.find(s => s.id === activeStep)?.label || '';
  };

  const getCurrentSubStepCount = () => {
    if (activeStep === 'integrate') {
      return integrateSubSteps.length;
    } else if (activeStep === 'dashboard') {
      return dashboardSubSteps.length;
    }
    return 0;
  };

  const getCurrentSubStepContent = () => {
    if (activeStep === 'integrate') {
      return integrateSubSteps[activeSubStep]?.content;
    } else if (activeStep === 'dashboard') {
      return dashboardSubSteps[activeSubStep]?.content;
    }
    return null;
  };

  return (
    <div className="tour-setup-page">
      <div className="tour-progress-bar">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`tour-progress-step ${activeStep === step.id ? 'active' : ''} ${isStepCompleted(step.id) ? 'completed' : ''}`}
            onClick={() => setActiveStep(step.id)}
          >
            <div className="progress-circle">{isStepCompleted(step.id) ? '✓' : index + 1}</div>
            <span className="progress-label">{step.label}</span>
          </button>
        ))}
      </div>

      <div className="tour-main-card">
        <div className="tour-card-header">
          <h2 className="tour-card-title">{getSubStepTitle()}</h2>
          {(activeStep === 'integrate' || activeStep === 'dashboard') && (
            <div className="tour-substep-progress">
              {Array.from({ length: getCurrentSubStepCount() }).map((_, index) => (
                <div
                  key={index}
                  className={`substep-dot ${index === activeSubStep ? 'active' : ''} ${index < activeSubStep ? 'completed' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="tour-card-content">
          {getCurrentSubStepContent() || stepContent[activeStep]}
        </div>

        <div className="tour-card-footer">
          <button
            type="button"
            className="tour-nav-button prev"
            onClick={handlePreviousSubStep}
            disabled={!canGoPrevious()}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="tour-nav-button next"
            onClick={handleNextSubStep}
            disabled={!canGoNext()}
          >
            {canGoNext() ? 'Next →' : 'Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourSetup;
