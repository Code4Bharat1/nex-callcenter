import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTutorial } from '../contexts/TutorialContext';
import TutorialCard from './TutorialCard';

const TutorialManager = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentStep,
    currentStepData,
    isActive,
    showCard,
    steps,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  const [cardPosition, setCardPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [highlightStyle, setHighlightStyle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const pollTimeoutRef = useRef(null);
  const currentStepRef = useRef(currentStep);

  // Keep track of which step we're on to detect changes
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Handle finish - navigate to onboarding
  const handleFinish = useCallback(() => {
    completeTutorial();
    const shop = new URLSearchParams(window.location.search).get('shop');
    navigate(`/onboarding${shop ? `?shop=${encodeURIComponent(shop)}` : ''}`);
  }, [completeTutorial, navigate]);

  // Calculate position near target element
  const updatePositions = useCallback(() => {
    // Exit if step changed while polling
    if (currentStepRef.current !== currentStep) return;

    if (!isActive || !currentStepData?.selector) {
      setCardPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setHighlightStyle(null);
      setIsLoading(false);
      return;
    }

    const selector = currentStepData.selector;
    const element = document.querySelector(selector);

    if (element) {
      setIsLoading(false);
      
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      
      if (rect.right + 420 < viewportWidth) {
        cardStyle = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)',
        };
      } else if (rect.bottom + 300 < viewportHeight) {
        cardStyle = {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      } else if (rect.top - 300 > 0) {
        cardStyle = {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      } else {
        cardStyle = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 420 - 20}px`,
          transform: 'translateY(-50%)',
        };
      }

      setCardPosition(cardStyle);

      setHighlightStyle({
        position: 'fixed',
        top: `${rect.top - 4}px`,
        left: `${rect.left - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
        border: '3px solid #4B5CFF',
        borderRadius: '8px',
        boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.4)',
        zIndex: 9998,
        pointerEvents: 'none',
        transition: 'all 0.3s ease',
      });

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    } else {
      // Element not found - don't clear highlight, just update loading state
      setIsLoading(true);
    }
  }, [currentStep, currentStepData, isActive]);

  // Poll for element to appear
  useEffect(() => {
    if (!isActive || !currentStepData?.selector) return;

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    // Don't clear highlight immediately - keep previous position while searching
    setIsLoading(true);

    updatePositions();

    let attempts = 0;
    const maxAttempts = 50;
    
    const poll = () => {
      if (currentStepRef.current !== currentStep) return;
      
      attempts++;
      updatePositions();
      
      if (attempts < maxAttempts) {
        pollTimeoutRef.current = setTimeout(poll, 200);
      } else {
        setIsLoading(false);
      }
    };

    pollTimeoutRef.current = setTimeout(poll, 200);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [currentStep, currentStepData, isActive, updatePositions]);

  // Detect route changes using useLocation
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    if (isActive && prevPath !== currentPath && currentStepData?.action === 'navigate') {
      if (currentStepData.expectedPath && currentPath.includes(currentStepData.expectedPath)) {
        setTimeout(() => {
          nextStep();
        }, 500);
      }
    }

    prevPathRef.current = currentPath;
  }, [location.pathname, isActive, currentStepData, nextStep, currentStep]);

  // Handle resize and scroll
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [isActive, updatePositions]);

  // Don't render anything if tutorial is not active
  if (!isActive) {
    return children;
  }

  // Get current description
  const getDescription = () => {
    if (isLoading && currentStep === 2) {
      return "Loading templates... Please wait.";
    }
    return currentStepData?.description || '';
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {children}

      {/* Highlight box - only show when not loading */}
      {highlightStyle && !isLoading && (
        <div style={highlightStyle} className="tutorial-highlight-box" />
      )}

      {/* Tutorial Card */}
      <div className="tutorial-card-container" style={cardPosition}>
        <TutorialCard
          title={currentStepData?.title || 'Welcome'}
          description={getDescription()}
          step={currentStep + 1}
          totalSteps={steps.length}
          onNext={handleFinish}
          onPrev={prevStep}
          onSkip={skipTutorial}
          isOpen={showCard}
          isLastStep={isLastStep}
        />
      </div>
    </>
  );
};

export default TutorialManager;
