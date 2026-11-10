import * as Sentry from '@sentry/react';

// Must be imported before everything else in index.tsx so errors during app startup are captured.
// Sentry stays disabled when REACT_APP_SENTRY_DSN is unset (local dev, tests, CI).
const dsn = process.env.REACT_APP_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.REACT_APP_SENTRY_RELEASE,
    integrations: [Sentry.browserTracingIntegration()],
    // MFB-220: start noisy, tune down once we know what the baseline looks like.
    tracesSampleRate: 1.0,
  });
}
