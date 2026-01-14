import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useTutorial } from '../contexts/TutorialContext';
import './Onboarding.css';

const Onboarding = ({ shop: shopProp }) => {
  const [searchParams] = useSearchParams();
  const shop = shopProp || searchParams.get('shop');
  const navigate = useNavigate();
  const { startTutorial, isCompleted: tutorialCompleted, resetTutorial } = useTutorial();

  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [googleSheetsEnabled, setGoogleSheetsEnabled] = useState(false);
  const [knowledgeBooks, setKnowledgeBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track completed steps for Part 2 (Full Onboarding)
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('onboarding-completed-steps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Part 1 (Quick Start) progress - based on tutorial completion
  const part1AllComplete = tutorialCompleted;
  const progressPercent = tutorialCompleted ? 100 : 0;

  useEffect(() => {
    if (shop) {
      checkIntegrationStatus();
    } else {
      setLoading(false);
    }
  }, [shop]);

  // Save completed steps to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('onboarding-completed-steps', JSON.stringify(completedSteps));
      window.dispatchEvent(new Event('onboardingStepsChanged'));
    } catch (error) {
      console.error('Error saving completed steps:', error);
    }
  }, [completedSteps]);

  // Listen for tour completion events
  useEffect(() => {
    const handleTourComplete = (e) => {
      const { tourId } = e.detail;
      console.log('[Onboarding] Tour completed:', tourId);
      // Force re-render to update checkboxes
      setCompletedSteps(prev => ({ ...prev }));
    };

    window.addEventListener('tourStepCompleted', handleTourComplete);
    return () => window.removeEventListener('tourStepCompleted', handleTourComplete);
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      setLoading(true);

      const shopifyResponse = await fetch('/api/integrations/status', {
        credentials: 'include'
      });
      const shopifyData = await shopifyResponse.json();
      setShopifyConnected(shopifyData.connected || false);

      const googleSheetsResponse = await fetch(`/api/google-sheets-settings?shop=${encodeURIComponent(shop)}`, {
        credentials: 'include'
      });
      const googleSheetsData = await googleSheetsResponse.json();
      if (googleSheetsData.success && googleSheetsData.settings) {
        setGoogleSheetsEnabled(googleSheetsData.settings.googleSheetsEnabled || false);
      }

      try {
        const knowledgeBooksResponse = await api.getKnowledgeBooks(shop);
        const books = knowledgeBooksResponse?.knowledgeBooks || knowledgeBooksResponse || [];
        setKnowledgeBooks(Array.isArray(books) ? books.filter(book => book && book.id) : []);
      } catch (error) {
        console.error('Error checking knowledge books:', error);
        setKnowledgeBooks([]);
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildUrl = (path) => {
    if (!shop) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}shop=${encodeURIComponent(shop)}`;
  };

  // Part 2 step helpers
  const step1AutoComplete = shopifyConnected || googleSheetsEnabled;
  const step1Complete = completedSteps.step1 || step1AutoComplete;

  const step2AutoComplete = knowledgeBooks && knowledgeBooks.length > 0;
  const step2Complete = completedSteps.step2 || step2AutoComplete;

  const step3Complete = completedSteps.step3 || false;
  const step4Complete = completedSteps.step4 || false;
  const step5Complete = completedSteps.step5 || false;
  const step6Complete = completedSteps.step6 || false;
  const step7Complete = completedSteps.step7 || false;

  const part2AllComplete = step1Complete && step2Complete && step3Complete && step4Complete && step5Complete && step6Complete && step7Complete;

  const totalPart2Steps = 7;
  const completedPart2Count = [step1Complete, step2Complete, step3Complete, step4Complete, step5Complete, step6Complete, step7Complete].filter(Boolean).length;
  const part2Progress = Math.round((completedPart2Count / totalPart2Steps) * 100);

  const toggleStepComplete = (stepNumber) => {
    setCompletedSteps(prev => ({
      ...prev,
      [`step${stepNumber}`]: !prev[`step${stepNumber}`]
    }));
  };

  const markAllPart2AsDone = () => {
    setCompletedSteps({
      step1: true,
      step2: true,
      step3: true,
      step4: true,
      step5: true,
      step6: true,
      step7: true
    });
  };

  const markAllPart2AsUndone = () => {
    setCompletedSteps({
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false,
      step6: false,
      step7: false
    });
  };

  const getStepStatus = (stepNumber) => {
    let isComplete = false;
    if (stepNumber === 1) {
      isComplete = completedSteps.step1 || step1AutoComplete;
    } else if (stepNumber === 2) {
      isComplete = completedSteps.step2 || step2AutoComplete;
    } else {
      isComplete = completedSteps[`step${stepNumber}`] || false;
    }

    let isActive = false;
    if (stepNumber === 1) {
      isActive = !isComplete;
    } else if (stepNumber === 2) {
      isActive = !isComplete && step1Complete;
    } else {
      const prevStepComplete = stepNumber === 3 ? step2Complete :
                               stepNumber === 4 ? step3Complete :
                               stepNumber === 5 ? step4Complete :
                               stepNumber === 6 ? step5Complete :
                               stepNumber === 7 ? step6Complete : false;
      isActive = !isComplete && prevStepComplete;
    }

    return { isComplete, isActive };
  };

  return (
    <div className="onboarding-page-container">
      {/* PART 1: Quick Start */}
      <div className="onboarding-part-section">
        <div className="onboarding-part-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 className="onboarding-part-title">
                <span className="part-badge part-badge-quick">Quick Start</span>
                Test Call Yourself
              </h2>
              <p className="onboarding-part-description">
                Create and test your first agent in under 5 minutes
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {part1AllComplete && (
                <button
                  onClick={() => {
                    resetTutorial();
                  }}
                  className="onboarding-mark-all-button"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="onboarding-progress-bar-container">
            <div className="onboarding-progress-bar">
              <div
                className="onboarding-progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #4B5CFF, #8B5CF6)'
                }}
              ></div>
            </div>
            <span className="onboarding-progress-text">
              {part1AllComplete ? 'Completed!' : 'Start to begin'}
            </span>
          </div>
        </div>

        <div className="onboarding-steps-container">
          {/* Part 1 Step 1: Create Script */}
          <div className={`onboarding-step-item ${tutorialCompleted ? 'completed-prev' : ''}`}>
            <div className="onboarding-step-indicator">
              {tutorialCompleted ? (
                <div className="step-icon step-icon-completed">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              ) : (
                <div className="step-icon step-icon-active">
                  <div className="step-icon-dot"></div>
                </div>
              )}
              <div className="step-connector"></div>
            </div>
            <div className="onboarding-step-content">
              <div className="onboarding-step-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div
                      className="onboarding-checkbox-wrapper"
                      onClick={() => !tutorialCompleted && startTutorial()}
                      style={{ cursor: tutorialCompleted ? 'default' : 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={tutorialCompleted}
                        readOnly
                        className="onboarding-checkbox"
                      />
                      <div className={`custom-checkbox ${tutorialCompleted ? 'checked' : ''}`}></div>
                      <span className={`step-number-wrapper step-number ${tutorialCompleted ? 'step-number-completed' : 'step-number-active'}`}>
                        Step 1
                      </span>
                    </div>
                  </div>
                  <h3 className="onboarding-step-title">Create Your First Agent</h3>
                  <p className="onboarding-step-description">
                    Create a script from templates and save your agent
                  </p>
                </div>
                {!tutorialCompleted ? (
                  <button
                    onClick={() => {
                      startTutorial();
                    }}
                    className="onboarding-step-button tour-start-step1"
                  >
                    Start Tour
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="step-complete-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Complete
                    </span>
                    <button
                      onClick={() => {
                        resetTutorial();
                      }}
                      className="onboarding-step-button"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
      </div>

      {/* DIVIDER */}
      <div className="onboarding-part-divider">
        <span>or continue with full setup</span>
      </div>

      {/* PART 2: Full Onboarding */}
      <div className="onboarding-part-section">
        <div className="onboarding-part-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 className="onboarding-part-title">
                <span className="part-badge part-badge-full">Full Setup</span>
                Complete Onboarding
              </h2>
              <p className="onboarding-part-description">
                Configure integrations, advanced settings, and production deployment
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {part2AllComplete && (
                <button onClick={markAllPart2AsUndone} className="onboarding-mark-all-button" style={{ backgroundColor: '#EF4444' }}>
                  Mark All as Undone
                </button>
              )}
              {!part2AllComplete && (
                <button onClick={markAllPart2AsDone} className="onboarding-mark-all-button">
                  Mark All as Done
                </button>
              )}
            </div>
          </div>
          <div className="onboarding-progress-bar-container">
            <div className="onboarding-progress-bar">
              <div className="onboarding-progress-fill" style={{ width: `${part2Progress}%` }}></div>
            </div>
            <span className="onboarding-progress-text">{part2Progress}% completed</span>
          </div>
        </div>

        <div className="onboarding-steps-container">
          {/* Step 1: Connect Data */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(1);
            return (
              <div className={`onboarding-step-item`}>
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                  <div className="step-connector"></div>
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className="onboarding-checkbox-wrapper"
                          onClick={() => toggleStepComplete(1)}
                        >
                          <input
                            type="checkbox"
                            checked={step1Complete}
                            onChange={() => toggleStepComplete(1)}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step1Complete ? 'checked' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 1
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Connect Your Data Source</h3>
                      <p className="onboarding-step-description">
                        Connect Shopify to import orders automatically, connect Google Sheets, or prepare a CSV file.
                      </p>
                    </div>
                    {!step1Complete && (
                      <a href={buildUrl('/tour-setup')} className="onboarding-step-button">
                        Start
                      </a>
                    )}
                  </div>
                  <div className="onboarding-step-details">
                    <div className="step-detail-row">
                      <img src="/images/Raycons Icons Pack (Community)/link-8535459.svg" alt="" width="14" height="14" />
                      <span className="step-detail-label">Inbound:</span>
                      <span className={`step-detail-status ${shopifyConnected ? 'status-connected' : 'status-disconnected'}`}>
                        {loading ? 'Checking...' : (shopifyConnected ? 'Connected' : 'Not Connected')}
                      </span>
                      {!shopifyConnected && (
                        <a href={buildUrl('/tour-setup')} className="step-detail-link">Connect →</a>
                      )}
                    </div>
                    <div className="step-detail-row">
                      <img src="/images/Raycons Icons Pack (Community)/grid-8535417.svg" alt="" width="14" height="14" />
                      <span className="step-detail-label">Outbound:</span>
                      <span className={`step-detail-status ${googleSheetsEnabled ? 'status-connected' : 'status-disconnected'}`}>
                        {loading ? 'Checking...' : (googleSheetsEnabled ? 'Connected' : 'Not Connected')}
                      </span>
                      {!googleSheetsEnabled && (
                        <a href={buildUrl('/settings?card=google-sheets')} className="step-detail-link">Connect →</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 2: Setup Brand Knowledge and QNAs */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(2);
            const isPreviousStep = step3Complete || step4Complete || step5Complete || step6Complete || step7Complete;
            return (
              <div className={`onboarding-step-item ${isPreviousStep ? 'completed-prev' : ''}`}>
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                  <div className="step-connector"></div>
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className={`onboarding-checkbox-wrapper ${!step1Complete ? 'disabled' : ''}`}
                          onClick={() => step1Complete && toggleStepComplete(2)}
                          style={{ cursor: step1Complete ? 'pointer' : 'not-allowed', opacity: step1Complete ? 1 : 0.5 }}
                        >
                          <input
                            type="checkbox"
                            checked={step2Complete}
                            onChange={() => toggleStepComplete(2)}
                            disabled={!step1Complete}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step2Complete ? 'checked' : ''} ${!step1Complete ? 'disabled' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 2
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Setup Brand Knowledge and QNAs</h3>
                      <p className="onboarding-step-description">
                        Create knowledge books to help your AI agent answer questions about your brand, products, and services.
                      </p>
                    </div>
                    {!step2Complete && (
                      <a href={buildUrl('/settings?card=knowledge-books')} className={`onboarding-step-button ${!step1Complete ? 'onboarding-step-button-disabled' : ''}`}>
                        Start
                      </a>
                    )}
                  </div>
                  <div className="onboarding-step-details">
                    <div className="step-detail-row">
                      <img src="/images/Raycons Icons Pack (Community)/book-8535533.svg" alt="" width="14" height="14" />
                      <span className="step-detail-label">Brand Knowledge:</span>
                      <span className={`step-detail-status ${knowledgeBooks && knowledgeBooks.length > 0 ? 'status-connected' : 'status-disconnected'}`}>
                        {loading ? 'Checking...' : (knowledgeBooks && knowledgeBooks.length > 0 ? `${knowledgeBooks.length} Book${knowledgeBooks.length !== 1 ? 's' : ''} Created` : 'Not Created')}
                      </span>
                      {(!knowledgeBooks || knowledgeBooks.length === 0) && (
                        <a href={buildUrl('/settings?card=knowledge-books')} className="step-detail-link">Create →</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 3: Create Script */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(3);
            const isPreviousStep = step4Complete || step5Complete || step6Complete || step7Complete;
            return (
              <div className={`onboarding-step-item ${isPreviousStep ? 'completed-prev' : ''}`}>
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                  <div className="step-connector"></div>
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className={`onboarding-checkbox-wrapper ${!step2Complete ? 'disabled' : ''}`}
                          onClick={() => step2Complete && toggleStepComplete(3)}
                          style={{ cursor: step2Complete ? 'pointer' : 'not-allowed', opacity: step2Complete ? 1 : 0.5 }}
                        >
                          <input
                            type="checkbox"
                            checked={step3Complete}
                            onChange={() => toggleStepComplete(3)}
                            disabled={!step2Complete}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step3Complete ? 'checked' : ''} ${!step2Complete ? 'disabled' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 3
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Create Your First Agent</h3>
                      <p className="onboarding-step-description">
                        Create a new agent from scratch or browse ready-made templates to get started quickly.
                      </p>
                    </div>
                    {!step3Complete && (
                      <a href={buildUrl('/playground')} className={`onboarding-step-button tour-goto-playground ${!step2Complete ? 'onboarding-step-button-disabled' : ''}`}>
                        Start
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 4: Test Script */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(4);
            const isPreviousStep = step5Complete || step6Complete || step7Complete;
            return (
              <div className={`onboarding-step-item ${isPreviousStep ? 'completed-prev' : ''}`}>
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                  <div className="step-connector"></div>
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className={`onboarding-checkbox-wrapper ${!step3Complete ? 'disabled' : ''}`}
                          onClick={() => step3Complete && toggleStepComplete(4)}
                          style={{ cursor: step3Complete ? 'pointer' : 'not-allowed', opacity: step3Complete ? 1 : 0.5 }}
                        >
                          <input
                            type="checkbox"
                            checked={step4Complete}
                            onChange={() => toggleStepComplete(4)}
                            disabled={!step3Complete}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step4Complete ? 'checked' : ''} ${!step3Complete ? 'disabled' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 4
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Test Your Agent</h3>
                      <p className="onboarding-step-description">
                        Test your agent by calling yourself. Make sure everything sounds good before starting real calls.
                      </p>
                    </div>
                    {!step4Complete && (
                      <a href={buildUrl('/test-call')} className={`onboarding-step-button ${!step3Complete ? 'onboarding-step-button-disabled' : ''}`}>
                        Start
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 5: Settings */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(5);
            const isPreviousStep = step6Complete || step7Complete;
            return (
              <div className={`onboarding-step-item ${isPreviousStep ? 'completed-prev' : ''}`}>
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                  <div className="step-connector"></div>
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className={`onboarding-checkbox-wrapper ${!step4Complete ? 'disabled' : ''}`}
                          onClick={() => step4Complete && toggleStepComplete(5)}
                          style={{ cursor: step4Complete ? 'pointer' : 'not-allowed', opacity: step4Complete ? 1 : 0.5 }}
                        >
                          <input
                            type="checkbox"
                            checked={step5Complete}
                            onChange={() => toggleStepComplete(5)}
                            disabled={!step4Complete}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step5Complete ? 'checked' : ''} ${!step4Complete ? 'disabled' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 5
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Set Calling Time Window</h3>
                      <p className="onboarding-step-description">
                        Configure when calls should be made, set time windows, and adjust other important settings.
                      </p>
                    </div>
                    {!step5Complete && (
                      <a href={buildUrl('/settings?card=retry')} className={`onboarding-step-button ${!step4Complete ? 'onboarding-step-button-disabled' : ''}`}>
                        Start
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Step 6: Start Calls */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(6);
            const isPreviousStep = step7Complete;
            return (
              <div className={`onboarding-step-item ${isPreviousStep ? 'completed-prev' : ''}`}>
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending-last'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                  <div className="step-connector"></div>
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className={`onboarding-checkbox-wrapper ${!step5Complete ? 'disabled' : ''}`}
                          onClick={() => step5Complete && toggleStepComplete(6)}
                          style={{ cursor: step5Complete ? 'pointer' : 'not-allowed', opacity: step5Complete ? 1 : 0.5 }}
                        >
                          <input
                            type="checkbox"
                            checked={step6Complete}
                            onChange={() => toggleStepComplete(6)}
                            disabled={!step5Complete}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step6Complete ? 'checked' : ''} ${!step5Complete ? 'disabled' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 6
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Start Making Calls</h3>
                      <p className="onboarding-step-description">
                        Choose how you want to start calling your customers.
                      </p>
                    </div>
                    {!step6Complete && (
                      <a href={buildUrl('/all-orders')} className={`onboarding-step-button ${!step5Complete ? 'onboarding-step-button-disabled' : ''}`}>
                        Start
                      </a>
                    )}
                  </div>
                  {!step6Complete && (
                    <div className="onboarding-step-details">
                      <div className="step-detail-row">
                        <img src="/images/Raycons Icons Pack (Community)/call-ringing-2198418.svg" alt="" width="14" height="14" />
                        <span className="step-detail-text">
                          <strong>From Integrations:</strong> Go to <a href={buildUrl('/all-orders')} className="step-detail-link">All Orders</a>, select orders, create campaign, then start calling
                        </span>
                      </div>
                      <div className="step-detail-row">
                        <img src="/images/Raycons Icons Pack (Community)/document-upload-8535504.svg" alt="" width="14" height="14" />
                        <span className="step-detail-text">
                          <strong>From CSV:</strong> Go to <a href={buildUrl('/campaigns')} className="step-detail-link">Campaigns</a> and click "Upload CSV"
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Step 7: Setup Call Type */}
          {(() => {
            const { isComplete, isActive } = getStepStatus(7);
            return (
              <div className="onboarding-step-item">
                <div className="onboarding-step-indicator">
                  {isComplete ? (
                    <div className="step-icon step-icon-completed">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className={`step-icon ${isActive ? 'step-icon-active' : 'step-icon-pending-last'}`}>
                      {isActive && <div className="step-icon-dot"></div>}
                    </div>
                  )}
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-header">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          className={`onboarding-checkbox-wrapper ${!step6Complete ? 'disabled' : ''}`}
                          onClick={() => step6Complete && toggleStepComplete(7)}
                          style={{ cursor: step6Complete ? 'pointer' : 'not-allowed', opacity: step6Complete ? 1 : 0.5 }}
                        >
                          <input
                            type="checkbox"
                            checked={step7Complete}
                            onChange={() => toggleStepComplete(7)}
                            disabled={!step6Complete}
                            className="onboarding-checkbox"
                          />
                          <div className={`custom-checkbox ${step7Complete ? 'checked' : ''} ${!step6Complete ? 'disabled' : ''}`}></div>
                          <span className={`step-number-wrapper step-number ${isComplete ? 'step-number-completed' : isActive ? 'step-number-active' : 'step-number-pending'}`}>
                            Step 7
                          </span>
                        </div>
                      </div>
                      <h3 className="onboarding-step-title">Setup Call Type</h3>
                      <p className="onboarding-step-description">
                        Configure type of call you are looking for
                      </p>
                    </div>
                    {!step7Complete && (
                      <a href={buildUrl('/settings?card=inbound')} className={`onboarding-step-button ${!step6Complete ? 'onboarding-step-button-disabled' : ''}`}>
                        Start
                      </a>
                    )}
                  </div>
                  <div className="onboarding-step-details">
                    <div className="step-detail-row">
                      <img src="/images/Raycons Icons Pack (Community)/call-ringing-2198418.svg" alt="" width="14" height="14" />
                      <span className="step-detail-label">Incoming:</span>
                      <a href={buildUrl('/settings?card=inbound')} className="step-detail-link">Setup →</a>
                    </div>
                    <div className="step-detail-row">
                      <img src="/images/Raycons Icons Pack (Community)/call-2198440.svg" alt="" width="14" height="14" />
                      <span className="step-detail-label">Auto Call New Orders:</span>
                      <a href={buildUrl('/settings?card=retry')} className="step-detail-link">Setup →</a>
                    </div>
                    <div className="step-detail-row">
                      <img src="/images/Raycons Icons Pack (Community)/document-upload-8535504.svg" alt="" width="14" height="14" />
                      <span className="step-detail-label">Call Campaigns:</span>
                      <a href={buildUrl('/campaigns')} className="step-detail-link">View →</a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Explore Section */}
      <div className="onboarding-explore-section">
        <h3 className="onboarding-explore-title">Explore More</h3>
        <div className="onboarding-explore-grid">
          <div className="onboarding-explore-card" onClick={() => navigate(buildUrl('/clone-voice'))}>
            <img src="/images/Raycons Icons Pack (Community)/call-2198440.svg" alt="" width="20" height="20" />
            <div>
              <div className="explore-card-title">Voice Cloning</div>
              <div className="explore-card-description">Create a custom AI voice</div>
            </div>
          </div>
          <div className="onboarding-explore-card" onClick={() => navigate(buildUrl('/test-call'))}>
            <img src="/images/Raycons Icons Pack (Community)/call-ringing-2198418.svg" alt="" width="20" height="20" />
            <div>
              <div className="explore-card-title">Test Call</div>
              <div className="explore-card-description">Test your scripts</div>
            </div>
          </div>
          <div className="onboarding-explore-card" onClick={() => navigate(buildUrl('/voices'))}>
            <img src="/images/Raycons Icons Pack (Community)/flag-8535273.svg" alt="" width="20" height="20" />
            <div>
              <div className="explore-card-title">Flagship Voices</div>
              <div className="explore-card-description">Browse premium voices</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
