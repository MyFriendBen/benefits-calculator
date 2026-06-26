import { useEffect } from 'react';

/**
 * Redirects to HTTPS if the current protocol is HTTP.
 * Uses sessionStorage to prevent redirect loops (set when successfully on HTTPS).
 * Skips redirect for localhost/127.0.0.1.
 *
 * Uses full URL replacement to preserve query params and hash.
 */
export const useHttpsRedirect = () => {
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (window.location.protocol === 'https:') {
      // We're on HTTPS - set the flag to prevent redirect loops
      try {
        sessionStorage.setItem('https-redirect-attempted', 'true');
      } catch (e) {
        // SessionStorage unavailable - continue anyway
      }
    } else if (!isLocal) {
      // We're on HTTP (and not localhost) - check if we should redirect
      let hasTriedRedirect = false;
      try {
        hasTriedRedirect = sessionStorage.getItem('https-redirect-attempted') === 'true';
      } catch (e) {
        // SessionStorage unavailable - proceed with redirect anyway
      }

      if (!hasTriedRedirect) {
        // Use full URL replacement to preserve query params and hash
        // Fallback to protocol setter if href is not available (e.g., in tests)
        if (window.location.href) {
          window.location.href = window.location.href.replace('http://', 'https://');
        } else {
          window.location.protocol = 'https:';
        }
      }
    }
  }, []);
};
