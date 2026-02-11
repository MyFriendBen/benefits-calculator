/**
 * Express Application Setup
 *
 * Configures Express middleware and serves the React application.
 */

const express = require('express');
const path = require('path');
const httpsRedirect = require('./middleware/httpsRedirect');
const customDomainRedirect = require('./middleware/customDomainRedirect');

const app = express();

// ============================================================================
// Middleware (order matters!)
// ============================================================================

// 1. HTTPS redirect (must run first to ensure all subsequent requests are HTTPS)
app.use(httpsRedirect);

// 2. Custom domain redirect (runs after HTTPS to avoid double redirects)
app.use(customDomainRedirect);

// 3. Serve static files from React build
app.use(express.static(path.join(__dirname, '..', 'build')));

// 4. Handle React routing - return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

module.exports = app;
