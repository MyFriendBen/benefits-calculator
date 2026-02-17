import { ALL_VALID_WHITE_LABELS } from '../Types/WhiteLabel';
import customDomainsJson from './customDomains.json';

/**
 * Custom Domain Client-Side Redirect (FALLBACK ONLY)
 *
 * Primary redirect mechanism is Cloudflare Page Rules (configured in Cloudflare dashboard).
 * This code is a fallback for cases where Cloudflare redirect fails
 * (e.g., local development, Cloudflare misconfiguration).
 *
 * Maps external domains to white-label routes. Preserves path, query params, and hash.
 * Handles both www and non-www variants automatically.
 *
 * @see customDomains.json for domain configuration
 * @see PR #2052 for setup instructions (Cloudflare Page Rules, DNS, local testing)
 */

type CustomDomainConfig = {
  /** The white label identifier (must exist in ALL_VALID_WHITE_LABELS) */
  whiteLabel: string;
  /** The default path to append when visiting the root. Empty string redirects to the white label root (e.g., /cesn), which then uses WhiteLabelRouter's default path logic. */
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
    if (!(ALL_VALID_WHITE_LABELS as readonly string[]).includes(config.whiteLabel)) {
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
