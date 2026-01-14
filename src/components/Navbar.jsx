import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import RechargeModal from './RechargeModal';
import { useTutorial } from '../contexts/TutorialContext';

const Navbar = ({ activePage: activePageProp, shop, isCollapsed = false }) => {
  const location = useLocation();
  const { currentStep, currentStepData, isActive: isTutorialActive, nextStep } = useTutorial();
  const [walletBalance, setWalletBalance] = useState('Loading...');
  const [isTestShop, setIsTestShop] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage, default to 'light' - use try/catch for SSR safety
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [allOnboardingComplete, setAllOnboardingComplete] = useState(false);
  const navRef = useRef(null);
  
  // Check onboarding completion status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const saved = localStorage.getItem('onboarding-completed-steps');
        let completedSteps = saved ? JSON.parse(saved) : {};
        
        // Also check if step 1 auto-completes (integrations)
        if (!completedSteps.step1 && shop) {
          try {
            const shopifyResponse = await fetch('/api/integrations/status', {
              credentials: 'include'
            });
            const shopifyData = await shopifyResponse.json();
            const shopifyConnected = shopifyData.connected || false;

            const googleSheetsResponse = await fetch(`/api/google-sheets-settings?shop=${encodeURIComponent(shop)}`, {
              credentials: 'include'
            });
            const googleSheetsData = await googleSheetsResponse.json();
            const googleSheetsEnabled = googleSheetsData.success && googleSheetsData.settings?.googleSheetsEnabled;

            if (shopifyConnected || googleSheetsEnabled) {
              completedSteps.step1 = true;
            }
          } catch (error) {
            console.error('Error checking integration status:', error);
          }
        }

        const allComplete = completedSteps.step1 && 
                           completedSteps.step2 && 
                           completedSteps.step3 && 
                           completedSteps.step4 && 
                           completedSteps.step5;
        setAllOnboardingComplete(allComplete);
      } catch (error) {
        setAllOnboardingComplete(false);
      }
    };

    checkOnboardingStatus();

    // Listen for changes
    const handleStorageChange = () => {
      checkOnboardingStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('onboardingStepsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('onboardingStepsChanged', handleStorageChange);
    };
  }, [shop]);

  // Determine active page from route if not provided
  const getActivePage = () => {
    if (activePageProp) return activePageProp;
    const path = location.pathname;
    if (path.includes('onboarding')) return 'onboarding';
    if (path.includes('dashboard2.0') || (path.includes('dashboard') && !path.includes('2'))) return 'dashboard';
    if (path.includes('all-orders')) return 'all-orders';
    if (path.includes('campaigns')) return 'campaigns';
    if (path.includes('ndr')) return 'ndr';
    // HIDDEN: Run Simulation - See HIDDEN_FEATURES.md
    // if (path.includes('run-simulation')) return 'run-simulation';
    if (path.includes('test-call')) return 'test-call';
    // HIDDEN: RTO Insights - See HIDDEN_FEATURES.md
    // if (path === '/rto-analysis' || path.startsWith('/rto-analysis')) return 'rto-analysis';
    if (path.includes('usage')) return 'usage';
    // HIDDEN: Training Documents - See HIDDEN_FEATURES.md
    // if (path.includes('finetune-llm')) return 'finetune-llm';
    if (path.includes('playground')) return 'playground';
    if (path.includes('voices')) return 'voices';
    if (path.includes('clone-voice')) return 'clone-voice';
    // HIDDEN: Script Refining - See HIDDEN_FEATURES.md
    // if (path.includes('script-refining')) return 'script-refining';
    if (path.includes('setup-guide')) return 'setup-guide';
    if (path.includes('tour-setup')) return 'tour-setup';
    if (path.includes('settings')) return 'settings';
    if (path.includes('csv')) return 'csv';
    if (path.includes('scripts')) return 'scripts';
    if (path.includes('call-history')) return 'call-history';
    if (path.includes('stats')) return 'stats';
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('info')) return 'info';
    if (path.includes('phone-numbers')) return 'phone-numbers';
    if (path.includes('integrations')) return 'integrations';
    if (path.includes('performance')) return 'performance';
    if (path.includes('ai-calls')) return 'ai-calls';
    if (path.includes('time-calculator')) return 'time-calculator';
    if (path.includes('call-settings')) return 'call-settings';
    return 'dashboard';
  };

  const activePage = getActivePage();

  // Load wallet balance and check if test shop
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!shop) {
        setWalletBalance('No Shop');
        setIsTestShop(false);
        return;
      }

      try {
        const response = await fetch(`/api/shop-balance?shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          if (data.data.currentBalance !== undefined) {
          setWalletBalance(`₹${data.data.currentBalance.toFixed(2)}`);
          }
          // Check if test shop
          setIsTestShop(data.data.isTestShop === true);
        } else {
          setWalletBalance('₹0.00');
          setIsTestShop(false);
        }
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        setWalletBalance('Error');
        setIsTestShop(false);
      }
    };
    
    loadWalletBalance();
    const interval = setInterval(loadWalletBalance, 30000);
    return () => clearInterval(interval);
  }, [shop]);

  // Check scroll position and show/hide scroll buttons
  useEffect(() => {
    const checkScroll = () => {
      if (!navRef.current) return;
      
      const nav = navRef.current;
      const canScrollUp = nav.scrollTop > 0;
      const canScrollDown = nav.scrollTop < (nav.scrollHeight - nav.clientHeight - 10);
      
      setShowScrollUp(canScrollUp);
      setShowScrollDown(canScrollDown);
    };

    checkScroll();
    const nav = navRef.current;
    if (nav) {
      nav.addEventListener('scroll', checkScroll);
      // Also check on resize
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (nav) {
        nav.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, []); // Empty dependency array - scroll check doesn't depend on menu items

  const handleScrollUp = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ top: -100, behavior: 'smooth' });
    }
  };

  const handleScrollDown = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ top: 100, behavior: 'smooth' });
    }
  };

  const buildUrl = (href) => {
    if (!shop) return href;
    // Check if href already has query params
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}shop=${encodeURIComponent(shop)}`;
  };

  const handleRechargeClick = () => {
    console.log('[Navbar] Recharge clicked, shop:', shop);
    console.log('[Navbar] Setting showRechargeModal to true');
    setShowRechargeModal(true);
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Onboarding menu item
  const onboardingItem = {
    id: 'onboarding',
    label: 'Onboarding',
    href: '/onboarding',
    icon: <img src="/images/Raycons Icons Pack (Community)/book-8535533.svg" alt="" width="20" height="20" />,
    keywords: ['onboarding', 'getting started', 'setup', 'guide', 'tutorial']
  };

  // Split menu items into sections
  const operateItems = [
    // Only show onboarding at top if not all complete
    ...(allOnboardingComplete ? [] : [onboardingItem]),
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard2.0',
      icon: <img src="/images/dashboard.svg" alt="" width="20" height="20" />,
      keywords: ['dashboard', 'home', 'main', 'overview']
    },
    {
      id: 'all-orders',
      label: 'Shopify Orders',
      href: '/all-orders',
      icon: <img src="/images/csv.svg" alt="" width="20" height="20" />,
      keywords: ['orders', 'all orders', 'shopify orders', 'order list', 'order management']
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      href: '/campaigns',
      icon: <img src="/images/csv.svg" alt="" width="20" height="20" />,
      keywords: ['campaign', 'campaigns', 'marketing']
    },
    {
      id: 'ndr',
      label: 'NDR Orders',
      href: '/ndr',
      icon: <img src="/images/csv.svg" alt="" width="20" height="20" />,
      keywords: ['ndr', 'non delivery', 'non-delivery', 'return']
    },
    // HIDDEN: Run Simulation - See HIDDEN_FEATURES.md for details
    // {
    //   id: 'run-simulation',
    //   label: 'Run Simulation',
    //   href: '/run-simulation',
    //   icon: (
    //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    //       <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    //     </svg>
    //   ),
    //   keywords: ['simulation', 'simulate', 'test run', 'sim']
    // },
    {
      id: 'test-call',
      label: 'Test Agent',
      href: '/test-call',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      keywords: ['test', 'test call', 'test script', 'try', 'testing']
    }
  ];

  const analyticsItems = [
    // HIDDEN: RTO Insights - See HIDDEN_FEATURES.md for details
    // {
    //   id: 'rto-analysis',
    //   label: 'RTO Insights',
    //   href: '/rto-analysis',
    //   icon: <img src="/images/csv.svg" alt="" width="20" height="20" />,
    //   keywords: ['rto', 'return to origin', 'insights', 'analytics', 'returns']
    // },
    {
      id: 'stats',
      label: 'Billing',
      href: '/stats',
      icon: <img src="/images/usage.svg" alt="" width="20" height="20" />,
      keywords: ['billing', 'stats', 'statistics', 'usage', 'analytics', 'reports']
    }
  ];

  const voiceAutomationItems = [
    {
      id: 'playground',
      label: 'Call Agents',
      href: '/playground',
      icon: <img src="/images/agents.svg" alt="" width="20" height="20" />,
      keywords: ['script', 'scripts', 'call script', 'agent', 'agents', 'playground', 'ai agent']
    },
    // HIDDEN: Training Documents - See HIDDEN_FEATURES.md for details
    // {
    //   id: 'finetune-llm',
    //   label: 'Training Documents',
    //   href: '/finetune-llm',
    //   icon: (
    //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    //       <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    //     </svg>
    //   ),
    //   keywords: ['training', 'documents', 'llm', 'fine tune', 'finetune', 'train', 'data']
    // },
    {
      id: 'voices',
      label: 'Voice Library',
      href: '/voices',
      icon: <img src="/images/voices.svg" alt="" width="20" height="20" />,
      keywords: ['voice', 'voices', 'voice library', 'tts', 'text to speech', 'speech']
    },
    {
      id: 'clone-voice',
      label: 'Voice Cloning',
      href: '/clone-voice',
      icon: <img src="/images/clone.svg" alt="" width="20" height="20" />,
      keywords: ['clone', 'voice clone', 'mirror', 'mirrorvoice', 'clone voice', 'voice cloning']
    },
    // HIDDEN: Script Refining - See HIDDEN_FEATURES.md for details
    // {
    //   id: 'script-refining',
    //   label: 'Script Refining',
    //   href: '/script-refining',
    //   icon: (
    //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    //       <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    //       <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    //       <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    //     </svg>
    //   ),
    //   keywords: ['refining', 'refine', 'script refining', 'improve', 'optimize']
    // }
  ];

  const setupItems = [
    {
      id: 'tour-setup',
      label: 'Scalysis Setup Guide',
      href: '/tour-setup',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    // Show onboarding below Scalysis Setup Guide if all complete
    ...(allOnboardingComplete ? [onboardingItem] : []),
    // Setup Guide - only visible for test shops (non-real shops)
    ...(isTestShop ? [{
      id: 'setup-guide',
      label: 'Setup Guide',
      href: '/setup-guide',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }] : [])
  ];

   const settingsItems = [
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: <img src="/images/settings.svg" alt="" width="20" height="20" />
    },
    {
      id: 'call-settings',
      label: 'Auto Call Settings',
      href: '/call-settings',
      icon: <img src="/images/settings.svg" alt="" width="20" height="20" />,
      keywords: ['retry', 'inbound', 'call settings', 'retry settings', 'inbound settings', 'auto call', 'when to make calls', 'call routing', 'call configuration', 'call schedule']
    }
  ];

  // All searchable items including settings sub-sections
  const allSearchableItems = [
    ...operateItems.map(item => ({ ...item, section: 'Operate' })),
    ...analyticsItems.map(item => ({ ...item, section: 'Analytics' })),
    ...voiceAutomationItems.map(item => ({ ...item, section: 'Voice & Automation' })),
    ...setupItems.map(item => ({ ...item, section: 'Setup' })),
    ...settingsItems.map(item => ({ ...item, section: 'Settings' })),
    // Settings sub-sections with enhanced keywords
    { id: 'profile', label: 'Profile Settings', href: '/settings?card=profile', section: 'Settings', keywords: ['profile', 'user', 'account', 'avatar', 'name', 'email', 'personal', 'details'] },
    { id: 'integrations', label: 'Integrations', href: '/settings?card=integrations', section: 'Settings', keywords: ['integration', 'nimbuspost', 'shiprocket', 'ndr', 'webhook', 'connect', 'api'] },
    { id: 'phone-numbers', label: 'Phone Numbers', href: '/settings?card=phone-numbers', section: 'Settings', keywords: ['phone', 'number', 'caller id', 'callerid', 'caller', 'telephone', 'mobile'] },
    { id: 'retry-settings', label: 'Retry Settings', href: '/settings?card=retry', section: 'Settings', keywords: ['retry', 'attempts', 'interval', 'schedule', 'retries', 'call retry', 'retry logic'] },
    { id: 'inbound-settings', label: 'Inbound Call Settings', href: '/settings?card=inbound-settings', section: 'Settings', keywords: ['inbound', 'routing', 'phone', 'lookback', 'default script', 'inbound calls'] },
    { id: 'call-settings-page', label: 'Auto Call Settings', href: '/call-settings', section: 'Call Settings', keywords: ['call settings', 'retry', 'inbound', 'retry settings', 'inbound settings', 'auto call', 'when to make calls'] },
    { id: 'knowledge-books', label: 'Knowledge Books', href: '/settings?card=knowledge-books', section: 'Settings', keywords: ['knowledge', 'book', 'training', 'data', 'knowledge base', 'kb', 'documents'] },
    { id: 'app-info', label: 'App Info', href: '/settings?card=app-info', section: 'Settings', keywords: ['info', 'documentation', 'help', 'guide', 'docs', 'information', 'about'] },
    { id: 'customer-support', label: 'Customer Support', href: '/settings?card=customer-support', section: 'Settings', keywords: ['support', 'help', 'contact', 'customer service', 'assistance'] },
    { id: 'plans', label: 'Plans', href: '/settings?card=plans', section: 'Settings', keywords: ['plan', 'pricing', 'subscription', 'billing', 'payment', 'cost'] },
    { id: 'google-sheets', label: 'Google Sheets', href: '/settings?card=google-sheets', section: 'Settings', keywords: ['google', 'sheets', 'spreadsheet', 'excel', 'gsheet'] },
    { id: 'account-settings', label: 'Account Settings', href: '/settings?card=account-settings', section: 'Settings', keywords: ['account', 'widget', 'floating', 'token', 'limit', 'tokens', 'free tokens'] },
  ];

  // Search functionality - enhanced with better matching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    
    const results = allSearchableItems.filter(item => {
      const label = item.label.toLowerCase();
      const section = item.section?.toLowerCase() || '';
      const keywords = item.keywords?.map(k => k.toLowerCase()) || [];
      const id = item.id?.toLowerCase() || '';
      
      // Exact match gets highest priority
      if (label === query || id === query) {
        return true;
      }
      
      // Check if all query words are found (AND logic)
      const allWordsMatch = queryWords.every(word => {
        return label.includes(word) || 
               section.includes(word) ||
               keywords.some(k => k.includes(word)) ||
               id.includes(word);
      });
      
      if (allWordsMatch) {
        return true;
      }
      
      // Partial match - any word matches (OR logic for single word queries)
      if (queryWords.length === 1) {
        const word = queryWords[0];
        return label.includes(word) || 
               section.includes(word) ||
               keywords.some(k => k.includes(word)) ||
               id.includes(word);
      }
      
      return false;
    });

    // Sort results by relevance (exact matches first, then by label match)
    const sortedResults = results.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      
      // Exact match first
      if (aLabel === query && bLabel !== query) return -1;
      if (bLabel === query && aLabel !== query) return 1;
      
      // Starts with query
      if (aLabel.startsWith(query) && !bLabel.startsWith(query)) return -1;
      if (bLabel.startsWith(query) && !aLabel.startsWith(query)) return 1;
      
      // Alphabetical
      return aLabel.localeCompare(bLabel);
    });

    setSearchResults(sortedResults);
    setShowSearchResults(sortedResults.length > 0);
  }, [searchQuery]);

  // Helper function to render menu items
  const renderMenuItem = (item) => {
    const isActive = activePage === item.id;
    const tourClass = item.id === 'playground' ? 'tour-nav-playground' : 
                      item.id === 'test-call' ? 'tour-nav-testcall' : '';
    
    return (
      <li
        key={item.id}
        className={`menu__item ${isActive ? 'menu__item--active' : ''} ${tourClass}`}
      >
        {isActive && (
          <img 
            src="/images/Rectangle 756.svg" 
            alt="" 
            className="menu__item--active-indicator"
            aria-hidden="true"
          />
        )}
        {item.id === 'csv' ? (
          <a 
            href={buildUrl(item.href)} 
            className={`menu__btn ${tourClass}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="menu__icon" aria-hidden="true">{item.icon}</span>
            <span className="menu__label">{item.label}</span>
          </a>
        ) : (
          <Link 
            to={buildUrl(item.href)} 
            className={`menu__btn ${tourClass}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="menu__icon" aria-hidden="true">{item.icon}</span>
            <span className="menu__label">{item.label}</span>
          </Link>
        )}
      </li>
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Main navigation">
      <div className="sidebar__inner">
        <div className="sidebar__brand">
          <div className="brand__content">
            <img
              src="/nexcore.png"
              alt="NexCore"
              className="brand__logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const textEl = e.target.parentElement.querySelector('.brand__text');
                if (textEl) textEl.style.display = 'block';
              }}
            />
            <span className="brand__text">NexCore</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sidebar__search">

          <div className="search__container">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9AA0B2' }}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="search__input"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '20px',
              right: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000,
              marginTop: '4px'
            }}>
              {searchResults.map((item) => (
                <Link
                  key={item.id}
                  to={buildUrl(item.href)}
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    textDecoration: 'none',
                    color: '#111827',
                    borderBottom: '1px solid #F3F4F6',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '6px',
                    flexShrink: 0
                  }}>
                    {item.icon || (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {item.label}
                    </div>
                    {item.section && (
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        {item.section}
                      </div>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#9CA3AF' }}>
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <nav 
            ref={navRef}
            className="sidebar__nav" 
            role="navigation" 
            style={{ 
              padding: '0 20px 0 0',
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1
            }}
          >
            {/* OPERATE Section */}
            <ul className="menu menu--operate">
              <li className="menu__section-header">
                <span className="menu__section-title">OPERATE</span>
              </li>
              {operateItems.map(renderMenuItem)}
            </ul>

            {/* ANALYTICS Section */}
            <ul className="menu menu--analytics">
              <li className="menu__section-header">
                <span className="menu__section-title">ANALYTICS</span>
              </li>
              {analyticsItems.map(renderMenuItem)}
            </ul>

            {/* VOICE & AUTOMATION Section */}
            <ul className="menu menu--voice-automation">
              <li className="menu__section-header">
                <span className="menu__section-title">VOICE & AUTOMATION</span>
              </li>
              {voiceAutomationItems.map(renderMenuItem)}
            </ul>

            {/* SETUP Section */}
            <ul className="menu menu--setup">
              <li className="menu__section-header">
                <span className="menu__section-title">SETUP</span>
              </li>
              {setupItems.map(renderMenuItem)}
            </ul>
          </nav>
        </div>

        <div className="sidebar__footer" style={{ padding: '12px 20px 20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* SETTINGS Section */}
          <ul className="menu menu--settings">
            <li className="menu__section-header">
              <span className="menu__section-title">SETTINGS</span>
            </li>
            {settingsItems.map(renderMenuItem)}
          </ul>
          
          <div className="wallet-section">
            <div className="wallet-balance-display">
              <span>BALANCE LEFT:</span>
              <span className="wallet-amount" style={{ color: '#10B981' }}>{walletBalance}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleRechargeClick}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                background: '#4B5CFF',
                color: 'white',
                border: '2px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '0',
                boxShadow: 'none',
                filter: 'none',
                textShadow: 'none',
                boxSizing: 'border-box'
              }}
            >
              RECHARGE
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          
        </div>
        </div>

        {/* Recharge Modal */}
        {showRechargeModal && shop && (
          <RechargeModal shop={shop} onClose={() => setShowRechargeModal(false)} />
        )}
      </aside>
    );
  };

  export default Navbar;


