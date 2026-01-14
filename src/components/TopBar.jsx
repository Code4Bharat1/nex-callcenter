import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { api } from '../utils/api';
import NotificationSystem from './NotificationSystem';
import OnboardingNotification from './OnboardingNotification';
import './TopBar.css';

const TopBar = ({ pageTitle, shop }) => {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [connectedShop, setConnectedShop] = useState('');
  const [isCallOngoing, setIsCallOngoing] = useState(false);
  const [callTimeLeft, setCallTimeLeft] = useState('13 mins left');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isVoiceIconHovered, setIsVoiceIconHovered] = useState(false);
  const [shopPlan, setShopPlan] = useState('base'); // 'base' or 'premium'
  const [showPlanTooltip, setShowPlanTooltip] = useState(false);
  const [shopChannels, setShopChannels] = useState(0); // Channel count - fetched from database
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Page information mapping
  const pageInfo = {
    'Dashboard': {
      title: 'Dashboard',
      description: 'View analytics and key performance indicators.',
      buttonText: 'Learn More'
    },
    'CSV Upload': {
      title: 'CSV Upload',
      description: 'Upload customer data to create call campaigns.',
      buttonText: 'Learn More'
    },
    'Agents': {
      title: 'Create Scripts & Agents',
      description: 'Build agents that automate tasks and improve over time.',
      buttonText: 'Watch Tutorial'
    },
    'Scripts': {
      title: 'Call Scripts',
      description: 'Design and customize scripts for your AI agents.',
      buttonText: 'Learn More'
    },
    'Call History': {
      title: 'Call History',
      description: 'Review past call records and performance metrics.',
      buttonText: 'Learn More'
    },
    'Stats': {
      title: 'Statistics',
      description: 'Analyze insights from your call campaigns.',
      buttonText: 'Learn More'
    },
    'Usage': {
      title: 'Usage & Billing',
      description: 'Monitor account usage and subscription details.',
      buttonText: 'Learn More'
    },
    'Pricing': {
      title: 'Pricing Plans',
      description: 'View and manage your subscription plans.',
      buttonText: 'Learn More'
    },
    'Voices': {
      title: 'AI Voices',
      description: 'Browse and select voices for your agents.',
      buttonText: 'Learn More'
    },
    'Clone Voice': {
      title: 'Voice Cloning',
      description: 'Create custom voices by cloning samples.',
      buttonText: 'Learn More'
    },
    'Phone Numbers': {
      title: 'Phone Numbers',
      description: 'Manage phone numbers for your account.',
      buttonText: 'Learn More'
    },
    'Integrations': {
      title: 'Integrations',
      description: 'Connect and manage external service integrations.',
      buttonText: 'Learn More'
    },
    'Settings': {
      title: 'Settings',
      description: 'Configure account settings and preferences.',
      buttonText: 'Learn More'
    }
  };

  // Check for ongoing calls
  useEffect(() => {
    const checkOngoingCalls = async () => {
      if (!shop) {
        setIsCallOngoing(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/in-progress?shop=${encodeURIComponent(shop)}`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          setIsCallOngoing(data.hasInProgress || false);
        } else {
          setIsCallOngoing(false);
        }
      } catch (error) {
        console.error('Error checking ongoing calls:', error);
        setIsCallOngoing(false);
      }
    };

    checkOngoingCalls();
    // Check every 5 seconds for ongoing calls
    const interval = setInterval(checkOngoingCalls, 5000);
    
    return () => clearInterval(interval);
  }, [shop]);

  // Load user data and shop info
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await api.getUserProfile();
        if (profile.success && profile.data) {
          setUserEmail(profile.data.email || '');
          setUserName(profile.data.name || '');
          setUserAvatar(profile.data.avatar || '');
          // Get connected shop from shop prop or profile
          if (shop) {
            setConnectedShop(shop);
          } else if (profile.data.shop) {
            setConnectedShop(profile.data.shop);
          }
        }
        
        // Load shop plan and channels for badge
        if (shop) {
          try {
            const balanceData = await api.getShopBalance(shop);
            if (balanceData.success && balanceData.data) {
              if (balanceData.data.plan) {
                setShopPlan(balanceData.data.plan);
              }
              if (balanceData.data.channels !== undefined) {
                setShopChannels(balanceData.data.channels);
              }
            }
          } catch (err) {
            console.error('Error loading shop plan:', err);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [shop]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  const handleIntegrationsClick = () => {
    const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    navigate(`/integrations${shopParam}`);
    setShowUserDropdown(false);
  };

  const handleSettingsClick = () => {
    const shopParam = shop ? `?shop=${encodeURIComponent(shop)}` : '';
    navigate(`/settings${shopParam}`);
    setShowUserDropdown(false);
  };

  const buildUrl = (href) => {
    return shop ? `${href}?shop=${encodeURIComponent(shop)}` : href;
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        {/* Left Section */}
        <div className="topbar__left">
          <h1 className="topbar__page-title">{pageTitle || 'Dashboard'}</h1>
          <div 
            className="topbar__info-icon"
            onMouseEnter={() => setShowInfoTooltip(true)}
            onMouseLeave={() => setShowInfoTooltip(false)}
          >
            <img src="/images/Info.svg" alt="Info" width="20" height="20" />
            {showInfoTooltip && (
              <div className="topbar__tooltip topbar__tooltip--info">
                {(() => {
                  const info = pageInfo[pageTitle] || { title: 'Information', description: 'Information about this page', buttonText: 'Learn More' };
                  return (
                    <>
                      <h3 className="topbar__tooltip-title">{info.title}</h3>
                      <p className="topbar__tooltip-description">{info.description}</p>
                      <button className="topbar__tooltip-button">{info.buttonText}</button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="topbar__right">
          {/* Channels Display */}
          {shop && (
            <div
              className="topbar__channels"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '20px',
                fontWeight: 500,
                color: '#374151'
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <rect id="Rectangle_5" data-name="Rectangle 5" width="24" height="24" fill="none"/>
                <path
                  id="Shape"
                  d="M7.02,15.976,5.746,13.381a.7.7,0,0,0-.579-.407l-1.032-.056a.662.662,0,0,1-.579-.437,9.327,9.327,0,0,1,0-6.5.662.662,0,0,1,.579-.437l1.032-.109a.7.7,0,0,0,.589-.394L7.03,2.446l.331-.662a.708.708,0,0,0,.07-.308.692.692,0,0,0-.179-.467A3,3,0,0,0,4.693.017l-.235.03L4.336.063A1.556,1.556,0,0,0,4.17.089l-.162.04C1.857.679.165,4.207,0,8.585V9.83c.165,4.372,1.857,7.9,4,8.483l.162.04a1.556,1.556,0,0,0,.165.026l.122.017.235.03a3,3,0,0,0,2.558-.993.692.692,0,0,0,.179-.467.708.708,0,0,0-.07-.308Z"
                  transform="translate(4.393 6.587) rotate(-30)"
                  fill="none"
                  stroke="#000000"
                  strokeMiterlimit="10"
                  strokeWidth="1.5"
                />
              </svg>
              <span>×</span>
              <span>{shopChannels > 0 ? Math.max(1, Math.floor(shopChannels / 2)) : 0}</span>
            </div>
          )}

          {/* Plan Badge */}
          {shop && (
            <div
              className="topbar__plan-badge"
              onMouseEnter={() => setShowPlanTooltip(true)}
              onMouseLeave={() => setShowPlanTooltip(false)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: shopPlan === 'pro' ? '#F59E0B' : 
                                 shopPlan === 'pro-plus' || shopPlan === 'proplus' ? '#8B5CF6' :
                                 shopPlan === 'enterprise' ? '#6366F1' : '#10B981', // Different colors for different plans
                color: 'white',
                cursor: 'pointer',
                textTransform: 'none'
              }}
            >
              {shopPlan === 'base' ? 'Base Plan (₹2,800/mo)' :
               shopPlan === 'pro' ? 'Pro Plan (₹4,900/mo)' :
               shopPlan === 'pro-plus' || shopPlan === 'proplus' ? 'Pro Plus Plan (10 Channels)' :
               shopPlan === 'enterprise' ? 'Enterprise Plan (Custom)' :
               'Base Plan (₹2,800/mo)'}
              {showPlanTooltip && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: 0,
                  marginBottom: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#1F2937',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {shopPlan === 'base' ? 'Base Plan' :
                   shopPlan === 'pro' ? 'Pro Plan' :
                   shopPlan === 'pro-plus' || shopPlan === 'proplus' ? 'Pro Plus Plan' :
                   shopPlan === 'enterprise' ? 'Enterprise Plan' :
                   'Base Plan'}
                </div>
              )}
            </div>
          )}

          {/* Onboarding Notification */}
          <OnboardingNotification shop={shop} />

          {/* User Avatar (standalone) */}
          <img 
            src={userAvatar || '/images/1 Happy.svg'} 
            alt="User avatar" 
            className={`topbar__user-avatar-standalone ${
              userAvatar && !userAvatar.startsWith('/images/') 
                ? 'topbar__user-avatar-standalone--profile' 
                : 'topbar__user-avatar-standalone--memoji'
            }`}
            onError={(e) => {
              e.target.src = '/images/1 Happy.svg';
              e.target.className = 'topbar__user-avatar-standalone topbar__user-avatar-standalone--memoji';
            }}
          />

          {/* User Dropdown */}
          <div className="topbar__user-dropdown" ref={dropdownRef}>
            <button
              className="topbar__user-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              aria-label="User menu"
            >
              <span className="topbar__user-name">{userName || userEmail || 'User'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showUserDropdown && (
              <div className="topbar__dropdown-menu">
                <div className="topbar__dropdown-item topbar__dropdown-item--email">
                  {userEmail || 'No email'}
                </div>
                {connectedShop && (
                  <button
                    className="topbar__dropdown-item topbar__dropdown-item--clickable"
                    onClick={handleIntegrationsClick}
                  >
                    {connectedShop}
                  </button>
                )}
                <button
                  className="topbar__dropdown-item topbar__dropdown-item--clickable"
                  onClick={handleSettingsClick}
                >
                  Settings
                </button>
              </div>
            )}
          </div>

          {/* Logout Icon */}
          <button 
            className="topbar__icon-btn" 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <img src="/images/logout.svg" alt="Logout" width="20" height="20" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
