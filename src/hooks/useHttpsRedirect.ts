import { useEffect } from 'react';

/**
 * Redirects to HTTPS if the current protocol is HTTP.
 * Only runs once per session using sessionStorage guard.
 * Skips redirect for localhost/127.0.0.1.
 */
export const useHttpsRedirect = () => {
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasTriedRedirect = sessionStorage.getItem('https-redirect-attempted');

    if (window.location.protocol !== 'https:' && !isLocal && !hasTriedRedirect) {
      sessionStorage.setItem('https-redirect-attempted', 'true');
      window.location.protocol = 'https';
    }
  }, []);
};
