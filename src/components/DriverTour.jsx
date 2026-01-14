import { useEffect, useState, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const driverObj = driver({
  showProgress: true,
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayColor: 'rgba(0, 0, 0, 0.75)',
  popoverClass: 'driverjs-popover-custom',
  gotItBtnClass: 'driver-btn-primary',
  closeBtnClass: 'driver-btn-close',
});

const DriverTour = ({ children }) => {
  const handleStartTour = useCallback((event) => {
    const { tourId, tourContent, tourPosition, selector } = event.detail;
    console.log('[DriverTour] Starting tour:', tourId, 'selector:', selector);

    if (!selector) {
      console.error('[DriverTour] No selector provided for tour:', tourId);
      return;
    }

    const element = document.querySelector(selector);
    if (!element) {
      console.error('[DriverTour] Element not found for selector:', selector);
      return;
    }

    driverObj.setSteps([
      {
        element: selector,
        popover: {
          title: tourId === 'part1-step1' ? 'Create Your First Agent' : 'Test Your Agent',
          description: tourContent,
          side: tourPosition || 'right',
          align: 'start',
        },
      },
    ]);

    driverObj.drive();
  }, []);

  useEffect(() => {
    console.log('[DriverTour] Setting up tour system');

    window.addEventListener('startSimpleTour', handleStartTour);

    return () => {
      window.removeEventListener('startSimpleTour', handleStartTour);
    };
  }, [handleStartTour]);

  return children;
};

export default DriverTour;
export { driverObj };
