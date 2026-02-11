import { ALL_VALID_WHITE_LABELS } from '../Types/WhiteLabel';
import customDomainsJson from './customDomains.json';

/**
 * Custom Domain Client-Side Redirect (FALLBACK ONLY)
 *
 * ⚠️ PRIMARY REDIRECT MECHANISM: Cloudflare Page Rules (configured in Cloudflare dashboard)
 * ⚠️ This code is a FALLBACK for cases where Cloudflare redirect fails
 *
 * Maps external domains to white-label routes. When a user visits a custom
 * domain, they should be redirected by Cloudflare at the edge. This client-side
 * redirect only runs if that fails (e.g., local development, Cloudflare misconfiguration).
 *
 * @example
 * User visits: https://energysavings.colorado.gov/
 * Cloudflare redirects (301): https://energysavings.colorado.gov/cesn
 * If Cloudflare fails: This code redirects client-side
 *
 * @example
 * User visits: https://energysavings.colorado.gov/some/deep/path?lang=es#section
 * Redirects to: https://energysavings.colorado.gov/cesn/some/deep/path?lang=es#section
 *
 * ## Adding a New Custom Domain
 *
 * 1. Add Cloudflare Page Rule (primary):
 *    - URL: `yourdomain.com/*`
 *    - Setting: Forwarding URL (301) → `https://yourdomain.com/your-white-label/$1`
 *
 * 2. Add fallback config to customDomains.json:
 *    - Add entry: `"yourdomain.com": { "whiteLabel": "your-white-label", "defaultPath": "" }`
 *    - Ensure whiteLabel exists in ALL_VALID_WHITE_LABELS (src/Types/WhiteLabel.ts)
 *    - Both www and non-www variants are handled automatically
 *
 * ## Testing Locally
 *
 * To test custom domains locally, modify your `/etc/hosts` file:
 * ```
 * 127.0.0.1  energysavings.colorado.gov
 * 127.0.0.1  www.energysavings.colorado.gov
 * ```
 * Then visit http://energysavings.colorado.gov:3000 in your browser.
 */

type CustomDomainConfig = {
  /** The white label identifier (must exist in ALL_VALID_WHITE_LABELS) */
  whiteLabel: string;
  /** The default path to append when visiting the root. Empty string means use WHITE_LABEL_DEFAULT_PATH. */
  defaultPath: string;
};

// Import configuration from shared JSON file
const CUSTOM_DOMAINS: Record<string, CustomDomainConfig> = customDomainsJson;

/**
 * Validates custom domain configuration at startup.
 * Logs errors if white labels are invalid but doesn't throw to avoid breaking the app.
 */
function validateCustomDomains(): void {
  Object.entries(CUSTOM_DOMAINS).forEach(([domain, config]) => {
    if (!ALL_VALID_WHITE_LABELS.includes(config.whiteLabel as any)) {
      console.error(
        `[customDomains] Invalid white label "${config.whiteLabel}" for domain "${domain}". ` +
          `Valid white labels: ${ALL_VALID_WHITE_LABELS.join(', ')}`
      );
    }
  });
}

/**
 * Normalizes hostname by removing 'www.' prefix to allow matching both variants.
 * This way we don't need to duplicate config for www/non-www.
 */
function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, '');
}

/**
 * FALLBACK: Handles custom domain redirects client-side.
 *
 * This should rarely run in production - Cloudflare Page Rules handle redirects at the edge.
 * This exists as a safety net for local development and edge cases.
 *
 * Runs at app initialization before React Router to avoid conflicts.
 * Automatically handles both www and non-www variants of configured domains.
 *
 * @example
 * If Cloudflare redirect fails:
 * https://energysavings.colorado.gov/some-path?lang=es
 * → https://energysavings.colorado.gov/cesn/some-path?lang=es
 */
export function handleCustomDomainRedirect(): void {
  const normalizedHostname = normalizeHostname(window.location.hostname);
  const config = CUSTOM_DOMAINS[normalizedHostname];

  if (!config) return;

  const path = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;
  const basePath = `/${config.whiteLabel}`;
  const isUnderWhiteLabel = path === basePath || path.startsWith(`${basePath}/`);

  if (!isUnderWhiteLabel) {
    const targetPath = path === '/' ? config.defaultPath : path;
    window.location.replace(`${basePath}${targetPath}${search}${hash}`);
  }
}

// Run validation when this module is loaded
if (process.env.NODE_ENV !== 'test') {
  validateCustomDomains();
}
