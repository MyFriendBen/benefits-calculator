import { useEffect } from 'react';

/**
 * Redirects to HTTPS if the current protocol is HTTP.
 * Only runs once per session using sessionStorage guard.
 * Skips redirect for localhost/127.0.0.1.
 *
 * Uses full URL replacement to preserve query params and hash.
 */
export const useHttpsRedirect = () => {
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Try to access sessionStorage, but gracefully handle cases where it's unavailable
    // (e.g., private browsing, storage disabled, SecurityError)
    let hasTriedRedirect = false;
    try {
      hasTriedRedirect = sessionStorage.getItem('https-redirect-attempted') === 'true';
    } catch (e) {
      // SessionStorage unavailable - proceed without guard (will redirect on every load if needed)
    }

    if (window.location.protocol !== 'https:' && !isLocal && !hasTriedRedirect) {
      try {
        sessionStorage.setItem('https-redirect-attempted', 'true');
      } catch (e) {
        // SessionStorage unavailable - continue with redirect anyway
      }

      // Use full URL replacement to preserve query params and hash
      // Fallback to protocol setter if href is not available (e.g., in tests)
      if (window.location.href) {
        window.location.href = window.location.href.replace('http://', 'https://');
      } else {
        window.location.protocol = 'https:';
      }
    }
  }, []);
};
