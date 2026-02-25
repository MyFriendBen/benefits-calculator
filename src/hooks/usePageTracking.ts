import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import dataLayerPush from '../Assets/analytics';
import { LEGACY_WHITE_LABEL_REDIRECTS } from '../Types/WhiteLabel';

/**
 * Tracks page changes by pushing analytics events whenever the pathname or search changes.
 * Skips legacy white label paths that will be immediately redirected, to avoid double-counting
 * the same user visit under both the old and new URL.
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const wl = location.pathname.split('/')[1];
    if (wl in LEGACY_WHITE_LABEL_REDIRECTS) return;
    dataLayerPush({
      event: 'Page Change',
      url: location.pathname + location.search,
    });
  }, [location.pathname, location.search]);
};
