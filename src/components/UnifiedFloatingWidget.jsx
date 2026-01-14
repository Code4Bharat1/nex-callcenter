import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './UnifiedFloatingWidget.css';

const UnifiedFloatingWidget = ({ shop }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isRotated, setIsRotated] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(() => {
    const saved = localStorage.getItem('floatingWidgetVisible');
    return saved !== null ? saved === 'true' : false; // Disabled by default for all accounts
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const testButtonRef = useRef(null);
  const supportButtonRef = useRef(null);
  const dismissedPathRef = useRef(null);

  // Listen for widget visibility changes from Settings
  useEffect(() => {
    const handleVisibilityChange = () => {
      const saved = localStorage.getItem('floatingWidgetVisible');
      setWidgetEnabled(saved !== null ? saved === 'true' : true);
    };

    window.addEventListener('floatingWidgetVisibilityChanged', handleVisibilityChange);
    return () => window.removeEventListener('floatingWidgetVisibilityChanged', handleVisibilityChange);
  }, []);

  // Reset visibility when route changes
  useEffect(() => {
    // If the route changed and widget was dismissed on a different path, show it again
    if (dismissedPathRef.current && dismissedPathRef.current !== location.pathname) {
      setIsVisible(true);
      dismissedPathRef.current = null;
    }
  }, [location.pathname]);

  // Check if modals are open
  useEffect(() => {
    const checkModals = () => {
      const testModal = document.querySelector('.floating-test-call-modal');
      const supportModal = document.querySelector('.help-support-window-v2');
      const isTestModalOpen = testModal && window.getComputedStyle(testModal).display !== 'none';
      const isSupportModalOpen = supportModal && window.getComputedStyle(supportModal).display !== 'none';
      const modalOpen = isTestModalOpen || isSupportModalOpen;
      setIsModalOpen(modalOpen);
      
      // If modal is open, keep widget rotated and expanded
      if (modalOpen) {
        setIsRotated(true);
        setIsExpanded(true);
      } else if (!isExpanded) {
        // Only reset rotation if widget is not expanded
        setIsRotated(false);
      }
    };

    // Check immediately
    checkModals();

    // Set up interval to check modal state
    const interval = setInterval(checkModals, 100);

    // Also listen for DOM changes
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [isExpanded]);

  const handleDismiss = (e) => {
    e.stopPropagation();
    dismissedPathRef.current = location.pathname; // Remember which page it was dismissed on
    setIsVisible(false);
    setIsExpanded(false);
    setIsRotated(false);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsRotated(!isRotated);
  };

  const handleTestClick = () => {
    console.log('[UnifiedWidget] Test button clicked');
    // Don't collapse - keep expanded and rotated when modal opens
    // Small delay to let the animation finish before triggering
    setTimeout(() => {
      const testBtn = document.querySelector('.hidden-widget-buttons .floating-test-call-btn');
      console.log('[UnifiedWidget] Found test button:', testBtn);
      if (testBtn) {
        console.log('[UnifiedWidget] Clicking test button');
        testBtn.click();
      } else {
        console.error('[UnifiedWidget] Test button not found in DOM');
      }
    }, 100);
  };

  const handleSupportClick = () => {
    console.log('[UnifiedWidget] Support button clicked');
    // Don't collapse - keep expanded and rotated when modal opens
    // Small delay to let the animation finish before triggering
    setTimeout(() => {
      const supportBtn = document.querySelector('.hidden-widget-buttons .help-support-widget-btn');
      console.log('[UnifiedWidget] Found support button:', supportBtn);
      if (supportBtn) {
        console.log('[UnifiedWidget] Clicking support button');
        supportBtn.click();
      } else {
        console.error('[UnifiedWidget] Support button not found in DOM');
      }
    }, 100);
  };

  const handleCloseWidget = () => {
    // Close any open modals first
    const testModal = document.querySelector('.floating-test-call-modal');
    const supportModal = document.querySelector('.help-support-window-v2');
    
    if (testModal && window.getComputedStyle(testModal).display !== 'none') {
      const closeBtn = testModal.querySelector('button[aria-label="Close"], .close-btn, [class*="close"]');
      if (closeBtn) closeBtn.click();
    }
    
    if (supportModal && window.getComputedStyle(supportModal).display !== 'none') {
      const closeBtn = supportModal.querySelector('button[aria-label="Close"], .close-btn, [class*="close"]');
      if (closeBtn) {
        closeBtn.click();
      } else {
        // Try to find the help support widget button and click it to close
        const helpBtn = document.querySelector('.help-support-widget-btn');
        if (helpBtn) helpBtn.click();
      }
    }
    
    // Then collapse widget
    setIsExpanded(false);
    setIsRotated(false);
  };

  // Don't render if widget is disabled or not visible
  if (!widgetEnabled || !isVisible) {
    return null;
  }

  return (
    <div className="unified-floating-widget">
      {/* Test Button - appears when expanded - using original design */}
      <button
        ref={testButtonRef}
        className={`unified-widget-action-btn unified-widget-test-btn ${isExpanded ? 'unified-widget-btn-visible' : ''}`}
        onClick={handleTestClick}
        title="Test Call"
      >
        {/* Original Test Call Button Design - Sound Wave */}
        <div className="floating-test-call-sound-wave">
          <div className="floating-test-call-sound-bar"></div>
          <div className="floating-test-call-sound-bar"></div>
          <div className="floating-test-call-sound-bar"></div>
          <div className="floating-test-call-sound-bar"></div>
          <div className="floating-test-call-sound-bar"></div>
        </div>
      </button>

      {/* Support Button - appears when expanded - using original design */}
      <button
        ref={supportButtonRef}
        className={`unified-widget-action-btn unified-widget-support-btn ${isExpanded ? 'unified-widget-btn-visible' : ''}`}
        onClick={handleSupportClick}
        title="Help & Support"
      >
        {/* Original Support Button Design */}
        <img src="/images/Group.svg" alt="Help & Support" style={{ width: '24px', height: '24px' }} />
      </button>

      {/* Main Button */}
      <button
        className={`unified-widget-main-btn ${isRotated || isModalOpen ? 'rotated' : ''}`}
        onClick={handleToggleExpand}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={isExpanded || isModalOpen ? "Close Menu" : "Open Menu"}
      >
        <svg 
          className="unified-widget-plus-icon" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M12 5V19M5 12H19" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>

        {/* Close Button - appears when expanded or modal is open */}
        {(isExpanded || isModalOpen) && (
          <button
            className="unified-widget-close-btn"
            onClick={handleCloseWidget}
            title="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path 
                d="M9 3L3 9M3 3L9 9" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </button>
    </div>
  );
};

export default UnifiedFloatingWidget;

