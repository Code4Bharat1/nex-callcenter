import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './ShopifyConnectionBanner.css';

const ShopifyConnectionBanner = ({ shop }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if banner was closed in current session
    // On page refresh, sessionStorage persists but we want to show it again
    // So we use a timestamp-based approach
    const closedTimestamp = sessionStorage.getItem('shopifyBannerClosedTimestamp');
    const pageLoadTime = performance.timeOrigin || Date.now();
    
    // Show banner if:
    // 1. It was never closed, OR
    // 2. The close timestamp is older than page load (meaning page was refreshed)
    const shouldDisplay = !closedTimestamp || 
      (closedTimestamp && parseInt(closedTimestamp) < pageLoadTime);
    
    if (shouldDisplay) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // Store timestamp when closed - on page refresh, pageLoadTime will be newer
    const closeTime = Date.now();
    sessionStorage.setItem('shopifyBannerClosedTimestamp', closeTime.toString());
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  // Don't render if banner shouldn't be visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`shopify-connection-banner ${isClosing ? 'banner-closing' : 'banner-visible'}`}>
      <div className="banner-content">
        <div className="banner-left">
          <span className="test-mode-badge">TEST MODE</span>
        </div>
        <div className="banner-center">
          <span className="banner-message">
            Your Shopify store is not connected. Connect your shopify store to start calling.
          </span>
        </div>
        <div className="banner-right">
          <a 
            href="/integrations" 
            className="complete-profile-link"
            tabIndex={0}
            aria-label="Complete profile to connect Shopify store"
          >
            Complete Profile
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="arrow-icon"
            >
              <path 
                d="M1 11L11 1M11 1H1M11 1V11" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
        <button
          className="banner-close-btn"
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClose();
            }
          }}
          aria-label="Close banner"
          tabIndex={0}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ShopifyConnectionBanner;

