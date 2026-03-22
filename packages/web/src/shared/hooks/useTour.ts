import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_SHOWN_KEY = 'vansh_tour_shown';

const tourSteps = [
  {
    element: '[data-tour="tree-canvas"]',
    popover: {
      title: 'Your Family Tree',
      description: 'This is where your family tree is visualized. Click on any node to see details.',
    },
  },
  {
    element: '[data-tour="tree-controls"]',
    popover: {
      title: 'View Controls',
      description: 'Switch between radial, top-down, and left-right layouts. Zoom in and out.',
    },
  },
  {
    element: '[data-tour="add-person"]',
    popover: {
      title: 'Add Family Members',
      description: 'Click empty relationship slots to add parents, children, spouses, and siblings.',
    },
  },
  {
    element: '[data-tour="share-link"]',
    popover: {
      title: 'Share Your Tree',
      description: 'Share your tree link with family members so they can contribute.',
    },
  },
  {
    element: '#notification-bell',
    popover: {
      title: 'Stay Updated',
      description: 'Get notified when family members make changes, claim nodes, or propose merges.',
    },
  },
];

export function useTour() {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      steps: tourSteps,
      onDestroyed: () => {
        localStorage.setItem(TOUR_SHOWN_KEY, 'true');
      },
    });
    driverObj.drive();
  }, []);

  useEffect(() => {
    const handleCustomTour = () => startTour();
    window.addEventListener('vansh:start-tour', handleCustomTour);
    return () => window.removeEventListener('vansh:start-tour', handleCustomTour);
  }, [startTour]);

  const autoStartTour = useCallback(() => {
    const shown = localStorage.getItem(TOUR_SHOWN_KEY);
    if (!shown) {
      // Small delay to ensure DOM is ready
      setTimeout(startTour, 500);
    }
  }, [startTour]);

  return { startTour, autoStartTour };
}
