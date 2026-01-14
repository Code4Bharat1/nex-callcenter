import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './OnboardingNotification.css';

const OnboardingNotification = ({ shop }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [googleSheetsEnabled, setGoogleSheetsEnabled] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentShop = shop || searchParams.get('shop');

  useEffect(() => {
    // Load completed steps from localStorage
    const loadCompletedSteps = () => {
      try {
        const saved = localStorage.getItem('onboarding-completed-steps');
        if (saved) {
          setCompletedSteps(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading completed steps:', error);
      }
    };

    loadCompletedSteps();

    // Listen for changes to completed steps
    const handleStorageChange = () => {
      loadCompletedSteps();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('onboardingStepsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('onboardingStepsChanged', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Check integration status
    const checkIntegrationStatus = async () => {
      if (!currentShop) return;
      
      try {
        const shopifyResponse = await fetch('/api/integrations/status', {
          credentials: 'include'
        });
        const shopifyData = await shopifyResponse.json();
        setShopifyConnected(shopifyData.connected || false);

        const googleSheetsResponse = await fetch(`/api/google-sheets-settings?shop=${encodeURIComponent(currentShop)}`, {
          credentials: 'include'
        });
        const googleSheetsData = await googleSheetsResponse.json();
        if (googleSheetsData.success && googleSheetsData.settings) {
          setGoogleSheetsEnabled(googleSheetsData.settings.googleSheetsEnabled || false);
        }
      } catch (error) {
        console.error('Error checking integration status:', error);
      }
    };

    checkIntegrationStatus();
  }, [currentShop]);

  const buttonRef = useRef(null);

  useEffect(() => {
    // Close popup when clicking outside (but not on the button itself)
    const handleClickOutside = (event) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup]);

  const buildUrl = (path) => {
    if (!currentShop) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}shop=${encodeURIComponent(currentShop)}`;
  };

  // Calculate step completion (same logic as Onboarding page)
  const step1AutoComplete = shopifyConnected || googleSheetsEnabled;
  const step1Complete = completedSteps.step1 || step1AutoComplete;
  const step2Complete = completedSteps.step2 || false;
  const step3Complete = completedSteps.step3 || false;
  const step4Complete = completedSteps.step4 || false;
  const step5Complete = completedSteps.step5 || false;

  const completedCount = [step1Complete, step2Complete, step3Complete, step4Complete, step5Complete].filter(Boolean).length;
  const allComplete = step1Complete && step2Complete && step3Complete && step4Complete && step5Complete;
  const pendingCount = 5 - completedCount;

  const steps = [
    { number: 1, title: 'Connect Your Data Source', complete: step1Complete },
    { number: 2, title: 'Create Your First Script', complete: step2Complete },
    { number: 3, title: 'Test Your Script', complete: step3Complete },
    { number: 4, title: 'Set Up Call Settings', complete: step4Complete },
    { number: 5, title: 'Start Making Calls', complete: step5Complete }
  ];

  const handleStepClick = (stepNumber) => {
    setShowPopup(false);
    navigate(buildUrl('/onboarding'));
  };

  if (allComplete) {
    return null; // Don't show notification if all steps are complete
  }

  return (
    <div className="onboarding-notification-wrapper">
      <button
        ref={buttonRef}
        className="onboarding-notification-button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPopup(!showPopup);
        }}
      >
        <img 
          src="/images/Raycons Icons Pack (Community)/book-8535533.svg" 
          alt="Onboarding" 
          width="20" 
          height="20" 
        />
        {pendingCount > 0 && (
          <span className="onboarding-notification-badge">{pendingCount}</span>
        )}
      </button>

      {showPopup && (
        <div className="onboarding-popup" ref={popupRef}>
          <div className="onboarding-popup-header">
            <div>
              <h3 className="onboarding-popup-title">Get Started</h3>
              <p className="onboarding-popup-progress">{completedCount} of 5 complete!</p>
            </div>
            <button
              className="onboarding-popup-close"
              onClick={() => setShowPopup(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="onboarding-popup-progress-bar">
            <div 
              className="onboarding-popup-progress-fill" 
              style={{ width: `${(completedCount / 5) * 100}%` }}
            ></div>
          </div>
          <div className="onboarding-popup-steps">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div
                  className={`onboarding-popup-step ${step.complete ? 'complete' : ''}`}
                  onClick={() => handleStepClick(step.number)}
                >
                  <div className="onboarding-popup-step-icon">
                    {step.complete ? (
                      <div className="step-icon-complete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    ) : (
                      <div className="step-icon-pending"></div>
                    )}
                  </div>
                  <span className="onboarding-popup-step-title">{step.title}</span>
                  <img 
                    src="/images/Raycons Icons Pack (Community)/arrow-right-8532512.svg" 
                    alt="" 
                    width="16" 
                    height="16" 
                    className="onboarding-popup-step-arrow"
                  />
                </div>
                {index < steps.length - 1 && <div className="onboarding-popup-divider"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingNotification;

