/**
 * Navigation - Navigation helper functions
 *
 * This file contains helpers for common navigation patterns used in tests,
 * such as clicking the continue button, navigating to specific pages, etc.
 */

import { Page, expect } from '@playwright/test';
import { BUTTONS } from './selectors';

/**
 * Clicks the continue button to proceed to the next step
 * @param page - Playwright page instance
 */
export async function clickContinue(page: Page): Promise<void> {
  const continueButton = page.getByRole(BUTTONS.CONTINUE.role, { name: BUTTONS.CONTINUE.name });

  // Ensure button is visible and enabled before clicking
  await continueButton.waitFor({ state: 'visible' });
  await continueButton.waitFor({ state: 'attached' });

  if (!(await continueButton.isEnabled())) {
    throw new Error('Continue button is not enabled');
  }

  await continueButton.click();
}

/**
 * Clicks the "Get Started" button on the landing page
 * @param page - Playwright page instance
 */
export async function clickGetStarted(page: Page): Promise<void> {
  await page.getByRole(BUTTONS.GET_STARTED.role, { name: BUTTONS.GET_STARTED.name }).click();
}

/**
 * Navigates to the homepage
 * @param page - Playwright page instance
 */
export async function navigateToHomePage(page: Page): Promise<void> {
  await page.goto('/');
}

/**
 * Verifies that the current URL matches the expected pattern
 * @param page - Playwright page instance
 * @param urlPattern - Regular expression or string pattern to match against URL
 * @param timeoutMs - Optional timeout in milliseconds (defaults to 15000ms)
 */
export async function verifyCurrentUrl(
  page: Page,
  urlPattern: RegExp | string,
  timeoutMs: number = 15000,
): Promise<void> {
  // Use a longer timeout than the default 5000ms to accommodate slower navigation in debug mode
  await expect(page).toHaveURL(urlPattern, { timeout: timeoutMs });
}

/**
 * Clicks the "Save My Results" button on the results page
 * @param page - Playwright page instance
 */
export async function saveResults(page: Page): Promise<void> {
  await page.getByRole(BUTTONS.SAVE_RESULTS.role, { name: BUTTONS.SAVE_RESULTS.name }).click();
}

/**
 * NC 211 specific navigation helpers
 */

/**
 * Navigates to the NC 211 workflow with referrer parameter
 * @param page - Playwright page instance
 * @param referrer - Referrer parameter (e.g., '211nc')
 */
export async function navigateToNC211Workflow(page: Page, referrer: string = '211nc'): Promise<void> {
  await page.goto(`/nc/step-1?referrer=${referrer}`);
}

/**
 * Verifies that the current URL contains the referrer parameter
 * @param page - Playwright page instance
 * @param referrer - Expected referrer parameter
 * @param timeoutMs - Optional timeout in milliseconds (defaults to 15000ms)
 */
export async function verifyReferrerUrl(page: Page, referrer: string, timeoutMs: number = 15000): Promise<void> {
  const urlPattern = new RegExp(`[?&]referrer=${referrer}`);
  await expect(page).toHaveURL(urlPattern, { timeout: timeoutMs });
}
