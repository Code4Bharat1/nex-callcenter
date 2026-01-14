import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TutorialContext = createContext(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

const TUTORIAL_STORAGE_KEY = 'scalysis-tutorial-state';

const defaultSteps = [
  {
    id: 'navigate-playground',
    title: 'Create Your Agent',
    description: 'Click "Call Agents" in the sidebar to start creating your first AI agent.',
    selector: '.tour-nav-playground',
    action: 'navigate',
    navigationTarget: 'playground',
    expectedPath: '/playground',
  },
  {
    id: 'select-template',
    title: 'Choose a Template',
    description: "Click the first template 'Test Scalysis Intro (Laughter)' to use as the base for your agent's script.",
    selector: '.tutorial-first-template',
    action: 'click',
  },
  {
    id: 'save-agent',
    title: 'Save Your Agent',
    description: "Give your agent a name and click 'Save Agent' to create it.",
    selector: '.tutorial-save-agent',
    action: 'click',
  },
  {
    id: 'navigate-testcall',
    title: 'Test Your Agent',
    description: 'Click "Test Agent" in the sidebar to test your agent.',
    selector: '.tour-nav-testcall',
    action: 'navigate',
    navigationTarget: 'test-call',
    expectedPath: '/test-call',
  },
  {
    id: 'click-new-order-tab',
    title: 'Create Test Order',
    description: 'Click "New Order" tab. Then fill in customer name and phone, and click "Create Test Order".',
    selector: '.tutorial-new-order-tab',
    action: 'click',
  },
  {
    id: 'select-created-order',
    title: 'Select the Order',
    description: 'Click on the created test order to select it for the call.',
    selector: '.tutorial-test-order-item',
    action: 'click',
  },
  {
    id: 'make-call',
    title: 'Make Your First Call',
    description: 'Click the "Start Call" button to make a test call.',
    selector: '.tutorial-start-call',
    action: 'click',
  },
  {
    id: 'call-complete',
    title: 'Call Started!',
    description: "Your AI agent is now calling! You can listen to the conversation.",
    selector: null,
  },
];

export const TutorialProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // Load tutorial state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsCompleted(parsed.isCompleted || false);
        setCurrentStep(parsed.currentStep || 0);
      }
    } catch (error) {
      console.error('Error loading tutorial state:', error);
    }
  }, []);

  // Save tutorial state to localStorage
  const saveState = useCallback((step, active, completed) => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({
        currentStep: step,
        isActive: active,
        isCompleted: completed,
      }));
    } catch (error) {
      console.error('Error saving tutorial state:', error);
    }
  }, []);

  const startTutorial = useCallback(() => {
    console.log('[Tutorial] Starting tutorial');
    setCurrentStep(0);
    setIsActive(true);
    setShowCard(true);
    saveState(0, true, false);
  }, [saveState]);

  // Set global function for external components to call
  useEffect(() => {
    window.tutorialNextStep = () => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next < defaultSteps.length) {
          saveState(next, true, false);
          return next;
        }
        // Complete tutorial if at the end
        setIsActive(false);
        setShowCard(false);
        setIsCompleted(true);
        saveState(defaultSteps.length - 1, false, true);
        return prev;
      });
    };
    window.tutorialSkip = () => {
      setIsActive(false);
      setShowCard(false);
    };
    return () => {
      window.tutorialNextStep = undefined;
      window.tutorialSkip = undefined;
    };
  }, [saveState]);

  const nextStep = useCallback(() => {
    console.log('[Tutorial] Moving to next step');
    const next = currentStep + 1;
    if (next >= defaultSteps.length) {
      completeTutorial();
    } else {
      setCurrentStep(next);
      saveState(next, true, false);
    }
  }, [currentStep, saveState]);

  const prevStep = useCallback(() => {
    console.log('[Tutorial] Moving to previous step');
    const prev = Math.max(0, currentStep - 1);
    setCurrentStep(prev);
    saveState(prev, true, false);
  }, [currentStep, saveState]);

  const skipTutorial = useCallback(() => {
    console.log('[Tutorial] Skipping tutorial');
    setIsActive(false);
    setShowCard(false);
    saveState(currentStep, false, false);
  }, [currentStep, saveState]);

  const completeTutorial = useCallback(() => {
    console.log('[Tutorial] Completing tutorial');
    setIsActive(false);
    setShowCard(false);
    setIsCompleted(true);
    saveState(defaultSteps.length - 1, false, true);
  }, [saveState]);

  const resetTutorial = useCallback(() => {
    console.log('[Tutorial] Resetting tutorial');
    setCurrentStep(0);
    setIsActive(false);
    setShowCard(false);
    setIsCompleted(false);
    saveState(0, false, false);
  }, [saveState]);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < defaultSteps.length) {
      console.log('[Tutorial] Going to step:', stepIndex);
      setCurrentStep(stepIndex);
      saveState(stepIndex, true, false);
    }
  }, [saveState]);

  const value = {
    currentStep,
    totalSteps: defaultSteps.length,
    steps: defaultSteps,
    isActive,
    isCompleted,
    showCard,
    currentStepData: defaultSteps[currentStep] || defaultSteps[0],
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
    goToStep,
    setShowCard,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialContext;
