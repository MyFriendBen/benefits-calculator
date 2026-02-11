/**
 * Custom Domain Redirect Middleware
 *
 * Redirects custom domains (e.g., energysavings.colorado.gov) to white-label paths.
 * Configuration is shared with client-side via src/config/customDomains.json
 */

const customDomains = require('../../src/config/customDomains.json');

/**
 * Normalizes hostname by removing 'www.' prefix.
 * This allows matching both www and non-www variants without duplicating config.
 */
function normalizeHostname(hostname) {
  return hostname.replace(/^www\./, '');
}

function customDomainRedirect(req, res, next) {
  const hostname = normalizeHostname(req.hostname);
  const config = customDomains[hostname];

  if (!config) {
    // Not a custom domain, continue to next middleware
    return next();
  }

  const basePath = `/${config.whiteLabel}`;
  const isUnderWhiteLabel = req.path === basePath || req.path.startsWith(`${basePath}/`);

  if (!isUnderWhiteLabel) {
    // Build redirect URL with query params preserved
    const targetPath = req.path === '/' ? config.defaultPath : req.path;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const redirectUrl = `${basePath}${targetPath}${queryString}`;

    return res.redirect(301, redirectUrl);
  }

  next();
}

module.exports = customDomainRedirect;
