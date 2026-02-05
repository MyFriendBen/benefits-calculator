import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import dataLayerPush from '../Assets/analytics';

/**
 * Tracks page changes by pushing analytics events whenever the pathname changes.
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    dataLayerPush({
      event: 'Page Change',
      url: window.location.pathname + window.location.search,
    });
  }, [location.pathname]);
};
