/**
 * Standalone HTTPS redirect utility.
 * Runs at app initialization (before React) to ensure all redirects happen on HTTPS first.
 *
 * This is separated from the React hook version (useHttpsRedirect) to allow
 * early execution before the custom domain redirect, preventing double redirects.
 */

/**
 * Redirects to HTTPS if the current protocol is HTTP.
 * Uses sessionStorage to prevent redirect loops.
 * Skips redirect for localhost/127.0.0.1.
 */
export function handleHttpsRedirect(): void {
  const isLocal =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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
      const httpsUrl = window.location.href.replace('http://', 'https://');
      window.location.replace(httpsUrl);
    }
  }
}
