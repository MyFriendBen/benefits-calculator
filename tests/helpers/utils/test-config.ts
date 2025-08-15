/**
 * Test Configuration - Test-specific constants and configurations
 *
 * This file contains test-specific constants that are not part of the global
 * Playwright configuration. Global settings like default viewport, timeouts,
 * and base URL are configured in playwright.config.ts.
 */

/**
 * Viewport configurations for different test scenarios
 * Note: DESKTOP is the default in playwright.config.ts, included here for explicit test usage
 */
export const VIEWPORTS = {
  DESKTOP: { width: 1440, height: 900 },
  TABLET: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
} as const;

/**
 * Extended timeout configurations for specific test types
 * Note: Default timeout (60s) is configured in playwright.config.ts
 */
export const TEST_TIMEOUTS = {
  END_TO_END: 120000, // 2 minutes - for complete workflow tests (longer than default)
  FORM_INTERACTION: 30000, // 30 seconds - for complex form interactions
} as const;

/**
 * Test environment configuration
 */
export const TEST_ENV = {
  DEBUG_MODE: process.env.DEBUG === 'true',
} as const;
