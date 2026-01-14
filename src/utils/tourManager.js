export const TOUR_STORAGE_KEYS = {
  PART1_STEP1: 'tour-part1-step1-completed',
  PART1_STEP2: 'tour-part1-step2-completed',
  PART2_STEP1: 'tour-part2-step1-completed',
  PART2_STEP2: 'tour-part2-step2-completed',
  PART2_STEP3: 'tour-part2-step3-completed',
  PART2_STEP4: 'tour-part2-step4-completed',
  PART2_STEP5: 'tour-part2-step5-completed',
  PART2_STEP6: 'tour-part2-step6-completed',
  PART2_STEP7: 'tour-part2-step7-completed',
};

export const startSimpleTour = (tourId, content, position, selector) => {
  console.log('[SimpleTour] Starting simple tour:', tourId, 'selector:', selector);
  window.dispatchEvent(new CustomEvent('startSimpleTour', { detail: { tourId, content, position, selector } }));
};

export const handleHighlightElement = (selector) => {
  console.log('[SimpleTour] Highlighting element:', selector);
  window.dispatchEvent(new CustomEvent('highlightElement', { detail: { selector } }));
  window.dispatchEvent(new CustomEvent('clearHighlight'));
};

export const clearHighlight = () => {
  console.log('[SimpleTour] Clearing highlight');
  window.dispatchEvent(new CustomEvent('clearHighlight'));
};

export const startTour = (tourId) => {
  console.log('[TourManager] Starting tour:', tourId);
  window.dispatchEvent(new CustomEvent('startTour', { detail: { tourId } }));
};

export const completeTourStep = (tourId) => {
  console.log('[TourManager] Completing tour step:', tourId);
  const storageKey = TOUR_STORAGE_KEYS[tourId];
  if (storageKey) {
    localStorage.setItem(storageKey, 'true');
  }
  window.dispatchEvent(new CustomEvent('tourStepCompleted', { detail: { tourId } }));
};

export const resetTourStep = (tourId) => {
  console.log('[TourManager] Resetting tour step:', tourId);
  const storageKey = TOUR_STORAGE_KEYS[tourId];
  if (storageKey) {
    localStorage.removeItem(storageKey);
  }
  window.dispatchEvent(new CustomEvent('tourStepReset', { detail: { tourId } }));
};

export const isTourStepCompleted = (tourId) => {
  const storageKey = TOUR_STORAGE_KEYS[tourId];
  if (!storageKey) return false;
  return localStorage.getItem(storageKey) === 'true';
};

export const getAllTourProgress = () => {
  return {
    part1: {
      step1: isTourStepCompleted('PART1_STEP1'),
      step2: isTourStepCompleted('PART1_STEP2'),
    },
    part2: {
      step1: isTourStepCompleted('PART2_STEP1'),
      step2: isTourStepCompleted('PART2_STEP2'),
      step3: isTourStepCompleted('PART2_STEP3'),
      step4: isTourStepCompleted('PART2_STEP4'),
      step5: isTourStepCompleted('PART2_STEP5'),
      step6: isTourStepCompleted('PART2_STEP6'),
      step7: isTourStepCompleted('PART2_STEP7'),
    },
  };
};

export const resetAllTours = () => {
  Object.keys(TOUR_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(TOUR_STORAGE_KEYS[key]);
  });
  window.dispatchEvent(new CustomEvent('allToursReset'));
};

export const markStepComplete = (stepKey) => {
  const storageKey = TOUR_STORAGE_KEYS[stepKey];
  if (storageKey) {
    localStorage.setItem(storageKey, 'true');
    window.dispatchEvent(new CustomEvent('onboardingStepsChanged'));
  }
};
