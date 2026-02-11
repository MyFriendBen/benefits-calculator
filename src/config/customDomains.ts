import { ALL_VALID_WHITE_LABELS } from '../Types/WhiteLabel';
import customDomainsJson from './customDomains.json';

/**
 * Custom Domain Configuration
 *
 * Maps external domains to white-label routes. When a user visits a custom
 * domain, they are redirected to the corresponding white-label path.
 *
 * Configuration is shared between client and server via customDomains.json.
 * Server-side redirects (Express middleware) provide better SEO and performance.
 * Client-side redirects (this file) provide a fallback.
 *
 * @example
 * User visits: https://energysavings.colorado.gov/
 * Server redirects to: https://energysavings.colorado.gov/cesn/landing-page
 * (Or client-side redirect if server config fails)
 *
 * @example
 * User visits: https://energysavings.colorado.gov/some/deep/path?lang=es#section
 * Redirects to: https://energysavings.colorado.gov/cesn/some/deep/path?lang=es#section
 *
 * ## Adding a New Custom Domain
 *
 * 1. Add an entry to customDomains.json
 * 2. Ensure the whiteLabel exists in ALL_VALID_WHITE_LABELS (src/Types/WhiteLabel.ts)
 * 3. Both www and non-www variants are handled automatically
 * 4. Server-side redirect happens automatically (see server/middleware/customDomainRedirect.js)
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
 * Handles custom domain redirects to white-label routes.
 * Runs at app initialization before React Router to avoid conflicts.
 *
 * Automatically handles both www and non-www variants of configured domains.
 *
 * @example
 * Visiting https://energysavings.colorado.gov/some-path?lang=es
 * → Redirects to https://energysavings.colorado.gov/cesn/some-path?lang=es
 *
 * @example
 * Visiting https://www.energysavings.colorado.gov/some-path
 * → Also redirects to https://www.energysavings.colorado.gov/cesn/some-path
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
