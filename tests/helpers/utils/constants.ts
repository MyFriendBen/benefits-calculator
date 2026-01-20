/**
 * Constants - Common constants used across tests
 *
 * This file contains URL patterns, timeouts, and other constants
 * used throughout the test suite.
 */

/**
 * URL patterns for different steps in the application
 */
export const URL_PATTERNS = {
  LANDING_PAGE: /step-1/,
  SELECT_STATE: /select-state/,
  DISCLAIMER: /step-2/,
  LOCATION_INFO: /step-3/,
  HOUSEHOLD_SIZE: /step-4/,
  HOUSEHOLD_MEMBER: /step-5/,
  EXPENSES: /step-6/,
  ASSETS: /step-7/,
  PUBLIC_BENEFITS: /step-8/,
  NEEDS: /step-9/,
  REFERRAL_SOURCE: /step-10/,
  ADDITIONAL_INFO: /step-11/,
  CONFIRM_INFORMATION: /confirm-information/,
  RESULTS: /results\/benefits/,
};

/**
 * White label identifiers - these identify the actual application instances
 */
export const WHITE_LABELS = {
  NC: 'nc',
  CO: 'co',
  MA: 'ma',
  CO_ENERGY_CALCULATOR: 'co_energy_calculator',
};

/**
 * Referrer identifiers - these identify referral sources, not white labels
 */
export const REFERRERS = {
  JEFFERSON_COUNTY: 'jeffco',
  COLORADO_211: '211co',
  NC_211: '211nc',
};

/**
 * Test timeouts
 */
export const TIMEOUTS = {
  SHORT: 5000, // 5 seconds
  MEDIUM: 15000, // 15 seconds
  LONG: 30000, // 30 seconds
};

/**
 * State options
 */
export const STATES = {
  NORTH_CAROLINA: 'North Carolina',
  COLORADO: 'Colorado',
};
